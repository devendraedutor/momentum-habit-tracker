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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.flux.habittracker.engine.MomentumEngine
import com.flux.habittracker.model.CheckInStatus
import com.flux.habittracker.model.Habit
import com.flux.habittracker.model.HabitType
import com.flux.habittracker.ui.components.DynamicIcon
import com.flux.habittracker.ui.theme.Amber500
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
import java.time.LocalDate

@Composable
fun HabitDetailModal(
    habit: Habit?,
    isOpen: Boolean,
    isDark: Boolean,
    floorAtZero: Boolean,
    onClose: () -> Unit,
    onEdit: (Habit) -> Unit,
    onDelete: (String) -> Unit,
    onToggleDateStatus: (String, String) -> Unit = { _, _ -> }
) {
    if (!isOpen || habit == null) return

    val stats = MomentumEngine.calculateHabitStats(habit, floorAtZero)
    val cardBg = if (isDark) DarkCard else LightCard
    val borderCol = if (isDark) DarkBorder else LightBorder
    val textPrimary = if (isDark) Color.White else Slate900
    val habitColor = parseHexColor(habit.color, if (habit.type == HabitType.BREAK) Rose500 else Emerald500)
    val targetDays = if (habit.targetGoalDays > 0) habit.targetGoalDays else 21

    // 14-day recent grid
    val today = LocalDate.now()
    val past14Days = (13 downTo 0).map { today.minusDays(it.toLong()) }

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
                // Header with Edit / Delete / Close
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(habitColor.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            DynamicIcon(name = habit.icon, tint = habitColor, modifier = Modifier.size(22.dp))
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = habit.name,
                                color = textPrimary,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black
                            )
                            Text(
                                text = "${habit.category} • Lv.${habit.currentTier}",
                                color = Slate400,
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }

                    Row {
                        IconButton(onClick = { onEdit(habit) }, modifier = Modifier.size(32.dp)) {
                            Icon(imageVector = Icons.Default.Edit, contentDescription = "Edit", tint = Cyan500, modifier = Modifier.size(16.dp))
                        }
                        IconButton(onClick = { onDelete(habit.id); onClose() }, modifier = Modifier.size(32.dp)) {
                            Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete", tint = Rose500, modifier = Modifier.size(16.dp))
                        }
                        IconButton(onClick = onClose, modifier = Modifier.size(32.dp)) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Slate400, modifier = Modifier.size(18.dp))
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Stats Matrix
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Current Streak
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(14.dp))
                            .background(if (isDark) Slate800 else LightBg)
                            .padding(10.dp)
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.LocalFireDepartment, contentDescription = null, tint = Amber500, modifier = Modifier.size(13.dp))
                                Spacer(modifier = Modifier.width(3.dp))
                                Text(text = "STREAK", color = Slate400, fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(text = "${stats.currentStreak}d", color = Amber500, fontSize = 16.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
                        }
                    }

                    // Score XP
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(14.dp))
                            .background(if (isDark) Slate800 else LightBg)
                            .padding(10.dp)
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.Bolt, contentDescription = null, tint = Amber500, modifier = Modifier.size(13.dp))
                                Spacer(modifier = Modifier.width(3.dp))
                                Text(text = "XP", color = Slate400, fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(text = "${stats.currentScore}", color = textPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
                        }
                    }

                    // Target Goal
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(14.dp))
                            .background(if (isDark) Slate800 else LightBg)
                            .padding(10.dp)
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.TrackChanges, contentDescription = null, tint = Cyan500, modifier = Modifier.size(13.dp))
                                Spacer(modifier = Modifier.width(3.dp))
                                Text(text = "GOAL", color = Slate400, fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(text = "${stats.currentGoalStreak}/$targetDays D", color = Cyan500, fontSize = 14.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // 14-Day History Heatmap Grid
                Text(
                    text = "RECENT 14 DAYS HISTORY (TAP TO MODIFY)",
                    color = Slate400,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    past14Days.forEach { date ->
                        val dateStr = MomentumEngine.formatDate(date)
                        val status = habit.history[dateStr]
                        val isDayDone = status == "done"
                        val isDayMissed = status == "missed"

                        Box(
                            modifier = Modifier
                                .size(20.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(
                                    if (isDayDone) Emerald500
                                    else if (isDayMissed) Rose500
                                    else if (isDark) Slate800 else Color(0xFFE2E8F0)
                                )
                                .clickable { onToggleDateStatus(habit.id, dateStr) },
                            contentAlignment = Alignment.Center
                        ) {
                            if (isDayDone) {
                                Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(12.dp))
                            } else if (isDayMissed) {
                                Icon(imageVector = Icons.Default.Close, contentDescription = null, tint = Color.White, modifier = Modifier.size(12.dp))
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = onClose,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = if (isDark) Slate800 else Color(0xFFE2E8F0))
                ) {
                    Text(text = "Close Insights", color = textPrimary, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
