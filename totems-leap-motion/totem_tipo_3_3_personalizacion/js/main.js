document.addEventListener('DOMContentLoaded', () => {

    // --- VARIABLES GLOBALES Y CONSTANTES ---
    //Se guardan los elemento HTML principales para evitar búsquedas repetidas    
    const idleScreen = document.getElementById('idle-screen');
    const appScreen = document.getElementById('app-screen');
    const viewerContainer = document.getElementById('viewer-container');
    const hotbarSlots = document.querySelectorAll('.slot');
    const lapisButton = document.getElementById('lapislazuli-button');
    const redstoneButton = document.getElementById('redstone-button');
    const saveButton = document.getElementById('save-button');

    //Variables Leap Motion
    const cursor = document.getElementById('leap-cursor');
    let grabStartTime = 0;
    let hasClicked = false;
    let lastHandX = 0;
    let lastHandY = 0;
    let isLeapRotating = false;

    //Movimiento especial
    // Variables para detectar la "X"
    let xGestureState = 0; // 0: Nada, 1: Primer trazo detectado
    let xGestureTimer = null;
    let lastXPos = 0;
    let lastYPos = 0;

    //Variables para el estado de la aplicación
    let inactivityTimer; 
    let inputData = {}; 
    let pieceCustomizations = [0, 0, 0, 0, 0, 0]; //Guarda la customizacion de cada pieza
    let selectedPieceIndex = -1; //Índice de la pieza actualmente seleccionada
    let heldItemType=0; // 0: Nada, 1: Lapis, 2: Redstone
    
    const PIECE_NAMES = ['casco', 'pechera', 'pantalones', 'botas', 'espada', 'pico'];
    //Factor de escala de los modelos
    const TARGET_SIZE = 1.5; 
    
    // --- CONFIGURACIÓN DEL MOTOR GRÁFICO(Three.js) ---
    let scene, camera, renderer, currentModel, gltfLoader;

    /*
    Inicialización de escena, camara, luces y renderer
    */
    function initThree() {
        scene = new THREE.Scene();
        scene.background = null; // Para que se vea el fondo del CSS 

        //Dimensiones de la cámara según el contenedor
        const width = viewerContainer.clientWidth;
        const height = viewerContainer.clientHeight;
        const aspectRatio = width / height;
        
        //Configuración de la cámara(FOV, aspect ratio, near, far)
        camera = new THREE.PerspectiveCamera(50, aspectRatio, 0.1, 1000);
        camera.position.z = 5; //Distancia de la cámara

        // Configuración del Renderizador
        // - antialias: Suaviza los altas frecuencias visuales para evitar artefactos.
        // - alpha: Habilita el canal alfa para la transparencia del canvas.
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height); 
        renderer.setPixelRatio(window.devicePixelRatio); //Nitidez en funcion de la pantalla
        
        viewerContainer.appendChild(renderer.domElement);

        // Iluminación básica de la escena
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        // Cargador de modelos GLB(y GLTF aunque no los usemos)
        gltfLoader = new THREE.GLTFLoader();

        // inicialización de controles de ratón como alternativa a Leap Motion(se usa para pruebas)
        setupMouseControls();

        // Manejo de redimensionamiento de ventana
        window.addEventListener('resize', onWindowResize, false);
        //Iniciar el bucle de renderizado
        animate();
    }

    /**
     * Maneja el redimensionado de la pantalla, recalculando la matriz de proyeccion para evitar que se deformen los modelos
     */
    function onWindowResize() {
        if (!camera || !renderer || !viewerContainer) return;
        const width = viewerContainer.clientWidth;
        const height = viewerContainer.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    
    // --- BUCLE PRINCIPAL ---

    /**
     * Bucle de animación principal. Sincroniza la lógica de Leap Motion y renderiza la escena.
     */
    function animate() {
        requestAnimationFrame(animate);
        
        // Actualizar lógica de Leap Motion (Cursor y Clics)
        updateLeapCursor();
        
        // Actualizar Interaccion 3D
        handleLeapRotation();

        // Renderizar la escena
        renderer.render(scene, camera);
    }
    
    /**
     * Gestiona la representación visual del cursor y decide qué lógica aplicar.
     * Sirve como un enrutador para la interacción con el Leap
     */
    function updateLeapCursor() {
        //Si no hay mano, no hay cursor
        if (!window.leapInput || !window.leapInput.isHandVisible) {
            if (cursor) cursor.style.display = 'none';
            return;
        }


        if (cursor) {
            cursor.style.display = 'block';
            
            //Mapeo de coordenadas normalizadas a píxeles de pantalla
            const x = (window.leapInput.cursorPosition.x + 1) / 2 * window.innerWidth;
            const y = (1 - window.leapInput.cursorPosition.y) / 2 * window.innerHeight;

            //Posicion del cursor en pantalla
            cursor.style.left = `${x}px`;
            cursor.style.top = `${y}px`;

            // Raycasting para detectar elementos interactivos bajo el cursor
            // Como no hay ratón, simulamos el hover con la posición del cursor Leap
            //Primero limpia la clase que simula el hover
            document.querySelectorAll('.hover-effect').forEach(el => el.classList.remove('hover-effect'));

            // Detectamos elemento bajo el cursor
            const elementUnderCursor = document.elementFromPoint(x, y);
            if (elementUnderCursor) {
                const interactable = elementUnderCursor.closest('.custom-button') || elementUnderCursor.closest('.slot');
                // Solo aplicamos hover si NO estamos arrastrando y el elemento es interactivo
                if (interactable && !interactable.classList.contains('disabled') && !interactable.classList.contains('unavailable') && !window.leapInput.isGrabbing) {
                    interactable.classList.add('hover-effect');
                }
            }

            // Actualizar aspecto del cursor
            cursor.classList.remove('cursor-lapis', 'cursor-redstone');
            
            if (heldItemType === 1) {
                cursor.classList.add('cursor-lapis');
            } else if (heldItemType === 2) {
                cursor.classList.add('cursor-redstone');
            }

            // Lógica de gestos
            // Cancelar (Pulgar Arriba con objeto en mano)
            if (window.leapInput.isSpecialGesture && heldItemType !== 0) {
                heldItemType = 0; // Soltamos
                console.log("Cancelado: Objeto soltado");
                cursor.style.transform = 'translate(-50%, -50%) scale(0.5)';
                // Limpiamos cualquier estado de gesto X pendiente
                xGestureState = 0;
                clearTimeout(xGestureTimer);
                return; 
            }

            // Confirmar Gesto "X" (con objeto en mano)
            if (heldItemType !== 0) {
                detectXGesture(x, y);
            }


            // Logica de clic
            // Solo permitimos clic si NO tenemos nada en la mano
            if (heldItemType === 0) {
                 if (window.leapInput.isGrabbing) {
                    cursor.classList.add('grabbing');// Cursor en rojo
                    cursor.classList.remove('special-gesture');


                    // Lógica de retención para clic prolongado
                    if (grabStartTime === 0) grabStartTime = Date.now();

                    const elapsedTime = Date.now() - grabStartTime;
                    const CLICK_DELAY = 1000; 

                    // Progreso visual del clic prolongado
                    const progress = Math.min(elapsedTime / CLICK_DELAY, 1);
                    cursor.style.transform = `translate(-50%, -50%) scale(${1 - (progress * 0.5)})`;

                    // Disparar el clic virtual si se ha mantenido el tiempo suficiente
                    if (elapsedTime >= CLICK_DELAY && !hasClicked) {
                        triggerVirtualClick(x, y);
                        hasClicked = true;
                        const originalColor = cursor.style.backgroundColor;
                        cursor.style.backgroundColor = "white";
                        setTimeout(() => cursor.style.backgroundColor = "", 200);
                    }

                } else {
                    grabStartTime = 0;
                    hasClicked = false;
                    cursor.classList.remove('grabbing');

                    // GESTO ROTACIÓN (Solo si no tenemos item)
                    if (window.leapInput.isSpecialGesture) {
                        cursor.classList.add('special-gesture');//Cursor azul
                        cursor.style.transform = 'translate(-50%, -50%) scale(1.2)';
                    } else {
                        cursor.classList.remove('special-gesture');
                        cursor.style.transform = 'translate(-50%, -50%)';
                    }
                }
            } 
            // Si tenemos item en mano, anulamos efectos de clic estándar
            else {
                cursor.classList.remove('grabbing', 'special-gesture');
                // Mantenemos el tamaño del icono
                if (!cursor.classList.contains('success-action')) {
                    cursor.style.transform = 'translate(-50%, -50%) scale(1.0)'; 
                }
            }
            // Reiniciar temporizador de inactividad(Definido más adelante, sirve para devolver al idle screen)
            resetInactivityTimer();
        }
    }

   // Detecta el gesto especial para personalización: Dibujar una "X" rápida
    function detectXGesture(currentX, currentY) {
        const deltaX = currentX - lastXPos;
        const deltaY = currentY - lastYPos;
        
        // UMBRAL DE VELOCIDAD (Alto para evitar falsos positivos)
        const SPEED_THRESHOLD = 20; 

        // Definimos los dos tipos de trazos posibles
        // Trazo A (\): Derecha y Abajo
        const isStrokeDownRight = (deltaX > SPEED_THRESHOLD && deltaY > SPEED_THRESHOLD);
        
        // Trazo B (/): Izquierda y Abajo
        const isStrokeDownLeft = (deltaX < -SPEED_THRESHOLD && deltaY > SPEED_THRESHOLD);

        // Buscamos el primer trazo
        if (xGestureState === 0) {
            
            if (isStrokeDownRight) {
                // Detectamos \ -> Esperamos /
                xGestureState = 1; 
                console.log("Parte 1 de X detectada (Diagonal \\). Esperando /");
                setGestureTimeout();
            } 
            else if (isStrokeDownLeft) {
                // Detectamos / -> Esperamos \
                xGestureState = 2; 
                console.log("Parte 1 de X detectada (Diagonal /). Esperando \\");
                setGestureTimeout();
            }
        }
        
        //Buscamos el segundo trazo
        else {
            let gestureCompleted = false;

            // Teníamos \ (Estado 1) y ahora hacemos /
            if (xGestureState === 1 && isStrokeDownLeft) {
                gestureCompleted = true;
            }
            // Teníamos / (Estado 2) y ahora hacemos \
            else if (xGestureState === 2 && isStrokeDownRight) {
                gestureCompleted = true;
            }

            // Gesto completado
            if (gestureCompleted) {
                console.log("X completada. Aplicando personalización.");
                
                // 1. Aplicar cambio
                applyCustomization(heldItemType);
                
                // 2. Feedback Visual
                cursor.classList.add('success-action');
                setTimeout(() => cursor.classList.remove('success-action'), 500);
                
                // 3. Limpieza
                heldItemType = 0;
                xGestureState = 0;
                clearTimeout(xGestureTimer);
            }
        }

        // Actualizamos posición anterior
        lastXPos = currentX;
        lastYPos = currentY;
    }

    /**
     * Configura un temporizador para resetear el estado del gesto "X" si no se completa a tiempo.
     * Tenemos 8 segundos para completar la "X" una vez iniciado el primer trazo.
     */
    function setGestureTimeout() {
        clearTimeout(xGestureTimer);
        xGestureTimer = setTimeout(() => {
            if (xGestureState !== 0) {
                console.log("Tiempo de gesto agotado. Reiniciando.");
                xGestureState = 0;
            }
        }, 800); // 0.8 segundos para completar la segunda parte
    }

    /**
     * Simula un click con el cursor Leap Motion en las coordenadas dadas.
     */
    function triggerVirtualClick(x, y) {
        // Obtenemos el elemento debajo del cursor
        const element = document.elementFromPoint(x, y);
        if (element) {
            console.log("Leap Click en:", element);
            // Simulamos un clic completo
            element.click(); 
            // Algunos elementos pueden necesitar mousedown/mouseup también
            element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
            element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
        }
    }


    /**
     * Gestiona la rotación 3D mediante gestos de la mano
     */
    function handleLeapRotation() {
        //No rotar sin mano o modelo
        if (!window.leapInput || !window.leapInput.isHandVisible || !currentModel) {
            isLeapRotating = false;
            return;
        }

        // No rotamos si tenemos algo en la mano
        if (heldItemType !== 0) {
            isLeapRotating = false;
            return;
        }

        // Solo rotamos si el modelo está cargado y hacemos el gesto del pulgar
        if (window.leapInput.isSpecialGesture) {
            const currentX = window.leapInput.cursorPosition.x;
            const currentY = window.leapInput.cursorPosition.y;

            if (!isLeapRotating) {
                // Inicio del gesto
                lastHandX = currentX;
                lastHandY = currentY;
                isLeapRotating = true;
            } else {
                // Durante el gesto
                const deltaX = currentX - lastHandX;
                const deltaY = currentY - lastHandY;

                const ROTATION_SPEED = 4.0; 
                
                currentModel.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), deltaX * ROTATION_SPEED);
                currentModel.rotateOnAxis(new THREE.Vector3(1, 0, 0), -deltaY * ROTATION_SPEED);

                // Actualizamos referencias
                lastHandX = currentX;
                lastHandY = currentY;
            }
        } else {
            isLeapRotating = false;
        }
    }


    /**
     * Configura los controles del ratón para rotar el modelo 3D. Funcion para pruebas sin Leap Motion.
     */
    function setupMouseControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        renderer.domElement.addEventListener('mousedown', (e) => { isDragging = true; });
        renderer.domElement.addEventListener('mouseup', (e) => { isDragging = false; });
        renderer.domElement.addEventListener('mouseleave', (e) => { isDragging = false; }); 
        
        renderer.domElement.addEventListener('mousemove', (e) => {
            //Solo rota si esta siendo arrastrado y hay un modelo cargado
            if (!isDragging || !currentModel) return;
            const deltaMove = {
                x: e.offsetX - previousMousePosition.x,
                y: e.offsetY - previousMousePosition.y
            };
            currentModel.rotation.y += deltaMove.x * 0.01;
            currentModel.rotation.x += deltaMove.y * 0.01;
            previousMousePosition = { x: e.offsetX, y: e.offsetY };
        });
    }

    // --- LÓGICA DE LA APLICACIÓN  ---

    /**
     * Parsea la cadena de entrada y actualiza el estado interno de la aplicación.
     */
    function parseInput(inputString) {
        const parts = inputString.split(',');
        inputData = {
            hasLapis: parts[0] === 'true',
            hasRedstone: parts[1] === 'true',
            pieces: parts.slice(2).map(Number) 
        };
    }

    /**
     * Configura la interfaz de usuario según los datos de entrada.
     * Gestiona la disponibilidad de piezas y botones y los iconos de la hotbar.
     */
    function setupUI() {
        //Configuracion de la hotbar
        hotbarSlots.forEach((slot, index) => {
            const material = inputData.pieces[index];
            const pieceName = PIECE_NAMES[index];
            
            if (material === 0) {
                //Si el slot es 0 se marca como no disponible
                slot.classList.add('unavailable');
            } else {
                slot.classList.remove('unavailable');
            }
            const iconPath = `assets/icons/${pieceName}_icon.png`;
            slot.style.backgroundImage = `url('${iconPath}')`;
        });

        //Configuracion de botones de personalización
        if (inputData.hasLapis) {
            lapisButton.classList.remove('disabled');
        } else {
            lapisButton.classList.add('disabled');
        }

        if (inputData.hasRedstone) {
            redstoneButton.classList.remove('disabled');
        } else {
            redstoneButton.classList.add('disabled');
        }
    }

    /**
     * Muestra la pieza seleccionada en el visor 3D, aplicando la personalización actual.
     * Corrige problemas geométricos relacionados con la rotación y escala de los modelos.
     */
    function displayPiece(index) {
        //Limpia la escena anterior
        if (currentModel) {
            scene.remove(currentModel);
            currentModel = null;
        }

        const materialId = inputData.pieces[index];
        if (index < 0 || materialId === 0) {
            selectedPieceIndex = -1;
            return;
        }
        
        selectedPieceIndex = index;
        const pieceName = PIECE_NAMES[index];
        const customType = pieceCustomizations[index];
        const baseName = `material_${materialId}`;

        //Selección de la variante del modelo según la personalización
        let suffix = '';
        switch (customType) {
            case 1: suffix = '_lapis'; break;
            case 2: suffix = '_redstone'; break;
        }
        const modelFileName = `${baseName}${suffix}.glb`;
        const modelPath = `assets/models/${pieceName}/${modelFileName}`;
        console.log(`Cargando modelo: ${modelPath}`);

        gltfLoader.load(
            modelPath,
            (gltf) => {
                const loadedModel = gltf.scene;

                //Algoritmo de corrección de pivote                
                // Calculamos la caja que envuelve al modelo (Bounding Box)
                const box = new THREE.Box3().setFromObject(loadedModel);
                const size = new THREE.Vector3();
                const center = new THREE.Vector3();
                
                box.getSize(size);  
                box.getCenter(center); // El punto central geométrico REAL

                // Movemos el modelo INTERNAMENTE para que su centro esté en (0,0,0)
                // Esto contrarresta el offset original del archivo 3D si lo tuviera(como el caso del casco)
                loadedModel.position.x = -center.x;
                loadedModel.position.y = -center.y;
                loadedModel.position.z = -center.z;

                //Creamos un grupo pivote para manejar la escala y rotación correctamente en lugar
                //de operar sobre el modelo directamente
                const pivotGroup = new THREE.Group();
                pivotGroup.add(loadedModel);

                // Escalamos el GRUPO
                const largestDimension = Math.max(size.x, size.y, size.z);
                const scale = TARGET_SIZE / largestDimension;
                pivotGroup.scale.set(scale, scale, scale);

                // Asignamos el grupo a la variable global
                currentModel = pivotGroup;
                scene.add(currentModel);
            },
            undefined,
            (error) => {
                console.error(`Error cargando el modelo ${modelPath}:`, error);
                //Modelo en caso de que falte alguno o haya error
                const errorGeometry = new THREE.BoxGeometry(1, 1, 1);
                const errorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
                currentModel = new THREE.Mesh(errorGeometry, errorMaterial);
                scene.add(currentModel);
            }
        );
    }
    
    /**
     * Aplica la personalización seleccionada a la pieza actualmente mostrada.
     */
    function applyCustomization(customType) {
        if (selectedPieceIndex === -1) return;
        
        pieceCustomizations[selectedPieceIndex] = customType;
        displayPiece(selectedPieceIndex);
        
        // Actualizar borde del slot seleccionado para reflejar la personalización
        hotbarSlots.forEach((slot, index) => {
            if (index === selectedPieceIndex) {
                 slot.style.borderColor = (customType === 1) ? '#0055d4' : (customType === 2 ? '#cf0000' : '#007aff');
            }
        });
    }

    // --- EVENTOS DE INTERFAZ ---

    /**
     * Inicia la sesión al hacer clic en la pantalla de inactividad.
     * Carga la configuración y prepara la UI. 
     */
    idleScreen.addEventListener('click', async () => {
        try {
            //Carga de la configuración inicial desde config.txt
            const response = await fetch('config.txt');
            if (!response.ok) throw new Error('No config.txt');
            const configString = await response.text();

            // Reseteo de Estado (Limpieza de sesión anterior)
            pieceCustomizations = [0, 0, 0, 0, 0, 0];
            selectedPieceIndex = -1;
            if (currentModel) scene.remove(currentModel);
            currentModel = null;
            // Reseteo Visual de la Hotbar
            hotbarSlots.forEach(slot => { 
                slot.classList.remove('selected', 'unavailable'); 
                slot.style.borderColor = '#888';
            });

            parseInput(configString.trim()); 
            setupUI();

            //Transición a pantalla de aplicación
            idleScreen.classList.remove('active');
            appScreen.classList.add('active');
            document.getElementById('help-button').classList.add('visible'); 

            // Ajuste final del visor 3D
            setTimeout(onWindowResize, 50); 
            resetInactivityTimer(); 

        } catch (error) {
            console.error("Error al iniciar la sesión:", error);
            alert("Error de configuración.");
        }
    });

    /**
     * Manejo de selección de piezas en la hotbar.
     */
    hotbarSlots.forEach((slot, index) => {
        slot.addEventListener('click', () => {
            // Ignorar clicks en items bloqueados por config
            if (slot.classList.contains('unavailable')) return;
            hotbarSlots.forEach(s => {
                s.classList.remove('selected');
                s.style.borderColor = '#888'; // Resetear bordes
            });
            slot.classList.add('selected');
            
            // Colorear el borde según la personalización actual de esa pieza
            const currentCustom = pieceCustomizations[index];
            if(currentCustom === 1) slot.style.borderColor = '#0055d4';
            else if(currentCustom === 2) slot.style.borderColor = '#cf0000';
            else slot.style.borderColor = '#888'; 

            displayPiece(index);
        });
    });

    //Listeners de los botones de personalización
    lapisButton.addEventListener('click', () => selectTool(1));
    redstoneButton.addEventListener('click', () => selectTool(2));

    /**
     * Selecciona la herramienta de personalización (Lapis o Redstone).
     */ 
     function selectTool(type) {
        if (selectedPieceIndex === -1) return; // No hacer nada si no hay pieza seleccionada
        
        heldItemType = type; // 1 = Lapis, 2 = Redstone
        console.log("Herramienta seleccionada:", type === 1 ? "Lapis" : "Redstone");
        
        //Feedback visual en el botón del footer
        lapisButton.classList.remove('active-tool');
        redstoneButton.classList.remove('active-tool');
        if (type === 1) lapisButton.classList.add('active-tool');
        if (type === 2) redstoneButton.classList.add('active-tool');
    }

    /**
     * Resetea el temporizador de inactividad.
     * Si se alcanza el tiempo límite, se finaliza la sesión.
     */
    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            endSession('Inactividad');
        }, 60000); 
    }
    
    /**
     * Genera y descarga un archivo de texto con la configuración actual.
     */
    function generateOutputFile() {
        const outputLines = []; 
        //Crea las líneas del archivo
        for (let i = 0; i < 6; i++) {
            const material = inputData.pieces[i]; 
            const customization = pieceCustomizations[i]; 
            outputLines.push(`(${material}, ${customization})`);
        }
        const dataString = outputLines.join('\n');
        const blob = new Blob([dataString], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;

        // Establece el nombre del archivo a descargar
        link.download = 'output.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Finaliza la sesión actual, mostrando la pantalla de inactividad.
     * Guarda el archivo si se ha indicado un guardado manual.
     */
    function endSession(reason = 'Desconocido') {
        clearTimeout(inactivityTimer);
        console.log(`--- SESIÓN FINALIZADA (${reason}) ---`);

        if (reason === 'Guardado manual') { 
            generateOutputFile();
        }
        appScreen.classList.remove('active');
        idleScreen.classList.add('active');

        const helpBtn = document.getElementById('help-button');
        if (helpBtn) helpBtn.classList.remove('visible');
        endTutorial(); 
    }
    
    /**
     * Listener para el botón de guardar.
     * Finaliza la sesión con motivo de guardado manual.
     */
    saveButton.addEventListener('click', () => {
        endSession('Guardado manual');
    });
    
    // Listeners globales para resetear inactividad (Mouse + Teclado)
    ['mousemove', 'mousedown', 'keypress'].forEach(evento => {
        document.addEventListener(evento, () => {
            if (appScreen.classList.contains('active')) {
                resetInactivityTimer();
            }
        });
     });

    
    // --- TUTORIAL ---
    //Pasos del tutorial
    const tourSteps = [
        {
            targetId: 'hotbar-container',
            text: "1. ELIGE TU EQUIPAMIENTO: Selecciona arriba qué pieza quieres personalizar (Casco, Pechera, Espada...)."
        },
        {
            targetId: 'controls-container', 
            text: "2. ELIGE EL MATERIAL: Selecciona abajo el material: Lapislázuli (Azul) o Redstone (Rojo). Tu cursor cambiará."
        },
        {
            targetId: 'viewer-container', 
            text: "3. CONFIRMA CON 'X': Con el material en la mano, dibuja una 'X' rápida en el aire para aplicar el cambio. (Pulgar extendido para soltar)."
        },
        {
            targetId: 'save-button',
            text: "4. GUARDAR: Cuando termines tu creación, pulsa aquí para guardar y salir."
        }
    ];

    let currentStepIndex = 0;
    const overlay = document.getElementById('tutorial-overlay');
    const box = document.getElementById('tutorial-box');
    const textP = document.getElementById('tutorial-text');
    const nextBtn = document.getElementById('next-btn');
    const skipBtn = document.getElementById('skip-btn');
    const helpBtn = document.getElementById('help-button');

    function showStep(index) {
        // Limpiar resaltado anterior
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });

        if (index >= tourSteps.length) {
            endTutorial();
            return;
        }

        //Seleccionar el paso actual
        const step = tourSteps[index];
        const target = document.getElementById(step.targetId);

        if (!target) {
            console.warn("Elemento tutorial no encontrado:", step.targetId);
            currentStepIndex++;
            showStep(currentStepIndex);
            return;
        }

        // Resaltar el elemento objetivo
        target.classList.add('tutorial-highlight');
        
        //Autoscroll hacia el elemento
        if(step.targetId !== 'viewer-container') {
             target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Seleccionar el texto del paso
        textP.innerHTML = step.text;
        
        // Aseguramos que la caja se ve
        box.classList.remove('hidden'); 
        box.style.display = 'block';
        box.style.opacity = '0'; // Para la transición

        // Ocultamos el overlay si existe
        if (overlay) overlay.style.display = 'none'; 

        setTimeout(() => box.style.opacity = '1', 10);

        // Cálculo de posición de la caja
        const targetRect = target.getBoundingClientRect();
        const boxRect = box.getBoundingClientRect();

        //Cálculo horizontal
        let left = targetRect.left + (targetRect.width / 2) - (boxRect.width / 2);
        if (left < 10) left = 10;
        if (left + boxRect.width > window.innerWidth) left = window.innerWidth - boxRect.width - 10;

        //Cálculo vertical
        let top;
        const spaceBelow = window.innerHeight - targetRect.bottom;
        
        // Determinar si hay más espacio arriba o abajo para colocar la caja
        if (spaceBelow < boxRect.height + 20) {
            top = targetRect.top - boxRect.height - 20;
        } else {
            top = targetRect.bottom + 20;
        }

        box.style.top = `${top}px`;
        box.style.left = `${left}px`;

        // Actualizar botones
        if (index === tourSteps.length - 1) {
            nextBtn.innerHTML = "Finalizar";
            skipBtn.style.display = "none"; 
            document.querySelector('.tutorial-controls').style.justifyContent = "center"; 
        } else {
            nextBtn.innerHTML = "Siguiente &raquo;";
            skipBtn.style.display = "inline-block"; 
            document.querySelector('.tutorial-controls').style.justifyContent = "space-between"; 
        }
    }

    /**
     * Finaliza el tutorial, ocultando la caja y el overlay.
     */
    function endTutorial() {
        // Ocultamos la caja
        box.style.display = 'none';
        box.classList.add('hidden');
        
        // Nos aseguramos que el overlay siga oculto
        if (overlay) overlay.style.display = 'none';

        // Quitamos la clase que genera la sombra 
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        currentStepIndex = 0;
    }

    // Listeners del tutorial
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

     // Permite simular el gesto de la "X" pulsando la BARRA ESPACIADORA
     //Sirve solo para pruebas
    document.addEventListener('keydown', (e) => {
        // Solo si pulsamos ESPACIO y tenemos Lapis o Redstone en la mano
        if (e.code === 'Space' && heldItemType !== 0) {
            
            // Aplicar la personalización
            applyCustomization(heldItemType);
            
            // Feedback Visual (Flash blanco en el cursor)
            if (cursor) {
                cursor.classList.add('success-action');
                setTimeout(() => cursor.classList.remove('success-action'), 500);
            }
            
            // Resetear estado (Soltar objeto)
            heldItemType = 0;
            
            // Limpiar timers de gestos por si acaso había uno a medias
            xGestureState = 0;
            clearTimeout(xGestureTimer);
        }
    });

    //Inicia la escena
    initThree();
});