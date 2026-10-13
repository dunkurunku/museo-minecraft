import * as THREE from 'three';
import * as TWEEN from 'tween';


/**
 * Clase Carousel
 * Gestiona la lógica de posicionamiento, animación e interacción de los modelos 3D.
 * Extiende EventTarget para emitir eventos personalizados hacia la UI.
 */
class Carousel extends EventTarget {
    constructor() {
        super();

        //Grupo principal. Su movimimiento emula el scroll horizontal.
        this.container = new THREE.Group();
        this.container.position.y = 0;

        this.objects = [];
        
        // Mapas para almacenar los estados originales de los objetos
        this.originalPositions = new Map();
        this.originalScales = new Map();
        this.originalRotations = new Map(); 
        this.originalMaterials = new Map();

        //Configuración del layout 
        this.itemSpacing = 10.0; //Espaciado del carrusel
        this.focusedObjectIndex = -1; //Índice del objeto enfocado actualmente
        this.isEnabled = false; //Controla si el carrusel responde a actualizaciones
    }

    /**
     * Inicializa el carrusel con los modelos proporcionados.
     */
    create(models) {
        this.objects = models;
        
        //Determinamos el ancho total para crear el grupo y los límites de scroll
        const totalWidth = (models.length - 1) * this.itemSpacing;
        const offset = totalWidth / 2;

        const maxScroll = offset;
        const minScroll = -offset;
        this.scrollBounds = { min: minScroll, max: maxScroll };

        //Posicionamiento inicial
        this.objects.forEach((model, index) => {
            this.container.position.x = offset;
            const x = (index * this.itemSpacing) - offset;
            const z = 0;

            const originalPos = new THREE.Vector3(x, 0, z);
            
            // Guardamos los datos originales
            this.originalPositions.set(model, originalPos);
            this.originalScales.set(model, model.scale.clone());
            this.originalRotations.set(model, model.rotation.clone()); 
            
            model.position.copy(originalPos);
            
            this.container.add(model);
        });
    }

    getObjects() { return this.objects; }

    getScrollBounds() {
        return this.scrollBounds;
    }

    /**
     * Calcula el objeto en el centro y aplica animaciones para resaltarlo.
     */
    update(camera) {
        if (!this.isEnabled) return;

        let closestObject = null;
        let minDistance = Infinity;
        let focusedIndex = -1;

        this.objects.forEach((object, index) => {
            //Calcula la distancia al centro
            const worldPosition = new THREE.Vector3();
            object.getWorldPosition(worldPosition);
            const distanceFromCenter = Math.abs(worldPosition.x);

            //Detectamos el objeto más cercano
            if (distanceFromCenter < minDistance) {
                minDistance = distanceFromCenter;
                closestObject = object;
                focusedIndex = index;
            }

            //Animación para resaltar el objeto cercano al centro, a medida que se acerca
            const focusWidth = 3.0;
            const progress = Math.pow(1 - Math.min(1, distanceFromCenter / focusWidth), 2);
            
            const targetZ = THREE.MathUtils.lerp(0, 2.5, progress);
            const targetScaleFactor = THREE.MathUtils.lerp(1.0, 1.5, progress);
            
            const baseScale = this.originalScales.get(object);
            const targetScale = new THREE.Vector3(
                baseScale.x * targetScaleFactor,
                baseScale.y * targetScaleFactor,
                baseScale.z * targetScaleFactor
            );

            // Aplicamos la animación de interpolación
            const animationSpeed = 0.1;
            object.position.z = THREE.MathUtils.lerp(object.position.z, targetZ, animationSpeed);
            object.scale.lerp(targetScale, animationSpeed);
        });

        // Gestiona el cambio de foco y emite eventos para actuar en consecuencia.
        if (minDistance > 0.5 && this.focusedObjectIndex !== -1) {
            this.focusedObjectIndex = -1;
            this.dispatchEvent(new CustomEvent('focusChanged', { detail: { focusedObject: null, index: -1 } }));
        } else if (this.focusedObjectIndex !== focusedIndex && minDistance <= 0.5) {
            this.focusedObjectIndex = focusedIndex;
            this.dispatchEvent(new CustomEvent('focusChanged', { detail: { focusedObject: closestObject, index: focusedIndex } }));
        }
    }

    /**
     * Anima la transición al modo detalle para el objeto seleccionado.
     */
    focusOn(selectedObject) {
        this.isEnabled = false; //Pausamos el carruselo para no interactuar durante la animación, ni en otra pantalla
        const animationDuration = 750;

        this.objects.forEach(object => {
            const baseScale = this.originalScales.get(object);

            if (object === selectedObject) {
                // Animación de entrada a detalle, lo traslada al centro de la pantalla y lo escala
                new TWEEN.Tween(object.position)
                    .to({ x: -this.container.position.x, y: 1.5, z: 4 }, animationDuration)
                    .easing(TWEEN.Easing.Quadratic.InOut)
                    .start();

                new TWEEN.Tween(object.scale)
                    .to({ x: baseScale.x * 1.8, y: baseScale.y * 1.8, z: baseScale.z * 1.8 }, animationDuration)
                    .easing(TWEEN.Easing.Quadratic.InOut)
                    .start();
            } else {
                // Animación de salida para los demás objetos, los aleja y reduce su escala
                const originalPos = this.originalPositions.get(object);
                
                new TWEEN.Tween(object.position)
                    .to({ x: originalPos.x, y: originalPos.y - 5, z: originalPos.z }, animationDuration)
                    .easing(TWEEN.Easing.Quadratic.In)
                    .start();
                    
                new TWEEN.Tween(object.scale)
                    .to({ x: 0.001, y: 0.001, z: 0.001 }, animationDuration)
                    .easing(TWEEN.Easing.Quadratic.In)
                    .onComplete(() => {
                        object.visible = false;
                    })
                    .start();
            }
        });
    }

    /**
     * Devuelve todos los objetos a su posición y rtotación original en el carrusel, para salir del modo detalle.
     */
    returnToGallery() {
        const animationDuration = 750;

        this.objects.forEach(object => {
            const originalPos = this.originalPositions.get(object);
            const originalScale = this.originalScales.get(object);
            const originalRot = this.originalRotations.get(object); // Recuperamos rotación
            
            object.visible = true;

            // Restaurar Posición
            new TWEEN.Tween(object.position)
                .to(originalPos, animationDuration)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();

            // Restaurar Escala
            new TWEEN.Tween(object.scale)
                .to(originalScale, animationDuration)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();

            //  Restaurar Rotación 
            new TWEEN.Tween(object.rotation)
                .to({ x: originalRot.x, y: originalRot.y, z: originalRot.z }, animationDuration)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();
        });
    }

    /**
     * Reactiva la interacción del carrusel después de salir del modo detalle.
     */
    enable() {
        this.returnToGallery();
        setTimeout(() => {
            this.isEnabled = true;
        }, 800);
    }
}

export default Carousel;