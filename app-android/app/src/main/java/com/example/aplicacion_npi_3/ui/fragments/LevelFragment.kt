package com.example.aplicacion_npi_3.ui.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.TextView
import androidx.cardview.widget.CardView // Ojo al import
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.navigation.fragment.findNavController
import com.example.aplicacion_npi_3.R
import com.example.aplicacion_npi_3.ui.viewmodels.MuseumViewModel

class LevelFragment : Fragment() {

    private val viewModel: MuseumViewModel by activityViewModels()

    private lateinit var cardKids: CardView
    private lateinit var cardCasual: CardView
    private lateinit var cardTech: CardView

    private lateinit var tvTitle: TextView
    private lateinit var tvLabelKids: TextView
    private lateinit var tvLabelCasual: TextView
    private lateinit var tvLabelTech: TextView

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_level, container, false)

        // Inicializar Vistas (Cards y Textos)
        cardKids = view.findViewById(R.id.card_level_kids)
        cardCasual = view.findViewById(R.id.card_level_casual)
        cardTech = view.findViewById(R.id.card_level_tech)

        tvTitle = view.findViewById(R.id.tv_title_level)
        tvLabelKids = view.findViewById(R.id.tv_label_kids)
        tvLabelCasual = view.findViewById(R.id.tv_label_casual)
        tvLabelTech = view.findViewById(R.id.tv_label_tech)

        val btnBack = view.findViewById<ImageButton>(R.id.btn_back_level)
        val btnNext = view.findViewById<ImageButton>(R.id.btn_next_level)

        // Traducción
        viewModel.language.observe(viewLifecycleOwner) { lang ->
            if (lang == "en") {
                tvTitle.text = "VISIT TYPE"
                tvLabelKids.text = "EXPLORER\n(Kids)"
                tvLabelCasual.text = "MINER\n(Casual)"
                tvLabelTech.text = "SCIENTIST\n(Technical)"
            } else {
                tvTitle.text = "TIPO DE VISITA"
                tvLabelKids.text = "EXPLORADOR\n(Niños)"
                tvLabelCasual.text = "MINERO\n(Casual)"
                tvLabelTech.text = "CIENTÍFICO\n(Técnico)"
            }
        }

        // Recuperar estado actual
        val currentLevel = viewModel.knowledgeLevel.value ?: 1
        updateUI(currentLevel)

        // Listeners en las Tarjetas
        cardKids.setOnClickListener { updateUI(0) }
        cardCasual.setOnClickListener { updateUI(1) }
        cardTech.setOnClickListener {
            updateUI(2)

        }

        btnBack.setOnClickListener {
            findNavController().popBackStack()
        }

        btnNext.setOnClickListener {
            findNavController().navigate(R.id.action_levelFragment_to_avatarFragment)
        }

        return view
    }

    private fun updateUI(level: Int) {
        viewModel.knowledgeLevel.value = level


        cardKids.alpha = if (level == 0) 1.0f else 0.4f
        cardCasual.alpha = if (level == 1) 1.0f else 0.4f
        cardTech.alpha = if (level == 2) 1.0f else 0.4f

    }
}