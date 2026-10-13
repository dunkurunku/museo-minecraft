package com.example.aplicacion_npi_3.ui.fragments

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.example.aplicacion_npi_3.R

class SplashFragment : Fragment() {

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflamos el diseño de la pantalla
        val view = inflater.inflate(R.layout.fragment_splash, container, false)

        // Programamos el salto a la siguiente pantalla tras 3 segundos
        Handler(Looper.getMainLooper()).postDelayed({

            // Animación de salida (Fade Out) antes de cambiar
            view.animate().alpha(0f).setDuration(800).withEndAction {
                try {
                    findNavController().navigate(R.id.action_splashFragment_to_languageFragment)
                } catch (e: Exception) {
                }
            }

        }, 2500) // Espera 2.5 segundos de logo estático

        return view
    }
}