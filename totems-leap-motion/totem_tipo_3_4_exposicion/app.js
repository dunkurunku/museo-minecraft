import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- REFERENCIAS DOM & SETUP ---
const container = document.querySelector('#canvas-container');
const canvas = document.querySelector('#webgl-canvas');
const leapCursor = document.getElementById('leap-cursor');

// Inicialización básica de Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(0, 0.5, 6.5);

// Configuración del renderizador
// Alpha true para fondo transparente; powerPreference para asegurar uso de GPU dedicada si es posible.
const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: false, 
    alpha: true,
    powerPreference: "high-performance"
});

renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(1); 
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// --- ILUMINACIÓN ---
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(3, 5, 5);
dirLight.castShadow = true;
scene.add(dirLight);

// --- CONTROLES DE CÁMARA ---
// Limitamos la interacción del ratón para mantener la vista centrada en el Armor Stand.
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0); 
controls.enableZoom = false;
controls.enablePan = false;
controls.enableDamping = true;

// Grupo contenedor principal: Permite rotar todo el conjunto (stand + items) a la vez.
const mainGroup = new THREE.Group();
mainGroup.position.y = -1.0;
scene.add(mainGroup);

// --- GESTIÓN DE ASSETS (DATA MAPPING) ---
// Definición de combinaciones posibles para generar rutas de carga dinámicamente.
const materials = ['iron', 'gold', 'diamond'];
const types = ['helmet', 'chestplate', 'legs', 'boots', 'sword', 'pickaxe'];
const suffixes = ['', '_customr', '_customl']; 

const loadedModels = {}; // Caché de modelos instanciados
const modelsToLoad = {
    'armor_stand': 'modelos/armor_stand.glb'
};

// Generación procedural de claves y rutas
materials.forEach(mat => {
    types.forEach(type => {
        suffixes.forEach(suff => {
            const key = `${mat}_${type}${suff}`;
            modelsToLoad[key] = `modelos/${key}.glb`;
        });
    });
});

const loader = new GLTFLoader();
const loadingElem = document.getElementById('loading');

// Constantes de escala para normalización visual
const SIZE_SWORD = 1.5;   
const SIZE_PICKAXE = 1.0; 
const SIZE_STAND = 1.6;

/**
 * Calcula el factor de escala necesario para que un modelo
 * encaje dentro de un tamaño objetivo (targetSize).
 */
function getScaleFactor(model, targetSize) {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    return maxDim === 0 ? 1 : targetSize / maxDim;
}

// --- CARGA ASÍNCRONA & PROCESADO DE MODELOS ---
async function loadAllModels() {
    const promises = Object.entries(modelsToLoad).map(([key, path]) => {
        return new Promise((resolve) => {
            loader.load(path, (gltf) => {
                const model = gltf.scene;
                
                // Optimización de rendimiento:
                // Desactivamos matrixAutoUpdate porque son objetos estáticos (salvo animación simple).
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.matrixAutoUpdate = false; 
                        child.updateMatrix();
                    }
                });

                // --- PARCHES DE ROTACIÓN (HARDCODED) ---
                // Algunos modelos vienen con ejes incorrectos desde el exportador 3D.
                // Aquí corregimos su orientación manualmente antes de añadirlos.
                if (key.includes('gold_sword')) {
                    model.rotation.x = Math.PI / 2; 
                }
                if (key.includes('diamond_pickaxe')) {
                    model.rotation.set(0, Math.PI, -Math.PI / 2);
                } else if (key.includes('pickaxe')) {
                    model.rotation.set(0, Math.PI, 0);
                }

                model.updateMatrixWorld();

                // Wrapper System:
                // Creamos jerarquía de Grupos para separar la rotación local del posicionamiento global.
                const wrapper = new THREE.Group();
                wrapper.add(model);
                const pivot = new THREE.Group();
                pivot.add(wrapper);

                // --- POSICIONAMIENTO POR TIPO ---
                if (key.includes('sword') || key.includes('pickaxe')) {
                    // Centrar modelo en su propio pivote
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center);

                    if (key.includes('sword')) {
                        const scale = getScaleFactor(model, SIZE_SWORD);
                        pivot.scale.set(scale, scale, scale);
                        pivot.position.set(1.4, 0.5, 0); // Mano derecha
                        pivot.rotation.z = Math.PI / 4; 
                    } else {
                        const scale = getScaleFactor(model, SIZE_PICKAXE);
                        pivot.scale.set(scale, scale, scale);
                        pivot.position.set(-1.4, 0.3, 0); // Mano izquierda
                        pivot.rotation.z = -Math.PI / 4; 
                    }
                } else {
                    // Configuración para armadura y stand
                    const scale = SIZE_STAND;
                    pivot.scale.set(scale, scale, scale);
                    pivot.position.set(0, -0.9, 0); 
                    pivot.rotation.y = Math.PI; 

                    // Ajuste fino para evitar Z-fighting en las botas
                    if (key.includes('boots')) {
                        model.position.y = 0.05; 
                    }
                }

                mainGroup.add(pivot);
                // Inicialmente ocultamos todo salvo el Armor Stand base
                if (key !== 'armor_stand') pivot.visible = false;
                
                loadedModels[key] = pivot;
                resolve();
            }, undefined, (err) => { resolve(); }); // Resolvemos siempre para no bloquear Promise.all
        });
    });

    await Promise.all(promises);
    if(loadingElem) loadingElem.style.display = 'none';
    
    adjustCameraResponsive();
    
    // Iniciamos polling para leer cambios en el archivo de texto
    setInterval(readInputFile, 2000);
    readInputFile();
}
loadAllModels();

// --- LECTURA DE ESTADO (INPUT) ---
// Mapeo de IDs numéricos del .txt a nombres de archivo
const materialMap = { 1: 'iron', 2: 'gold', 3: 'diamond' };
const suffixMap = { 0: '', 1: '_customr', 2: '_customl' };
const slotOrder = ['helmet', 'chestplate', 'legs', 'boots', 'sword', 'pickaxe'];

async function readInputFile() {
    try {
        const response = await fetch('entrada.txt', { cache: "no-store" });
        if (!response.ok) return;
        
        const text = await response.text();
        const lines = text.split('\n').filter(l => l.trim() !== '');
        const visibleKeys = new Set(['armor_stand']);

        // Parseo línea a línea mapeando a slotOrder
        for (let i = 0; i < Math.min(lines.length, slotOrder.length); i++) {
            const cleanLine = lines[i].replace(/[()]/g, '').trim();
            const parts = cleanLine.split(',');
            
            if (parts.length < 2) continue;

            const matId = parseInt(parts[0]);
            const customId = parseInt(parts[1]);

            if (matId === 0) continue; // Slot vacío

            const materialName = materialMap[matId];
            const suffix = suffixMap[customId];
            const slotName = slotOrder[i];
            
            // Lógica de fallback: Si no existe el modelo custom, busca el default
            if (materialName && suffix !== undefined) {
                const modelKey = `${materialName}_${slotName}${suffix}`;
                const fallbackKey = `${materialName}_${slotName}`;

                if (loadedModels[modelKey]) {
                    visibleKeys.add(modelKey);
                } else if (loadedModels[fallbackKey]) {
                    visibleKeys.add(fallbackKey);
                }
            }
        }

        // Actualización de grafo de escena (toggle visibility)
        for (const key in loadedModels) {
            loadedModels[key].visible = visibleKeys.has(key);
        }
    } catch (err) {
        console.error(err);
    }
}

// --- RESPONSIVE & CÁMARA ---
function adjustCameraResponsive() {
    const aspect = container.clientWidth / container.clientHeight;
    // Ajuste de posición de cámara para pantallas verticales (móvil)
    if (aspect < 1) {
        camera.position.set(0, 0.5, 11.5); 
    } else {
        camera.position.set(0, 0.5, 6.5);
    }
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
}

window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    adjustCameraResponsive();
});

// --- CONTROL GESTUAL (LEAP MOTION) ---
let lastHandRoll = 0;
let isCurrentlyRotating = false;

function updateLeap() {
    // Si no hay mano detectada, fallback a controles de ratón
    if (!window.leapInput || !window.leapInput.isHandVisible) {
        if (leapCursor) leapCursor.style.display = 'none';
        controls.enabled = true;
        isCurrentlyRotating = false;
        return;
    }

    resetIdleTimer();
    controls.enabled = false; // Leap tiene prioridad

    // Mapeo de coordenadas normalizadas a píxeles CSS
    const cx = (window.leapInput.cursorPosition.x + 1) / 2 * window.innerWidth;
    const cy = (1 - window.leapInput.cursorPosition.y) / 2 * window.innerHeight;
    if (leapCursor) {
        leapCursor.style.display = 'block';
        leapCursor.style.left = `${cx}px`;
        leapCursor.style.top = `${cy}px`;
    }

    // Gesto de Rotación (detectado en provider externo)
    if (window.leapInput.isRotationGesture) {
        if (leapCursor) {
            leapCursor.style.backgroundColor = 'cyan';
            leapCursor.style.transform = 'translate(-50%, -50%) scale(1.2)';
        }
        
        // Usamos el "roll" de la mano para rotar el grupo principal
        const currentRoll = window.leapInput.handRoll;
        if (!isCurrentlyRotating) {
            lastHandRoll = currentRoll;
            isCurrentlyRotating = true;
        } else {
            let delta = currentRoll - lastHandRoll;
            // Deadzone para evitar jitter
            if (Math.abs(delta) > 0.02) {
                mainGroup.rotation.y += delta * 3;
            }
            lastHandRoll = currentRoll;
        }
    } else {
        isCurrentlyRotating = false;
        if (leapCursor) {
            leapCursor.style.backgroundColor = '';
            leapCursor.style.transform = 'translate(-50%, -50%)';
        }
    }
}

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now() * 0.002;
    
    // Animación de levitación para herramientas en mano
    for (const key in loadedModels) {
        const model = loadedModels[key];
        if (model.visible) {
             if (key.indexOf('sword') !== -1) {
                 model.position.y = 0.5 + Math.sin(time) * 0.02;
             }
             else if (key.indexOf('pickaxe') !== -1) {
                 model.position.y = 0.3 + Math.sin(time + 1.5) * 0.02;
             }
        }
    }

    updateLeap();
    controls.update();
    renderer.render(scene, camera);
}
animate();

// --- SISTEMA DE INACTIVIDAD (IDLE) ---
const idleScreen = document.getElementById('idle-screen');
let idleTimer;
const inactivityTime = 10000; // 10s

function showIdle() {
    idleScreen.classList.add('visible');
}

// Resetea el contador ante cualquier interacción
function resetIdleTimer() {
    if (idleScreen.classList.contains('visible')) {
        idleScreen.classList.remove('visible');
    }
    
    clearTimeout(idleTimer);
    idleTimer = setTimeout(showIdle, inactivityTime);
}

// Listeners globales
window.addEventListener('load', () => {
    idleTimer = setTimeout(showIdle, inactivityTime);
    
    const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll', 'click'];
    events.forEach(event => {
        document.addEventListener(event, resetIdleTimer, true);
    });
});