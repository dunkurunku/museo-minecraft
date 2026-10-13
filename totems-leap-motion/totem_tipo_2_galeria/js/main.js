// --- IMPORTACIONES ---
// Importamos el núcleo de Three.js y las librerías que necesitamos de los 'addons'.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as TWEEN from 'tween'; // <-- AÑADE ESTA LÍNEA

// --- IMPORTACIONES DE MÓDULOS ---
// Aquí importamos nuestras clases personalizadas.
import SceneManager from './modules/SceneManager.js';
import Carousel from './modules/Carousel.js';
import Interaction from './modules/Interaction.js';
import UI from './modules/UI.js';
import ModelLoader from './modules/ModelLoader.js';



// --- DATOS DE LOS OBJETOS DEL MUSEO ---
// Cada objeto tiene un id, nombre en varios idiomas, ruta del modelo 3D y descripciones en varios idiomas y niveles.
/*const ASSET_DATA = [

    {
        id: 'diamond-block',
        name: {
            es: 'Bloque de Diamante',
            en: 'Diamond Block'
        },
        modelPath: 'assets/models/diamond_block.glb',
        description: {
            es: {
                1: 'El bloque de diamante es uno de los más valiosos...',
                2: 'Se obtiene juntando 9 diamantes en la mesa de crafteo...',
                3: 'Fue introducido en la versión Indev 0.31...'
            },
            en: {
                1: 'The diamond block is one of the most valuable...',
                2: 'It is obtained by placing 9 diamonds in a crafting table...',
                3: 'It was introduced in Indev version 0.31...'
            }
        }
    },

    {
        id: 'diamond-block2',
        name: {
            es: 'Bloque de Diamante2',
            en: 'Diamond Block2'
        },
        modelPath: 'assets/models/diamond_block.glb',
        description: {
            es: {
                1: 'El bloque de diamante es uno de los más valiosos...',
                2: 'Se obtiene juntando 9 diamantes en la mesa de crafteo...',
                3: 'Fue introducido en la versión Indev 0.31...'
            },
            en: {
                1: 'The diamond block is one of the most valuable...',
                2: 'It is obtained by placing 9 diamonds in a crafting table...',
                3: 'It was introduced in Indev version 0.31...'
            }
        }
    },

    {
        id: 'diamond-block3',
        name: {
            es: 'Bloque de Diamante3',
            en: 'Diamond Block3'
        },
        modelPath: 'assets/models/diamond_block.glb',
        description: {
            es: {
                1: 'El bloque de diamante es uno de los más valiosos...',
                2: 'Se obtiene juntando 9 diamantes en la mesa de crafteo...',
                3: 'Fue introducido en la versión Indev 0.31...'
            },
            en: {
                1: 'The diamond block is one of the most valuable...',
                2: 'It is obtained by placing 9 diamonds in a crafting table...',
                3: 'It was introduced in Indev version 0.31...'
            }
        }
    },

    {
        id: 'diamond-block4',
        name: {
            es: 'Bloque de Diamante4',
            en: 'Diamond Block4'
        },
        modelPath: 'assets/models/diamond_block.glb',
        description: {
            es: {
                1: 'El bloque de diamante es uno de los más valiosos...',
                2: 'Se obtiene juntando 9 diamantes en la mesa de crafteo...',
                3: 'Fue introducido en la versión Indev 0.31...'
            },
            en: {
                1: 'The diamond block is one of the most valuable...',
                2: 'It is obtained by placing 9 diamonds in a crafting table...',
                3: 'It was introduced in Indev version 0.31...'
            }
        }
    },

    {
        id: 'diamond-block5',
        name: {
            es: 'Bloque de Diamante5',
            en: 'Diamond Block5'
        },
        modelPath: 'assets/models/diamond_block.glb',
        description: {
            es: {
                1: 'El bloque de diamante es uno de los más valiosos...',
                2: 'Se obtiene juntando 9 diamantes en la mesa de crafteo...',
                3: 'Fue introducido en la versión Indev 0.31...'
            },
            en: {
                1: 'The diamond block is one of the most valuable...',
                2: 'It is obtained by placing 9 diamonds in a crafting table...',
                3: 'It was introduced in Indev version 0.31...'
            }
        }
    }

    
];*/
const ASSET_DATA = [
    {
        id: 'diamond_block',
        name: {
            es: 'Bloque de Diamante',
            en: 'Diamond Block'
        },
        modelPath: 'assets/models/diamond_block.glb',
        description: {
            es: {
                1: 'Un símbolo de riqueza y poder en el mundo de Minecraft. Este bloque azul brillante es uno de los tesoros más codiciados por los jugadores, utilizado tanto para almacenamiento compacto como para demostrar estatus en construcciones y monumentos.',
                2: 'Se fabrica combinando 9 diamantes en una mesa de trabajo. Posee una alta resistencia a explosiones y requiere un pico de hierro o superior para ser minado. Es esencial para activar el poder de los faros mágicos (Beacons).',
                3: 'Fue introducido en la versión Indev 0.31 (2010). Originalmente, su textura era ligeramente diferente y ha sufrido varios cambios estéticos menores hasta llegar a la versión pulida actual.'
            },
            en: {
                1: 'A symbol of wealth and power in the Minecraft world. This bright blue block is one of the most coveted treasures by players, used both for compact storage and to demonstrate status in buildings and monuments.',
                2: 'It is crafted by combining 9 diamonds in a crafting table. It has high blast resistance and requires an iron pickaxe or better to be mined. It is essential for activating the power of Beacons.',
                3: 'It was introduced in Indev version 0.31 (2010). Originally, its texture was slightly different and has undergone several minor aesthetic changes to reach the current polished version.'
            }
        }
    },
    {
        id: 'iron_sword',
        name: {
            es: 'Espada de Hierro',
            en: 'Iron Sword'
        },
        modelPath: 'assets/models/espada_hierro.glb',
        description: {
            es: {
                1: 'El arma estándar y más confiable para la supervivencia. Representa el equilibrio perfecto entre coste y efectividad, siendo la compañera fiel de cualquier aventurero en sus primeras expediciones a las cuevas.',
                2: 'Se fabrica con 1 palo y 2 lingotes de hierro. Tiene una durabilidad de 250 usos y causa 6 puntos de daño (3 corazones) por golpe. Puede ser encantada para aumentar su letalidad o durabilidad.',
                3: 'Ha estado presente desde las primeras versiones clásicas. La mecánica de combate cambió drásticamente en la versión 1.9 (Combat Update), añadiendo un tiempo de recarga y un ataque de barrido a esta arma.'
            },
            en: {
                1: 'The standard and most reliable weapon for survival. It represents the perfect balance between cost and effectiveness, being the faithful companion of any adventurer on their first cave expeditions.',
                2: 'It is crafted with 1 stick and 2 iron ingots. It has a durability of 250 uses and deals 6 damage (3 hearts) per hit. It can be enchanted to increase its lethality or durability.',
                3: 'It has been present since the early classic versions. Combat mechanics changed drastically in version 1.9 (Combat Update), adding a cooldown time and a sweeping attack to this weapon.'
            }
        }
    },
    {
        id: 'grass_block',
        name: {
            es: 'Bloque de Hierba',
            en: 'Grass Block'
        },
        modelPath: 'assets/models/minecraft_grass_block.glb',
        description: {
            es: {
                1: 'El bloque más icónico y omnipresente del juego. Representa la superficie del mundo (Overworld), lleno de vida y posibilidades. Es la base sobre la que se construyen la mayoría de los ecosistemas.',
                2: 'La hierba se extiende a los bloques de tierra adyacentes si hay suficiente luz. Si se mina sin el encantamiento "Toque de Seda", se convierte en tierra simple. Su color cambia dinámicamente según el bioma en el que se encuentre.',
                3: 'Es el primer bloque creado por Markus Persson (Notch) para "Cave Game", el prototipo de Minecraft. Originalmente tenía hierba en todas sus caras antes de adoptar la textura lateral de tierra actual.'
            },
            en: {
                1: 'The most iconic and ubiquitous block in the game. It represents the surface of the Overworld, full of life and possibilities. It is the foundation upon which most ecosystems are built.',
                2: 'Grass spreads to adjacent dirt blocks if there is enough light. If mined without the "Silk Touch" enchantment, it turns into simple dirt. Its color changes dynamically depending on the biome it is located in.',
                3: 'It is the first block created by Markus Persson (Notch) for "Cave Game", the prototype of Minecraft. Originally it had grass on all sides before adopting the current dirt side texture.'
            }
        }
    },
    {
        id: 'steve_minecraft',
        name: {
            es: 'Steve',
            en: 'Steve'
        },
        modelPath: 'assets/models/steve.glb',
        description: {
            es: {
                1: 'El protagonista por defecto y la cara visible de la franquicia. Steve representa al jugador, un avatar silencioso capaz de alterar el mundo, construir imperios y derrotar dragones.',
                2: 'Mide exactamente 1.8 bloques de altura. Su "skin" o apariencia puede ser modificada por el usuario. Posee una capacidad de inventario de 36 casillas y puede llevar armadura completa.',
                3: 'Originalmente conocido como "Minecraft Guy". Su apariencia con camiseta cian y pantalones azules es icónica. En 2022, Mojang actualizó su textura oficial devolviéndole la barba que había perdido en actualizaciones anteriores.'
            },
            en: {
                1: 'The default protagonist and the face of the franchise. Steve represents the player, a silent avatar capable of altering the world, building empires, and defeating dragons.',
                2: 'He stands exactly 1.8 blocks tall. His "skin" or appearance can be modified by the user. He has an inventory capacity of 36 slots and can wear full armor.',
                3: 'Originally known as "Minecraft Guy". His appearance with a cyan t-shirt and blue pants is iconic. In 2022, Mojang updated his official texture, restoring the beard he had lost in previous updates.'
            }
        }
    },

    {
        id: 'iron_ore',
        name: {
            es: 'Mena de Hierro',
            en: 'Iron Ore'
        },
        modelPath: 'assets/models/minecraft_iron_ore.glb',
        description: {
            es: {
                1: 'El recurso mineral más versátil. Encontrarlo en una cueva marca el comienzo del progreso tecnológico del jugador, permitiendo el acceso a herramientas y armaduras de nivel medio.',
                2: 'Requiere un pico de piedra o superior para su extracción. Debe ser fundido en un horno para obtener lingotes. Se genera en vetas subterráneas desde el nivel del mar hasta el lecho rocoso.',
                3: 'Durante más de una década mantuvo la misma textura. En la versión 1.17 (Caves & Cliffs), su apariencia fue rediseñada para ser más accesible a personas con daltonismo y para diferenciarse de la piedra común.'
            },
            en: {
                1: 'The most versatile mineral resource. Finding it in a cave marks the beginning of the player\'s technological progress, allowing access to mid-tier tools and armor.',
                2: 'Requires a stone pickaxe or better for extraction. Must be smelted in a furnace to obtain ingots. Generates in underground veins from sea level down to bedrock.',
                3: 'For over a decade it kept the same texture. In version 1.17 (Caves & Cliffs), its appearance was redesigned to be more accessible to colorblind people and to differentiate it from common stone.'
            }
        }
    },
    {
        id: 'armor_stand',
        name: {
            es: 'Soporte para Armadura',
            en: 'Armor Stand'
        },
        modelPath: 'assets/models/armor_stand.glb',
        description: {
            es: {
                1: 'Un mueble funcional que permite exhibir conjuntos de armadura cuando no se están usando. Es muy popular entre constructores para simular estatuas o decorar salas de tesoros.',
                2: 'Técnicamente es una entidad, no un bloque, lo que significa que le afecta la gravedad y puede caer. Se fabrica con losas de piedra y palos. Mediante comandos, se le pueden añadir brazos y cambiar su postura.',
                3: 'Introducido en la versión 1.8 (The Bountiful Update). Revolucionó la creación de mapas de aventuras, ya que permitía crear escenas estáticas y NPCs falsos sin necesidad de mods.'
            },
            en: {
                1: 'A functional piece of furniture that allows armor sets to be displayed when not in use. Popular among builders to simulate statues or decorate treasure rooms.',
                2: 'Technically an entity, not a block, meaning it is affected by gravity and can fall. Crafted with stone slabs and sticks. Using commands, arms can be added and its pose changed.',
                3: 'Introduced in version 1.8 (The Bountiful Update). It revolutionized adventure map making, as it allowed creating static scenes and fake NPCs without the need for mods.'
            }
        }
    },
    {
        id: 'gold_helmet',
        name: {
            es: 'Casco de Oro',
            en: 'Gold Helmet'
        },
        modelPath: 'assets/models/gold_helmet.glb',
        description: {
            es: {
                1: 'Una pieza de armadura brillante y ostentosa. Aunque protege poco, es fundamental para explorar el Nether, ya que evita que los Piglins ataquen al jugador.',
                2: 'Ofrece 2 puntos de defensa (1 escudo en la barra). Tiene una durabilidad muy baja, pero posee la mayor "encantabilidad" del juego, permitiendo obtener mejores hechizos en la mesa de encantamientos.',
                3: 'Es parte del conjunto de armadura original. Durante años fue considerado inútil por su baja durabilidad, hasta que la actualización 1.16 le dio el uso crucial de pacificar a los habitantes del Nether.'
            },
            en: {
                1: 'A shiny and ostentatious piece of armor. Although it offers little protection, it is essential for exploring the Nether, as it prevents Piglins from attacking the player.',
                2: 'Offers 2 defense points (1 shield on the bar). Has very low durability but possesses the highest "enchantability" in the game, allowing for better spells at the enchanting table.',
                3: 'Part of the original armor set. For years it was considered useless due to its low durability, until update 1.16 gave it the crucial use of pacifying Nether inhabitants.'
            }
        }
    },
    {
        id: 'minecraft_anvil',
        name: {
            es: 'Yunque',
            en: 'Anvil'
        },
        modelPath: 'assets/models/minecraft_anvil.glb',
        description: {
            es: {
                1: 'Un bloque pesado de metal utilizado por los herreros avanzados. Permite reparar herramientas, combinar libros encantados y renombrar objetos a cambio de experiencia.',
                2: 'Fabricado con 3 bloques de hierro y 4 lingotes (31 lingotes en total). Tiene física de gravedad y puede dañar gravemente a jugadores o criaturas si les cae encima. Se deteriora con el uso.',
                3: 'Añadido en la "Pretty Scary Update" (1.4.2). Fue una adición muy solicitada que cambió el "meta" del juego, permitiendo por primera vez conservar herramientas valiosas indefinidamente.'
            },
            en: {
                1: 'A heavy metal block used by advanced smiths. Allows repairing tools, combining enchanted books, and renaming items in exchange for experience.',
                2: 'Crafted with 3 iron blocks and 4 ingots (31 total ingots). Has gravity physics and can severely damage players or mobs if it falls on them. It deteriorates with use.',
                3: 'Added in the "Pretty Scary Update" (1.4.2). It was a highly requested addition that changed the game meta, allowing valuable tools to be kept indefinitely for the first time.'
            }
        }
    },
    {
        id: 'apple',
        name: {
            es: 'Manzana',
            en: 'Apple'
        },
        modelPath: 'assets/models/apple.glb',
        description: {
            es: {
                1: 'Una fruta roja básica y saludable. Es uno de los alimentos más comunes y puede encontrarse al talar robles o comerciando con aldeanos.',
                2: 'Restaura 4 puntos de hambre (2 muslos). Es el ingrediente principal para craftear la poderosa Manzana Dorada, que otorga absorción y regeneración.',
                3: 'En las primeras versiones, las manzanas eran objetos extremadamente raros que solo soltaba Notch (el creador) al morir en el modo multijugador. Más tarde se añadieron como botín natural de los árboles.'
            },
            en: {
                1: 'A basic and healthy red fruit. It is one of the most common foods and can be found by chopping down oak trees or trading with villagers.',
                2: 'Restores 4 hunger points (2 drumsticks). It is the main ingredient for crafting the powerful Golden Apple, which grants absorption and regeneration.',
                3: 'In early versions, apples were extremely rare items only dropped by Notch (the creator) upon death in multiplayer. Later they were added as natural loot from trees.'
            }
        }
    },
    {
        id: 'bee_minecraft',
        name: {
            es: 'Abeja',
            en: 'Bee'
        },
        modelPath: 'assets/models/bee_minecraft.glb',
        description: {
            es: {
                1: 'Un mob neutral volador que habita en nidos y colmenas. Estas grandes criaturas polinizan las flores y producen miel, añadiendo vida y ambiente a los bosques.',
                2: 'Tienen 10 puntos de vida. Si se les ataca, atacan en enjambre e infligen veneno, pero mueren poco después de perder su aguijón. Aceleran el crecimiento de los cultivos al volar sobre ellos con polen.',
                3: 'Introducidas en la actualización 1.15 "Buzzy Bees" (2019). Su inclusión marcó un cambio en la dirección de diseño de Mojang, enfocándose en mobs que añaden atmósfera e interacciones ecológicas.'
            },
            en: {
                1: 'A neutral flying mob that lives in nests and hives. These large creatures pollinate flowers and produce honey, adding life and atmosphere to forests.',
                2: 'They have 10 health points. If attacked, they swarm and inflict poison, but die shortly after losing their stinger. They accelerate crop growth by flying over them with pollen.',
                3: 'Introduced in update 1.15 "Buzzy Bees" (2019). Their inclusion marked a shift in Mojang\'s design direction, focusing on mobs that add atmosphere and ecological interactions.'
            }
        }
    },
    {
        id: 'minecraft_villager',
        name: {
            es: 'Aldeano',
            en: 'Villager'
        },
        modelPath: 'assets/models/minecraft_-_villager.glb',
        description: {
            es: {
                1: 'Habitantes pacíficos de las aldeas con una nariz característica. Son fundamentales para la economía del juego, permitiendo el comercio de esmeraldas por objetos valiosos.',
                2: 'Su profesión (bibliotecario, herrero, granjero...) depende del bloque de trabajo que tengan cerca. Tienen una IA compleja que incluye ciclos de sueño, cotilleo con otros aldeanos y pánico ante zombis.',
                3: 'Llegaron en la Beta 1.9. Originalmente llamados "Testificates", eran mobs pasivos sin uso. La actualización 1.14 "Village & Pillage" transformó completamente su mecánica, dándoles ropas por bioma y niveles de comercio.'
            },
            en: {
                1: 'Peaceful inhabitants of villages with a characteristic nose. They are fundamental to the game\'s economy, allowing the trading of emeralds for valuable items.',
                2: 'Their profession (librarian, smith, farmer...) depends on the job site block near them. They have complex AI including sleep cycles, gossiping with other villagers, and panic when seeing zombies.',
                3: 'Arrived in Beta 1.9. Originally called "Testificates", they were passive mobs with no use. The 1.14 "Village & Pillage" update completely transformed their mechanics, giving them biome-specific clothes and trading levels.'
            }
        }
    },
    {
        id: 'minecraft_chest',
        name: {
            es: 'Cofre',
            en: 'Chest'
        },
        modelPath: 'assets/models/minecraft_chest.glb',
        description: {
            es: {
                1: 'El bloque de almacenamiento esencial. Permite guardar objetos para que no se pierdan al morir o para mantener el inventario organizado. Casi todas las bases comienzan con uno de estos.',
                2: 'Almacena 27 pilas de objetos. Si se colocan dos juntos, forman un "Cofre Grande" con 54 espacios. No se pueden abrir si tienen un bloque sólido encima (excepto escaleras o vidrio).',
                3: 'Uno de los bloques más antiguos. Originalmente ocupaba el tamaño de un bloque completo. Más tarde se redujo su tamaño visual y se añadió la animación de apertura que todos conocemos.'
            },
            en: {
                1: 'The essential storage block. Allows keeping items safe from death or keeping the inventory organized. Almost every base starts with one of these.',
                2: 'Stores 27 stacks of items. If two are placed together, they form a "Large Chest" with 54 slots. Cannot be opened if a solid block is placed directly above (except stairs or glass).',
                3: 'One of the oldest blocks. Originally occupied a full block size. Later its visual size was reduced, and the opening animation we all know was added.'
            }
        }
    }
];

/**
 * Clase principal de la aplicación.
 * Controla todos los demás componentes.
 */
class App {
    constructor() {
        // --- Estado inicial ---
        this.currentState = null; // 'IDLE', 'GALLERY', 'DETAIL'
        this.inactivityTimer = null;

        // Variables para el gesto de rotación/swipe
        this.isCurrentlyRotating = false;
        this.gestureStartX = 0; // Dónde empezó tu mano en X
        this.gestureStartY = 0; // Dónde empezó tu mano en Y
        this.isSwipeLocked = false; // Para evitar pasar demasiados objetos de golpe con el gesto

        // Leap Motion State
        this.grabStartTime = 0;
        this.hasClicked = false;
        this.lastHandRoll = 0;
        this.lastHandPitch = 0;
        this.isCurrentlyRotating = false;
        this.focusedObject = null;



        const canvas = document.getElementById('webgl-canvas');
        console.log("¿Se encontró el elemento canvas?", canvas);
        // --- REFERENCIAS A MÓDULOS ---
        // Aquí guardaremos las instancias de nuestras clases.
        this.ui = new UI();
        this.sceneManager = new SceneManager(document.getElementById('webgl-canvas'));
        this.modelLoader = new ModelLoader(new GLTFLoader());
        this.carousel = new Carousel();
        this.interaction = new Interaction(
            this.sceneManager.camera,
            canvas,
            this.carousel.container
        );

        // --- VINCULACION DE EVENTOS ---
        // Nos aseguramos de que 'this' se refiera a la clase App dentro de los manejadores de eventos.
        this._onIdleScreenClick = this._onIdleScreenClick.bind(this);
        this._onObjectSelected = this._onObjectSelected.bind(this);
        this._onObjectFocusChanged = this._onObjectFocusChanged.bind(this);
        this._onBackToGallery = this._onBackToGallery.bind(this);
        this._onBackToHome = this._onBackToHome.bind(this);
        this._resetInactivityTimer = this._resetInactivityTimer.bind(this);
        this._returnToIdle = this._returnToIdle.bind(this);
    }

    /**
     * Secuencia de arranque de la inicializacion
     */
    async init() {

        console.log('Iniciando la galería digital...');
        // Cargar configuración desde config.txt para determinar el modo de descripción
        try {
            const response = await fetch('config.txt');
            const configText = await response.text();
            const parts = configText.trim().split(',');

            // --- VALOR 1: MODO DE DESCRIPCIÓN (Pestañas) ---
            // (0=Todas, 1=General, 2=Técnica, 3=Historia)
            const descriptionMode = parts.length > 0 ? parseInt(parts[0], 10) : 0;

            // --- VALOR 2: IDIOMA ---
            // (0=Español, 1=Inglés)
            // Si no hay segundo valor, usamos 0 (Español) por defecto.
            const langValue = parts.length > 1 ? parseInt(parts[1], 10) : 0;
            const languageCode = langValue === 1 ? 'en' : 'es';

            console.log(`Configuración cargada -> Pestañas: ${descriptionMode}, Idioma: ${languageCode}`);

            // Aplicamos las configuraciones a la UI
            this.ui.setupDescriptionTabs(descriptionMode);
            this.ui.setLanguage(languageCode);

        } catch (error) {
            console.error("No se pudo cargar el archivo config.txt. Mostrando todas las pestañas por defecto.", error);
            // Si hay un error, le decimos a la UI que muestre todo (modo 0) en español.
            this.ui.setupDescriptionTabs(0);
            this.ui.setLanguage('es');
        }


        // Configurar los listeners de la interfaz de usuario (manejados por la clase UI)
        this.ui.addEventListener('idleScreenClick', this._onIdleScreenClick);
        this.ui.addEventListener('backButtonClick', this._onBackToGallery);
        this.ui.addEventListener('homeButtonClick', this._onBackToHome);
        this.carousel.addEventListener('focusChanged', this._onObjectFocusChanged);
        document.addEventListener('mousemove', this._resetInactivityTimer);
        document.addEventListener('mousedown', this._resetInactivityTimer);

        // Cargar todos los modelos 3D
        const models = await this.modelLoader.load(ASSET_DATA);

        // Una vez cargados, crear el carrusel
        this.carousel.create(models);
        this.sceneManager.add(this.carousel.container); // Añadimos el contenedor del carrusel a la escena
        this.interaction.setScrollBounds(this.carousel.getScrollBounds());

        // Configurar el gestor de interacciones con los objetos del carrusel
        this.interaction.setSelectableObjects(this.carousel.getObjects());
        this.interaction.addEventListener('objectSelected', this._onObjectSelected);

        // Iniciar el bucle de animación
        this._animate();

        // Establecer el estado inicial de la aplicación
        this.changeState('IDLE');
        console.log("Inspeccionando la escena final:", this.sceneManager.scene);
    }

    /**
     * Cambia el estado de la aplicación, mostrando y ocultando los elementos necesarios.
     * @param {string} newState - El nuevo estado: 'IDLE', 'GALLERY', o 'DETAIL'.
     * @param {object} [data] - Datos adicionales, como el objeto seleccionado para la vista de detalle.
     */
    changeState(newState, data) {
        if (this.currentState === newState) return;
        this.currentState = newState;
        console.log(`Cambiando a estado: ${newState}`);

        switch (newState) {
            case 'IDLE':
                // Lógica para mostrar la pantalla de descanso
                this.ui.showIdleScreen();
                this.sceneManager.hideScene(); 
                clearTimeout(this.inactivityTimer);
                break;

            case 'GALLERY':
                // Lógica para mostrar la galería
                this.ui.showGalleryView();
                this.sceneManager.showScene();
                this.carousel.enable(); // Habilita la rotación del carrusel
                this.interaction.enableCarouselMode();
                this._resetInactivityTimer();
                break;

            case 'DETAIL':
                // Lógica para mostrar la vista de detalle
                this.ui.showDetailView(data.objectData);
                this.carousel.focusOn(data.selectedObject); // Anima el carrusel para centrar el objeto
                this.interaction.enableDetailMode(data.selectedObject); // Habilita la rotación del objeto individual
                this._resetInactivityTimer();
                break;
        }
    }

    /**
     * El bucle principal de renderizado y animación.
     */
    _animate() {
        // 'requestAnimationFrame' crea un bucle que se ejecuta en cada frame.
        requestAnimationFrame(this._animate.bind(this));

        // Actualizamos los componentes que necesitan animación en cada frame
        TWEEN.update(); 
        this.carousel.update(this.sceneManager.camera);// Pasa la cámara al update del carrusel para que los objetos sepan a dónde mirar.
        this._updateLeapInteraction(); //Actualiza la lógica de Leap
        this._handleLeapRotation(); // Handle object rotation with special gesture
        this.sceneManager.render(); // Renderiza la escena 3D
    }

    /**
     * Actualiza la lógica del cursor virtual basándose en los datos del Leap Motion.
     * Maneja tres comportamientos principales:
     * 1. Posicionamiento del cursor en pantalla.
     * 2. Desplazamiento de texto al acercarse a los bordes.
     * 3. Detección de clics mediante gestos sostenidos.
     */
    _updateLeapInteraction() {
        const cursor = document.getElementById('leap-cursor');
        
        // Si no hay mano o datos, ocultar y salir
        if (!window.leapInput || !window.leapInput.isHandVisible) {
            if (cursor) cursor.style.display = 'none';
            return;
        }

        if (cursor) {
            cursor.style.display = 'block';
            
            // Calcular posición en píxeles
            const screenX = (window.leapInput.cursorPosition.x + 1) / 2 * window.innerWidth;
            const screenY = (1 - window.leapInput.cursorPosition.y) / 2 * window.innerHeight;

            cursor.style.left = `${screenX}px`;
            cursor.style.top = `${screenY}px`;

            // Lógica de scroll
            if (this.currentState === 'DETAIL' && !window.leapInput.isSpecialGesture) {
                
                // Buscamos el texto que esté visible.
                const allTexts = document.querySelectorAll('.description-text');
                const activeTextBox = Array.from(allTexts).find(el => el.offsetParent !== null);

                if (activeTextBox) {
                    const rect = activeTextBox.getBoundingClientRect();

                    // Comprobamos si el cursor está dentro del área del cuadro de texto
                    if (screenX >= rect.left && screenX <= rect.right &&
                        screenY >= rect.top && screenY <= rect.bottom) {

                        // Cálculo de zonas de activación
                        const relativeY = screenY - rect.top;
                        const height = rect.height;
                        const percentage = relativeY / height;

                        const SCROLL_SPEED = 8; // Velocidad de scroll

                        // ZONA SUPERIOR (Top 20%) -> SUBIR
                        if (percentage < 0.20) {
                            activeTextBox.scrollTop -= SCROLL_SPEED;
                            cursor.classList.add('scrolling-up');
                            cursor.classList.remove('scrolling-down');
                        }
                        // ZONA INFERIOR (Bottom 20%) -> BAJAR
                        else if (percentage > 0.80) {
                            activeTextBox.scrollTop += SCROLL_SPEED;
                            cursor.classList.add('scrolling-down');
                            cursor.classList.remove('scrolling-up');
                        } 
                        // ZONA CENTRAL (Lectura) -> QUIETO
                        else {
                            cursor.classList.remove('scrolling-up', 'scrolling-down');
                        }
                    } else {
                        // Si salimos de la caja, quitamos las flechas
                        cursor.classList.remove('scrolling-up', 'scrolling-down');
                    }
                }
            } else {
                // Si cambiamos de estado o hacemos gesto especial, limpiar clases
                cursor.classList.remove('scrolling-up', 'scrolling-down');
            }

            // Lógica de clic mediante gesto de agarre sostenido
            if (window.leapInput.isGrabbing) {
                cursor.classList.add('grabbing');
                cursor.classList.remove('special-gesture');
                cursor.classList.remove('scrolling-up', 'scrolling-down'); // Prioridad al click

                //Inicio cronómetro
                if (this.grabStartTime === 0) {
                    this.grabStartTime = Date.now();
                }

                const elapsedTime = Date.now() - this.grabStartTime;
                const CLICK_DELAY = 1000;

                //Feedback de progreso
                const progress = Math.min(elapsedTime / CLICK_DELAY, 1);
                cursor.style.transform = `translate(-50%, -50%) scale(${1 - (progress * 0.5)})`;

                // Ejecución del Clic
                if (elapsedTime >= CLICK_DELAY && !this.hasClicked) {
                    this._triggerVirtualClick(screenX, screenY);
                    this.hasClicked = true;

                    // Feedback visual de éxito
                    const originalColor = cursor.style.backgroundColor;
                    cursor.style.backgroundColor = "white";
                    setTimeout(() => cursor.style.backgroundColor = "", 200);
                }

            } else {
                this.grabStartTime = 0;
                this.hasClicked = false;
                cursor.classList.remove('grabbing');

                // Lógica visual del gesto especial
                if (window.leapInput.isSpecialGesture) {
                    cursor.classList.add('special-gesture');
                    cursor.style.transform = 'translate(-50%, -50%) scale(1.2)';
                } else {
                    cursor.classList.remove('special-gesture');
                    cursor.style.transform = 'translate(-50%, -50%)';
                }
            }

            // Resetear timer de inactividad
            this._resetInactivityTimer();
        }
    }

    /**
     * Generador de eventos sintéticos.
     * Simula un ciclo completo de clic de ratón (Down -> Up -> Click) en las coordenadas dadas.
     * Esto es necesario porque el Leap Motion no genera eventos nativos del DOM.
     */
    _triggerVirtualClick(x, y) {
        const element = document.elementFromPoint(x, y);
        if (element) {
            console.log("Leap Click on:", element);

            // Dispatch mousedown
            const downEvent = new MouseEvent('mousedown', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y
            });
            element.dispatchEvent(downEvent);

            // Dispatch mouseup
            const upEvent = new MouseEvent('mouseup', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y
            });
            element.dispatchEvent(upEvent);

            // Dispatch click
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y
            });
            element.dispatchEvent(clickEvent);
        }
    }

   _handleLeapRotation() {
        // Seguridad
        if (!window.leapInput || !window.leapInput.isHandVisible) {
            this.isCurrentlyRotating = false;
            this.isSwipeLocked = false;
            return;
        }

        // Si el gesto del pulgar está activo
        if (window.leapInput.isSpecialGesture) {
            const currentX = window.leapInput.cursorPosition.x;
            const currentY = window.leapInput.cursorPosition.y;

            // --- INICIO DEL GESTO ---
            if (!this.isCurrentlyRotating) {
                // Guardamos el "Centro" virtual donde empezó el gesto
                this.gestureStartX = currentX; 
                this.gestureStartY = currentY;
                this.lastHandX = currentX;
                this.lastHandY = currentY;
                this.isCurrentlyRotating = true;
                this.isSwipeLocked = false; 
            } 
            
            // --- DURANTE EL GESTO ---
            else {
                // Delta TOTAL desde el origen del gesto
                const totalDeltaX = currentX - this.gestureStartX;
                
                // Delta FRAME a FRAME (solo para rotación de detalle)
                const frameDeltaX = currentX - this.lastHandX;
                const frameDeltaY = currentY - this.lastHandY;

                //Vista de detalle, rotación libre
                if (this.currentState === 'DETAIL' && this.focusedObject) {
                    const SENSITIVITY = 4.0;
                    this.focusedObject.rotation.y -= frameDeltaX * SENSITIVITY;
                    this.focusedObject.rotation.x -= frameDeltaY * SENSITIVITY;
                } 

                // Vista de galería, scrollear carrusel 
                else if (this.currentState === 'GALLERY') {
                    
                    // UMBRALES
                    const TRIGGER_DIST = 0.20; // Cuánto hay que mover para disparar
                    const RESET_DIST = 0.10;   // Cuánto hay que acercarse al centro para recargar

                    // Si el sistema está bloqueado (ya se hizo un swipe), esperamos a que
                    // el usuario devuelva la mano al centro para desbloquear.
                    if (this.isSwipeLocked) {
                        // Si la distancia al origen es menor que el umbral de reset se desbloquea para continuar
                        if (Math.abs(totalDeltaX) < RESET_DIST) {
                            this.isSwipeLocked = false; 
                            console.log("Posición reseteada. Listo para nuevo swipe.");
                        }
                    }
                    
                    // 2. Si estamos listos para swipe.
                    // Esperamos a que el usuario supere la distancia de disparo.
                    else {
                        if (Math.abs(totalDeltaX) > TRIGGER_DIST) {
                            
                            // Cambio de objeto
                            const SPACING = 10.0; 
                            const startX = this.carousel.getScrollBounds().max;
                            const currentPos = this.carousel.container.position.x;
                            
                            // Izquierda (< 0) = Siguiente. Derecha (> 0) = Anterior.
                            const direction = totalDeltaX < 0 ? 1 : -1;

                            //Aseguramos que el índice esté dentro de los límites
                            let currentIndex = Math.round((startX - currentPos) / SPACING);
                            let targetIndex = currentIndex + direction;
                            const maxIndex = this.carousel.getObjects().length - 1;
                            targetIndex = Math.max(0, Math.min(maxIndex, targetIndex));

                            //Transición suave al nuevo objeto
                            if (targetIndex !== currentIndex) {
                                console.log(`Swipe disparado! Indice: ${targetIndex}`);

                                const targetX = startX - (targetIndex * SPACING);
                                new TWEEN.Tween(this.carousel.container.position)
                                    .to({ x: targetX }, 500)
                                    .easing(TWEEN.Easing.Quadratic.Out)
                                    .start();

                                // BLOQUEAMOS INMEDIATAMENTE
                                // El usuario tiene que volver al centro (if de arriba) para poder hacer otro.
                                this.isSwipeLocked = true;
                            }
                        }
                    }
                }
                
                // Actualizamos referencias
                this.lastHandX = currentX;
                this.lastHandY = currentY;
            }
        } else {
            // Al soltar el gesto
            this.isCurrentlyRotating = false;
            this.isSwipeLocked = false;
        }
    }

    // --- MANEJADORES DE EVENTOS ---

    /**
     * Manejador del evento de cambio de foco en el carrusel.
     * Su función principal es calcular la posición 2D en pantalla donde debe
     * aparecer la etiqueta de texto para que coincida con el objeto 3D.
     */
    _onObjectFocusChanged(event) {
        const { focusedObject, index } = event.detail;
        this.focusedObject = focusedObject; 
        this.interaction.setFocusedObject(focusedObject);

        if (focusedObject) {
            const objectData = ASSET_DATA[index];
            const lang = this.ui.currentLang || 'es';

            //Obtencion de coordenadas 3D
            const worldPosition = new THREE.Vector3();
            focusedObject.getWorldPosition(worldPosition);

            worldPosition.y -= 6; // Ajuste de anclaje vertical
            worldPosition.x -= 0.5;

            const screenPosition = worldPosition.project(this.sceneManager.camera);

            // Transformamos el rango -1/+1 al tamaño real del canvas en píxeles
            const x = (screenPosition.x * 0.5 + 0.5) * this.sceneManager.canvas.clientWidth;
            const y = (screenPosition.y * -0.5 + 0.5) * this.sceneManager.canvas.clientHeight;
            // Enviamos las coordenadas calculadas a la UI
            this.ui.updateObjectLabel(objectData.name[lang], { x, y });
        } else {
            this.ui.updateObjectLabel(null, null);
        }
    }

    /**
     * Manejador del evento de clic en la pantalla de inactividad.
     * Cambia el estado de la aplicación a la vista de galería.
     */
    _onIdleScreenClick() {
        this.changeState('GALLERY');
    }

    /**
     * Manejador del evento de selección de un objeto en la galería.
     * Cambia el estado de la aplicación a la vista de detalle para el objeto seleccionado.
     */
    _onObjectSelected(event) {
        const selectedObject = event.detail.object;
        const objectData = ASSET_DATA.find(asset => asset.id === selectedObject.name);

        if (objectData) {
            this.changeState('DETAIL', { selectedObject, objectData });
        } else {
            console.error("No se encontraron datos para el objeto seleccionado:", selectedObject.name);
        }
    }

    /**
     * Manejador del evento de volver a la galería desde la vista de detalle.
     * Cambia el estado de la aplicación a la vista de galería.
     */
    _onBackToGallery() {
        this.changeState('GALLERY');
    }

    /**
     * Manejador del evento de volver a la pantalla de inicio desde la galería.
     * Cambia el estado de la aplicación a la vista de inicio.
     */
    _onBackToHome() {
        this.changeState('IDLE');
    }

    /**
     * Reinicia el temporizador de inactividad.
     * Si ya estamos en la pantalla idle, no hace nada.
     */
    _resetInactivityTimer() {
        // Si ya estamos en la pantalla idle, no hacemos nada.
        if (this.currentState === 'IDLE') return;

        //  Limpiamos cualquier temporizador que ya estuviera corriendo.
        clearTimeout(this.inactivityTimer);

        // Creamos un nuevo temporizador que llamará a la función _returnToIdle
        // después de 60,000 milisegundos (1 minuto).
        const timeToAction = 60 * 1000;
        this.inactivityTimer = setTimeout(this._returnToIdle, timeToAction);
    }

    /**
     * Función llamada cuando se detecta inactividad.
     * Cambia el estado de la aplicación a la pantalla de inicio.
     */
    _returnToIdle() {
        console.log("Inactividad detectada. Volviendo a la pantalla de inicio.");
        this.changeState('IDLE');
    }
}

// --- PUNTO DE ENTRADA ---
// Creamos una instancia de nuestra aplicación y la inicializamos cuando la página ha cargado.
window.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
