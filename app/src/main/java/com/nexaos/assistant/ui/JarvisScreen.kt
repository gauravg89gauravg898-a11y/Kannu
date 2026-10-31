package com.nexaos.assistant.ui

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.nexaos.assistant.ui.components.ChatBubble
import com.nexaos.assistant.ui.components.JarvisArcReactor
import com.nexaos.assistant.ui.theme.AlertAmber
import com.nexaos.assistant.ui.theme.ArcBlue
import com.nexaos.assistant.ui.theme.ArcCyan
import com.nexaos.assistant.ui.theme.DangerRed
import com.nexaos.assistant.ui.theme.DeepVoidBlack
import com.nexaos.assistant.ui.theme.SurfaceDark
import com.nexaos.assistant.ui.theme.SurfaceDarkCard
import com.nexaos.assistant.ui.theme.TextMuted
import com.nexaos.assistant.ui.theme.TextPrimary
import com.nexaos.assistant.voice.VoiceManager

@Composable
fun JarvisScreen(
    viewModel: ChatViewModel = viewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    var inputQuery by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    // Initialize VoiceManager with dual-locale support
    val voiceManager = remember {
        VoiceManager(
            context = context,
            onResult = { spokenText ->
                viewModel.sendMessage(spokenText)
            },
            onError = { err ->
                // Handled gracefully without crashing
            },
            onListeningStateChanged = { listening ->
                viewModel.setListeningState(listening)
            }
        )
    }

    // Clean up VoiceManager resources when screen disposes
    DisposableEffect(voiceManager) {
        onDispose {
            voiceManager.destroy()
        }
    }

    // Auto-speak new Gemini replies
    LaunchedEffect(Unit) {
        viewModel.speakEvent.collect { reply ->
            voiceManager.speak(reply)
        }
    }

    // Auto-scroll when new messages arrive
    LaunchedEffect(uiState.messages.size) {
        if (uiState.messages.isNotEmpty()) {
            listState.animateScrollToItem(uiState.messages.size - 1)
        }
    }

    // Permission launcher for microphone recording
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            voiceManager.startListening(uiState.voiceLocale)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepVoidBlack)
            .statusBarsPadding()
            .navigationBarsPadding()
            .imePadding()
    ) {
        // Top HUD Header
        Surface(
            color = SurfaceDark,
            border = BorderStroke(1.dp, ArcCyan.copy(alpha = 0.2f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(if (uiState.isConfigured) ArcCyan else AlertAmber)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "NEXA // OS",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 2.sp,
                            color = ArcCyan
                        )
                        Text(
                            text = if (uiState.isListening) "LISTENING TO BOSS..." else if (uiState.isGenerating) "NEURAL REASONING..." else "ONLINE // READY",
                            fontSize = 9.sp,
                            fontFamily = FontFamily.Monospace,
                            color = if (uiState.isListening) DangerRed else if (uiState.isConfigured) TextMuted else AlertAmber
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Voice language switcher (Hindi / English)
                    IconButton(
                        onClick = {
                            val newLocale = if (uiState.voiceLocale == "hi-IN") "en-IN" else "hi-IN"
                            viewModel.setVoiceLocale(newLocale)
                        }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .background(SurfaceDarkCard, RoundedCornerShape(8.dp))
                                .padding(horizontal = 6.dp, vertical = 4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Language,
                                contentDescription = "Language",
                                tint = ArcCyan,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (uiState.voiceLocale == "hi-IN") "HI" else "EN",
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace,
                                color = ArcCyan,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    IconButton(onClick = { viewModel.clearChat() }) {
                        Icon(
                            imageVector = Icons.Default.DeleteSweep,
                            contentDescription = "Clear Chat",
                            tint = TextMuted
                        )
                    }
                }
            }
        }

        // Animated Arc Reactor HUD
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 10.dp),
            contentAlignment = Alignment.Center
        ) {
            JarvisArcReactor(
                size = 72.dp,
                isActive = uiState.isGenerating || uiState.isListening
            )
        }

        // Conversation History Stream
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(uiState.messages, key = { it.id }) { message ->
                ChatBubble(message = message)
            }
        }

        // Quick Suggestion Chips (Hindi, Hinglish & English)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 14.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val suggestions = listOf(
                "Torch on kar do",
                "Bhai kaise ho?",
                "Set alarm for 6:30 AM",
                "What can you do?",
                "Quantum computing aasan bhasha mein samjhao"
            )
            suggestions.forEach { prompt ->
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = SurfaceDarkCard,
                    border = BorderStroke(1.dp, ArcBlue.copy(alpha = 0.3f)),
                    modifier = Modifier.clickable { viewModel.sendMessage(prompt) }
                ) {
                    Text(
                        text = prompt,
                        fontSize = 12.sp,
                        color = ArcCyan,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }
            }
        }

        // Bottom Input Command Bar with Real Mic Listener
        Surface(
            color = SurfaceDark,
            border = BorderStroke(1.dp, ArcCyan.copy(alpha = 0.25f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = inputQuery,
                    onValueChange = { inputQuery = it },
                    placeholder = {
                        Text(
                            text = "Command in Hindi ('kya haal hai boss') or English...",
                            fontSize = 13.sp,
                            color = TextMuted
                        )
                    },
                    modifier = Modifier.weight(1f),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedBorderColor = ArcCyan,
                        unfocusedBorderColor = ArcBlue.copy(alpha = 0.3f),
                        cursorColor = ArcCyan
                    ),
                    shape = RoundedCornerShape(14.dp),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                    keyboardActions = KeyboardActions(
                        onSend = {
                            if (inputQuery.isNotBlank()) {
                                viewModel.sendMessage(inputQuery)
                                inputQuery = ""
                            }
                        }
                    )
                )

                Spacer(modifier = Modifier.width(6.dp))

                // Real Microphone Button (Handles Android runtime permission)
                IconButton(
                    onClick = {
                        if (uiState.isListening) {
                            voiceManager.stopListening()
                        } else {
                            val hasPermission = ContextCompat.checkSelfPermission(
                                context,
                                Manifest.permission.RECORD_AUDIO
                            ) == PackageManager.PERMISSION_GRANTED

                            if (hasPermission) {
                                voiceManager.startListening(uiState.voiceLocale)
                            } else {
                                permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                            }
                        }
                    },
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(if (uiState.isListening) DangerRed else SurfaceDarkCard)
                ) {
                    Icon(
                        imageVector = if (uiState.isListening) Icons.Default.MicOff else Icons.Default.Mic,
                        contentDescription = "Voice Input",
                        tint = if (uiState.isListening) DeepVoidBlack else ArcCyan
                    )
                }

                Spacer(modifier = Modifier.width(4.dp))

                // Send Button
                IconButton(
                    onClick = {
                        if (inputQuery.isNotBlank()) {
                            viewModel.sendMessage(inputQuery)
                            inputQuery = ""
                        }
                    },
                    enabled = inputQuery.isNotBlank() && !uiState.isGenerating,
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(if (inputQuery.isNotBlank() && !uiState.isGenerating) ArcCyan else ArcCyan.copy(alpha = 0.2f))
                ) {
                    Icon(
                        imageVector = Icons.Default.Send,
                        contentDescription = "Send Command",
                        tint = if (inputQuery.isNotBlank() && !uiState.isGenerating) DeepVoidBlack else TextMuted
                    )
                }
            }
        }
    }
}
