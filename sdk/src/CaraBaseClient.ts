import { QueryBuilder } from './QueryBuilder';
import { StorageClient } from './StorageClient';
import { RealtimeClient } from './RealtimeClient';

export class CaraBaseClient {
  protected url: string;
  protected apiKey: string;
  protected headers: Record<string, string>;

  public storage: StorageClient;
  public realtime: RealtimeClient;

  constructor(url: string, apiKey: string) {
    // Remove trailing slashes
    this.url = url.replace(/\/$/, '');
    this.apiKey = apiKey;
    
    // Default headers required by CaraBase REST API
    this.headers = {
      'apikey': this.apiKey,
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    this.storage = new StorageClient(this.url, this.headers);
    this.realtime = new RealtimeClient(this.url, this.headers);
  }

  /**
   * Perform a query on a specific table.
   * 
   * @param table - The name of the table
   * @returns A QueryBuilder for chainable operations
   */
  public from(table: string): QueryBuilder {
    return new QueryBuilder(this.url, table, this.headers);
  }
}
