package com.clawstack.carabase.storage

import com.clawstack.carabase.network.CaraBaseClient
import io.ktor.client.call.body
import io.ktor.client.request.forms.MultiPartFormDataContent
import io.ktor.client.request.forms.formData
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.Headers
import io.ktor.http.HttpHeaders

/**
 * StorageApi — CaraBase©™ Android SDK
 * 
 * Handles file uploads via multipart/form-data to the CaraBase storage engine.
 */
class StorageApi internal constructor(
    private val client: CaraBaseClient,
    private val baseUrl: String
) {
    /**
     * Uploads a raw ByteArray as a file to CaraBase Storage.
     */
    suspend fun upload(fileName: String, data: ByteArray, mimeType: String = "application/octet-stream"): String {
        val response = client.httpClient.post("/storage/v1/upload") {
            setBody(
                MultiPartFormDataContent(
                    formData {
                        append("file", data, Headers.build {
                            append(HttpHeaders.ContentType, mimeType)
                            append(HttpHeaders.ContentDisposition, "filename=\"$fileName\"")
                        })
                    }
                )
            )
        }
        // Returns the JSON response containing the file metadata
        return response.body()
    }

    /**
     * Generates a public URL for a given file path.
     * Uses the Cloudflare tunnel if configured, or the default base URL.
     */
    fun getPublicUrl(path: String): String {
        val cleanPath = if (path.startsWith("/")) path.substring(1) else path
        return "$baseUrl/storage/v1/public/$cleanPath"
    }
}
