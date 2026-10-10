// Keep the original launch command, now serving React/TypeScript through Vite.
const path = require('node:path');
async function start() {
  await import('./render-shell.mjs');
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.resolve(__dirname, '..') });
  await server.listen();
  server.printUrls();
}
start().catch(error => { console.error(error); process.exitCode = 1; });
