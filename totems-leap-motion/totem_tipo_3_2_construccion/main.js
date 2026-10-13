// Importación de la librería principal de Three.js.
import * as THREE from 'three';
// Importación del cargador para modelos en formato glTF.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// Importación de los controles de cámara orbitales.
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// Creación de la escena principal que contendrá todos los objetos 3D.
const scene = new THREE.Scene();

// Creación del renderizador WebGL, responsable de dibujar la escena en el canvas.
// 'antialias' suaviza los bordes de los objetos.
// 'alpha: true' hace que el fondo del canvas sea transparente.
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

// Se obtiene una referencia al contenedor principal del DOM.
const appContainer = document.getElementById('app-container');

// Se establece el tamaño de renderizado interno a una resolución fija de 1080x1920.
renderer.setSize(1080, 1920);

// Se añade el elemento canvas generado por el renderizador al contenedor principal en el HTML.
appContainer.appendChild(renderer.domElement);

// Creación de la cámara de perspectiva que define el punto de vista de la escena.
const camera = new THREE.PerspectiveCamera(75, 1080 / 1920, 0.1, 1000);
// Se establece la posición inicial de la cámara en el espacio 3D.
camera.position.set(4, 5, 6);
// Se añade la cámara a la escena.
scene.add(camera);

// Creación de los controles orbitales, vinculándolos a la cámara y al canvas.
const controls = new OrbitControls(camera, renderer.domElement);
// Se activa un efecto de inercia para un movimiento más suave.
controls.enableDamping = true;
// Se define la intensidad de la inercia.
controls.dampingFactor = 0.05;
// Se establece el punto del espacio 3D sobre el cual orbitará la cámara.
controls.target.set(1, 1, 0);

// Se añade una luz ambiental para iluminar toda la escena de forma uniforme.
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// Se añade una luz direccional para generar sombras y dar volumen a los objetos.
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Se obtienen referencias a todos los elementos de la interfaz de usuario del DOM.
const materialsHotbar = document.getElementById('materials-hotbar');
const sticksHotbar = document.getElementById('sticks-hotbar');
const pieceSelector = document.getElementById('piece-selector');
const piecesHotbar = document.getElementById('pieces-hotbar');
const splashScreen = document.getElementById('splash-screen');
const feedbackBox = document.getElementById('feedback-box');
const helpText = document.getElementById('help-text');


// Banderas de estado para detectar el inicio de un gesto en un solo frame.
let wasGrabbingLastFrame = false;
let wasCustomGestureLastFrame = false;
let wasRotatingLastFrame = false;

// Se crea el objeto del cursor 3D.
const cursor = createCursor();
// Se añade el cursor a la escena.
scene.add(cursor);

// Vector 2D para almacenar la posición de la mano en el frame anterior durante el arrastre.
const prevLeapDragPos = new THREE.Vector2();


// Construye el objeto 3D que se usará como cursor.
function createCursor() {
    // Se usa un grupo para tratar las dos barras de la cruz como un solo objeto.
    const cursorGroup = new THREE.Group();
    // Se usa un material básico que no se ve afectado por las luces.
    // 'depthTest: false' asegura que el cursor siempre se renderice por encima de otros objetos.
    const cursorMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false });
    // Se definen las geometrías de las barras horizontal y vertical.
    const horizGeom = new THREE.BoxGeometry(0.25, 0.03, 0.03);
    const vertGeom = new THREE.BoxGeometry(0.03, 0.25, 0.03);
    // Se crean los objetos 'Mesh' a partir de la geometría y el material.
    const horizBar = new THREE.Mesh(horizGeom, cursorMaterial);
    const vertBar = new THREE.Mesh(vertGeom, cursorMaterial);
    // Se añaden las barras al grupo.
    cursorGroup.add(horizBar, vertBar);
    // El cursor es invisible por defecto.
    cursorGroup.visible = false;
    // Se establece una prioridad de renderizado alta para asegurar que se dibuje al final.
    cursorGroup.renderOrder = 999;
    return cursorGroup;
}

// Actualiza la posición del cursor 3D en cada fotograma.
function updateCursor() {
    // Solo se ejecuta si hay una mano visible detectada por el traductor.
    if (window.leapInput && window.leapInput.isHandVisible) {
        // Se hace visible el cursor.
        cursor.visible = true;
        // Se obtiene la posición del punto focal de la cámara.
        const targetPosition = controls.target;
        // Se crea un rayo que se origina en la cámara y pasa por la posición 2D de la mano.
        const raycaster = new THREE.Raycaster();
        const pointerVector = new THREE.Vector2(window.leapInput.cursorPosition.x, window.leapInput.cursorPosition.y);
        raycaster.setFromCamera(pointerVector, camera);
        // Se define un plano virtual que pasa por el punto focal y está orientado hacia la cámara.
        const planeNormal = camera.position.clone().sub(targetPosition).normalize();
        const plane = new THREE.Plane(planeNormal, -planeNormal.dot(targetPosition));
        // Se calcula el punto donde el rayo intersecta con este plano.
        const intersectionPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersectionPoint);
        // Si se encuentra una intersección, se actualiza la posición del cursor 3D.
        if (intersectionPoint) {
            cursor.position.copy(intersectionPoint);
        }
    } else {
        // Si no hay mano, el cursor se oculta.
        cursor.visible = false;
    }
}

// Detecta el inicio de los gestos del Leap y despacha eventos personalizados.
function dispatchLeapEvents() {
    // Se comprueba si el objeto del traductor está disponible.
    if (!window.leapInput) return;
    
    // Lógica para el evento de clic (pellizco).
    const isGrabbingNow = window.leapInput.isGrabbing;
    // Se dispara el evento solo en el primer fotograma que se detecta el gesto.
    if (isGrabbingNow && !wasGrabbingLastFrame) {
        // Se obtiene el elemento de la UI que está bajo el cursor.
        let clickedElement = getElementUnderCursor();
        // Se crea y despacha un evento personalizado con el elemento como dato.
        const clickEvent = new CustomEvent('leap-click', { detail: { clickedElement } });
        window.dispatchEvent(clickEvent);
    }
    
    // Lógica para el evento de gesto especial (craftear).
    const isGestureNow = window.leapInput.isCustomGestureActive;
    // Se dispara el evento solo en el primer fotograma que se detecta el gesto.
    if (isGestureNow && !wasCustomGestureLastFrame) {
        const gestureEvent = new CustomEvent('leap-gesture-special');
        window.dispatchEvent(gestureEvent);
    }
    
    // Se actualizan las banderas de estado para el siguiente fotograma.
    wasGrabbingLastFrame = isGrabbingNow;
    wasCustomGestureLastFrame = isGestureNow;
}

// Devuelve el elemento de la interfaz de usuario que se encuentra bajo el cursor del Leap.
function getElementUnderCursor() {
    if (!window.leapInput || !window.leapInput.isHandVisible) return null;
    
    // Se obtiene el rectángulo del contenedor de la aplicación, que puede estar escalado.
    const appRect = appContainer.getBoundingClientRect();
    // Se convierten las coordenadas normalizadas del Leap a coordenadas de píxeles en la pantalla.
    const cursorScreenX = appRect.left + (window.leapInput.cursorPosition.x * 0.5 + 0.5) * appRect.width;
    const cursorScreenY = appRect.top + (-window.leapInput.cursorPosition.y * 0.5 + 0.5) * appRect.height;
    
    // Se usa 'elementsFromPoint' para obtener una lista de todos los elementos en esa coordenada.
    const elements = document.elementsFromPoint(cursorScreenX, cursorScreenY);
    // Se devuelve el primer elemento de la lista que tenga la clase 'item', indicando que es interactivo.
    return elements.find(el => el.classList.contains('item'));
}

// Gestiona el escalado del contenedor principal para que se ajuste a la ventana.
function handleScaling() {
    const targetWidth = 1080;
    const targetHeight = 1920;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    // Se calcula el factor de escala más pequeño para asegurar que todo el contenedor sea visible.
    const scale = Math.min(windowWidth / targetWidth, windowHeight / targetHeight);
    // Se aplica la transformación de escala mediante CSS.
    if (appContainer) {
        appContainer.style.transform = `scale(${scale})`;
    }
}


// Definición de las estructuras de datos de la aplicación.
const MATERIALS = { iron: { name: 'Hierro', img: 'images/material_iron.png' }, gold: { name: 'Oro', img: 'images/material_gold.png' }, diamond: { name: 'Diamante', img: 'images/material_diamond.png' } };
const STICKS = { name: 'Palos', required: 2, img: 'images/resource_sticks.png' };
const PIECE_TYPES = {
    sword: { 
        name: 'Espada', 
        img: 'images/piece_sword.png', 
        // Se definen escalas individuales para cada material de la espada.
        scales: {
            iron: 30,
            gold: 0.05,
            diamond: 0.7
        }, 
        recipe: { pattern: [[0,'M',0],[0,'M',0],[0,'S',0]], sticks: STICKS.required }, 
        models: { iron: 'models/swords/sword_iron.glb', gold: 'models/swords/sword_gold.glb', diamond: 'models/swords/sword_diamond.glb' }, 
        inventoryIcons: { iron: 'images/inventory/sword_iron.png', gold: 'images/inventory/sword_gold.png', diamond: 'images/inventory/sword_diamond.png' } 
    },
    pickaxe: { 
        name: 'Pico', 
        img: 'images/piece_pickaxe.png', 
        // Se definen escalas individuales para cada material del pico.
        scales: {
            iron: 1,
            gold: 1,
            diamond: 0.05
        }, 
        recipe: { pattern: [['M','M','M'],[0,'S',0],[0,'S',0]], sticks: STICKS.required }, 
        models: { iron: 'models/pickaxes/pickaxe_iron.glb', gold: 'models/pickaxes/pickaxe_gold.glb', diamond: 'models/pickaxes/pickaxe_diamond.glb' }, 
        inventoryIcons: { iron: 'images/inventory/pickaxe_iron.png', gold: 'images/inventory/pickaxe_gold.png', diamond: 'images/inventory/pickaxe_diamond.png' } 
    },
    // Para las armaduras se mantiene una única propiedad 'scale' ya que no se necesita diferenciación.
    helmet: { name: 'Casco', img: 'images/piece_helmet.png', scale: 1, recipe: { pattern: [['M','M','M'],['M',0,'M'],[0,0,0]] }, models: { iron: 'models/helmets/helmet_iron.glb', gold: 'models/helmets/helmet_gold.glb', diamond: 'models/helmets/helmet_diamond.glb' }, inventoryIcons: { iron: 'images/inventory/helmet_iron.png', gold: 'images/inventory/helmet_gold.png', diamond: 'images/inventory/helmet_diamond.png' } },
    chestplate: { name: 'Pechera', img: 'images/piece_chestplate.png', scale: 1, recipe: { pattern: [['M',0,'M'],['M','M','M'],['M','M','M']] }, models: { iron: 'models/chestplates/chestplate_iron.glb', gold: 'models/chestplates/chestplate_gold.glb', diamond: 'models/chestplates/chestplate_diamond.glb' }, inventoryIcons: { iron: 'images/inventory/chestplate_iron.png', gold: 'images/inventory/chestplate_gold.png', diamond: 'images/inventory/chestplate_diamond.png' } },
    pants: { name: 'Pantalones', img: 'images/piece_pants.png', scale: 1, recipe: { pattern: [['M','M','M'],['M',0,'M'],['M',0,'M']] }, models: { iron: 'models/pants/pants_iron.glb', gold: 'models/pants/pants_gold.glb', diamond: 'models/pants/pants_diamond.glb' }, inventoryIcons: { iron: 'images/inventory/pants_iron.png', gold: 'images/inventory/pants_gold.png', diamond: 'images/inventory/pants_diamond.png' } },
    boots: { name: 'Botas', img: 'images/piece_boots.png', scale: 1, recipe: { pattern: [[0,0,0],['M',0,'M'],['M',0,'M']] }, models: { iron: 'models/boots/boots_iron.glb', gold: 'models/boots/boots_gold.glb', diamond: 'models/boots/boots_diamond.glb' }, inventoryIcons: { iron: 'images/inventory/boots_iron.png', gold: 'images/inventory/boots_gold.png', diamond: 'images/inventory/boots_diamond.png' } }
};
const PIECE_ORDER = ['sword', 'pickaxe', 'helmet', 'chestplate', 'pants', 'boots'];

// Variables de estado de la aplicación.
let inventory;
let selectedPieceType;
let selectedMaterial;
const availableMaterials = new Set();

// Instancias de los cargadores de Three.js.
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

// Variables para los modelos 3D.
let craftingTableModel = null;
const masterTableGroup = new THREE.Group();
masterTableGroup.position.x = 1.0;
scene.add(masterTableGroup);
controls.target.set(masterTableGroup.position.x, 1, 0);
const recipePatternGroup = new THREE.Group();
masterTableGroup.add(recipePatternGroup);
const previewModelGroup = new THREE.Group();
masterTableGroup.add(previewModelGroup);
let currentPreviewModel = null;

// Coordenadas para posicionar los items de la receta en la mesa 3D.
const GRID_POSITIONS = [ { x: -0.65, y: 1.251, z: -0.65 }, { x: 0.0, y: 1.251, z: -0.65 }, { x: 0.65, y: 1.251, z: -0.65 }, { x: -0.65, y: 1.251, z: 0.0 }, { x: 0.0, y: 1.251, z: 0.0 }, { x: 0.65, y: 1.251, z: 0.0 }, { x: -0.65, y: 1.251, z: 0.65 }, { x: 0.0, y: 1.251, z: 0.65 }, { x: 0.65, y: 1.251, z: 0.65 } ];

// Temporizador para los mensajes de feedback.
let feedbackTimer;

// Funciones de la lógica de la aplicación.
function showError(technicalError) { const userMessage = "Ha ocurrido un error, avise a un operario del museo para que pueda ayudarle. Disculpe las molestias."; alert(`${userMessage}\n\n--- Información para el operario ---\n${technicalError}`); }
function showFeedbackMessage(message) { clearTimeout(feedbackTimer); feedbackBox.textContent = message; feedbackBox.classList.add('visible'); feedbackTimer = setTimeout(() => { feedbackBox.classList.remove('visible'); }, 3500); }
function updateHelpText() { const selectMessage = "Mueve una mano para desplazar el cursor. Para seleccionar una pieza o material pellizca cuando el cursor esté encima."; const craftMessage = "Cierra el puño y extiende el pulgar para construir 👍."; if (selectedPieceType && selectedMaterial) { helpText.textContent = craftMessage; } else { helpText.textContent = selectMessage; } }
function populateUI() {
    materialsHotbar.innerHTML = ''; sticksHotbar.innerHTML = '';
    for (const key in MATERIALS) {
        const item = document.createElement('div'); item.className = 'item'; item.dataset.material = key; item.style.backgroundImage = `url(${MATERIALS[key].img})`; if (!availableMaterials.has(key)) { item.classList.add('disabled'); }
        materialsHotbar.appendChild(item);
        item.addEventListener('click', () => { if (!availableMaterials.has(key)) { showFeedbackMessage(`No dispones de ${MATERIALS[key].name}, prueba a visitar el tótem de procesamiento de material para obtenerlo.`); return; } const recipe = selectedPieceType ? PIECE_TYPES[selectedPieceType].recipe : null; if (recipe && recipe.sticks && !availableMaterials.has('sticks')) { showFeedbackMessage('No dispones de Palos, prueba a visitar el tótem de procesamiento de material para obtenerlos.'); return; } selectedMaterial = key; document.querySelectorAll('#materials-hotbar .item').forEach(el => el.classList.remove('selected')); item.classList.add('selected'); updateVisualization(); updateHelpText(); });
    }
    const sticksSlot = document.createElement('div'); sticksSlot.className = 'item'; sticksSlot.style.backgroundImage = `url(${STICKS.img})`; sticksSlot.title = 'Palos'; if (!availableMaterials.has('sticks')) { sticksSlot.classList.add('disabled'); }
    sticksHotbar.appendChild(sticksSlot);
    PIECE_ORDER.forEach(key => { const pieceData = PIECE_TYPES[key]; const item = document.createElement('div'); item.className = 'item'; item.dataset.piece = key; item.style.backgroundImage = `url(${pieceData.img})`; pieceSelector.appendChild(item); item.addEventListener('click', () => { if (selectedMaterial && pieceData.recipe.sticks) { if (!availableMaterials.has('sticks')) { showFeedbackMessage('No dispones de Palos, prueba a visitar el tótem de procesamiento de material para obtenerlos.'); return; } } selectedPieceType = key; document.querySelectorAll('#piece-selector .item').forEach(el => el.classList.remove('selected')); item.classList.add('selected'); updateVisualization(); updateHelpText(); }); });
}
function updatePiecesHotbar() { piecesHotbar.innerHTML = ''; PIECE_ORDER.forEach(key => { const item = document.createElement('div'); item.className = 'item'; const inventoryItem = inventory[key]; if (inventoryItem) { const pieceData = PIECE_TYPES[inventoryItem.type]; const materialKey = inventoryItem.material; const specificIconPath = pieceData.inventoryIcons[materialKey]; item.style.backgroundImage = `url(${specificIconPath || pieceData.img})`; } else { item.style.backgroundColor = 'rgba(0,0,0,0.2)'; item.style.borderColor = '#444'; } piecesHotbar.appendChild(item); }); }
function updateVisualization() { recipePatternGroup.clear(); previewModelGroup.clear(); currentPreviewModel = null; if (!selectedPieceType || !selectedMaterial) return; displayRecipePattern(selectedPieceType, selectedMaterial); displayPreviewModel(selectedPieceType, selectedMaterial); }
function displayRecipePattern(pieceKey, materialKey) { const recipe = PIECE_TYPES[pieceKey].recipe.pattern; const materialTexture = textureLoader.load(MATERIALS[materialKey].img); const stickTexture = textureLoader.load(STICKS.img); const itemGeometry = new THREE.PlaneGeometry(0.7, 0.7); let gridIndex = 0; for (let row = 0; row < 3; row++) { for (let col = 0; col < 3; col++) { const itemType = recipe[row][col]; if (itemType !== 0) { let itemMaterial = (itemType === 'M') ? new THREE.MeshBasicMaterial({ map: materialTexture, transparent: true }) : new THREE.MeshBasicMaterial({ map: stickTexture, transparent: true }); const itemMesh = new THREE.Mesh(itemGeometry, itemMaterial); const pos = GRID_POSITIONS[gridIndex]; itemMesh.position.set(pos.x, pos.y, pos.z); itemMesh.rotation.x = -Math.PI / 2; recipePatternGroup.add(itemMesh); } gridIndex++; } } }

// Carga y muestra el modelo 3D del objeto final, flotando sobre la receta.
function displayPreviewModel(pieceKey, materialKey) {
    const pieceData = PIECE_TYPES[pieceKey];
    const modelPath = pieceData.models[materialKey];
    if (!modelPath) return;

    gltfLoader.load(modelPath, (gltf) => {
        const model = gltf.scene;

        // Se establece un valor de escala por defecto.
        let scale = 1.0;
        
        // Se comprueba si existe el objeto 'scales' y una entrada para el material actual.
        if (pieceData.scales && pieceData.scales[materialKey]) {
            // Si existe, se usa la escala específica.
            scale = pieceData.scales[materialKey];
        } else if (pieceData.scale) {
            // Si no, se busca una propiedad 'scale' genérica como alternativa.
            scale = pieceData.scale;
        }

        // Se aplica la escala calculada al modelo.
        model.scale.set(scale, scale, scale);
        model.position.set(0, 2.0, 0);
        previewModelGroup.add(model);
        currentPreviewModel = model;
    }, undefined, (error) => {
        showError(`No se pudo cargar el modelo de preview: ${modelPath}`);
    });
}

// Carga el modelo 3D principal de la mesa de crafteo.
function loadCraftingTableModel() { gltfLoader.load('models/crafting_table.glb', function (gltf) { craftingTableModel = gltf.scene; craftingTableModel.scale.set(2.5, 2.5, 2.5); craftingTableModel.position.set(0, 0, 0); masterTableGroup.add(craftingTableModel); }, undefined, function (error) { showError('No se pudo cargar el modelo de la mesa de crafteo.'); }); }

// Variables y funciones para la gestión de la sesión.
let isSessionActive = false;
let inactivityTimer;
function resetSession() { inventory = { sword: null, pickaxe: null, helmet: null, chestplate: null, pants: null, boots: null }; selectedPieceType = null; selectedMaterial = null; document.querySelectorAll('.item').forEach(el => el.classList.remove('selected')); updateVisualization(); updatePiecesHotbar(); updateHelpText(); splashScreen.classList.remove('hidden'); isSessionActive = false; clearTimeout(inactivityTimer); }
function startSession() { if (isSessionActive) return; isSessionActive = true; splashScreen.classList.add('hidden'); resetInactivityTimer(); updateHelpText(); }
function resetInactivityTimer() { if (!isSessionActive) return; clearTimeout(inactivityTimer); inactivityTimer = setTimeout(resetSession, 10000); }
function generarSalida() { const OUTPUT_ORDER = ['helmet', 'chestplate', 'pants', 'boots', 'sword', 'pickaxe']; const materialToNumber = { 'iron': 1, 'gold': 2, 'diamond': 3 }; const outputArray = OUTPUT_ORDER.map(key => { const item = inventory[key]; return item ? materialToNumber[item.material] : 0; }); const outputString = outputArray.join(''); const blob = new Blob([outputString], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'salida.txt'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); console.log('Archivo de salida generado para descarga.'); }


// Se añaden los 'listeners' para los eventos personalizados del Leap Motion.
window.addEventListener('leap-click', (event) => {
    // El gesto de clic (pellizco) no hace nada en la pantalla de inicio.
    if (!isSessionActive) return;
    
    // Si la sesión está activa, se reinicia el temporizador de inactividad.
    resetInactivityTimer();
    // Si se ha detectado un elemento de la UI bajo el cursor, se simula un clic en él.
    if (event.detail.clickedElement) {
        event.detail.clickedElement.click();
    }
});

window.addEventListener('leap-gesture-special', () => {
    // El gesto especial (pulgar mantenido) tiene una doble función.
    if (!isSessionActive) {
        // Si la sesión no está activa, la inicia.
        startSession();
    } else {
        // Si la sesión ya está activa, ejecuta la lógica de crafteo.
        resetInactivityTimer();
        if (!selectedPieceType || !selectedMaterial) { showFeedbackMessage("Por favor, selecciona una pieza y un material para construir."); return; }
        if (!availableMaterials.has(selectedMaterial)) { showFeedbackMessage(`No dispones de ${MATERIALS[selectedMaterial].name}.`); return; }
        const recipe = PIECE_TYPES[selectedPieceType].recipe;
        if (recipe.sticks && !availableMaterials.has('sticks')) { showFeedbackMessage("No dispones de Palos para esta receta."); return; }
        const newItem = { pieceName: PIECE_TYPES[selectedPieceType].name, materialName: MATERIALS[selectedMaterial].name, type: selectedPieceType, material: selectedMaterial };
        inventory[selectedPieceType] = newItem;
        updatePiecesHotbar();
        selectedPieceType = null; selectedMaterial = null;
        document.querySelectorAll('.item').forEach(el => el.classList.remove('selected'));
        updateVisualization(); updateHelpText();
    }
});

// Listener de teclado, mantenido como una forma de control alternativa o de depuración.
document.addEventListener('keydown', (event) => { 
    const key = event.key.toLowerCase(); 
    // No hace nada si la sesión no está activa.
    if (!isSessionActive) return;
    resetInactivityTimer(); 
    // La tecla 'g' se reserva para generar el archivo de salida y finalizar la sesión.
    if (key === 'g') { 
        generarSalida(); 
        resetSession(); 
    } 
});


// Bucle de animación principal, se ejecuta en cada fotograma.
function animate() {
    // Se planifica la próxima ejecución de esta función.
    requestAnimationFrame(animate);

    // Se actualizan las funciones relacionadas con el Leap Motion.
    updateCursor();
    dispatchLeapEvents();

    // Lógica que se ejecuta cuando hay una mano visible.
    if (window.leapInput && window.leapInput.isHandVisible) {
        // Si la sesión está activa, se reinicia el temporizador de inactividad.
        if (isSessionActive) {
            resetInactivityTimer();
        }
        // Se desactivan los controles del ratón para evitar conflictos.
        controls.enabled = false;

        // Si el gesto de rotación (tres dedos) está activo...
        if (window.leapInput.isRotationGestureActive) {
            // Se obtiene la posición actual del cursor de la mano.
            const currentLeapPos = new THREE.Vector2(
                window.leapInput.cursorPosition.x,
                window.leapInput.cursorPosition.y
            );
            // Se comprueba si el gesto también estaba activo en el frame anterior para evitar saltos.
            if (wasRotatingLastFrame) {
                // Se calcula el desplazamiento de la mano desde el último frame.
                const delta = currentLeapPos.clone().sub(prevLeapDragPos);
                
                // Se define una velocidad de rotación.
                const rotationSpeed = 2 * Math.PI;
                // Se calcula el vector desde el punto focal a la cámara.
                const offset = camera.position.clone().sub(controls.target);
                // Se define el eje de rotación horizontal (eje Y del mundo).
                const axisX = new THREE.Vector3(0, 1, 0);
                // Se calcula el eje de rotación vertical (eje X relativo a la cámara).
                const axisY = new THREE.Vector3().crossVectors(offset, axisX).normalize();

                // Se aplica la rotación al vector offset.
                offset.applyAxisAngle(axisX, -delta.x * rotationSpeed);
                offset.applyAxisAngle(axisY, -delta.y * rotationSpeed);
                
                // Se actualiza la posición de la cámara y se le ordena que vuelva a mirar al punto focal.
                camera.position.copy(controls.target).add(offset);
                camera.lookAt(controls.target);
            }
            // Se guarda la posición actual para el próximo frame.
            prevLeapDragPos.copy(currentLeapPos);
        }
        // Se actualiza la bandera de estado de rotación para el siguiente frame.
        wasRotatingLastFrame = window.leapInput.isRotationGestureActive;
    }
    
    // Se actualizan los controles orbitales (para la inercia del movimiento).
    controls.update();
    
    // Si hay un modelo de previsualización, se rota lentamente sobre su eje Y.
    if (currentPreviewModel) {
        currentPreviewModel.rotation.y += 0.01;
    }
    
    // Se renderiza la escena.
    renderer.render(scene, camera);
}

// Función asíncrona que actúa como punto de entrada de la aplicación.
async function main() {
    try {
        // Se intenta cargar y leer el archivo de configuración de materiales.
        const response = await fetch('entrada.txt');
        if (!response.ok) { throw new Error('No se pudo encontrar el archivo "entrada.txt".'); }
        const content = (await response.text()).trim();
        // Se valida el formato del archivo y se actualiza el 'Set' de materiales disponibles.
        if (content.length === 4 && /^[01]+$/.test(content)) {
            availableMaterials.clear();
            if (content[0] === '1') availableMaterials.add('sticks');
            if (content[1] === '1') availableMaterials.add('iron');
            if (content[2] === '1') availableMaterials.add('gold');
            if (content[3] === '1') availableMaterials.add('diamond');
        } else {
            throw new Error('El formato del archivo "entrada.txt" es incorrecto.');
        }

        // Se inician las tareas de carga y configuración.
        loadCraftingTableModel();
        populateUI();
        // Se establece el estado inicial de la aplicación.
        resetSession();
        // Se inicia el bucle de animación.
        animate();
    } catch (error) {
        // Si ocurre algún error durante la inicialización, se muestra un mensaje.
        showError(error.message);
    }
}

// Se llama a la función principal para arrancar la aplicación.
main();

// Se activa la función de escalado al inicio y se añade un listener para futuros cambios de tamaño.
handleScaling();
window.addEventListener('resize', handleScaling);