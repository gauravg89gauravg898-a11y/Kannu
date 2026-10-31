package com.nexaos.assistant.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val NexaColorScheme = darkColorScheme(
    primary = ArcCyan,
    onPrimary = DeepVoidBlack,
    secondary = ArcBlue,
    onSecondary = TextPrimary,
    background = DeepVoidBlack,
    onBackground = TextPrimary,
    surface = SurfaceDark,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceDarkCard,
    onSurfaceVariant = TextMuted,
    error = DangerRed
)

@Composable
fun NexaOSTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = NexaColorScheme,
        content = content
    )
}
