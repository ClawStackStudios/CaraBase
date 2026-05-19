const crypto = require('crypto');

async function runTests() {
  console.log("=========================================");
  console.log("   CaraBase E2E & Load Testing Suite     ");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Under Scuttle, Vite front-end runs on 5454 and Express back-end runs on 5353.
  const BASE_URL = 'http://localhost:5353';
  let user1Uuid = crypto.randomUUID();
  let user1Name = 'test_user_' + Date.now();
  let user1Secret = crypto.randomBytes(32).toString('hex');
  let user1Hash = crypto.createHash('sha256').update("hu-" + user1Secret).digest('hex');
  let token1 = null;

  // 1. Test Single User Registration & Anti-Injection
  console.log("\n--- Phase 1: Authentication & Identities ---");
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuid: user1Uuid, username: user1Name, keyHash: user1Hash })
    });
    assert(res.status === 201, "User registered successfully");
  } catch(e) { assert(false, "App crashed during register"); }

  // 2. Test Double Registration (Conflict)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuid: user1Uuid, username: user1Name, keyHash: user1Hash })
    });
    assert(res.status === 409, "Double registration caught via UNIQUE constraint");
  } catch(e) { assert(false, "App crashed during double register"); }

  // 3. Invalid inputs targeting DB
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuid: "invalid-uuid", username: "' OR 1=1 --", keyHash: "foo" })
    });
    assert(res.status === 400, "Blocked invalid formats and SQLi attempts in auth endpoints");
  } catch(e) { assert(false, "App crashed on invalid inputs"); }

  // 4. Token Generation
  try {
    const res = await fetch(`${BASE_URL}/api/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'human', uuid: user1Uuid, keyHash: user1Hash })
    });
    if (res.status !== 200) {
      console.log('TOKEN FAIL', res.status, await res.text());
    }
    assert(res.status === 200, "Token generated for valid ClawKey hash");
    if(res.status === 200) {
      const data = await res.json();
      token1 = data.token;
    }
  } catch(e) { assert(false, "App crashed on token generation"); }

  // 5. System Route Security
  console.log("\n--- Phase 2: System Routing Security ---");
  try {
    const sysRes = await fetch(`${BASE_URL}/api/system/tables`, {
      method: 'GET',
    });
    assert(sysRes.status === 401, "Unauthenticated access to system API blocked");
    
    if (token1) {
      const authRes = await fetch(`${BASE_URL}/api/system/tables`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token1}` }
      });
      assert(authRes.status === 200, "Authenticated access to system API granted");
    }
  } catch(e) { assert(false, "System API security check failed"); }

  // 6. Test Concurrent Racing Requests (Race Condition Simulation)
  console.log("\n--- Phase 3: High Concurrency Array Simulation ---");
  let externalPublicKey = null;
  let externalPrivateKey = null;

  try {
    let racePass = true;
    const reqs = [];
    for (let i = 0; i < 50; i++) {
        reqs.push(fetch(`${BASE_URL}/api/system/keys`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `Key_${i}`, type: 'public' })
        }));
    }
    const responses = await Promise.all(reqs);
    
    // Get the keys back for the next phase
    for (let r of responses) {
        if (!r.ok) {
           racePass = false;
        } else {
           const json = await r.json();
           externalPublicKey = json.key;
        }
    }
    assert(racePass, "Successfully inserted 50 API keys concurrently (testing DB locks/WAL)");

    // generate a private key
    const privReq = await fetch(`${BASE_URL}/api/system/keys`, {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
       body: JSON.stringify({ name: `Private_Key`, type: 'private' })
    });
    externalPrivateKey = (await privReq.json()).key;

  } catch(e) { assert(false, "Concurrent DB insertion failed: " + e.message); }

  console.log("\n--- Phase 4: External API & RLS Anti-Patterns ---");

  // Cleanup from previous runs
  await fetch(`${BASE_URL}/api/system/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'DROP TABLE IF EXISTS test_rls_table', method: 'run' })
  });
  await fetch(`${BASE_URL}/api/system/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: "DELETE FROM _carabase_policies WHERE table_name = 'test_rls_table'", method: 'run' })
  });
  
  // Create a test table via system API
  let tableName = 'test_rls_table';
  await fetch(`${BASE_URL}/api/system/tables`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
       tableName, 
       columns: [
         { name: 'id', type: 'INTEGER', primaryKey: true },
         { name: 'data', type: 'TEXT' },
         { name: 'is_public', type: 'INTEGER' }
       ] 
     })
  });

  // Query System Tables to ensure cannot query them from REST API
  try {
     const sysAttack = await fetch(`${BASE_URL}/rest/v1/users`, {
       headers: { 'Authorization': `Bearer ${externalPrivateKey}` }
     });
     assert(sysAttack.status === 400 || sysAttack.status === 403, "REST API successfully blocked access to internal system tables");
  } catch(e) { assert(false, "Failed internal table check"); }

  // Insert data via private key (should bypass RLS)
  try {
     const insertRes = await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${externalPrivateKey}`, 'Content-Type': 'application/json' },
       body: JSON.stringify({ data: 'secret data', is_public: 0 })
     });
     if (insertRes.status !== 200) console.log('RLS INSERT FAILED', insertRes.status, await insertRes.text());
     assert(insertRes.status === 200, "Private key successfully bypassed RLS to insert data");

     await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${externalPrivateKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: 'public data', is_public: 1 })
     });
  } catch(e) { assert(false, "Failed data injection for RLS testing"); }

  // Query via public key (RLS restricted -> should return nothing since no policy exists)
  try {
     const pubRes = await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
       method: 'GET',
       headers: { 'Authorization': `Bearer ${externalPublicKey}` }
     });
     const data = await pubRes.json();
     if (!Array.isArray(data) || data.length !== 0) console.log("RLS DEFAULT DATA:", data);
     assert(Array.isArray(data) && data.length === 0, "Public key successfully blocked by default-deny RLS");
  } catch(e) { assert(false, "Failed RLS default block"); }

  // Add RLS policy for public data
  await fetch(`${BASE_URL}/api/system/policies`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ table_name: tableName, action: 'SELECT', definition: 'is_public = 1' })
  });

  // Query via public key again
  try {
     const pubRes2 = await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
       method: 'GET',
       headers: { 'Authorization': `Bearer ${externalPublicKey}` }
     });
     const data2 = await pubRes2.json();
     if (!Array.isArray(data2) || data2.length !== 1 || data2[0].data !== 'public data') console.log("RLS PERMIT DATA:", data2);
     assert(Array.isArray(data2) && data2.length === 1 && data2[0].data === 'public data', "Public key correctly accessed specific data via RLS policy");
  } catch(e) { assert(false, "Failed RLS specific permit"); }


  console.log("\n--- Phase 5: SQLite Transaction RLS Engine & Multi-Layer Auth ---");
  const todoTable = 'todos_rls';

  // 1. Clean and Create a Todo table
  await fetch(`${BASE_URL}/api/system/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `DROP TABLE IF EXISTS ${todoTable}`, method: 'run' })
  });
  await fetch(`${BASE_URL}/api/system/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `DELETE FROM _carabase_policies WHERE table_name = '${todoTable}'`, method: 'run' })
  });

  await fetch(`${BASE_URL}/api/system/tables`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
       tableName: todoTable, 
       columns: [
         { name: 'id', type: 'INTEGER', primaryKey: true },
         { name: 'task', type: 'TEXT' },
         { name: 'user_id', type: 'TEXT' }
       ] 
     })
  });

  // 2. Add Row-level policies emulating PostgreSQL auth_uid()
  await fetch(`${BASE_URL}/api/system/policies`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ table_name: todoTable, action: 'SELECT', definition: 'user_id = auth_uid()' })
  });
  await fetch(`${BASE_URL}/api/system/policies`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ table_name: todoTable, action: 'INSERT', definition: 'user_id = auth_uid()' })
  });
  await fetch(`${BASE_URL}/api/system/policies`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ table_name: todoTable, action: 'UPDATE', definition: 'user_id = auth_uid()' })
  });
  await fetch(`${BASE_URL}/api/system/policies`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ table_name: todoTable, action: 'DELETE', definition: 'user_id = auth_uid()' })
  });

  // 3. Test multi-layer authentication header payload
  try {
     // Valid insertion (matching auth_uid)
     const resInsertOk = await fetch(`${BASE_URL}/rest/v1/${todoTable}`, {
       method: 'POST',
       headers: { 
         'apikey': externalPublicKey,
         'Authorization': `Bearer ${token1}`,
         'Content-Type': 'application/json' 
       },
       body: JSON.stringify({ task: 'Finish ClawStack RLS', user_id: user1Uuid })
     });
     assert(resInsertOk.status === 200, "Multi-layer auth resolves auth_uid() to permit correct user INSERT");

     // Invalid insertion (violates auth_uid policy)
     const resInsertFail = await fetch(`${BASE_URL}/rest/v1/${todoTable}`, {
       method: 'POST',
       headers: { 
         'apikey': externalPublicKey,
         'Authorization': `Bearer ${token1}`,
         'Content-Type': 'application/json' 
       },
       body: JSON.stringify({ task: 'Steal another user session', user_id: 'malicious-uuid' })
     });
     assert(resInsertFail.status === 403, "Transaction rollback correctly rejects malicious RLS INSERT");
  } catch(e) { assert(false, "App crashed during insert validation: " + e.message); }

  // 4. Test RLS updates & UPDATE policy checks
  try {
     // Valid Update (matching eq. filtering)
     const resUpdateOk = await fetch(`${BASE_URL}/rest/v1/${todoTable}?user_id=eq.${user1Uuid}`, {
       method: 'PATCH',
       headers: { 
         'apikey': externalPublicKey,
         'Authorization': `Bearer ${token1}`,
         'Content-Type': 'application/json' 
       },
       body: JSON.stringify({ task: 'Updated ClawStack RLS Task' })
     });
     if (resUpdateOk.status !== 200) {
       console.log('resUpdateOk failed with status:', resUpdateOk.status, await resUpdateOk.text());
     }
     assert(resUpdateOk.status === 200, "RLS UPDATE successfully matches query and modifies owned rows");

     // Invalid Update: trying to transfer the row to another user (violates check policy)
     const resUpdateFail = await fetch(`${BASE_URL}/rest/v1/${todoTable}?user_id=eq.${user1Uuid}`, {
       method: 'PATCH',
       headers: { 
         'apikey': externalPublicKey,
         'Authorization': `Bearer ${token1}`,
         'Content-Type': 'application/json' 
       },
       body: JSON.stringify({ user_id: 'hacked-id' })
     });
     assert(resUpdateFail.status === 403, "RLS WITH CHECK emulated constraint blocks malicious UPDATE column transfer");
  } catch(e) { assert(false, "App crashed during update validation: " + e.message); }

  // 5. Test RLS deletes
  try {
     const resDeleteOk = await fetch(`${BASE_URL}/rest/v1/${todoTable}?user_id=eq.${user1Uuid}`, {
       method: 'DELETE',
       headers: { 
         'apikey': externalPublicKey,
         'Authorization': `Bearer ${token1}`
       }
     });
     assert(resDeleteOk.status === 200, "RLS DELETE successfully deletes owned rows inside a transaction");
  } catch(e) { assert(false, "App crashed during delete validation: " + e.message); }


  console.log("\n--- Phase 6: Public Storage File Downloads ---");
  try {
     // Clean up any existing dummy row first to ensure test idempotence
     await fetch(`${BASE_URL}/api/system/query`, {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
       body: JSON.stringify({ 
         query: "DELETE FROM _carabase_storage WHERE filename = 'dummy-disk.txt'", 
         method: 'run'
       })
     });

     // Create a dummy file row in _carabase_storage using system API query
     const dummyId = crypto.randomUUID();
     await fetch(`${BASE_URL}/api/system/query`, {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
       body: JSON.stringify({ 
         query: "INSERT INTO _carabase_storage (id, original_name, filename, mime_type, size) VALUES (?, 'public-shared.txt', 'dummy-disk.txt', 'text/plain', 42)", 
         method: 'run',
         params: [dummyId]
       })
     });

     // Write mock file to disk
     const storageDir = require('path').join(process.cwd(), 'data', 'storage');
     if (!require('fs').existsSync(storageDir)) {
       require('fs').mkdirSync(storageDir, { recursive: true });
     }
     require('fs').writeFileSync(require('path').join(storageDir, 'dummy-disk.txt'), 'Hello ClawStack Shared Public File Content!');

     // Fetch publicly without headers!
     const publicFileRes = await fetch(`${BASE_URL}/storage/v1/file/${dummyId}`);
     if (publicFileRes.status !== 200) {
       console.log('publicFileRes failed with status:', publicFileRes.status, await publicFileRes.text());
     }
     assert(publicFileRes.status === 200, "Publicly retrieved shared file with no authentication headers required");
     const content = await publicFileRes.text();
     assert(content.includes('Hello ClawStack'), "Successfully loaded content from anonymous shared link");
     
  } catch(e) { assert(false, "Public storage test failed: " + e.message); }


  console.log("\n=========================================");
  console.log(`   TESTRUN COMPLETE. Passed: ${passed}, Failed: ${failed}`);
  console.log("=========================================\n");
}

runTests();
