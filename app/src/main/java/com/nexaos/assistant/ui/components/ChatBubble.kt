package com.nexaos.assistant.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.SmartToy
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nexaos.assistant.model.ChatMessage
import com.nexaos.assistant.model.MessageSender
import com.nexaos.assistant.ui.theme.ArcBlue
import com.nexaos.assistant.ui.theme.ArcCyan
import com.nexaos.assistant.ui.theme.DangerRed
import com.nexaos.assistant.ui.theme.SurfaceDarkCard
import com.nexaos.assistant.ui.theme.TextMuted
import com.nexaos.assistant.ui.theme.TextPrimary
import com.nexaos.assistant.ui.theme.UserBubble

@Composable
fun ChatBubble(
    message: ChatMessage,
    modifier: Modifier = Modifier
) {
    val isUser = message.sender == MessageSender.USER
    val isSystem = message.sender == MessageSender.SYSTEM

    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = when {
            isUser -> Arrangement.End
            isSystem -> Arrangement.Center
            else -> Arrangement.Start
        }
    ) {
        if (!isUser && !isSystem) {
            Icon(
                imageVector = Icons.Default.SmartToy,
                contentDescription = "Jarvis",
                tint = ArcCyan,
                modifier = Modifier
                    .padding(top = 4.dp, end = 6.dp)
                    .size(20.dp)
            )
        }

        Surface(
            shape = RoundedCornerShape(
                topStart = 16.dp,
                topEnd = 16.dp,
                bottomStart = if (isUser) 16.dp else 4.dp,
                bottomEnd = if (isUser) 4.dp else 16.dp
            ),
            color = when {
                isUser -> UserBubble
                isSystem -> SurfaceDarkCard
                message.isError -> DangerRed.copy(alpha = 0.15f)
                else -> SurfaceDarkCard
            },
            border = BorderStroke(
                width = 1.dp,
                color = when {
                    isUser -> ArcBlue.copy(alpha = 0.4f)
                    isSystem -> TextMuted.copy(alpha = 0.3f)
                    message.isError -> DangerRed.copy(alpha = 0.6f)
                    else -> ArcCyan.copy(alpha = 0.4f)
                }
            ),
            modifier = Modifier.fillMaxWidth(if (isSystem) 0.95f else 0.82f)
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
                // Sender label
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = when (message.sender) {
                            MessageSender.USER -> "BOSS"
                            MessageSender.JARVIS -> "NEXA // JARVIS"
                            MessageSender.SYSTEM -> "SYSTEM PROTOCOL"
                        },
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        color = when {
                            isUser -> ArcBlue
                            isSystem -> TextMuted
                            message.isError -> DangerRed
                            else -> ArcCyan
                        }
                    )

                    if (message.isLoading) {
                        CircularProgressIndicator(
                            strokeWidth = 2.dp,
                            color = ArcCyan,
                            modifier = Modifier.size(12.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = message.text,
                    fontSize = 14.sp,
                    lineHeight = 20.sp,
                    color = if (message.isError) DangerRed else TextPrimary
                )
            }
        }
    }
}
