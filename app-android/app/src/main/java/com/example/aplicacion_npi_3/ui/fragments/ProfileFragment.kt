package com.example.aplicacion_npi_3.ui.fragments

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.media.MediaPlayer // <--- IMPORT NUEVO
import android.os.Bundle
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import io.github.sceneview.SceneView
import io.github.sceneview.math.Position
import io.github.sceneview.math.Rotation
import io.github.sceneview.math.Scale
import io.github.sceneview.node.ModelNode
import io.github.sceneview.node.Node
import io.github.sceneview.model.ModelInstance
import com.example.aplicacion_npi_3.R
import com.example.aplicacion_npi_3.ui.viewmodels.MuseumViewModel
import kotlin.math.max
import kotlin.math.min

class ProfileFragment : Fragment() {

    private val viewModel: MuseumViewModel by activityViewModels()
    private lateinit var sceneView: SceneView

    // ELEMENTOS UI 2D
    private lateinit var ivFrameSword: ImageView
    private lateinit var ivFramePickaxe: ImageView
    private lateinit var tvGamertag: TextView
    private lateinit var ivFace: ImageView

    // SONIDO
    private var mediaPlayer: MediaPlayer? = null

    // JERARQUÍA 3D
    private var nodeYaw: Node? = null
    private var nodePitch: Node? = null
    private var correctionNode: Node? = null
    private var steveNode: ModelNode? = null

    private val equipmentNodes = mutableMapOf<String, Node>()

    // Variables Táctiles
    private var lastTouchX: Float = 0f
    private var lastTouchY: Float = 0f
    private var currentYaw: Float = 0f
    private var currentPitch: Float = 0f
    private val MAX_TILT = 20f

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_profile, container, false)

        // Inicializar vistas
        sceneView = view.findViewById(R.id.sceneView)
        ivFrameSword = view.findViewById(R.id.ivFrameSword)
        ivFramePickaxe = view.findViewById(R.id.ivFramePickaxe)
        tvGamertag = view.findViewById(R.id.tvGamertag)
        ivFace = view.findViewById(R.id.ivFace)

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                setupBaseHierarchy()
                loadSteveBase()

                // Observar Equipamiento
                viewModel.equipment.observe(viewLifecycleOwner) { equipmentMap ->
                    updateFullEquipment(equipmentMap)
                    update2DEquipment(equipmentMap)
                }

                // Observar Nombre
                viewModel.playerName.observe(viewLifecycleOwner) { name ->
                    val displayName = if (name.isNullOrEmpty()) "Steve" else name
                    tvGamertag.text = displayName
                }

                // Observar Cara (Pixel Art)
                viewModel.avatarFaceColors.observe(viewLifecycleOwner) { colors ->
                    updateAvatarFace(colors)
                }

            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        setupTouchControl()
        return view
    }



    override fun onResume() {
        super.onResume()
        // Se ejecuta al entrar en la pantalla
        try {
            if (mediaPlayer == null) {
                mediaPlayer = MediaPlayer.create(context, R.raw.fireplace)
                mediaPlayer?.isLooping = true // Bucle infinito
                mediaPlayer?.setVolume(0.4f, 0.4f) // Volumen ambiente (40%)
            }
            mediaPlayer?.start()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onPause() {
        super.onPause()
        // Se ejecuta al cambiar de pantalla o salir
        if (mediaPlayer?.isPlaying == true) {
            mediaPlayer?.pause()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        // Liberar memoria
        mediaPlayer?.release()
        mediaPlayer = null
    }


    //Generar pixel art
    private fun updateAvatarFace(colors: List<Int>) {
        if (colors.size < 64) return

        val gridSize = 8
        val pixelScale = 20

        val bitmap = Bitmap.createBitmap(
            gridSize * pixelScale,
            gridSize * pixelScale,
            Bitmap.Config.ARGB_8888
        )
        val canvas = Canvas(bitmap)
        val paint = Paint()

        for (i in 0 until 64) {
            val col = i % gridSize
            val row = i / gridSize

            paint.color = colors[i]

            val left = (col * pixelScale).toFloat()
            val top = (row * pixelScale).toFloat()
            val right = left + pixelScale
            val bottom = top + pixelScale

            canvas.drawRect(left, top, right, bottom, paint)
        }

        ivFace.setImageBitmap(bitmap)
    }


    //Configuracion base 3d
    private fun setupBaseHierarchy() {
        val yawNode = Node(engine = sceneView.engine)
        yawNode.position = Position(0.0f, 0.0f, -4.0f)
        sceneView.addChildNode(yawNode)
        nodeYaw = yawNode

        val pitchNode = Node(engine = sceneView.engine)
        yawNode.addChildNode(pitchNode)
        nodePitch = pitchNode

        val correction = Node(engine = sceneView.engine)
        correction.rotation = Rotation(0f, 270f, 0f)
        pitchNode.addChildNode(correction)
        correctionNode = correction
    }

    private suspend fun loadSteveBase() {
        val instance = sceneView.modelLoader.loadModelInstance("steve2.glb")
        if (instance != null) {
            val steve = ModelNode(
                modelInstance = instance,
                scaleToUnits = 2.5f
            ).apply {
                position = Position(0.0f, -1.35f, 0.0f)
            }
            correctionNode?.addChildNode(steve)
            steveNode = steve
        }
    }

    data class ItemConfig(val targetSize: Float, val offset: Position, val rotation: Rotation)

    private fun getConfigForType(type: String): ItemConfig {
        val armorRotation = Rotation(0f, -90f, 0f)
        return when (type) {
            "CASCO" -> ItemConfig(0.8f, Position(0.0f, 0.5f, 0.0f), armorRotation)
            "PETO" -> ItemConfig(1.2f, Position(0.0f, 0.25f, 0.0f), armorRotation)
            "PANTALONES" -> ItemConfig(0.70f, Position(0.0f, -0.45f, 0.0f), armorRotation)
            "BOTAS" -> ItemConfig(1f, Position(0f, -0.55f, 0.1f), Rotation(0f, -90f, 0f))
            else -> ItemConfig(1.0f, Position(0f, 0f, 0f), Rotation(0f, 0f, 0f))
        }
    }

    private fun getAutoScaleFactor(instance: ModelInstance, targetSize: Float): Float {
        val asset = instance.asset ?: return 1.0f
        val box = asset.boundingBox
        val sizeX = box.halfExtent[0] * 2.0f
        val sizeY = box.halfExtent[1] * 2.0f
        val sizeZ = box.halfExtent[2] * 2.0f
        val maxDim = max(sizeX, max(sizeY, sizeZ))
        return if (maxDim <= 0.001f) 1.0f else targetSize / maxDim
    }


    //Gestion armadura
    private fun updateFullEquipment(equipment: Map<String, String>) {
        viewLifecycleOwner.lifecycleScope.launch {
            equipment.forEach { (type, material) ->
                updateArmorPiece(type, material)
            }
        }
    }

    private suspend fun updateArmorPiece(type: String, material: String) {
        equipmentNodes[type]?.destroy()
        equipmentNodes.remove(type)

        // Evitamos cargar Espada y Pico en 3D
        if (type == "ESPADA" || type == "PICO") return

        if (material == "VACIO") return

        val matEnglish = when(material) {
            "HIERRO" -> "iron"
            "ORO" -> "gold"
            "DIAMANTE" -> "diamond"
            else -> return
        }
        val partEnglish = when(type) {
            "CASCO" -> "helmet"
            "PETO" -> "chestplate"
            "PANTALONES" -> "legs"
            "BOTAS" -> "boots"
            else -> return
        }

        val fileName = "${matEnglish}_${partEnglish}.glb"
        val config = getConfigForType(type)

        try {
            if (type == "BOTAS") {
                val containerNode = Node(engine = sceneView.engine)
                containerNode.position = config.offset
                containerNode.rotation = config.rotation

                val leftInstance = sceneView.modelLoader.loadModelInstance(fileName)
                if (leftInstance != null) {
                    val leftBoot = ModelNode(modelInstance = leftInstance, scaleToUnits = null).apply {
                        val scaleVal = getAutoScaleFactor(leftInstance, config.targetSize)
                        scale = Scale(scaleVal, scaleVal, scaleVal)
                        position = Position(-0.2f, 0f, 0f)
                    }
                    containerNode.addChildNode(leftBoot)
                }
                val rightInstance = sceneView.modelLoader.loadModelInstance(fileName)
                if (rightInstance != null) {
                    val rightBoot = ModelNode(modelInstance = rightInstance, scaleToUnits = null).apply {
                        val scaleVal = getAutoScaleFactor(rightInstance, config.targetSize)
                        scale = Scale(scaleVal, scaleVal, scaleVal)
                        position = Position(0f, 0f, 0f)
                    }
                    containerNode.addChildNode(rightBoot)
                }
                correctionNode?.addChildNode(containerNode)
                equipmentNodes[type] = containerNode
                return
            }

            val instance = sceneView.modelLoader.loadModelInstance(fileName) ?: return
            val scaleFactor = getAutoScaleFactor(instance, config.targetSize)

            val itemNode = ModelNode(modelInstance = instance, scaleToUnits = null).apply {
                scale = Scale(scaleFactor, scaleFactor, scaleFactor)
                position = config.offset
                rotation = config.rotation
            }

            correctionNode?.addChildNode(itemNode)
            equipmentNodes[type] = itemNode

        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

//MArcos de herramientas

    private fun update2DEquipment(equipment: Map<String, String>) {
        val swordMaterial = equipment["ESPADA"] ?: "VACIO"
        val swordResId = getDrawableId("sword", swordMaterial)

        if (swordResId != null) {
            ivFrameSword.setImageResource(swordResId)
        } else {
            ivFrameSword.setImageDrawable(null)
        }

        val pickaxeMaterial = equipment["PICO"] ?: "VACIO"
        val pickaxeResId = getDrawableId("pickaxe", pickaxeMaterial)

        if (pickaxeResId != null) {
            ivFramePickaxe.setImageResource(pickaxeResId)
        } else {
            ivFramePickaxe.setImageDrawable(null)
        }
    }

    private fun getDrawableId(typeEnglish: String, material: String): Int? {
        if (material == "VACIO") return null
        val matEnglish = when (material) {
            "HIERRO" -> "iron"
            "ORO" -> "gold"
            "DIAMANTE" -> "diamond"
            else -> return null
        }
        val drawableName = "${matEnglish}_${typeEnglish}"
        val context = context ?: return null
        val resId = context.resources.getIdentifier(drawableName, "drawable", context.packageName)
        return if (resId != 0) resId else null
    }

    //Control Tactil
    private fun setupTouchControl() {
        sceneView.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    lastTouchX = event.x
                    lastTouchY = event.y
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val deltaX = event.x - lastTouchX
                    val deltaY = event.y - lastTouchY
                    lastTouchX = event.x
                    lastTouchY = event.y

                    currentYaw -= deltaX * 0.4f
                    nodeYaw?.rotation = Rotation(0f, currentYaw, 0f)

                    currentPitch -= deltaY * 0.4f
                    currentPitch = max(-MAX_TILT, min(MAX_TILT, currentPitch))
                    nodePitch?.rotation = Rotation(currentPitch, 0f, 0f)
                    true
                }
                else -> true
            }
        }
    }
}