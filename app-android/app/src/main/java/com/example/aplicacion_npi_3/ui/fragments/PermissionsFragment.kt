package com.example.aplicacion_npi_3.ui.fragments

import android.Manifest
import android.content.pm.PackageManager
import androidx.fragment.app.activityViewModels
import com.example.aplicacion_npi_3.ui.viewmodels.MuseumViewModel
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.example.aplicacion_npi_3.R

class PermissionsFragment : Fragment() {

    private lateinit var btnNext: ImageButton
    private val viewModel: MuseumViewModel by activityViewModels()

    private lateinit var btnGrant: Button

    private lateinit var tvTitle: TextView
    private lateinit var tvDesc: TextView
    private lateinit var tvPermCamera: TextView

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false

        if (cameraGranted) {
            checkPermissionsAndToggleButtons()
        } else {
            val msg = if (viewModel.language.value == "en") "We need the camera for the scanner" else "Necesitamos la cámara para el escáner"
            Toast.makeText(requireContext(), msg, Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_permissions, container, false)

        btnGrant = view.findViewById(R.id.btn_grant_permissions)
        btnNext = view.findViewById(R.id.btn_next_permissions)

        // VINCULAMOS TODOS LOS TEXTOS
        tvTitle = view.findViewById(R.id.tv_title_permissions)
        tvDesc = view.findViewById(R.id.tv_desc_permissions)
        tvPermCamera = view.findViewById(R.id.tv_perm_camera) // Nuevo

        // --- LÓGICA DE TRADUCCIÓN COMPLETA ---
        viewModel.language.observe(viewLifecycleOwner) { lang ->
            if (lang == "en") {
                // TRADUCCIÓN INGLÉS
                tvTitle.text = "REQUIRED PERMISSIONS"
                tvDesc.text = "To complete your museum adventure, we need to activate your inventory tools:"
                tvPermCamera.text = "📷 Camera: To scan QR codes."
                btnGrant.text = "GRANT PERMISSIONS"
            } else {
                // TRADUCCIÓN ESPAÑOL
                tvTitle.text = "PERMISOS NECESARIOS"
                tvDesc.text = "Para que tu aventura en el museo sea completa, necesitamos activar tus herramientas de inventario:"
                tvPermCamera.text = "📷 Cámara: Para escanear códigos QR."
                btnGrant.text = "CONCEDER PERMISOS"
            }
        }

        btnGrant.setOnClickListener {
            requestPermissionLauncher.launch(arrayOf(Manifest.permission.CAMERA))
        }

        btnNext.setOnClickListener {
            findNavController().navigate(R.id.action_permissionsFragment_to_profileFragment)
        }

        checkPermissionsAndToggleButtons()

        val currentAchievements = viewModel.achievements.value
        if (currentAchievements?.get("ACH_LOGIN") != true) {
            viewModel.unlockAchievement("ACH_LOGIN")
        }
        return view
    }

    private fun checkPermissionsAndToggleButtons() {
        val cameraStatus = ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.CAMERA)

        if (cameraStatus == PackageManager.PERMISSION_GRANTED) {
            btnGrant.visibility = View.GONE
            btnNext.visibility = View.VISIBLE
        } else {
            btnGrant.visibility = View.VISIBLE
            btnNext.visibility = View.GONE
        }
    }
}