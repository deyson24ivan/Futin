import type {Roster, ThemeMode} from '../domain/game';
(() => {
  'use strict';
  const form = document.querySelector<HTMLFormElement>('[data-profile-form]')!;
  if (!form) return;
  const profile = window.FutinProfile.get();
  (form.elements.namedItem('name') as HTMLInputElement).value = profile.name; (form.elements.namedItem('club') as HTMLInputElement).value = profile.club;
  form.addEventListener('submit',event => {
    event.preventDefault();
    try { window.FutinProfile.save({name:(form.elements.namedItem('name') as HTMLInputElement).value,club:(form.elements.namedItem('club') as HTMLInputElement).value}); window.FutinToast?.('Perfil guardado.'); }
    catch (error) { window.FutinToast?.((error instanceof Error ? error.message : String(error)),true); }
  });
  const theme = document.querySelector<HTMLSelectElement>('[data-theme-select]')!;
  theme.value = window.FutinTheme.getMode();
  theme.addEventListener('change',() => window.FutinTheme.setMode(theme.value as ThemeMode));
  function updateStats() {
    let roster: Roster | null = null;
    try { roster = JSON.parse(localStorage.getItem('futin-roster-v1') || 'null') as Roster | null; } catch { /* A new club. */ }
    document.querySelector<HTMLElement>('[data-profile-players]')!.textContent = String(roster?.players?.length || 18);
    const packs = Object.values(window.FutinWallet.get().packs).reduce((sum,value) => sum + Math.max(0,Number(value) || 0),0);
    document.querySelector<HTMLElement>('[data-profile-packs]')!.textContent = String(packs);
    document.querySelector<HTMLElement>('[data-profile-level]')!.textContent = String(window.FutinSeasonPass.getState().level);
    document.querySelector<HTMLElement>('[data-profile-xp]')!.textContent = String(window.FutinWallet.format(window.FutinSeasonPass.getState().totalXp));
  }
  updateStats();
  window.addEventListener('futin:walletchange',updateStats);
  window.addEventListener('futin:rosterchange',updateStats);
  window.addEventListener('futin:seasonpasschange',updateStats);
})();



export {};
