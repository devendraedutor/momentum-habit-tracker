package com.flux.habittracker.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import com.flux.habittracker.ui.theme.Amber400
import com.flux.habittracker.ui.theme.Cyan400
import com.flux.habittracker.ui.theme.Emerald400
import com.flux.habittracker.ui.theme.Indigo400
import com.flux.habittracker.ui.theme.Rose400
import kotlin.random.Random

data class ConfettiParticle(
    val startX: Float,
    val startY: Float,
    val velocityX: Float,
    val velocityY: Float,
    val color: Color,
    val size: Float,
    val rotationSpeed: Float
)

@Composable
fun ParticleConfetti(
    trigger: Boolean,
    modifier: Modifier = Modifier,
    particleCount: Int = 75,
    onFinished: () -> Unit = {}
) {
    if (!trigger) return

    val progress = remember { Animatable(0f) }
    val colors = listOf(Emerald400, Cyan400, Indigo400, Amber400, Rose400)

    val particles = remember(trigger) {
        val rand = Random(System.currentTimeMillis())
        List(particleCount) {
            ConfettiParticle(
                startX = rand.nextFloat(),
                startY = 0.55f,
                velocityX = (rand.nextFloat() - 0.5f) * 1.6f,
                velocityY = -rand.nextFloat() * 1.5f - 0.5f,
                color = colors[rand.nextInt(colors.size)],
                size = rand.nextFloat() * 12f + 8f,
                rotationSpeed = (rand.nextFloat() - 0.5f) * 720f
            )
        }
    }

    LaunchedEffect(trigger) {
        progress.snapTo(0f)
        progress.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 1800, easing = LinearEasing)
        )
        onFinished()
    }

    Canvas(modifier = modifier.fillMaxSize()) {
        val w = size.width
        val h = size.height
        val t = progress.value

        particles.forEach { p ->
            val gravity = 2.2f * t * t
            val currentX = (p.startX + p.velocityX * t) * w
            val currentY = (p.startY + p.velocityY * t + gravity) * h
            val alpha = (1f - t).coerceIn(0f, 1f)

            rotate(degrees = p.rotationSpeed * t, pivot = Offset(currentX, currentY)) {
                drawRect(
                    color = p.color.copy(alpha = alpha),
                    topLeft = Offset(currentX - p.size / 2, currentY - p.size / 2),
                    size = Size(p.size, p.size * 0.6f)
                )
            }
        }
    }
}
