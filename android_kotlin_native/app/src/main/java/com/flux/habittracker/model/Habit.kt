package com.flux.habittracker.model

import com.google.gson.annotations.SerializedName
import java.util.UUID

data class Habit(
    @SerializedName("id")
    val id: String = UUID.randomUUID().toString(),

    @SerializedName("name")
    val name: String,

    @SerializedName("description")
    val description: String? = null,

    @SerializedName("category")
    val category: String = "general",

    @SerializedName("icon")
    val icon: String = "Zap",

    @SerializedName("color")
    val color: String = "#10b981",

    @SerializedName("type")
    val type: HabitType = HabitType.BUILD,

    @SerializedName("frequency")
    val frequency: Frequency = Frequency.DAILY,

    @SerializedName("targetGoalDays")
    val targetGoalDays: Int = 21,

    @SerializedName("currentTier")
    val currentTier: Int = 1,

    @SerializedName("conqueredMilestonesCount")
    val conqueredMilestonesCount: Int = 0,

    @SerializedName("history")
    val history: Map<String, String> = emptyMap(),

    @SerializedName("createdAt")
    val createdAt: String = "",

    @SerializedName("startDate")
    val startDate: String? = null,

    @SerializedName("archived")
    val archived: Boolean = false
)

data class HabitStats(
    val currentScore: Int,
    val currentStreak: Int,
    val bestStreak: Int,
    val totalDone: Int,
    val totalMissed: Int,
    val completionRate: Float,
    val currentGoalStreak: Int,
    val goalProgressPercent: Int,
    val targetGoalDays: Int,
    val goalDaysRemaining: Int,
    val goalAchieved: Boolean
)
