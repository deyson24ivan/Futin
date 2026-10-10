import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const names = ['index', 'plantilla', 'cartas', 'tienda', 'pase', 'carrera', 'minijuegos', 'monedas', 'perfil'];
const backup = resolve(root, 'legacy/pre-react');
const controllers = {};
const pending = [];
const theme = await readFile(resolve(root, 'futin-theme.js'), 'utf8');

// This one-time migration uses exact known shell boundaries. Validate every
// page before writing any page, and keep untouched originals for rollback.
for (const name of names) {
  let html = await readFile(resolve(root, `${name}.html`), 'utf8');
  if (html.includes('data-react-shell')) throw new Error('La migración ya se aplicó. No se sobreescribirán las copias originales.');
  if ([...html.matchAll(/<aside class="sidebar"/g)].length !== 1 || [...html.matchAll(/<header class="topbar">/g)].length !== 1) {
    throw new Error(`Los límites de ${name}.html han cambiado; revisa esta página antes de migrarla.`);
  }
  controllers[name] = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>\s*<\/script>/g)]
    .map(match => match[1]).filter(source => !source.startsWith('futin-theme.js'));
  html = html.replace(/<script\b[^>]*src="([^"]+)"[^>]*>\s*<\/script>/g, (_, source) =>
    source.startsWith('futin-theme.js') ? `<script data-futin-theme>${theme}</script>` : '');
  html = html.replace(/<aside class="sidebar"[^>]*>[\s\S]*?<\/aside>/, '<aside class="sidebar" aria-label="Navegación principal" data-react-shell></aside>');
  html = html.replace(/<header class="topbar">[\s\S]*?<\/header>/, '<header class="topbar" data-react-shell></header>');
  html = html.replace(/<\/body>/, '<div id="futin-shell-root" data-react-shell></div>\n<script type="module" src="/src/main.tsx"></script>\n</body>');
  pending.push({ name, html });
}

try { await access(backup); throw new Error('Ya existe la copia pre-react; no se sobreescribirá.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(backup, { recursive: true });
for (const file of [...names.map(name => `${name}.html`), 'app.js', 'futin-shell.js', 'futin-premium.js', 'futin-theme.js']) {
  await copyFile(resolve(root, file), resolve(backup, file));
}
await mkdir(resolve(root, 'src/compat'), { recursive: true });
await writeFile(resolve(root, 'src/compat/controllers.json'), `${JSON.stringify(controllers, null, 2)}\n`);
for (const { name, html } of pending) await writeFile(resolve(root, `${name}.html`), html);
console.log(`Migradas ${pending.length} páginas. Originales: legacy/pre-react/`);
