package com.example.aplicacion_npi_3.ui.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.aplicacion_npi_3.R
import com.example.aplicacion_npi_3.ui.viewmodels.MuseumViewModel
import com.google.zxing.BarcodeFormat
import com.journeyapps.barcodescanner.BarcodeEncoder

class InventoryFragment : Fragment() {

    private val viewModel: MuseumViewModel by activityViewModels()

    // Referencias
    private lateinit var rvEquipment: RecyclerView
    private lateinit var tvEmptyEquip: TextView
    private lateinit var rvResources: RecyclerView
    private lateinit var tvEmptyRes: TextView
    private lateinit var btnQr: Button
    private lateinit var ivQr: ImageView

    // Títulos que necesitan traducción
    private lateinit var tvTitleInv: TextView
    private lateinit var tvTitleRes: TextView

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_inventory, container, false)

        // Inicializar vistas
        rvEquipment = view.findViewById(R.id.rv_equipment)
        tvEmptyEquip = view.findViewById(R.id.tv_empty_equipment)
        rvResources = view.findViewById(R.id.rv_resources)
        tvEmptyRes = view.findViewById(R.id.tv_empty_resources)
        btnQr = view.findViewById(R.id.btn_show_qr)
        ivQr = view.findViewById(R.id.iv_qr_display)

        tvTitleInv = view.findViewById(R.id.tv_title_inv)
        tvTitleRes = view.findViewById(R.id.tv_title_resources)

        // Configurar Grids
        rvEquipment.layoutManager = GridLayoutManager(context, 3)
        rvResources.layoutManager = GridLayoutManager(context, 3)

        setupObservers()

        // Logica qr
        btnQr.setOnClickListener {
            toggleQrDisplay()
        }

        return view
    }

    private fun setupObservers() {
        viewModel.language.observe(viewLifecycleOwner) { lang ->
            updateStaticTexts(lang)
            refreshAdapters(lang)
        }

        // Traduccion
        viewModel.equipment.observe(viewLifecycleOwner) {
            val currentLang = viewModel.language.value ?: "es"
            refreshAdapters(currentLang)
        }

        viewModel.inventory.observe(viewLifecycleOwner) {
            val currentLang = viewModel.language.value ?: "es"
            refreshAdapters(currentLang)
        }
    }

    private fun updateStaticTexts(lang: String) {
        val isEn = (lang == "en")

        if (isEn) {
            tvTitleInv.text = "MY EQUIPMENT"
            tvTitleRes.text = "COLLECTED RESOURCES"
            tvEmptyEquip.text = "No equipment equipped."
            tvEmptyRes.text = "Resource inventory empty."

            // Actualizar botón QR si está visible o no
            if (ivQr.visibility == View.VISIBLE) {
                btnQr.text = "CLOSE QR"
            } else {
                btnQr.text = "GENERATE PROGRESS QR"
            }
        } else {
            tvTitleInv.text = "MI EQUIPAMIENTO"
            tvTitleRes.text = "RECURSOS COLECTADOS"
            tvEmptyEquip.text = "No tienes equipo equipado."
            tvEmptyRes.text = "Inventario de recursos vacío."

            if (ivQr.visibility == View.VISIBLE) {
                btnQr.text = "CERRAR QR"
            } else {
                btnQr.text = "GENERAR QR DE PROGRESO"
            }
        }
    }

    private fun refreshAdapters(lang: String) {
        // REFRESCAR EQUIPO
        val equipMap = viewModel.equipment.value ?: emptyMap()
        val ownedEquip = equipMap.filter { it.value != "VACIO" }
            .map { Pair(it.key, it.value) }

        if (ownedEquip.isEmpty()) {
            rvEquipment.visibility = View.GONE
            tvEmptyEquip.visibility = View.VISIBLE
        } else {
            rvEquipment.visibility = View.VISIBLE
            tvEmptyEquip.visibility = View.GONE
            // Pasamos 'lang' al adaptador
            rvEquipment.adapter = InventoryAdapter(ownedEquip, lang)
        }

        // Resfrescar recursos
        val resMap = viewModel.inventory.value ?: emptyMap()
        val ownedRes = resMap.filter { it.value }
            .map { Pair(it.key, it.key) }

        if (ownedRes.isEmpty()) {
            rvResources.visibility = View.GONE
            tvEmptyRes.visibility = View.VISIBLE
        } else {
            rvResources.visibility = View.VISIBLE
            tvEmptyRes.visibility = View.GONE
            // Pasamos 'lang' al adaptador
            rvResources.adapter = InventoryAdapter(ownedRes, lang)
        }
    }

    private fun toggleQrDisplay() {
        val lang = viewModel.language.value ?: "es"
        val isEn = (lang == "en")

        if (ivQr.visibility == View.GONE) {
            val equipData = viewModel.equipment.value?.entries?.joinToString(",") { "${it.key}-${it.value}" }
            val resData = viewModel.inventory.value?.filter { it.value }?.keys?.joinToString(",") ?: ""

            val qrContent = "MUSEO_PROGRESO|EQUIP:$equipData|RES:$resData"

            try {
                val barcodeEncoder = BarcodeEncoder()
                val bitmap = barcodeEncoder.encodeBitmap(qrContent, BarcodeFormat.QR_CODE, 600, 600)
                ivQr.setImageBitmap(bitmap)
                ivQr.visibility = View.VISIBLE
                btnQr.text = if (isEn) "CLOSE QR" else "CERRAR QR"
            } catch (e: Exception) {
                e.printStackTrace()
            }
        } else {
            ivQr.visibility = View.GONE
            btnQr.text = if (isEn) "GENERATE PROGRESS QR" else "GENERAR QR DE PROGRESO"
        }
    }
}