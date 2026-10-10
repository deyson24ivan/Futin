import { renderToString } from 'react-dom/server';
import { SidebarApp, TopbarApp, OverlaysApp } from './App';
import type { PageName } from './compat/runtime';

// Generate the shell from the actual components. It is visible and its normal
// links work from the first HTML paint, even before React downloads.
export function renderShell(page: PageName) {
  return {
    sidebar: renderToString(<SidebarApp page={page} />),
    topbar: renderToString(<TopbarApp page={page} />),
    overlays: renderToString(<OverlaysApp />),
  };
}
