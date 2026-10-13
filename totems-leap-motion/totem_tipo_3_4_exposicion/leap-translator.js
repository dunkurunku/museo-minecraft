/**
 * @file leap-translator.js
 * Lógica de conexión con Leap Motion.
 * Detecta posición, gesto de rotación y agarre (puño).
 */

window.leapInput = {
    isHandVisible: false,
    isGrabbing: false,
    isRotationGesture: false,
    handRoll: 0,
    handPitch: 0,
    cursorPosition: { x: 0, y: 0, z: 0 },
    activeHandType: 'Ninguna'
};

const normalizeCoordinates = (palmPosition) => {
    // Ajustamos la caja de interacción para que sea cómodo frente a la pantalla
    const interactionBox = {
        center: [0, 250, 0], 
        size: [350, 350, 200]
    };
    const x = (palmPosition[0] - interactionBox.center[0]) / (interactionBox.size[0] / 2);
    const y = (palmPosition[1] - interactionBox.center[1]) / (interactionBox.size[1] / 2);
    return {
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
    };
};

const detectRotationGesture = (hand) => {
    const index = hand.fingers[1];
    const middle = hand.fingers[2];
    const ring = hand.fingers[3];
    const pinky = hand.fingers[4];

    // Gesto de "Paz" o "Victoria": Índice y corazón extendidos, resto cerrados
    const peaceFingersUp = index.extended && middle.extended;
    const othersDown = !ring.extended && !pinky.extended;

    return peaceFingersUp && othersDown;
};

// Asegúrate de cargar leapjs en el HTML antes que este script
if (window.Leap) {
    Leap.loop((frame) => {
        const leftHand = frame.hands.find(h => h.type === 'left');
        const rightHand = frame.hands.find(h => h.type === 'right');
        const activeHand = rightHand || leftHand; // Preferencia a la derecha

        if (activeHand) {
            window.leapInput.isHandVisible = true;
            window.leapInput.cursorPosition = normalizeCoordinates(activeHand.palmPosition);
            window.leapInput.handRoll = activeHand.roll();
            window.leapInput.handPitch = activeHand.pitch();
            window.leapInput.activeHandType = activeHand.type;

            // Detectar rotación
            const isRotating = detectRotationGesture(activeHand);
            window.leapInput.isRotationGesture = isRotating;

            // Detectar agarre (click)
            // Usamos un umbral alto (0.9) para evitar falsos positivos
            let isGrabbing = activeHand.grabStrength > 0.9;

            // Exclusión mutua: Si rotas, no puedes hacer click
            if (isRotating) {
                isGrabbing = false;
            }
            window.leapInput.isGrabbing = isGrabbing;

        } else {
            window.leapInput.isHandVisible = false;
            window.leapInput.isGrabbing = false;
            window.leapInput.isRotationGesture = false;
        }
    });
}