# Migración de la lógica del juego a TypeScript

## Alcance

- Convertir todos los controladores, motores y utilidades activos a TypeScript.
- Incluir todo el código activo en la comprobación estricta de tipos.
- Compilar los módulos mediante Vite, con entradas por página y orden explícito.
- Mantener la identidad visual, los eventos y las claves/formatos de guardado.
- Conservar los originales históricos en Git, sin cargarlos en la aplicación.

## Orden de trabajo

1. Contratos de jugadores, cartas, economía y carrera; utilidades de DOM y datos.
2. Catálogo, formaciones, renderizador de cartas, economía y pase de temporada.
3. Plantilla, tienda, catálogo, inicio, perfil y monedero.
4. Motor de carrera, interfaz de carrera, penalti y trivia.
5. Herramientas de generación y configuración de compilación.
6. Retirar el cargador de JavaScript anterior y comprobar la compilación.

La conversión del lenguaje no cambia por sí sola el propietario del DOM de cada
pantalla: los componentes compartidos usan React y los controladores de juego
siguen gestionando sus escenas. Todos están escritos y comprobados en TypeScript.

## Estado completado — 9 de octubre de 2026

Toda la lógica activa y las herramientas están escritas en `.ts`/`.tsx`, incluidas
en `tsconfig.json` y comprobadas con `strict: true`. No se usaron `any`,
`@ts-nocheck`, `@ts-ignore` ni exclusiones de módulos para terminar la conversión.

| Ubicación | Responsabilidad |
| --- | --- |
| `src/domain/game.ts`, `career.ts`, `club.ts` | Jugadores, cartas, economía, partidas y estado compartido |
| `src/game/` | Controladores de las escenas y APIs del juego |
| `src/game/career/` | Calendario, simulación, formación, entrenamiento y guardado |
| `src/entries/` | Nueve entradas con dependencias ordenadas |
| `src/compat/game-api.d.ts` | Contratos de las APIs globales derivados de los módulos reales |
| `scripts/render-shell.ts`, `render-artwork.ts` | HTML inicial e ilustraciones con el mismo renderizador de cartas |
| `scripts/data/` | Recopilación de referencias y contratos de Wikipedia/Wikidata |
| `legacy/pre-typescript/` | Copia histórica de los scripts reemplazados |

El HTML usa una entrada compilada por página. Ya no hay una cadena de scripts
clásicos `.js` ni un cargador que inyecte esos archivos. El tema inicial se genera
desde una función TypeScript y se aplica antes del CSS para evitar un cambio
de color durante la carga. El tema interactivo se inicializa una sola vez.

El renderizador de cartas puede importarse desde Node sin crear un navegador
simulado: se utiliza el mismo código para las cartas iniciales y las dinámicas.

### Guardado y apariencia

Se conservan las claves y los formatos de `localStorage`, los IDs, los eventos,
las reglas de premios, las clases CSS y todos los recursos visuales. Las partidas
de carrera antiguas siguen pasando por su normalizador existente. Las copias
históricas y los datos de referencia no se distribuyen con la app.

### Comprobaciones

- `npm run typecheck`: correcto para aplicación, configuración y herramientas.
- `npm run build`: correcto; genera las nueve páginas y sus recursos.
- Inspección del arranque en el navegador local.
- No se añadieron ni ejecutaron suites de pruebas automatizadas.

### Desarrollo futuro

La migración del lenguaje está completa. La conversión de todas las escenas a
componentes React es un trabajo distinto: actualmente el shell usa React y las
escenas usan controladores TypeScript sobre su HTML. Para navegación SPA, estos
controladores necesitarán un ciclo de montaje y limpieza de listeners/timers.
Capacitor mantiene su configuración; Android/iOS y sincronización de cuentas
requieren sus respectivas etapas de implementación.
