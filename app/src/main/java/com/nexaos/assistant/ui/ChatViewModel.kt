package com.nexaos.assistant.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nexaos.assistant.ai.GeminiClient
import com.nexaos.assistant.model.ChatMessage
import com.nexaos.assistant.model.MessageSender
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ChatUiState(
    val messages: List<ChatMessage> = emptyList(),
    val isGenerating: Boolean = false,
    val isListening: Boolean = false,
    val isConfigured: Boolean = true,
    val voiceLocale: String = "hi-IN", // "hi-IN" (Hindi/Hinglish) or "en-IN" (Indian English)
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
                        "NexaOS Mark-I initialized. Connected directly to Gemini neural intelligence. Systems online in Hindi, Hinglish, and English. At your service, boss."
                    } else {
                        "NexaOS initialized. Warning: GEMINI_API_KEY is not set in local.properties. Add your key and rebuild to activate full neural capabilities."
                    },
                    sender = MessageSender.JARVIS
                )
            )
        )
    )
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    // Shared flow to trigger TextToSpeech on new Gemini answers
    private val _speakEvent = MutableSharedFlow<String>(extraBufferCapacity = 1)
    val speakEvent: SharedFlow<String> = _speakEvent.asSharedFlow()

    fun setVoiceLocale(locale: String) {
        _uiState.update { it.copy(voiceLocale = locale) }
    }

    fun setListeningState(isListening: Boolean) {
        _uiState.update { it.copy(isListening = isListening) }
    }

    fun sendMessage(inputText: String) {
        val cleanText = inputText.trim()
        if (cleanText.isBlank() || _uiState.value.isGenerating) return

        val userMessage = ChatMessage(
            text = cleanText,
            sender = MessageSender.USER
        )

        val pendingJarvisMessage = ChatMessage(
            text = "Analyzing directive with Gemini...",
            sender = MessageSender.JARVIS,
            isLoading = true
        )

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
                    _speakEvent.tryEmit(reply)
                },
                onFailure = { error ->
                    val failureNotice = error.message ?: "Failed to connect to neural core."
                    _uiState.update { state ->
                        val updatedList = state.messages.dropLast(1) + ChatMessage(
                            text = "Neural link error: $failureNotice",
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
                ),
                errorMessage = null
            )
        }
    }
}
