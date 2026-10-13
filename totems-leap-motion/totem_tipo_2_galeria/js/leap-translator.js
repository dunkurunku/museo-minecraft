/*
Archivo para facilitar la inter¡gración del Leap. General al resto de totems.
*/

/*
Estructura global para almacenar el estado de la mano detectada por Leap Motion
y poder acceder en cualquier momento.
*/
window.leapInput = {
    isHandVisible: false, // Mano detectada
    isGrabbing: false, // Mano cerrada
    isSpecialGesture: false, // Pulgar extendido
    cursorPosition: { x: 0, y: 0, z: 0 },  // Coordenadas normalizadas (-1 a 1)
    activeHandType: 'Ninguna',
    handRoll: 0, // Rotación de la muñeca
    handPitch: 0 // Inclinación de la muñeca
};

/**
 * Convierte la posición de la palma de la mano en coordenadas normalizadas 
 *entre -1 y 1 para su uso en la interfaz.
 */
const normalizeCoordinates = (palmPosition) => {
    const interactionBox = {
        center: [0, 250, 0], //centro de la caja
        size: [350, 350, 200] //Dimensiones de la zona activa
    };

    //Mapeo a coordenadas normalizadas
    const x = (palmPosition[0] - interactionBox.center[0]) / (interactionBox.size[0] / 2);
    const y = (palmPosition[1] - interactionBox.center[1]) / (interactionBox.size[1] / 2);

    // Limitar entre -1 y 1, las coordenadas devueltas
    return {
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
    };
};

/**
 * Detecta el gesto de pulgar extendido
 */
const detectThumbGesture = (hand) => {
    const thumb = hand.fingers[0];
    const index = hand.fingers[1];
    const middle = hand.fingers[2];
    const ring = hand.fingers[3];
    const pinky = hand.fingers[4];

    const thumbExtended = thumb.extended;
    const othersClosed = !index.extended && !middle.extended && !ring.extended && !pinky.extended;

    return thumbExtended && othersClosed;
};


// Bucle principal de Leap Motion
if (typeof Leap !== 'undefined') {
    Leap.loop((frame) => {
        // Selección de mano: Priorizamos la derecha, si no, usamos la izquierda.
        const leftHand = frame.hands.find(h => h.type === 'left');
        const rightHand = frame.hands.find(h => h.type === 'right');
        const activeHand = rightHand || leftHand;

        if (activeHand) {
            // Actualización del estado global con la mano activa
            window.leapInput.isHandVisible = true;
            window.leapInput.cursorPosition = normalizeCoordinates(activeHand.palmPosition);
            window.leapInput.activeHandType = activeHand.type;
            window.leapInput.handRoll = activeHand.roll();
            window.leapInput.handPitch = activeHand.pitch();

            //Detección de gestos
            const isSpecial = detectThumbGesture(activeHand);
            window.leapInput.isSpecialGesture = isSpecial;
            let isGrabbing = activeHand.grabStrength > 0.9;

            // Si el gesto especial está activo, no consideramos la mano como agarrando
            if (isSpecial) {
                isGrabbing = false;
            }

            window.leapInput.isGrabbing = isGrabbing;

        } else {
            // Reseteo si no hay mano detecatda
            window.leapInput.isHandVisible = false;
            window.leapInput.isGrabbing = false;
            window.leapInput.isSpecialGesture = false;
            window.leapInput.activeHandType = 'Ninguna';
            window.leapInput.handRoll = 0;
            window.leapInput.handPitch = 0;
        }
    });
} else {
    console.warn("LeapJS not loaded. Make sure to include the CDN in index.html");
}
