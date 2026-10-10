import { readFile, writeFile } from 'node:fs/promises';

// Synchronize the early theme initializer: it executes before CSS to avoid a
// light-mode flash, while React owns the toggle rendered in the header.
const theme = await readFile('futin-theme.js', 'utf8');
for (const page of ['index', 'plantilla', 'cartas', 'tienda', 'pase', 'carrera', 'minijuegos', 'monedas', 'perfil']) {
  const path = `${page}.html`;
  const html = await readFile(path, 'utf8');
  if (!html.includes('<script data-futin-theme>')) throw new Error(`No se encontró el tema inicial en ${path}`);
  await writeFile(path, html.replace(/<script data-futin-theme>[\s\S]*?<\/script>/, `<script data-futin-theme>${theme}</script>`));
}

// Notifications and toast now have one implementation, in React. Keep the
// adapter focused on page icons, profile labels and accessible keyboard tabs.
let shell = await readFile('futin-shell.js', 'utf8');
shell = shell.replace(/  const escape = [^\n]+\n/, '');
shell = shell.replace(/  const actions = pageNodes\('\.topbar-actions'\)\[0\];[\s\S]*?(?=  function renderProfile\(\))/, '');
shell = shell.replace(/  window.addEventListener\('futin:notificationschange',renderNotices\);\n/, '');
shell = shell.replace(/  if \(!window.FutinToast\) \{[\s\S]*?(?=  document.querySelectorAll\('\[role="tablist"\]'\))/, '');
shell = shell.replace('renderProfile(); renderNotices(); window.FutinClock.tick();', 'renderProfile(); window.FutinClock.tick();');
await writeFile('futin-shell.js', shell);
console.log('Tema sincronizado y adaptador de página simplificado.');
