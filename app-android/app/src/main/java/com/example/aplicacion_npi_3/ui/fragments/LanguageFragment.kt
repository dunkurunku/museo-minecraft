package com.example.aplicacion_npi_3.ui.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageButton
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.navigation.fragment.findNavController
import com.example.aplicacion_npi_3.R
import com.example.aplicacion_npi_3.ui.viewmodels.MuseumViewModel
import java.util.Locale

class LanguageFragment : Fragment() {

    // Usamos activityViewModels para compartir el MISMO ViewModel entre todas las pantallas
    private val viewModel: MuseumViewModel by activityViewModels()

    private lateinit var frameEs: FrameLayout
    private lateinit var frameEn: FrameLayout
    private lateinit var btnNext: ImageButton

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_language, container, false)

        // Inicializar componentes
        frameEs = view.findViewById(R.id.frame_es)
        frameEn = view.findViewById(R.id.frame_en)
        btnNext = view.findViewById(R.id.btn_next_lang)

        val btnEs = view.findViewById<ImageButton>(R.id.btn_lang_es)
        val btnEn = view.findViewById<ImageButton>(R.id.btn_lang_en)

        // Autodeteccion
        val currentLang = viewModel.language.value ?: Locale.getDefault().language
        selectLanguage(if (currentLang == "en") "en" else "es")

        // Listeners
        btnEs.setOnClickListener { selectLanguage("es") }
        btnEn.setOnClickListener { selectLanguage("en") }

        // Boton
        btnNext.setOnClickListener {
            findNavController().navigate(R.id.action_languageFragment_to_levelFragment)
        }

        return view
    }

    private fun selectLanguage(lang: String) {
        viewModel.language.value = lang

        val highlightColor = ContextCompat.getColor(requireContext(), android.R.color.holo_blue_light)
        val transparentColor = ContextCompat.getColor(requireContext(), android.R.color.transparent)

        if (lang == "es") {
            frameEs.setBackgroundColor(highlightColor)
            frameEn.setBackgroundColor(transparentColor)
        } else {
            frameEn.setBackgroundColor(highlightColor)
            frameEs.setBackgroundColor(transparentColor)
        }
    }
}