import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { artworkRenderer } from './render-artwork.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = JSON.parse(await readFile(resolve(root, 'src/compat/controllers.json'), 'utf8'));
const renderArtwork = await artworkRenderer(root);
// Compile the small renderer to native Node ESM. This also avoids relying on a
// dev-server module runner to load React's CommonJS server package on Windows.
await build({
  root, configFile: false, plugins: [react()], logLevel: 'warn',
  build: {
    ssr: resolve(root, 'src/ssr.tsx'), outDir: '.futin-build', emptyOutDir: false,
    rolldownOptions: {
      external: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime'],
      output: { entryFileNames: 'shell.mjs' },
    },
  },
});

  const { renderShell } = await import(pathToFileURL(resolve(root, '.futin-build/shell.mjs')).href);
  for (const [page, scripts] of Object.entries(pages)) {
    const file = resolve(root, `${page}.html`);
    let html = renderArtwork(await readFile(file, 'utf8')).replaceAll('futin-premium.css?v=11', 'futin-premium.css?v=12');
    // Vite removes vite-ignore before serving/building HTML. Preserve the same
    // runtime image URLs that React will hydrate, instead of hashing only the
    // HTML side and triggering a hydration mismatch or a duplicate download.
    const shell = Object.fromEntries(Object.entries(renderShell(page)).map(([key, markup]) =>
      [key, markup.replace(/<(img|link)\b/g, '<$1 vite-ignore')]));
    html = html.replace(/(<aside class="sidebar"[^>]*data-react-shell>)[\s\S]*?<\/aside>/, `$1${shell.sidebar}</aside>`);
    html = html.replace(/(<header class="topbar"[^>]*data-react-shell>)[\s\S]*?<\/header>/, `$1${shell.topbar}</header>`);
    html = html.replace(/<div id="futin-shell-root" data-react-shell>(?:[\s\S]*?<!--futin:overlays:end-->)?<\/div>/,
      `<div id="futin-shell-root" data-react-shell>${shell.overlays}<!--futin:overlays:end--></div>`);
    // Classic defer scripts download during HTML parsing and execute in their
    // original order, independently of React's module graph and hydration.
    const controllers = scripts.map(source => `<script vite-ignore defer src="${source}"></script>`).join('\n');
    const resources = `<!--futin:preload:start-->\n${controllers}\n<script vite-ignore defer src="futin-ready.js"></script>\n<link rel="stylesheet" href="src/navigation.css" />\n<!--futin:preload:end-->`;
    if (html.includes('<!--futin:preload:start-->')) html = html.replace(/<!--futin:preload:start-->[\s\S]*?<!--futin:preload:end-->/, resources);
    else html = html.replace('</head>', `${resources}\n</head>`);
    await writeFile(file, html);
  }
  console.log('Menú, cabecera e ilustraciones prerenderizados para las 9 páginas.');
