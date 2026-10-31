package com.nexaos.assistant.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.nexaos.assistant.ui.components.ChatBubble
import com.nexaos.assistant.ui.components.JarvisArcReactor
import com.nexaos.assistant.ui.theme.AlertAmber
import com.nexaos.assistant.ui.theme.ArcBlue
import com.nexaos.assistant.ui.theme.ArcCyan
import com.nexaos.assistant.ui.theme.DeepVoidBlack
import com.nexaos.assistant.ui.theme.SurfaceDark
import com.nexaos.assistant.ui.theme.SurfaceDarkCard
import com.nexaos.assistant.ui.theme.TextMuted
import com.nexaos.assistant.ui.theme.TextPrimary

@Composable
fun JarvisScreen(
    viewModel: ChatViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var inputQuery by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    // Auto-scroll to latest message
    LaunchedEffect(uiState.messages.size) {
        if (uiState.messages.isNotEmpty()) {
            listState.animateScrollToItem(uiState.messages.size - 1)
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
                    // Glowing status beacon
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
                            text = if (uiState.isConfigured) "PHASE 1: CHAT PROTOCOL ACTIVE" else "API KEY REQUIRED IN LOCAL.PROPERTIES",
                            fontSize = 9.sp,
                            fontFamily = FontFamily.Monospace,
                            color = if (uiState.isConfigured) TextMuted else AlertAmber
                        )
                    }
                }

                IconButton(
                    onClick = { viewModel.clearChat() }
                ) {
                    Icon(
                        imageVector = Icons.Default.DeleteSweep,
                        contentDescription = "Clear Chat",
                        tint = TextMuted
                    )
                }
            }
        }

        // Mini Arc Reactor Telemetry Bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 10.dp),
            contentAlignment = Alignment.Center
        ) {
            JarvisArcReactor(
                size = 72.dp,
                isActive = uiState.isGenerating
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

        // Quick Suggestion Chips (Hinglish + English)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 14.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val suggestions = listOf(
                "Nexa, who are you?",
                "Kaise ho boss?",
                "What can you do?",
                "System diagnostics report"
            )
            suggestions.forEach { prompt ->
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = SurfaceDarkCard,
                    border = BorderStroke(1.dp, ArcBlue.copy(alpha = 0.3f)),
                    modifier = Modifier.clickable {
                        viewModel.sendMessage(prompt)
                    }
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

        // Futuristic Input Bar
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
                            text = "Ask Nexa in English, Hindi, or Hinglish...",
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

                // Phase 2 Voice Mic button indicator
                IconButton(
                    onClick = {
                        viewModel.sendMessage("Voice command mode preview: Ready for Phase 2!")
                    },
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(SurfaceDarkCard)
                ) {
                    Icon(
                        imageVector = Icons.Default.Mic,
                        contentDescription = "Voice Input (Phase 2)",
                        tint = ArcCyan
                    )
                }

                Spacer(modifier = Modifier.width(4.dp))

                // Send button
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
