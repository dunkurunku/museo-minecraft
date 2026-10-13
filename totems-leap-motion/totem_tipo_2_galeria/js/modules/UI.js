//Textos estáticos bilingües para la interfaz de usuario
const TEXTS = {
    es: {
        galleryInstruction: "Mueve la mano para explorar",
        tabGeneral: "General",
        tabTechnical: "Técnica",
        tabHistory: "Historia",
        backButton: "← Volver a la Galería"
    },
    en: {
        galleryInstruction: "Move your hand to explore",
        tabGeneral: "General",
        tabTechnical: "Technical",
        tabHistory: "History",
        backButton: "← Back to Gallery"
    }
};


/**
 * Clase UI (User Interface)
 * Gestiona todas las interacciones con los elementos del HTML
 */
class UI extends EventTarget {
    constructor() {
        super();

        // --- BÚSQUEDA DE ELEMENTOS DEL DOM ---
        // Buscamos todos los elementos que vamos a necesitar una sola vez
        // y los guardamos como propiedades de la clase para un acceso rápido.
        this.idleScreen = document.getElementById('idle-screen');
        this.galleryUI = document.getElementById('gallery-ui');
        this.detailViewUI = document.getElementById('detail-view-ui');
        
        //Elementos dinámicos
		this.objectLabel = this.galleryUI.querySelector('.object-label');
		this.homeButton = document.getElementById('home-button');
        this.objectTitle = this.detailViewUI.querySelector('.object-title');

        //Componentes de la ficha de detalle
        this.descriptionBox = this.detailViewUI.querySelector('.description-box');
        this.descriptionTabs = this.detailViewUI.querySelectorAll('.tab-button');
        this.descriptionTexts = this.detailViewUI.querySelectorAll('.description-text');
        this.backButton = document.getElementById('back-button');

        // --- CONFIGURACIÓN INICIAL ---
        // Configuramos los listeners para los eventos del usuario.
        this._setupEventListeners();

        //Para la descripcion
        this.visibleTabs = [];
    }

    /**
     * Configura todos los 'addEventListener' para los elementos de la interfaz.
     */
    _setupEventListeners() {
        // Cuando se haga clic en la pantalla de descanso
        this.idleScreen.addEventListener('click', () => {
              event.stopPropagation();
            this.dispatchEvent(new CustomEvent('idleScreenClick'));
        });

        // Cuando se haga clic en el botón de volver
        this.backButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('backButtonClick'));
        });
		
        // Cuando se haga clic en el botón de inicio
		this.homeButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('homeButtonClick'));
        });
        // Para cada una de las pestañas de descripción (General, Técnica, Historia)...
        this.descriptionTabs.forEach(tab => {
            tab.addEventListener('click', (event) => this._onTabClick(event));
        });
    }

     /**
     * Configura qué pestañas de descripción son visibles basándose en el modo.
     * @param {number} mode - 0: todas, 1: General, 2: Técnica, 3: Historia.
     */
    setupDescriptionTabs(mode) {
        // Ocultamos todas las pestañas para empezar de cero.
        this.descriptionTabs.forEach(tab => tab.style.display = 'none');
        
        // Usamos un switch para decidir qué mostrar.
        switch (mode) {
            case 1: // Solo General
                this.descriptionTabs[0].style.display = 'block';
                this.visibleTabs = [this.descriptionTabs[0]];
                break;
            case 2: // Solo Técnica
                this.descriptionTabs[1].style.display = 'block';
                this.visibleTabs = [this.descriptionTabs[1]];
                break;
            case 3: // Solo Historia
                this.descriptionTabs[2].style.display = 'block';
                this.visibleTabs = [this.descriptionTabs[2]];
                break;
            case 0: // Todas (por defecto)
            default:
                this.descriptionTabs.forEach(tab => tab.style.display = 'block');
                // Convertimos el NodeList a un Array para guardarlo.
                this.visibleTabs = Array.from(this.descriptionTabs);
                break;
        }

        // Si solo hay una pestaña visible, le quitamos el borde para que no parezca un botón.
        if (this.visibleTabs.length === 1) {
            const tabsContainer = this.descriptionBox.querySelector('.tabs');
            tabsContainer.style.borderBottom = '1px solid rgba(0, 0, 0, 0.1)';
            this.visibleTabs[0].style.borderBottom = 'none';
            this.visibleTabs[0].style.cursor = 'default';
        }
    }

    /**
     * Renderiza la vista de detalle con la información del objeto seleccionado.
     */
    showDetailView(objectData) {
        // USAMOS this.currentLang (que definimos en setLanguage)
        const lang = this.currentLang || 'es'; 

        this.objectTitle.textContent = objectData.name[lang];
        this.descriptionTexts.forEach(textEl => {
            const level = textEl.dataset.level;//Seleccion de tipo de descripcion
            // Verificamos si existe la traducción para evitar errores
            if (objectData.description[lang] && objectData.description[lang][level]) {
                textEl.textContent = objectData.description[lang][level];
            } else {
                textEl.textContent = "Error";
            }
        });

        // Activamos la primera pestaña visible por defecto 
        if (this.visibleTabs.length > 0) {
            this._onTabClick({ currentTarget: this.visibleTabs[0] });
        }
        this.idleScreen.classList.remove('active');
        this.galleryUI.classList.remove('active');
        this.detailViewUI.classList.add('active');
    }



    /**
     * Maneja el clic en una de las pestañas de descripción.
     */
    _onTabClick(event) {
        const clickedTab = event.currentTarget;
        const levelToShow = clickedTab.dataset.level;

        // Quitar la clase 'active' de todas las pestañas.
        this.descriptionTabs.forEach(tab => tab.classList.remove('active'));
        // Añadir la clase 'active' solo a la pestaña en la que se hizo clic.
        clickedTab.classList.add('active');
        // Ocultar todos los textos de descripción.
        this.descriptionTexts.forEach(text => text.style.display = 'none');
        // Mostrar solo el texto de descripción correspondiente al nivel de la pestaña.
        const textToShow = this.descriptionBox.querySelector(`.description-text[data-level="${levelToShow}"]`);
        if (textToShow) {
            textToShow.style.display = 'block';
        }
    }

    // --- MÉTODOS PÚBLICOS PARA CONTROLAR LA VISIBILIDAD ---

    /**
     * Establece el idioma de la interfaz estática.
     * @param {string} lang - 'es' o 'en'.
     */
    setLanguage(lang) {
        this.currentLang = lang; // Guardamos el idioma actual para usarlo luego
        const t = TEXTS[lang];   // Seleccionamos los textos del diccionario

        // Actualizamos textos fijos del DOM usando los IDs que pusimos en el HTML
        if (document.getElementById('gallery-instruction'))
            document.getElementById('gallery-instruction').textContent = t.galleryInstruction;
            
        if (document.getElementById('tab-general'))
            document.getElementById('tab-general').textContent = t.tabGeneral;
            
        if (document.getElementById('tab-technical'))
            document.getElementById('tab-technical').textContent = t.tabTechnical;
            
        if (document.getElementById('tab-history'))
            document.getElementById('tab-history').textContent = t.tabHistory;

        if (this.backButton)
            this.backButton.textContent = t.backButton;
    }

    /**
     * Muestra la pantalla de descanso y oculta las demás vistas.
     */
    showIdleScreen() {
        this.idleScreen.classList.add('active');
        this.galleryUI.classList.remove('active');
        this.detailViewUI.classList.remove('active');
    }

    /**
     * Muestra la interfaz de la galería y oculta las demás.
     */
    showGalleryView() {
        this.idleScreen.classList.remove('active');
        this.galleryUI.classList.add('active');
        this.detailViewUI.classList.remove('active');
    }
    
    /**
    * Actualiza la posicion y texto de la etiqueta del objeto en la vista de galería.
    */
    updateObjectLabel(text, screenPosition) {
        if (text && screenPosition) {
            this.objectLabel.textContent = text;
            this.objectLabel.style.left = `${screenPosition.x}px`;
            this.objectLabel.style.top = `${screenPosition.y}px`;
            this.objectLabel.classList.add('visible');
        } else {
            this.objectLabel.classList.remove('visible');
        }
    }

    
}

// Exportamos la clase para que pueda ser importada desde main.js
export default UI;
