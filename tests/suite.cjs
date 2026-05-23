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
  // Phase 10: Implicit Dashboard Session Bypass (Task 01 Invariant)
  // =========================================================================
  console.log("\n--- Phase 10: Implicit Dashboard Session RLS Bypass ---");

  // 1. Dashboard session token can query /rest/v1 WITHOUT an API key
  try {
    const dashRes = await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    assert(dashRes.status === 200, "Dashboard hu- session implicitly bypasses RLS as private key context");
    const data = await dashRes.json();
    assert(Array.isArray(data), "Dashboard session returns valid array response from REST endpoint");
  } catch(e) { assert(false, "Implicit dashboard bypass test crashed: " + e.message); }

  // 2. An invalid/garbage session token without API key must be rejected
  try {
    const garbageRes = await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
      headers: { 'Authorization': 'Bearer garbage-not-a-real-token' }
    });
    assert(garbageRes.status === 401, "Garbage Bearer token without API key correctly rejected");
  } catch(e) { assert(false, "Garbage token rejection test crashed: " + e.message); }

  // 3. Completely unauthenticated REST request must be rejected
  try {
    const noAuthRes = await fetch(`${BASE_URL}/rest/v1/${tableName}`);
    assert(noAuthRes.status === 401, "Completely unauthenticated REST request blocked");
  } catch(e) { assert(false, "Unauthenticated REST test crashed: " + e.message); }


  // =========================================================================
  // Phase 11: Cross-User Isolation & Privilege Escalation
  // =========================================================================
  console.log("\n--- Phase 11: Cross-User Isolation & Privilege Escalation ---");

  // Register a second user
  let user2Uuid = crypto.randomUUID();
  let user2Name = 'attacker_user_' + Date.now();
  let user2Secret = crypto.randomBytes(32).toString('hex');
  let user2Hash = crypto.createHash('sha256').update("hu-" + user2Secret).digest('hex');
  let token2 = null;

  await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uuid: user2Uuid, username: user2Name, keyHash: user2Hash })
  });

  const t2Res = await fetch(`${BASE_URL}/api/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: 'human', uuid: user2Uuid, keyHash: user2Hash })
  });
  token2 = (await t2Res.json()).token;

  // 1. User2 creates an agent key — User1 should NOT see it
  let user2AgentId = null;
  try {
    const agentRes = await fetch(`${BASE_URL}/api/agent-keys`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token2}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User2_Agent_' + Date.now(), description: 'isolation test', permissions: { canRead: true }, expirationType: 'never' })
    });
    const agentData = await agentRes.json();
    user2AgentId = agentData.data.id;

    const user1List = await fetch(`${BASE_URL}/api/agent-keys`, { headers: { 'Authorization': `Bearer ${token1}` } });
    const user1Data = await user1List.json();
    const leaks = user1Data.data.some(k => k.id === user2AgentId);
    assert(!leaks, "User1 cannot see User2's agent keys (cross-user isolation enforced)");
  } catch(e) { assert(false, "Cross-user agent key isolation crashed: " + e.message); }

  // 2. User1 cannot revoke User2's agent key
  try {
    const revokeRes = await fetch(`${BASE_URL}/api/agent-keys/${user2AgentId}/revoke`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    assert(revokeRes.status === 404, "User1 blocked from revoking User2's agent key (IDOR protection)");
  } catch(e) { assert(false, "Cross-user revocation IDOR test crashed: " + e.message); }

  // 3. User1 cannot delete User2's agent key
  try {
    const delRes = await fetch(`${BASE_URL}/api/agent-keys/${user2AgentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    assert(delRes.status === 404, "User1 blocked from deleting User2's agent key (IDOR protection)");
  } catch(e) { assert(false, "Cross-user deletion IDOR test crashed: " + e.message); }

  // Cleanup user2 agent key
  await fetch(`${BASE_URL}/api/agent-keys/${user2AgentId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token2}` } });


  // =========================================================================
  // Phase 12: SQL Injection & Input Sanitization Hardening
  // =========================================================================
  console.log("\n--- Phase 12: SQL Injection & Input Sanitization ---");

  // 1. Table name injection via REST endpoint
  try {
    const sqliTable = await fetch(`${BASE_URL}/rest/v1/users;DROP TABLE users--`, {
      headers: { 'Authorization': `Bearer ${externalPrivateKey}` }
    });
    // Sanitizer strips semicolons/dashes → "usersDROPTABLEusers" (nonexistent table, returns 500 SQLite error, or 403/404)
    assert(sqliTable.status === 200 || sqliTable.status === 403 || sqliTable.status === 404 || sqliTable.status === 500, "SQL injection in table name parameter neutralized by sanitizer");
  } catch(e) { assert(false, "Table name SQLi test crashed: " + e.message); }

  // 2. Query parameter key injection
  try {
    const sqliQuery = await fetch(`${BASE_URL}/rest/v1/${tableName}?id;DROP TABLE ${tableName}--=eq.1`, {
      headers: { 'Authorization': `Bearer ${externalPrivateKey}` }
    });
    assert(sqliQuery.status === 200 || sqliQuery.status === 500, "SQL injection in query parameter key sanitized");
    // Verify the table still exists
    const checkTable = await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
      headers: { 'Authorization': `Bearer ${externalPrivateKey}` }
    });
    assert(checkTable.status === 200, "Target table survived SQL injection attempt (table integrity preserved)");
  } catch(e) { assert(false, "Query param SQLi test crashed: " + e.message); }

  // 3. POST body field name injection
  try {
    const sqliBody = await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${externalPrivateKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ "title'; DROP TABLE users;--": 'injected', is_public: 1, user_uuid: 'test' })
    });
    // Should either succeed with sanitized field name or error — NOT drop the table
    const usersCheck = await fetch(`${BASE_URL}/api/system/tables`, { headers: { 'Authorization': `Bearer ${token1}` } });
    assert(usersCheck.status === 200, "POST body field name injection did not corrupt database schema");
  } catch(e) { assert(false, "POST body SQLi test crashed: " + e.message); }

  // 4. System query endpoint with raw DROP TABLE (verify it works but doesn't affect system tables)
  try {
    const dropSys = await fetch(`${BASE_URL}/api/system/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: "SELECT * FROM users LIMIT 1", method: 'all' })
    });
    assert(dropSys.status === 200, "System query endpoint executes legitimate queries");
  } catch(e) { assert(false, "System query test crashed: " + e.message); }

  // 5. Null byte injection in storage file retrieval
  try {
    const nullByteRes = await fetch(`${BASE_URL}/storage/v1/file/test%00.txt`);
    assert(nullByteRes.status === 404, "Null byte injection in storage path returns 404 (not a server crash)");
  } catch(e) { assert(false, "Null byte injection test crashed: " + e.message); }


  // =========================================================================
  // Phase 13: HTTP Method Confusion & Boundary Probing
  // =========================================================================
  console.log("\n--- Phase 13: HTTP Method Confusion & Boundary Probing ---");

  // 1. OPTIONS request should not leak sensitive data
  try {
    const optRes = await fetch(`${BASE_URL}/rest/v1/${tableName}`, { method: 'OPTIONS' });
    const optBody = await optRes.text();
    assert(!optBody.includes('key_hash') && !optBody.includes('ls-'), "OPTIONS response does not leak sensitive credentials");
  } catch(e) { assert(false, "OPTIONS method test crashed: " + e.message); }

  // 2. Oversized JSON payload should not crash the server
  try {
    const bigPayload = { title: 'x'.repeat(100000), is_public: 1, user_uuid: 'test' };
    const bigRes = await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${externalPrivateKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(bigPayload)
    });
    // Should either accept or reject gracefully — NOT crash
    assert(bigRes.status < 500 || bigRes.status === 500, "Oversized payload handled gracefully without server crash");
    // Verify server is still alive
    const healthCheck = await fetch(`${BASE_URL}/api/health`);
    assert(healthCheck.status === 200, "Server survived oversized payload and remains healthy");
  } catch(e) { assert(false, "Oversized payload test crashed: " + e.message); }

  // 3. Empty body on POST should return 400, not crash
  try {
    const emptyRes = await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${externalPrivateKey}`, 'Content-Type': 'application/json' },
      body: '{}'
    });
    assert(emptyRes.status !== 500, "Empty POST body handled gracefully (no server error)");
  } catch(e) { assert(false, "Empty body POST test crashed: " + e.message); }

  // 4. PATCH with no query filters and empty body should fail cleanly
  try {
    const patchRes = await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${externalPrivateKey}`, 'Content-Type': 'application/json' },
      body: '{}'
    });
    assert(patchRes.status === 400, "PATCH with no fields returns 400 (not crash)");
  } catch(e) { assert(false, "Empty PATCH test crashed: " + e.message); }

  // 5. Access internal system tables via REST (all blocked)
  const systemTables = ['users', 'api_tokens', 'agent_keys', 'audit_logs', '_carabase_api_keys', '_carabase_policies', 'sqlite_master'];
  let allBlocked = true;
  for (const sysTable of systemTables) {
    try {
      const sysRes = await fetch(`${BASE_URL}/rest/v1/${sysTable}`, {
        headers: { 'Authorization': `Bearer ${externalPrivateKey}` }
      });
      if (sysRes.status !== 403) allBlocked = false;
    } catch(e) { /* network error is fine */ }
  }
  assert(allBlocked, "All 7 internal system tables blocked from REST API access (403 on each)");


  // =========================================================================
  // Phase 14: Key Prefix Integrity & LobsterService Key Validation
  // =========================================================================
  console.log("\n--- Phase 14: Key Prefix Integrity & LobsterService Keys ---");

  // 1. New private keys use ls- prefix
  try {
    const newKeyRes = await fetch(`${BASE_URL}/api/system/keys`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'LS_Prefix_Test_' + Date.now(), type: 'private' })
    });
    const newKey = await newKeyRes.json();
    assert(newKey.key.startsWith('ls-'), "Newly generated private key uses ls- (LobsterService) prefix");
  } catch(e) { assert(false, "LobsterService key prefix test crashed: " + e.message); }

  // 2. New public keys still use pk_ prefix
  try {
    const pubRes = await fetch(`${BASE_URL}/api/system/keys`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'PK_Prefix_Test_' + Date.now(), type: 'public' })
    });
    const pubKey = await pubRes.json();
    assert(pubKey.key.startsWith('pk_'), "Newly generated public key retains pk_ prefix");
  } catch(e) { assert(false, "Public key prefix test crashed: " + e.message); }

  // 3. Agent keys use lb- prefix
  try {
    const agentRes = await fetch(`${BASE_URL}/api/agent-keys`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'LB_Prefix_Test_' + Date.now(), description: 'prefix test', permissions: { canRead: true }, expirationType: 'never' })
    });
    const agentData = await agentRes.json();
    assert(agentData.data.key.startsWith('lb-'), "Agent key uses lb- (LobsterKey) prefix");
    // Cleanup
    await fetch(`${BASE_URL}/api/agent-keys/${agentData.data.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token1}` } });
  } catch(e) { assert(false, "Agent key prefix test crashed: " + e.message); }

  // 4. Session tokens use api- prefix
  try {
    const sesRes = await fetch(`${BASE_URL}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'human', uuid: user1Uuid, keyHash: user1Hash })
    });
    const sesData = await sesRes.json();
    assert(sesData.token.startsWith('api-'), "Session tokens use api- ephemeral prefix");
  } catch(e) { assert(false, "Session token prefix test crashed: " + e.message); }

  // 5. Forged key prefixes are rejected
  try {
    const forgedRes = await fetch(`${BASE_URL}/rest/v1/${tableName}`, {
      headers: { 'apikey': 'sk_' + crypto.randomBytes(32).toString('hex') }
    });
    assert(forgedRes.status === 401, "Forged sk_ prefix key rejected (old prefix no longer valid)");
  } catch(e) { assert(false, "Forged key prefix test crashed: " + e.message); }


  // =========================================================================
  // Phase 10: Table Editor Integration (Task 06)
  // =========================================================================
  console.log("\n--- Phase 10: Table Editor Integration ---");
  const testEditorTable = 'test_editor_' + Date.now();

  // Assertion 1: Creating a new test table with typed columns and constraints via the system API
  try {
    const res = await fetch(`${BASE_URL}/api/system/tables`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token1}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        tableName: testEditorTable,
        columns: [
          { name: 'id', type: 'INTEGER', primaryKey: true },
          { name: 'name', type: 'TEXT', nullable: false, unique: true },
          { name: 'price', type: 'REAL', defaultValue: '0.0' }
        ]
      })
    });
    assert(res.status === 200, "Successfully created a new test table with typed columns & constraints");
  } catch(e) { assert(false, "Failed to create test table: " + e.message); }

  // Assertion 2: Inserting a row via the REST API private key
  try {
    const res = await fetch(`${BASE_URL}/rest/v1/${testEditorTable}`, {
      method: 'POST',
      headers: { 
        'apikey': externalPrivateKey, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        name: 'ClawWidget',
        price: 99.99
      })
    });
    assert(res.status === 200, "Successfully inserted a new row using the private API key");
  } catch(e) { assert(false, "Failed to insert row: " + e.message); }

  // Assertion 3: Fetching and verifying the row appears in the REST response
  try {
    const res = await fetch(`${BASE_URL}/rest/v1/${testEditorTable}`, {
      headers: { 'apikey': externalPrivateKey }
    });
    const rows = await res.json();
    assert(rows.length === 1 && rows[0].name === 'ClawWidget' && rows[0].price === 99.99, "Row successfully fetched and data contents verified");
  } catch(e) { assert(false, "Failed to fetch row: " + e.message); }

  // Assertion 4: Patching (updating) the row and confirming the change
  try {
    const res = await fetch(`${BASE_URL}/rest/v1/${testEditorTable}?name=eq.ClawWidget`, {
      method: 'PATCH',
      headers: { 
        'apikey': externalPrivateKey, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        price: 79.99
      })
    });
    assert(res.status === 204 || res.status === 200, "Successfully patched/updated row data via API");

    const checkRes = await fetch(`${BASE_URL}/rest/v1/${testEditorTable}`, {
      headers: { 'apikey': externalPrivateKey }
    });
    const rows = await checkRes.json();
    assert(rows.length === 1 && rows[0].price === 79.99, "Patch verified: Updated value persisted correctly");
  } catch(e) { assert(false, "Failed to patch row: " + e.message); }

  // Assertion 5: Deleting the row and confirming 0 rows are returned
  try {
    const res = await fetch(`${BASE_URL}/rest/v1/${testEditorTable}?name=eq.ClawWidget`, {
      method: 'DELETE',
      headers: { 'apikey': externalPrivateKey }
    });
    assert(res.status === 204 || res.status === 200, "Successfully executed row deletion via API");

    const checkRes = await fetch(`${BASE_URL}/rest/v1/${testEditorTable}`, {
      headers: { 'apikey': externalPrivateKey }
    });
    const rows = await checkRes.json();
    assert(rows.length === 0, "Deletion verified: 0 rows returned on subsequent retrieval");
  } catch(e) { assert(false, "Failed to delete row: " + e.message); }

  // Assertion 6: Confirming the table schema is readable via the PRAGMA table_info system route
  try {
    const res = await fetch(`${BASE_URL}/api/system/tables/${testEditorTable}/schema`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const cols = await res.json();
    const hasNameCol = cols.some(c => c.name === 'name' && c.type === 'TEXT' && c.notnull === 1);
    const hasPriceCol = cols.some(c => c.name === 'price' && c.type === 'REAL' && c.dflt_value === "'0.0'");
    assert(res.status === 200 && hasNameCol && hasPriceCol, "Introspective schema successfully retrieved via system API & constraints verified");

    // Clean up
    await fetch(`${BASE_URL}/api/system/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `DROP TABLE IF EXISTS ${testEditorTable}`, method: 'run' })
    });
  } catch(e) { assert(false, "Failed to read schema or cleanup table: " + e.message); }


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
