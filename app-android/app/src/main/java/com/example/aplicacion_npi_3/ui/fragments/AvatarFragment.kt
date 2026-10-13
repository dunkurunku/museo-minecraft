package com.example.aplicacion_npi_3.ui.fragments

import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ImageButton
import android.widget.SeekBar
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.aplicacion_npi_3.R
import com.example.aplicacion_npi_3.ui.viewmodels.MuseumViewModel
import com.example.aplicacion_npi_3.utils.GridSpacingItemDecoration

class AvatarFragment : Fragment() {

    private val viewModel: MuseumViewModel by activityViewModels()
    private var currentColor = Color.RED
    private val pixelData = IntArray(64) { Color.WHITE }

    // variable para logro
    private var hasModifiedSkin = false

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_avatar, container, false)

        val etName = view.findViewById<EditText>(R.id.et_player_name)
        val rvGrid = view.findViewById<RecyclerView>(R.id.rv_avatar_grid)
        val colorSlider = view.findViewById<SeekBar>(R.id.color_slider)
        val viewCurrentColor = view.findViewById<View>(R.id.view_current_color)

        // Traducción dinámica
        viewModel.language.observe(viewLifecycleOwner) { lang ->
            if (lang == "en") {
                etName.hint = "PLAYER NAME"
            } else {
                etName.hint = "NOMBRE DE JUGADOR"
            }
        }

        //CONFIGURAR EL GRID
        rvGrid.layoutManager = GridLayoutManager(context, 8)
        while (rvGrid.itemDecorationCount > 0) { rvGrid.removeItemDecorationAt(0) }
        rvGrid.addItemDecoration(GridSpacingItemDecoration(8, 4))

        val adapter = AvatarGridAdapter(pixelData)
        rvGrid.adapter = adapter

        //LÓGICA DE PINTADO POR ARRASTRE
        rvGrid.setOnTouchListener { _, event ->
            if (event.action == MotionEvent.ACTION_DOWN || event.action == MotionEvent.ACTION_MOVE) {
                val child = rvGrid.findChildViewUnder(event.x, event.y)
                if (child != null) {
                    val position = rvGrid.getChildAdapterPosition(child)
                    if (position != RecyclerView.NO_POSITION) {

                        // Solo pintamos si es diferente (opcional) o siempre que toque
                        pixelData[position] = currentColor
                        adapter.notifyItemChanged(position)

                        // SI el usuario ha modificado algo, flag encendida
                        hasModifiedSkin = true
                    }
                }
                true
            } else false
        }

        // Selector de color
        val colors = IntArray(361) { i -> Color.HSVToColor(floatArrayOf(i.toFloat(), 1f, 1f)) }
        colorSlider.background = GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT, colors)

        colorSlider.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                currentColor = Color.HSVToColor(floatArrayOf(progress.toFloat(), 1f, 1f))
                viewCurrentColor.setBackgroundColor(currentColor)
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })


        view.findViewById<ImageButton>(R.id.btn_back_avatar).setOnClickListener {
            findNavController().popBackStack()
        }

        view.findViewById<ImageButton>(R.id.btn_next_avatar).setOnClickListener {
            // Guardamos datos
            viewModel.playerName.value = etName.text.toString()
            viewModel.avatarFaceColors.value = pixelData.toList()

            // Solo entramos aquí si 'hasModifiedSkin' es TRUE
            if (hasModifiedSkin) {
                val currentAchievements = viewModel.achievements.value
                // Y si no lo tenía ya desbloqueado de antes
                if (currentAchievements?.get("ACH_CUSTOM_SKIN") != true) {
                    viewModel.unlockAchievement("ACH_CUSTOM_SKIN")
                }
            }

            findNavController().navigate(R.id.action_avatarFragment_to_permissionsFragment)
        }

        return view
    }
}