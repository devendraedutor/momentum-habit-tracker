package com.flux.habittracker.ui.modals

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.flux.habittracker.model.Frequency
import com.flux.habittracker.model.Habit
import com.flux.habittracker.model.HabitType
import com.flux.habittracker.ui.components.DynamicIcon
import com.flux.habittracker.ui.theme.Cyan500
import com.flux.habittracker.ui.theme.DarkBorder
import com.flux.habittracker.ui.theme.DarkCard
import com.flux.habittracker.ui.theme.Emerald500
import com.flux.habittracker.ui.theme.LightBg
import com.flux.habittracker.ui.theme.LightBorder
import com.flux.habittracker.ui.theme.LightCard
import com.flux.habittracker.ui.theme.Rose500
import com.flux.habittracker.ui.theme.Slate400
import com.flux.habittracker.ui.theme.Slate800
import com.flux.habittracker.ui.theme.Slate900
import com.flux.habittracker.ui.theme.parseHexColor

@Composable
fun HabitFormModal(
    habitToEdit: Habit?,
    isOpen: Boolean,
    isDark: Boolean,
    categories: List<String>,
    onClose: () -> Unit,
    onSave: (Habit) -> Unit
) {
    if (!isOpen) return

    val availableIcons = listOf("Zap", "Flame", "BookOpen", "Dumbbell", "Target", "Shield", "Spa", "WaterDrop", "SelfImprovement", "Crown")
    val availableColors = listOf("#10b981", "#06b6d4", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6", "#f43f5e")
    val targetPresets = listOf(7, 14, 21, 30)

    var name by remember { mutableStateOf(habitToEdit?.name ?: "") }
    var description by remember { mutableStateOf(habitToEdit?.description ?: "") }
    var selectedCategory by remember { mutableStateOf(habitToEdit?.category ?: (categories.firstOrNull() ?: "Productivity")) }
    var selectedType by remember { mutableStateOf(habitToEdit?.type ?: HabitType.BUILD) }
    var selectedIcon by remember { mutableStateOf(habitToEdit?.icon ?: "Zap") }
    var selectedColor by remember { mutableStateOf(habitToEdit?.color ?: "#10b981") }
    var targetGoalDays by remember { mutableIntStateOf(habitToEdit?.targetGoalDays ?: 21) }
    var customDaysInput by remember { mutableStateOf("") }
    var isCustomTarget by remember { mutableStateOf(!targetPresets.contains(habitToEdit?.targetGoalDays ?: 21)) }

    val cardBg = if (isDark) DarkCard else LightCard
    val borderCol = if (isDark) DarkBorder else LightBorder
    val textPrimary = if (isDark) Color.White else Slate900

    fun submit() {
        if (name.isBlank()) return
        val finalTarget = if (isCustomTarget) {
            customDaysInput.toIntOrNull() ?: targetPresets[2]
        } else {
            targetGoalDays
        }

        val updated = habitToEdit?.copy(
            name = name.trim(),
            description = description.trim().ifBlank { null },
            category = selectedCategory,
            type = selectedType,
            icon = selectedIcon,
            color = selectedColor,
            targetGoalDays = finalTarget
        ) ?: Habit(
            name = name.trim(),
            description = description.trim().ifBlank { null },
            category = selectedCategory,
            type = selectedType,
            icon = selectedIcon,
            color = selectedColor,
            targetGoalDays = finalTarget,
            frequency = Frequency.DAILY
        )

        onSave(updated)
        onClose()
    }

    Dialog(onDismissRequest = onClose) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(28.dp))
                .background(cardBg)
                .border(1.dp, borderCol, RoundedCornerShape(28.dp))
                .padding(20.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (habitToEdit == null) "Create New Habit" else "Edit Habit",
                        color = textPrimary,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace
                    )
                    IconButton(onClick = onClose, modifier = Modifier.size(30.dp)) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Slate400, modifier = Modifier.size(18.dp))
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Build / Break Type Toggle
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (isDark) Slate800 else LightBg)
                        .padding(4.dp)
                ) {
                    // Build Habit
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(38.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (selectedType == HabitType.BUILD) Emerald500 else Color.Transparent)
                            .clickable { selectedType = HabitType.BUILD },
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Spa,
                                contentDescription = null,
                                tint = if (selectedType == HabitType.BUILD) Color.White else Slate400,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Build Habit",
                                color = if (selectedType == HabitType.BUILD) Color.White else Slate400,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    // Break Habit
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(38.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (selectedType == HabitType.BREAK) Rose500 else Color.Transparent)
                            .clickable { selectedType = HabitType.BREAK },
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Security,
                                contentDescription = null,
                                tint = if (selectedType == HabitType.BREAK) Color.White else Slate400,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Break Habit",
                                color = if (selectedType == HabitType.BREAK) Color.White else Slate400,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Name Input
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Habit Name") },
                    placeholder = { Text("e.g. Morning Meditation") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp)
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Description Input
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (Optional)") },
                    placeholder = { Text("Why this matters to you...") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp)
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Target Goal Presets (7 D, 14 D, 21 D, 30 D)
                Text(
                    text = "TARGET GOAL",
                    color = Slate400,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    targetPresets.forEach { days ->
                        val isSelected = !isCustomTarget && targetGoalDays == days
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(40.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isSelected) Emerald500 else (if (isDark) Slate800 else LightBg))
                                .border(1.dp, if (isSelected) Emerald500 else borderCol, RoundedCornerShape(12.dp))
                                .clickable {
                                    targetGoalDays = days
                                    isCustomTarget = false
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "$days D",
                                color = if (isSelected) Color.White else textPrimary,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Custom Target Days Input
                OutlinedTextField(
                    value = customDaysInput,
                    onValueChange = {
                        customDaysInput = it
                        isCustomTarget = true
                    },
                    placeholder = { Text("Custom days (e.g. 10, 45, 66)", fontSize = 12.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Icon Picker Row
                Text(
                    text = "ICON",
                    color = Slate400,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(6.dp))

                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(availableIcons) { iconName ->
                        val isSelected = selectedIcon == iconName
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isSelected) parseHexColor(selectedColor).copy(alpha = 0.25f) else (if (isDark) Slate800 else LightBg))
                                .border(
                                    1.5.dp,
                                    if (isSelected) parseHexColor(selectedColor) else borderCol,
                                    RoundedCornerShape(12.dp)
                                )
                                .clickable { selectedIcon = iconName },
                            contentAlignment = Alignment.Center
                        ) {
                            DynamicIcon(
                                name = iconName,
                                tint = if (isSelected) parseHexColor(selectedColor) else Slate400,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Color Picker Row
                Text(
                    text = "ACCENT COLOR",
                    color = Slate400,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(6.dp))

                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(availableColors) { hex ->
                        val col = parseHexColor(hex)
                        val isSelected = selectedColor == hex
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(CircleShape)
                                .background(col)
                                .border(
                                    if (isSelected) 3.dp else 1.dp,
                                    if (isSelected) Color.White else Color.Transparent,
                                    CircleShape
                                )
                                .clickable { selectedColor = hex }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Submit Button
                Button(
                    onClick = { submit() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald500)
                ) {
                    Text(
                        text = if (habitToEdit == null) "Create Habit" else "Save Changes",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }
    }
}
