# CaraBase Android SDK (Kotlin)

The `carabase-android` SDK is a native Kotlin library that transforms CaraBase into a true multi-platform Backend-as-a-Service (BaaS). It provides a fluent, type-safe API for interacting with the `/rest/v1` endpoints, handling real-time Server-Sent Events (SSE), and managing secure token storage.

> [!IMPORTANT]
> **Zero Settings Leakage**
> The Android SDK is built around the invariant of **"features around security."** It enforces an internal Ktor interceptor that automatically reads the encrypted active token from Android Keystore and injects the `Authorization: Bearer` header natively. The developer never manually constructs auth headers.

## 1. Initialization

Initialize the SDK singleton in your `Application` class or main activity using your CaraBase instance URL and an `lb-` (Lobster Key) public key.

```kotlin
import com.clawstack.carabase.CaraBase

class MainApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        
        CaraBase.init(
            url = "https://carabase.yourdomain.com",
            key = "lb-your-public-key",
            context = this
        )
    }
}
```

## 2. Fluent Type-Safe Queries

The Query Builder is completely type-safe and natively mitigates string-injection attacks by utilizing URL-encoded Ktor parameters.

```kotlin
import com.clawstack.carabase.CaraBase
import kotlinx.coroutines.launch

// 1. Get the instance
val db = CaraBase.getInstance()

// 2. Execute a query (Automatically deserialized into a List of your Kotlin Data Class)
lifecycleScope.launch {
    val adminUsers = db.from("users")
        .select("*")
        .eq("role", "admin")
        .limit(10)
        .execute<User>()
        
    println("Found admins: $adminUsers")
}
```

### Supported Filters
- `.select(columns: String)`: Define the columns to return (defaults to `*`).
- `.eq(column: String, value: Any)`: Exact match filter.
- `.limit(count: Int)`: Limit the number of rows returned.

## 3. Realtime Event Streaming (SSE)

Server-Sent Events are notoriously painful to manage natively in Android. The CaraBase SDK abstracts the entire HTTP stream into a seamless Kotlin Coroutine `Flow` that operates safely on background `Dispatchers.IO` threads.

```kotlin
lifecycleScope.launch {
    // Subscribes to the "posts" table and listens indefinitely
    db.realtime.subscribe("posts").collect { event ->
        println("Realtime Event Triggered: $event")
        // Update your UI state natively
    }
}
```

> [!TIP]
> Because it is a standard Kotlin `Flow`, you can append `.retryWhen { ... }` or `.catch { ... }` blocks to implement robust auto-reconnection logic when the device switches from WiFi to Cellular data.

## 4. Storage & Multi-Part Uploads

Upload files to the CaraBase Storage Engine using native multipart chunking. This ensures large byte arrays do not cause Out-of-Memory (OOM) crashes on Android devices.

```kotlin
// Uploading an avatar image
val publicUrlJson = db.storage.upload(
    fileName = "avatar.png",
    data = imageBytes, 
    mimeType = "image/png"
)

// Resolving a public Cloudflare Tunnel URL
val imageUrl = db.storage.getPublicUrl("avatars/avatar.png")
```

## 5. Hardware-Backed Auth Storage

The SDK securely persists session tokens (`api-`) and master keys (`lb-`). It does **not** use plaintext `SharedPreferences`. All tokens are encrypted using `AES256_GCM` cryptography backed by the Android MasterKey system via the `androidx.security` library.

To clear tokens (e.g., on User Logout):
```kotlin
db.tokenStorage.clearToken()
```
