# FUTIN

Juego de fútbol web, con una migración gradual a React y TypeScript. Conserva
la identidad grafito/coral, las cartas y los recursos originales.

## Desarrollo

Requiere Node.js 22.12 o posterior. En este equipo se usó Node.js 24.16.

```powershell
npm ci
npm run dev
```

Abre **http://127.0.0.1:8765/**. El comando anterior
`node scripts/preview-server.cjs` también inicia Vite. Usa un solo servidor.
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
- TypeScript: componentes compartidos y contratos del perfil, progreso y saldo.
- Compatibilidad: los controladores de juego y el contenido de cada página
  siguen usando su HTML, CSS y JavaScript existentes.
- Capacitor: configuración preparada para empaquetar `dist/` como aplicación
  móvil. Todavía no se crearon proyectos Android/iOS.

Consulta [la guía de migración](docs/MIGRACION-REACT.md) para los límites de
cada componente, el guardado y los pasos futuros.

Los datos recopilados de las cinco ligas siguen en `data/big-five/` como fuente
separada. Su atribución está en `THIRD-PARTY-NOTICES.md`.
