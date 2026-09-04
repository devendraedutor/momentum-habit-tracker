package com.flux.habittracker.ui.deck

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flux.habittracker.engine.MomentumEngine
import com.flux.habittracker.model.CheckInStatus
import com.flux.habittracker.model.Habit
import com.flux.habittracker.model.HabitType
import com.flux.habittracker.ui.components.DynamicIcon
import com.flux.habittracker.ui.theme.*
import kotlinx.coroutines.delay
import kotlin.math.max
import kotlin.math.min

@Composable
fun DailySummaryHabitRow(
    habit: Habit,
    activeDateStr: String,
    floorAtZero: Boolean,
    index: Int,
    isDark: Boolean,
    onOpenDetail: (Habit) -> Unit,
    onAscendHabit: (Habit) -> Unit,
    onCheckIn: (String, CheckInStatus, String) -> Unit
) {
    val currentStatus = habit.history[activeDateStr]
    val isBreak = habit.type == HabitType.BREAK
    val isDone = currentStatus == "done"
    val stats = MomentumEngine.calculateHabitStats(habit, floorAtZero)
    val targetDays = if (habit.targetGoalDays > 0) habit.targetGoalDays else 21
    val goalStreak = stats.currentGoalStreak
    val isGoalConquered = goalStreak >= targetDays && isDone
    val daysRemaining = max(0, targetDays - goalStreak)
    val isNearGoal = !isGoalConquered && isDone && (goalStreak.toFloat() / targetDays) >= 0.7f && daysRemaining > 0
    val isToday = activeDateStr == MomentumEngine.getTodayString()
    val isDoneToday = isDone && isToday

    // 1. Mount with Previous State: start at goalStreak - 1 if completed today
    var animatedStreak by remember {
        mutableIntStateOf(
            if (isDoneToday && goalStreak > 0) goalStreak - 1 else if (isDone) goalStreak else 0
        )
    }

    // 2. Trigger the Fill After Screen Mount with staggered delay
    LaunchedEffect(goalStreak, isDoneToday, isDone, index) {
        if (!isDoneToday) {
            animatedStreak = if (isDone) goalStreak else 0
            return@LaunchedEffect
        }
        delay(300L + index * 80L)
        animatedStreak = goalStreak
    }

    val targetRailWidth = if (!isDone) {
        0f
    } else {
        min(100f, (animatedStreak.toFloat() / targetDays) * 100f) / 100f
    }

    val animatedRailProgress by animateFloatAsState(
        targetValue = targetRailWidth,
        animationSpec = tween(durationMillis = 700, easing = FastOutSlowInEasing),
        label = "rail_fill"
    )

    val cardBg = if (isDark) DarkCard else LightCard
    val borderCol = if (isGoalConquered) Amber500.copy(alpha = 0.5f) else if (isDark) DarkBorder else LightBorder
    val habitColor = parseHexColor(habit.color, if (isBreak) Rose500 else Emerald500)
    val textPrimary = if (isDark) Color.White else Slate900

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(cardBg)
            .border(1.dp, borderCol, RoundedCornerShape(20.dp))
            .clickable { onOpenDetail(habit) }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 14.dp, end = 14.dp, top = 12.dp, bottom = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Left: Icon + Habit Name + Secondary Pill
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f, fill = false)
            ) {
                // Icon Frame
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (isDark) Color(0xFF131D33) else Color(0xFFF1F5F9))
                        .border(
                            1.5.dp,
                            if (isBreak) Rose500.copy(alpha = 0.35f) else Emerald500.copy(alpha = 0.35f),
                            RoundedCornerShape(14.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    DynamicIcon(name = habit.icon, tint = habitColor, modifier = Modifier.size(22.dp))
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f, fill = false)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = habit.name,
                            color = textPrimary,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (habit.currentTier > 1) {
                            Spacer(modifier = Modifier.width(6.dp))
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(Amber500.copy(alpha = 0.15f))
                                    .border(1.dp, Amber500.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
                                    .padding(horizontal = 5.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "Lv.${habit.currentTier}",
                                    color = Amber500,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Black,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(3.dp))

                    // Secondary stats row: Streak + XP + Near Goal Alert
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.LocalFireDepartment,
                            contentDescription = null,
                            tint = Amber500,
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(2.dp))
                        Text(
                            text = "${stats.currentStreak}",
                            color = if (isDark) Color(0xFFCBD5E1) else Slate600,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )

                        Text(
                            text = " • ",
                            color = Slate400,
                            fontSize = 11.sp
                        )

                        Icon(
                            imageVector = Icons.Default.Bolt,
                            contentDescription = null,
                            tint = Amber500,
                            modifier = Modifier.size(13.dp)
                        )
                        Text(
                            text = "${stats.currentScore} XP",
                            color = if (isDark) Color(0xFFCBD5E1) else Slate600,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            fontFamily = FontFamily.Monospace
                        )

                        if (isNearGoal) {
                            Text(text = " • ", color = Slate400, fontSize = 11.sp)
                            Row(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(Cyan500.copy(alpha = 0.15f))
                                    .padding(horizontal = 4.dp, vertical = 1.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Flag,
                                    contentDescription = null,
                                    tint = Cyan500,
                                    modifier = Modifier.size(10.dp)
                                )
                                Spacer(modifier = Modifier.width(2.dp))
                                Text(
                                    text = "${daysRemaining}d to goal",
                                    color = Cyan500,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.width(10.dp))

            // Right Cluster: Milestone Button + Target Ratio (7 D format) + Check-In Switch
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.End
            ) {
                if (isGoalConquered) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(
                                Brush.horizontalGradient(
                                    listOf(Amber500.copy(alpha = 0.25f), Amber400.copy(alpha = 0.35f))
                                )
                            )
                            .border(1.dp, Amber400.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                            .clickable { onAscendHabit(habit) }
                            .padding(horizontal = 8.dp, vertical = 5.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.EmojiEvents,
                                contentDescription = null,
                                tint = Amber500,
                                modifier = Modifier.size(13.dp)
                            )
                            Spacer(modifier = Modifier.width(3.dp))
                            Text(
                                text = "Level Up ⚡",
                                color = Amber500,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                }

                // Target Ratio (Format: "5 / 7 D")
                Column(horizontalAlignment = Alignment.End) {
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(
                            text = "${if (isDone) animatedStreak else 0}",
                            color = if (isDone) textPrimary else Slate400,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                        Text(
                            text = "/$targetDays D",
                            color = Slate400,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                    Text(
                        text = "TARGET",
                        color = Slate400,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Medium,
                        fontFamily = FontFamily.Monospace
                    )
                }

                Spacer(modifier = Modifier.width(10.dp))

                // Tactile Daily Check-In Micro-Switch
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(
                            if (isDone) Emerald500.copy(alpha = 0.18f) else Rose500.copy(alpha = 0.18f)
                        )
                        .border(
                            1.dp,
                            if (isDone) Emerald500.copy(alpha = 0.4f) else Rose500.copy(alpha = 0.4f),
                            RoundedCornerShape(12.dp)
                        )
                        .clickable {
                            onCheckIn(
                                habit.id,
                                if (isDone) CheckInStatus.MISSED else CheckInStatus.DONE,
                                activeDateStr
                            )
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (isDone) Icons.Default.Check else Icons.Default.Close,
                        contentDescription = null,
                        tint = if (isDone) Emerald500 else Rose500,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }

        // Ultra-Thin (3.5dp) Seamless Bottom Progress Rail with Staggered Live Expansion
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .height(3.5.dp)
                .background(if (isDark) Slate800 else Color(0xFFE2E8F0))
        ) {
            if (animatedRailProgress > 0f) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(animatedRailProgress)
                        .background(
                            if (isGoalConquered) {
                                Brush.horizontalGradient(listOf(Amber400, Amber500, Emerald400))
                            } else {
                                Brush.horizontalGradient(listOf(Emerald400, Cyan400, Emerald500))
                            }
                        )
                )
            }
        }
    }
}
