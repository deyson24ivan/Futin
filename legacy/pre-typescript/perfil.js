(() => {
  'use strict';
  const form = document.querySelector('[data-profile-form]');
  if (!form) return;
  const profile = window.FutinProfile.get();
  form.elements.name.value = profile.name; form.elements.club.value = profile.club;
  form.addEventListener('submit',event => {
    event.preventDefault();
    try { window.FutinProfile.save({name:form.elements.name.value,club:form.elements.club.value}); window.FutinToast('Perfil guardado.'); }
    catch (error) { window.FutinToast(error.message,true); }
  });
  const theme = document.querySelector('[data-theme-select]');
  theme.value = window.FutinTheme.getMode();
  theme.addEventListener('change',() => window.FutinTheme.setMode(theme.value));
  function updateStats() {
    let roster;
    try { roster = JSON.parse(localStorage.getItem('futin-roster-v1')); } catch { /* A new club. */ }
    document.querySelector('[data-profile-players]').textContent = roster?.players?.length || 18;
    const packs = Object.values(window.FutinWallet.get().packs).reduce((sum,value) => sum + Math.max(0,Number(value) || 0),0);
    document.querySelector('[data-profile-packs]').textContent = packs;
    document.querySelector('[data-profile-level]').textContent = window.FutinSeasonPass.getState().level;
    document.querySelector('[data-profile-xp]').textContent = window.FutinWallet.format(window.FutinSeasonPass.getState().totalXp);
  }
  updateStats();
  window.addEventListener('futin:walletchange',updateStats);
  window.addEventListener('futin:rosterchange',updateStats);
  window.addEventListener('futin:seasonpasschange',updateStats);
})();
