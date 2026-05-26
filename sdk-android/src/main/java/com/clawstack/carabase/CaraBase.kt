package com.clawstack.carabase

import android.content.Context
import com.clawstack.carabase.auth.TokenStorage
import com.clawstack.carabase.network.CaraBaseClient
import com.clawstack.carabase.query.QueryBuilder
import com.clawstack.carabase.realtime.RealtimeManager
import com.clawstack.carabase.storage.StorageApi

/**
 * CaraBase — CaraBase©™ Android SDK
 * 
 * The main entry point for the CaraBase Android Native SDK.
 * Handles initialization of the networking and storage membranes.
 */
class CaraBase private constructor(
    private val url: String,
    private val context: Context
) {
    
    internal val tokenStorage = TokenStorage(context)
    internal val client = CaraBaseClient(url, tokenStorage)

    /** The Server-Sent Events (SSE) Flow Manager */
    val realtime: RealtimeManager by lazy { RealtimeManager(client) }

    /** The Storage API for multipart uploads and public URLs */
    val storage: StorageApi by lazy { StorageApi(client, url) }

    /**
     * Initializes the SDK with a specific key (usually the `lb-` key).
     */
    private fun initKey(key: String) {
        // Save the master/public key directly into encrypted storage
        tokenStorage.saveToken(key)
    }

    /**
     * Returns a QueryBuilder for the specified table.
     * Example: carabase.from("users").select("*").execute<User>()
     */
    fun from(table: String): QueryBuilder {
        return QueryBuilder(client, table)
    }

    companion object {
        @Volatile
        private var instance: CaraBase? = null

        /**
         * Initializes the CaraBase SDK.
         * 
         * @param url The base URL of the CaraBase instance (e.g., "https://carabase.yourdomain.com").
         * @param key The initial API key (usually an `lb-` Lobster Key).
         * @param context The Android Application Context.
         */
        fun init(url: String, key: String, context: Context): CaraBase {
            return instance ?: synchronized(this) {
                instance ?: CaraBase(url, context.applicationContext).also {
                    it.initKey(key)
                    instance = it
                }
            }
        }

        /**
         * Retrieves the initialized CaraBase instance.
         * Throws an exception if `init()` was not called first.
         */
        fun getInstance(): CaraBase {
            return instance ?: throw IllegalStateException("CaraBase SDK is not initialized. Call CaraBase.init() first.")
        }
    }
}
