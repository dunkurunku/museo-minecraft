package com.example.aplicacion_npi_3.ui.viewmodels

import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.example.aplicacion_npi_3.ui.fragments.AchievementList

// Clase de datos para los logros
data class Achievement(
    val id: String,
    val title: String,
    val description: String,
    var isUnlocked: Boolean = false,
    val iconResId: Int
)

class MuseumViewModel : ViewModel() {

    // Datos Globales
    val playerName = MutableLiveData<String>("")
    val language = MutableLiveData<String>("es")
    val knowledgeLevel = MutableLiveData<Int>(1)
    val avatarFaceColors = MutableLiveData<List<Int>>(MutableList(64) { 0xFFFFFFFF.toInt() })

    // Evento para el popup visual
    val achievementPopupEvent = MutableLiveData<Achievement?>()

    //Recursos
    val inventory = MutableLiveData<MutableMap<String, Boolean>>(mutableMapOf())

    // Equipo
    val equipment = MutableLiveData<MutableMap<String, String>>(mutableMapOf(
        "CASCO" to "VACIO",
        "PETO" to "VACIO",
        "PANTALONES" to "VACIO",
        "BOTAS" to "VACIO",
        "ESPADA" to "VACIO",
        "PICO" to "VACIO"
    ))

    val achievements = MutableLiveData<MutableMap<String, Boolean>>(mutableMapOf())

    // Actualizar inventario
    fun updateInventory(itemId: String, status: Boolean) {
        val currentMap = inventory.value ?: mutableMapOf()
        currentMap[itemId] = status
        inventory.value = currentMap
    }

    // Actualizar equipo
    fun equipItem(category: String, material: String) {
        val currentEquipment = equipment.value ?: mutableMapOf()
        currentEquipment[category] = material
        equipment.value = currentEquipment

        // Lógica de Logros
        if (material != "VACIO") {
            unlockAchievement("ACH_SUIT_UP")
        }

        val casco = currentEquipment["CASCO"] ?: "VACIO"
        val peto = currentEquipment["PETO"] ?: "VACIO"
        val pantalones = currentEquipment["PANTALONES"] ?: "VACIO"
        val botas = currentEquipment["BOTAS"] ?: "VACIO"

        if (casco != "VACIO" && peto != "VACIO" && pantalones != "VACIO" && botas != "VACIO") {
            unlockAchievement("ACH_FULL_ARMOR")
        }
    }

    // Desbloquear Logros
    fun unlockAchievement(achievementId: String) {
        val currentMap = achievements.value ?: mutableMapOf()

        if (currentMap[achievementId] != true) {
            currentMap[achievementId] = true
            achievements.value = currentMap

            // Buscar datos visuales para el popup
            val achievementData = AchievementList.get(achievementId)
            if (achievementData != null) {
                achievementPopupEvent.value = achievementData
            }
        }
    }

    fun onPopupShown() {
        achievementPopupEvent.value = null
    }
}