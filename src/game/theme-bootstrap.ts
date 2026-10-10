/** Serialized by the HTML renderer: apply the saved theme before CSS paints. */
export function themeBootstrap(): void {
  let mode = 'dark';
  try {
    const saved = localStorage.getItem('futin-theme-v1');
    if (saved && ['light', 'dark', 'auto'].includes(saved)) mode = saved;
  } catch { /* Storage can be unavailable; use the default theme. */ }
  const hour = new Date().getHours();
  const theme = mode === 'auto' ? hour >= 7 && hour < 19 ? 'light' : 'dark' : mode;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#17181c' : '#f4f3f5');
}
