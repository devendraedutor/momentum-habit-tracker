package com.flux.habittracker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.view.WindowCompat
import com.flux.habittracker.ui.MainHabitScreen
import com.flux.habittracker.ui.theme.FluxTheme
import com.flux.habittracker.ui.viewmodel.FluxViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: FluxViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        setContent {
            val state by viewModel.uiState.collectAsState()

            val isDark = state.settings.theme == "dark"

            FluxTheme(darkTheme = isDark) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainHabitScreen(viewModel = viewModel)
                }
            }
        }
    }
}
