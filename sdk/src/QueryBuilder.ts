export class QueryBuilder {
  private url: string;
  private table: string;
  private headers: Record<string, string>;
  
  private method: string = 'GET';
  private queryParams: URLSearchParams;
  private requestBody: any = null;

  constructor(baseUrl: string, table: string, headers: Record<string, string>) {
    this.url = `${baseUrl}/rest/v1/${table}`;
    this.table = table;
    this.headers = { ...headers };
    this.queryParams = new URLSearchParams();
  }

  /**
   * Perform a SELECT query.
   * Note: CaraBase currently returns all columns by default, 
   * but this maintains the standard DX signature.
   */
  public select(columns: string = '*'): this {
    this.method = 'GET';
    // CaraBase dynamic API generator supports ?select= but the base REST 
    // endpoint returns all columns. We maintain the signature for familiarity.
    return this;
  }

  /**
   * Perform an INSERT operation.
   */
  public insert(data: Record<string, any>): this {
    this.method = 'POST';
    this.requestBody = data;
    return this;
  }

  /**
   * Perform an UPDATE operation.
   */
  public update(data: Record<string, any>): this {
    this.method = 'PATCH'; // CaraBase uses PATCH for partial updates
    this.requestBody = data;
    return this;
  }

  /**
   * Perform a DELETE operation.
   */
  public delete(): this {
    this.method = 'DELETE';
    return this;
  }

  /**
   * Filter the query to match a specific column value exactly.
   */
  public eq(column: string, value: string | number | boolean): this {
    this.queryParams.append(column, `eq.${value}`);
    return this;
  }

  /**
   * Limit the number of rows returned.
   */
  public limit(count: number): this {
    this.queryParams.append('limit', count.toString());
    return this;
  }

  /**
   * Order the results.
   */
  public order(column: string, options?: { ascending?: boolean }): this {
    this.queryParams.append('order_by', column);
    if (options && options.ascending === false) {
      this.queryParams.append('dir', 'DESC');
    } else {
      this.queryParams.append('dir', 'ASC');
    }
    return this;
  }

  /**
   * Executes the query and returns the response.
   * This is called automatically when the promise is awaited.
   */
  public async execute(): Promise<{ data: any | null, error: any | null }> {
    try {
      const queryString = this.queryParams.toString();
      const finalUrl = queryString ? `${this.url}?${queryString}` : this.url;

      const response = await fetch(finalUrl, {
        method: this.method,
        headers: this.headers,
        body: this.requestBody ? JSON.stringify(this.requestBody) : undefined
      });

      // Constraints: Check response.status === 204 and content-type before calling response.json(); preserve response.status and response.statusText in error envelope.
      if (response.status === 204) {
        return { data: null, error: null };
      }

      const contentType = response.headers.get('content-type');
      let responseData: any = null;

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        if (!response.ok) {
          return { data: null, error: { message: `HTTP ${response.status} ${response.statusText}`, details: text, status: response.status, statusText: response.statusText } };
        }
        responseData = text;
      }

      if (!response.ok) {
        // If it's JSON error payload but response.ok is false, preserve status
        if (typeof responseData === 'object' && responseData !== null) {
          responseData.status = responseData.status || response.status;
          responseData.statusText = responseData.statusText || response.statusText;
        }
        return { data: null, error: responseData };
      }

      return { data: responseData, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Network error occurred' } };
    }
  }

  /**
   * Allow the builder to be awaited directly.
   */
  public then<TResult1 = { data: any | null, error: any | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any | null, error: any | null }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}
