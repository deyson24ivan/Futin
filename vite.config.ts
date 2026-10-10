import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { cp, mkdir, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pages } from './src/compat/pages.ts';

const root = dirname(fileURLToPath(import.meta.url));

// Game controllers still resolve their artwork at runtime. Preserve these URLs
// in the native/web build, without shipping collected datasets or backups.
function gameResources(): Plugin {
  return {
    name: 'futin-game-resources',
    async writeBundle() {
      const output = resolve(root, 'dist');
      const copy = async (source: string, target = source) => {
        await mkdir(dirname(resolve(output, target)), { recursive: true });
        await cp(resolve(root, source), resolve(output, target), { recursive: true });
      };
      for (const file of await readdir(root)) {
        if (/\.(svg|png|mp4)$/.test(file)) await copy(file);
      }
      await copy('scripts/career/career-cards.css');
      for (const directory of ['cards', 'flags', 'premium', 'tabler', 'ui']) {
        await copy(`assets/${directory}`);
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), gameResources()],
  server: { host: '127.0.0.1', port: 8765, strictPort: true },
  preview: { host: '127.0.0.1', port: 8765, strictPort: true },
  build: {
    rolldownOptions: { input: Object.fromEntries(pages.map(page => [page, resolve(root, `${page}.html`)])) },
  },
});
