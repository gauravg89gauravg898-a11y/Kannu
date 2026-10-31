package com.nexaos.assistant.ai

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import com.google.ai.client.generativeai.type.generationConfig
import com.nexaos.assistant.BuildConfig
import com.nexaos.assistant.model.ChatMessage
import com.nexaos.assistant.model.MessageSender
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class GeminiClient(
    apiKey: String = BuildConfig.GEMINI_API_KEY
) {
    private val key = apiKey.trim()

    // Official Google AI GenerativeModel
    // gemini-1.5-flash is fast, battery-efficient, and supports native multilingual comprehension
    private val generativeModel: GenerativeModel? by lazy {
        if (key.isBlank() || key == "YOUR_GEMINI_API_KEY_HERE") {
            null
        } else {
            GenerativeModel(
                modelName = "gemini-1.5-flash",
                apiKey = key,
                generationConfig = generationConfig {
                    temperature = 0.7f
                    topK = 40
                    topP = 0.95f
                    maxOutputTokens = 1000 // Enables complete, detailed answers without truncation
                },
                systemInstruction = content { text(JarvisPrompt.SYSTEM_INSTRUCTION) }
            )
        }
    }

    suspend fun sendMessage(
        userMessage: String,
        recentHistory: List<ChatMessage> = emptyList()
    ): Result<String> = withContext(Dispatchers.IO) {
        val model = generativeModel
            ?: return@withContext Result.failure(
                IllegalStateException("GEMINI_API_KEY is not configured in local.properties. Please verify your API key.")
            )

        try {
            // Retain last ~10 turns (20 messages max) for deep conversational context retention
            val trimmedHistory = recentHistory
                .filter { it.sender == MessageSender.USER || it.sender == MessageSender.JARVIS }
                .takeLast(20)
                .map { msg ->
                    val role = if (msg.sender == MessageSender.USER) "user" else "model"
                    content(role = role) {
                        text(msg.text)
                    }
                }

            val chat = model.startChat(history = trimmedHistory)
            val response = chat.sendMessage(userMessage)
            val responseText = response.text?.trim()
                ?: return@withContext Result.failure(
                    IllegalStateException("No response received from Gemini neural core.")
                )

            Result.success(responseText)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun isConfigured(): Boolean {
        return key.isNotBlank() && key != "YOUR_GEMINI_API_KEY_HERE"
    }
}
