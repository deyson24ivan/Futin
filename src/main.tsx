import { hydrateRoot } from 'react-dom/client';
import { SidebarApp, TopbarApp, OverlaysApp } from './App';
import { currentPage } from './compat/runtime';

const root = document.querySelector<HTMLElement>('#futin-shell-root');
const sidebar = document.querySelector<HTMLElement>('.sidebar[data-react-shell]');
const topbar = document.querySelector<HTMLElement>('.topbar[data-react-shell]');

if (!root || !sidebar || !topbar) throw new Error('No se encontraron los puntos de montaje de FUTIN.');

const page = currentPage();
let hydrated = 0;
function onHydrated() {
  if (++hydrated !== 3) return;
  if (import.meta.env.DEV) document.documentElement.dataset.futinShellReadyMs = String(Math.round(performance.now()));
}

// Attach React to the already-visible HTML rather than clearing and rebuilding
// the menu on every navigation. Page controllers run through the compiled TypeScript entry.
hydrateRoot(sidebar, <SidebarApp page={page} onHydrated={onHydrated} />);
hydrateRoot(topbar, <TopbarApp page={page} onHydrated={onHydrated} />);
hydrateRoot(root, <OverlaysApp onHydrated={onHydrated} />);
