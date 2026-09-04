package com.flux.habittracker.engine

import com.flux.habittracker.model.Habit
import com.flux.habittracker.model.HabitStats
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

object MomentumEngine {

    private val DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd")
    private val DISPLAY_FORMATTER = DateTimeFormatter.ofPattern("MMM d")

    fun getTodayString(): String {
        return LocalDate.now().format(DATE_FORMATTER)
    }

    fun formatDate(date: LocalDate): String {
        return date.format(DATE_FORMATTER)
    }

    fun parseDate(dateStr: String): LocalDate {
        return try {
            LocalDate.parse(dateStr, DATE_FORMATTER)
        } catch (e: Exception) {
            LocalDate.now()
        }
    }

    fun formatDisplayDate(dateStr: String): String {
        return try {
            val date = LocalDate.parse(dateStr, DATE_FORMATTER)
            date.format(DISPLAY_FORMATTER)
        } catch (e: Exception) {
            dateStr
        }
    }

    fun getDateRange(startDateStr: String, endDateStr: String): List<String> {
        val start = parseDate(startDateStr)
        val end = parseDate(endDateStr)
        val dates = mutableListOf<String>()
        var current = start
        while (!current.isAfter(end)) {
            dates.add(formatDate(current))
            current = current.plusDays(1)
        }
        return dates
    }

    fun getEffectiveEndDate(habit: Habit): String {
        val todayStr = getTodayString()
        var latest = todayStr
        habit.history.keys.forEach { d ->
            if (d > latest) latest = d
        }
        return latest
    }

    fun getEffectiveStartDate(habit: Habit): String {
        val todayStr = getTodayString()
        var earliest = if (habit.createdAt.isNotBlank() && habit.createdAt.length >= 10) {
            habit.createdAt.substring(0, 10)
        } else todayStr

        habit.startDate?.let {
            if (it < earliest) earliest = it
        }

        habit.history.keys.forEach { d ->
            if (d < earliest) earliest = d
        }
        return earliest
    }

    fun calculateHabitStats(habit: Habit, floorAtZero: Boolean = false): HabitStats {
        val endDateStr = getEffectiveEndDate(habit)
        val startDateStr = getEffectiveStartDate(habit)
        val allDates = getDateRange(startDateStr, endDateStr)

        var runningScore = 0
        var totalDone = 0
        var totalMissed = 0
        var bestStreak = 0
        var tempStreak = 0

        for (date in allDates) {
            val status = habit.history[date] ?: "none"
            var delta = 0
            if (status == "done") {
                delta = 1
                totalDone++
                tempStreak++
                if (tempStreak > bestStreak) bestStreak = tempStreak
            } else if (status == "missed") {
                delta = -1
                totalMissed++
                tempStreak = 0
            }

            runningScore += delta
            if (floorAtZero && runningScore < 0) {
                runningScore = 0
            }
        }

        val bonusXP = (habit.conqueredMilestonesCount * 5)
        val currentScore = runningScore + bonusXP

        // Calculate current active streak backwards
        var currentStreak = 0
        val allDatesDesc = allDates.reversed()

        for (i in allDatesDesc.indices) {
            val d = allDatesDesc[i]
            val status = habit.history[d]

            if (i == 0 && (status == null || status == "none")) {
                continue
            }

            if (status == "done") {
                currentStreak++
            } else {
                break
            }
        }

        val totalLogged = totalDone + totalMissed
        val completionRate = if (totalLogged > 0) (totalDone.toFloat() / totalLogged) * 100f else 0f

        val targetGoalDays = if (habit.targetGoalDays > 0) habit.targetGoalDays else 21
        val currentGoalStreak = currentStreak
        val goalDaysRemaining = max(0, targetGoalDays - currentGoalStreak)
        val goalProgressPercent = min(100, ((currentGoalStreak.toFloat() / targetGoalDays) * 100f).roundToInt())
        val goalAchieved = currentGoalStreak >= targetGoalDays && currentStreak > 0

        return HabitStats(
            currentScore = currentScore,
            currentStreak = currentStreak,
            bestStreak = bestStreak,
            totalDone = totalDone,
            totalMissed = totalMissed,
            completionRate = completionRate,
            currentGoalStreak = currentGoalStreak,
            goalProgressPercent = goalProgressPercent,
            targetGoalDays = targetGoalDays,
            goalDaysRemaining = goalDaysRemaining,
            goalAchieved = goalAchieved
        )
    }
}
