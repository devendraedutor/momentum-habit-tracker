package com.flux.habittracker.ui.deck

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.keyframes
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flux.habittracker.engine.MomentumEngine
import com.flux.habittracker.model.CheckInStatus
import com.flux.habittracker.model.Habit
import com.flux.habittracker.model.HabitType
import com.flux.habittracker.ui.components.CircularGauge
import com.flux.habittracker.ui.components.DynamicIcon
import com.flux.habittracker.ui.components.ParticleConfetti
import com.flux.habittracker.ui.theme.Amber400
import com.flux.habittracker.ui.theme.Amber500
import com.flux.habittracker.ui.theme.Cyan400
import com.flux.habittracker.ui.theme.Cyan500
import com.flux.habittracker.ui.theme.DarkBorder
import com.flux.habittracker.ui.theme.DarkCard
import com.flux.habittracker.ui.theme.Emerald400
import com.flux.habittracker.ui.theme.Emerald500
import com.flux.habittracker.ui.theme.Indigo500
import com.flux.habittracker.ui.theme.LightBg
import com.flux.habittracker.ui.theme.LightBorder
import com.flux.habittracker.ui.theme.LightCard
import com.flux.habittracker.ui.theme.Rose500
import com.flux.habittracker.ui.theme.Slate400
import com.flux.habittracker.ui.theme.Slate500
import com.flux.habittracker.ui.theme.Slate600
import com.flux.habittracker.ui.theme.Slate800
import com.flux.habittracker.ui.theme.Slate900
import com.flux.habittracker.ui.theme.parseHexColor
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.min
import kotlin.math.roundToInt

@Composable
fun HabitReelDeck(
    habits: List<Habit>,
    activeDateStr: String,
    isDark: Boolean,
    floorAtZero: Boolean,
    jumboPointsCount: Int,
    onCheckIn: (String, CheckInStatus, String) -> Unit,
    onOpenDetail: (Habit) -> Unit,
    onAscendHabit: (Habit) -> Unit,
    modifier: Modifier = Modifier
) {
    val activeHabits = remember(habits, activeDateStr) {
        habits.filter { h ->
            if (h.archived) return@filter false
            val start = h.startDate ?: (if (h.createdAt.length >= 10) h.createdAt.substring(0, 10) else MomentumEngine.getTodayString())
            start <= activeDateStr
        }
    }

    val unloggedHabits = remember(activeHabits, activeDateStr) {
        activeHabits.filter { h ->
            val st = h.history[activeDateStr]
            st != "done" && st != "missed"
        }
    }

    val loggedHabits = remember(activeHabits, activeDateStr) {
        activeHabits.filter { h ->
            val st = h.history[activeDateStr]
            st == "done" || st == "missed"
        }
    }

    val totalCount = activeHabits.size
    val completedCount = activeHabits.count { it.history[activeDateStr] == "done" }
    val isAllDone = totalCount > 0 && unloggedHabits.isEmpty()
    val isPerfectDay = isAllDone && completedCount == totalCount && totalCount > 0
    val percent = if (totalCount > 0) ((completedCount.toFloat() / totalCount) * 100f).roundToInt() else 0

    var confettiTrigger by remember { mutableStateOf(false) }

    // Reel Card Charging State Machine
    var isCharging by remember { mutableStateOf(false) }
    var chargePhase by remember { mutableStateOf("idle") } // 'idle' -> 'charging' -> 'incremented'
    val cardSlideOffset = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()

    val currentCard = unloggedHabits.firstOrNull()

    fun handleCardAction(status: CheckInStatus) {
        if (currentCard == null || isCharging) return

        if (status == CheckInStatus.DONE) {
            isCharging = true
            chargePhase = "charging"

            scope.launch {
                // 200ms: number pops
                delay(200)
                chargePhase = "incremented"

                // 450ms: fill completes, card slides up
                delay(250)
                cardSlideOffset.animateTo(
                    targetValue = -300f,
                    animationSpec = tween(durationMillis = 250, easing = FastOutSlowInEasing)
                )

                // 630ms: commit check-in
                onCheckIn(currentCard.id, CheckInStatus.DONE, activeDateStr)
                if (unloggedHabits.size == 1) {
                    confettiTrigger = true
                }

                cardSlideOffset.snapTo(0f)
                isCharging = false
                chargePhase = "idle"
            }
        } else {
            scope.launch {
                cardSlideOffset.animateTo(
                    targetValue = -300f,
                    animationSpec = tween(durationMillis = 180, easing = FastOutSlowInEasing)
                )
                onCheckIn(currentCard.id, CheckInStatus.MISSED, activeDateStr)
                cardSlideOffset.snapTo(0f)
            }
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        ParticleConfetti(trigger = confettiTrigger, onFinished = { confettiTrigger = false })

        if (isAllDone) {
            // CASE 1: Daily Summary Screen ("Cleared Arena")
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    Spacer(modifier = Modifier.height(10.dp))
                    // Cleared Arena Header Card
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(24.dp))
                            .background(if (isDark) DarkCard else LightCard)
                            .border(
                                1.dp,
                                if (isPerfectDay) Amber500.copy(alpha = 0.4f) else (if (isDark) DarkBorder else LightBorder),
                                RoundedCornerShape(24.dp)
                            )
                            .padding(20.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = if (isPerfectDay) "PERFECT DAY CLEARED" else "DAILY ARENA CLEARED",
                                color = if (isPerfectDay) Amber500 else Emerald500,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace,
                                letterSpacing = 1.sp
                            )

                            Spacer(modifier = Modifier.height(14.dp))

                            CircularGauge(
                                percent = percent,
                                isPerfect = isPerfectDay,
                                size = 110.dp,
                                strokeWidth = 9.dp,
                                isDark = isDark
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "$completedCount/$totalCount",
                                        color = if (isDark) Color.White else Slate900,
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.Black,
                                        fontFamily = FontFamily.Monospace
                                    )
                                    Text(
                                        text = "$percent% DONE",
                                        color = Slate400,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                            }

                            if (isPerfectDay && totalCount >= 3) {
                                Spacer(modifier = Modifier.height(14.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(50))
                                        .background(Amber500.copy(alpha = 0.15f))
                                        .border(1.dp, Amber500.copy(alpha = 0.35f), RoundedCornerShape(50))
                                        .padding(horizontal = 14.dp, vertical = 6.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.EmojiEvents,
                                            contentDescription = null,
                                            tint = Amber500,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "+1 Jumbo Point Credited",
                                            color = Amber500,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Black,
                                            fontFamily = FontFamily.Monospace
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "Total: $jumboPointsCount",
                                            color = if (isDark) Color.White else Slate900,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                }

                // Staggered Arcade Live Fill-up Habit Rows
                itemsIndexed(loggedHabits, key = { _, h -> h.id }) { idx, habit ->
                    DailySummaryHabitRow(
                        habit = habit,
                        activeDateStr = activeDateStr,
                        floorAtZero = floorAtZero,
                        index = idx,
                        isDark = isDark,
                        onOpenDetail = onOpenDetail,
                        onAscendHabit = onAscendHabit,
                        onCheckIn = onCheckIn
                    )
                }

                item {
                    Spacer(modifier = Modifier.height(30.dp))
                }
            }
        } else if (currentCard != null) {
            // CASE 2: Active Card Deck Queue (1 habit card at a time)
            val stats = MomentumEngine.calculateHabitStats(currentCard, floorAtZero)
            val targetDays = if (currentCard.targetGoalDays > 0) currentCard.targetGoalDays else 21
            val initialStreak = stats.currentGoalStreak
            val targetStreak = initialStreak + 1

            val initialPercent = min(100f, (initialStreak.toFloat() / targetDays) * 100f) / 100f
            val targetPercent = min(100f, (targetStreak.toFloat() / targetDays) * 100f) / 100f

            val currentBarProgress by animateFloatAsState(
                targetValue = if (isCharging && (chargePhase == "charging" || chargePhase == "incremented")) targetPercent else initialPercent,
                animationSpec = if (isCharging) {
                    tween(durationMillis = 400, easing = CubicBezierEasing(0.16f, 1.0f, 0.3f, 1.0f))
                } else {
                    tween(durationMillis = 0)
                },
                label = "active_bar_progress"
            )

            val displayStreak = if (isCharging && chargePhase == "incremented") targetStreak else initialStreak
            val isBreak = currentCard.type == HabitType.BREAK
            val cardColor = parseHexColor(currentCard.color, if (isBreak) Rose500 else Emerald500)

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp)
            ) {
                // Top Queue Status
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 4.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(Emerald500)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "HABIT QUEUE",
                            color = if (isDark) Color.White else Slate900,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(50))
                            .background(Emerald500.copy(alpha = 0.15f))
                            .padding(horizontal = 10.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = "${loggedHabits.size}/$totalCount",
                            color = Emerald500,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                // Daily Progress Bar
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(50))
                        .background(if (isDark) Slate800 else Color(0xFFE2E8F0))
                ) {
                    val queueProgress = if (totalCount > 0) (loggedHabits.size.toFloat() / totalCount) else 0f
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(queueProgress)
                            .background(Brush.horizontalGradient(listOf(Emerald500, Cyan400, Indigo500)))
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                // The Active Habit Card
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .offset { IntOffset(0, cardSlideOffset.value.roundToInt()) }
                        .clip(RoundedCornerShape(28.dp))
                        .background(if (isDark) DarkCard else LightCard)
                        .border(1.dp, if (isDark) DarkBorder else LightBorder, RoundedCornerShape(28.dp))
                ) {
                    // Top Accent Border
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(4.dp)
                            .background(cardColor)
                    )

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(22.dp)
                    ) {
                        // Top Badges & Analytics Trigger
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(50))
                                    .background(if (isBreak) Rose500.copy(alpha = 0.15f) else Emerald500.copy(alpha = 0.15f))
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = if (isBreak) Icons.Default.Security else Icons.Default.Spa,
                                        contentDescription = null,
                                        tint = if (isBreak) Rose500 else Emerald500,
                                        modifier = Modifier.size(13.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = if (isBreak) "Break Habit" else "Build Habit",
                                        color = if (isBreak) Rose500 else Emerald500,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            IconButton(
                                onClick = { onOpenDetail(currentCard) },
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isDark) Slate800 else Color(0xFFF1F5F9))
                            ) {
                                Icon(
                                    imageVector = Icons.Default.BarChart,
                                    contentDescription = "Analytics",
                                    tint = Slate400,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Center: Icon & Title
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(72.dp)
                                    .clip(RoundedCornerShape(24.dp))
                                    .background(cardColor.copy(alpha = 0.18f))
                                    .border(2.dp, cardColor, RoundedCornerShape(24.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                DynamicIcon(name = currentCard.icon, tint = cardColor, modifier = Modifier.size(36.dp))
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Text(
                                text = currentCard.name,
                                color = if (isDark) Color.White else Slate900,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Black,
                                textAlign = TextAlign.Center
                            )

                            currentCard.description?.let { desc ->
                                if (desc.isNotBlank()) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = desc,
                                        color = Slate400,
                                        fontSize = 12.sp,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            // XP & Streak Pill
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(if (isDark) Color(0xFF1E293B) else Color(0xFFF1F5F9))
                                    .padding(horizontal = 16.dp, vertical = 8.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Bolt,
                                        contentDescription = null,
                                        tint = Amber500,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(3.dp))
                                    Text(
                                        text = "${stats.currentScore} XP",
                                        color = if (isDark) Color.White else Slate900,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Black,
                                        fontFamily = FontFamily.Monospace
                                    )

                                    Text(
                                        text = "   |   ",
                                        color = Slate400,
                                        fontSize = 14.sp
                                    )

                                    Icon(
                                        imageVector = Icons.Default.LocalFireDepartment,
                                        contentDescription = null,
                                        tint = Amber500,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(3.dp))
                                    Text(
                                        text = "${stats.currentStreak}d",
                                        color = Amber500,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Black,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Dynamic Charging Target Goal Progress Box
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(18.dp))
                                .background(if (isDark) Color(0xFF131D33) else LightBg)
                                .border(
                                    1.dp,
                                    if (isCharging) Emerald500.copy(alpha = 0.6f) else (if (isDark) DarkBorder else LightBorder),
                                    RoundedCornerShape(18.dp)
                                )
                                .padding(14.dp)
                        ) {
                            Column {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.TrackChanges,
                                            contentDescription = null,
                                            tint = if (isCharging) Emerald500 else Cyan500,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "Target Goal",
                                            color = if (isDark) Color.White else Slate900,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }

                                    Row(verticalAlignment = Alignment.Bottom) {
                                        Text(
                                            text = "$displayStreak",
                                            color = if (isCharging) Emerald500 else (if (isDark) Color.White else Slate900),
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.Black,
                                            fontFamily = FontFamily.Monospace,
                                            modifier = Modifier.scale(if (isCharging && chargePhase == "incremented") 1.2f else 1f)
                                        )
                                        Text(
                                            text = " / $targetDays",
                                            color = Slate400,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                // Dynamic Progress Bar Track with 400ms cubic-bezier transition
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(8.dp)
                                        .clip(RoundedCornerShape(50))
                                        .background(if (isDark) Slate800 else Color(0xFFE2E8F0))
                                ) {
                                    if (currentBarProgress > 0f) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxHeight()
                                                .fillMaxWidth(currentBarProgress)
                                                .background(Brush.horizontalGradient(listOf(Emerald500, Cyan400, Emerald400)))
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(18.dp))

                        // One-Tap Check-In Actions
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Failure / Missed
                            Button(
                                onClick = { handleCardAction(CheckInStatus.MISSED) },
                                enabled = !isCharging,
                                modifier = Modifier
                                    .weight(1f)
                                    .height(64.dp),
                                shape = RoundedCornerShape(18.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isDark) Color(0xFF1E293B) else Color(0xFFF1F5F9),
                                    contentColor = if (isDark) Color.White else Slate900
                                )
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = null,
                                        tint = Rose500,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = if (isBreak) "Failed" else "Missed",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Black
                                    )
                                }
                            }

                            // Success / Controlled / Done
                            Button(
                                onClick = { handleCardAction(CheckInStatus.DONE) },
                                enabled = !isCharging,
                                modifier = Modifier
                                    .weight(1f)
                                    .height(64.dp),
                                shape = RoundedCornerShape(18.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isCharging) Emerald500 else Emerald500.copy(alpha = 0.2f),
                                    contentColor = if (isCharging) Color.Black else Emerald500
                                )
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(
                                        imageVector = if (isBreak) Icons.Default.Security else Icons.Default.Check,
                                        contentDescription = null,
                                        tint = if (isCharging) Color.Black else Emerald500,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = if (isBreak) "Controlled" else "Done",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Black
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
