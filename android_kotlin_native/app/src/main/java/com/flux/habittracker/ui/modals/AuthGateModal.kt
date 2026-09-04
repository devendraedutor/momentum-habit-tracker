package com.flux.habittracker.ui.modals

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.keyframes
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Key
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.flux.habittracker.model.Tester
import com.flux.habittracker.model.TesterRegistry
import com.flux.habittracker.ui.theme.Cyan400
import com.flux.habittracker.ui.theme.Cyan500
import com.flux.habittracker.ui.theme.DarkBg
import com.flux.habittracker.ui.theme.DarkBorder
import com.flux.habittracker.ui.theme.DarkCard
import com.flux.habittracker.ui.theme.Emerald400
import com.flux.habittracker.ui.theme.Emerald500
import com.flux.habittracker.ui.theme.Indigo500
import com.flux.habittracker.ui.theme.LightBg
import com.flux.habittracker.ui.theme.LightBorder
import com.flux.habittracker.ui.theme.LightCard
import com.flux.habittracker.ui.theme.Rose500
import com.flux.habittracker.ui.theme.Slate400
import com.flux.habittracker.ui.theme.Slate900
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

@Composable
fun AuthGateModal(
    isOpen: Boolean,
    isDark: Boolean,
    onSuccess: (Tester) -> Unit
) {
    if (!isOpen) return

    var passkeyInput by remember { mutableStateOf("") }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    val shakeOffset = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()

    val cardBg = if (isDark) DarkCard else LightCard
    val borderCol = if (isDark) DarkBorder else LightBorder
    val textPrimary = if (isDark) Color.White else Slate900

    fun submit() {
        val trimmed = passkeyInput.trim().uppercase()
        if (trimmed.isEmpty()) {
            errorMsg = "Please enter your beta passkey."
            scope.launch {
                shakeOffset.snapTo(0f)
                shakeOffset.animateTo(
                    targetValue = 0f,
                    animationSpec = keyframes {
                        durationMillis = 400
                        -16f at 50
                        16f at 100
                        -12f at 150
                        12f at 200
                        -6f at 250
                        6f at 300
                        0f at 400
                    }
                )
            }
            return
        }

        val validated = TesterRegistry.validatePasskey(trimmed)
        if (validated != null) {
            errorMsg = null
            onSuccess(validated)
        } else {
            errorMsg = "Unrecognized passkey. Contact admin."
            scope.launch {
                shakeOffset.snapTo(0f)
                shakeOffset.animateTo(
                    targetValue = 0f,
                    animationSpec = keyframes {
                        durationMillis = 400
                        -16f at 50
                        16f at 100
                        -12f at 150
                        12f at 200
                        -6f at 250
                        6f at 300
                        0f at 400
                    }
                )
            }
        }
    }

    Dialog(
        onDismissRequest = {},
        properties = DialogProperties(dismissOnBackPress = false, dismissOnClickOutside = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .offset { IntOffset(shakeOffset.value.roundToInt(), 0) }
                .clip(RoundedCornerShape(28.dp))
                .background(cardBg)
                .border(1.dp, borderCol, RoundedCornerShape(28.dp))
        ) {
            // Top Accent Bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(4.dp)
                    .background(
                        Brush.horizontalGradient(
                            listOf(Emerald500, Cyan500, Indigo500)
                        )
                    )
            )

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Brand Icon Frame
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(
                            Brush.linearGradient(
                                listOf(Emerald400, Cyan500, Indigo500)
                            )
                        )
                        .padding(1.5.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(RoundedCornerShape(14.dp))
                            .background(if (isDark) DarkBg else Slate900),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Bolt,
                            contentDescription = "Flux",
                            tint = Emerald400,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Title
                Text(
                    text = "Flux Beta Access",
                    color = textPrimary,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = (-0.5).sp
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Passkey Input Field
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(if (isDark) Color(0xFF1E293B) else LightBg)
                        .border(
                            1.dp,
                            if (errorMsg != null) Rose500 else borderCol,
                            RoundedCornerShape(16.dp)
                        )
                        .padding(horizontal = 14.dp, vertical = 12.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Key,
                            contentDescription = null,
                            tint = Slate400,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))

                        BasicTextField(
                            value = passkeyInput,
                            onValueChange = {
                                passkeyInput = it.uppercase()
                                if (errorMsg != null) errorMsg = null
                            },
                            textStyle = TextStyle(
                                color = textPrimary,
                                fontSize = 14.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            ),
                            cursorBrush = SolidColor(Cyan400),
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                            keyboardActions = KeyboardActions(onDone = { submit() }),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            decorationBox = { innerTextField ->
                                if (passkeyInput.isEmpty()) {
                                    Text(
                                        text = "ENTER PASSKEY",
                                        color = Slate400,
                                        fontSize = 13.sp,
                                        fontFamily = FontFamily.SansSerif,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                                innerTextField()
                            }
                        )
                    }
                }

                // Error Message
                if (errorMsg != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = Icons.Default.Error,
                            contentDescription = null,
                            tint = Rose500,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = errorMsg ?: "",
                            color = Rose500,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                // Action Button: Unlock Flux
                Button(
                    onClick = { submit() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(
                            Brush.horizontalGradient(
                                listOf(Emerald500, Cyan500, Indigo500)
                            )
                        ),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "Unlock Flux",
                            color = Slate900,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = null,
                            tint = Slate900,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }
    }
}
