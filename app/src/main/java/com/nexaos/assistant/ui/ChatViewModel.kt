package com.nexaos.assistant.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nexaos.assistant.ai.GeminiClient
import com.nexaos.assistant.model.ChatMessage
import com.nexaos.assistant.model.MessageSender
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ChatUiState(
    val messages: List<ChatMessage> = emptyList(),
    val isGenerating: Boolean = false,
    val isConfigured: Boolean = true,
    val errorMessage: String? = null
)

class ChatViewModel(
    private val geminiClient: GeminiClient = GeminiClient()
) : ViewModel() {

    private val _uiState = MutableStateFlow(
        ChatUiState(
            isConfigured = geminiClient.isConfigured(),
            messages = listOf(
                ChatMessage(
                    text = if (geminiClient.isConfigured()) {
                        "NexaOS Mark-I initialized. Systems online and standing by, boss. How can I assist you today?"
                    } else {
                        "NexaOS initialized. Warning: GEMINI_API_KEY is not configured in local.properties. Please add your key to enable Jarvis intelligence."
                    },
                    sender = MessageSender.JARVIS
                )
            )
        )
    )
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    fun sendMessage(inputText: String) {
        val cleanText = inputText.trim()
        if (cleanText.isBlank() || _uiState.value.isGenerating) return

        val userMessage = ChatMessage(
            text = cleanText,
            sender = MessageSender.USER
        )

        val pendingJarvisMessage = ChatMessage(
            text = "Analyzing directive...",
            sender = MessageSender.JARVIS,
            isLoading = true
        )

        // Optimistically append user message & pending spinner
        _uiState.update { state ->
            state.copy(
                messages = state.messages + userMessage + pendingJarvisMessage,
                isGenerating = true,
                errorMessage = null
            )
        }

        viewModelScope.launch {
            val result = geminiClient.sendMessage(
                userMessage = cleanText,
                recentHistory = _uiState.value.messages.dropLast(1)
            )

            result.fold(
                onSuccess = { reply ->
                    _uiState.update { state ->
                        val updatedList = state.messages.dropLast(1) + ChatMessage(
                            text = reply,
                            sender = MessageSender.JARVIS
                        )
                        state.copy(
                            messages = updatedList,
                            isGenerating = false
                        )
                    }
                },
                onFailure = { error ->
                    val failureNotice = error.message ?: "Failed to connect to neural core."
                    _uiState.update { state ->
                        val updatedList = state.messages.dropLast(1) + ChatMessage(
                            text = "Error: $failureNotice",
                            sender = MessageSender.JARVIS,
                            isError = true
                        )
                        state.copy(
                            messages = updatedList,
                            isGenerating = false,
                            errorMessage = failureNotice
                        )
                    }
                }
            )
        }
    }

    fun clearChat() {
        _uiState.update {
            it.copy(
                messages = listOf(
                    ChatMessage(
                        text = "Memory registers cleared, boss. Ready for new instructions.",
                        sender = MessageSender.JARVIS
                    )
                )
            )
        }
    }
}
