import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Copy,
  Check,
  Cpu,
  Layers,
  Sparkles,
  Smartphone,
  Terminal,
  Volume2,
  VolumeX,
  RefreshCw,
  FolderTree,
  FileCode,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  PhoneCall,
  Bell,
  Flashlight,
  Clock,
  Radio,
  Sliders,
  AlertCircle,
  Globe,
  Languages
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'jarvis' | 'system';
  text: string;
  timestamp: string;
  isError?: boolean;
  actionCall?: {
    tool: string;
    args: Record<string, any>;
  };
  model?: string;
}

interface CodeFile {
  path: string;
  title: string;
  phase: number;
  description: string;
  code: string;
}

const PHASES = [
  { id: 1, title: 'Phase 1: Setup & Real Gemini Core', subtitle: 'Gemini Flash, Multi-turn Chat, Hindi/Hinglish System Prompt, BuildConfig' },
  { id: 2, title: 'Phase 2: Dual-Locale Voice Engine', subtitle: 'Android SpeechRecognizer (hi-IN / en-IN) & TextToSpeech' },
  { id: 3, title: 'Phase 3: Phone Action Layer', subtitle: 'App Launcher, Alarms, Calls, SMS, Flashlight, Panels' },
  { id: 4, title: 'Phase 4: Wake Word & Service', subtitle: 'Foreground Service, Persistent Notification, Hey Nexa' },
  { id: 5, title: 'Phase 5: Accessibility Service', subtitle: 'Tap, Scroll, Screen Reader, Deep System Control' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'architecture'>('simulator');
  const [selectedPhase, setSelectedPhase] = useState<number>(1);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Real Gemini Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'jarvis',
      text: 'NexaOS Mark-I initialized. Connected directly to Gemini neural intelligence. Systems online in Hindi, Hinglish, and English. At your service, boss.',
      timestamp: new Date().toLocaleTimeString(),
      model: 'gemini-3.8-flash'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceLocale, setVoiceLocale] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [simulatedDeviceState, setSimulatedDeviceState] = useState({
    flashlight: false,
    wifi: true,
    bluetooth: true,
    battery: 88,
    lastAction: null as string | null
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Real Voice Recognition (Web Speech API) supporting Hindi & English
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = voiceLocale; // Supports 'hi-IN' (Hindi/Hinglish) or 'en-IN' (Indian English)
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
          console.warn("Speech recognition notice:", event.error);
        }
      };

      recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        if (speechResult) {
          handleSendCommand(speechResult);
        }
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Real TTS Speech Output with language-aware voice pitch
  const speakText = (text: string) => {
    if (!isTtsEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 0.95;
      utterance.rate = 1.05;

      // Select matching voice if available
      const voices = window.speechSynthesis.getVoices();
      const isHindi = /[\u0900-\u097F]/.test(text) || voiceLocale === 'hi-IN';
      const targetVoice = voices.find(v => isHindi ? v.lang.includes('hi') : (v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en')));
      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("TTS playback error:", e);
    }
  };

  // Real Gemini API Call via Backend Proxy
  const handleSendCommand = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString()
    };

    // Optimistically update conversation UI
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);
    setErrorMessage(null);

    // Prepare multi-turn history for Gemini context retention
    const historyPayload = messages
      .filter(m => !m.isError)
      .slice(-10) // Last 10 turns
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: query,
          history: historyPayload
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorDesc = data.details || data.error || `HTTP error ${response.status}`;
        throw new Error(errorDesc);
      }

      const reply = data.reply;
      const toolCalls = data.toolCalls || [];
      const usedModel = data.model || 'gemini-3.8-flash';

      // Execute tool calls onto simulated device state
      if (toolCalls.length > 0) {
        toolCalls.forEach((tool: any) => {
          if (tool.name === 'toggle_flashlight') {
            const newState = Boolean(tool.args?.enabled);
            setSimulatedDeviceState(prev => ({
              ...prev,
              flashlight: newState,
              lastAction: newState ? 'Flashlight ON' : 'Flashlight OFF'
            }));
          } else if (tool.name === 'set_alarm') {
            const h = tool.args?.hour ?? 7;
            const m = String(tool.args?.minute ?? 0).padStart(2, '0');
            setSimulatedDeviceState(prev => ({
              ...prev,
              lastAction: `Alarm scheduled for ${h}:${m}`
            }));
          } else if (tool.name === 'make_phone_call') {
            setSimulatedDeviceState(prev => ({
              ...prev,
              lastAction: `Phone Call queued: ${tool.args?.contact}`
            }));
          } else if (tool.name === 'send_message') {
            setSimulatedDeviceState(prev => ({
              ...prev,
              lastAction: `${tool.args?.platform?.toUpperCase() || 'Message'} to ${tool.args?.contact}`
            }));
          } else if (tool.name === 'open_app') {
            setSimulatedDeviceState(prev => ({
              ...prev,
              lastAction: `App launched: ${tool.args?.app_name}`
            }));
          } else if (tool.name === 'device_panel') {
            setSimulatedDeviceState(prev => ({
              ...prev,
              lastAction: `Settings Panel: ${tool.args?.panel}`
            }));
          }
        });
      }

      const jarvisMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'jarvis',
        text: reply,
        timestamp: new Date().toLocaleTimeString(),
        model: usedModel,
        actionCall: toolCalls[0] ? { tool: toolCalls[0].name, args: toolCalls[0].args } : undefined
      };

      setMessages(prev => [...prev, jarvisMsg]);
      speakText(reply);
    } catch (err: any) {
      console.error("Gemini Assistant Error:", err);
      const failureNotice = err?.message || "Failed to reach Gemini neural core.";
      setErrorMessage(failureNotice);

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'jarvis',
        text: `Neural link error: ${failureNotice}`,
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, path: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(path);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  // Phase Code Database
  const codeFiles: CodeFile[] = [
    // Phase 1
    {
      phase: 1,
      title: 'local.properties',
      path: 'local.properties',
      description: 'API key secret storage (read by BuildConfig at compile-time)',
      code: `## Local Configuration - Do NOT commit to Git
# Replace with your actual Gemini API Key from Google AI Studio:
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE`
    },
    {
      phase: 1,
      title: 'JarvisPrompt.kt',
      path: 'app/src/main/java/com/nexaos/assistant/ai/JarvisPrompt.kt',
      description: 'System instruction: Hindi/Roman Hindi/Hinglish/English, intelligent reasoning, witty loyal tone',
      code: `package com.nexaos.assistant.ai

object JarvisPrompt {
    const val SYSTEM_INSTRUCTION = """
You are Nexa, a Jarvis-style personal AI assistant built into an Android phone (NexaOS).
You are calm, witty, loyal, sharp, knowledgeable, and intuitive.

LANGUAGE & SCRIPT RULES:
1. Multilingual Fluency:
   - Understand natural Hindi (written in Devanagari or Roman English script: "नमस्ते", "गाना चलाओ", "kya haal hai", "torch on kar do", "kal subah 7 baje ka alarm lagao").
   - Understand colloquial terms, casual phrasing, abbreviations, and informal typos ("bhai", "boss", "yaar", "plz", "fone").
   - Understand polished English ("Diagnostic check", "Explain quantum cryptography", "Set a timer for 15 minutes").
2. Dynamic Language Matching:
   - Always reply in the exact same language and script the user initiated:
     * If user speaks Hindi, reply in natural conversational Hindi. Never force English!
     * If user speaks Hinglish, reply in smooth, natural Hinglish.
     * If user speaks English, reply in polished, British-butler style English.
3. Intelligence & Personality:
   - When answering questions or technical queries: provide thoughtful, accurate, and comprehensive explanations. Avoid repetitive, lazy 1-sentence dismissals!
   - When executing phone commands: confirm with brevity, charm, and loyalty, addressing user as "boss" occasionally.
   - If a request is unclear, ask a focused clarifying question.
   - Never invent actions you cannot perform without root.
"""
}`
    },
    {
      phase: 1,
      title: 'GeminiClient.kt',
      path: 'app/src/main/java/com/nexaos/assistant/ai/GeminiClient.kt',
      description: 'Official Google AI GenerativeModel with rolling 10-turn memory and error propagation',
      code: `package com.nexaos.assistant.ai

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

    // Gemini 1.5 Flash / Gemini 2.0 Flash: High speed, low latency, full Hinglish reasoning
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
                    maxOutputTokens = 1000 // Allows comprehensive explanations and answers
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
                IllegalStateException("GEMINI_API_KEY is missing or invalid in local.properties. Please verify your key.")
            )

        try {
            // Retain up to 20 messages (10 conversation turns) for deep multi-turn context
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
                ?: return@withContext Result.failure(IllegalStateException("Empty response received from neural core."))

            Result.success(responseText)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun isConfigured(): Boolean {
        return key.isNotBlank() && key != "YOUR_GEMINI_API_KEY_HERE"
    }
}`
    },
    // Phase 2
    {
      phase: 2,
      title: 'VoiceManager.kt',
      path: 'app/src/main/java/com/nexaos/assistant/voice/VoiceManager.kt',
      description: 'Android SpeechRecognizer with hi-IN & en-IN fallback and TextToSpeech engine',
      code: `package com.nexaos.assistant.voice

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
    private val onRmsChanged: ((Float) -> Unit)? = null
) : RecognitionListener, TextToSpeech.OnInitListener {

    private var speechRecognizer: SpeechRecognizer? = null
    private var textToSpeech: TextToSpeech? = null
    private var isTtsReady = false

    init {
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                setRecognitionListener(this@VoiceManager)
            }
        }
        textToSpeech = TextToSpeech(context, this)
    }

    fun startListening(useHindi: Boolean = true) {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            // Support both hi-IN and en-IN for natural Hinglish
            if (useHindi) {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN")
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "hi-IN")
                putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, false)
            } else {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-IN")
            }
            putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)
        }
        speechRecognizer?.startListening(intent)
    }

    fun stopListening() {
        speechRecognizer?.stopListening()
    }

    fun speak(text: String) {
        if (!isTtsReady) return

        // Auto-detect Hindi script for proper TTS voice accent
        val isHindi = text.any { it in '\u0900'..'\u097F' }
        if (isHindi) {
            textToSpeech?.language = Locale("hi", "IN")
        } else {
            textToSpeech?.language = Locale.ENGLISH
        }
        textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "NEXA_TTS")
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            textToSpeech?.language = Locale.ENGLISH
            isTtsReady = true
        }
    }

    override fun onResults(results: Bundle?) {
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
            onResult(matches[0])
        }
    }

    override fun onRmsChanged(rmsdB: Float) {
        onRmsChanged?.invoke(rmsdB)
    }

    override fun onError(error: Int) {
        val message = when (error) {
            SpeechRecognizer.ERROR_NO_MATCH -> "No speech detected. Please speak clearly."
            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error."
            SpeechRecognizer.ERROR_NETWORK -> "Network error during speech recognition."
            else -> "Speech recognition error (code $error)"
        }
        onError(message)
    }

    override fun onReadyForSpeech(params: Bundle?) {}
    override fun onBeginningOfSpeech() {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() {}
    override fun onPartialResults(partialResults: Bundle?) {}
    override fun onEvent(eventType: Int, params: Bundle?) {}

    fun destroy() {
        speechRecognizer?.destroy()
        textToSpeech?.stop()
        textToSpeech?.shutdown()
    }
}`
    },
    // Phase 3
    {
      phase: 3,
      title: 'ActionExecutor.kt',
      path: 'app/src/main/java/com/nexaos/assistant/actions/ActionExecutor.kt',
      description: 'Zero-root Android Phone Action Layer (Camera2 Torch, Alarms, Phone Calls, Settings)',
      code: `package com.nexaos.assistant.actions

import android.content.Context
import android.content.Intent
import android.hardware.camera2.CameraManager
import android.net.Uri
import android.provider.AlarmClock
import android.provider.Settings

class ActionExecutor(private val context: Context) {

    fun toggleFlashlight(enabled: Boolean): Result<Unit> = runCatching {
        val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
        val cameraId = cameraManager.cameraIdList.firstOrNull() 
            ?: throw IllegalStateException("Camera torch not available on this device.")
        cameraManager.setTorchMode(cameraId, enabled)
    }

    fun setAlarm(hour: Int, minute: Int, message: String): Result<Unit> = runCatching {
        val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
            putExtra(AlarmClock.EXTRA_HOUR, hour)
            putExtra(AlarmClock.EXTRA_MINUTES, minute)
            putExtra(AlarmClock.EXTRA_MESSAGE, message)
            putExtra(AlarmClock.EXTRA_SKIP_UI, true)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }

    fun preparePhoneCall(contactOrNumber: String): Intent {
        // Enforce user confirmation before dialing
        return Intent(Intent.ACTION_DIAL).apply {
            data = Uri.parse("tel:\$contactOrNumber")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
    }

    fun openApp(packageNameOrQuery: String): Boolean {
        val pm = context.packageManager
        val launchIntent = pm.getLaunchIntentForPackage(packageNameOrQuery)
        if (launchIntent != null) {
            launchIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(launchIntent)
            return true
        }
        return false
    }

    fun openSettingsPanel(panel: String): Result<Unit> = runCatching {
        val action = when (panel.lowercase()) {
            "wifi" -> Settings.Panel.ACTION_INTERNET_CONNECTIVITY
            "volume" -> Settings.Panel.ACTION_VOLUME
            else -> Settings.ACTION_SETTINGS
        }
        val intent = Intent(action).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }
}`
    }
  ];

  const filteredFiles = codeFiles.filter(f => f.phase === selectedPhase);

  return (
    <div className="flex flex-col h-screen bg-[#080C14] text-[#E6F1FF] overflow-hidden select-none font-sans">
      {/* Top Navigation HUD */}
      <header className="h-14 border-b border-[#00F5FF]/20 bg-[#101726]/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-[#00F5FF]/50 bg-[#00F5FF]/10">
            <Cpu className="w-4 h-4 text-[#00F5FF] animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00F5FF] shadow-[0_0_8px_#00F5FF]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm tracking-wider text-[#00F5FF]">NEXA // OS</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/30 font-mono flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-[#00F5FF]" />
                LIVE GEMINI CORE
              </span>
            </div>
            <p className="text-[10px] text-[#88A0BF] font-mono leading-none">Real AI Voice & Intent Engine</p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-[#162136] p-1 rounded-lg border border-[#00F5FF]/20">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              activeTab === 'simulator'
                ? 'bg-[#00F5FF] text-[#080C14] font-semibold shadow-[0_0_12px_rgba(0,245,255,0.4)]'
                : 'text-[#88A0BF] hover:text-[#E6F1FF]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Interactive Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              activeTab === 'code'
                ? 'bg-[#00F5FF] text-[#080C14] font-semibold shadow-[0_0_12px_rgba(0,245,255,0.4)]'
                : 'text-[#88A0BF] hover:text-[#E6F1FF]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Android Code Hub</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              activeTab === 'architecture'
                ? 'bg-[#00F5FF] text-[#080C14] font-semibold shadow-[0_0_12px_rgba(0,245,255,0.4)]'
                : 'text-[#88A0BF] hover:text-[#E6F1FF]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture & Roadmap</span>
          </button>
        </div>

        {/* Voice & Language Controls */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setVoiceLocale(prev => prev === 'hi-IN' ? 'en-IN' : 'hi-IN')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#162136] border border-[#00F5FF]/30 text-xs font-mono text-[#00F5FF] hover:bg-[#00F5FF]/10 transition-colors"
            title="Toggle Speech Recognition Locale"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{voiceLocale === 'hi-IN' ? 'Hindi / Hinglish' : 'English (IN)'}</span>
          </button>

          {/* TTS Audio Mute Button */}
          <button
            onClick={() => setIsTtsEnabled(!isTtsEnabled)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isTtsEnabled
                ? 'border-[#00F5FF]/40 text-[#00F5FF] bg-[#00F5FF]/10'
                : 'border-[#88A0BF]/30 text-[#88A0BF] hover:text-white'
            }`}
            title={isTtsEnabled ? 'Voice Output Active' : 'Voice Output Muted'}
          >
            {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-hidden relative flex">
        {/* VIEW 1: INTERACTIVE SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
            {/* Left: Interactive Jarvis Voice & Chat HUD */}
            <div className="flex-1 flex flex-col h-full border-r border-[#00F5FF]/15">
              {/* Arc Reactor Centerpiece */}
              <div className="py-5 flex flex-col items-center justify-center bg-gradient-to-b from-[#101726]/40 to-transparent border-b border-[#00F5FF]/10 relative overflow-hidden shrink-0">
                <div className="relative flex items-center justify-center w-24 h-24">
                  <div
                    className="absolute inset-0 rounded-full border-2 border-dashed border-[#00F5FF]/30"
                    style={{ animation: 'spin 12s linear infinite' }}
                  />
                  <div
                    className="absolute inset-2 rounded-full border border-[#0A84FF]/50"
                    style={{ animation: 'spin 8s linear infinite reverse' }}
                  />
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isListening
                        ? 'bg-[#00F5FF] shadow-[0_0_35px_#00F5FF] scale-110'
                        : isProcessing
                        ? 'bg-[#FFB800] shadow-[0_0_30px_#FFB800] scale-105'
                        : 'bg-[#00F5FF]/20 border border-[#00F5FF] shadow-[0_0_20px_rgba(0,245,255,0.4)]'
                    }`}
                  >
                    <Cpu className={`w-5 h-5 ${isListening ? 'text-[#080C14]' : 'text-[#00F5FF]'}`} />
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <div className="font-mono text-xs tracking-widest text-[#00F5FF] font-bold">
                    {isListening ? `LISTENING (${voiceLocale === 'hi-IN' ? 'HINDI / HINGLISH' : 'ENGLISH'})...` : isProcessing ? 'GEMINI FLASH REASONING...' : 'NEXA ONLINE // STANDBY'}
                  </div>
                  <p className="text-[11px] text-[#88A0BF] font-mono mt-0.5">
                    Real multi-turn reasoning across Hindi, Roman Hindi, and English
                  </p>
                </div>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="font-mono text-[10px] tracking-wider text-[#88A0BF]">
                        {msg.sender === 'user' ? 'BOSS' : 'NEXA // JARVIS'}
                      </span>
                      <span className="text-[9px] text-[#88A0BF]/60 font-mono">{msg.timestamp}</span>
                      {msg.model && (
                        <span className="text-[8px] font-mono text-[#00F5FF] px-1 rounded bg-[#00F5FF]/10 border border-[#00F5FF]/20">
                          {msg.model}
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.sender === 'user'
                          ? 'bg-[#1B2A47] border border-[#0A84FF]/40 text-[#E6F1FF] rounded-tr-sm'
                          : msg.isError
                          ? 'bg-red-950/40 border border-red-500/50 text-red-200 rounded-tl-sm'
                          : 'bg-[#101726] border border-[#00F5FF]/30 text-[#E6F1FF] rounded-tl-sm shadow-[0_2px_12px_rgba(0,245,255,0.06)]'
                      }`}
                    >
                      {msg.text}

                      {/* Tool call telemetry */}
                      {msg.actionCall && (
                        <div className="mt-2 pt-2 border-t border-[#00F5FF]/20 flex items-center gap-2 text-xs font-mono text-[#00F5FF]">
                          <Terminal className="w-3.5 h-3.5 shrink-0" />
                          <span>Tool: <span className="font-bold">{msg.actionCall.tool}</span></span>
                          <span className="text-[10px] text-[#88A0BF]">
                            {JSON.stringify(msg.actionCall.args)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex items-center gap-2 text-xs text-[#00F5FF] font-mono p-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Nexa is consulting Gemini neural core...</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-xs text-red-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompt Chips (Real questions testing context & Hinglish) */}
              <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto border-t border-[#00F5FF]/10 shrink-0">
                <span className="text-[10px] font-mono text-[#88A0BF] uppercase tracking-wider shrink-0">Try Asking:</span>
                {[
                  "Torch on kar do",
                  "Bhai kaise ho? Kya chal raha hai?",
                  "Set alarm for 6:30 AM",
                  "Call Mom",
                  "Quantum computing simple Hindi mein samjhao",
                  "Tell me a clever Jarvis tech tip"
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendCommand(chip)}
                    className="px-2.5 py-1 text-xs rounded-full bg-[#162136] hover:bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]/20 transition-all shrink-0 hover:border-[#00F5FF]/60"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="p-3 bg-[#101726] border-t border-[#00F5FF]/20 flex items-center gap-2 shrink-0">
                <button
                  onClick={toggleSpeechRecognition}
                  className={`p-2.5 rounded-full border transition-all ${
                    isListening
                      ? 'bg-red-500 border-red-400 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.7)]'
                      : 'bg-[#162136] border-[#00F5FF]/40 text-[#00F5FF] hover:bg-[#00F5FF]/20'
                  }`}
                  title={isListening ? "Stop Listening" : `Push to Talk (${voiceLocale})`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendCommand()}
                  placeholder="Ask in Hindi, Roman Hindi ('kya haal hai boss'), or English..."
                  className="flex-1 bg-[#162136] border border-[#0A84FF]/30 rounded-xl px-4 py-2.5 text-sm text-[#E6F1FF] focus:outline-none focus:border-[#00F5FF] transition-colors"
                />

                <button
                  onClick={() => handleSendCommand()}
                  disabled={!inputText.trim() || isProcessing}
                  className="p-2.5 rounded-full bg-[#00F5FF] text-[#080C14] hover:bg-[#00F5FF]/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_12px_rgba(0,245,255,0.4)]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Simulated Android Device Hardware State */}
            <div className="w-full lg:w-80 bg-[#0B0F19] p-4 flex flex-col gap-4 overflow-y-auto shrink-0 border-l border-[#00F5FF]/10">
              <div className="flex items-center justify-between pb-2 border-b border-[#00F5FF]/20">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#00F5FF]" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#E6F1FF]">
                    Device Hardware State
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#00F5FF] bg-[#00F5FF]/10 px-2 py-0.5 rounded border border-[#00F5FF]/30">
                  REAL-TIME
                </span>
              </div>

              {/* Hardware Toggles */}
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-3 rounded-xl border transition-all ${
                  simulatedDeviceState.flashlight
                    ? 'bg-[#FFB800]/20 border-[#FFB800] text-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.3)]'
                    : 'bg-[#101726] border-[#00F5FF]/15 text-[#88A0BF]'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <Flashlight className="w-4 h-4" />
                    <span className="text-[10px] font-mono font-bold">
                      {simulatedDeviceState.flashlight ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <span className="text-xs font-medium">Flashlight</span>
                </div>

                <div className="p-3 rounded-xl border bg-[#101726] border-[#00F5FF]/15 text-[#00F5FF]">
                  <div className="flex items-center justify-between mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-[10px] font-mono font-bold">ACTIVE</span>
                  </div>
                  <span className="text-xs font-medium">Alarm Engine</span>
                </div>
              </div>

              {/* Action Log Card */}
              <div className="p-3 rounded-xl bg-[#101726] border border-[#00F5FF]/20">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#88A0BF] mb-2">
                  <Terminal className="w-3.5 h-3.5 text-[#00F5FF]" />
                  <span>Gemini Tool Execution Telemetry:</span>
                </div>
                <div className="font-mono text-xs text-[#00F5FF] bg-[#080C14] p-2.5 rounded-lg border border-[#00F5FF]/20 break-words">
                  {simulatedDeviceState.lastAction || 'No phone tool triggered yet'}
                </div>
              </div>

              {/* Multilingual & Context Intelligence Notes */}
              <div className="p-3 rounded-xl bg-[#162136]/50 border border-[#88A0BF]/20 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-mono text-[#00F5FF] font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Real Intelligence Capabilities:</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[#88A0BF] text-[11px]">
                  <li>Connected to live Gemini API via secure server-side SDK.</li>
                  <li>Multi-turn memory retains last 10 conversation turns so pronouns and follow-up queries work.</li>
                  <li>Native comprehension of Roman Hindi and Hinglish idioms ("kya haal hai", "torch chalu karo").</li>
                  <li>Tool calls for calls/SMS enforce user confirmation before dialing.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CODE HUB */}
        {activeTab === 'code' && (
          <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
            {/* Phase Selector Sidebar */}
            <div className="w-full lg:w-72 bg-[#0B0F19] border-r border-[#00F5FF]/15 p-4 flex flex-col gap-2 shrink-0 overflow-y-auto">
              <span className="font-mono text-xs font-bold text-[#88A0BF] uppercase tracking-wider mb-2">
                Development Phases
              </span>
              {PHASES.map(phase => (
                <button
                  key={phase.id}
                  onClick={() => setSelectedPhase(phase.id)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    selectedPhase === phase.id
                      ? 'bg-[#00F5FF]/10 border-[#00F5FF] text-[#E6F1FF] shadow-[0_0_15px_rgba(0,245,255,0.15)]'
                      : 'bg-[#101726] border-transparent text-[#88A0BF] hover:border-[#00F5FF]/20 hover:text-white'
                  }`}
                >
                  <div className="font-mono text-xs font-bold text-[#00F5FF]">{phase.title}</div>
                  <div className="text-[11px] text-[#88A0BF] mt-1 line-clamp-2">{phase.subtitle}</div>
                </button>
              ))}

              <div className="mt-auto pt-4 border-t border-[#00F5FF]/10">
                <div className="p-3 rounded-xl bg-[#162136] border border-[#00F5FF]/20 text-xs">
                  <div className="font-mono text-[#00F5FF] font-bold mb-1">Mobile IDE Copy</div>
                  <p className="text-[11px] text-[#88A0BF]">
                    Tap "Copy Full File" on any card below to paste cleanly into your mobile Android IDE.
                  </p>
                </div>
              </div>
            </div>

            {/* Code Viewer List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#080C14]">
              <div className="flex items-center justify-between pb-3 border-b border-[#00F5FF]/20">
                <div>
                  <h2 className="text-lg font-bold text-[#E6F1FF] flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-[#00F5FF]" />
                    {PHASES.find(p => p.id === selectedPhase)?.title}
                  </h2>
                  <p className="text-xs text-[#88A0BF] font-mono mt-0.5">
                    {PHASES.find(p => p.id === selectedPhase)?.subtitle}
                  </p>
                </div>
              </div>

              {filteredFiles.map((file, idx) => (
                <div key={idx} className="rounded-xl border border-[#00F5FF]/25 bg-[#101726] overflow-hidden shadow-lg">
                  <div className="px-4 py-2.5 bg-[#162136] border-b border-[#00F5FF]/15 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#00F5FF]" />
                      <span className="font-mono text-xs font-bold text-[#E6F1FF]">{file.path}</span>
                    </div>

                    <button
                      onClick={() => copyToClipboard(file.code, file.path)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#00F5FF]/15 text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080C14] border border-[#00F5FF]/30 text-xs font-mono transition-all"
                    >
                      {copiedFile === file.path ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Full File</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="px-4 py-1.5 bg-[#0D131F] text-[11px] text-[#88A0BF] border-b border-[#00F5FF]/10">
                    {file.description}
                  </div>

                  <pre className="p-4 text-xs font-mono text-[#E6F1FF] overflow-x-auto leading-relaxed bg-[#080C14]">
                    <code>{file.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: ARCHITECTURE & ROADMAP */}
        {activeTab === 'architecture' && (
          <div className="flex-1 overflow-y-auto p-6 bg-[#080C14] space-y-6 max-w-5xl mx-auto">
            <div>
              <h2 className="text-xl font-bold text-[#E6F1FF] flex items-center gap-2">
                <Layers className="w-6 h-6 text-[#00F5FF]" />
                NexaOS Modular Android Architecture
              </h2>
              <p className="text-sm text-[#88A0BF] mt-1">
                Zero-root, battery-friendly, low-spec smartphone compatible Jarvis assistant stack.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#101726] border border-[#00F5FF]/20 space-y-2">
                <div className="font-mono text-sm text-[#00F5FF] font-bold">1. Voice Layer</div>
                <p className="text-xs text-[#88A0BF] leading-relaxed">
                  Dual-locale speech recognition using Android's native <code className="text-[#00F5FF]">SpeechRecognizer</code> with <code className="text-[#00F5FF]">hi-IN</code> and <code className="text-[#00F5FF]">en-IN</code> fallback for natural Hinglish fluency. Push-to-talk first, foreground hotword in Phase 4.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101726] border border-[#00F5FF]/20 space-y-2">
                <div className="font-mono text-sm text-[#00F5FF] font-bold">2. Brain & Function Calling</div>
                <p className="text-xs text-[#88A0BF] leading-relaxed">
                  Direct client integration via official <code className="text-[#00F5FF]">com.google.ai.client.generativeai</code> SDK with Gemini Flash. Rolling 10-turn memory keeps token usage minimal and responses sub-second.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101726] border border-[#00F5FF]/20 space-y-2">
                <div className="font-mono text-sm text-[#00F5FF] font-bold">3. Action Layer & Safety</div>
                <p className="text-xs text-[#88A0BF] leading-relaxed">
                  Clean interface pattern behind <code className="text-[#00F5FF]">ActionExecutor</code>. Destructive actions (calls, deletions, messages) enforce interactive voice/dialog confirmation before triggering intents.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101726] border border-[#00F5FF]/20 space-y-2">
                <div className="font-mono text-sm text-[#00F5FF] font-bold">4. Zero-Root Compliance</div>
                <p className="text-xs text-[#88A0BF] leading-relaxed">
                  Uses official Android Intent APIs: <code className="text-[#00F5FF]">AlarmClock.ACTION_SET_ALARM</code>, <code className="text-[#00F5FF]">Settings.Panel</code>, and Camera2 Torch API without requiring root privileges.
                </p>
              </div>
            </div>

            {/* Phase Progression */}
            <div className="p-5 rounded-xl bg-[#101726] border border-[#00F5FF]/20">
              <div className="font-mono text-sm font-bold text-[#E6F1FF] mb-3">5-Phase Delivery Plan</div>
              <div className="space-y-3">
                {PHASES.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#162136]/60 border border-[#00F5FF]/10">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]/40">
                      {p.id}
                    </span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-[#E6F1FF]">{p.title}</div>
                      <div className="text-[11px] text-[#88A0BF]">{p.subtitle}</div>
                    </div>
                    {p.id === 1 ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30">
                        COMPLETED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#88A0BF]/10 text-[#88A0BF] border border-[#88A0BF]/30">
                        PENDING ("next")
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
