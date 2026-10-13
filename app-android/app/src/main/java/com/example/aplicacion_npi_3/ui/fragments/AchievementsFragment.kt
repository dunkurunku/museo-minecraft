package com.example.aplicacion_npi_3.ui.fragments

import android.graphics.Color
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.RecyclerView
import com.example.aplicacion_npi_3.R
import com.example.aplicacion_npi_3.ui.fragments.AchievementList
import com.example.aplicacion_npi_3.ui.viewmodels.Achievement
import com.example.aplicacion_npi_3.ui.viewmodels.MuseumViewModel

class AchievementsFragment : Fragment() {

    private val viewModel: MuseumViewModel by activityViewModels()

    private lateinit var rvAchievements: RecyclerView
    private lateinit var tvHeader: TextView
    private lateinit var tvTitle: TextView
    private lateinit var tvDesc: TextView
    private lateinit var tvStatus: TextView
    private lateinit var ivDetailIcon: ImageView

    private lateinit var adapter: AchievementsAdapter
    private lateinit var currentDisplayList: MutableList<Achievement>

    // Guardamos el último logro seleccionado para refrescarlo al cambiar de idioma
    private var lastSelectedAchievement: Achievement? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_achievements, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        //VINCULAR VISTAS
        rvAchievements = view.findViewById(R.id.rvAchievements)
        tvHeader = view.findViewById(R.id.tvHeader)
        tvTitle = view.findViewById(R.id.tvAchievementTitle)
        tvDesc = view.findViewById(R.id.tvAchievementDesc)
        tvStatus = view.findViewById(R.id.tvAchievementStatus)
        ivDetailIcon = view.findViewById(R.id.ivSelectedIcon)

        // Quitar parpadeo de animación
        rvAchievements.itemAnimator = null

        // PREPARAR DATOS INICIALES
        currentDisplayList = AchievementList.list.map { it.copy() }.toMutableList()

        // Marcamos el primero como seleccionado por defecto
        if (currentDisplayList.isNotEmpty()) {
            lastSelectedAchievement = currentDisplayList[0]
        }

        //CONFIGURAR ADAPTADOR
        adapter = AchievementsAdapter(currentDisplayList) { achievement ->
            lastSelectedAchievement = achievement
            updateDetailPanel(achievement)
        }
        rvAchievements.adapter = adapter

        //traduccion
        viewModel.language.observe(viewLifecycleOwner) { lang ->
            translateAndReload(lang)
        }

        // DEsbloqueos
        viewModel.achievements.observe(viewLifecycleOwner) { unlockedMap ->
            var hayCambios = false
            currentDisplayList.forEach { visualItem ->
                val estaDesbloqueado = unlockedMap[visualItem.id] == true
                if (visualItem.isUnlocked != estaDesbloqueado) {
                    visualItem.isUnlocked = estaDesbloqueado
                    hayCambios = true
                }
            }
            if (hayCambios) {
                adapter.notifyDataSetChanged()
                // Si el logro que estamos mirando acaba de desbloquearse, refrescamos el panel
                lastSelectedAchievement?.let { selected ->
                    val updatedItem = currentDisplayList.find { it.id == selected.id }
                    if (updatedItem != null) updateDetailPanel(updatedItem)
                }
            }
        }
    }

    // LÓGICA DE TRADUCCIÓN
    private fun translateAndReload(lang: String) {
        val isEn = (lang == "en")

        tvHeader.text = if (isEn) "YOUR ACHIEVEMENTS" else "TUS LOGROS"
        for (i in currentDisplayList.indices) {
            val item = currentDisplayList[i]
            val translatedData = getTranslatedData(item.id, isEn)

            // Usamos .copy para crear un nuevo objeto con el texto nuevo
            currentDisplayList[i] = item.copy(
                title = translatedData.first,
                description = translatedData.second
            )
        }

        // Notificar al adaptador
        adapter.notifyDataSetChanged()

        lastSelectedAchievement?.let { selected ->
            // Buscamos la versión traducida del item seleccionado en la lista
            val updatedSelection = currentDisplayList.find { it.id == selected.id }
            if (updatedSelection != null) {
                updateDetailPanel(updatedSelection)
            }
        }
    }

    // Diccionario de traducciones
    private fun getTranslatedData(id: String, isEn: Boolean): Pair<String, String> {
        if (!isEn) {
            // Si es español, devolvemos los textos originales de la lista maestra
            val original = AchievementList.get(id)
            return Pair(original?.title ?: "", original?.description ?: "")
        }

        // Si es inglés, devolvemos la traducción
        return when (id) {
            "ACH_LOGIN" -> Pair("Welcome Aboard", "Log in to the application for the first time.")
            "ACH_CUSTOM_SKIN" -> Pair("New Skin", "Modify your avatar and save changes.")
            "ACH_NETHER" -> Pair("Infernal Tourist", "Scan the code to enter the Nether.")
            "ACH_THE_END" -> Pair("End of the Journey", "Enter the darkness of the End room.")
            "ACH_LORE_MASTER" -> Pair("Lore Master", "Scan an object to read its details.")
            "ACH_PICKAXE" -> Pair("Basic Tool", "Obtain a Pickaxe by scanning it.")
            "ACH_SUIT_UP" -> Pair("Suit Up", "Equip your first piece of armor.")
            "ACH_FULL_ARMOR" -> Pair("Full Tank", "Have Helmet, Chestplate, Leggings, and Boots equipped.")
            "ACH_MINER" -> Pair("Breaking Blocks", "Mine a material in the mining minigame.")
            else -> Pair("Unknown Achievement", "???")
        }
    }

    private fun updateDetailPanel(item: Achievement) {
        tvTitle.text = item.title
        tvDesc.text = item.description
        ivDetailIcon.setImageResource(item.iconResId)

        // Verificamos idioma actual para la etiqueta de estado
        val isEn = viewModel.language.value == "en"

        if (item.isUnlocked) {
            tvStatus.text = if (isEn) "UNLOCKED" else "DESBLOQUEADO"
            tvStatus.setTextColor(Color.parseColor("#4CAF50"))
            ivDetailIcon.colorFilter = null
            ivDetailIcon.imageTintList = null
            ivDetailIcon.alpha = 1.0f
        } else {
            tvStatus.text = if (isEn) "LOCKED" else "BLOQUEADO"
            tvStatus.setTextColor(Color.parseColor("#B00020"))
            val matrix = ColorMatrix()
            matrix.setSaturation(0f)
            ivDetailIcon.colorFilter = ColorMatrixColorFilter(matrix)
            ivDetailIcon.alpha = 0.5f
        }
    }
}