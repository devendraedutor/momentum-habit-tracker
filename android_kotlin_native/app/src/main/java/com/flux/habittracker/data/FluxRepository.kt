package com.flux.habittracker.data

import android.content.Context
import android.content.SharedPreferences
import com.flux.habittracker.engine.MomentumEngine
import com.flux.habittracker.model.CheckInStatus
import com.flux.habittracker.model.Frequency
import com.flux.habittracker.model.Habit
import com.flux.habittracker.model.HabitType
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

data class UserSettings(
    val soundEffects: Boolean = true,
    val confetti: Boolean = true,
    val floorAtZero: Boolean = false,
    val autoMarkMissedPastDays: Boolean = false,
    val theme: String = "light"
)

class FluxRepository(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("flux_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()

    companion object {
        val DEFAULT_CATEGORIES = listOf(
            "Productivity",
            "Health & Fitness",
            "Learning",
            "Mindset",
            "Lifestyle"
        )
    }

    // Active Session Tester User ID
    fun getActiveSessionUserId(): String? {
        return prefs.getString("flux_active_session", null)
    }

    fun setActiveSessionUserId(userId: String?) {
        prefs.edit().putString("flux_active_session", userId).apply()
    }

    private fun getStorageKey(domain: String, userId: String? = null): String {
        val activeUser = userId ?: getActiveSessionUserId() ?: "guest"
        return "${activeUser}__${domain}"
    }

    // Habits
    fun loadHabits(userId: String? = null): List<Habit> {
        val key = getStorageKey("habits", userId)
        val json = prefs.getString(key, null)
        if (json.isNullOrBlank()) {
            // Return initial starter habit if none exists yet
            val today = MomentumEngine.getTodayString()
            val initial = listOf(
                Habit(
                    id = "starter_reading",
                    name = "Daily Reading",
                    description = "Read 15 pages of non-fiction",
                    category = "Learning",
                    icon = "BookOpen",
                    color = "#10b981",
                    type = HabitType.BUILD,
                    frequency = Frequency.DAILY,
                    targetGoalDays = 21,
                    currentTier = 1,
                    history = emptyMap(),
                    createdAt = today,
                    startDate = today
                ),
                Habit(
                    id = "starter_workout",
                    name = "Morning Workout",
                    description = "30 mins cardio or strength",
                    category = "Health & Fitness",
                    icon = "Dumbbell",
                    color = "#06b6d4",
                    type = HabitType.BUILD,
                    frequency = Frequency.DAILY,
                    targetGoalDays = 21,
                    currentTier = 1,
                    history = emptyMap(),
                    createdAt = today,
                    startDate = today
                )
            )
            saveHabits(initial, userId)
            return initial
        }

        return try {
            val type = object : TypeToken<List<Habit>>() {}.type
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun saveHabits(habits: List<Habit>, userId: String? = null) {
        val key = getStorageKey("habits", userId)
        val json = gson.toJson(habits)
        prefs.edit().putString(key, json).apply()
    }

    // Settings
    fun loadSettings(userId: String? = null): UserSettings {
        val key = getStorageKey("settings", userId)
        val json = prefs.getString(key, null) ?: return UserSettings()
        return try {
            gson.fromJson(json, UserSettings::class.java) ?: UserSettings()
        } catch (e: Exception) {
            UserSettings()
        }
    }

    fun saveSettings(settings: UserSettings, userId: String? = null) {
        val key = getStorageKey("settings", userId)
        val json = gson.toJson(settings)
        prefs.edit().putString(key, json).apply()
    }

    // Categories
    fun loadCategories(userId: String? = null): List<String> {
        val key = getStorageKey("categories", userId)
        val json = prefs.getString(key, null) ?: return DEFAULT_CATEGORIES
        return try {
            val type = object : TypeToken<List<String>>() {}.type
            gson.fromJson(json, type) ?: DEFAULT_CATEGORIES
        } catch (e: Exception) {
            DEFAULT_CATEGORIES
        }
    }

    fun saveCategories(categories: List<String>, userId: String? = null) {
        val key = getStorageKey("categories", userId)
        val json = gson.toJson(categories)
        prefs.edit().putString(key, json).apply()
    }

    // Jumbo Points Wallet (dates completed 100%)
    fun loadJumboDates(userId: String? = null): List<String> {
        val key = getStorageKey("jumbo_wallet", userId)
        val json = prefs.getString(key, null) ?: return emptyList()
        return try {
            val type = object : TypeToken<List<String>>() {}.type
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun saveJumboDates(dates: List<String>, userId: String? = null) {
        val key = getStorageKey("jumbo_wallet", userId)
        val json = gson.toJson(dates)
        prefs.edit().putString(key, json).apply()
    }
}
