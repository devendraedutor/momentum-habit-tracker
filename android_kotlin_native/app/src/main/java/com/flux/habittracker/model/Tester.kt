package com.flux.habittracker.model

data class Tester(
    val id: String,
    val name: String,
    val passkey: String,
    val role: String = "Authorized Tester"
)

object TesterRegistry {
    val AUTHORIZED_TESTERS = mapOf(
        "FLUX_CHIRAG" to Tester(id = "chirag", name = "Chirag", passkey = "FLUX_CHIRAG", role = "Lead Tester"),
        "FLUX_PRINCE" to Tester(id = "prince", name = "Prince", passkey = "FLUX_PRINCE", role = "Beta Tester"),
        "FLUX_DEVENDRA" to Tester(id = "devendra", name = "Devendra", passkey = "FLUX_DEVENDRA", role = "Core Tester"),
        "FLUX_KHETESH" to Tester(id = "khetesh", name = "Khetesh", passkey = "FLUX_KHETESH", role = "Beta Tester"),
        "FLUX_ADMIN" to Tester(id = "admin", name = "Admin", passkey = "FLUX_ADMIN", role = "Administrator")
    )

    fun validatePasskey(input: String): Tester? {
        val normalized = input.trim().uppercase()
        return AUTHORIZED_TESTERS[normalized]
    }

    fun findByPasskey(input: String): Tester? {
        return validatePasskey(input)
    }
}
