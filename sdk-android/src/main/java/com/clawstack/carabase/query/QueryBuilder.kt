package com.clawstack.carabase.query

import com.clawstack.carabase.network.CaraBaseClient
import io.ktor.client.call.body
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType

/**
 * QueryBuilder — CaraBase©™ Android SDK
 * 
 * A fluent, type-safe query builder that mimics the JS SDK.
 * Implements "Security Around Invariants" by utilizing Ktor's 
 * native URL parameter encoding to prevent string injection attacks.
 */
class QueryBuilder internal constructor(
    @PublishedApi internal val client: CaraBaseClient,
    @PublishedApi internal val table: String
) {
    @PublishedApi internal var selectColumns = "*"
    @PublishedApi internal val filters = mutableMapOf<String, String>()
    @PublishedApi internal var limit: Int? = null
    @PublishedApi internal var offset: Int? = null

    /**
     * Specify columns to retrieve.
     */
    fun select(columns: String = "*"): QueryBuilder {
        this.selectColumns = columns
        return this
    }

    /**
     * Add an exact match filter.
     */
    fun eq(column: String, value: Any): QueryBuilder {
        filters[column] = "eq.$value"
        return this
    }

    fun limit(count: Int): QueryBuilder {
        this.limit = count
        return this
    }

    fun offset(count: Int): QueryBuilder {
        this.offset = count
        return this
    }

    /**
     * Executes the SELECT query and attempts to parse the JSON array into a List of T.
     */
    suspend inline fun <reified T> execute(): List<T> {
        val response = client.httpClient.get("/rest/v1/$table") {
            url {
                parameters.append("select", selectColumns)
                filters.forEach { (k, v) -> parameters.append(k, v) }
                limit?.let { parameters.append("limit", it.toString()) }
                offset?.let { parameters.append("offset", it.toString()) }
            }
        }
        return response.body()
    }

    /**
     * Inserts a strictly typed object into the table.
     */
    suspend inline fun <reified T> insert(item: T): T {
        val response = client.httpClient.post("/rest/v1/$table") {
            contentType(ContentType.Application.Json)
            setBody(item)
        }
        return response.body()
    }

    /**
     * Updates rows matching the current filters.
     */
    suspend inline fun <reified T> update(item: T): T {
        val response = client.httpClient.patch("/rest/v1/$table") {
            contentType(ContentType.Application.Json)
            setBody(item)
            url {
                filters.forEach { (k, v) -> parameters.append(k, v) }
            }
        }
        return response.body()
    }

    /**
     * Deletes rows matching the current filters.
     */
    suspend fun delete() {
        client.httpClient.delete("/rest/v1/$table") {
            url {
                filters.forEach { (k, v) -> parameters.append(k, v) }
            }
        }
    }
}
