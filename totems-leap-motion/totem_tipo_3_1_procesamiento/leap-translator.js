/**
 * @file leap-translator.js
 * Versión mejorada con gesto de "Paz" y protección anti-clicks accidentales.
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
    // Caja de interacción virtual
    const interactionBox = {
        center: [0, 250, 0], // Ajustado verticalmente para comodidad
        size: [350, 350, 200]
    };
    
    const x = (palmPosition[0] - interactionBox.center[0]) / (interactionBox.size[0] / 2);
    const y = (palmPosition[1] - interactionBox.center[1]) / (interactionBox.size[1] / 2);
    
    return {
        x: Math.max(-1, Math.min(1, x)), // Clamp valores entre -1 y 1
        y: Math.max(-1, Math.min(1, y)),
    };
};

// Detectar gesto "V" (Paz/Victoria) para activar rotación
const detectRotationGesture = (hand) => {
    const index = hand.fingers[1];
    const middle = hand.fingers[2];
    const ring = hand.fingers[3];
    const pinky = hand.fingers[4];

    // Solo índice y corazón extendidos, resto cerrados
    const peaceFingersUp = index.extended && middle.extended;
    const othersDown = !ring.extended && !pinky.extended;

    return peaceFingersUp && othersDown;
};

Leap.loop((frame) => {
    const leftHand = frame.hands.find(h => h.type === 'left');
    const rightHand = frame.hands.find(h => h.type === 'right');
    // Prioridad a la mano derecha si ambas están presentes
    const activeHand = rightHand || leftHand;

    if (activeHand) {
        window.leapInput.isHandVisible = true;
        window.leapInput.cursorPosition = normalizeCoordinates(activeHand.palmPosition);
        window.leapInput.handRoll = activeHand.roll(); 
        window.leapInput.handPitch = activeHand.pitch();
        window.leapInput.palmVelocity = activeHand.palmVelocity;
        window.leapInput.activeHandType = activeHand.type;

        const isRotating = detectRotationGesture(activeHand);
        window.leapInput.isRotationGesture = isRotating;

        // Threshold alto (0.9) para evitar falsos clicks al mover la mano
        let isGrabbing = activeHand.grabStrength > 0.9;

        // Safety lock: Si estamos rotando, ignorar el grab para no clickar sin querer
        if (isRotating) {
            isGrabbing = false;
        }

        window.leapInput.isGrabbing = isGrabbing;

    } else {
        // Reset estado
        window.leapInput.isHandVisible = false;
        window.leapInput.isGrabbing = false;
        window.leapInput.isRotationGesture = false;
        window.leapInput.activeHandType = 'Ninguna';
        window.leapInput.handRoll = 0;
        window.leapInput.handPitch = 0;
    }
});