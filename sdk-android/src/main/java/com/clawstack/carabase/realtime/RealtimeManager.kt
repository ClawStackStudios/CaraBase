package com.clawstack.carabase.realtime

import com.clawstack.carabase.network.CaraBaseClient
import io.ktor.client.request.header
import io.ktor.client.request.prepareGet
import io.ktor.client.statement.bodyAsChannel
import io.ktor.utils.io.readUTF8Line
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject

/**
 * RealtimeManager — CaraBase©™ Android SDK
 * 
 * Manages Server-Sent Events (SSE) natively using Kotlin Coroutines Flow.
 * Handles background threading and automatic raw string parsing, so developers 
 * do not have to write manual thread or networking logic.
 */
class RealtimeManager internal constructor(private val client: CaraBaseClient) {

    private val jsonParser = Json { ignoreUnknownKeys = true }

    /**
     * Subscribes to real-time events on a specific table.
     * Reconnect logic can be handled naturally with Flow `retryWhen` by the consumer,
     * but this base flow emits indefinitely as long as the connection is open.
     */
    fun subscribe(table: String): Flow<JsonObject> = flow {
        client.httpClient.prepareGet("/rest/v1/$table") {
            header("Accept", "text/event-stream")
            header("Cache-Control", "no-cache")
        }.execute { response ->
            val channel = response.bodyAsChannel()
            while (!channel.isClosedForRead) {
                val line = channel.readUTF8Line()
                if (line != null && line.startsWith("data: ")) {
                    val jsonStr = line.substring(6).trim()
                    if (jsonStr.isNotEmpty()) {
                        try {
                            val element = jsonParser.parseToJsonElement(jsonStr).jsonObject
                            emit(element)
                        } catch (e: Exception) {
                            // Suppress parse errors for raw keep-alive pings or corrupt chunks
                        }
                    }
                }
            }
        }
    }.flowOn(Dispatchers.IO) // Enforce background execution invariant
}
