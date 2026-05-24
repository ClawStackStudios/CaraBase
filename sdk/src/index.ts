import { CaraBaseClient } from './CaraBaseClient';

/**
 * Creates a new CaraBase client.
 * 
 * @param url - The base URL of your CaraBase instance (e.g., "https://my-carabase.example.com")
 * @param apiKey - The API key (e.g., "ls-...", "ls-p-...", "api-...", "lb-...")
 * @returns A fully initialized CaraBaseClient
 */
export function createClient(url: string, apiKey: string): CaraBaseClient {
  return new CaraBaseClient(url, apiKey);
}

export { CaraBaseClient } from './CaraBaseClient';
export { QueryBuilder } from './QueryBuilder';
export { StorageClient } from './StorageClient';
export { RealtimeClient } from './RealtimeClient';
