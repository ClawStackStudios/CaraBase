# API Reference

This reference covers the endpoints exposed by CaraBase.

## REST API (Data Plane)

CaraBase automatically generates generic REST endpoints for every table you create.

### Read Data
- **URL**: `GET /rest/v1/:table`
- **Query Parameters**:
  - `select`: Comma-separated list of columns.
  - `limit`: Number of rows to return.
  - `offset`: Pagination offset.
  - `[column]=eq.[value]`: Filter by equality. (Supports `eq`, `neq`, `gt`, `lt`, `gte`, `lte`, `like`).
- **Response**: Array of row objects.

### Insert Data
- **URL**: `POST /rest/v1/:table`
- **Body**: JSON object or array of objects representing rows.
- **Response**: The inserted row object(s).

### Update Data
- **URL**: `PATCH /rest/v1/:table`
- **Query Parameters**: Must include a filter (e.g., `?id=eq.1`) to target specific rows.
- **Body**: JSON object with fields to update.
- **Response**: The updated row object(s).

### Delete Data
- **URL**: `DELETE /rest/v1/:table`
- **Query Parameters**: Must include a filter (e.g., `?id=eq.1`) to target specific rows.
- **Response**: Status 204 No Content.

## Authentication API

### Generate Session Token
- **URL**: `POST /api/auth/token`
- **Body**: None
- **Headers**: `apikey: hu-your-human-secret`
- **Response**: 
  ```json
  {
    "token": "api-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
  ```

## System API (Control Plane)

> [!WARNING]
> These endpoints require the `admin` or `superadmin` role.

### File Upload
- **URL**: `POST /api/system/storage/upload`
- **Headers**: `Authorization: Bearer api-your-session-token`
- **Body**: `multipart/form-data` containing `file` field.
- **Response**: File metadata and UUID.

### Create Share Hash
- **URL**: `POST /api/system/storage/:id/shares`
- **Headers**: `Authorization: Bearer api-your-session-token`
- **Body**: `{"expiresInSeconds": 3600}` (Optional)
- **Response**: 
  ```json
  {
    "share_hash": "64_char_hex_string"
  }
  ```
