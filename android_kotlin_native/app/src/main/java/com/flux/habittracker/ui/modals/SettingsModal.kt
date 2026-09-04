package com.flux.habittracker.ui.modals

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
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
import com.flux.habittracker.data.UserSettings
import com.flux.habittracker.model.Tester
import com.flux.habittracker.model.TesterRegistry
import com.flux.habittracker.ui.theme.*

@Composable
fun SettingsModal(
    isOpen: Boolean,
    isDark: Boolean,
    settings: UserSettings,
    currentTester: Tester?,
    totalHabitsCount: Int,
    onClose: () -> Unit,
    onUpdateSettings: (UserSettings) -> Unit,
    onSwitchTester: (String) -> Unit,
    onResetData: () -> Unit
) {
    if (!isOpen) return

    var showPasskeyInput by remember { mutableStateOf(false) }
    var newPasskey by remember { mutableStateOf("") }
    var passkeyError by remember { mutableStateOf<String?>(null) }
    var showResetConfirm by remember { mutableStateOf(false) }

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
                .background(Color.Black.copy(alpha = 0.65f))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onClose
                ),
            contentAlignment = Alignment.Center
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth(0.92f)
                    .widthIn(max = 440.dp)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        onClick = {}
                    ),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = cardBg),
                elevation = CardDefaults.cardElevation(defaultElevation = 16.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    // Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(CircleShape)
                                    .background(Indigo500.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Settings,
                                    contentDescription = "Settings",
                                    tint = Indigo500,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Column {
                                Text(
                                    text = "Preferences",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = textPrimary
                                )
                                Text(
                                    text = "Flux v1.1 • Beta Channel",
                                    fontSize = 11.sp,
                                    color = textSecondary
                                )
                            }
                        }

                        IconButton(
                            onClick = onClose,
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close",
                                tint = textSecondary
                            )
                        }
                    }

                    HorizontalDivider(color = borderCol)

                    // Theme Section
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = "APPEARANCE",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = textSecondary,
                            letterSpacing = 1.sp,
                            fontFamily = FontFamily.Monospace
                        )

                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = if (isDark) Color(0xFF131D33) else Color(0xFFF8FAFC),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Icon(
                                        imageVector = if (isDark) Icons.Default.DarkMode else Icons.Default.LightMode,
                                        contentDescription = null,
                                        tint = if (isDark) Indigo500 else Amber500
                                    )
                                    Column {
                                        Text(
                                            text = if (isDark) "Dark Theme" else "Light Theme",
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = textPrimary
                                        )
                                        Text(
                                            text = if (isDark) "OLED-optimized obsidian" else "Crisp high-contrast layout",
                                            fontSize = 11.sp,
                                            color = textSecondary
                                        )
                                    }
                                }

                                Switch(
                                    checked = isDark,
                                    onCheckedChange = { isChecked ->
                                        onUpdateSettings(settings.copy(theme = if (isChecked) "dark" else "light"))
                                    }
                                )
                            }
                        }
                    }

                    // Toggles for Sound & Confetti
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = "EXPERIENCE",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = textSecondary,
                            letterSpacing = 1.sp,
                            fontFamily = FontFamily.Monospace
                        )

                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = if (isDark) Color(0xFF131D33) else Color(0xFFF8FAFC),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text("Celebration Confetti", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = textPrimary)
                                        Text("Particle explosion on completion", fontSize = 11.sp, color = textSecondary)
                                    }
                                    Switch(
                                        checked = settings.confetti,
                                        onCheckedChange = { onUpdateSettings(settings.copy(confetti = it)) }
                                    )
                                }

                                HorizontalDivider(color = borderCol)

                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text("Floor Momentum at Zero", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = textPrimary)
                                        Text("XP cannot drop into negative numbers", fontSize = 11.sp, color = textSecondary)
                                    }
                                    Switch(
                                        checked = settings.floorAtZero,
                                        onCheckedChange = { onUpdateSettings(settings.copy(floorAtZero = it)) }
                                    )
                                }
                            }
                        }
                    }

                    // Tester Account Section
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = "TESTER ACCOUNT",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = textSecondary,
                            letterSpacing = 1.sp,
                            fontFamily = FontFamily.Monospace
                        )

                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = if (isDark) Color(0xFF131D33) else Color(0xFFF8FAFC),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(36.dp)
                                                .clip(CircleShape)
                                                .background(Emerald500.copy(alpha = 0.15f)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = (currentTester?.name?.take(1) ?: "T").uppercase(),
                                                fontSize = 15.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Emerald500
                                            )
                                        }
                                        Column {
                                            Text(
                                                text = currentTester?.name ?: "Beta Tester",
                                                fontSize = 14.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                color = textPrimary
                                            )
                                            Text(
                                                text = currentTester?.role ?: "Authorized Tester",
                                                fontSize = 11.sp,
                                                color = Emerald500
                                            )
                                        }
                                    }

                                    OutlinedButton(
                                        onClick = { showPasskeyInput = !showPasskeyInput },
                                        shape = RoundedCornerShape(10.dp),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                    ) {
                                        Text(
                                            text = if (showPasskeyInput) "Cancel" else "Switch",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }

                                AnimatedVisibility(visible = showPasskeyInput) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(top = 8.dp),
                                        verticalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        OutlinedTextField(
                                            value = newPasskey,
                                            onValueChange = {
                                                newPasskey = it
                                                passkeyError = null
                                            },
                                            label = { Text("New Tester Passkey", fontSize = 12.sp) },
                                            placeholder = { Text("ENTER PASSKEY", fontSize = 12.sp) },
                                            singleLine = true,
                                            isError = passkeyError != null,
                                            supportingText = passkeyError?.let { { Text(it, color = Rose500) } },
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(12.dp)
                                        )

                                        Button(
                                            onClick = {
                                                val trimmed = newPasskey.trim()
                                                val verified = TesterRegistry.findByPasskey(trimmed)
                                                if (verified != null) {
                                                    onSwitchTester(trimmed)
                                                    showPasskeyInput = false
                                                    newPasskey = ""
                                                    passkeyError = null
                                                } else {
                                                    passkeyError = "Invalid beta passkey"
                                                }
                                            },
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(12.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = Emerald500)
                                        ) {
                                            Text("Authenticate & Switch", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                        }
                                    }
                                }

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(if (isDark) DarkCard else LightCard)
                                        .padding(horizontal = 14.dp, vertical = 10.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column {
                                        Text("Active Habits", fontSize = 10.sp, color = textSecondary)
                                        Text("$totalHabitsCount items", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = textPrimary)
                                    }
                                    Column {
                                        Text("Engine Status", fontSize = 10.sp, color = textSecondary)
                                        Text("Online ⚡", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Emerald500)
                                    }
                                }
                            }
                        }
                    }

                    // Reset Data Section
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = "DATA MANAGEMENT",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = textSecondary,
                            letterSpacing = 1.sp,
                            fontFamily = FontFamily.Monospace
                        )

                        if (!showResetConfirm) {
                            OutlinedButton(
                                onClick = { showResetConfirm = true },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    contentColor = Rose500
                                ),
                                border = androidx.compose.foundation.BorderStroke(1.dp, Rose500.copy(alpha = 0.3f))
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Outlined.DeleteForever,
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Text(
                                        text = "Reset Profile Progress",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        } else {
                            Surface(
                                shape = RoundedCornerShape(14.dp),
                                color = Rose500.copy(alpha = 0.1f),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(14.dp),
                                    verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Text(
                                        text = "Wipe all current progress and restore starter routines?",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = Rose500
                                    )
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        OutlinedButton(
                                            onClick = { showResetConfirm = false },
                                            modifier = Modifier.weight(1f),
                                            shape = RoundedCornerShape(10.dp)
                                        ) {
                                            Text("Cancel", fontSize = 12.sp)
                                        }
                                        Button(
                                            onClick = {
                                                onResetData()
                                                showResetConfirm = false
                                                onClose()
                                            },
                                            modifier = Modifier.weight(1f),
                                            shape = RoundedCornerShape(10.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = Rose500)
                                        ) {
                                            Text("Yes, Reset", fontSize = 12.sp, color = Color.White)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
