// Inicialización del objeto de estado global.
// Este objeto se adjunta a 'window' para ser accesible desde otros scripts, como 'main.js'.
// Actúa como una API simple que expone el estado traducido de la interacción del Leap Motion.
window.leapInput = {
    // Indica si hay al menos una mano activa detectada.
    isHandVisible: false,
    // Indica si se está realizando el gesto de pellizco (clic).
    isGrabbing: false,
    // Indica si el gesto personalizado de crafteo (pulgar mantenido) se ha activado.
    isCustomGestureActive: false,
    // Almacena las coordenadas normalizadas (-1 a 1) de la mano activa.
    cursorPosition: { x: 0, y: 0, z: 0 },
    // Indica si la mano izquierda está presente en el frame.
    isLeftHandVisible: false,
    // Indica si la mano derecha está presente en el frame.
    isRightHandVisible: false,
    // Almacena el tipo de la mano activa ('left', 'right' o 'Ninguna').
    activeHandType: 'Ninguna'
};


// Función para normalizar las coordenadas de la mano.
// Convierte la posición de la mano en milímetros, desde el sensor,
// a un espacio de coordenadas uniforme y predecible (de -1 a 1 en cada eje).
const normalizeCoordinates = (palmPosition) => {
    // Define una caja de interacción virtual sobre el sensor.
    // 'center' es el punto central del área activa en milímetros.
    // 'size' es el ancho, alto y profundidad de esta área.
    const interactionBox = {
        // El punto central del área de interacción en milímetros [x, y, z].
        center: [0, 200, 0],
        // El tamaño del área en milímetros [ancho, alto, profundidad].
        size: [300, 300, 200]
    };

    // Se calcula la posición relativa de la mano dentro de la caja de interacción.
    // El resultado se divide por la mitad del tamaño para mapearlo al rango [-1, 1].
    const x = (palmPosition[0] - interactionBox.center[0]) / (interactionBox.size[0] / 2);
    const y = (palmPosition[1] - interactionBox.center[1]) / (interactionBox.size[1] / 2);
    const z = (palmPosition[2] - interactionBox.center[2]) / (interactionBox.size[2] / 2);
    
    // Devuelve un objeto con las coordenadas limitadas entre -1 y 1.
    // Esto previene valores fuera de rango si la mano sale de la 'interactionBox'.
    return {
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
        z: Math.max(-1, Math.min(1, z)),
    };
};

// Función para detectar el gesto de pulgar arriba.
const detectThumbUpGesture = (hand) => {
    // Se buscan los cinco dedos en el objeto 'hand' proporcionado por la API.
    const thumb = hand.fingers.find(f => f.type === 0);
    const index = hand.fingers.find(f => f.type === 1);
    const middle = hand.fingers.find(f => f.type === 2);
    const ring = hand.fingers.find(f => f.type === 3);
    const pinky = hand.fingers.find(f => f.type === 4);

    // Se comprueba que todos los dedos han sido detectados para evitar errores.
    if (!thumb || !index || !middle || !ring || !pinky) {
        return false;
    }
    
    // La condición del gesto: el pulgar está extendido y los otros cuatro dedos no lo están.
    return thumb.extended && !index.extended && !middle.extended && !ring.extended && !pinky.extended;
};


// Bucle principal de Leap Motion, se ejecuta en cada frame que el sensor procesa.
Leap.loop((frame) => {
    // Se busca si hay una mano izquierda y una derecha en el frame actual.
    const leftHand = frame.hands.find(hand => hand.type === 'left');
    const rightHand = frame.hands.find(hand => hand.type === 'right');

    // Se actualiza el estado de visibilidad de cada mano.
    // El operador '!!' convierte el objeto (o undefined) en un booleano.
    window.leapInput.isLeftHandVisible = !!leftHand;
    window.leapInput.isRightHandVisible = !!rightHand;

    // Se establece una mano activa. Se da prioridad a la mano derecha.
    let activeHand = null;
    if (rightHand) {
        // Si la mano derecha existe, se asigna como activa.
        activeHand = rightHand;
    } else if (leftHand) {
        // Si no hay mano derecha, pero sí izquierda, se usa la izquierda.
        activeHand = leftHand;
    }

    // Se comprueba si se ha encontrado una mano activa.
    if (activeHand) {
        // Se actualizan los estados generales basados en la mano activa.
        window.leapInput.isHandVisible = true;
        window.leapInput.cursorPosition = normalizeCoordinates(activeHand.palmPosition);
        window.leapInput.isGrabbing = activeHand.pinchStrength > 0.85;
        window.leapInput.isCustomGestureActive = detectThumbUpGesture(activeHand);
        // Se guarda el tipo de la mano activa.
        window.leapInput.activeHandType = activeHand.type;
    } else {
        // Si no hay ninguna mano activa, se resetean todos los estados a sus valores por defecto.
        window.leapInput.isHandVisible = false;
        window.leapInput.isGrabbing = false;
        window.leapInput.isCustomGestureActive = false;
        window.leapInput.activeHandType = 'Ninguna';
    }
});