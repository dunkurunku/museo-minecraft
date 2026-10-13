package com.example.aplicacion_npi_3.ui.fragments

import com.example.aplicacion_npi_3.ui.viewmodels.Achievement
import com.example.aplicacion_npi_3.R

// Objeto Singleton para acceder a los datos desde cualquier lado
object AchievementList {
    val list = listOf(
        //INICIO
        Achievement("ACH_LOGIN", "Bienvenido al Server", "Inicia sesión en la aplicación por primera vez.", false, R.drawable.ach_login),

        //PERSONALIZACIÓN
        Achievement("ACH_CUSTOM_SKIN", "Nueva Skin", "Modifica tu avatar y guarda los cambios.", false, R.drawable.ach_custom_skin),

        //SALAS
        Achievement("ACH_NETHER", "Turista Infernal", "Escanea el código para entrar en el Nether.", false, R.drawable.ach_nether),
        Achievement("ACH_THE_END", "El Fin del Viaje", "Adéntrate en la oscuridad de la sala del End.", false, R.drawable.ach_end),

        // OBJETOS
        Achievement("ACH_LORE_MASTER", "Maestro del Lore", "Escanea un objeto para leer sus detalles.", false, R.drawable.ach_lore),

        //INVENTARIO
        Achievement("ACH_PICKAXE", "Listo para Minar", "Consigue un Pico escaneándolo.", false, R.drawable.ach_pickaxe),
        Achievement("ACH_SUIT_UP", "Preparado para la Batalla", "Equípate tu primera pieza de armadura.", false, R.drawable.ach_suit), // Parece un candado/escudo
        Achievement("ACH_FULL_ARMOR", "Tanque Total", "Ten equipados Casco, Peto, Pantalones y Botas a la vez.", false, R.drawable.ach_full),

        //MINERIA
        Achievement("ACH_MINER", "Manos a la Obra", "Pica un material en el minijuego de minería.", false, R.drawable.ach_mena)
    )
    // Función auxiliar para buscar un logro por su ID
    fun get(id: String): Achievement? {
        return list.find { it.id == id }
    }
}