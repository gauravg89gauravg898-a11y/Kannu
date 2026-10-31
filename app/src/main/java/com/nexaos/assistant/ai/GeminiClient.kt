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
    // gemini-1.5-flash is lightweight, blazing fast on mobile connections, and budget-friendly
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
                    maxOutputTokens = 150 // Keep replies snappy and under 2 sentences
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
                IllegalStateException("GEMINI_API_KEY is missing or not set in local.properties. Please add GEMINI_API_KEY=your_key to local.properties and rebuild.")
            )

        try {
            // Retain last ~10 turns (user & jarvis only) for lightweight mobile context window
            val trimmedHistory = recentHistory
                .filter { it.sender == MessageSender.USER || it.sender == MessageSender.JARVIS }
                .takeLast(20)
                .map { msg ->
                    val role = if (msg.sender == MessageSender.USER) "user" else "model"
                    content(role = role) {
                        text(msg.text)
                    }
                }

            // Start chat session with trimmed history
            val chat = model.startChat(history = trimmedHistory)
            val response = chat.sendMessage(userMessage)
            val responseText = response.text?.trim() ?: "At your service, boss."

            Result.success(responseText)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun isConfigured(): Boolean {
        return key.isNotBlank() && key != "YOUR_GEMINI_API_KEY_HERE"
    }
}
