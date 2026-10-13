package com.example.aplicacion_npi_3.ui.fragments

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.lifecycleScope
import com.example.aplicacion_npi_3.R
import com.example.aplicacion_npi_3.ui.viewmodels.MuseumViewModel
import io.github.sceneview.SceneView
import io.github.sceneview.math.Position
import io.github.sceneview.math.Rotation
import io.github.sceneview.node.ModelNode
import io.github.sceneview.node.Node
import kotlinx.coroutines.launch

class ObjectDetailFragment : Fragment() {

    private val viewModel: MuseumViewModel by activityViewModels()

    private lateinit var tvName: TextView
    private lateinit var tvDescription: TextView
    private lateinit var tvLevelBadge: TextView
    private lateinit var tvLabelAnalysis: TextView
    private var sceneView: SceneView? = null

    // Jerarquía simple
    private var nodeYaw: Node? = null
    private var currentModelNode: ModelNode? = null

    // Variables de rotación
    private var lastTouchX: Float = 0f
    private var currentYaw: Float = 0f

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return inflater.inflate(R.layout.fragment_object_detail, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Vincular vistas
        tvName = view.findViewById(R.id.tvObjectName)
        tvDescription = view.findViewById(R.id.tvObjectDescription)
        tvLevelBadge = view.findViewById(R.id.tvUserLevel)
        tvLabelAnalysis = view.findViewById(R.id.tvLabelAnalysis)
        sceneView = view.findViewById(R.id.sceneView)

        sceneView?.setBackgroundColor(Color.TRANSPARENT)

        setupBaseHierarchy()
        setupTouchControl()

        val objectId = arguments?.getString("objeto_id") ?: "DIAMOND_BLOCK"

        // Observar Nivel
        viewModel.knowledgeLevel.observe(viewLifecycleOwner) { level ->
            if (!isAdded) return@observe
            updateContent(objectId, level)
        }

        // Observar Idioma
        viewModel.language.observe(viewLifecycleOwner) {
            if (!isAdded) return@observe
            val currentLevel = viewModel.knowledgeLevel.value ?: 1
            updateContent(objectId, currentLevel)
        }
    }

    private fun setupBaseHierarchy() {
        val engine = sceneView?.engine ?: return
        val yawNode = Node(engine = engine).apply {
            position = Position(0.0f, 0.0f, -2.5f)
        }
        sceneView?.addChildNode(yawNode)
        nodeYaw = yawNode
    }

    private fun setupTouchControl() {
        sceneView?.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    lastTouchX = event.x
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val deltaX = event.x - lastTouchX
                    lastTouchX = event.x
                    currentYaw -= deltaX * 0.4f
                    nodeYaw?.rotation = Rotation(0f, currentYaw, 0f)
                    true
                }
                else -> true
            }
        }
    }

    private fun updateContent(objectId: String, level: Int) {
        // Actualizamos textos (Título, Descripción, Etiquetas)
        updateTextDescription(objectId, level)

        // Cargamos modelo
        val modelFileName = getFileName(objectId) ?: return

        viewLifecycleOwner.lifecycleScope.launch {
            if (!isAdded || sceneView == null) return@launch
            try {
                load3DModel(modelFileName)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    //Logica de carga 3d con sceneviewer
    private suspend fun load3DModel(fileName: String) {
        val sceneViewLocal = sceneView ?: return

        // Destruir anterior
        currentModelNode?.let { node ->
            try {
                node.parent = null
                node.destroy()
            } catch (e: Exception) { }
        }
        currentModelNode = null

        val instance = sceneViewLocal.modelLoader.loadModelInstance(fileName)
        if (instance == null || !isAdded) return

        val config = getModelConfig(fileName)
        val modelNode = ModelNode(
            modelInstance = instance,
            scaleToUnits = config.scale
        ).apply {
            position = config.position
            rotation = config.rotation
            isEditable = false
        }

        nodeYaw?.addChildNode(modelNode)
        currentModelNode = modelNode
    }

    data class ModelConfig(
        val scale: Float,
        val position: Position,
        val rotation: Rotation
    )

    private fun getModelConfig(fileName: String): ModelConfig {
        // Configuracion visual hardcodeada
        return when (fileName) {
            "steve.glb" -> ModelConfig(1.8f, Position(0f, -1.0f, 0f), Rotation(0f, 0f, 0f))
            "diamond_block.glb" -> ModelConfig(150f, Position(0f, 0f, 0f), Rotation(0f, 0f, 0f))
            "espada_hierro.glb" -> ModelConfig(1.5f, Position(0f, -0.7f, 0f), Rotation(0f, 45f, 0f))
            "minecraft_grass_block.glb" -> ModelConfig(1.2f, Position(0f, -0.5f, 0f), Rotation(270f, 0f, 0f))
            "minecraft_iron_ore.glb" -> ModelConfig(1f, Position(-0.5f, 0.5f, 0f), Rotation(0f, 0f, 0f))
            "gold_helmet.glb" -> ModelConfig(1.5f, Position(0f, -0.3f, 0f), Rotation(0f, 0f, 0f))
            "apple.glb" -> ModelConfig(1.3f, Position(-0.1f, 0f, 0f), Rotation(0f, 90f, 90f))
            "minecraft_chest.glb" -> ModelConfig(1.5f, Position(0f, -0.5f, 0f), Rotation(0f, 270f, 0f))
            else -> ModelConfig(1.5f, Position(0f, -0.5f, 0f), Rotation(0f, 0f, 0f))
        }
    }

    private fun getFileName(objectId: String): String? {
        return when (objectId.uppercase()) {
            "DIAMOND_BLOCK" -> "diamond_block.glb"
            "IRON_SWORD" -> "espada_hierro.glb"
            "GRASS_BLOCK" -> "minecraft_grass_block.glb"
            "STEVE" -> "steve.glb"
            "IRON_ORE" -> "minecraft_iron_ore.glb"
            "GOLD_HELMET" -> "gold_helmet.glb"
            "APPLE" -> "apple.glb"
            "MINECRAFT_CHEST" -> "minecraft_chest.glb"
            else -> null
        }
    }

    //Traducciopn y contenido
    private fun updateTextDescription(objectId: String, level: Int) {
        val isEn = viewModel.language.value == "en"

        // Traduccion de la interfaz
        if (isEn) {
            tvLabelAnalysis.text = "OBJECT ANALYSIS"
            tvLevelBadge.text = when (level) {
                0 -> "Level: Explorer"
                1 -> "Level: Miner"
                2 -> "Level: Scientist"
                else -> "Level: Unknown"
            }
        } else {
            tvLabelAnalysis.text = "ANÁLISIS DEL OBJETO"
            tvLevelBadge.text = when (level) {
                0 -> "Nivel: Explorador"
                1 -> "Nivel: Minero"
                2 -> "Nivel: Científico"
                else -> "Nivel: Desconocido"
            }
        }

        when (objectId.uppercase()) {
            "DIAMOND_BLOCK" -> {
                tvName.text = if (isEn) "Diamond Block" else "Bloque de Diamante"
                tvDescription.text = if (isEn) {
                    when (level) {
                        0 -> "You are facing the jewel in the crown! This shiny cube is made of nine pure compressed diamonds. In the world of Minecraft, having one of these in your house means you are a legendary explorer. It is so hard and shiny that it is used to decorate the castles of kings and queens. Imagine how many dark caves you would have to explore and how many monsters you would have to defeat to get enough diamonds to build a whole house with this!"
                        1 -> "This block represents the pinnacle of wealth in Survival mode. It is obtained by combining 9 diamonds in the crafting table, making it one of the most expensive blocks per square meter in the game. Beyond its aesthetic value and 'flexing' on multiplayer servers, it has a vital function in the 'End-Game': it is the most efficient base material to build the pyramid that activates Magic Beacons, granting regeneration and strength powers to all nearby players."
                        2 -> "Technical data: ID 'diamond_block'. It was introduced in version Indev 0.31 (year 2010). It possesses a hardness of 5 and a blast resistance of 6, identical to stone, which curiously makes it vulnerable to TNT despite its value. Regarding rendering, its texture has undergone three major revisions to correct 'tiling' (edge alignment when repeating the block). It is a finite resource in the world, except for loot generation in End City chests."
                        else -> ""
                    }
                } else {
                    when (level) {
                        0 -> "¡Estás ante la joya de la corona! Este cubo brillante está formado por nueve diamantes puros comprimidos. En el mundo de Minecraft, tener uno de estos en tu casa significa que eres un explorador legendario. Es tan duro y brillante que se usa para decorar los castillos de los reyes y reinas. ¡Imagínate cuántas cuevas oscuras tendrías que explorar y cuántos monstruos tendrías que vencer para conseguir suficientes diamantes para construir una casa entera con esto!"
                        1 -> "Este bloque representa el pináculo de la riqueza en el modo Supervivencia. Se obtiene combinando 9 diamantes en la mesa de crafteo, lo que lo convierte en uno de los bloques más caros por metro cuadrado del juego. Más allá de su valor estético y de 'flexing' en servidores multijugador, tiene una función vital en el 'End-Game': es el material base más eficiente para construir la pirámide que activa los Faros Mágicos (Beacons), otorgando poderes de regeneración y fuerza a todos los jugadores cercanos."
                        2 -> "Datos técnicos: ID 'diamond_block'. Fue introducido en la versión Indev 0.31 (año 2010). Posee una dureza de 5 y una resistencia a explosiones de 6, idéntica a la piedra, lo que curiosamente lo hace vulnerable a la TNT a pesar de su valor. A nivel de renderizado, su textura ha sufrido tres revisiones mayores para corregir el 'tiling' (la alineación de bordes al repetir el bloque). Es un recurso finito en el mundo, salvo por la generación de botín en cofres de End Cities."
                        else -> ""
                    }
                }
            }

            "IRON_SWORD" -> {
                tvName.text = if (isEn) "Iron Sword" else "Espada de Hierro"
                tvDescription.text = if (isEn) {
                    when (level) {
                        0 -> "This is the faithful companion of every adventurer. It's not the strongest sword, nor the fastest, but it will always be there to protect you. When you hear a zombie approaching or see the red eyes of a spider in the dark, drawing your iron sword makes you feel safe. Its silver blade is sharp and ready for action. Remember: a good warrior always carries a spare one in the backpack just in case it breaks in the middle of battle!"
                        1 -> "The 'workhorse' of Minecraft. Crafted with a stick and two iron ingots, it represents the perfect balance between economy and effectiveness (DPS). It is the weapon that most players use during 90% of their adventure. Although the diamond sword is iconic, the iron one is the one that truly conquers the world. It can receive powerful enchantments like Sharpness, Fire Aspect, or Looting, turning it into a lethal tool capable of competing with superior materials."
                        2 -> "Stats: 6 damage (3 hearts) and 250 durability uses. The 1.9 update (Combat Update) completely transformed its mechanics, adding a 'Cooldown' of 1.6 seconds to inflict maximum damage and the 'Sweep Attack', which allows controlling crowds of mobs by hitting multiple targets at once. Its crafting recipe is one of the oldest in the code, remaining unaltered since Alpha versions."
                        else -> ""
                    }
                } else {
                    when (level) {
                        0 -> "Esta es la fiel compañera de todo aventurero. No es la espada más fuerte, ni la más rápida, pero siempre estará ahí para protegerte. Cuando escuchas a un zombie acercarse o ves los ojos rojos de una araña en la oscuridad, sacar tu espada de hierro te hace sentir seguro. Su hoja plateada está afilada y lista para la acción. Recuerda: ¡un buen guerrero siempre lleva una de repuesto en la mochila por si se rompe en medio de la batalla!"
                        1 -> "El 'caballo de batalla' de Minecraft. Fabricada con un palo y dos lingotes de hierro, representa el equilibrio perfecto entre economía y efectividad (DPS). Es el arma que la mayoría de jugadores utiliza durante el 90% de su aventura. Aunque la espada de diamante es icónica, la de hierro es la que realmente conquista el mundo. Puede recibir encantamientos poderosos como Filo, Aspecto Ígneo o Saqueo, convirtiéndola en una herramienta letal capaz de competir con materiales superiores."
                        2 -> "Estadísticas: 6 de daño (3 corazones) y 250 usos de durabilidad. La actualización 1.9 (Combat Update) transformó su mecánica por completo, añadiendo un 'Cooldown' de 1.6 segundos para infligir daño máximo y el ataque de barrido ('Sweep Attack'), que permite controlar multitudes de mobs golpeando a varios objetivos a la vez. Su receta de crafteo es una de las más antiguas del código, permaneciendo inalterada desde las versiones Alpha."
                        else -> ""
                    }
                }
            }

            "GRASS_BLOCK" -> {
                tvName.text = if (isEn) "Grass Block" else "Bloque de Hierba"
                tvDescription.text = if (isEn) {
                    when (level) {
                        0 -> "It's the most famous block of all! Look closely: it has brown dirt underneath where worms live, and fresh green grass on top. It is nature's magic carpet. If you put water nearby, it turns a prettier green. Sheep love to eat the top part so their wool grows, and if you have a hoe, you can turn it into a garden to plant carrots and potatoes."
                        1 -> "The fundamental block that defines the surface of the Overworld. Grass is not static; it is a living organism that spreads to adjacent dirt blocks if the light level is 9 or higher. If you place a solid block on top, the grass dies and turns into dirt. To collect this block as is and use it for decoration or underground gardens, it is mandatory to use a tool enchanted with 'Silk Touch'."
                        2 -> "Historical curiosity: It was the first block programmed by Notch in the technical test 'Cave Game'. What is fascinating is its rendering: the top texture is actually gray in the game files. The engine applies a 'Colormap' in real-time based on a triangular gradient that crosses the temperature and humidity of the current biome's X/Z coordinates, resulting in shades ranging from jungle lime green to savanna olive green."
                        else -> ""
                    }
                } else {
                    when (level) {
                        0 -> "¡Es el bloque más famoso de todos! Mira bien: tiene tierra marrón por abajo donde viven los gusanos, y césped verde y fresco por arriba. Es la alfombra mágica de la naturaleza. Si pones agua cerca, se vuelve de un verde más bonito. A las ovejas les encanta comerse la parte de arriba para que les crezca la lana, y si tienes una azada, puedes convertirlo en un huerto para plantar zanahorias y patatas."
                        1 -> "El bloque fundamental que define la superficie del Overworld. La hierba no es estática; es un organismo vivo que se expande a los bloques de tierra adyacentes si el nivel de luz es 9 o superior. Si colocas un bloque sólido encima, la hierba muere y se convierte en tierra. Para recolectar este bloque tal cual y usarlo en decoración o jardines subterráneos, es obligatorio usar una herramienta encantada con 'Toque de Seda' (Silk Touch)."
                        2 -> "Curiosidad histórica: Fue el primer bloque programado por Notch en la prueba técnica 'Cave Game'. Lo fascinante es su renderizado: la textura superior es en realidad gris en los archivos del juego. El motor aplica en tiempo real un 'Colormap' (mapa de color) basado en un gradiente triangular que cruza la temperatura y la humedad de las coordenadas X/Z del bioma actual, resultando en tonos que van desde el verde lima de la jungla hasta el verde oliva de la sabana."
                        else -> ""
                    }
                }
            }

            "STEVE" -> {
                tvName.text = "Steve"
                tvDescription.text = if (isEn) {
                    when (level) {
                        0 -> "Hello, Steve! He is the hero of our story, that is... you! He wears his classic cyan blue shirt and comfortable jeans to run and jump. Steve is incredible: he can chop down giant trees with his bare hands, swim at the bottom of the ocean, and build skyscrapers until touching the clouds. Although he doesn't speak, he is always smiling (well, he has a beard, but we imagine he smiles!) ready for the next adventure."
                        1 -> "The default avatar and the face of the franchise. Originally, the name 'Steve' emerged as a joke by Notch, but it was canonized over time. He is a character designed to be generic and projectable, allowing any player to identify with him. He has a superhuman carrying capacity: calculating an inventory full of gold blocks, Steve can carry millions of kilos without reducing his sprint speed. In 2014 Alex joined as a counterpart with thinner arms."
                        2 -> "Technical model: Standard humanity with 4-pixel wide arms. Collision hitbox: 0.6m wide x 1.8m high. The camera height (eyes) is located at 1.62m. In 2022, Mojang officially updated Steve's texture file to reintroduce the beard that had been accidentally removed in previous updates due to pixel smoothing, returning him to his original appearance from the Alpha version."
                        else -> ""
                    }
                } else {
                    when (level) {
                        0 -> "¡Hola, Steve! Es el héroe de nuestra historia, o sea... ¡tú! Lleva su clásica camiseta azul cian y pantalones vaqueros cómodos para correr y saltar. Steve es increíble: puede talar árboles gigantes con sus propias manos, nadar en el fondo del océano y construir rascacielos hasta tocar las nubes. Aunque no habla, siempre está sonriendo (bueno, tiene barba, ¡pero imaginamos que sonríe!) listo para la próxima aventura."
                        1 -> "El avatar por defecto y la cara de la franquicia. Originalmente, el nombre 'Steve' surgió como una broma de Notch, pero se canonizó con el tiempo. Es un personaje diseñado para ser genérico y proyectable, permitiendo que cualquier jugador se identifique con él. Tiene una capacidad de carga sobrehumana: calculando un inventario lleno de bloques de oro, Steve puede cargar millones de kilos sin reducir su velocidad de sprint. En 2014 se unió Alex como contraparte de brazos más delgados."
                        2 -> "Modelo técnico: Humanidad estándar con brazos de 4 píxeles de ancho. Hitbox de colisión: 0.6m de ancho x 1.8m de alto. La altura de la cámara (ojos) se sitúa a 1.62m. En 2022, Mojang actualizó oficialmente el archivo de textura de Steve para reintroducir la barba que se había eliminado accidentalmente en actualizaciones anteriores debido a una suavización de píxeles, devolviéndole su aspecto original de la versión Alpha."
                        else -> ""
                    }
                }
            }

            "IRON_ORE" -> {
                tvName.text = if (isEn) "Iron Ore" else "Mena de Hierro"
                tvDescription.text = if (isEn) {
                    when (level) {
                        0 -> "You found a hidden treasure in the wall! This rock has beige and orange spots. It means there is metal hidden inside. But you can't use it like this: you have to pick it hard and then cook it in a very hot furnace. Like a real blacksmith! When it melts, you will get shiny ingots to make yourself new armor."
                        1 -> "The most versatile mineral resource necessary for technological progression. It marks the passage from the 'Stone Age' to the 'Iron Age'. Previously, mining it yielded the block as is, but since update 1.17 (Caves & Cliffs), it drops 'Raw Iron'. This was a huge change, as it allows using the Fortune enchantment on the pickaxe to multiply the amount of iron obtained, facilitating large constructions."
                        2 -> "Geological generation: It generates in veins of variable size from sea level to the depths. The current texture was redesigned to improve accessibility: now it has an 'elongated spots' shape distinct from gold or copper, allowing people with color blindness to identify the mineral by its shape and not just its color. Requires Stone tier tool or higher to drop."
                        else -> ""
                    }
                } else {
                    when (level) {
                        0 -> "¡Has encontrado un tesoro escondido en la pared! Esta roca tiene manchitas de color beige y naranja. Significa que hay metal escondido dentro. Pero no puedes usarlo así: tienes que picarlo con fuerza y luego cocinarlo en un horno muy caliente. ¡Como si fueras un herrero de verdad! Cuando se derrita, obtendrás lingotes brillantes para hacerte una armadura nueva."
                        1 -> "El recurso mineral más versátil y necesario para la progresión tecnológica. Marca el paso de la 'Edad de Piedra' a la 'Edad de Hierro'. Anteriormente, al picarlo obtenías el bloque tal cual, pero desde la actualización 1.17 (Caves & Cliffs), suelta 'Hierro Crudo'. Esto fue un cambio enorme, ya que permite usar el encantamiento Fortuna en el pico para multiplicar la cantidad de hierro obtenido, facilitando grandes construcciones."
                        2 -> "Generación geológica: Se genera en vetas de tamaño variable desde el nivel del mar hasta las profundidades. La textura actual fue rediseñada para mejorar la accesibilidad: ahora tiene una forma de 'manchas alargadas' distinta a la del oro o el cobre, permitiendo que las personas con daltonismo identifiquen el mineral por su forma y no solo por su color. Requiere herramienta de nivel Piedra o superior para dropear."
                        else -> ""
                    }
                }
            }

            "GOLD_HELMET" -> {
                tvName.text = if (isEn) "Gold Helmet" else "Casco de Oro"
                tvDescription.text = if (isEn) {
                    when (level) {
                        0 -> "A crown for your head! Gold is very shiny and makes you look like a king, but be careful: it is a very soft metal and breaks quickly if you get hit a lot. Do you know a secret? The grumpy pigs of the Underworld (Piglins) love gold. If they see you wearing this helmet, they will think you are one of them and won't attack you. It is your perfect disguise!"
                        1 -> "Although gold has poor defensive stats (worse than iron) and very low durability, this helmet is a fundamental strategic piece. First, gold has the highest 'enchantability' in the game, making it easy to obtain high-level spells like Protection IV or Respiration. Second, it is the 'diplomatic passport' of the Nether: equipping it prevents Piglins from automatically becoming hostile."
                        2 -> "Stats: 2 armor points, durability of 77 uses. The Piglin pacification mechanic works through an inventory check: if the mob detects an item with the 'gold' material tag in any armor slot, its AI cancels the proximity 'aggro' state. However, opening a chest or mining gold near them will override this diplomatic effect immediately, regardless of the helmet."
                        else -> ""
                    }
                } else {
                    when (level) {
                        0 -> "¡Una corona para tu cabeza! El oro es muy brillante y te hace parecer un rey, pero ten cuidado: es un metal muy blandito y se rompe enseguida si te pegan mucho. ¿Sabes un secreto? A los cerditos gruñones del Inframundo (Piglins) les encanta el oro. Si te ven con este casco puesto, pensarán que eres uno de ellos y no te atacarán. ¡Es tu disfraz perfecto!"
                        1 -> "Aunque el oro tiene estadísticas defensivas pobres (peores que el hierro) y una durabilidad bajísima, este casco es una pieza estratégica fundamental. Primero, el oro tiene la mayor 'encantabilidad' del juego, facilitando obtener hechizos de alto nivel como Protección IV o Respiración. Segundo, es el 'pasaporte diplomático' del Nether: equiparlo evita que los Piglins se vuelvan hostiles automáticamente."
                        2 -> "Stats: 2 puntos de armadura, durabilidad de 77 usos. La mecánica de pacificación de Piglins funciona mediante un chequeo de inventario: si el mob detecta un ítem con el tag de material 'gold' en cualquier slot de armadura, su IA cancela el estado de 'aggro' por proximidad. Sin embargo, abrir un cofre o picar oro cerca de ellos anulará este efecto diplomático inmediatamente, independientemente del casco."
                        else -> ""
                    }
                }
            }

            "APPLE" -> {
                tvName.text = if (isEn) "Apple" else "Manzana"
                tvDescription.text = if (isEn) {
                    when (level) {
                        0 -> "A red, sweet, and crunchy fruit! It is perfect for a snack when your character is hungry. Sometimes, when you cut an oak tree, an apple falls to the ground as if by magic. It's not just for you: if you see a wild horse, you can give it apples to make it your friend and let you ride it. It is the animals' favorite treat!"
                        1 -> "A basic food that restores 4 hunger points (2 drumsticks). Although edible, its true value lies in alchemy and combat. It is the central ingredient to craft the Golden Apple (surrounded by 8 gold ingots), a lifesaver item that grants Absorption and Regeneration II. It is also essential to cure Zombie Villagers, combining it with a weakness potion."
                        2 -> "Drop probability: 0.5% (1 in 200) when breaking or decaying Oak or Dark Oak leaves. Trivia fact: In classic multiplayer versions, apples did not drop from trees. They were an extremely rare item that, according to the code, was only dropped by the game's creator himself, Notch, upon death, as a reference to his developer inventory."
                        else -> ""
                    }
                } else {
                    when (level) {
                        0 -> "¡Una fruta roja, dulce y crujiente! Es perfecta para merendar cuando tu personaje tiene hambre. A veces, cuando cortas un árbol de roble, una manzana cae al suelo como por arte de magia. No solo es para ti: si ves un caballo salvaje, puedes darle manzanas para que se haga tu amigo y te deje montarlo. ¡Es la golosina favorita de los animales!"
                        1 -> "Un alimento básico que restaura 4 puntos de hambre (2 muslos). Aunque es comestible, su verdadero valor reside en la alquimia y el combate. Es el ingrediente central para craftear la Manzana Dorada (rodeada de 8 lingotes de oro), un objeto salvavidas que otorga Absorción y Regeneración II. También es esencial para curar a los Aldeanos Zombis, combinándola con una poción de debilidad."
                        2 -> "Probabilidad de drop: 0.5% (1 de cada 200) al romper o descomponerse hojas de Roble o Roble Oscuro. Dato de trivia: En las versiones clásicas multijugador, las manzanas no caían de los árboles. Eran un objeto extremadamente raro que, según el código, solo soltaba el propio creador del juego, Notch, al morir, como una referencia a su inventario de desarrollador."
                        else -> ""
                    }
                }
            }

            "MINECRAFT_CHEST" -> {
                tvName.text = if (isEn) "Chest" else "Cofre"
                tvDescription.text = if (isEn) {
                    when (level) {
                        0 -> "It is your personal treasure box! Here you can keep all your stones, sticks, and diamonds so they don't get lost if a creeper explodes on you. It has an iron padlock, but it opens easily. Have you tried putting two chests next to each other? They join magically to form a giant trunk where absolutely everything fits! It makes a very satisfying crunchy wood sound when opening."
                        1 -> "The quintessential storage block. A simple chest has 27 slots (same as the player inventory without the hotbar), and a double one has 54. A key construction rule is that they cannot be opened if they have a solid block right on top, but they do work with transparent blocks like glass, slabs, or stairs, which allows creating compact storage walls."
                        2 -> "At the code level, it is a 'Block Entity' (Tile Entity). This means it has complex NBT data associated with it to remember what items are in each slot, unlike a normal stone block. Because of this, rendering hundreds of chests can cause lag on the client (FPS drop), as the game draws the chest geometry individually. Its hitbox is slightly smaller than a full block (0.875), leaving a small visual gap at the edges."
                        else -> ""
                    }
                } else {
                    when (level) {
                        0 -> "¡Es tu caja de tesoros personal! Aquí puedes guardar todas tus piedras, palos y diamantes para que no se pierdan si un creeper te explota. Tiene un candado de hierro, pero se abre fácil. ¿Has probado a poner dos cofres uno al lado del otro? ¡Se unen mágicamente para formar un baúl gigante donde cabe absolutamente todo! Hace un sonido de madera crujiente muy gustoso al abrirse."
                        1 -> "El bloque de almacenamiento por excelencia. Un cofre simple tiene 27 casillas (igual que el inventario del jugador sin barra rápida), y uno doble tiene 54. Una regla clave de construcción es que no pueden abrirse si tienen un bloque sólido justo encima, pero sí funcionan con bloques transparentes como cristal, losas o escaleras, lo que permite crear paredes de almacenamiento compactas."
                        2 -> "A nivel de código, es una 'Block Entity' (Tile Entity). Esto significa que tiene datos NBT complejos asociados para recordar qué items hay en cada slot, a diferencia de un bloque de piedra normal. Debido a esto, renderizar cientos de cofres puede causar lag en el cliente (FPS drop), ya que el juego dibuja la geometría del cofre individualmente. Su hitbox es ligeramente menor a un bloque completo (0.875), dejando un pequeño hueco visual en los bordes."
                        else -> ""
                    }
                }
            }

            else -> {
                tvName.text = "Objeto: $objectId"
                tvDescription.text = if (isEn) "Error 404: Object not catalogued in the museum database. Please report this artifact to technical staff for analysis." else "Error 404: Objeto no catalogado en la base de datos del museo. Por favor, reporte este artefacto al personal técnico para su análisis."
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // Limpieza de referencias SceneView
        currentModelNode = null
        nodeYaw = null
        sceneView = null
    }
}