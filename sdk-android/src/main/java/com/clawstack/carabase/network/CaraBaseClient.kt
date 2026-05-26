package com.clawstack.carabase.network

import com.clawstack.carabase.auth.TokenStorage
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.request.header
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

/**
 * CaraBaseClient — CaraBase©™ Android SDK
 * 
 * The internal Ktor HTTP Client.
 * Implements the "Zero Settings Leakage" invariant by ensuring
 * that the active API Key is automatically pulled from TokenStorage
 * and injected into every request natively.
 */
internal class CaraBaseClient(
    private val baseUrl: String,
    private val tokenStorage: TokenStorage
) {
    val httpClient = HttpClient(CIO) {
        // Automatically inject JSON serialization
        install(ContentNegotiation) {
            json(Json {
                prettyPrint = true
                isLenient = true
                ignoreUnknownKeys = true
            })
        }

        // Global Request Configuration
        defaultRequest {
            url(baseUrl)
            
            // SECURITY INVARIANT: The Token Membrane
            // Automatically fetch the secure token and attach it to the request.
            // The developer never touches this logic.
            val token = tokenStorage.getToken()
            if (!token.isNullOrEmpty()) {
                header("Authorization", "Bearer $token")
            }
        }
    }
}
