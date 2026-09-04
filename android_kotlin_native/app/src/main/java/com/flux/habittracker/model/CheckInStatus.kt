package com.flux.habittracker.model

import com.google.gson.annotations.SerializedName

enum class CheckInStatus(val value: String) {
    @SerializedName("done")
    DONE("done"),

    @SerializedName("completed")
    COMPLETED("done"),

    @SerializedName("controlled")
    CONTROLLED("controlled"),

    @SerializedName("missed")
    MISSED("missed"),

    @SerializedName("skip")
    SKIPPED("skip"),

    @SerializedName("none")
    NONE("none");

    companion object {
        fun fromValue(value: String?): CheckInStatus {
            return entries.find { it.value.equals(value, ignoreCase = true) } ?: NONE
        }
    }
}

enum class HabitType(val value: String) {
    @SerializedName("BUILD")
    BUILD("BUILD"),

    @SerializedName("BREAK")
    BREAK("BREAK")
}

enum class Frequency(val value: String) {
    @SerializedName("daily")
    DAILY("daily"),

    @SerializedName("weekdays")
    WEEKDAYS("weekdays"),

    @SerializedName("weekends")
    WEEKENDS("weekends")
}
