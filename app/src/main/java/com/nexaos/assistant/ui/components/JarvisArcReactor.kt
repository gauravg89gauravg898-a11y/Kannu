package com.nexaos.assistant.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.nexaos.assistant.ui.theme.ArcBlue
import com.nexaos.assistant.ui.theme.ArcCyan
import com.nexaos.assistant.ui.theme.ArcCyanGlow

@Composable
fun JarvisArcReactor(
    modifier: Modifier = Modifier,
    size: Dp = 140.dp,
    isActive: Boolean = false
) {
    val transition = rememberInfiniteTransition(label = "ArcReactorTransition")

    // Slow atmospheric rotation
    val rotation by transition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = if (isActive) 3500 else 9000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "ArcRotation"
    )

    // Counter-rotation for inner ring
    val counterRotation by transition.animateFloat(
        initialValue = 360f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = if (isActive) 5000 else 12000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "CounterRotation"
    )

    // Breathing pulse scale
    val pulse by transition.animateFloat(
        initialValue = 0.92f,
        targetValue = if (isActive) 1.12f else 1.02f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = if (isActive) 600 else 1800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "ArcPulse"
    )

    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.size(size)) {
            val center = Offset(size.toPx() / 2f, size.toPx() / 2f)
            val maxRadius = (size.toPx() / 2f) * 0.9f

            // Outer soft glow
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(ArcCyanGlow, Color.Transparent),
                    center = center,
                    radius = maxRadius * pulse
                ),
                radius = maxRadius * pulse,
                center = center
            )

            // Outer segmented ring
            rotate(rotation, pivot = center) {
                drawCircle(
                    color = ArcCyan.copy(alpha = 0.4f),
                    radius = maxRadius * 0.85f,
                    center = center,
                    style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
                )

                // 8 tick segments
                for (i in 0 until 8) {
                    val angle = (i * 45f) * (Math.PI / 180f)
                    val r1 = maxRadius * 0.76f
                    val r2 = maxRadius * 0.88f
                    val start = Offset(
                        center.x + (r1 * kotlin.math.cos(angle)).toFloat(),
                        center.y + (r1 * kotlin.math.sin(angle)).toFloat()
                    )
                    val end = Offset(
                        center.x + (r2 * kotlin.math.cos(angle)).toFloat(),
                        center.y + (r2 * kotlin.math.sin(angle)).toFloat()
                    )
                    drawLine(
                        color = ArcCyan,
                        start = start,
                        end = end,
                        strokeWidth = 2.5.dp.toPx(),
                        cap = StrokeCap.Round
                    )
                }
            }

            // Middle counter-rotating ring
            rotate(counterRotation, pivot = center) {
                drawCircle(
                    color = ArcBlue.copy(alpha = 0.6f),
                    radius = maxRadius * 0.58f,
                    center = center,
                    style = Stroke(width = 2.dp.toPx())
                )
            }

            // Core glowing reactor center
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        Color.White,
                        ArcCyan,
                        ArcBlue.copy(alpha = 0.7f),
                        Color.Transparent
                    ),
                    center = center,
                    radius = maxRadius * 0.38f * pulse
                ),
                radius = maxRadius * 0.38f * pulse,
                center = center
            )
        }
    }
}
