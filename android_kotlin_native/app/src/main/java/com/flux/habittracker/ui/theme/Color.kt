package com.flux.habittracker.ui.theme

import androidx.compose.ui.graphics.Color

val Emerald500 = Color(0xFF10B981)
val Emerald400 = Color(0xFF34D399)
val Emerald600 = Color(0xFF059669)

val Cyan500 = Color(0xFF06B6D4)
val Cyan400 = Color(0xFF22D3EE)
val Cyan600 = Color(0xFF0891B2)

val Indigo500 = Color(0xFF6366F1)
val Indigo400 = Color(0xFF818CF8)

val Amber500 = Color(0xFFF59E0B)
val Amber400 = Color(0xFFFBBF24)
val Amber600 = Color(0xFFD97706)

val Rose500 = Color(0xFFF43F5E)
val Rose400 = Color(0xFFFB7185)
val Rose600 = Color(0xFFE11D48)

val DarkBg = Color(0xFF090D16)
val DarkCard = Color(0xFF0F172A)
val DarkCardHover = Color(0xFF131D33)
val DarkBorder = Color(0xFF253248)
val DarkBorderHover = Color(0xFF3B4D6B)

val LightBg = Color(0xFFF8FAFC)
val LightCard = Color(0xFFFFFFFF)
val LightCardHover = Color(0xFFF1F5F9)
val LightBorder = Color(0xFFE2E8F0)
val LightBorderHover = Color(0xFFCBD5E1)

val Slate900 = Color(0xFF0F172A)
val Slate800 = Color(0xFF1E293B)
val Slate700 = Color(0xFF334155)
val Slate600 = Color(0xFF475569)
val Slate500 = Color(0xFF64748B)
val Slate400 = Color(0xFF94A3B8)
val Slate300 = Color(0xFFCBD5E1)
val Slate200 = Color(0xFFE2E8F0)
val Slate100 = Color(0xFFF1F5F9)
val Slate50 = Color(0xFFF8FAFC)

fun parseHexColor(hexString: String?, defaultColor: Color = Emerald500): Color {
    if (hexString.isNullOrBlank()) return defaultColor
    return try {
        val clean = hexString.removePrefix("#")
        val colorInt = when (clean.length) {
            6 -> 0xFF000000.toInt() or clean.toInt(16)
            8 -> clean.toLong(16).toInt()
            else -> return defaultColor
        }
        Color(colorInt)
    } catch (e: Exception) {
        defaultColor
    }
}
