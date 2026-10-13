package com.example.aplicacion_npi_3.ui.fragments

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.media.MediaPlayer
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.navigation.fragment.findNavController
import com.example.aplicacion_npi_3.R
import com.example.aplicacion_npi_3.ui.viewmodels.MuseumViewModel
import kotlin.math.sqrt

class MiningFragment : Fragment(), SensorEventListener {

    private val viewModel: MuseumViewModel by activityViewModels()

    private lateinit var sensorManager: SensorManager
    private var accelerometer: Sensor? = null
    private lateinit var vibrator: Vibrator

    // Vistas
    private lateinit var ivBlock: ImageView
    private lateinit var ivPickaxe: ImageView
    private lateinit var progressBar: ProgressBar
    private lateinit var tvTitle: TextView
    private lateinit var tvInstruction: TextView

    private var miningProgress = 0
    private var lastUpdate: Long = 0
    private var materialType: String = "PIEDRA" // ID interno (siempre en español/código)

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        val view = inflater.inflate(R.layout.fragment_mining, container, false)

        // Vincular vistas
        ivBlock = view.findViewById(R.id.iv_block)
        ivPickaxe = view.findViewById(R.id.iv_pickaxe)
        progressBar = view.findViewById(R.id.mining_progress)
        tvTitle = view.findViewById(R.id.tv_mining_title)
        tvInstruction = view.findViewById(R.id.tv_instruction)

        // Recuperar argumentos
        materialType = arguments?.getString("material_type") ?: "PIEDRA"

        // Cargar imagen del bloque dinámicamente
        val resourceId = resources.getIdentifier("block_${materialType.lowercase()}", "drawable", requireContext().packageName)
        if (resourceId != 0) ivBlock.setImageResource(resourceId)

        // Inicializar Sensores
        sensorManager = requireContext().getSystemService(Context.SENSOR_SERVICE) as SensorManager
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        vibrator = requireContext().getSystemService(Context.VIBRATOR_SERVICE) as Vibrator

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewModel.language.observe(viewLifecycleOwner) { lang ->
            updateUITexts(lang)
        }
    }

    private fun updateUITexts(lang: String) {
        val isEn = (lang == "en")

        //Traducir el nombre del material para mostrarlo
        val displayName = if (isEn) translateMaterialToEnglish(materialType) else materialType

        //Actualizar textos de la pantalla
        if (isEn) {
            tvTitle.text = "MINING: $displayName"
            tvInstruction.text = "SHAKE TO MINE!"
        } else {
            tvTitle.text = "MINANDO: $displayName"
            tvInstruction.text = "¡AGITA PARA PICAR!"
        }
    }

    // Pequeño diccionario para los materiales
    private fun translateMaterialToEnglish(material: String): String {
        return when (material.uppercase()) {
            "PIEDRA" -> "STONE"
            "HIERRO" -> "IRON"
            "ORO" -> "GOLD"
            "DIAMANTE" -> "DIAMOND"
            "CARBON" -> "COAL"
            "ESMERALDA" -> "EMERALD"
            "LAPISLAZULI" -> "LAPIS LAZULI"
            "REDSTONE" -> "REDSTONE"
            "CUARZO" -> "QUARTZ"
            else -> material // Si no está en la lista, devuelve el original
        }
    }

    override fun onSensorChanged(event: SensorEvent) {
        val gForce = sqrt(event.values[0] * event.values[0] + event.values[1] * event.values[1] + event.values[2] * event.values[2]) / SensorManager.GRAVITY_EARTH

        if (gForce > 2.2f) { // Umbral de agitación
            val currentTime = System.currentTimeMillis()
            if (currentTime - lastUpdate > 350) {
                lastUpdate = currentTime
                strike()
            }
        }
    }

    private fun strike() {
        if (miningProgress < 100) {
            miningProgress += 20
            progressBar.progress = miningProgress

            // Animación del pico
            val rotationAngle = (miningProgress.toFloat() / 100) * -90f
            ivPickaxe.animate().rotation(rotationAngle).setDuration(150).start()

            // Sonido y Vibración
            playMiningSound()
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createOneShot(100, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION") vibrator.vibrate(100)
            }

            if (miningProgress >= 100) {
                completeMining()
            }
        }
    }

    private fun playMiningSound() {
        val soundResId = resources.getIdentifier("mine_${materialType.lowercase()}", "raw", requireContext().packageName)
        val finalSoundId = if (soundResId != 0) soundResId else resources.getIdentifier("mine_default", "raw", requireContext().packageName)

        if (finalSoundId != 0) {
            val mediaPlayer = MediaPlayer.create(requireContext(), finalSoundId)
            mediaPlayer.setOnCompletionListener { it.release() }
            mediaPlayer.start()
        }
    }

    private fun completeMining() {
        // Añadir al inventario
        viewModel.updateInventory(materialType, true)

        val currentAchievements = viewModel.achievements.value
        if (currentAchievements?.get("ACH_MINER") != true) {
            viewModel.unlockAchievement("ACH_MINER")
        }

        //  Preparar mensaje final según idioma
        val lang = viewModel.language.value ?: "es"
        val isEn = (lang == "en")

        val displayName = if (isEn) translateMaterialToEnglish(materialType) else materialType
        val finalMessage = if (isEn) "$displayName MINED!" else "¡$displayName MINADO!"

        showMinecraftToast(requireContext(), finalMessage, materialType)
        ivPickaxe.postDelayed({
            findNavController().popBackStack()
        }, 600)
    }

    // Función global para mostrar el toast con icono
    fun showMinecraftToast(context: android.content.Context, message: String, itemName: String) {
        val inflater = android.view.LayoutInflater.from(context)
        val layout = inflater.inflate(R.layout.layout_custom_toast, null)

        val tvHeader: android.widget.TextView = layout.findViewById(R.id.toast_header)
        val tvText: android.widget.TextView = layout.findViewById(R.id.toast_text)
        val imageView: android.widget.ImageView = layout.findViewById(R.id.toast_icon)

        val isEn = viewModel.language.value == "en"
        tvHeader.text = if (isEn) "ITEM ACQUIRED" else "OBJETO OBTENIDO"
        tvText.text = message

        val nameClean = itemName.lowercase().trim()
        var resId = 0

        //  Buscar como ITEM específico (ej: ic_item_piedra)
        resId = context.resources.getIdentifier("ic_item_$nameClean", "drawable", context.packageName)

        //  Si no existe icono de item, buscar como BLOQUE (ej: block_piedra, block_obsidiana)
        if (resId == 0) {
            resId = context.resources.getIdentifier("block_$nameClean", "drawable", context.packageName)
        }

        // Buscar como EQUIPO (ej: ic_equip_pico_diamante)
        if (resId == 0 && nameClean.contains("_")) {
            val parts = nameClean.split("_")
            if (parts.size >= 2) {
                resId = context.resources.getIdentifier("ic_equip_${parts[0]}_${parts[1]}", "drawable", context.packageName)
            }
        }

        // Asignar imagen
        if (resId != 0) {
            imageView.setImageResource(resId)
        } else {
            imageView.setImageResource(android.R.drawable.ic_menu_help)
        }

        val toast = android.widget.Toast(context)
        toast.duration = android.widget.Toast.LENGTH_LONG
        toast.view = layout
        toast.show()
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
    override fun onResume() { super.onResume() ; accelerometer?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI) } }
    override fun onPause() { super.onPause() ; sensorManager.unregisterListener(this) }
}