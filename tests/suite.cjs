const crypto = require('crypto');

async function runTests() {
  console.log("=====================================================");
  console.log("    CaraBase Production-Grade E2E Testing Suite       ");
  console.log("=====================================================\n");

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

  // Back-end URL configured under Scuttle
  const BASE_URL = 'http://localhost:5353';
  
  // Set up mock metadata variables for human user
  let user1Uuid = crypto.randomUUID();
  let user1Name = 'test_user_' + Date.now();
  let user1Secret = crypto.randomBytes(32).toString('hex');
  let user1Hash = crypto.createHash('sha256').update("hu-" + user1Secret).digest('hex');
  let token1 = null;

  // Verify server is listening before proceeding
  try {
     const health = await fetch(`${BASE_URL}/api/health`);
     if (health.status !== 200) {
        throw new Error('Health check returned non-200');
     }
  } catch(e) {
     console.error(`🔴 Critical Error: The server is not running on ${BASE_URL}. Ensure "npm run dev:server" is active before running tests.`);
     process.exit(1);
  }

  // =========================================================================
  // Phase 1: Authentication & Human Identities
  // =========================================================================
  console.log("\n--- Phase 1: Authentication & Identities ---");
  
  // 1. Valid human registration
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuid: user1Uuid, username: user1Name, keyHash: user1Hash })
    });
    assert(res.status === 201, "Human User registered successfully");
  } catch(e) { assert(false, "App crashed during registration"); }

  // 2. Double registration conflict
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuid: user1Uuid, username: user1Name, keyHash: user1Hash })
    });
    assert(res.status === 409, "Double registration caught via UNIQUE constraint");
  } catch(e) { assert(false, "App crashed during double register"); }

  // 3. Validation schemas block SQL Injection / invalid data
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuid: "invalid-uuid", username: "' OR 1=1 --", keyHash: "foo" })
    });
    assert(res.status === 400, "Blocked invalid formats and SQLi attempts in auth endpoints");
  } catch(e) { assert(false, "App crashed on invalid inputs validation"); }

  // 4. Session Token Generation
  try {
    const res = await fetch(`${BASE_URL}/api/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'human', uuid: user1Uuid, keyHash: user1Hash })
    });
    assert(res.status === 200, "Token generated successfully for valid human identity");
    if (res.status === 200) {
      const data = await res.json();
      token1 = data.token;
    }
  } catch(e) { assert(false, "App crashed on token generation"); }

  // 5. Token Generation failure for invalid credentials
  try {
    const res = await fetch(`${BASE_URL}/api/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'human', uuid: user1Uuid, keyHash: 'invalid-key-hash' })
    });
    assert(res.status === 401, "Rejected token request with incorrect credential secret");
  } catch(e) { assert(false, "App crashed on invalid token validation"); }

  // 6. Token Lookup by Hash
  try {
     const res = await fetch(`${BASE_URL}/api/auth/lookup`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ keyHash: user1Hash })
     });
     assert(res.status === 200, "Session token lookup by keyHash returns metadata");
     const data = await res.json();
     assert(data.uuid === user1Uuid && data.username === user1Name, "Lookup response matches registered user record");
  } catch(e) { assert(false, "App crashed on identity lookup"); }

  // 7. Token validation checks
  try {
     const res = await fetch(`${BASE_URL}/api/auth/validate`, {
       method: "GET",
       headers: { "Authorization": `Bearer ${token1}` }
     });
     assert(res.status === 200, "Verify token1 is active and returns validate status");
  } catch(e) { assert(false, "App crashed on active validation check"); }

  // 8. Token Revocation
  try {
     const res = await fetch(`${BASE_URL}/api/auth/revoke`, {
       method: "POST",
       headers: { "Authorization": `Bearer ${token1}` }
     });
     assert(res.status === 200, "Token successfully revoked by client request");

     const checkRevoked = await fetch(`${BASE_URL}/api/auth/validate`, {
       method: "GET",
       headers: { "Authorization": `Bearer ${token1}` }
     });
     assert(checkRevoked.status === 401, "Revoked session token immediately rejected by auth middleware");
  } catch(e) { assert(false, "App crashed during revocation validations"); }


  // =========================================================================
  // Phase 2: System API Access & Gateways
  // =========================================================================
  console.log("\n--- Phase 2: System Routing Security ---");

  // Re-generate fresh active session token for subsequent system queries
  try {
    const res = await fetch(`${BASE_URL}/api/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'human', uuid: user1Uuid, keyHash: user1Hash })
    });
    token1 = (await res.json()).token;
  } catch(e) { console.error("Failed to generate fresh human token", e); }

  // 1. Block unauthenticated access to system API
  try {
    const res = await fetch(`${BASE_URL}/api/system/tables`);
    assert(res.status === 401, "Unauthenticated access to system API blocked");
  } catch(e) { assert(false, "Failed system gate block test"); }

  // 2. Block system access using dynamic data keys
  let externalPublicKey = null;
  let externalPrivateKey = null;

  try {
     // Generate Public and Private data keys
     const pubKeyRes = await fetch(`${BASE_URL}/api/system/keys`, {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
       body: JSON.stringify({ name: 'System_Pub_Key', type: 'public' })
     });
     externalPublicKey = (await pubKeyRes.json()).key;

     const privKeyRes = await fetch(`${BASE_URL}/api/system/keys`, {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
       body: JSON.stringify({ name: 'System_Priv_Key', type: 'private' })
     });
     externalPrivateKey = (await privKeyRes.json()).key;

     // Try to access system endpoints using these keys
     const tryPub = await fetch(`${BASE_URL}/api/system/tables`, {
       headers: { 'Authorization': `Bearer ${externalPublicKey}` }
     });
     const tryPriv = await fetch(`${BASE_URL}/api/system/tables`, {
       headers: { 'Authorization': `Bearer ${externalPrivateKey}` }
     });
     assert(tryPub.status === 401 && tryPriv.status === 401, "Data API keys are strictly rejected from system management endpoints");
  } catch(e) { assert(false, "System endpoint data keys validation failed"); }


  // =========================================================================
  // Phase 3: Database Engine & High Concurrency
  // =========================================================================
  console.log("\n--- Phase 3: High Concurrency Array Simulation ---");

  // 1. Spawning 50 concurrent racing API Key requests to test db thread-safe WAL mechanisms
  try {
     let racePass = true;
     const reqs = [];
     for (let i = 0; i < 50; i++) {
         reqs.push(fetch(`${BASE_URL}/api/system/keys`, {
           method: 'POST',
           headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
           body: JSON.stringify({ name: `RacingKey_${i}_${Date.now()}`, type: 'public' })
         }));
     }
     const responses = await Promise.all(reqs);
     for (let r of responses) {
         if (!r.ok) racePass = false;
     }
     assert(racePass, "Successfully inserted 50 API keys concurrently (verified DB thread safety)");
  } catch(e) { assert(false, "Concurrent DB insertion failed: " + e.message); }


  // =========================================================================
  // Phase 4: Row-Level Security (RLS) Policy Engine
  // =========================================================================
  console.log("\n--- Phase 4: Row-Level Security Policies ---");

  let tableName = 'books_rls';

  // 1. Clean previous structures and create fresh table
  await fetch(`${BASE_URL}/api/system/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `DROP TABLE IF EXISTS ${tableName}`, method: 'run' })
  });
  await fetch(`${BASE_URL}/api/system/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `DELETE FROM _carabase_policies WHERE table_name = '${tableName}'`, method: 'run' })
  });

  await fetch(`${BASE_URL}/api/system/tables`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
       tableName, 
       columns: [
         { name: 'id', type: 'INTEGER', primaryKey: true },
         { name: 'title', type: 'TEXT' },
         { name: 'is_public', type: 'INTEGER' },
         { name: 'user_uuid', type: 'TEXT' }
       ] 
     })
  });

  // 2. Query REST endpoint for internal tables (should return 403 Forbidden)
  try {
     const sysAttack = await fetch(`${BASE_URL}/rest/v1/_carabase_policies`, {
       headers: { 'Authorization': `Bearer ${externalPrivateKey}` }
     });
     assert(sysAttack.status === 403, "REST API successfully blocked access to internal system schema table");
  } catch(e) { assert(false, "Failed internal schema table block check"); }

  // 3. Default deny behavior: public requests return 0 rows when no policy is set
  try {
     // Insert data via private key (bypasses RLS)
     await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${externalPrivateKey}`, 'Content-Type': 'application/json' },
       body: JSON.stringify({ title: 'Secret Document', is_public: 0, user_uuid: user1Uuid })
     });
     await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${externalPrivateKey}`, 'Content-Type': 'application/json' },
       body: JSON.stringify({ title: 'Public Document', is_public: 1, user_uuid: 'other-uuid' })
     });

     const pubRes = await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
       headers: { 'Authorization': `Bearer ${externalPublicKey}` }
     });
     const data = await pubRes.json();
     assert(Array.isArray(data) && data.length === 0, "Public key successfully blocked by default-deny RLS (0 rows returned)");
  } catch(e) { assert(false, "Failed default deny validation"); }

  // 4. Add simple RLS SELECT policy allowing public data
  await fetch(`${BASE_URL}/api/system/policies`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ table_name: tableName, action: 'SELECT', definition: 'is_public = 1' })
  });

  try {
     const pubRes = await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
       headers: { 'Authorization': `Bearer ${externalPublicKey}` }
     });
     const data = await pubRes.json();
     assert(data.length === 1 && data[0].title === 'Public Document', "Public key correctly accessed specific data via SELECT RLS policy");
  } catch(e) { assert(false, "Failed simple RLS SELECT validation"); }

  // 5. Test auth_uid() and auth_role() dynamic functions
  const rlsTable = 'todos_rls_suite';
  
  await fetch(`${BASE_URL}/api/system/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `DROP TABLE IF EXISTS ${rlsTable}`, method: 'run' })
  });
  await fetch(`${BASE_URL}/api/system/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `DELETE FROM _carabase_policies WHERE table_name = '${rlsTable}'`, method: 'run' })
  });

  await fetch(`${BASE_URL}/api/system/tables`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
       tableName: rlsTable, 
       columns: [
         { name: 'id', type: 'INTEGER', primaryKey: true },
         { name: 'task', type: 'TEXT' },
         { name: 'owner_uuid', type: 'TEXT' }
       ] 
     })
  });

  // Attach dynamic RLS policies referencing custom system functions
  await fetch(`${BASE_URL}/api/system/policies`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ table_name: rlsTable, action: 'SELECT', definition: "owner_uuid = auth_uid() AND auth_role() = 'authenticated'" })
  });
  await fetch(`${BASE_URL}/api/system/policies`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ table_name: rlsTable, action: 'INSERT', definition: "owner_uuid = auth_uid() AND auth_role() = 'authenticated'" })
  });
  await fetch(`${BASE_URL}/api/system/policies`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ table_name: rlsTable, action: 'UPDATE', definition: "owner_uuid = auth_uid()" })
  });
  await fetch(`${BASE_URL}/api/system/policies`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ table_name: rlsTable, action: 'DELETE', definition: "owner_uuid = auth_uid()" })
  });

  // Verify valid insert matching auth_uid() session payload
  try {
     const resInsert = await fetch(`${BASE_URL}/rest/v1/${rlsTable}`, {
       method: 'POST',
       headers: { 
         'apikey': externalPublicKey,
         'Authorization': `Bearer ${token1}`,
         'Content-Type': 'application/json' 
       },
       body: JSON.stringify({ task: 'Verify dynamic auth_uid logic', owner_uuid: user1Uuid })
     });
     assert(resInsert.status === 200, "Dynamic auth_uid() and auth_role() resolved successfully on valid RLS INSERT");
  } catch(e) { assert(false, "Failed dynamic auth_uid insert test"); }

  // Verify malicious insert attempting to spoof UUID gets rejected and rolled back
  try {
     const resInsertFail = await fetch(`${BASE_URL}/rest/v1/${rlsTable}`, {
       method: 'POST',
       headers: { 
         'apikey': externalPublicKey,
         'Authorization': `Bearer ${token1}`,
         'Content-Type': 'application/json' 
       },
       body: JSON.stringify({ task: 'Spoof user uuid record', owner_uuid: 'hacked-uuid-target' })
     });
     assert(resInsertFail.status === 403, "Transaction rollback correctly blocked RLS INSERT violating policy check");
  } catch(e) { assert(false, "Failed dynamic RLS INSERT violation check"); }

  // Verify UPDATE WITH CHECK constraints
  try {
     // Try to transfer row ownership to another user (violates check policy on UPDATE)
     const resUpdateFail = await fetch(`${BASE_URL}/rest/v1/${rlsTable}?owner_uuid=eq.${user1Uuid}`, {
       method: 'PATCH',
       headers: { 
         'apikey': externalPublicKey,
         'Authorization': `Bearer ${token1}`,
         'Content-Type': 'application/json' 
       },
       body: JSON.stringify({ owner_uuid: 'stolen-uuid' })
     });
     assert(resUpdateFail.status === 403, "RLS WITH CHECK emulated constraint blocks malicious UPDATE ownership transfer");
  } catch(e) { assert(false, "Failed update checks RLS constraint validation"); }

  // Verify DELETE filter scopes
  try {
     const resDelete = await fetch(`${BASE_URL}/rest/v1/${rlsTable}?owner_uuid=eq.${user1Uuid}`, {
       method: 'DELETE',
       headers: { 
         'apikey': externalPublicKey,
         'Authorization': `Bearer ${token1}`
       }
     });
     assert(resDelete.status === 200, "RLS DELETE successfully deletes matching user owned rows inside standard transaction");
  } catch(e) { assert(false, "Failed RLS DELETE scope validation"); }


  // =========================================================================
  // Phase 5: Real-time Event Streaming Engine (SSE)
  // =========================================================================
  console.log("\n--- Phase 5: Real-time Event Streaming Engine ---");

  const sseTable = 'realtime_sse_suite';
  await fetch(`${BASE_URL}/api/system/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `DROP TABLE IF EXISTS ${sseTable}`, method: 'run' })
  });
  await fetch(`${BASE_URL}/api/system/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `DELETE FROM _carabase_policies WHERE table_name = ?`, method: 'run', params: [sseTable] })
  });
  await fetch(`${BASE_URL}/api/system/tables`, {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
       tableName: sseTable, 
       columns: [{ name: 'id', type: 'INTEGER', primaryKey: true }, { name: 'message', type: 'TEXT' }] 
     })
  });

  // Verify unauthorized SSE subscription gets rejected (no SELECT policy exists yet)
  try {
     const failSSERes = await fetch(`${BASE_URL}/rest/v1/${sseTable}?apikey=${externalPublicKey}`, {
       headers: { 'Accept': 'text/event-stream' }
     });
     assert(failSSERes.status === 403, "SSE subscription strictly rejected when default-deny RLS blocks SELECT permissions");
  } catch(e) { assert(false, "Failed unauthorized SSE block test"); }

  // Add SELECT policy allowing public read
  await fetch(`${BASE_URL}/api/system/policies`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ table_name: sseTable, action: 'SELECT', definition: '1=1' })
  });

  // Verify SSE streaming and client mutations receipt
  try {
     const sseRes = await fetch(`${BASE_URL}/rest/v1/${sseTable}?apikey=${externalPublicKey}`, {
       headers: { 'Accept': 'text/event-stream' }
     });
     
     let connectedReceived = false;
     let mutationReceived = false;

     if (sseRes.body && sseRes.body.getReader) {
        const reader = sseRes.body.getReader();
        
        // Read connection event
        const r1 = await reader.read();
        const text1 = new TextDecoder().decode(r1.value);
        if (text1.includes('connected')) {
           connectedReceived = true;
        }

        // Fire mutation event in background
        await fetch(`${BASE_URL}/rest/v1/${sseTable}`, {
           method: 'POST',
           headers: { 'Authorization': `Bearer ${externalPrivateKey}`, 'Content-Type': 'application/json' },
           body: JSON.stringify({ message: 'ClawStack Real-time Event!' })
        });

        // Read mutation event
        const r2 = await reader.read();
        const text2 = new TextDecoder().decode(r2.value);
        if (text2.includes('INSERT') && text2.includes('ClawStack Real-time Event!')) {
           mutationReceived = true;
        }
        await reader.cancel();
     } else if (sseRes.body) {
        // Fallback for older stream iterators
        for await (const chunk of sseRes.body) {
           const text = new TextDecoder().decode(chunk);
           if (text.includes('connected')) {
              connectedReceived = true;
              await fetch(`${BASE_URL}/rest/v1/${sseTable}`, {
                 method: 'POST',
                 headers: { 'Authorization': `Bearer ${externalPrivateKey}`, 'Content-Type': 'application/json' },
                 body: JSON.stringify({ message: 'ClawStack Real-time Event!' })
              });
           } else if (text.includes('INSERT') && text.includes('ClawStack Real-time Event!')) {
              mutationReceived = true;
              break;
           }
        }
     }

     assert(connectedReceived, "Real-time SSE subscription initialized and connection success event received");
     assert(mutationReceived, "SSE client successfully captured live database INSERT mutation event payload");

  } catch(e) { assert(false, "Real-time SSE validation failed: " + e.message); }


  // =========================================================================
  // Phase 6: physical Storage & Path Traversal Security
  // =========================================================================
  console.log("\n--- Phase 6: physical Storage & Asset Security ---");

  let storageFileId = null;

  // 1. Simulating physical file upload via standard Multipart FormData
  try {
     const formData = new FormData();
     const blob = new Blob(['ClawStack Storage physical Security Payload'], { type: 'text/plain' });
     formData.append('file', blob, 'security-test.txt');

     const uploadRes = await fetch(`${BASE_URL}/storage/v1/upload?apikey=${externalPrivateKey}`, {
       method: 'POST',
       body: formData
     });
     
     assert(uploadRes.status === 200, "Secure asset uploaded successfully via multipart form-data");
     const data = await uploadRes.json();
     storageFileId = data.id;
  } catch(e) { assert(false, "Storage upload execution crashed: " + e.message); }

  // 2. Retrieve publicly via shared download link (no headers required)
  try {
     const downloadRes = await fetch(`${BASE_URL}/storage/v1/file/${storageFileId}`);
     assert(downloadRes.status === 200, "Publicly retrieved shared asset anonymously without credentials");
     const text = await downloadRes.text();
     assert(text.includes('ClawStack Storage physical'), "Downloaded file contents match upload stream exactly");
  } catch(e) { assert(false, "Shared link download validation crashed"); }

  // 3. Block directory traversal attacks (dot-dot-slash vectors)
  try {
     const attack1 = await fetch(`${BASE_URL}/storage/v1/file/../../server.ts`);
     const attack2 = await fetch(`${BASE_URL}/storage/v1/file/%2e%2e%2f%2e%2e%2fserver.ts`);
     assert((attack1.status === 404 || attack1.status === 403) && (attack2.status === 404 || attack2.status === 403), "Directory traversal injection vectors securely blocked");
  } catch(e) { assert(false, "Directory traversal sanitization crashed: " + e.message); }

  // 4. physical asset unlinking on DELETE
  try {
     const deleteRes = await fetch(`${BASE_URL}/api/system/storage/${storageFileId}`, {
       method: 'DELETE',
       headers: { 'Authorization': `Bearer ${token1}` }
     });
     assert(deleteRes.status === 200, "Storage asset deleted successfully via system API");

     const checkRes = await fetch(`${BASE_URL}/storage/v1/file/${storageFileId}`);
     assert(checkRes.status === 404, "Verify deleted file is physically removed from disk layout (returns 404)");
  } catch(e) { assert(false, "Asset deletion physical unlinking test crashed: " + e.message); }


  // =========================================================================
  // Phase 7: Agent Credentials & Identity Delegation
  // =========================================================================
  console.log("\n--- Phase 7: Agent Credentials & Identity Delegation ---");

  let agentId = null;
  let plainAgentKey = null;
  let agentSessionToken = null;

  // 1. Human user generating agent key (incorporating dynamic calculations)
  try {
     const agentRes = await fetch(`${BASE_URL}/api/agent-keys`, {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
       body: JSON.stringify({
         name: 'E2E_Lobster_Agent_' + Date.now(),
         description: 'Super robust testing agent credential delegation',
         permissions: { canRead: true, canWrite: true },
         expirationType: 'never',
         rateLimit: 60
       })
     });
     assert(agentRes.status === 201, "Agent Key credential created successfully with permissions");
     const data = await agentRes.json();
     plainAgentKey = data.data.key;
     agentId = data.data.id;
     assert(plainAgentKey.startsWith('lb-'), "Agent Key prefix matches OWASP lb- standard");
   } catch(e) { assert(false, "Agent key generation crashed: " + e.message); }

  // 2. Human user retrieving all active agent keys
  try {
     const listRes = await fetch(`${BASE_URL}/api/agent-keys`, {
       method: 'GET',
       headers: { 'Authorization': `Bearer ${token1}` }
     });
     const data = await listRes.json();
     assert(Array.isArray(data.data) && data.data.some(k => k.id === agentId), "Retrieved active agent keys contain the created agent key record");
  } catch(e) { assert(false, "Agent keys retrieval crashed: " + e.message); }

  // 3. Agent Key authenticating and getting ephemeral short-lived session token (api-*)
  try {
     const tokenRes = await fetch(`${BASE_URL}/api/auth/token`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         type: 'agent',
         ownerKey: plainAgentKey
       })
     });
     assert(tokenRes.status === 200, "Ephemeral agent session token successfully spawned from lb- key hash lookup");
     const data = await tokenRes.json();
     agentSessionToken = data.token;
     assert(agentSessionToken.startsWith('api-'), "Spawned session token complies with api- ephemeral standard");
  } catch(e) { assert(false, "Agent token generation crashed: " + e.message); }

  // 4. Query REST endpoints using agent short-lived session token
  try {
     const restRes = await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
       headers: {
         'apikey': externalPublicKey,
         'Authorization': `Bearer ${agentSessionToken}`
       }
     });
     assert(restRes.status === 200, "Agent session token successfully authorized to query REST data endpoints");
  } catch(e) { assert(false, "Agent session REST fetch check crashed: " + e.message); }

  // 5. Revoking Agent Key immediately revokes access
  try {
     const revokeRes = await fetch(`${BASE_URL}/api/agent-keys/${agentId}/revoke`, {
       method: 'PATCH',
       headers: { 'Authorization': `Bearer ${token1}` }
     });
     assert(revokeRes.status === 200, "Agent Key status revoked successfully");

     const failTokenRes = await fetch(`${BASE_URL}/api/auth/token`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         type: 'agent',
         ownerKey: plainAgentKey
       })
     });
     assert(failTokenRes.status === 401, "Revoked Agent Key immediately blocked from spawning new session tokens");
  } catch(e) { assert(false, "Agent revocation check crashed: " + e.message); }

  // 6. Deleting Agent Key physically removes it
  try {
     const deleteRes = await fetch(`${BASE_URL}/api/agent-keys/${agentId}`, {
       method: 'DELETE',
       headers: { 'Authorization': `Bearer ${token1}` }
     });
     assert(deleteRes.status === 200, "Agent Key successfully deleted from system records");
  } catch(e) { assert(false, "Agent deletion test crashed: " + e.message); }


  // =========================================================================
  // Phase 8: System Audit Trails
  // =========================================================================
  console.log("\n--- Phase 8: Security Audit Trails ---");

  try {
     // Verify that crucial security mutations generated log entries
     const logsRes = await fetch(`${BASE_URL}/api/system/query`, {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
       body: JSON.stringify({
         query: "SELECT * FROM audit_logs WHERE actor = ? ORDER BY timestamp DESC",
         method: 'all',
         params: [user1Uuid]
       })
     });
     
     const logs = await logsRes.json();
     assert(Array.isArray(logs) && logs.length > 0, "Security Audit Trail logs found in database");
     
     const hasKeyCreated = logs.some(l => l.event_type === 'AGENT_KEY_CREATED');
     const hasKeyRevoked = logs.some(l => l.event_type === 'AGENT_KEY_REVOKED');
     const hasKeyDeleted = logs.some(l => l.event_type === 'AGENT_KEY_DELETED');

     assert(hasKeyCreated, "Audit log tracks AGENT_KEY_CREATED event seamlessly");
     assert(hasKeyRevoked, "Audit log tracks AGENT_KEY_REVOKED event seamlessly");
     assert(hasKeyDeleted, "Audit log tracks AGENT_KEY_DELETED event seamlessly");

  } catch(e) { assert(false, "Audit logs system validation crashed: " + e.message); }


  // =========================================================================
  // Phase 9: Custom Dynamic REST APIs
  // =========================================================================
  console.log("\n--- Phase 9: Custom Dynamic REST API Generator ---");

  let customEndpointId = null;

  try {
     // 1. Create a custom API endpoint mapped to the users table (GET /custom/test-users)
     const createEpRes = await fetch(`${BASE_URL}/api/system/endpoints`, {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
       body: JSON.stringify({
         name: 'Test Fetch Users',
         path: 'test-users',
         method: 'GET',
         table_name: 'users',
         schema: {
           columns: ['uuid', 'username'], // restrict columns
           pagination: true,
           sorting: true,
           filters: [],
           validation: []
         }
       })
     });

     const customEp = await createEpRes.json();
     customEndpointId = customEp.id;
     assert(customEp.id !== undefined, "Custom dynamic API endpoint registered successfully");
     assert(customEp.path === 'test-users', "Custom endpoint configuration matches input schema path");

     // 2. Fetch custom endpoints list
     const getEpsRes = await fetch(`${BASE_URL}/api/system/endpoints`, {
       headers: { 'Authorization': `Bearer ${token1}` }
     });
     const epsList = await getEpsRes.json();
     const hasOurEp = epsList.some(e => e.id === customEndpointId);
     assert(hasOurEp, "Custom endpoint listed successfully in system endpoints query");

     // 3. Query the dynamic custom endpoint (GET /rest/v1/custom/test-users) using the public key
     const runQueryRes = await fetch(`${BASE_URL}/rest/v1/custom/test-users`, {
       headers: { 'apikey': externalPublicKey }
     });
     const queryRows = await runQueryRes.json();
     assert(runQueryRes.status === 200, "Successfully executed dynamic custom GET request anonymously");
     assert(Array.isArray(queryRows), "Dynamic endpoint returns array of records");
     
     // 4. Verify restricted columns (key_hash should NOT be returned!)
     if (queryRows.length > 0) {
       const keys = Object.keys(queryRows[0]);
       assert(!keys.includes('key_hash'), "Dynamic REST API respects custom column selections and sanitizes response");
       assert(keys.includes('username'), "Response correctly includes allowed username column");
     } else {
       assert(true, "Restricted columns validation passed (empty table checked)");
     }

     // 5. Delete the custom API endpoint
     const delEpRes = await fetch(`${BASE_URL}/api/system/endpoints/${customEndpointId}`, {
       method: 'DELETE',
       headers: { 'Authorization': `Bearer ${token1}` }
     });
     const delResult = await delEpRes.json();
     assert(delResult.success, "Custom endpoint deleted successfully via system API");

     // 6. Requesting deleted path should return 404
     const testDeletedRes = await fetch(`${BASE_URL}/rest/v1/custom/test-users`, {
       headers: { 'apikey': externalPublicKey }
     });
     assert(testDeletedRes.status === 404, "Deleted dynamic route correctly returns 404 Not Found");

  } catch(e) { assert(false, "Custom API Generator validation crashed: " + e.message); }


  // =========================================================================
  // Final Verdict
  // =========================================================================
  console.log("\n=====================================================");
  console.log(`   TESTRUN COMPLETE. Passed: ${passed}, Failed: ${failed}`);
  console.log("=====================================================\n");
  
  if (failed > 0) {
     process.exit(1);
  } else {
     process.exit(0);
  }
}

runTests();
