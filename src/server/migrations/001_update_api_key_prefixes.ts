export function up(db: any) {
  // 1. Update old Private keys ('ls-') to 'ls-p-'
  // Since 'ls-' is a prefix for both new public keys and old private keys, 
  // we must identify them by their type = 'private' to ensure we only target the old private keys.
  const updatePrivate = db.prepare(`
    UPDATE _carabase_api_keys 
    SET key = 'ls-p-' || substr(key, 4) 
    WHERE type = 'private' AND key LIKE 'ls-%' AND key NOT LIKE 'ls-p-%'
  `);
  updatePrivate.run();

  // 2. Update old Public keys ('pk_') to 'ls-'
  const updatePublic = db.prepare(`
    UPDATE _carabase_api_keys 
    SET key = 'ls-' || substr(key, 4) 
    WHERE type = 'public' AND key LIKE 'pk_%'
  `);
  updatePublic.run();
}
