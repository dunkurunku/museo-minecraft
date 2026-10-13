package com.example.aplicacion_npi_3.ui.fragments

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.navigation.fragment.findNavController
import com.example.aplicacion_npi_3.R
import com.example.aplicacion_npi_3.ui.viewmodels.MuseumViewModel
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class ScannerFragment : Fragment() {

    private val viewModel: MuseumViewModel by activityViewModels()

    private lateinit var cameraExecutor: ExecutorService
    private var cameraControl: CameraControl? = null
    private var isTorchOn = false
    private var isProcessing = false

    // Variable para el texto de instrucciones
    private lateinit var tvInstructions: TextView

    override fun onResume() {
        super.onResume()
        isProcessing = false
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_scanner, container, false)

        // Vincular el texto
        tvInstructions = view.findViewById(R.id.tvInstructions)

        cameraExecutor = Executors.newSingleThreadExecutor()
        startCamera(view.findViewById(R.id.viewFinder))

        view.findViewById<ImageButton>(R.id.btn_torch).setOnClickListener {
            toggleTorch()
        }

        //Introduccion dinamica de la pantalla
        viewModel.language.observe(viewLifecycleOwner) { lang ->
            if (lang == "en") {
                tvInstructions.text = "Scan a QR code"
            } else {
                tvInstructions.text = "Encuadra un código QR"
            }
        }

        return view
    }

    private fun startCamera(previewView: androidx.camera.view.PreviewView) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(requireContext())

        cameraProviderFuture.addListener({
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()

            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }

            val imageAnalyzer = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    it.setAnalyzer(cameraExecutor) { imageProxy ->
                        processImageProxy(imageProxy)//Este error parece ser mentira, que nadie se asuste
                    }
                }

            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            try {
                cameraProvider.unbindAll()
                val camera = cameraProvider.bindToLifecycle(
                    this, cameraSelector, preview, imageAnalyzer
                )
                cameraControl = camera.cameraControl
            } catch (exc: Exception) {
                Log.e("Scanner", "Error al iniciar cámara", exc)
            }

        }, ContextCompat.getMainExecutor(requireContext()))
    }

    @ExperimentalGetImage
    private fun processImageProxy(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image
        if (mediaImage != null && !isProcessing) {
            val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
            val scanner = BarcodeScanning.getClient()

            scanner.process(image)
                .addOnSuccessListener { barcodes ->
                    for (barcode in barcodes) {
                        barcode.rawValue?.let { qrContent ->
                            isProcessing = true
                            handleQrResult(qrContent)
                        }
                    }
                }
                .addOnCompleteListener {
                    imageProxy.close()
                }
        } else {
            imageProxy.close()
        }
    }

    private fun handleQrResult(content: String) {
        val bundle = Bundle()
        val currentAchievements = viewModel.achievements.value

        // Detectar idioma actual para los mensajes del Toast
        val isEn = viewModel.language.value == "en"

        when {
            // CASO 1: RECOMPENSA MÚLTIPLE
            content.startsWith("RECOMPENSA:") -> {
                val rawList = content.substringAfter("RECOMPENSA:")
                val items = rawList.split(",")

                var itemsCount = 0
                for (item in items) {
                    val trimmedItem = item.trim()
                    if (trimmedItem.isNotEmpty()) {
                        processSingleItem(trimmedItem)
                        itemsCount++
                    }
                }

                requireActivity().runOnUiThread {
                    // Traducción del mensaje
                    val msg = if (isEn) "Received $itemsCount items!" else "¡Has recibido $itemsCount objetos!"
                    showMinecraftToast(requireContext(), msg, "recompensa_multiple")
                }
                Handler(Looper.getMainLooper()).postDelayed({ isProcessing = false }, 2000)
            }

            // CASO 2: ITEM INDIVIDUAL
            content.startsWith("ITEM:") -> {
                val itemId = content.substringAfter("ITEM:")
                processSingleItem(itemId)

                requireActivity().runOnUiThread {
                    // Traducción del mensaje
                    val msg = if (isEn) "Item added!" else "¡Objeto añadido!"
                    showMinecraftToast(requireContext(), msg, itemId)
                }
                Handler(Looper.getMainLooper()).postDelayed({ isProcessing = false }, 2000)
            }

            // CASO 3: MINERÍA
            content.startsWith("MINERIA:") -> {
                val material = content.substringAfter("MINERIA:")
                bundle.putString("material_type", material)
                findNavController().navigate(R.id.action_scannerFragment_to_miningFragment, bundle)
            }

            // CASO 4: SALAS
            content.startsWith("SALA:") -> {
                val salaId = content.substringAfter("SALA:")
                bundle.putString("sala_id", salaId)

                // LOGRO: NETHER
                if (salaId.equals("NETHER", ignoreCase = true)) {
                    if (currentAchievements?.get("ACH_NETHER") != true) {
                        viewModel.unlockAchievement("ACH_NETHER")
                    }
                }
                // LOGRO: THE END
                if (salaId.equals("END", ignoreCase = true)) {
                    if (currentAchievements?.get("ACH_THE_END") != true) {
                        viewModel.unlockAchievement("ACH_THE_END")
                    }
                }

                findNavController().navigate(R.id.action_scannerFragment_to_roomInfoFragment, bundle)
            }

            // CASO 5: OBJETOS
            content.startsWith("OBJETO:") -> {
                val objetoId = content.substringAfter("OBJETO:")
                bundle.putString("objeto_id", objetoId)

                // LOGRO: MAESTRO DEL LORE
                if (currentAchievements?.get("ACH_LORE_MASTER") != true) {
                    viewModel.unlockAchievement("ACH_LORE_MASTER")
                }

                findNavController().navigate(R.id.action_scannerFragment_to_objectDetailFragment, bundle)
            }

            else -> {
                isProcessing = false
                requireActivity().runOnUiThread {
                    val errorMsg = if (isEn) "Unknown Code" else "Código desconocido"
                    Toast.makeText(context, errorMsg, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    // PROCESAMIENTO DE ITEMS
    private fun processSingleItem(fullId: String) {
        val categories = listOf("CASCO", "PETO", "PANTALONES", "BOTAS", "ESPADA", "PICO")
        var isEquipment = false
        val currentAchievements = viewModel.achievements.value

        for (cat in categories) {
            if (fullId.startsWith(cat)) {
                val material = fullId.substringAfter("${cat}_")

                viewModel.equipItem(cat, material)

                if (cat == "PICO") {
                    if (currentAchievements?.get("ACH_PICKAXE") != true) {
                        viewModel.unlockAchievement("ACH_PICKAXE")
                    }
                }

                isEquipment = true
                break
            }
        }

        if (!isEquipment) {
            viewModel.updateInventory(fullId, true)
        }
    }

    private fun toggleTorch() {
        isTorchOn = !isTorchOn
        cameraControl?.enableTorch(isTorchOn)
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }

    // FUNCIÓN VISUAL CON TRADUCCIÓN EN EL HEADER
    fun showMinecraftToast(context: android.content.Context, message: String, itemName: String) {
        val inflater = android.view.LayoutInflater.from(context)
        val layout = inflater.inflate(R.layout.layout_custom_toast, null)

        val tvHeader: android.widget.TextView = layout.findViewById(R.id.toast_header)
        val tvText: android.widget.TextView = layout.findViewById(R.id.toast_text)
        val imgIcon: android.widget.ImageView = layout.findViewById(R.id.toast_icon)

        //  Traducir la cabecera amarilla (Header)
        val isEn = viewModel.language.value == "en"
        tvHeader.text = if (isEn) "ITEM ACQUIRED" else "OBJETO OBTENIDO"

        //  Poner el mensaje (que ya viene traducido desde handleQrResult)
        tvText.text = message

        //  Buscar el icono
        val nameClean = itemName.lowercase().trim()
        var resId = 0

        // Buscar como Equipo
        if (nameClean.contains("_")) {
            val parts = nameClean.split("_")
            if (parts.size >= 2) {
                resId = context.resources.getIdentifier("ic_equip_${parts[0]}_${parts[1]}", "drawable", context.packageName)
            }
        }
        // Buscar como Item normal
        if (resId == 0) {
            resId = context.resources.getIdentifier("ic_item_$nameClean", "drawable", context.packageName)
        }
        // Icono especial
        if (nameClean == "recompensa_multiple") {
            resId = R.drawable.ic_item_bundle
        }

        if (resId != 0) imgIcon.setImageResource(resId)
        else imgIcon.setImageResource(android.R.drawable.ic_menu_help)

        val toast = android.widget.Toast(context)
        toast.duration = android.widget.Toast.LENGTH_LONG
        toast.view = layout
        toast.show()
    }
}