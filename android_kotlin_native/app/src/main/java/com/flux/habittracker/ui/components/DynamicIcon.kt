package com.flux.habittracker.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.SelfImprovement
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material.icons.filled.WaterDrop
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector

@Composable
fun DynamicIcon(
    name: String?,
    modifier: Modifier = Modifier,
    tint: Color = Color.Unspecified
) {
    val imageVector: ImageVector = when (name?.lowercase()) {
        "zap", "bolt" -> Icons.Default.Bolt
        "flame", "fire" -> Icons.Default.LocalFireDepartment
        "target" -> Icons.Default.TrackChanges
        "book", "bookopen", "read" -> Icons.Default.Book
        "dumbbell", "fitness", "workout" -> Icons.Default.FitnessCenter
        "shield", "shieldcheck" -> Icons.Default.Security
        "crown", "trophy", "gem" -> Icons.Default.EmojiEvents
        "check" -> Icons.Default.Check
        "x", "close" -> Icons.Default.Close
        "sprout", "leaf" -> Icons.Default.Spa
        "water", "waterdrop" -> Icons.Default.WaterDrop
        "meditate", "yoga" -> Icons.Default.SelfImprovement
        "bell" -> Icons.Default.Notifications
        else -> Icons.Default.Star
    }

    Icon(
        imageVector = imageVector,
        contentDescription = name,
        modifier = modifier,
        tint = tint
    )
}
