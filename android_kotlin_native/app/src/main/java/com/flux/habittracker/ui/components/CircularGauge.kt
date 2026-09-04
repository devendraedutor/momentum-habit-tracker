package com.flux.habittracker.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.flux.habittracker.ui.theme.Amber400
import com.flux.habittracker.ui.theme.Cyan400
import com.flux.habittracker.ui.theme.Emerald400
import com.flux.habittracker.ui.theme.Emerald500
import com.flux.habittracker.ui.theme.Indigo500
import com.flux.habittracker.ui.theme.Slate200
import com.flux.habittracker.ui.theme.Slate800

@Composable
fun CircularGauge(
    percent: Int,
    isPerfect: Boolean,
    modifier: Modifier = Modifier,
    size: Dp = 100.dp,
    strokeWidth: Dp = 8.dp,
    isDark: Boolean = false,
    centerContent: @Composable () -> Unit = {}
) {
    val animatedPercent by animateFloatAsState(
        targetValue = (percent.coerceIn(0, 100) / 100f),
        animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing),
        label = "gauge_progress"
    )

    val trackColor = if (isDark) Slate800 else Slate200
    val gradientColors = if (isPerfect) {
        listOf(Amber400, Emerald400, Cyan400)
    } else {
        listOf(Emerald500, Cyan400, Indigo500)
    }

    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.size(size)) {
            val strokePx = strokeWidth.toPx()
            val radius = (size.toPx() - strokePx) / 2
            val topLeft = Offset(strokePx / 2, strokePx / 2)
            val arcSize = Size(radius * 2, radius * 2)

            // Background Track
            drawArc(
                color = trackColor,
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = Stroke(width = strokePx, cap = StrokeCap.Round)
            )

            // Progress Arc
            if (animatedPercent > 0f) {
                drawArc(
                    brush = Brush.sweepGradient(
                        colors = gradientColors,
                        center = Offset(size.toPx() / 2, size.toPx() / 2)
                    ),
                    startAngle = -90f,
                    sweepAngle = animatedPercent * 360f,
                    useCenter = false,
                    topLeft = topLeft,
                    size = arcSize,
                    style = Stroke(width = strokePx, cap = StrokeCap.Round)
                )
            }
        }

        centerContent()
    }
}
