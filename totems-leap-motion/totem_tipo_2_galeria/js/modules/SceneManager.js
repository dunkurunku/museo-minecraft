// Importamos el núcleo de Three.js
import * as THREE from 'three';

/**
 * Clase SceneManager
 * Motor gráfico encapsulado. Configura y administra el ciclo de vida de los componentes
 * core de Three.js (Escena, Cámara, Renderizador, Luces).
 * Actúa como la capa de abstracción entre la lógica de la app y el WebGL.
 */
class SceneManager {
    
    constructor(canvas) {
        // Guardamos las dimensiones de la pantalla para usarlas en la cámara y el renderizador.
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas = canvas;

        // Inicializamos los componentes principales de Three.js.
        this._createScene();
        this._createCamera();
        this._createRenderer();
        this._createLights();

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    // --- MÉTODOS DE INICIALIZACIÓN PRIVADOS ---

    /**
     * Crea la escena 3D.
     */
    _createScene() {
        this.scene = new THREE.Scene();
        // Hacemos que el fondo de la escena coincida con el del body para una integración perfecta.
		this.scene.background = null;
    }

    /**
     * Crea y posiciona la cámara.
     */
    _createCamera() {
        // Usamos una PerspectiveCamera, que simula la visión del ojo humano.
        const fov = 50; // Campo de visión (Field of View).
        const aspect = this.width / this.height; // Relación de aspecto .
        const near = 0.1; // Plano de corte cercano. 
        const far = 1000; // Plano de corte lejano.

        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

        // Posicionamos la cámara. La desplazamos un poco hacia atrás para ver la escena completa.
        this.camera.position.set(0, 0, 50);
        this.camera.lookAt(new THREE.Vector3(0, -1.5, 0));
    }


    /**
     * Crea el renderizador y lo vincula al canvas.
     */
    _createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true, // Suaviza los bordes de los objetos.
            alpha: true // Permite transparencias en el canvas.
        });
        
        // Establecemos el tamaño del renderizador.
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    /**
     * Configura el esquema de iluminación global.
     */
    _createLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); 
        directionalLight.position.set(5, 10, 7); 
        this.scene.add(directionalLight);
    }


    // --- MÉTODOS PÚBLICOS ---

    /**
     * Agrega un objeto 3D a la escena.
     */
    add(object) {
        this.scene.add(object);
    }

    /**
     * Renderiza un único fotograma de la escena.
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
     /**
     * Hace visible el canvas 3D con una transición suave.
     */
    showScene() {
        this.canvas.classList.add('visible');
    }

    /**
     * Oculta el canvas 3D con una transición suave.
     */
    hideScene() {
        this.canvas.classList.remove('visible');
    }
    
    /**
     * Recalcula la matriz de proyeccion
     */
    onWindowResize() {
        this.width = window.innerWidth; 
        this.height = window.innerHeight; 

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix(); 

        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
}

// Exportamos la clase para que pueda ser importada desde main.js
export default SceneManager;
