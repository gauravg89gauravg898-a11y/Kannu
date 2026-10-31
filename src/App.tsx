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
  Sliders
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'jarvis' | 'system';
  text: string;
  timestamp: string;
  actionCall?: {
    tool: string;
    args: Record<string, any>;
  };
}

interface CodeFile {
  path: string;
  title: string;
  phase: number;
  description: string;
  code: string;
}

const PHASES = [
  { id: 1, title: 'Phase 1: Setup & Text Chat', subtitle: 'Gemini Client, Jetpack Compose UI, BuildConfig' },
  { id: 2, title: 'Phase 2: Voice In & Out', subtitle: 'Android SpeechRecognizer (hi-IN/en-IN) & TextToSpeech' },
  { id: 3, title: 'Phase 3: Phone Action Layer', subtitle: 'App Launcher, Alarms, Calls, SMS, Flashlight, Panels' },
  { id: 4, title: 'Phase 4: Wake Word & Service', subtitle: 'Foreground Service, Persistent Notification, Hey Nexa' },
  { id: 5, title: 'Phase 5: Accessibility Service', subtitle: 'Tap, Scroll, Screen Reader, Deep System Control' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'architecture'>('simulator');
  const [selectedPhase, setSelectedPhase] = useState<number>(1);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Simulator State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'jarvis',
      text: 'NexaOS Mark-I initialized. All systems online and standing by, boss. How may I assist you?',
      timestamp: '10:00:00'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
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
  }, [messages]);

  // Speech Recognition (Web Speech API)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition isn't supported in this browser. Please type your command.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; // Indian English / Hinglish fallback
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

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

  // TTS Speech Output
  const speakText = (text: string) => {
    if (!isTtsEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.95;
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  // Process Command (Rule-based / simulated Jarvis logic mirroring Android Gemini function calls)
  const handleSendCommand = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let reply = '';
      let actionCall: { tool: string; args: Record<string, any> } | undefined = undefined;

      // Intent parsing matching Gemini Function Calling schema in Android
      if (lower.includes('torch') || lower.includes('flashlight')) {
        const turnOn = !lower.includes('off') && !lower.includes('band');
        setSimulatedDeviceState(prev => ({
          ...prev,
          flashlight: turnOn,
          lastAction: turnOn ? 'Flashlight ON' : 'Flashlight OFF'
        }));
        actionCall = { tool: 'toggleFlashlight', args: { enabled: turnOn } };
        reply = turnOn ? "Torch enabled, boss. Lighting up the area." : "Torch switched off, boss.";
      } else if (lower.includes('call') || lower.includes('phone') || lower.includes('lagao')) {
        const contact = lower.includes('mom') ? 'Mom' : lower.includes('dad') ? 'Dad' : 'Contact';
        actionCall = { tool: 'callContact', args: { name: contact, confirmFirst: true } };
        reply = `Should I place a call to ${contact}, boss? Please confirm before dialing.`;
        setSimulatedDeviceState(prev => ({ ...prev, lastAction: `Call prompt: ${contact}` }));
      } else if (lower.includes('alarm') || lower.includes('timer')) {
        actionCall = { tool: 'setAlarm', args: { hour: 7, minute: 0, label: 'Jarvis Morning' } };
        reply = "Alarm set for 07:00 AM, boss. I will ensure you are awakened on schedule.";
        setSimulatedDeviceState(prev => ({ ...prev, lastAction: 'Alarm set for 07:00 AM' }));
      } else if (lower.includes('whatsapp') || lower.includes('message') || lower.includes('sms')) {
        actionCall = { tool: 'sendWhatsApp', args: { contact: 'Boss', message: 'Hello' } };
        reply = "Ready to dispatch message via WhatsApp, boss. Kindly confirm the payload text.";
        setSimulatedDeviceState(prev => ({ ...prev, lastAction: 'WhatsApp intent queued' }));
      } else if (lower.includes('youtube') || lower.includes('music') || lower.includes('gaana')) {
        actionCall = { tool: 'openAppOrMedia', args: { app: 'YouTube', query: 'Lofi Jarvis Beats' } };
        reply = "Launching YouTube, boss. Queueing up your playback.";
        setSimulatedDeviceState(prev => ({ ...prev, lastAction: 'YouTube launched' }));
      } else if (lower.includes('kaise ho') || lower.includes('kya haal')) {
        reply = "Main bilkul badhiya hoon, boss! Sabhi systems 100% operational hain. Batayein kya seva karein?";
      } else if (lower.includes('who are you') || lower.includes('kaun ho')) {
        reply = "I am Nexa, your personal AI co-pilot on NexaOS. Calm, witty, and at your command, boss.";
      } else if (lower.includes('battery') || lower.includes('charge')) {
        reply = `Power cells currently stand at ${simulatedDeviceState.battery}%, boss. Plenty of juice left.`;
      } else {
        reply = "Understood, boss. Processed through neural core and cataloged for immediate execution.";
      }

      const jarvisMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'jarvis',
        text: reply,
        timestamp: new Date().toLocaleTimeString(),
        actionCall
      };

      setMessages(prev => [...prev, jarvisMsg]);
      setIsProcessing(false);
      speakText(reply);
    }, 700);
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
      title: 'app/build.gradle.kts',
      path: 'app/build.gradle.kts',
      description: 'Reads local.properties and imports Google AI client SDK',
      code: `import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

val localProperties = Properties().apply {
    val propFile = rootProject.file("local.properties")
    if (propFile.exists()) {
        propFile.inputStream().use { load(it) }
    }
}

android {
    namespace = "com.nexaos.assistant"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.nexaos.assistant"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        val apiKey: String = localProperties.getProperty("GEMINI_API_KEY") 
            ?: System.getenv("GEMINI_API_KEY") 
            ?: ""
        buildConfigField("String", "GEMINI_API_KEY", "\\"$apiKey\\"")
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation("com.google.ai.client.generativeai:generativeai:0.9.0")
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.kotlinx.coroutines.android)
}`
    },
    {
      phase: 1,
      title: 'AndroidManifest.xml',
      path: 'app/src/main/AndroidManifest.xml',
      description: 'Network permissions and adjustResize activity configuration',
      code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="NexaOS"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.Material.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
    },
    {
      phase: 1,
      title: 'JarvisPrompt.kt',
      path: 'app/src/main/java/com/nexaos/assistant/ai/JarvisPrompt.kt',
      description: 'System instruction: Hindi/Hinglish/English, under 2 sentences, calls boss',
      code: `package com.nexaos.assistant.ai

object JarvisPrompt {
    const val SYSTEM_INSTRUCTION = """
You are Nexa, a Jarvis-style personal AI assistant built into an Android phone (NexaOS).
You are calm, witty, loyal, sharp, and concise.

PERSONALITY RULES:
1. Spoken and text replies must be under 2 short sentences. Never be verbose.
2. Reply in the exact same language the user uses:
   - If user speaks Hindi (Devanagari or Romanized), reply in natural conversational Hindi.
   - If user speaks Hinglish ("kya haal hai boss", "gaana chalao"), reply in smooth Hinglish.
   - If user speaks English, reply in polished, British-butler style conversational English.
3. Call the user "boss" occasionally, with understated loyalty and charm.
4. Never invent or hallucinate actions you cannot perform.
5. If something is impossible on Android without root, state it clearly and provide legal workarounds.
"""
}`
    },
    {
      phase: 1,
      title: 'GeminiClient.kt',
      path: 'app/src/main/java/com/nexaos/assistant/ai/GeminiClient.kt',
      description: 'Google AI GenerativeModel with rolling 10-turn memory buffer',
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

    private val generativeModel: GenerativeModel? by lazy {
        if (key.isBlank() || key == "YOUR_GEMINI_API_KEY_HERE") null
        else GenerativeModel(
            modelName = "gemini-1.5-flash",
            apiKey = key,
            generationConfig = generationConfig {
                temperature = 0.7f
                maxOutputTokens = 150
            },
            systemInstruction = content { text(JarvisPrompt.SYSTEM_INSTRUCTION) }
        )
    }

    suspend fun sendMessage(
        userMessage: String,
        recentHistory: List<ChatMessage> = emptyList()
    ): Result<String> = withContext(Dispatchers.IO) {
        val model = generativeModel 
            ?: return@withContext Result.failure(IllegalStateException("GEMINI_API_KEY is missing in local.properties."))

        try {
            val trimmedHistory = recentHistory
                .filter { it.sender == MessageSender.USER || it.sender == MessageSender.JARVIS }
                .takeLast(20)
                .map { msg ->
                    content(role = if (msg.sender == MessageSender.USER) "user" else "model") {
                        text(msg.text)
                    }
                }

            val chat = model.startChat(history = trimmedHistory)
            val response = chat.sendMessage(userMessage)
            Result.success(response.text?.trim() ?: "At your service, boss.")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}`
    },
    {
      phase: 1,
      title: 'MainActivity.kt',
      path: 'app/src/main/java/com/nexaos/assistant/MainActivity.kt',
      description: 'Jetpack Compose entry point with edge-to-edge support',
      code: `package com.nexaos.assistant

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.nexaos.assistant.ui.JarvisScreen
import com.nexaos.assistant.ui.theme.NexaOSTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            NexaOSTheme {
                JarvisScreen()
            }
        }
    }
}`
    },
    // Phase 2 Preview
    {
      phase: 2,
      title: 'VoiceManager.kt',
      path: 'app/src/main/java/com/nexaos/assistant/voice/VoiceManager.kt',
      description: 'Android SpeechRecognizer (hi-IN/en-IN) & TextToSpeech bridge',
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
    private val onError: (String) -> Unit
) : RecognitionListener, TextToSpeech.OnInitListener {

    private var speechRecognizer: SpeechRecognizer? = null
    private var textToSpeech: TextToSpeech? = null
    private var isTtsReady = false

    init {
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
            setRecognitionListener(this@VoiceManager)
        }
        textToSpeech = TextToSpeech(context, this)
    }

    fun startListening() {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-IN")
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "hi-IN")
            putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)
        }
        speechRecognizer?.startListening(intent)
    }

    fun stopListening() = speechRecognizer?.stopListening()

    fun speak(text: String) {
        if (isTtsReady) {
            textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "NEXA_TTS")
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            textToSpeech?.language = Locale.ENGLISH
            isTtsReady = true
        }
    }

    override fun onResults(results: Bundle?) {
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) onResult(matches[0])
    }

    override fun onError(error: Int) {
        onError("Voice recognition code: $error")
    }

    override fun onReadyForSpeech(params: Bundle?) {}
    override fun onBeginningOfSpeech() {}
    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() {}
    override fun onPartialResults(partialResults: Bundle?) {}
    override fun onEvent(eventType: Int, params: Bundle?) {}
}`
    },
    // Phase 3 Preview
    {
      phase: 3,
      title: 'ActionExecutor.kt',
      path: 'app/src/main/java/com/nexaos/assistant/actions/ActionExecutor.kt',
      description: 'Safe Action layer: App launch, Phone calls, SMS, Alarms, Flashlight',
      code: `package com.nexaos.assistant.actions

import android.content.Context
import android.content.Intent
import android.hardware.camera2.CameraManager
import android.net.Uri
import android.provider.AlarmClock
import android.provider.Settings

class ActionExecutor(private val context: Context) {

    fun openApp(appName: String): Boolean {
        val pm = context.packageManager
        val intent = pm.getLaunchIntentForPackage(appName) ?: return false
        context.startActivity(intent)
        return true
    }

    fun setAlarm(hour: Int, minute: Int, message: String) {
        val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
            putExtra(AlarmClock.EXTRA_HOUR, hour)
            putExtra(AlarmClock.EXTRA_MINUTES, minute)
            putExtra(AlarmClock.EXTRA_MESSAGE, message)
            putExtra(AlarmClock.EXTRA_SKIP_UI, true)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }

    fun toggleFlashlight(enabled: Boolean) {
        val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
        val cameraId = cameraManager.cameraIdList[0]
        cameraManager.setTorchMode(cameraId, enabled)
    }

    fun openSettingsPanel() {
        val intent = Intent(Settings.Panel.ACTION_INTERNET_CONNECTIVITY).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }
}`
    }
  ];

  const filteredFiles = codeFiles.filter(f => f.phase === selectedPhase);

  return (
    <div className="flex flex-col h-screen bg-[#080C14] text-[#E6F1FF] overflow-hidden select-none">
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
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/30 font-mono">
                JARVIS CORE
              </span>
            </div>
            <p className="text-[10px] text-[#88A0BF] font-mono leading-none">AI Android Voice Assistant</p>
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTtsEnabled(!isTtsEnabled)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isTtsEnabled
                ? 'border-[#00F5FF]/40 text-[#00F5FF] bg-[#00F5FF]/10'
                : 'border-[#88A0BF]/30 text-[#88A0BF] hover:text-white'
            }`}
            title={isTtsEnabled ? 'Voice Voice On' : 'Voice Voice Muted'}
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
              <div className="py-6 flex flex-col items-center justify-center bg-gradient-to-b from-[#101726]/40 to-transparent border-b border-[#00F5FF]/10 relative overflow-hidden shrink-0">
                <div className="relative flex items-center justify-center w-28 h-28">
                  {/* Rotating rings */}
                  <div
                    className="absolute inset-0 rounded-full border-2 border-dashed border-[#00F5FF]/30"
                    style={{ animation: 'spin 12s linear infinite' }}
                  />
                  <div
                    className="absolute inset-2 rounded-full border border-[#0A84FF]/50"
                    style={{ animation: 'spin 8s linear infinite reverse' }}
                  />
                  {/* Glowing Core */}
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isListening
                        ? 'bg-[#00F5FF] shadow-[0_0_35px_#00F5FF] scale-110'
                        : isProcessing
                        ? 'bg-[#FFB800] shadow-[0_0_30px_#FFB800] scale-105'
                        : 'bg-[#00F5FF]/20 border border-[#00F5FF] shadow-[0_0_20px_rgba(0,245,255,0.4)]'
                    }`}
                  >
                    <Cpu className={`w-6 h-6 ${isListening ? 'text-[#080C14]' : 'text-[#00F5FF]'}`} />
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <div className="font-mono text-xs tracking-widest text-[#00F5FF] font-bold">
                    {isListening ? 'LISTENING TO BOSS...' : isProcessing ? 'NEURAL ENGINE REASONING...' : 'NEXA VOICE STANDBY'}
                  </div>
                  <p className="text-[11px] text-[#88A0BF] font-mono mt-0.5">
                    Hinglish, Hindi, and English natural speech comprehension
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
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#1B2A47] border border-[#0A84FF]/40 text-[#E6F1FF] rounded-tr-sm'
                          : 'bg-[#101726] border border-[#00F5FF]/30 text-[#E6F1FF] rounded-tl-sm shadow-[0_2px_12px_rgba(0,245,255,0.06)]'
                      }`}
                    >
                      {msg.text}

                      {/* Tool call badge */}
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
                    <span>Nexa is evaluating device permissions & context...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto border-t border-[#00F5FF]/10 shrink-0">
                <span className="text-[10px] font-mono text-[#88A0BF] uppercase tracking-wider shrink-0">Quick Commands:</span>
                {[
                  "Torch on karo",
                  "Call Mom",
                  "Set alarm for 7 AM",
                  "Kaise ho boss?",
                  "Open YouTube",
                  "Battery status?"
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
                  title="Push to Talk"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendCommand()}
                  placeholder="Ask Nexa in Hindi, Hinglish, or English..."
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

            {/* Right: Simulated Android Device State & Action Monitor */}
            <div className="w-full lg:w-80 bg-[#0B0F19] p-4 flex flex-col gap-4 overflow-y-auto shrink-0 border-l border-[#00F5FF]/10">
              <div className="flex items-center justify-between pb-2 border-b border-[#00F5FF]/20">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#00F5FF]" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#E6F1FF]">
                    Phone Hardware State
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
                  <span className="text-xs font-medium">Alarm Clock</span>
                </div>
              </div>

              {/* Action Log Card */}
              <div className="p-3 rounded-xl bg-[#101726] border border-[#00F5FF]/20">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#88A0BF] mb-2">
                  <Terminal className="w-3.5 h-3.5 text-[#00F5FF]" />
                  <span>Last Executed Android Intent:</span>
                </div>
                <div className="font-mono text-xs text-[#00F5FF] bg-[#080C14] p-2.5 rounded-lg border border-[#00F5FF]/20 break-words">
                  {simulatedDeviceState.lastAction || 'No phone action executed yet'}
                </div>
              </div>

              {/* Android Safety Boundary Notes */}
              <div className="p-3 rounded-xl bg-[#162136]/50 border border-[#88A0BF]/20 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-mono text-[#00F5FF] font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Android OS Hard Constraints:</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[#88A0BF] text-[11px]">
                  <li>Calls & SMS require interactive user confirmation before triggering Intent.</li>
                  <li>Direct Wi-Fi / Bluetooth toggle without prompt is restricted on Android 10+; Nexa opens the official Settings.Panel instead.</li>
                  <li>All Gemini API calls stay verified via Android BuildConfig.</li>
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
                  <div className="font-mono text-[#00F5FF] font-bold mb-1">Mobile IDE Tip</div>
                  <p className="text-[11px] text-[#88A0BF]">
                    Tap "Copy Code" on any file below and paste directly into AIDE, AndroidIDE or Termux.
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
                  {/* Card Header */}
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

                  {/* Preformatted Code Box */}
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
                  Dual-locale speech recognition using Android's native <code className="text-[#00F5FF]">SpeechRecognizer</code> with <code className="text-[#00F5FF]">en-IN</code> and <code className="text-[#00F5FF]">hi-IN</code> fallback for natural Hinglish fluency. Push-to-talk first, foreground hotword in Phase 4.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#101726] border border-[#00F5FF]/20 space-y-2">
                <div className="font-mono text-sm text-[#00F5FF] font-bold">2. Brain & Function Calling</div>
                <p className="text-xs text-[#88A0BF] leading-relaxed">
                  Direct client integration via official <code className="text-[#00F5FF]">com.google.ai.client.generativeai</code> SDK with Gemini 1.5 Flash. Rolling 10-turn memory keeps token usage minimal and responses sub-second.
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
