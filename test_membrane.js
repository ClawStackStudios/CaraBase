import db from './src/server/db.js';

const storage_id = 'test-file-id';
const share_hash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'; // 64 chars

try {
  db.prepare('INSERT INTO _carabase_storage (id, original_name, filename, mime_type, size) VALUES (?, ?, ?, ?, ?)').run(storage_id, 'test.txt', 'test.txt', 'text/plain', 12);
  db.prepare('INSERT INTO _carabase_storage_shares (id, storage_id, share_hash) VALUES (?, ?, ?)').run('share-id', storage_id, share_hash);
  console.log('Inserted test data');
} catch (e) {
  console.log('Error or already exists', e.message);
}
