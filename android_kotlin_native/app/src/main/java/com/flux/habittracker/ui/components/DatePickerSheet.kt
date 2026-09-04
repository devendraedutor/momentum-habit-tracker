package com.flux.habittracker.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.flux.habittracker.engine.MomentumEngine
import com.flux.habittracker.ui.theme.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

@Composable
fun DatePickerSheet(
    isOpen: Boolean,
    isDark: Boolean,
    selectedDateStr: String,
    onSelectDate: (String) -> Unit,
    onClose: () -> Unit
) {
    if (!isOpen) return

    val today = remember { LocalDate.now() }
    val todayStr = remember { MomentumEngine.getTodayString() }
    val daysRange = remember {
        (13 downTo 0).map { today.minusDays(it.toLong()) }
    }

    val cardBg = if (isDark) DarkCard else LightCard
    val borderCol = if (isDark) DarkBorder else LightBorder
    val textPrimary = if (isDark) Color.White else Slate900
    val textSecondary = if (isDark) Color(0xFF94A3B8) else Slate500

    Dialog(
        onDismissRequest = onClose,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.6f))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onClose
                ),
            contentAlignment = Alignment.BottomCenter
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        onClick = {}
                    ),
                shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
                colors = CardDefaults.cardColors(containerColor = cardBg),
                elevation = CardDefaults.cardElevation(defaultElevation = 20.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp)
                ) {
                    // Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Timeline Navigation",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = textPrimary
                            )
                            Text(
                                text = "Select date to view and log history",
                                fontSize = 12.sp,
                                color = textSecondary
                            )
                        }

                        IconButton(
                            onClick = onClose,
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = textSecondary)
                        }
                    }

                    // Quick buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        val yesterdayStr = today.minusDays(1).toString()
                        OutlinedButton(
                            onClick = {
                                onSelectDate(yesterdayStr)
                                onClose()
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Yesterday", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }

                        Button(
                            onClick = {
                                onSelectDate(todayStr)
                                onClose()
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Emerald500)
                        ) {
                            Text("Today", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }

                    // Horizontal Days Carousel
                    LazyRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        contentPadding = PaddingValues(horizontal = 4.dp)
                    ) {
                        items(daysRange) { date ->
                            val dStr = date.toString()
                            val isSelected = dStr == selectedDateStr
                            val isCurrentToday = dStr == todayStr
                            val dayOfWeek = date.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.ENGLISH).uppercase()
                            val dayOfMonth = date.dayOfMonth.toString()

                            Box(
                                modifier = Modifier
                                    .width(58.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(
                                        when {
                                            isSelected -> Emerald500
                                            isCurrentToday -> Emerald500.copy(alpha = 0.12f)
                                            isDark -> Color(0xFF131D33)
                                            else -> Color(0xFFF1F5F9)
                                        }
                                    )
                                    .border(
                                        width = if (isSelected) 2.dp else if (isCurrentToday) 1.dp else 0.dp,
                                        color = if (isSelected) Emerald500 else if (isCurrentToday) Emerald500.copy(alpha = 0.5f) else Color.Transparent,
                                        shape = RoundedCornerShape(16.dp)
                                    )
                                    .clickable {
                                        onSelectDate(dStr)
                                        onClose()
                                    }
                                    .padding(vertical = 12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text(
                                        text = dayOfWeek,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace,
                                        color = if (isSelected) Color.White else textSecondary
                                    )
                                    Text(
                                        text = dayOfMonth,
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        fontFamily = FontFamily.Monospace,
                                        color = if (isSelected) Color.White else textPrimary
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
