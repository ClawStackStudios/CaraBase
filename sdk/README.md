# CaraBase JS

The official JavaScript/TypeScript client for CaraBase.

`carabase-js` provides a clean, chainable API—inspired by PostgREST—to interact with your CaraBase database, storage, and real-time endpoints seamlessly.

## Installation

```bash
npm install carabase-js
```

## Initialization

Initialize the client using your CaraBase instance URL and an API key. 

```typescript
import { createClient } from 'carabase-js';

// Use an ls-p- key for server-side administrative access (bypasses RLS)
// Use an ls- key for client-side access (enforces RLS)
const carabase = createClient('https://api.your-domain.com', 'ls-your-public-api-key');
```

## Querying Data

The SDK uses a chainable Query Builder interface.

### Select Rows

```typescript
const { data, error } = await carabase
  .from('posts')
  .select('*')
  .eq('published', true)
  .order('created_at', { ascending: false })
  .limit(10);
```

### Insert Rows

```typescript
const { data, error } = await carabase
  .from('posts')
  .insert({ title: 'Hello World', content: 'This is my first post!' });
```

### Update Rows

```typescript
const { data, error } = await carabase
  .from('posts')
  .update({ published: true })
  .eq('id', 1);
```

### Delete Rows

```typescript
const { data, error } = await carabase
  .from('posts')
  .delete()
  .eq('id', 1);
```

## Storage

Upload files to your CaraBase global storage volume.

```typescript
// Assuming `file` is a JavaScript File or Blob object
const { data, error } = await carabase.storage.upload(file);

if (data) {
  console.log('File uploaded with ID:', data.id);
  
  // Get the public URL for the file
  const { data: { publicUrl } } = carabase.storage.getPublicUrl(data.id);
  console.log('Public URL:', publicUrl);
}
```

## Realtime Subscriptions

Listen to real-time events on your tables using Server-Sent Events (SSE).

```typescript
const unsubscribe = carabase.realtime.subscribe('posts', (event) => {
  console.log('Database mutation received:', event);
});

// Later, to stop listening:
// unsubscribe();
```

> **Note on Environments:** The `.realtime.subscribe` method relies on `EventSource`. If you are using this SDK in a Node.js environment, ensure you have imported a global polyfill (like the `eventsource` npm package).

## License

MIT License
