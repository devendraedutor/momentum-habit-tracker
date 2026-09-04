package com.flux.habittracker.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flux.habittracker.engine.MomentumEngine
import com.flux.habittracker.ui.components.DatePickerSheet
import com.flux.habittracker.ui.deck.HabitReelDeck
import com.flux.habittracker.ui.modals.*
import com.flux.habittracker.ui.theme.*
import com.flux.habittracker.ui.viewmodel.FluxViewModel
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Composable
fun MainHabitScreen(
    viewModel: FluxViewModel
) {
    val state by viewModel.uiState.collectAsState()
    val isDark = state.settings.theme == "dark"

    val formattedDate = remember(state.activeDateStr) {
        val today = LocalDate.now()
        val todayStr = MomentumEngine.getTodayString()
        val yesterdayStr = today.minusDays(1).toString()

        when (state.activeDateStr) {
            todayStr -> "Today, ${today.format(DateTimeFormatter.ofPattern("MMM d"))}"
            yesterdayStr -> "Yesterday, ${today.minusDays(1).format(DateTimeFormatter.ofPattern("MMM d"))}"
            else -> {
                try {
                    val parsed = LocalDate.parse(state.activeDateStr)
                    parsed.format(DateTimeFormatter.ofPattern("EEE, MMM d"))
                } catch (e: Exception) {
                    state.activeDateStr
                }
            }
        }
    }

    val screenBg = if (isDark) DarkBg else LightBg
    val navBg = if (isDark) DarkCard.copy(alpha = 0.95f) else LightCard.copy(alpha = 0.95f)
    val borderCol = if (isDark) DarkBorder else LightBorder
    val textPrimary = if (isDark) Color.White else Slate900
    val textSecondary = if (isDark) Color(0xFF94A3B8) else Slate500

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(screenBg)
    ) {
        Scaffold(
            topBar = {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = navBg,
                    shadowElevation = 2.dp
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .statusBarsPadding()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Brand Logo + Title
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(
                                        Brush.linearGradient(
                                            listOf(Color(0xFF6366F1), Color(0xFF8B5CF6))
                                        )
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "F",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color.White
                                )
                            }
                            Text(
                                text = "Flux",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = textPrimary
                            )
                        }

                        // Date Pill
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = if (isDark) Color(0xFF131D33) else Color(0xFFF1F5F9),
                            border = androidx.compose.foundation.BorderStroke(1.dp, borderCol),
                            modifier = Modifier.clickable { viewModel.openDatePicker() }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CalendarToday,
                                    contentDescription = "Date",
                                    tint = Emerald500,
                                    modifier = Modifier.size(14.dp)
                                )
                                Text(
                                    text = formattedDate,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    fontFamily = FontFamily.Monospace,
                                    color = textPrimary
                                )
                                Icon(
                                    imageVector = Icons.Default.KeyboardArrowDown,
                                    contentDescription = "Select",
                                    tint = textSecondary,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }

                        // Right Action Buttons
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            IconButton(
                                onClick = { viewModel.openCornerHub() },
                                modifier = Modifier.size(36.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.GridView,
                                    contentDescription = "Habit Hub",
                                    tint = textSecondary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            IconButton(
                                onClick = { viewModel.openSettings() },
                                modifier = Modifier.size(36.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Settings,
                                    contentDescription = "Settings",
                                    tint = textSecondary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }
                }
            },
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { viewModel.openHabitForm() },
                    containerColor = Emerald500,
                    contentColor = Color.White,
                    shape = CircleShape,
                    modifier = Modifier
                        .padding(bottom = 12.dp)
                        .shadow(8.dp, CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Add Habit",
                        modifier = Modifier.size(26.dp)
                    )
                }
            },
            containerColor = Color.Transparent
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                HabitReelDeck(
                    habits = state.habits,
                    activeDateStr = state.activeDateStr,
                    isDark = isDark,
                    floorAtZero = state.settings.floorAtZero,
                    jumboPointsCount = state.jumboDates.size,
                    onCheckIn = { habitId, status, dateStr ->
                        viewModel.handleCheckIn(habitId, status, dateStr)
                    },
                    onOpenDetail = { habit ->
                        viewModel.openHabitDetail(habit)
                    },
                    onAscendHabit = { habit ->
                        // Triggers milestone ascension modal
                        viewModel.openHabitDetail(habit)
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }
        }

        // Modals Layer
        AuthGateModal(
            isOpen = state.showAuthGate,
            isDark = isDark,
            onSuccess = { tester ->
                viewModel.unlockWithTester(tester)
            }
        )

        SettingsModal(
            isOpen = state.showSettings,
            isDark = isDark,
            settings = state.settings,
            currentTester = state.currentTester,
            totalHabitsCount = state.habits.size,
            onClose = { viewModel.closeSettings() },
            onUpdateSettings = { viewModel.updateSettings(it) },
            onSwitchTester = { passkey ->
                val tester = com.flux.habittracker.model.TesterRegistry.findByPasskey(passkey)
                if (tester != null) {
                    viewModel.unlockWithTester(tester)
                }
            },
            onResetData = { viewModel.resetUserData() }
        )

        CornerHubModal(
            isOpen = state.showCornerHub,
            isDark = isDark,
            habits = state.habits,
            floorAtZero = state.settings.floorAtZero,
            onClose = { viewModel.closeCornerHub() },
            onSelectHabit = { habit ->
                viewModel.openHabitDetail(habit)
            },
            onAddNewHabit = {
                viewModel.openHabitForm()
            }
        )

        DatePickerSheet(
            isOpen = state.showDatePicker,
            isDark = isDark,
            selectedDateStr = state.activeDateStr,
            onSelectDate = { viewModel.selectDate(it) },
            onClose = { viewModel.closeDatePicker() }
        )

        HabitFormModal(
            habitToEdit = state.habitToEdit,
            isOpen = state.showHabitForm,
            isDark = isDark,
            categories = state.categories,
            onClose = { viewModel.closeHabitForm() },
            onSave = { viewModel.saveHabit(it) }
        )

        HabitDetailModal(
            habit = state.detailHabit,
            isOpen = state.detailHabit != null,
            isDark = isDark,
            floorAtZero = state.settings.floorAtZero,
            onClose = { viewModel.closeHabitDetail() },
            onEdit = { habit ->
                viewModel.closeHabitDetail()
                viewModel.openHabitForm(habit)
            },
            onDelete = { habitId ->
                viewModel.deleteHabit(habitId)
            }
        )

        MilestoneAscensionModal(
            habit = state.ascendingHabit,
            isOpen = state.ascendingHabit != null,
            isDark = isDark,
            onClose = { viewModel.dismissAscension() },
            onAscend = { habitId, targetGoalDays, bonusXP ->
                viewModel.confirmAscension(habitId, targetGoalDays, bonusXP)
            }
        )
    }
}
