# FUTIN

Juego de fútbol web con interfaz compartida en React y lógica en TypeScript. Conserva
la identidad grafito/coral, las cartas y los recursos originales.

## Desarrollo

Requiere Node.js 24 o posterior. En este equipo se usó Node.js 24.16.

```powershell
npm ci
npm run dev
```

Abre **http://127.0.0.1:8765/**. El comando anterior
`node scripts/preview-server.ts` también inicia Vite. Usa un solo servidor.
Las páginas necesitan este servidor: abrir el HTML directamente como archivo
no compila TypeScript.

## Compilación

```powershell
npm run typecheck
npm run build
npm run preview
```

`build` genera las nueve páginas y sus recursos en `dist/`. `preview` sirve
esa compilación; detén antes el servidor de desarrollo que ocupa el mismo puerto.
Antes de `dev` y `build`, se genera el HTML del menú y la cabecera desde sus
componentes React, para mostrarlos sin esperar a que JavaScript arranque.
Si cambias esos componentes durante una sesión ya abierta, ejecuta
`npm run shell:render` para actualizar también las copias HTML.

## Estado de la migración

- React: menú, cabecera, perfil del menú, saldo, avance del pase, tema,
  notificaciones y mensajes temporales.
- TypeScript: toda la lógica activa, incluidos jugadores, cartas, club, economía,
  pase, carrera, penalti, trivia y herramientas de generación/recopilación.
- Cada página carga una entrada de `src/entries/`. Vite compila esos módulos;
  todos se comprueban con `strict: true`, sin desactivar los errores de tipos.
- Las escenas conservan su HTML y CSS; sus controladores son módulos `.ts`.
  React gestiona el menú, la cabecera y los overlays compartidos.
- `legacy/` contiene copias históricas; no se cargan ni se incluyen en `dist/`.
- Capacitor: configuración preparada para empaquetar `dist/` como aplicación
  móvil. Todavía no se crearon proyectos Android/iOS.

Consulta [la migración completa del código a TypeScript](docs/MIGRACION-TYPESCRIPT-COMPLETA.md)
para la estructura, el guardado y las comprobaciones realizadas.

TypeScript se compila a JavaScript para ejecutarse en el navegador. Los `.js`
de `dist/` son resultado de compilación; se mantienen los `.ts` y `.tsx` fuente.

Las estadísticas de lenguajes de GitHub excluyen las copias de `legacy/` mediante
`.gitattributes`. HTML y CSS siguen contando porque forman parte de la aplicación.

Los datos recopilados de las cinco ligas siguen en `data/big-five/` como fuente
separada. Su atribución está en `THIRD-PARTY-NOTICES.md`.
