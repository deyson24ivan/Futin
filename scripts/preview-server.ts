import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';

async function start(): Promise<void> {
  await import('./render-shell.ts');
  const server = await createServer({root: resolve(dirname(fileURLToPath(import.meta.url)), '..')});
  await server.listen();
  server.printUrls();
}
start().catch((error: unknown) => {console.error(error); process.exitCode = 1;});
