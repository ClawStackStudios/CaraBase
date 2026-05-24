export class StorageClient {
  private url: string;
  private headers: Record<string, string>;

  constructor(baseUrl: string, headers: Record<string, string>) {
    this.url = `${baseUrl}/storage/v1`;
    this.headers = { ...headers };
  }

  /**
   * Upload a file to CaraBase's global storage volume.
   * 
   * @param file - The file (File or Blob) to upload
   * @returns An object containing the generated storage ID and filename
   */
  public async upload(file: File | Blob): Promise<{ data: { id: string, filename: string } | null, error: any | null }> {
    try {
      const formData = new FormData();
      // Use 'file' as the field name to match CaraBase's `upload.single('file')`
      formData.append('file', file);

      // We omit Content-Type so the browser sets it automatically with the multipart boundary
      const uploadHeaders = { ...this.headers };
      delete uploadHeaders['Content-Type'];

      const response = await fetch(`${this.url}/upload`, {
        method: 'POST',
        headers: uploadHeaders,
        body: formData
      });

      const responseData = await response.json();

      if (!response.ok) {
        return { data: null, error: responseData };
      }

      return { data: { id: responseData.id, filename: responseData.filename }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Network error occurred during upload' } };
    }
  }

  /**
   * Generates a public retrieval URL for a stored file.
   * 
   * @param id - The ID of the uploaded file
   * @returns An object containing the public URL
   */
  public getPublicUrl(id: string): { data: { publicUrl: string } } {
    return {
      data: {
        publicUrl: `${this.url}/file/${id}`
      }
    };
  }
}
