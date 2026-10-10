# Migración gradual a React y TypeScript

> Registro histórico de la primera etapa. El estado actual está en
> [MIGRACION-TYPESCRIPT-COMPLETA.md](MIGRACION-TYPESCRIPT-COMPLETA.md).
> Los scripts JavaScript que se mencionan aquí están archivados en `legacy/`.

## Primera etapa — 8 de octubre de 2026

Se incorporó React con TypeScript y Vite en las nueve páginas de FUTIN.
La interfaz compartida usa componentes reales con estado y eventos de React.
El contenido de cada pantalla y los motores de juego conservan su implementación
actual. Esta etapa no representa una conversión completa de todos los módulos.

### Apariencia

Se reutilizan todos los CSS, nombres de clase y recursos visuales. Las zonas de
montaje son el `aside.sidebar`, el `header.topbar` y `#futin-shell-root`.
El menú y la cabecera se generan en HTML desde sus componentes React antes de
iniciar desarrollo o compilar. React hidrata esas mismas zonas y el contenedor
de overlays, sin añadir contenedores que alteren el layout.

La configuración del tema sigue usando `futin-theme-v1`, con modo oscuro inicial
y opciones claro/oscuro/automático. Su inicializador se ejecuta antes del CSS.
El botón y su estado se renderizan en React; el evento `futin:themechange`
también actualiza el botón cuando el perfil cambia la preferencia.

### Responsabilidad de cada carpeta

| Archivo/carpeta | Responsabilidad |
| --- | --- |
| `src/components/` | Menú, cabecera, tema, notificaciones y mensajes |
| `src/domain/club.ts` | Contratos de datos compartidos |
| `src/compat/club-store.ts` | Adaptador a las APIs y eventos del juego existente |
| `src/compat/controllers.json` | Orden original de carga de cada página |
| `src/compat/runtime.ts` | Identifica la página actual para el menú de React |
| `src/ssr.tsx` y `scripts/render-shell.mjs` | Generan menú, cabecera, overlays y scripts ordenados |
| `scripts/render-artwork.mjs` | Genera las ilustraciones y cartas decorativas iniciales |
| `futin-ready.js` | Publica el evento de arranque tras los controladores |
| `src/navigation.css` | Desactiva capturas cruzadas de páginas durante la navegación |
| `vite.config.ts` | Compilación de nueve entradas y copia de recursos dinámicos |
| `capacitor.config.ts` | FUTIN, identificador provisional `com.futin.app`, directorio `dist` |
| `legacy/pre-react/` | Originales previos al cambio de HTML y scripts compartidos |

### Límite entre React y los controladores existentes

Los scripts anteriores no modifican descendientes de `[data-react-shell]`.
React actualiza sus componentes al recibir `futin:walletchange`,
`futin:profilechange`, `futin:notificationschange`, `futin:seasonpasschange`
y el evento de arranque `futin:ready`.

Los controladores de cada juego siguen siendo propietarios del resto del DOM.
Las notificaciones y el toast tienen una sola implementación, en React. El
adaptador `futin-shell.js` conserva los iconos y pestañas accesibles de las páginas.

Los scripts de cada página están en el HTML con `defer`: se descargan durante
el análisis del documento y se ejecutan en su orden original cuando el DOM está
disponible. No esperan a descargar React ni a hidratar sus tres zonas. El evento
`futin:ready` y la lectura al suscribirse mantienen actualizado el menú en ambos
órdenes de arranque. Los scripts se incluyen una sola vez.

La navegación mantiene enlaces `.html` y carga un nuevo documento por página.
Esto conserva el ciclo de vida de los juegos actuales y evita acumular listeners
o temporizadores al navegar. Una navegación SPA requerirá portar los controladores
y sus funciones de limpieza antes de cambiar este comportamiento.

### Guardado

React lee la economía, el perfil y el pase mediante las APIs existentes. No crea
un segundo saldo ni reemplaza las claves de `localStorage`. Las carreras,
colección, ajustes y monedas permanecen en el mismo navegador y origen.

Se conserva `http://127.0.0.1:8765` como dirección local. `localhost`, otro puerto
y una futura aplicación nativa tienen almacenamientos distintos: el progreso
no se transfiere automáticamente entre ellos. La sincronización entre web y app
necesitará cuentas/backend o una exportación/importación explícita de partidas.

### Compilación y recursos

`npm run build` ejecuta TypeScript y genera el resultado en `dist/`.
El plugin copia los recursos que los scripts resuelven con rutas dinámicas:
cartas, banderas, imágenes premium, SVG, sobres y controladores de carrera.
Los datos recopilados de jugadores y las copias anteriores no forman parte del
paquete de la aplicación.

Las fuentes Google conservan su enlace actual; esta etapa no implementa una PWA
ni garantiza funcionamiento totalmente sin conexión.

### Comprobaciones realizadas

- Compilación de producción y revisión de tipos de las nueve entradas.
- Inspección visual de Inicio y Mi equipo en el navegador local.
- Sin suites de pruebas automatizadas añadidas o ejecutadas.

### Próximas etapas

1. Portar una pantalla completa a componentes React, empezando por Mi equipo.
2. Extraer la economía y el guardado a módulos TypeScript conservando los formatos.
3. Portar carrera/minijuegos y separar renderizado, reglas de juego y almacenamiento.
4. Crear los proyectos nativos cuando se vaya a trabajar en la app móvil.
5. Incorporar cuentas y sincronización de progreso cuando se defina el backend.

Para Android, en esa futura etapa: instalar `@capacitor/android` de la misma
versión que `@capacitor/core`, ejecutar `npx cap add android`, compilar la web
y ejecutar `npm run cap:sync`. La compilación nativa necesita Android Studio/SDK.
Para iOS, los equivalentes requieren macOS y Xcode. La configuración actual por
sí sola no genera un APK ni una app publicable.

### Recuperación de la interfaz anterior

`legacy/pre-react/` conserva los nueve HTML originales y los scripts compartidos
modificados. Para recuperar esa versión, copiar esos archivos de vuelta a la
raíz, preservando los archivos actuales antes de hacerlo. Los recursos y motores
de las páginas no se modificaron en esta etapa.

`scripts/migrate-react-shell.mjs` registra la transformación inicial y rechaza
repetirla sobre páginas migradas. `scripts/finalize-react-shell.mjs` sincroniza
el inicializador de tema inline de los HTML y simplifica el adaptador anterior.

## Ajuste de fluidez de navegación

El menú de la primera etapa era un contenedor vacío hasta que terminaba de
descargarse y ejecutarse React. Además, el cargador esperaba a que terminara un
script para solicitar el siguiente. Ambas esperas se eliminaron:

- HTML inicial completo con el enlace activo de cada página.
- Hidratación del HTML existente mediante `hydrateRoot`, sin reconstruir el menú.
- Descarga paralela de controladores `defer` con ejecución ordenada.
- Ilustraciones premium y cartas decorativas reales incluidas en el HTML inicial.
- Actualizaciones de ilustraciones idempotentes, sin añadir una segunda copia.
- Navegación sin capturas superpuestas de la página anterior y la nueva. Se retiró
  el fundido entre documentos porque podía capturar un layout aún sin inicializar.
- Posición y tamaño de ilustraciones definidos por su clase, sin depender de que
  sean el último hijo de un encabezado.

Las mediciones de diagnóstico se exponen solo en desarrollo como atributos de
`html`: `data-futin-shell-ready-ms` (hidratación interactiva desde el inicio del
documento). `data-futin-controllers-ready` indica que acabó la cola de scripts.
El menú y las ilustraciones están presentes antes de la hidratación, en el HTML.

En una navegación local con recursos previamente cargados, los controladores
de Tienda pasaron de 50 ms a 5 ms. Es una observación de desarrollo, no una
garantía para conexiones reales ni una medición completa de todas las pantallas.
Se revisó Inicio ↔ Tienda con una consola nueva, sin errores de hidratación.
Ese tiempo corresponde al cargador anterior; el arranque actual usa `defer`.

Referencias de implementación: [hidratación de React](https://react.dev/reference/react-dom/client/hydrateRoot),
[orden de scripts](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement/async)
y [transiciones de páginas](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using).
