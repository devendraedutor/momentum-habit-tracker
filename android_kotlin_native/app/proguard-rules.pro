# Proguard rules for Flux Habit Tracker
-keepattributes *Annotation*
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.flux.habittracker.model.** { *; }
