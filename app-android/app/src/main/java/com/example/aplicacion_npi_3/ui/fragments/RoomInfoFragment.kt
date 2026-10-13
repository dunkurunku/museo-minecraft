package com.example.aplicacion_npi_3.ui.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import com.example.aplicacion_npi_3.R
import com.example.aplicacion_npi_3.ui.viewmodels.MuseumViewModel

class RoomInfoFragment : Fragment() {

    private val viewModel: MuseumViewModel by activityViewModels()

    private lateinit var tvTitle: TextView
    private lateinit var tvDescription: TextView
    private lateinit var tvLevelBadge: TextView
    private lateinit var tvRecommendations: TextView
    private lateinit var ivHeader: ImageView

    private lateinit var tvLabelInfo: TextView
    private lateinit var tvLabelRec: TextView

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_room_info, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        tvTitle = view.findViewById(R.id.tvRoomTitle)
        tvDescription = view.findViewById(R.id.tvDescription)
        tvLevelBadge = view.findViewById(R.id.tvUserLevel)
        tvRecommendations = view.findViewById(R.id.tvRecommendations)
        ivHeader = view.findViewById(R.id.ivRoomHeader)
        tvLabelInfo = view.findViewById(R.id.tvLabelInfo)
        tvLabelRec = view.findViewById(R.id.tvLabelRec)

        val salaId = arguments?.getString("sala_id") ?: "DESCONOCIDO"

        // Observamos Nivel Y Idioma. Si cualquiera cambia, repintamos.
        viewModel.knowledgeLevel.observe(viewLifecycleOwner) { level ->
            updateUI(salaId, level)
        }

        viewModel.language.observe(viewLifecycleOwner) {
            // Cuando cambia el idioma, usamos el nivel actual para refrescar
            val currentLevel = viewModel.knowledgeLevel.value ?: 1
            updateUI(salaId, currentLevel)
        }
    }

    private fun updateUI(salaId: String, level: Int) {
        // Detectar idioma
        val lang = viewModel.language.value ?: "es"
        val isEn = (lang == "en")

        // Etiquetas Generales
        if (isEn) {
            tvLabelInfo.text = "INFORMATION"
            tvLabelRec.text = "RECOMMENDATIONS"
            tvLevelBadge.text = when(level) {
                0 -> "Level: Explorer"
                1 -> "Level: Miner"
                2 -> "Level: Scientist"
                else -> "Level: Unknown"
            }
        } else {
            tvLabelInfo.text = "INFORMACIÓN"
            tvLabelRec.text = "RECOMENDACIONES"
            tvLevelBadge.text = when(level) {
                0 -> "Nivel: Explorador"
                1 -> "Nivel: Minero"
                2 -> "Nivel: Científico"
                else -> "Nivel: Desconocido"
            }
        }

        // CONTENIDO (Traducido)
        when (salaId.uppercase()) {
            "CUADROS" -> {
                tvTitle.text = if (isEn) "Art Gallery" else "Sala de Cuadros"
                ivHeader.setImageResource(R.drawable.header_cuadros)

                tvDescription.text = if (isEn) {
                    when(level) {
                        0 -> """
                            You are in the quietest and prettiest area of the museum. Look around: it looks like a real art gallery, but all the paintings are made of little squares. It's like magic!
                            
                            That giant skull painting you see in the back isn't scary, it's an adventure story! And if you look at the right wall, there's a painting of a man eating a Kebab. Here you can play art detective. See the touch screen in the center? You can draw your own painting with your finger and see how it would look hanging in your Minecraft house. Don't forget to look for the hidden cat in the paintings!
                        """.trimIndent()
                        1 -> """
                            This room recreates a classic art gallery with focused lighting. The works on display are large-format reproductions of the original oil paintings by Kristoffer Zetterstrand, placed next to their pixelated Minecraft versions.
                            
                            The central exhibit, "Pixel Evolution," shows how a complex painting is reduced to a 16x16 pixel mesh without losing its essence. Don't miss the display case with the "beta" versions of paintings that never made it into the final game. Also, check out the references: from the Counter-Strike 'de_aztec' map to tributes to Donkey Kong. It's a tribute to how pop culture feeds back into itself.
                        """.trimIndent()
                        2 -> """
                            The museography of this room is designed to highlight the contrast between analog art and digital compression. The panels explain the "downsampling" algorithm used to convert oil paintings into low-resolution textures.
                            
                            Highlights include the projection on the north wall about "Z-Fighting": a technical visual demonstration of why paintings flicker when overlapping other surfaces in the rendering engine. The central table contains a tablet with the decompiled texture atlas (kz.png), allowing the user to inspect metadata and UV coordinates of each work. A reflection on memory optimization in Java environments.
                        """.trimIndent()
                        else -> ""
                    }
                } else {
                    when(level) {
                        0 -> """
                            Estás en la zona más tranquila y bonita del museo. Mira a tu alrededor: parece una galería de arte de verdad, pero todos los cuadros están hechos de cuadraditos. ¡Es como magia!
                            
                            Ese cuadro gigante de la calavera que ves al fondo no da miedo, ¡es una historia de aventuras! Y si te fijas en la pared derecha, hay un cuadro de un señor comiendo un Kebab. Aquí puedes jugar a ser un detective de arte. ¿Ves la pantalla táctil en el centro? Puedes dibujar tu propio cuadro con el dedo y ver cómo quedaría si lo colgaras en tu casa de Minecraft. ¡No olvides buscar al gato escondido en las pinturas!
                        """.trimIndent()
                        1 -> """
                            Esta sala recrea una galería de arte clásica con iluminación focalizada. Las obras expuestas son reproducciones en gran formato de las pinturas al óleo originales de Kristoffer Zetterstrand, colocadas junto a su versión pixelada de Minecraft.
                            
                            La exhibición central, "Evolución del Pixel", muestra cómo una pintura compleja se reduce a una malla de 16x16 píxeles sin perder su esencia. No te pierdas la vitrina con las versiones "beta" de los cuadros que nunca llegaron al juego final. Además, no te pierdas las referencias: desde el mapa 'de_aztec' de Counter-Strike hasta homenajes a Donkey Kong. Es un tributo a cómo la cultura pop se retroalimenta.
                        """.trimIndent()
                        2 -> """
                            La museografía de esta sala está diseñada para resaltar el contraste entre el arte analógico y la compresión digital. Los paneles explican el algoritmo de "downsampling" utilizado para convertir óleos en texturas de baja resolución.
                            
                            Destaca la proyección en la pared norte sobre el "Z-Fighting": una demostración técnica visual de por qué los cuadros parpadean cuando se superponen a otras superficies en el motor de renderizado. La mesa central contiene una tablet con el atlas de texturas descompilado (kz.png), permitiendo al usuario inspeccionar los metadatos y las coordenadas UV de cada obra. Una reflexión sobre la optimización de memoria en entornos Java.
                        """.trimIndent()
                        else -> ""
                    }
                }

                tvRecommendations.text = if (isEn) {
                    when(level) {
                        0 -> "• The touch screen for drawing\n• The giant Skull painting\n• Can you find the Karate painting?"
                        1 -> "• Comparison: Oil vs Pixel\n• 'Deleted Paintings' display case\n• Classic video game reference panel"
                        2 -> "• Z-Fighting projection\n• Decompiled texture atlas\n• RGB color palette analysis"
                        else -> ""
                    }
                } else {
                    when(level) {
                        0 -> "• La pantalla táctil para dibujar\n• El cuadro gigante de la Calavera\n• ¿Puedes encontrar el cuadro del Karate?"
                        1 -> "• Comparativa: Óleo vs Pixel\n• Vitrina de 'Cuadros Eliminados'\n• Panel de referencias a videojuegos clásicos"
                        2 -> "• Proyección sobre el Z-Fighting\n• Atlas de texturas descompilado\n• Análisis de la paleta de colores RGB"
                        else -> ""
                    }
                }
            }

            "COMBATE" -> {
                tvTitle.text = if (isEn) "Combat Room" else "Sala de Combate"
                ivHeader.setImageResource(R.drawable.header_combate)

                tvDescription.text = if (isEn) {
                    when(level) {
                        0 -> """
                            Watch out! You are entering the warrior zone. This room looks like a medieval castle. Look at those display cases: they have swords that really shine!
                            
                            In the center, there is a mannequin with full diamond armor. It's super shiny! On the left, you have the archery range. Don't worry, the arrows are made of light, they don't hurt. You can try shooting at the moving targets. And look at the giant shield on the wall: it's used to protect against Creeper explosions!
                        """.trimIndent()
                        1 -> """
                            Welcome to the Armory. The room design mimics a stone fortress with banners from different factions (Illagers vs Villagers). The main attraction is the "Combat Timeline," a display case showing the evolution of weapons from the Alpha version to today.
                            
                            Don't miss trying the "Strength Tester" in the corner: hit the foam block with the replica sword, and the screen will tell you if you landed a "Critical Hit" or not. We also have a section dedicated to Alchemy, with real bubbling flasks that change color, simulating Strength and Speed potions.
                        """.trimIndent()
                        2 -> """
                            This technical room breaks down the math behind the post-1.9 combat system. The right wall projects real-time "hitboxes" (collision boxes) of different mobs, showing their weak points.
                            
                            The central exhibit features an impact sensor that measures the "Tick Rate" of your hits, visually teaching the concept of DPS (Damage Per Second) vs Damage Per Hit. There is also a mechanical diorama explaining shield mechanics: a piston fires rubber projectiles to demonstrate the 90-degree blocking angle and Knockback vector nullification.
                        """.trimIndent()
                        else -> ""
                    }
                } else {
                    when(level) {
                        0 -> """
                            ¡Cuidado! Entras en la zona de los guerreros. Esta sala parece un castillo medieval. Mira esas vitrinas: ¡tienen espadas que brillan de verdad!
                            
                            En el centro hay un maniquí con una armadura de diamante completa. ¡Es super brillante! A la izquierda tienes la zona de tiro con arco. No te preocupes, las flechas son de luz, no hacen daño. Puedes probar a disparar a las dianas que se mueven. Y fíjate en el escudo gigante de la pared: ¡sirve para protegerse de las explosiones de los Creepers!
                        """.trimIndent()
                        1 -> """
                            Bienvenido a la Armería. El diseño de la sala imita una fortaleza de piedra con estandartes de las distintas facciones (Illagers vs Aldeanos). La atracción principal es la "Línea de Tiempo del Combate", una vitrina que muestra la evolución de las armas desde la versión Alpha hasta hoy.
                            
                            No dejes de probar el "Medidor de Fuerza" en la esquina: golpea el bloque de espuma con la espada de réplica y la pantalla te dirá si has hecho un "Golpe Crítico" o no. También tenemos una sección dedicada a la Alquimia, con frascos reales que burbujean y cambian de color, simulando pociones de Fuerza y Velocidad.
                        """.trimIndent()
                        2 -> """
                            Esta sala técnica desglosa las matemáticas detrás del sistema de combate post-1.9. El muro de la derecha proyecta en tiempo real las "hitboxes" (cajas de colisión) de distintos mobs, mostrando sus puntos débiles.
                            
                            La exhibición central cuenta con un sensor de impacto que mide el "Tick Rate" de tus golpes, enseñándote visualmente el concepto de DPS (Daño por Segundo) vs Daño por Golpe. También hay un diorama mecánico que explica el funcionamiento del escudo: un pistón dispara proyectiles de goma para demostrar el ángulo de bloqueo de 90 grados y la anulación del vector de retroceso (Knockback).
                        """.trimIndent()
                        else -> ""
                    }
                }

                tvRecommendations.text = if (isEn) {
                    when(level) {
                        0 -> "• Mannequin with Diamond armor\n• Laser archery game\n• Bubbling potion table"
                        1 -> "• 'Sword Evolution' display case\n• Strength Tester (Try a critical!)\n• Illager Banners"
                        2 -> "• Hitbox and Collision projection\n• Cooldown and Tick sensor\n• Mechanical Shield diorama"
                        else -> ""
                    }
                } else {
                    when(level) {
                        0 -> "• El maniquí con armadura de Diamante\n• El juego de tiro con arco láser\n• La mesa de pociones burbujeante"
                        1 -> "• Vitrina 'Evolución de la Espada'\n• El Medidor de Fuerza (¡Intenta el crítico!)\n• Estandartes de los Illagers"
                        2 -> "• Proyección de Hitboxes y Colisiones\n• Sensor de Cooldown y Ticks\n• Diorama mecánico del Escudo"
                        else -> ""
                    }
                }
            }

            "NETHER" -> {
                tvTitle.text = if (isEn) "Nether Room" else "Sala del Nether"
                ivHeader.setImageResource(R.drawable.header_nether)

                tvDescription.text = if (isEn) {
                    when(level) {
                        0 -> """
                            It's so hot in here! We've decorated this room to look like the inside of a volcano. The floor is red and there is "lava" (it's light, it doesn't burn!) flowing down the walls.
                            
                            Look up: There's a giant white ghost hanging from the ceiling! It's a Ghast. If you listen closely, you can hear it crying. In the corner, there is a little house made of gold where the zombie piglins live. Be careful not to step on the giant mushrooms. Oh! And don't miss the purple Portal at the entrance, it makes a magical sound when you pass through it.
                        """.trimIndent()
                        1 -> """
                            You have crossed the Portal. The setting of this room includes raised thermostats and dry fog smoke to simulate the oppressive atmosphere of the Underworld. The floor is made of a rough material that mimics Netherrack.
                            
                            The centerpiece is a scale replica of a Nether Fortress, built with dark bricks. You can see the Blaze "Spawners" lighting up. On the east wall, we have the "Fungal Garden," a closed terrarium with real dyed mycelium recreating the Crimson and Warped Forest biomes. Also observe the Piglin mannequin: it holds a real gold sword and reacts if you show it an ingot (motion sensor).
                        """.trimIndent()
                        2 -> """
                            Geological and procedural approach. Informational panels explain the 3D Perlin Noise algorithm used to generate these infinite caverns. The room features a topographic model showing terrain generation from layer 0 to the Bedrock ceiling at layer 128.
                            
                            Highlights include the "Exotic Materials" display case: physical samples of Ancient Debris (with its real density) and Netherite, explaining its melting point. There is also a fluid simulation on screen comparing lava viscosity in the Nether (flows 8 blocks) vs the real world, demonstrating the altered physics of this dimension.
                        """.trimIndent()
                        else -> ""
                    }
                } else {
                    when(level) {
                        0 -> """
                            ¡Qué calor hace aquí! Hemos decorado esta sala para que parezca el interior de un volcán. El suelo es rojo y hay "lava" (es luz, ¡no quema!) corriendo por las paredes.
                            
                            Mira arriba: ¡Hay un fantasma gigante blanco colgado del techo! Es un Ghast. Si escuchas bien, puedes oírle llorar. En la esquina hay una casita hecha de oro donde viven los cerditos zombies. Ten cuidado de no pisar las setas gigantes. ¡Ah! Y no te pierdas el Portal morado de la entrada, hace un sonido mágico cuando pasas por él.
                        """.trimIndent()
                        1 -> """
                            Has cruzado el Portal. La ambientación de esta sala incluye termostatos elevados y humo de niebla seca para simular la atmósfera opresiva del Inframundo. El suelo está hecho de un material rugoso que imita la Netherrack.
                            
                            La pieza central es una réplica a escala de una Fortaleza del Nether, construida con ladrillos oscuros. Puedes ver los "Spawners" de Blaze iluminándose. En la pared este, tenemos el "Jardín de Hongos", un terrario cerrado con micelio real teñido que recrea los biomas del Bosque Carmesí y Deformado. Observa también el maniquí de Piglin: lleva una espada de oro real y reacciona si le enseñas un lingote (sensor de movimiento).
                        """.trimIndent()
                        2 -> """
                            Enfoque geológico y procedural. Los paneles informativos explican el algoritmo de Ruido Perlin 3D utilizado para generar estas cavernas infinitas. La sala cuenta con una maqueta topográfica que muestra la generación del terreno desde la capa 0 hasta el techo de Bedrock en la capa 128.
                            
                            Destaca la vitrina de "Materiales Exóticos": muestras físicas de Ancient Debris (con su densidad real) y Netherite, explicando su punto de fusión. También hay una simulación de fluidos en pantalla que compara la viscosidad de la lava en el Nether (fluye 8 bloques) frente al mundo real, demostrando la física alterada de esta dimensión.
                        """.trimIndent()
                        else -> ""
                    }
                }

                tvRecommendations.text = if (isEn) {
                    when(level) {
                        0 -> "• Giant ceiling Ghast\n• Glowing 'lava' floor\n• Golden Piglin house"
                        1 -> "• Fortress Replica\n• Crimson Forest Terrarium\n• Interactive Piglin Mannequin"
                        2 -> "• Topographic model (Layer 0-128)\n• Physical Netherite samples\n• Fluid viscosity simulation"
                        else -> ""
                    }
                } else {
                    when(level) {
                        0 -> "• El Ghast gigante del techo\n• El suelo de 'lava' luminosa\n• La casita de oro de los cerditos"
                        1 -> "• Réplica de la Fortaleza\n• Terrario del Bosque Carmesí\n• Maniquí interactivo de Piglin"
                        2 -> "• Maqueta topográfica (Capa 0-128)\n• Muestras físicas de Netherite\n• Simulación de viscosidad de fluidos"
                        else -> ""
                    }
                }
            }

            "END" -> {
                tvTitle.text = if (isEn) "The End Room" else "Sala del End"
                ivHeader.setImageResource(R.drawable.header_end)

                tvDescription.text = if (isEn) {
                    when(level) {
                        0 -> """
                            Welcome to space! Everything is dark and full of purple stars. The most impressive thing is the giant Black Dragon hanging from the ceiling. It's huge!
                            
                            In the center of the room, protected by super strong glass, is the Dragon Egg. There's only one in the whole world! You can also see Endermen: they are very tall statues with glowing purple eyes. If you stand in front of them, there is a sensor that makes them scream at you. Try the flight simulator to feel like you have wings!
                        """.trimIndent()
                        1 -> """
                            This room reproduces the atmosphere of void and isolation of the End. Lighting comes exclusively from real "End Rods" distributed throughout the room. The ceiling projects purple static.
                            
                            Don't miss the holographic displays showing the architecture of End Cities. We have a functional replica of a Shulker Box: you can open it and see how the mechanism inside "levitates." The 1:1 scale Ender Dragon ("Jean") model above our heads allows you to observe its anatomy. Additionally, the interactive totem with Leap Motion sensor lets you control a flight camera using your hands as if they were Elytra.
                        """.trimIndent()
                        2 -> """
                            Dimensional analysis zone. Here, the Dragon's AI and attack phases are studied. A screen displays the Enderman behavior code and how the algorithm decides when to become hostile (by looking at the player's vision vector).
                            
                            The central exhibit includes a Dragon Egg levitating via real magnetism. Panels explain the procedural generation of outer islands (starting at coordinate 1000) and the math behind Stronghold triangulation using Eyes of Ender. A must-see is the technical breakdown of the motion sensor used in the Elytra simulator.
                        """.trimIndent()
                        else -> ""
                    }
                } else {
                    when(level) {
                        0 -> """
                            ¡Bienvenido al espacio! Todo está oscuro y lleno de estrellas moradas. Lo más impresionante es el Dragón Negro gigante que cuelga del techo. ¡Es enorme!
                            
                            En el centro de la sala, protegido por un cristal súper fuerte, está el Huevo de Dragón. ¡Solo hay uno en todo el mundo! También puedes ver a los Enderman: son estatuas muy altas con ojos morados brillantes. Si te pones frente a ellos, hay un sensor que hace que te griten. ¡Prueba el simulador de vuelo para sentirte como si tuvieras alas!
                        """.trimIndent()
                        1 -> """
                            Esta sala reproduce la atmósfera de vacío y aislamiento del End. La iluminación proviene exclusivamente de las "End Rods" (Varas del End) reales distribuidas por la sala. El techo proyecta estática púrpura.
                            
                            No te pierdas las vitrinas holográficas que muestran la arquitectura de las End Cities. Tenemos una réplica funcional de una Shulker Box: puedes abrirla y ver cómo el mecanismo interior "levita". El modelo del Ender Dragon ("Jean") a escala 1:1 sobre nuestras cabezas permite observar su anatomía. Además, el tótem interactivo con sensor Leap Motion te permite controlar una cámara de vuelo usando tus manos como si fueran Elytras.
                        """.trimIndent()
                        2 -> """
                            Zona de análisis dimensional. Aquí se estudia la IA del Dragón y sus fases de ataque. Una pantalla muestra el código de comportamiento del Enderman y cómo el algoritmo decide cuándo volverse hostil (al mirar el vector de visión del jugador).
                            
                            La exhibición central incluye un Huevo de Dragón levitando mediante magnetismo real. Los paneles explican la generación procedural de las islas exteriores (a partir de la coordenada 1000) y la matemática detrás de la triangulación de las Strongholds usando Ojos de Ender. Imprescindible ver el despiece técnico del sensor de movimiento utilizado en el simulador de Elytras.
                        """.trimIndent()
                        else -> ""
                    }
                }

                tvRecommendations.text = if (isEn) {
                    when(level) {
                        0 -> "• Giant ceiling Dragon\n• Flight simulator (Move your arms!)\n• Enderman statues (Watch their eyes!)"
                        1 -> "• Levitating Dragon Egg\n• Functional Shulker Box replica\n• Real lighting with End Rods"
                        2 -> "• Enderman AI algorithm breakdown\n• Island generation visualization (Voronoi)\n• Magnetic Egg levitation"
                        else -> ""
                    }
                } else {
                    when(level) {
                        0 -> "• El Dragón gigante del techo\n• Simulador de vuelo (¡Mueve los brazos!)\n• Estatuas de Enderman (¡Cuidado con los ojos!)"
                        1 -> "• El Huevo de Dragón levitando\n• Réplica funcional de Shulker Box\n• Iluminación real con End Rods"
                        2 -> "• Despiece del algoritmo de IA del Enderman\n• Visualización de generación de islas (Voronoi)\n• Levitación magnética del Huevo"
                        else -> ""
                    }
                }
            }

            "BLOQUES" -> {
                tvTitle.text = if (isEn) "Block Room" else "Sala de Bloques"
                ivHeader.setImageResource(R.drawable.header_bloques)

                tvDescription.text = if (isEn) {
                    when(level) {
                        0 -> """
                            This looks like a mad scientist's laboratory! Here we have all the game blocks sorted by color on a giant wall. You can touch them: grass is soft and stone is rough.
                            
                            In the center is a giant machine full of red lights and moving pistons. It's the Redstone circuit. There are big buttons you can push to turn on lamps, open secret doors, and play musical notes. It's like a giant piano! Also look at the green Slime block: if you touch it, you'll see it's sticky and squishy for real.
                        """.trimIndent()
                        1 -> """
                            The design of this room is inspired by a giant crafting table. The north wall is the "Periodic Table of Minecraft," a physical collection of every block in the game classified by their properties.
                            
                            The main attraction is the "Demonstrative Logic Circuit": a physical installation with visible wiring that teaches how Redstone works by comparing it to real electricity. You can interact with levers to activate real hydraulic pistons and see how they push wooden blocks. There is also a cross-section showing what a TNT block looks like inside (no real gunpowder, for safety!).
                        """.trimIndent()
                        2 -> """
                            Space dedicated to engineering and computer science within the game. Here we analyze Redstone as a Turing-complete system. Interactive panels allow you to build physical logic gates (AND, OR, XOR) and see their result in real time.
                            
                            Highlights include the "Update Order" visualization: how the game decides which block to update first in the same tick. There is also a model explaining the difference between solid and transparent blocks at the lighting engine level. Don't miss the oscilloscope connected to the Note Block circuit, showing the sound wave generated by the game.
                        """.trimIndent()
                        else -> ""
                    }
                } else {
                    when(level) {
                        0 -> """
                            ¡Esto parece el laboratorio de un científico loco! Aquí tenemos todos los bloques del juego ordenados por colores en una pared gigante. Puedes tocarlos: la hierba es suave y la piedra raspa.
                            
                            En el centro hay una máquina gigante llena de luces rojas y pistones que se mueven. Es el circuito de Redstone. Hay botones grandes que puedes pulsar para encender lámparas, abrir puertas secretas y hacer sonar notas musicales. ¡Es como un piano gigante! Mira también el bloque de Slime verde: si lo tocas, verás que es pegajoso y blandito de verdad.
                        """.trimIndent()
                        1 -> """
                            El diseño de esta sala está inspirado en una mesa de crafteo gigante. La pared norte es la "Tabla Periódica de Minecraft", una colección física de cada bloque del juego clasificado por sus propiedades.
                            
                            La atracción principal es el "Circuito Lógico Demostrativo": una instalación física con cableado visible que enseña cómo funciona la Redstone comparándola con la electricidad real. Puedes interactuar con palancas para activar pistones hidráulicos reales y ver cómo empujan bloques de madera. También hay una sección de corte transversal que muestra cómo es un bloque de TNT por dentro (¡sin pólvora real, por seguridad!).
                        """.trimIndent()
                        2 -> """
                            Espacio dedicado a la ingeniería y la informática dentro del juego. Aquí analizamos la Redstone como un sistema Turing-completo. Los paneles interactivos te permiten construir puertas lógicas (AND, OR, XOR) físicas y ver su resultado en tiempo real.
                            
                            Destaca la visualización del "Update Order": cómo el juego decide qué bloque actualizar primero en un mismo tick. También hay una maqueta que explica la diferencia entre bloques sólidos y transparentes a nivel de motor de iluminación. No te pierdas el osciloscopio conectado al circuito de bloques musicales, que muestra la onda de sonido generada por el juego.
                        """.trimIndent()
                        else -> ""
                    }
                }

                tvRecommendations.text = if (isEn) {
                    when(level) {
                        0 -> "• Wall of blocks to touch\n• Squishy Slime Block\n• Note Block Piano"
                        1 -> "• Periodic Table of Blocks\n• Functional hydraulic pistons\n• TNT cross-section"
                        2 -> "• Logic Gate test bench\n• Update Order visualization\n• Note Block Oscilloscope"
                        else -> ""
                    }
                } else {
                    when(level) {
                        0 -> "• Pared de bloques para tocar\n• Bloque de Slime blandito\n• Piano de Bloques Musicales"
                        1 -> "• La Tabla Periódica de Bloques\n• Pistones hidráulicos funcionales\n• Sección transversal de la TNT"
                        2 -> "• Banco de pruebas de Puertas Lógicas\n• Visualización de Update Order\n• Osciloscopio de Bloques Musicales"
                        else -> ""
                    }
                }
            }

            else -> {
                tvTitle.text = if (isEn) "Transit Zone" else "Zona de Tránsito"
                ivHeader.setImageResource(android.R.color.darker_gray)
                tvDescription.text = if (isEn) "You are in a connecting corridor or an uncatalogued zone of the museum. Please head to one of the main rooms to see the exhibits." else "Estás en un pasillo de conexión o una zona no catalogada del museo. Por favor, dirígete a una de las salas principales para ver las exhibiciones."
                tvRecommendations.text = if (isEn) "• Look for signs\n• Ask museum staff" else "• Busca los carteles de señalización\n• Pregunta al personal del museo"
            }
        }
    }
}