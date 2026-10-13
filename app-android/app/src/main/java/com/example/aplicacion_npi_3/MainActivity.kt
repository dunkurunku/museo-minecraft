package com.example.aplicacion_npi_3

import android.media.MediaPlayer
import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.findNavController
import androidx.navigation.ui.setupWithNavController
import com.example.aplicacion_npi_3.ui.viewmodels.Achievement
import com.example.aplicacion_npi_3.ui.viewmodels.MuseumViewModel
import com.google.android.material.bottomnavigation.BottomNavigationView

class MainActivity : AppCompatActivity() {

    private val viewModel: MuseumViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val navView: BottomNavigationView = findViewById(R.id.bottom_navigation)
        val navController = findNavController(R.id.nav_host_fragment)


        navView.itemIconTintList = null

        //Configuración base
        navView.setupWithNavController(navController)

        //Listener de destino
        navController.addOnDestinationChangedListener { _, destination, _ ->
            when (destination.id) {
                // Pantallas sin barra (Login, Splash, etc.)
                R.id.splashFragment, R.id.languageFragment, R.id.levelFragment,
                R.id.avatarFragment, R.id.permissionsFragment -> {
                    navView.visibility = View.GONE
                }
                else -> {
                    navView.visibility = View.VISIBLE

                    // Mantener icono encendido en sub-pantallas
                    when (destination.id) {
                        R.id.miningFragment, R.id.roomInfoFragment, R.id.objectDetailFragment -> {
                            // Si estamos viendo detalles, iluminamos el icono del Escáner
                            navView.menu.findItem(R.id.scannerFragment).isChecked = true
                        }
                    }
                }
            }
        }

        // Evita crashes al pulsar el mismo icono y gestiona el backstack del escáner
        navView.setOnItemSelectedListener { item ->
            if (item.itemId != navController.currentDestination?.id) {
                navController.navigate(item.itemId)
            } else if (item.itemId == R.id.scannerFragment) {
                navController.popBackStack(R.id.scannerFragment, false)
            }
            true
        }

        // Traduccion del menu
        viewModel.language.observe(this) { lang ->
            updateBottomNavLanguage(navView, lang)
        }

        // Notificacion de logros y sonido
        viewModel.achievementPopupEvent.observe(this) { achievement ->
            if (achievement != null) {
                showAchievementToast(achievement)
                viewModel.onPopupShown()
            }
        }
    }

    // Funciones auxiliares

    private fun updateBottomNavLanguage(navView: BottomNavigationView, lang: String) {
        val menu = navView.menu
        val isEn = (lang == "en")

        menu.findItem(R.id.profileFragment).title = if (isEn) "Profile" else "Perfil"
        menu.findItem(R.id.inventoryFragment).title = if (isEn) "Inventory" else "Inventario"
        menu.findItem(R.id.scannerFragment).title = if (isEn) "Scanner" else "Escáner"
        menu.findItem(R.id.achievementsFragment).title = if (isEn) "Achievements" else "Logros"
    }

    private fun showAchievementToast(achievement: Achievement) {
        val inflater = LayoutInflater.from(this)
        val layout = inflater.inflate(R.layout.layout_achievement_toast, null)

        val ivIcon = layout.findViewById<ImageView>(R.id.ivToastIcon)
        val tvHeader = layout.findViewById<TextView>(R.id.tvToastHeader)
        val tvTitle = layout.findViewById<TextView>(R.id.tvToastTitle)

        val currentLang = viewModel.language.value ?: "es"
        val isEn = (currentLang == "en")

        ivIcon.setImageResource(achievement.iconResId)
        tvHeader.text = if (isEn) "Achievement Unlocked!" else "¡Logro Desbloqueado!"
        tvTitle.text = if (isEn) getEnglishTitle(achievement.id) else achievement.title

        val toast = Toast(applicationContext)
        toast.duration = Toast.LENGTH_LONG
        toast.view = layout
        toast.setGravity(Gravity.TOP or Gravity.CENTER_HORIZONTAL, 0, 150)
        toast.show()

        // Sonido
        try {
            val mediaPlayer = MediaPlayer.create(this, R.raw.achievement)
            mediaPlayer.setOnCompletionListener { mp -> mp.release() }
            mediaPlayer.start()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun getEnglishTitle(id: String): String {
        return when (id) {
            "ACH_LOGIN" -> "Welcome Aboard"
            "ACH_CUSTOM_SKIN" -> "New Skin"
            "ACH_NETHER" -> "Infernal Tourist"
            "ACH_THE_END" -> "End of the Journey"
            "ACH_LORE_MASTER" -> "Lore Master"
            "ACH_PICKAXE" -> "Ready to Mine"
            "ACH_SUIT_UP" -> "Suit Up"
            "ACH_FULL_ARMOR" -> "Full Tank"
            "ACH_MINER" -> "Hands to Work"
            else -> "Secret Achievement"
        }
    }
}