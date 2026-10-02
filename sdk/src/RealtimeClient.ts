export interface SubscriptionOptions {
  onError?: (err: any) => void;
  onStatusChange?: (status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error') => void;
}

interface SubscriptionState {
  eventSource: EventSource | null;
  reconnectAttempts: number;
  reconnectTimeoutId?: ReturnType<typeof setTimeout>;
  options?: SubscriptionOptions;
  callback: (event: any) => void;
  isClosed: boolean;
}

export class RealtimeClient {
  private url: string;
  private headers: Record<string, string>;
  private activeSubscriptions: Map<string, SubscriptionState> = new Map();

  constructor(baseUrl: string, headers: Record<string, string>) {
    this.url = `${baseUrl}/rest/v1`;
    this.headers = { ...headers };
  }

  /**
   * Subscribe to real-time changes on a specific table.
   * 
   * @param table - The name of the table to listen to
   * @param callback - The function to call when a mutation event occurs
   * @param options - Additional callbacks for errors and status changes
   * @returns A function to unsubscribe
   */
  public subscribe(table: string, callback: (event: any) => void, options?: SubscriptionOptions): () => void {
    // If already subscribed, return early
    if (this.activeSubscriptions.has(table)) {
      console.warn(`Already subscribed to table: ${table}`);
      return () => this.unsubscribe(table);
    }

    const state: SubscriptionState = {
      eventSource: null,
      reconnectAttempts: 0,
      options,
      callback,
      isClosed: false
    };

    this.activeSubscriptions.set(table, state);
    this.connect(table, state);

    return () => this.unsubscribe(table);
  }

  private connect(table: string, state: SubscriptionState) {
    if (state.isClosed) return;

    if (state.options?.onStatusChange) {
      state.options.onStatusChange(state.reconnectAttempts === 0 ? 'connecting' : 'reconnecting');
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
      if (state.options?.onError) state.options.onError(e);
      if (state.options?.onStatusChange) state.options.onStatusChange('error');

      this.activeSubscriptions.delete(table);
      throw e;
    }

    state.eventSource = eventSource;

    eventSource.onopen = () => {
      state.reconnectAttempts = 0; // Reset on successful connection
      if (state.options?.onStatusChange) {
        state.options.onStatusChange('connected');
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        state.callback(data);
      } catch (e) {
        console.error('Failed to parse realtime event data', e);
      }
    };

    // Constraints: Surface onError and onStatusChange callbacks; automatically reconnect on connection drops with exponential backoff and jitter (max 5 retries); clean up activeSubscriptions map on terminal closure.
    eventSource.onerror = (error) => {
      if (state.options?.onError) {
        state.options.onError(error);
      }

      // Close the current event source to trigger reconnect logic
      if (state.eventSource) {
        state.eventSource.close();
        state.eventSource = null;
      }

      if (state.reconnectAttempts < 5) {
        // Exponential backoff with jitter
        const baseDelay = 1000 * Math.pow(2, state.reconnectAttempts); // 1s, 2s, 4s, 8s, 16s
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;

        state.reconnectAttempts++;
        console.warn(`Realtime connection lost for table ${table}. Reconnecting in ${Math.round(delay)}ms (Attempt ${state.reconnectAttempts}/5)`);

        if (state.reconnectTimeoutId) clearTimeout(state.reconnectTimeoutId);
        state.reconnectTimeoutId = setTimeout(() => {
          this.connect(table, state);
        }, delay);
      } else {
        console.error(`Max reconnection attempts reached for table ${table}. Giving up.`);
        if (state.options?.onStatusChange) {
          state.options.onStatusChange('error');
        }
        // Terminal closure, cleanup
        this.unsubscribe(table);
      }
    };
  }

  /**
   * Unsubscribe from a specific table's real-time events.
   * 
   * @param table - The name of the table
   */
  public unsubscribe(table: string): void {
    const state = this.activeSubscriptions.get(table);
    if (state) {
      state.isClosed = true;
      if (state.eventSource) {
        state.eventSource.close();
      }
      if (state.reconnectTimeoutId) {
        clearTimeout(state.reconnectTimeoutId);
      }
      if (state.options?.onStatusChange) {
        state.options.onStatusChange('disconnected');
      }
      this.activeSubscriptions.delete(table);
    }
  }

  /**
   * Close all active real-time subscriptions.
   */
  public disconnect(): void {
    for (const table of Array.from(this.activeSubscriptions.keys())) {
      this.unsubscribe(table);
    }
  }
}
