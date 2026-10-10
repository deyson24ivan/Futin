(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
  document.querySelectorAll('[data-ui-icon]').forEach(node => { node.innerHTML = icon(node.dataset.uiIcon); });
  document.querySelectorAll('.profile-mini,.top-avatar').forEach(link => { link.href = 'perfil.html'; });
  document.querySelectorAll('.topbar .coin-pill').forEach(link => { link.href = 'monedas.html'; link.setAttribute('aria-label','Ver monedero y comprar monedas'); });
  const actions = document.querySelector('.topbar-actions');
  let trigger = actions?.querySelector('.notification-button');
  if (!trigger && actions) {
    trigger = document.createElement('button'); trigger.className = 'icon-button notification-button'; trigger.type = 'button';
    actions.insertBefore(trigger,actions.querySelector('.top-avatar'));
  }
  if (trigger) {
    trigger.innerHTML = `${icon('bell')}<i hidden></i>`;
    trigger.setAttribute('aria-label','Notificaciones'); trigger.setAttribute('aria-haspopup','dialog');
  }
  const activity = document.createElement('dialog'); activity.className = 'club-dialog activity-dialog';
  activity.setAttribute('aria-labelledby','activity-title');
  activity.innerHTML = `<header class="dialog-heading"><div><p class="eyebrow">TU CLUB AL DÍA</p><h2 id="activity-title">NOTIFICACIONES</h2></div><button type="button" class="ui-icon-button" data-close-dialog aria-label="Cerrar notificaciones">${icon('close')}</button></header><div class="activity-toolbar"><span data-unread-summary></span><button type="button" class="text-link" data-read-all>Marcar todas como leídas</button></div><div data-activity-list></div>`;
  document.body.append(activity);
  function renderNotices() {
    const list = window.FutinNotifications.list(); const unread = list.filter(item => !item.read).length;
    if (trigger) { trigger.querySelector('i').hidden = !unread; trigger.setAttribute('aria-label',`Notificaciones${unread ? `, ${unread} sin leer` : ', al día'}`); }
    activity.querySelector('[data-unread-summary]').textContent = unread ? `${unread} sin leer` : 'Todo al día';
    activity.querySelector('[data-read-all]').disabled = !unread;
    activity.querySelector('[data-activity-list]').innerHTML = list.length ? list.map(item => {
      const href = /^(perfil|monedas|tienda|plantilla|pase|carrera|minijuegos)\.html(?:#[\w-]+)?$/.test(item.href) ? item.href : 'perfil.html';
      return `<a class="activity-item${item.read ? '' : ' is-unread'}" href="${href}" data-notice-id="${escape(item.id)}"><span class="activity-icon">${icon(item.type === 'club' ? 'bell' : item.type)}</span><span><strong>${escape(item.title)}</strong><p>${escape(item.text)}</p><small>${new Intl.DateTimeFormat('es-CO',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(item.date))}</small></span></a>`;
    }).join('') : `<div class="club-empty">${icon('bell')}<h3>Estás al día</h3><p>Tus compras, recompensas y avances aparecerán aquí.</p></div>`;
  }
  trigger?.addEventListener('click',() => { renderNotices(); activity.showModal(); });
  activity.querySelector('[data-close-dialog]').addEventListener('click',() => activity.close());
  activity.querySelector('[data-read-all]').addEventListener('click',() => window.FutinNotifications.markRead());
  activity.addEventListener('click',event => {
    const item = event.target.closest('[data-notice-id]'); if (item) window.FutinNotifications.markRead(item.dataset.noticeId);
    if (event.target === activity) { const r = activity.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) activity.close(); }
  });
  function renderProfile() {
    const profile = window.FutinProfile.get();
    const initials = profile.name.split(/\s+/).map(part => part[0]).slice(0,2).join('').toLocaleUpperCase('es');
    document.querySelectorAll('.profile-copy strong,[data-profile-name]').forEach(node => { node.textContent = profile.name; });
    document.querySelectorAll('.profile-mini .avatar,.top-avatar,[data-profile-avatar]').forEach(node => { node.textContent = initials; });
    document.querySelectorAll('.top-avatar').forEach(node => node.setAttribute('aria-label',`Abrir perfil de ${profile.name}`));
    document.querySelectorAll('[data-profile-club]').forEach(node => { node.textContent = profile.club; });
    document.querySelectorAll('.profile-copy small').forEach(node => { node.textContent = profile.club; });
  }
  window.addEventListener('futin:profilechange',renderProfile);
  window.addEventListener('futin:notificationschange',renderNotices);
  const toast = document.createElement('div'); toast.className = 'club-toast'; toast.hidden = true; toast.setAttribute('role','status'); toast.setAttribute('aria-live','polite'); document.body.append(toast);
  let toastTimer;
  window.FutinToast = (message,error = false) => {
    clearTimeout(toastTimer); toast.textContent = message; toast.classList.toggle('is-error',error); toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; },4000);
  };
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
  renderProfile(); renderNotices(); window.FutinClock.tick();
})();
