(() => {
  'use strict';
  const key = 'futin-theme-v1';
  const modes = ['light','dark','auto'];
  let button;
  let mode = 'dark';
  try { const saved = localStorage.getItem(key); if (modes.includes(saved)) mode = saved; } catch (_) { /* Use the default when storage is unavailable. */ }
  const icons = {
    light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    dark: '<path d="M20.5 13.1A8.6 8.6 0 0 1 10.9 3.5 8.6 8.6 0 1 0 20.5 13.1Z"/>'
  };
  function apply(next = mode, save = false) {
    mode = modes.includes(next) ? next : 'dark';
    const hour = new Date().getHours();
    const theme = mode === 'auto' ? hour >= 7 && hour < 19 ? 'light' : 'dark' : mode;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themeMode = mode;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#17181c' : '#f4f3f5');
    if (button) {
      const action = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
      button.setAttribute('aria-label', action);
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.title = action;
      button.querySelector('svg').innerHTML = icons[theme];
      button.querySelector('span').textContent = mode === 'auto' ? 'Auto' : theme === 'dark' ? 'Oscuro' : 'Claro';
    }
    if (save) {
      try { localStorage.setItem(key, mode); } catch (_) { /* The choice still works for this page. */ }
    }
    document.querySelectorAll('[data-theme-select]').forEach(select => { select.value = mode; });
    window.dispatchEvent(new Event('futin:themechange'));
  }
  window.FutinTheme = { getMode:() => mode,setMode:next => apply(next,true) };
  apply();
  function mount() {
    const actions = document.querySelector('.topbar-actions');
    if (!actions) return;
    // The React header renders its own toggle with the same styles and API.
    if (actions.closest('[data-react-shell]')) return;
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"></svg><span></span>';
    button.addEventListener('click', () => apply(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true));
    actions.prepend(button);
    apply();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
  setInterval(() => { if (mode === 'auto') apply(); },60000);
  document.addEventListener('visibilitychange',() => { if (!document.hidden) apply(); });
  addEventListener('storage', event => { if (event.key === key || event.key === null) apply(event.newValue); });
})();

