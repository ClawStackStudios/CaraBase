export const AuthSchemas = {
  register: (body: any) => {
    const { uuid, username, keyHash } = body;
    if (!uuid || !username || !keyHash) return 'Missing required fields';
    if (typeof uuid !== 'string' || uuid.length !== 36) return 'Invalid UUID format';
    if (typeof username !== 'string' || username.length < 1 || username.length > 64 || !/^[a-z0-9_]+$/.test(username)) return 'Invalid username format';
    if (typeof keyHash !== 'string' || keyHash.length !== 64 || !/^[0-9a-f]{64}$/.test(keyHash)) return 'Invalid key hash format';
    return null;
  },
  token: (body: any) => {
    const { type, uuid, keyHash, ownerKey } = body;
    if (type !== 'human' && type !== 'agent') return 'type must be human or agent';
    if (type === 'human') {
      if (!uuid && !keyHash) return 'uuid or keyHash required';
    } else {
      if (!ownerKey) return 'ownerKey required';
    }
    return null;
  }
};

export const AgentKeySchemas = {
  create: (body: any) => {
    const { name } = body;
    if (!name || typeof name !== 'string') return 'Missing required field: name';
    return null;
  }
};
