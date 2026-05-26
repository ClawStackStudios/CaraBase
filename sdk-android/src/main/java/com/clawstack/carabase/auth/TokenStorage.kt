package com.clawstack.carabase.auth

import android.content.Context
import androidx.core.content.edit
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * TokenStorage — CaraBase©™ Android SDK
 * 
 * Hardware-backed encrypted storage for session tokens.
 * Enforces "Security Around Invariants" by ensuring API tokens
 * never touch plaintext XML SharedPreferences.
 */
class TokenStorage(context: Context) {

    companion object {
        private const val PREFS_FILE = "carabase_auth_prefs"
        private const val KEY_TOKEN = "session_token"
    }

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        PREFS_FILE,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    /**
     * Stores the current active token (either hu-, lb-, or api-).
     */
    fun saveToken(token: String) {
        sharedPreferences.edit {
            putString(KEY_TOKEN, token)
        }
    }

    /**
     * Retrieves the current active token.
     */
    fun getToken(): String? {
        return sharedPreferences.getString(KEY_TOKEN, null)
    }

    /**
     * Clears the current active token (e.g., on logout).
     */
    fun clearToken() {
        sharedPreferences.edit {
            remove(KEY_TOKEN)
        }
    }
}
