// Creación de la escena, que es el contenedor principal de todos los objetos 3D.
const scene = new THREE.Scene();
// Creación de la cámara de perspectiva, que define el punto de vista del espectador.
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Creación del renderizador WebGL, que dibujará la escena en un elemento canvas.
// 'antialias: true' se activa para suavizar los bordes de los objetos renderizados.
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Se establece el tamaño del canvas del renderizador para que coincida con el tamaño de la ventana del navegador.
renderer.setSize(window.innerWidth, window.innerHeight);
// Se añade el elemento canvas al cuerpo del documento HTML para que sea visible.
document.body.appendChild(renderer.domElement);
// Se establece la posición de la cámara en el eje Z para alejarla del origen y poder ver la escena.
camera.position.z = 5;

// Se obtiene una referencia al elemento del DOM con el id 'info-box'.
// Este elemento se usará para mostrar información de estado al usuario.
const infoBox = document.getElementById('info-box');


// Función que construye y devuelve el objeto 3D que se usará como cursor.
function createCursor() {
    // Se crea un 'Group' para que las dos barras de la cruz se puedan tratar como un único objeto.
    const cursorGroup = new THREE.Group();
    
    // Se define un material básico de color blanco.
    // 'depthTest: false' es una propiedad crucial que asegura que el cursor siempre se dibuje
    // por encima de cualquier otro objeto en la escena, sin importar su profundidad.
    const cursorMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        depthTest: false
    });
    
    // Se definen las geometrías de las dos cajas delgadas que formarán la cruz.
    const horizGeom = new THREE.BoxGeometry(0.25, 0.03, 0.03);
    const vertGeom = new THREE.BoxGeometry(0.03, 0.25, 0.03);
    
    // Se crean los objetos 'Mesh' combinando las geometrías con el material.
    const horizBar = new THREE.Mesh(horizGeom, cursorMaterial);
    const vertBar = new THREE.Mesh(vertGeom, cursorMaterial);
    
    // Se añaden ambas barras al grupo.
    cursorGroup.add(horizBar);
    cursorGroup.add(vertBar);
    
    // Se establece que el cursor sea invisible por defecto.
    cursorGroup.visible = false;
    
    // Se le asigna una prioridad de renderizado alta para reforzar que se dibuje al final.
    cursorGroup.renderOrder = 999;

    // Se devuelve el grupo que contiene el cursor completo.
    return cursorGroup;
}

// Se llama a la función para crear el cursor.
const cursor = createCursor();
// Se añade el cursor a la escena principal.
scene.add(cursor);


// Bucle de animación principal que se ejecuta en cada fotograma.
function animate() {
    // Se solicita al navegador que vuelva a llamar a esta función en el próximo frame.
    requestAnimationFrame(animate);

    // Se comprueba si el objeto del traductor y una mano visible existen.
    if (window.leapInput && window.leapInput.isHandVisible) {
        // Si hay una mano, se hace visible el cursor y el cuadro de información.
        cursor.visible = true;
        infoBox.style.display = 'block';

        // Se calcula el alto y el ancho visibles de la escena a la profundidad de la cámara.
        // Esto es necesario para mapear las coordenadas normalizadas al espacio del mundo 3D.
        const viewHeight = 2 * Math.tan((camera.fov * Math.PI) / 180 / 2) * camera.position.z;
        const viewWidth = viewHeight * camera.aspect;
        
        // Se actualiza la posición del cursor en el espacio 3D.
        // Se multiplican las coordenadas normalizadas (-1 a 1) por la mitad del tamaño visible.
        cursor.position.x = window.leapInput.cursorPosition.x * (viewWidth / 2);
        cursor.position.y = window.leapInput.cursorPosition.y * (viewHeight / 2);
        // Se mantiene una posición Z constante para que el cursor parezca estar en un plano 2D.
        cursor.position.z = 1;

        // Se preparan los datos del estado del Leap para mostrarlos.
        // '.toFixed(2)' formatea los números para que tengan solo dos decimales.
        const posX = window.leapInput.cursorPosition.x.toFixed(2);
        const posY = window.leapInput.cursorPosition.y.toFixed(2);
        // Se usa un operador ternario para convertir los booleanos a cadenas de texto legibles.
        const grabbingStatus = window.leapInput.isGrabbing ? 'Sí' : 'No';
        const gestureStatus = window.leapInput.isCustomGestureActive ? 'Sí' : 'No';
        const leftHandStatus = window.leapInput.isLeftHandVisible ? 'Detectada' : 'No Detectada';
        const rightHandStatus = window.leapInput.isRightHandVisible ? 'Detectada' : 'No Detectada';
        
        // Se formatea el nombre de la mano activa para que empiece con mayúscula.
        let activeHandName = window.leapInput.activeHandType;
        activeHandName = activeHandName.charAt(0).toUpperCase() + activeHandName.slice(1);

        // Se construye el contenido HTML del cuadro de información y se actualiza.
        infoBox.innerHTML = `
                           Posición X: ${posX}<br>
                           Posición Y: ${posY}<br>
                           Agarrando: ${grabbingStatus}<br>
                           Gesto Especial: ${gestureStatus}<br>
                           Mano Izquierda: ${leftHandStatus}<br>
                           Mano Derecha: ${rightHandStatus}<br>
                           Mano Activa: ${activeHandName}</b>
                           `;

    } else {
        // Si no se detecta ninguna mano, se oculta el cursor 3D.
        cursor.visible = false;
        // Se mantiene visible el cuadro de información para indicar el estado.
        infoBox.style.display = 'block';
        // Se actualiza el texto para informar que no se detecta ninguna mano.
        infoBox.innerHTML = `Mano no detectada.`;
    }

    // Se le ordena al renderizador que dibuje la escena con la cámara actual.
    renderer.render(scene, camera);
}

// Se llama a la función 'animate' por primera vez para iniciar el bucle de renderizado.
animate();

// Se añade un 'listener' que se activará cada vez que la ventana del navegador cambie de tamaño.
window.addEventListener('resize', () => {
    // Se actualiza la relación de aspecto de la cámara para evitar que la escena se deforme.
    camera.aspect = window.innerWidth / window.innerHeight;
    // Se notifica a la cámara que sus propiedades han cambiado.
    camera.updateProjectionMatrix();
    // Se ajusta el tamaño del renderizador para que coincida con el nuevo tamaño de la ventana.
    renderer.setSize(window.innerWidth, window.innerHeight);
});