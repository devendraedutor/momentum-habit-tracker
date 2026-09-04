package com.flux.habittracker.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.flux.habittracker.data.FluxRepository
import com.flux.habittracker.data.UserSettings
import com.flux.habittracker.engine.MomentumEngine
import com.flux.habittracker.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class FluxUiState(
    val isUnlocked: Boolean = false,
    val currentTester: Tester? = null,
    val settings: UserSettings = UserSettings(),
    val activeDateStr: String = MomentumEngine.getTodayString(),
    val habits: List<Habit> = emptyList(),
    val categories: List<String> = FluxRepository.DEFAULT_CATEGORIES,
    val jumboDates: List<String> = emptyList(),

    // Modal dialogs state
    val showAuthGate: Boolean = false,
    val showSettings: Boolean = false,
    val showCornerHub: Boolean = false,
    val showDatePicker: Boolean = false,
    val showHabitForm: Boolean = false,
    val habitToEdit: Habit? = null,
    val detailHabit: Habit? = null,
    val ascendingHabit: Habit? = null,
    val confettiTrigger: Boolean = false
)

class FluxViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = FluxRepository(application)

    private val _uiState = MutableStateFlow(FluxUiState())
    val uiState: StateFlow<FluxUiState> = _uiState.asStateFlow()

    init {
        loadSession()
    }

    private fun loadSession() {
        val savedUserId = repository.getActiveSessionUserId()
        val tester = savedUserId?.let { TesterRegistry.findByPasskey(it) }

        if (tester != null) {
            val userSettings = repository.loadSettings(tester.passkey)
            val userHabits = repository.loadHabits(tester.passkey)
            val userCategories = repository.loadCategories(tester.passkey)
            val userJumbo = repository.loadJumboDates(tester.passkey)

            _uiState.update {
                it.copy(
                    isUnlocked = true,
                    currentTester = tester,
                    settings = userSettings,
                    habits = userHabits,
                    categories = userCategories,
                    jumboDates = userJumbo,
                    showAuthGate = false
                )
            }
        } else {
            _uiState.update {
                it.copy(
                    isUnlocked = false,
                    showAuthGate = true
                )
            }
        }
    }

    fun unlockWithTester(tester: Tester) {
        repository.setActiveSessionUserId(tester.passkey)
        val userSettings = repository.loadSettings(tester.passkey)
        val userHabits = repository.loadHabits(tester.passkey)
        val userCategories = repository.loadCategories(tester.passkey)
        val userJumbo = repository.loadJumboDates(tester.passkey)

        _uiState.update {
            it.copy(
                isUnlocked = true,
                currentTester = tester,
                settings = userSettings,
                habits = userHabits,
                categories = userCategories,
                jumboDates = userJumbo,
                showAuthGate = false
            )
        }
    }

    fun updateSettings(newSettings: UserSettings) {
        val passkey = _uiState.value.currentTester?.passkey
        repository.saveSettings(newSettings, passkey)
        _uiState.update { it.copy(settings = newSettings) }
    }

    fun selectDate(dateStr: String) {
        _uiState.update { it.copy(activeDateStr = dateStr) }
    }

    fun handleCheckIn(habitId: String, status: CheckInStatus, dateStr: String) {
        val currentState = _uiState.value
        val passkey = currentState.currentTester?.passkey

        val statusValue = when (status) {
            CheckInStatus.DONE, CheckInStatus.COMPLETED -> "done"
            CheckInStatus.MISSED -> "missed"
            CheckInStatus.CONTROLLED -> "controlled"
            CheckInStatus.SKIPPED -> "skip"
            CheckInStatus.NONE -> null
        }

        val updatedHabits = currentState.habits.map { habit ->
            if (habit.id == habitId) {
                val updatedHistory = habit.history.toMutableMap()
                if (statusValue == null) {
                    updatedHistory.remove(dateStr)
                } else {
                    updatedHistory[dateStr] = statusValue
                }
                habit.copy(history = updatedHistory)
            } else {
                habit
            }
        }

        repository.saveHabits(updatedHabits, passkey)

        // Check if all habits are completed on this date to award Jumbo Points
        val completedCount = updatedHabits.count { it.history[dateStr] == "done" }
        val totalCount = updatedHabits.size
        val isAllCompleted = totalCount > 0 && completedCount == totalCount

        val updatedJumboDates = if (isAllCompleted && !currentState.jumboDates.contains(dateStr)) {
            val list = currentState.jumboDates + dateStr
            repository.saveJumboDates(list, passkey)
            list
        } else {
            currentState.jumboDates
        }

        // Check if habit hit target milestone for ascension
        val targetHabit = updatedHabits.find { it.id == habitId }
        val shouldTriggerAscension = if (targetHabit != null && statusValue == "done") {
            val stats = MomentumEngine.calculateHabitStats(targetHabit, currentState.settings.floorAtZero)
            stats.currentGoalStreak >= (if (targetHabit.targetGoalDays > 0) targetHabit.targetGoalDays else 21)
        } else false

        _uiState.update {
            it.copy(
                habits = updatedHabits,
                jumboDates = updatedJumboDates,
                ascendingHabit = if (shouldTriggerAscension) targetHabit else it.ascendingHabit
            )
        }
    }

    fun confirmAscension(habitId: String, nextTierGoalDays: Int, bonusXP: Int) {
        val currentState = _uiState.value
        val passkey = currentState.currentTester?.passkey

        val updatedHabits = currentState.habits.map { habit ->
            if (habit.id == habitId) {
                habit.copy(
                    targetGoalDays = nextTierGoalDays,
                    currentTier = habit.currentTier + 1,
                    conqueredMilestonesCount = habit.conqueredMilestonesCount + 1
                )
            } else {
                habit
            }
        }

        repository.saveHabits(updatedHabits, passkey)

        _uiState.update {
            it.copy(
                habits = updatedHabits,
                ascendingHabit = null,
                confettiTrigger = true
            )
        }
    }

    fun dismissAscension() {
        _uiState.update { it.copy(ascendingHabit = null) }
    }

    fun saveHabit(habit: Habit) {
        val currentState = _uiState.value
        val passkey = currentState.currentTester?.passkey

        val exists = currentState.habits.any { it.id == habit.id }
        val updatedHabits = if (exists) {
            currentState.habits.map { if (it.id == habit.id) habit else it }
        } else {
            currentState.habits + habit
        }

        repository.saveHabits(updatedHabits, passkey)
        _uiState.update {
            it.copy(
                habits = updatedHabits,
                showHabitForm = false,
                habitToEdit = null
            )
        }
    }

    fun deleteHabit(habitId: String) {
        val currentState = _uiState.value
        val passkey = currentState.currentTester?.passkey

        val updatedHabits = currentState.habits.filter { it.id != habitId }
        repository.saveHabits(updatedHabits, passkey)

        _uiState.update {
            it.copy(
                habits = updatedHabits,
                detailHabit = null,
                showHabitForm = false,
                habitToEdit = null
            )
        }
    }

    fun resetUserData() {
        val passkey = _uiState.value.currentTester?.passkey ?: return
        repository.saveHabits(emptyList(), passkey)
        repository.saveJumboDates(emptyList(), passkey)
        val initialHabits = repository.loadHabits(passkey)

        _uiState.update {
            it.copy(
                habits = initialHabits,
                jumboDates = emptyList()
            )
        }
    }

    // Modal navigation helpers
    fun openSettings() = _uiState.update { it.copy(showSettings = true) }
    fun closeSettings() = _uiState.update { it.copy(showSettings = false) }

    fun openCornerHub() = _uiState.update { it.copy(showCornerHub = true) }
    fun closeCornerHub() = _uiState.update { it.copy(showCornerHub = false) }

    fun openDatePicker() = _uiState.update { it.copy(showDatePicker = true) }
    fun closeDatePicker() = _uiState.update { it.copy(showDatePicker = false) }

    fun openHabitForm(habit: Habit? = null) = _uiState.update { it.copy(showHabitForm = true, habitToEdit = habit) }
    fun closeHabitForm() = _uiState.update { it.copy(showHabitForm = false, habitToEdit = null) }

    fun openHabitDetail(habit: Habit) = _uiState.update { it.copy(detailHabit = habit) }
    fun closeHabitDetail() = _uiState.update { it.copy(detailHabit = null) }
}
