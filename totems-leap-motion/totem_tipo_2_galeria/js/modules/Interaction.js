import * as THREE from 'three';

/**
 * Clase Interaction 
 * Gestiona la navegación por arrastre y la selección de objetos mediante Raycasting.
 * Actúa como sistema de respaldo al control por gestos.
 */
class Interaction extends EventTarget {
    constructor(camera, canvas, carouselContainer) {
        super();

        // Referencias a la cámara, el canvas y el contenedor del carrusel.
        this.camera = camera;
        this.canvas = canvas;
        this.carouselContainer = carouselContainer;

        // Raycaster y variables para la interacción.
        this.raycaster = new THREE.Raycaster(); //Detecta clicks en objetos 3D
        this.mouse = new THREE.Vector2(); //Posición del ratón normalizada
        this.selectableObjects = [];
        this.selectedObject = null;
        this.currentMode = null;
        this.scrollBounds = null; // Límites de desplazamiento del carrusel
        this.focusedObject = null;

        this.isDragging = false;
        this.previousMousePosition = { x: 0 };

        this._setupEventListeners();
    }


    /**
     * Configura los event listeners para la interacción del usuario.
     */
    _setupEventListeners() {
        // Escuchamos en 'document' para una captura garantizada, a diferencia de canvas.
        document.addEventListener('mousedown', this._onMouseDown.bind(this));
        document.addEventListener('mousemove', this._onMouseMove.bind(this));
        document.addEventListener('mouseup', this._onMouseUp.bind(this));
        document.addEventListener('mouseleave', this._onMouseUp.bind(this));
        // El 'click' también lo dejamos en document por consistencia.
        document.addEventListener('click', this._onClick.bind(this));
    }

    _onMouseDown(event) {
        this.isDragging = true;
        this.previousMousePosition.x = event.clientX;
    }

    _onMouseUp() {
        // Simplemente detenemos el arrastre.
        this.isDragging = false;
    }

    /**
     * Maneja el evento de movimiento del ratón para desplazar el carrusel o rotar el objeto seleccionado.
     */
    _onMouseMove(event) {
        // Si no estamos arrastrando, no hacemos nada.
        if (!this.isDragging || !this.scrollBounds) return;

        const deltaX = event.clientX - this.previousMousePosition.x;

        // Si estamos en modo galería, movemos el carrusel.
        if (this.currentMode === 'GALLERY') {
            let newPositionX = this.carouselContainer.position.x + deltaX * 0.02;

            // No puede moverse más de los límites establecidos.
            newPositionX = Math.max(this.scrollBounds.min, Math.min(this.scrollBounds.max, newPositionX));
            this.carouselContainer.position.x = newPositionX;

        // Si estamos en modo detalle, rotamos el objeto seleccionado.
        } else if (this.currentMode === 'DETAIL' && this.selectedObject) {
            this.selectedObject.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), deltaX * 0.01);
        }

        this.previousMousePosition.x = event.clientX;
    }

    /**
     * Maneja el evento de clic para seleccionar un objeto en modo galería.
     */
    _onClick(event) {
        if (this.currentMode !== 'GALLERY') return;
        // Comprobamos si hay un objeto en foco y si el clic fue dentro del canvas
        if (!this.focusedObject) return;

        // Comprobamos si el clic fue aproximadamente sobre el objeto enfocado.
        // Esto evita que un clic en una esquina vacía de la pantalla active la transición.
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        // Lanzamos el rayo solo contra el objeto que nos interesa.
        const intersects = this.raycaster.intersectObject(this.focusedObject, true);

        if (intersects.length > 0) {
            // Si el rayo impacta, disparamos el evento.
            console.log(`Objeto seleccionado: ${this.focusedObject.name}`);
            this.dispatchEvent(new CustomEvent('objectSelected', {
                detail: { object: this.focusedObject }
            }));
        }
    }

    setFocusedObject(object) {
        this.focusedObject = object;
    }
    setScrollBounds(bounds) {
        this.scrollBounds = bounds;
    }
    setSelectableObjects(objects) { this.selectableObjects = objects; }
    enableCarouselMode() { this.currentMode = 'GALLERY'; this.selectedObject = null; }
    enableDetailMode(object) { this.currentMode = 'DETAIL'; this.selectedObject = object; }
}

export default Interaction;
