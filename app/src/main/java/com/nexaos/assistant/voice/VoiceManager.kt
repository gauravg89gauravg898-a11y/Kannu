package com.nexaos.assistant.voice

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import java.util.Locale

class VoiceManager(
    private val context: Context,
    private val onResult: (String) -> Unit,
    private val onError: (String) -> Unit,
    private val onRmsChanged: ((Float) -> Unit)? = null,
    private val onListeningStateChanged: ((Boolean) -> Unit)? = null
) : RecognitionListener, TextToSpeech.OnInitListener {

    private var speechRecognizer: SpeechRecognizer? = null
    private var textToSpeech: TextToSpeech? = null
    private var isTtsReady = false
    private var isListening = false

    init {
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                setRecognitionListener(this@VoiceManager)
            }
        }
        textToSpeech = TextToSpeech(context, this)
    }

    fun startListening(locale: String = "hi-IN") {
        if (speechRecognizer == null) {
            onError("Speech recognition service is not available on this device.")
            return
        }

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, locale)
            putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, false)
            putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        }

        try {
            speechRecognizer?.startListening(intent)
            isListening = true
            onListeningStateChanged?.invoke(true)
        } catch (e: Exception) {
            isListening = false
            onListeningStateChanged?.invoke(false)
            onError(e.message ?: "Failed to start microphone listener.")
        }
    }

    fun stopListening() {
        if (isListening) {
            speechRecognizer?.stopListening()
            isListening = false
            onListeningStateChanged?.invoke(false)
        }
    }

    fun speak(text: String) {
        if (!isTtsReady || text.isBlank()) return

        // Auto-detect Devanagari Hindi characters for optimal TTS voice accent
        val isHindi = text.any { it in '\u0900'..'\u097F' }
        if (isHindi) {
            textToSpeech?.language = Locale("hi", "IN")
        } else {
            textToSpeech?.language = Locale.ENGLISH
        }

        textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "NEXA_VOICE_UTTERANCE")
    }

    fun stopSpeaking() {
        textToSpeech?.stop()
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            textToSpeech?.language = Locale.ENGLISH
            textToSpeech?.setPitch(0.95f)
            textToSpeech?.setSpeechRate(1.0f)
            isTtsReady = true
        }
    }

    override fun onResults(results: Bundle?) {
        isListening = false
        onListeningStateChanged?.invoke(false)
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
            val spokenText = matches[0].trim()
            if (spokenText.isNotBlank()) {
                onResult(spokenText)
            }
        }
    }

    override fun onRmsChanged(rmsdB: Float) {
        onRmsChanged?.invoke(rmsdB)
    }

    override fun onError(error: Int) {
        isListening = false
        onListeningStateChanged?.invoke(false)
        val errorMessage = when (error) {
            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error. Check microphone."
            SpeechRecognizer.ERROR_CLIENT -> "Client error in speech service."
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "RECORD_AUDIO permission required."
            SpeechRecognizer.ERROR_NETWORK -> "Network error during speech recognition."
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout while processing voice."
            SpeechRecognizer.ERROR_NO_MATCH -> "No spoken words recognized. Please speak clearly."
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Speech recognizer is busy. Resetting..."
            SpeechRecognizer.ERROR_SERVER -> "Google speech server error."
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech detected. Timeout."
            else -> "Speech recognition error code: $error"
        }
        onError(errorMessage)
    }

    override fun onReadyForSpeech(params: Bundle?) {}
    override fun onBeginningOfSpeech() {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() {
        isListening = false
        onListeningStateChanged?.invoke(false)
    }
    override fun onPartialResults(partialResults: Bundle?) {}
    override fun onEvent(eventType: Int, params: Bundle?) {}

    fun destroy() {
        speechRecognizer?.destroy()
        textToSpeech?.stop()
        textToSpeech?.shutdown()
    }
}
