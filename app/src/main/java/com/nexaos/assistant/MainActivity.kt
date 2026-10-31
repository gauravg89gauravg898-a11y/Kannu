package com.nexaos.assistant

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
}
