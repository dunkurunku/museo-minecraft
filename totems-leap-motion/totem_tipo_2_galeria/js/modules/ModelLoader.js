import * as THREE from 'three';

/**
 * Clase ModelLoader
 * Gestor de carga de activos 3D. 
 * Asegura que todos los modelos tengan el mismo tamaño relativo y
 * el mismo punto de pivote, independientemente de cómo fueron exportados.
 */
class ModelLoader {
    /**
     * @param {GLTFLoader} loader - Una instancia del GLTFLoader de Three.js.
     */
    constructor(loader) {
        this.loader = loader;
    }

    /**
     * Carga todos los modelos definidos en el array de datos de assets.
     * */
    async load(assetData) {
        // Creamos un array de promesas, donde cada promesa es la carga de un modelo.
        const promises = assetData.map(data => this._loadSingleModel(data));

        // Promise.all espera a que todas las promesas individuales se completen.
        // Esto permite cargar todos los modelos en paralelo, lo cual es mucho más rápido.
        try {
            const models = await Promise.all(promises);
            return models;
        } catch (error) {
            console.error("Error al cargar uno o más modelos:", error);
            return []; 
        }
    }

 
    /**
     * Carga un modelo, corrige su pivote geométrico y normaliza su escala.
     * Utiliza la técnica de "Grupo Pivote" para garantizar la rotación centrada.
     */
    _loadSingleModel(data) {
        return new Promise((resolve) => {
            this.loader.load(
                data.modelPath,
                (gltf) => {
                    const rawModel = gltf.scene;
                    rawModel.name = data.id + "_mesh"; // Nombre interno

                    // --- CÁLCULO DEL CENTRO GEOMÉTRICO REAL ---
                    const box = new THREE.Box3().setFromObject(rawModel);
                    const size = new THREE.Vector3();
                    const center = new THREE.Vector3();
                    
                    box.getSize(size);   // Tamaño total (Ancho, Alto, Profundo)
                    box.getCenter(center); // El punto central exacto de la geometría

                    // --- RECENTRADO ---
                    // Movemos el modelo en dirección opuesta a su centro.
                    // Si el centro estaba en (10, 5, 0), lo movemos a (-10, -5, 0).
                    // Ahora el centro visual del modelo está en el (0,0,0) local.
                    rawModel.position.x = -center.x;
                    rawModel.position.y = -center.y;
                    rawModel.position.z = -center.z;

                    // --- CREACIÓN DEL GRUPO PIVOTE ---
                    // Creamos un contenedor vacío. Este contenedor estará en (0,0,0).
                    //Movemos el grupo en lugar del modelo
                    const pivotGroup = new THREE.Group();
                    pivotGroup.add(rawModel);
                    pivotGroup.name = data.id; // El ID importante va al grupo

                    // --- NORMALIZACIÓN DE ESCALA ---
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const desiredSize = 5; // Tamaño estándar para el carrusel
                    const scale = desiredSize / maxDim;
                    
                    // Escalamos el GRUPO, no el modelo interno
                    pivotGroup.scale.set(scale, scale, scale);

                    // --- ORIENTACIÓN ESTÁNDAR ---
                    // Aplicamos una rotación suave en Y para que se vean en perspectiva (isométrico).
                    pivotGroup.rotation.set(0, Math.PI / 4, 0); 

                    resolve(pivotGroup);
                },
                undefined,
                // Manejo de errores (Cubo rojo de seguridad)
                (error) => {
                    console.warn('No se encontró: ${data.modelPath}. Usando placeholder.');
                    
                    const geometry = new THREE.BoxGeometry(5, 5, 5);
                    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
                    const errorGroup = new THREE.Mesh(geometry, material);
                    errorGroup.name = data.id;
                    
                    resolve(errorGroup); 
                }
            );
        });
    }
}

// Exportamos la clase para que pueda ser importada desde main.js
export default ModelLoader;
