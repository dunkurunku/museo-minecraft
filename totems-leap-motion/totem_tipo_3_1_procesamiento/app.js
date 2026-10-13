import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- DATA MAPPING & CONFIG ---
// Objeto maestro que define las reglas del juego. Relaciona el input (0-6)
// con su textura, su modelo 3D, dónde se debe procesar (horno/yunque) 
// y qué item produce como resultado.
const MATERIAL_MAP = {
    // Materias primas (Input)
    0: { id: 'tronco', img: 'img/tronco.png', workstation: 'yunque', resultIndex: 0, model3d: 'modelos/modelo_wood/wood.gltf' },
    1: { id: 'guijarro', img: 'img/piedra.png', workstation: 'yunque', resultIndex: 1, model3d: 'modelos/modelo_cobblestone/cobblestone.gltf' },
    2: { id: 'mena_hierro', img: 'img/mena_hierro.png', workstation: 'horno', resultIndex: 2, model3d: 'modelos/modelo_iron_ore/iron_ore.gltf' },
    3: { id: 'mena_oro', img: 'img/mena_oro.png', workstation: 'horno', resultIndex: 3, model3d: 'modelos/modelo_gold_ore/gold_ore.gltf' },
    4: { id: 'mena_diamante', img: 'img/mena_diamante.png', workstation: 'yunque', resultIndex: 4, model3d: 'modelos/modelo_diamond_ore/diamond_ore.gltf' },
    5: { id: 'mena_lapiz', img: 'img/mena_lapis.png', workstation: 'yunque', resultIndex: 5, model3d: 'modelos/modelo_lapis_ore/lapis_ore.gltf' },
    6: { id: 'mena_redstone', img: 'img/mena_redstone.png', workstation: 'horno', resultIndex: 6, model3d: 'modelos/modelo_redstone_ore/redstone_ore.gltf' },
    
    // Items procesados/Salida
    // Estos no tienen modelo 3D porque solo aparecen en la UI de resultado.
    p_0: { id: 'palos', img: 'img/palo.png' },
    p_1: { id: 'piedra', img: 'img/piedra_pulida.png' },
    p_2: { id: 'lingote_hierro', img: 'img/iron.png' },
    p_3: { id: 'lingote_oro', img: 'img/oro.png' },
    p_4: { id: 'diamante', img: 'img/diamante.png' },
    p_5: { id: 'lapiz', img: 'img/lapis.png' },
    p_6: { id: 'redstone', img: 'img/redstone.png' },
};

// --- ESTADO GLOBAL DE LA APP ---
let inventarioRaw = []; // Array de booleanos: qué materias primas tenemos disponibles
let inventarioProcessed = [false, false, false, false, false, false, false]; // Array de booleanos: qué hemos crafteado ya
let historialSalida = []; // Log de strings para generar el .txt final
let idleTimer; // ID del timeout para detectar inactividad
let mainArea; // Referencia al DOM del contenedor principal

// --- LEAP MOTION STATE (Variables de control gestual) ---
let grabStartTime = 0; // Timestamp para medir cuánto tiempo se mantiene el puño cerrado (para clicks)
let hasClicked = false; // Flag para evitar clicks múltiples en un solo gesto
const CLICK_DELAY = 1000; // Milisegundos que hay que mantener el puño para validar un click
const leapCursor = document.getElementById('leap-cursor'); // Referencia al div del cursor visual

// Variables para controlar la rotación de los modelos con la mano
let lastHandRoll = 0;       
let lastHandPitch = 0;
let isCurrentlyRotating = false; // Semáforo para saber si estamos en "modo rotación"

// Referencia al objeto 3D que tenemos "bloqueado" bajo el cursor para martillear
let lockedItem = null;

// Configuración de sensibilidad para el gesto del martillo
// -300 mm/s significa un movimiento rápido hacia abajo.
const HAMMER_VELOCITY_THRESHOLD = -300; 

// Registro de Escenas Three.js
// Guardamos referencias a la escena, cámara y objetos de cada estación (horno/yunque)
// para poder acceder a ellos desde fuera del loop de renderizado.
const stationScenes = {
    horno: { scene: null, camera: null, floatingItem: null, baseModel: null, spawnHeight: 0.8, isProcessing: false },
    yunque: { scene: null, camera: null, floatingItem: null, baseModel: null, spawnHeight: 0.8, isProcessing: false }
};

// --- UTILS GRÁFICOS ---
/**
 * Normaliza el tamaño de los modelos cargados.
 * Como cada GLTF puede venir con escalas distintas, esto calcula su BoundingBox
 * y lo escala para que todos tengan un tamaño visual similar (targetSize).
 * También centra el punto de pivote.
 */
function normalizeAndCenter(object, targetSize) {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = targetSize / maxDim;
    object.scale.setScalar(scaleFactor);

    // Re-centrar pivote restando el centro de la caja a la posición
    const newBox = new THREE.Box3().setFromObject(object);
    const center = new THREE.Vector3();
    newBox.getCenter(center);
    object.position.sub(center);

    return object;
}

// --- THREE.JS SETUP & BOILERPLATE ---
/**
 * Inicializa una escena 3D independiente en un canvas específico.
 * @param {string} canvasId - Selector del canvas DOM
 * @param {string} modelPath - Ruta al archivo .gltf de la estación
 * @param {string} stationId - 'horno' o 'yunque' para guardarlo en el registro
 */
function setupModelViewer(canvasId, modelPath, stationId) {
    const canvas = document.querySelector(canvasId);
    if (!canvas) return;

    const scene = new THREE.Scene();
    // Alpha true permite que el fondo del canvas sea transparente
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    const container = canvas.parentElement;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Configuración de cámara fija. No queremos que el usuario vuele por la escena.
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.01, 100);
    camera.position.set(0, 1.5, 3.5); // Perspectiva ligeramente elevada
    camera.lookAt(0, 0.5, 0);

    // Controles orbitales limitados (solo rotación, sin zoom ni pan)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Suavizado al soltar
    controls.enablePan = false;
    controls.enableZoom = false; 
    controls.minPolarAngle = 0; 
    controls.maxPolarAngle = Math.PI / 2; // Limita para no ver por debajo del suelo
    controls.target.set(0, 0.5, 0);

    // Iluminación básica
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0); 
    directionalLight.position.set(2, 5, 5);
    scene.add(directionalLight);

    // Guardamos referencias en nuestro objeto de estado global
    stationScenes[stationId].scene = scene;
    stationScenes[stationId].camera = camera;
    stationScenes[stationId].renderer = renderer;

    // Carga asíncrona del modelo base (el horno o el yunque)
    const loader = new GLTFLoader();
    loader.load(modelPath, (gltf) => {
        const model = gltf.scene;
        
        // Ajuste visual 'hardcoded': El yunque se veía muy pequeño al lado del horno,
        // así que le damos un tamaño base mayor.
        let baseSize = 1.5;
        if (stationId === 'yunque') {
            baseSize = 2.2; 
        }
        
        normalizeAndCenter(model, baseSize);

        // Usamos un Group padre como pivote para rotaciones más limpias
        const pivotGroup = new THREE.Group();
        pivotGroup.add(model);

        // Ajuste vertical manual para que "pisen" el suelo correctamente
        model.position.y = (stationId === 'yunque') ? -0.6 : -0.5; 

        stationScenes[stationId].baseModel = pivotGroup;
        
        // Calculamos dinámicamente dónde deben aparecer los items (spawnHeight)
        // basándonos en la altura de la caja del modelo base + un padding.
        const box = new THREE.Box3().setFromObject(pivotGroup);
        stationScenes[stationId].spawnHeight = (box.max.y - pivotGroup.position.y) + 0.6; 

        scene.add(pivotGroup);
    }, undefined, (e) => console.error(e));

    // --- MANEJO DE INPUT (MOUSE / TOUCH) PARA FALLBACK ---
    // Usamos Raycasting para detectar clics en objetos 3D
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let mouseDownTime = 0;

    // Diferenciar entre "arrastrar para rotar" y "hacer click"
    canvas.addEventListener('mousedown', () => { isDragging = false; mouseDownTime = Date.now(); });
    canvas.addEventListener('mousemove', () => { isDragging = true; });

    canvas.addEventListener('mouseup', (event) => {
        // Si ha pasado poco tiempo y no se ha movido el ratón, es un Click
        if (Date.now() - mouseDownTime < 200 && !isDragging) {
            const rect = canvas.getBoundingClientRect();
            // Normalizar coordenadas mouse a rango -1 a +1
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const state = stationScenes[stationId];
            
            // Comprobar si clicamos en el item flotante (para procesarlo)
            if (state.floatingItem && !state.isProcessing) {
                const intersects = raycaster.intersectObject(state.floatingItem, true);
                if (intersects.length > 0) {
                    const materialData = state.floatingItem.userData.materialData;
                    handleProcessClick(materialData);
                    return; 
                }
            }
            // Comprobar si clicamos en la estación base (para seleccionarla)
            handleStationClick(stationId);
        }
    });

    // --- RENDER LOOP LOCAL ---
    // Cada canvas tiene su propio requestAnimationFrame
    function animate() {
        requestAnimationFrame(animate);
        const state = stationScenes[stationId];
        
        // Si estamos rotando con Leap Motion, desactivamos la rotación automática idle
        const isUserControllingRotation = window.leapInput && isCurrentlyRotating;        
        
        // Animación "Idle" del item flotante (giro suave y levitación senoidal)
        if (state.floatingItem && !state.isProcessing && !isUserControllingRotation) {
            state.floatingItem.rotation.y += 0.015; 
            const baseH = state.spawnHeight || 0.8;
            state.floatingItem.position.y = baseH + Math.sin(Date.now() * 0.003) * 0.05;
        }

        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Manejo responsivo del redimensionado de ventana
    window.addEventListener('resize', () => {
        if(container.clientWidth > 0){
            renderer.setSize(container.clientWidth, container.clientHeight);
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
        }
    });
}

// --- GESTIÓN DE ITEMS EN ESCENA ---
/**
 * Carga un item (ejemplo: mena de oro) sobre la estación seleccionada.
 */
function loadFloatingItem(stationId, material) {
    
    // Cleanup de seguridad: Solo permitimos UN item activo en toda la pantalla a la vez.
    // Recorremos todas las estaciones y borramos cualquier item flotante previo.
    Object.keys(stationScenes).forEach(key => {
        const state = stationScenes[key];
        if (state.floatingItem) {
            state.floatingItem.removeFromParent();
            state.floatingItem = null;
            state.isProcessing = false;
        }
    });

    const state = stationScenes[stationId];
    if (!state || !material.model3d) return;

    const loader = new GLTFLoader();
    loader.load(material.model3d, (gltf) => {
        const mesh = gltf.scene;
        const pivotGroup = new THREE.Group();

        normalizeAndCenter(mesh, 0.6); // Tamaño estándar para todos los items
        pivotGroup.add(mesh);

        // Posicionar sobre la estación
        const spawnY = state.spawnHeight || 0.8; 
        pivotGroup.position.set(0, spawnY, 0);

        // Guardamos metadatos en el objeto 3D para recuperarlos al hacer click
        pivotGroup.userData.materialData = material;
        pivotGroup.userData.baseHeight = spawnY;

        // Añadimos el item AL MODELO BASE, no a la escena.
        // Esto hace que si rotamos el horno, la mena rote solidariamente con él.
        if (state.baseModel) {
            state.baseModel.add(pivotGroup);
        } else {
            state.scene.add(pivotGroup); // Fallback por si acaso
        }

        state.floatingItem = pivotGroup;
        state.isProcessing = false;

        console.log(`Asset loaded: ${stationId}`);
    }, undefined, (err) => console.error("Load error:", err));
}


// --- LÓGICA DE PROCESADO (Animaciones & Resultados) ---
/**
 * Se llama cuando se completa la acción (click o martillazo) sobre un item.
 * Inicia la animación de "consumo".
 */
function handleProcessClick(material) {
    const state = stationScenes[material.workstation];
    const item = state.floatingItem;

    // Evitar doble ejecución si ya se está animando
    if (!item || state.isProcessing) return;

    state.isProcessing = true;

    // Animación procedural: 
    // El item gira muy rápido, se hace pequeño y baja hacia el horno/yunque.
    const shrinkAnimation = () => {
        if (!item) return;

        const shrinkSpeed = 0.02; 
        item.scale.subScalar(shrinkSpeed); // Reducir escala
        item.rotation.y += 0.2; // Aumentar velocidad de giro
        item.position.y -= 0.005; // Bajar posición

        // Loop de animación hasta que desaparece (scale <= 0)
        if (item.scale.x > 0) {
            requestAnimationFrame(shrinkAnimation);
        } else {
            finishProcessing(material, state);
        }
    };

    shrinkAnimation();
}

/**
 * Finaliza la lógica tras la animación: actualiza inventario y UI.
 */
function finishProcessing(material, state) {
    // Eliminar el objeto 3D
    if (state.floatingItem) {
        state.floatingItem.removeFromParent();
        state.floatingItem = null;
    }
    state.isProcessing = false;

    // Actualizar datos lógicos
    const resultIndex = material.resultIndex;
    inventarioProcessed[resultIndex] = true;
    
    // Refrescar UI
    renderHotbars();
    
    // Guardar en historial para el .txt
    const resultMaterial = MATERIAL_MAP['p_' + resultIndex];
    historialSalida.push(resultMaterial.id);
    
    // Pequeño delay de UX antes de "limpiar" la selección de estación
    setTimeout(() => {
        resetAll();
    }, 200);
}

// --- MANEJADORES DE UI ---

// Actualiza visualmente las dos hotbars según los arrays de estado
function renderHotbars() {
    // Hotbar superior (Inputs)
    for (let i = 0; i < 7; i++) {
        const slot = document.getElementById(`raw-${i}`);
        if (inventarioRaw[i]) {
            slot.innerHTML = `<img src="${MATERIAL_MAP[i].img}" alt="${MATERIAL_MAP[i].id}">`;
            slot.classList.remove('faded');
        } else {
            slot.innerHTML = '';
            slot.classList.add('faded');
        }
    }
    // Hotbar inferior (Outputs)
    for (let i = 0; i < 7; i++) {
        const slot = document.getElementById(`proc-${i}`);
        if (inventarioProcessed[i]) {
            slot.innerHTML = `<img src="${MATERIAL_MAP['p_' + i].img}" alt="${MATERIAL_MAP['p_' + i].id}">`;
        } else {
            slot.innerHTML = '';
        }
    }
}

// Controla la clase .active para resaltar qué estación estamos usando
function showWorkstation(stationId) {
    document.getElementById('horno').classList.remove('active');
    document.getElementById('yunque').classList.remove('active');
    if (stationId) {
        document.getElementById(stationId).classList.add('active');
    }
}

// "Apaga" visualmente los items de la hotbar que no sirven para la estación actual
// Ejemplo: Si selecciono horno, la madera y piedra se ponen semitransparentes.
function filterHotbarUI(stationId) {
    for (let i = 0; i < 7; i++) {
        const material = MATERIAL_MAP[i];
        const hasItem = inventarioRaw[i];
        const slot = document.getElementById(`raw-${i}`);
        if (hasItem) {
            const isUsable = (material.workstation === stationId);
            if (isUsable) slot.classList.remove('faded');
            else slot.classList.add('faded');
        } 
    }
}

// Click fuera de la UI resetea la selección
function handleOutsideClick(event) {
    if (event.target === mainArea) resetAll();
}

// Lógica al seleccionar una estación (Horno o Yunque)
function handleStationClick(stationId) {
    showWorkstation(stationId);
    filterHotbarUI(stationId);
    
    // Ocultar interfaces antiguas si las hubiera
    const fUI = document.getElementById('furnace-ui');
    const aUI = document.getElementById('anvil-ui');
    if(fUI) fUI.style.display = 'none';
    if(aUI) aUI.style.display = 'none';

    // Regenerar listeners de la hotbar para los items válidos
    const hotbar = document.getElementById('hotbar-raw');
    const newHotbar = hotbar.cloneNode(true); // Clonar para limpiar listeners viejos
    hotbar.parentNode.replaceChild(newHotbar, hotbar);
    
    for (let i = 0; i < 7; i++) {
        const material = MATERIAL_MAP[i];
        // Solo añadimos evento click si el material corresponde a esta estación
        if (material.workstation === stationId && inventarioRaw[i]) {
            const slot = newHotbar.querySelector(`#raw-${i}`);
            slot.addEventListener('click', () => handleItemSelect(material));
            slot.style.cursor = "pointer";
        }
    }
    // Añadir listener para detectar click fuera y cancelar
    setTimeout(() => mainArea.addEventListener('click', handleOutsideClick), 0);
}

// Al elegir un material, cargamos su modelo flotante
function handleItemSelect(material) {
    loadFloatingItem(material.workstation, material);
}

// Vuelve al estado inicial (sin estación seleccionada)
function resetAll() {
    showWorkstation(null);
    renderHotbars();
    // Limpiar modelos 3D flotantes
    Object.values(stationScenes).forEach(state => {
        if (state.floatingItem) {
            state.floatingItem.removeFromParent();
            state.floatingItem = null;
            state.isProcessing = false;
        }
    });
    // Limpieza de listeners duplicados
    const hotbar = document.getElementById('hotbar-raw');
    const newHotbar = hotbar.cloneNode(true);
    hotbar.parentNode.replaceChild(newHotbar, hotbar);
    if (mainArea) mainArea.removeEventListener('click', handleOutsideClick);
}

// --- UTILIDADES DE IDLE Y E/S ---
function showIdleScreen() { document.getElementById('idle-screen').classList.add('visible'); }
function hideIdleScreen() { document.getElementById('idle-screen').classList.remove('visible'); }

// Reinicia el contador de inactividad (60 segundos)
function resetIdleTimer() {
    clearTimeout(idleTimer);
    hideIdleScreen();
    idleTimer = setTimeout(showIdleScreen, 60000); 
}

// Genera y descarga el archivo .txt con el historial
function descargarSalidaTxt() {
    const blob = new Blob([historialSalida.join('\n')], { type: 'text/plain' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = 'salida.txt';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
}

// --- LÓGICA CORE DE LEAP MOTION ---
/**
 * Función principal llamada en cada frame para gestionar la mano virtual.
 * Maneja el cursor, el lock-on de objetos y la detección del gesto de martillo.
 */
function updateLeapInteraction() {
    // Si no hay datos del Leap o mano visible, ocultamos cursor y salimos
    if (!window.leapInput || !window.leapInput.isHandVisible) {
        if (leapCursor) leapCursor.style.display = 'none';
        return;
    }

    // Actualizar posición del cursor visual mapeando coordenadas normalizadas del Leap a píxeles
    if (leapCursor) {
        leapCursor.style.display = 'block';
        
        const x = (window.leapInput.cursorPosition.x + 1) / 2 * window.innerWidth;
        const y = (1 - window.leapInput.cursorPosition.y) / 2 * window.innerHeight;

        leapCursor.style.left = `${x}px`;
        leapCursor.style.top = `${y}px`;

        const isGrabbing = window.leapInput.isGrabbing;

        if (isGrabbing) {
            leapCursor.classList.add('grabbing');

            // --- FASE 1: BÚSQUEDA Y LOCK-ON ---
            // Si el usuario cierra el puño pero aún no hemos fijado un objetivo (lockedItem),
            // lanzamos rayos 3D para ver si está "agarrando" un objeto procesable.
            if (!lockedItem) {
                Object.values(stationScenes).forEach(state => {
                    // Solo buscamos si hay un item flotante y no se está procesando ya
                    if (state.floatingItem && !state.isProcessing && state.scene) {
                        const canvas = state.renderer.domElement;
                        const rect = canvas.getBoundingClientRect();

                        // Verificamos si el cursor está dentro del área del canvas
                        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                            // Coordenadas normalizadas para Raycaster (-1 a +1)
                            const mouse3D = new THREE.Vector2(
                                ((x - rect.left) / rect.width) * 2 - 1,
                                -((y - rect.top) / rect.height) * 2 + 1
                            );
                            const raycaster = new THREE.Raycaster();
                            raycaster.setFromCamera(mouse3D, state.camera);
                            
                            // Check de intersección
                            const intersects = raycaster.intersectObject(state.floatingItem, true);
                            if (intersects.length > 0) {
                                // Guardamos la referencia. Ahora el usuario "tiene" el objeto.
                                lockedItem = state.floatingItem;
                            }
                        }
                    }
                });
            }

            // --- FASE 2: DETECCIÓN DEL GESTO "MARTILLO" ---
            // Si ya tenemos un lockedItem, comprobamos si el usuario hace el gesto.
            if (lockedItem) {
                // Check de seguridad por si el objeto se borró
                if(lockedItem.parent === null) {
                     lockedItem = null;
                     return;
                }

                // Obtenemos datos físicos de la mano
                const velocity = window.leapInput.palmVelocity || [0, 0, 0];
                const vx = velocity[0]; 
                const vy = velocity[1]; // Velocidad vertical (lo que nos interesa)
                const vz = velocity[2]; 
                
                const currentRoll = Math.abs(window.leapInput.handRoll);
                const isHammerPosture = currentRoll > 0.7; // Mano de canto (como sujetando un martillo)

                // Evaluamos condiciones de movimiento
                // Pedimos movimiento rápido en Y (más de 150mm/s)
                const isVerticalMove = Math.abs(vy) > 150; 
                
                // Pedimos que la dirección sea hacia abajo (negativa) y supere el umbral (-300)
                const isFastDown = vy < HAMMER_VELOCITY_THRESHOLD;

                // Debug 
                // console.log("Y:", Math.round(vy), "| Postura:", isHammerPosture, "| Vertical:", isVerticalMove, "| Fast:", isFastDown);

                // Feedback Visual en el cursor
                if (!isHammerPosture) {
                    // Si agarró el objeto pero tiene la mano plana -> Aviso naranja
                    leapCursor.style.borderColor = "#ffaa00"; 
                    leapCursor.style.transform = `translate(-50%, -50%) scale(1.0)`;
                } else {
                    // Si tiene la postura correcta -> Aviso Cian (listo para golpear)
                    leapCursor.style.borderColor = "#00ffff"; 
                    leapCursor.style.boxShadow = "0 0 15px #00ffff"; 
                    leapCursor.style.transform = `translate(-50%, -50%) scale(1.3)`;
                }

                // Ejecución del golpe
                if (isHammerPosture && isVerticalMove && isFastDown) {
                    const materialData = lockedItem.userData.materialData;
                    handleProcessClick(materialData); // Disparamos la lógica de procesado
                    
                    // Feedback visual de impacto
                    leapCursor.style.backgroundColor = "red";
                    leapCursor.style.transform = `translate(-50%, -50%) scale(1.6)`;
                    
                    // Soltamos el lock inmediatamente para no spamear golpes
                    lockedItem = null; 
                }
                
                return; // Salimos aquí para que no intente hacer un click UI normal
            }
            // -------------------------------------------------------------

            // --- FASE 3: CLICK UI ESTÁNDAR (Fallback 2D) ---
            // Si no estamos martilleando nada, usamos el gesto de agarre como un click normal
            // con un temporizador de carga (circle progress).
            if (grabStartTime === 0) {
                grabStartTime = Date.now();
            }

            const elapsedTime = Date.now() - grabStartTime;
            const progress = Math.min(elapsedTime / CLICK_DELAY, 1);
            // Animación de encogimiento del cursor
            leapCursor.style.transform = `translate(-50%, -50%) scale(${1 - (progress * 0.5)})`;
            leapCursor.style.borderColor = "white"; 

            // Si se completa el tiempo, disparamos click
            if (elapsedTime >= CLICK_DELAY && !hasClicked) {
                triggerVirtualClick(x, y); 
                hasClicked = true;
                leapCursor.style.backgroundColor = "white"; // Flash blanco
                setTimeout(() => leapCursor.style.backgroundColor = "", 200);
            }

        } else {
            // Al abrir la mano, reseteamos todo el estado
            lockedItem = null; // Olvidamos cualquier objeto lockeado
            
            leapCursor.classList.remove('grabbing');
            leapCursor.style.transform = 'translate(-50%, -50%)'; 
            leapCursor.style.borderColor = "white"; 
            leapCursor.style.boxShadow = "none";
            grabStartTime = 0;
            hasClicked = false;
        }
    }
}

/**
 * Emula un evento de click en las coordenadas X/Y dadas.
 * Sirve tanto para elementos del DOM (botones) como para el Raycasting de Three.js.
 */
function triggerVirtualClick(x, y) {
    // Click en elementos DOM (UI 2D normal)
    const element = document.elementFromPoint(x, y);
    if (element) {
        element.click();
    }

    // Interaction con Three.js (Raycasting manual)
    // Recorremos las escenas 3D para ver si el click "cae" dentro de algún canvas
    Object.values(stationScenes).forEach(state => {
        if (state.scene && state.camera && state.renderer) {
            
            const canvas = state.renderer.domElement;
            const rect = canvas.getBoundingClientRect();

            // Bound Check: Solo procesar si el cursor está sobre ESTE canvas específico
            const isInsideCanvas = 
                x >= rect.left && 
                x <= rect.right && 
                y >= rect.top && 
                y <= rect.bottom;

            if (isInsideCanvas) {
                // Map coords a -1 a +1
                const mouse3D = new THREE.Vector2();
                mouse3D.x = ((x - rect.left) / rect.width) * 2 - 1;
                mouse3D.y = -((y - rect.top) / rect.height) * 2 + 1;

                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouse3D, state.camera);

                // Check click en Item flotante
                if (state.floatingItem && !state.isProcessing) {
                    const intersects = raycaster.intersectObject(state.floatingItem, true);
                    
                    if (intersects.length > 0) {
                        const materialData = state.floatingItem.userData.materialData;
                        handleProcessClick(materialData);
                        return; // Click consumido
                    }
                }

                // Check click en Estación base
                if (state.baseModel) {
                      const intersectsBase = raycaster.intersectObject(state.baseModel, true);
                      if (intersectsBase.length > 0) {
                          const stationId = (state === stationScenes.horno) ? 'horno' : 'yunque';
                          handleStationClick(stationId);
                      }
                }
            }
        }
    });
}

/**
 * Gestiona la rotación de los modelos usando el gesto de "Victoria" (V) o similar.
 */
function handleRotationInteraction() {
    if (!window.leapInput || !window.leapInput.isHandVisible) {
        isCurrentlyRotating = false;
        return;
    }

    const currentHandRoll = window.leapInput.handRoll;
    const currentHandPitch = window.leapInput.handPitch;

    // Detectar gesto de rotación (definido en el script del LeapInput provider)
    if (window.leapInput.isRotationGesture) {
        
        // Feedback visual (cursor cyan)
        const cursor = document.getElementById('leap-cursor');
        if (cursor) {
            cursor.style.backgroundColor = "cyan";
            cursor.style.transform = "translate(-50%, -50%) scale(1.2)";
        }

        const cursorX = (window.leapInput.cursorPosition.x + 1) / 2 * window.innerWidth;
        const cursorY = (1 - window.leapInput.cursorPosition.y) / 2 * window.innerHeight;

        // Inicializar valores de referencia al empezar el gesto
        if (!isCurrentlyRotating) {
            lastHandRoll = currentHandRoll;
            lastHandPitch = currentHandPitch;
            isCurrentlyRotating = true;
        } else {
            // Calcular delta (diferencia) de movimiento
            let deltaRoll = currentHandRoll - lastHandRoll;
            let deltaPitch = currentHandPitch - lastHandPitch;
            
            // Ignorar movimientos muy pequeños para evitar tembleque (jitter)
            if (Math.abs(deltaRoll) < 0.03) deltaRoll = 0;
            if (Math.abs(deltaPitch) < 0.03) deltaPitch = 0;

            const ROTATION_SPEED = 1.2;

            // Aplicar rotación solo al modelo que esté bajo el cursor
            Object.values(stationScenes).forEach(state => {
                if (state.baseModel && state.renderer) {
                    const canvas = state.renderer.domElement;
                    const rect = canvas.getBoundingClientRect();

                    const isHovering = 
                        cursorX >= rect.left && 
                        cursorX <= rect.right && 
                        cursorY >= rect.top && 
                        cursorY <= rect.bottom;

                    if (isHovering) {
                        // Aplicamos rotación relativa a los ejes
                        state.baseModel.rotation.y += deltaRoll * ROTATION_SPEED; 
                        state.baseModel.rotation.x -= deltaPitch * ROTATION_SPEED; 
                    }
                }
            });

            // Actualizar referencia
            if (deltaRoll !== 0) lastHandRoll = currentHandRoll;
            if (deltaPitch !== 0) lastHandPitch = currentHandPitch;
        }

    } else {
        // Al dejar de hacer el gesto, reseteamos flags y estilos
        isCurrentlyRotating = false;
        
        const cursor = document.getElementById('leap-cursor');
        if (cursor && !window.leapInput.isGrabbing) {
            cursor.style.backgroundColor = ""; 
            cursor.style.transform = "translate(-50%, -50%)";
        }
    }
}

// --- MAIN LOOP ---
// Loop global que orquesta el Leap Motion y las animaciones
function globalAnimate() {
    requestAnimationFrame(globalAnimate);
    
    // Actualizar lógica de cursor y martillo
    updateLeapInteraction();

    // Actualizar lógica de rotación
    handleRotationInteraction();

    // Resetear idle timer si hay actividad de mano
    if (window.leapInput && window.leapInput.isHandVisible) resetIdleTimer();
}


// --- INICIALIZACIÓN (Entry Point) ---
async function init() {
    try {
        // Intentar cargar inventario persistente desde archivo local
        const response = await fetch('entrada.txt');
        if (response.ok) {
            const text = await response.text();
            inventarioRaw = text.split(',').map(val => val.trim().toLowerCase() === 'true');
        } else inventarioRaw = [true, true, true, true, true, true, true]; // Fallback por defecto
        
        // Rellenar array si es corto
        while (inventarioRaw.length < 7) inventarioRaw.push(false);
    } catch (e) { inventarioRaw = [true, true, true, true, true, true, true]; }

    mainArea = document.querySelector('.crafting-area');
    renderHotbars();

    // Inicializar los dos visores 3D
    setupModelViewer('#horno-canvas', 'modelos/horno.gltf', 'horno');
    setupModelViewer('#yunque-canvas', 'modelos/yunque.gltf', 'yunque');

    // Arrancar el loop global
    globalAnimate();
}

// Evento de carga del DOM
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // Listeners generales
    const saveBtn = document.getElementById('guardar-salida-btn');
    if (saveBtn) saveBtn.addEventListener('click', descargarSalidaTxt);
    
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('mousedown', resetIdleTimer);
    window.addEventListener('keypress', resetIdleTimer);
    document.getElementById('idle-screen').addEventListener('click', resetIdleTimer);
    
    // Iniciar pantalla Idle por defecto hasta que haya interacción
    showIdleScreen();

    // --- SISTEMA DE TUTORIAL (Tour guiado) ---
    // Define los pasos, IDs a resaltar y textos
    const tourSteps = [
        {
            targetId: 'hotbar-raw',
            text: "En esta Hotbar es donde encontrarás los materiales que recolectaste."
        },
        {
            targetId: 'horno', 
            text: "Pulsando sobre el Horno puedes procesar ciertos materiales. ¡Cierra el puño, agarra tu martillo ficticio y martillea el material!"
        },
        {
            targetId: 'yunque', 
            text: "Al igual que el Horno, pulsando sobre el Yunque puedes procesar otros ciertos materiales. ¡Cierra el puño, agarra tu martillo ficticio y martillea el material!"
        },
        {
            targetId: 'hotbar-processed', 
            text: "El resultado de procesar un material (ya sea Horno o Yunque) se recolectará en esta Hotbar."
        },
        {
            targetId: 'guardar-salida-btn',
            text: "Cuando termines, puedes guardar los materiales en este botón para las siguientes salas."
        }
    ];

    // Estado del tutorial
    let currentStepIndex = 0;
    
    // Referencias DOM del tutorial
    const overlay = document.getElementById('tutorial-overlay');
    const box = document.getElementById('tutorial-box');
    const textP = document.getElementById('tutorial-text');
    const nextBtn = document.getElementById('next-btn');
    const skipBtn = document.getElementById('skip-btn');
    const helpBtn = document.getElementById('help-button');

    // Función que renderiza un paso específico
    function showStep(index) {
        // Limpiar resaltados anteriores
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
            el.style.backgroundColor = ''; 
        });

        if (index >= tourSteps.length) {
            endTutorial();
            return;
        }

        const step = tourSteps[index];
        const target = document.getElementById(step.targetId);

        // Si el elemento objetivo no existe (por error), saltamos al siguiente
        if (!target) {
            console.warn("Target not found, skipping:", step.targetId);
            currentStepIndex++;
            showStep(currentStepIndex);
            return;
        }

        // Resaltar elemento y scroll automático si fuera necesario
        target.classList.add('tutorial-highlight');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        textP.innerHTML = step.text;
        box.style.opacity = '0'; // Hack para calcular posición antes de mostrar
        box.classList.remove('hidden');
        overlay.classList.remove('hidden');

        // Lógica de posicionamiento del cuadro de texto (tooltip)
        const targetRect = target.getBoundingClientRect();
        const boxRect = box.getBoundingClientRect();

        // Calcular centro horizontal con "clamp" para que no se salga de la pantalla
        let left = targetRect.left + (targetRect.width / 2) - (boxRect.width / 2);
        if (left < 10) left = 10;
        if (left + boxRect.width > window.innerWidth) left = window.innerWidth - boxRect.width - 10;

        // Decidir si poner el cuadro Arriba o Abajo según el espacio disponible
        let top;
        const spaceBelow = window.innerHeight - targetRect.bottom;

        if (spaceBelow < boxRect.height + 20) {
            top = targetRect.top - boxRect.height - 20; // Poner arriba
        } else {
            top = targetRect.bottom + 20; // Poner abajo
        }

        box.style.top = `${top}px`;
        box.style.left = `${left}px`;
        box.style.opacity = '1';

        // Gestión de botones (Finalizar vs Siguiente)
        const controlsDiv = document.querySelector('.tutorial-controls');

        if (index === tourSteps.length - 1) {
            nextBtn.innerHTML = "Finalizar";
            skipBtn.style.display = "none"; 
            controlsDiv.style.justifyContent = "center"; 
        } else {
            nextBtn.innerHTML = "Siguiente &raquo;";
            skipBtn.style.display = "inline-block"; 
            controlsDiv.style.justifyContent = "space-between"; 
        }
    }

    // Cerrar tutorial y limpiar
    function endTutorial() {
        overlay.classList.add('hidden');
        box.classList.add('hidden');
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        currentStepIndex = 0;
    }

    // Listeners de los botones del tutorial
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            currentStepIndex = 0;
            showStep(0);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentStepIndex++;
            showStep(currentStepIndex);
        });
    }

    if (skipBtn) skipBtn.addEventListener('click', endTutorial);
});