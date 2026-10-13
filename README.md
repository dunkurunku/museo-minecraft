# Museo interactivo inspirado en Minecraft

Proyecto de la asignatura Nuevos Paradigmas de Interacción (Grado en Ingeniería Informática, Universidad de Granada). Un museo temático de Minecraft en el que el visitante interactúa sin tocar nada: los tótems de las salas se manejan con las manos mediante un sensor Leap Motion, y una app Android acompaña la visita con un escáner de códigos QR, inventario, logros y avatar.

Trabajo en grupo. **Mi parte:** el tótem de procesamiento (horno y yunque), el tótem de exposición con el armor stand y todos los modelos 3D del proyecto, tanto los de los tótems como los de la app Android.

## Vídeo de demostración

[Ver el vídeo promocional (3 min, versión web)](media/demo.mp4) · la versión en 1080p está en la sección *Releases* del repositorio.

## Tótems con Leap Motion (`totems-leap-motion/`)

Aplicaciones web en HTML, CSS y JavaScript que se ejecutan a pantalla completa en cada tótem. El sensor Leap Motion se lee con `leap.js` y un módulo propio, `leap-translator.js`, traduce las manos detectadas a una interfaz simple que el resto del código consume como si fuera un ratón:

- Posición de la palma normalizada a un espacio de -1 a 1 dentro de una caja de interacción virtual.
- Gesto de pellizco como clic y un gesto propio (pulgar mantenido) para crafteo.
- Detección de mano izquierda o derecha y de ausencia de manos, para volver a la pantalla de reposo.

| Carpeta | Tótem |
|---|---|
| `prototipo_integracion_leap/` | Prototipo mínimo: cursor 3D con three.js movido por la mano. |
| `totem_tipo_2_galeria/` | Galería de piezas con navegación gestual. |
| `totem_tipo_3_1_procesamiento/` | **Sala de procesamiento (mío):** el visitante lleva cada material en bruto al horno o al yunque según corresponda y obtiene el producto, con el modelo 3D de cada pieza. |
| `totem_tipo_3_2_construccion/` | Sala de construcción con modelos 3D. |
| `totem_tipo_3_3_personalizacion/` | Personalización del avatar con texturas. |
| `totem_tipo_3_4_exposicion/` | **Sala de exposición (mío):** un armor stand en 3D sobre el que se montan, pieza a pieza, la armadura y las herramientas creadas durante la visita, con variantes personalizadas. |

Los tótems de la línea 3 se encadenan entre sí mediante ficheros de entrada y salida (`entrada.txt`, `salida.txt`), de modo que lo que el visitante obtiene en una sala está disponible en la siguiente.

**Ejecutar:** sirve la carpeta del tótem con cualquier servidor estático (por ejemplo `python3 -m http.server` dentro de la carpeta) y abre `index.html`. Para usar el sensor hace falta el software de Leap Motion con el servicio WebSocket activo; sin sensor, varios tótems admiten ratón.

## App Android (`app-android/`)

App nativa en Kotlin que acompaña al visitante:

- **Escáner QR** con CameraX y ML Kit para identificar las piezas del museo.
- **Inventario** de materiales obtenidos y **minado** de recursos con animación y sonido.
- **Modelos 3D** de las piezas con SceneView (modelos preparados por mí).
- **Logros** desbloqueables, **avatar** personalizable y perfil.
- Interfaz en español e inglés, arquitectura con fragmentos, Navigation y ViewModel.

**Compilar:** abre `app-android/` en Android Studio y ejecuta en un dispositivo con cámara (API 24 o superior).

## Recursos de terceros

Los modelos 3D proceden de Sketchfab y conservan su licencia junto a cada modelo (ver `CREDITS.md`). Minecraft es una marca de Mojang Studios; este es un proyecto académico sin ánimo de lucro y sin relación con Mojang ni Microsoft.

El código propio se publica bajo licencia MIT.

---

## English summary

Interactive Minecraft-themed museum built for the Human-Computer Interaction course (Computer Engineering, University of Granada). Touchless exhibit kiosks driven by a Leap Motion sensor (HTML, JavaScript, three.js, with a custom hand-to-cursor translation layer) and a companion Android app in Kotlin (QR scanner with CameraX and ML Kit, inventory, achievements, 3D models with SceneView, bilingual UI with Navigation and ViewModel). Group project; my part was the furnace/anvil processing kiosk, the armor-stand exhibition kiosk and all the 3D models. Own code under the MIT licence; 3D assets from Sketchfab with their original licences.
