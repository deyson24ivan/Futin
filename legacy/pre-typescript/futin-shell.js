(() => {
  'use strict';
  // The React shell owns navigation, notifications and toast DOM. This adapter
  // keeps page icons, profile labels and keyboard tabs for the existing engines.
  const pageNodes = selector => [...document.querySelectorAll(selector)].filter(node => !node.closest('[data-react-shell]'));
  const paths = {
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 10h18c0-3-3-3-3-10M10 21h4"/>',
    coins:'<circle cx="12" cy="12" r="9"/><path d="M15 7H9v10M9 12h5"/>',
    pack:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M5 6h14M5 18h14m-7-9 1 2 2 .3-1.5 1.4.4 2.3-1.9-1-1.9 1 .4-2.3L9 11.3l2-.3Z"/>',
    player:'<circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
    trophy:'<path d="M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v5m-4 2h8"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    shield:'<path d="m12 2 8 3v6c0 5-4 8-8 11-4-3-8-6-8-11V5l8-3Z"/>',
    game:'<path d="M7 6h10c3 0 4 2 4 5l1 6c.4 3-2 4-4 2l-3-3H9l-3 3c-2 2-4 .7-4-2l1-6c0-3 1-5 4-5ZM6 10v4m-2-2h4m7-1h.01m3 2h.01"/>',
    settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    chart:'<path d="M4 3v18h17M8 16v-5m5 5V7m5 9V4"/>',
    formation:'<rect x="3" y="2" width="18" height="20" rx="2"/><path d="M3 12h18"/><circle cx="12" cy="12" r="3"/><path d="M7 5h.01M17 5h.01M7 19h.01M17 19h.01"/>',
  };
  const icon = name => `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.bell}</svg>`;
  window.FutinIcons = {icon};
  pageNodes('[data-ui-icon]').forEach(node => { node.innerHTML = icon(node.dataset.uiIcon); });
  pageNodes('.profile-mini,.top-avatar').forEach(link => { link.href = 'perfil.html'; });
  pageNodes('.topbar .coin-pill').forEach(link => { link.href = 'monedas.html'; link.setAttribute('aria-label','Ver monedero y comprar monedas'); });
  function renderProfile() {
    const profile = window.FutinProfile.get();
    const initials = profile.name.split(/\s+/).map(part => part[0]).slice(0,2).join('').toLocaleUpperCase('es');
    pageNodes('.profile-copy strong,[data-profile-name]').forEach(node => { node.textContent = profile.name; });
    pageNodes('.profile-mini .avatar,.top-avatar,[data-profile-avatar]').forEach(node => { node.textContent = initials; });
    pageNodes('.top-avatar').forEach(node => node.setAttribute('aria-label',`Abrir perfil de ${profile.name}`));
    pageNodes('[data-profile-club]').forEach(node => { node.textContent = profile.club; });
    pageNodes('.profile-copy small').forEach(node => { node.textContent = profile.club; });
  }
  window.addEventListener('futin:profilechange',renderProfile);
  document.querySelectorAll('[role="tablist"]').forEach(list => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    tabs.forEach((tab,index) => {
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
      const name = tab.dataset.careerTab || tab.dataset.careerTeamTab;
      const panel = name && document.querySelector(`[data-${tab.dataset.careerTab ? 'career-view' : 'career-team-view'}="${name}"]`);
      if (panel) {
        tab.id ||= `club-tab-${name}-${index}`; panel.id ||= `club-panel-${name}-${index}`;
        panel.setAttribute('role','tabpanel'); panel.setAttribute('aria-labelledby',tab.id); tab.setAttribute('aria-controls',panel.id);
      }
      tab.addEventListener('click',() => tabs.forEach(item => { item.tabIndex = item === tab ? 0 : -1; }));
    });
    list.addEventListener('keydown',event => {
      if (event.defaultPrevented) return;
      const index = tabs.indexOf(document.activeElement);
      if (index < 0 || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus(); tabs[next].click();
    });
  });
  renderProfile(); window.FutinClock.tick();
})();
