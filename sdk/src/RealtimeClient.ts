export class RealtimeClient {
  private url: string;
  private headers: Record<string, string>;
  private activeSubscriptions: Map<string, EventSource> = new Map();

  constructor(baseUrl: string, headers: Record<string, string>) {
    this.url = `${baseUrl}/rest/v1`;
    this.headers = { ...headers };
  }

  /**
   * Subscribe to real-time changes on a specific table.
   * 
   * @param table - The name of the table to listen to
   * @param callback - The function to call when a mutation event occurs
   * @returns A function to unsubscribe
   */
  public subscribe(table: string, callback: (event: any) => void): () => void {
    // If already subscribed, return early
    if (this.activeSubscriptions.has(table)) {
      console.warn(`Already subscribed to table: ${table}`);
      return () => this.unsubscribe(table);
    }

    // EventSource doesn't support custom headers natively in browsers.
    // We pass the API key via query parameters.
    // Note: If using session tokens (api-), the server currently requires the Authorization header.
    const apiKey = this.headers['apikey'] || '';
    const sseUrl = `${this.url}/${table}?apikey=${encodeURIComponent(apiKey)}`;

    let eventSource: EventSource;

    try {
      eventSource = new EventSource(sseUrl);
    } catch (e: any) {
      console.error(`Failed to initialize EventSource. If you are in Node.js, ensure you have a global EventSource polyfill: ${e.message}`);
      throw e;
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (e) {
        console.error('Failed to parse realtime event data', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error(`Realtime subscription error on table ${table}:`, error);
      // Optional: handle automatic reconnection or bubbling errors
    };

    this.activeSubscriptions.set(table, eventSource);

    return () => this.unsubscribe(table);
  }

  /**
   * Unsubscribe from a specific table's real-time events.
   * 
   * @param table - The name of the table
   */
  public unsubscribe(table: string): void {
    const eventSource = this.activeSubscriptions.get(table);
    if (eventSource) {
      eventSource.close();
      this.activeSubscriptions.delete(table);
    }
  }

  /**
   * Close all active real-time subscriptions.
   */
  public disconnect(): void {
    for (const [table, eventSource] of this.activeSubscriptions.entries()) {
      eventSource.close();
    }
    this.activeSubscriptions.clear();
  }
}
