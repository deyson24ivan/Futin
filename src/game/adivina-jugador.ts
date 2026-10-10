import type {GuessRun, Roster, CardPlayer, GuessPlayer} from '../domain/game';
import {escapeHtml} from './dom';
import {eventElement} from './dom';
(() => {
  const root = document.querySelector<HTMLElement>('[data-player-guess]')!;
  if (!root) return;

  const keys = {
    roster: 'futin-roster-v1', daily: 'futin-player-guess-daily', run: 'futin-player-guess-run',
    paid: 'futin-player-guess-paid', gems: 'futin-gems',
  };
  const maxDaily = 3;
  const maxErrors = 6;
  const startingPrize = { gems: 180, xp: 60 };
  const deduction = { gems: 30, xp: 10 };
  const input = root.querySelector<HTMLInputElement>('[data-guess-input]')!;
  const form = root.querySelector<HTMLElement>('[data-guess-form]')!;
  const suggestions = root.querySelector<HTMLElement>('[data-guess-suggestions]')!;
  const submit = root.querySelector<HTMLButtonElement>('[data-guess-submit]')!;
  const start = root.querySelector<HTMLButtonElement>('[data-guess-start]')!;
  const feedback = root.querySelector<HTMLElement>('[data-guess-feedback]')!;
  const numberFormat = new Intl.NumberFormat('es-CO');
  let players = getPlayers();
  let daily = read(keys.daily, { date: today(), attempts: 0 });
  let run = read<GuessRun | null>(keys.run, null);
  let highlighted = -1;
  let selectedId = '';

  function today() {
    return window.FutinClock.dayKey();
  }

  function read<T>(key: string, fallback: T): T {
    try {
      const data = JSON.parse(localStorage.getItem(key) || 'null');
      return data && typeof data === 'object' && !Array.isArray(data) ? data as T : fallback;
    } catch { return fallback; }
  }

  function write(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  }

  function getPlayers(): GuessPlayer[] {
    try {
      const stored = JSON.parse(localStorage.getItem(keys.roster) || 'null') as Roster | null;
      if (Array.isArray(stored?.players) && stored.players.length) {
        const normalized = stored.players.filter((player) => player?.id && player?.name).map((player) => ({
          id: String(player.baseId || player.id), name: String(player.name), rating: Number(player.rating) || 0,
          position: String(player.position || '—'), rarity: player.rarity === 'ÍCONO' ? 'ESPECIAL' : String(player.rarity || 'PLATA'),
          stats: Array.isArray(player.stats) ? player.stats.slice(0, 5).map((value) => Number(value) || 0) : [70, 70, 70, 70, 70],
          country: player.country || player.country || window.FutinPlayers.catalog.find(item => item.id === (player.baseId || player.id))?.country || '',
          club: player.club || player.club || window.FutinPlayers.catalog.find(item => item.id === (player.baseId || player.id))?.club || '',
        }));
        if (normalized.length) return [...new Map([...window.FutinPlayers.catalog,...normalized].map(player => [player.id,player])).values()];
      }
    } catch { /* Use the starter roster when no saved club exists. */ }
    return window.FutinPlayers.catalog;
  }

  function saveRun() { write(keys.run, run); }
  function refreshDaily() {
    daily = read(keys.daily,daily);
    if (daily.date !== today()) daily = { date: today(), attempts: 0 };
    daily.attempts = Math.min(maxDaily, Math.max(0, Math.floor(Number(daily.attempts) || 0)));
    write(keys.daily, daily);
  }
  function errors() { return Math.max(0, Number(run?.errors) || 0); }
  function prize() {
    const misses = errors();
    return { gems: Math.max(0, startingPrize.gems - deduction.gems * misses), xp: Math.max(0, startingPrize.xp - deduction.xp * misses) };
  }
  function normalizeName(value: unknown) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]/g, ''); }


  function statValues(player: GuessPlayer) {
    const [rit, tir, pas, def, fis] = player.stats;
    return { RIT: rit, TIR: tir, PAS: pas, REG: Math.round((rit + pas) / 2), DEF: def, FIS: fis };
  }

  function clueDeck(player: GuessPlayer) {
    const values = statValues(player);
    const statEntries = Object.entries(values).sort((a, b) => b[1] - a[1]);
    const bandStart = Math.floor(player.rating / 5) * 5;
    const clues = [
      { label: 'CALIDAD DE CARTA', text: `Carta de categoría ${player.rarity}.` },
      { label: 'VALORACIÓN', text: `Su media está entre ${bandStart} y ${bandStart + 4}.` },
    ];
    if (player.country) clues.unshift({ label: 'PAÍS', text: `Su nacionalidad es ${player.country}.` });
    if (player.club) clues.push({ label: 'EQUIPO', text: `Juega en ${player.club}.` });
    clues.push({ label: 'POSICIÓN', text: `Su posición principal es ${player.position}.` });
    clues.push({ label: 'ATRIBUTO DESTACADO', text: `Su mejor atributo es ${statEntries[0][0]} (${statEntries[0][1]}).` });
    clues.push({ label: 'OTRO ATRIBUTO', text: `En ${statEntries[1][0]} tiene ${statEntries[1][1]} puntos.` });
    clues.push({ label: 'MEDIA EXACTA', text: `Su valoración general es ${player.rating}.` });
    return clues;
  }

  function getTarget() {
    if (!run?.targetId) return null;
    return players.find((player) => player.id === run!.targetId) || run!.playerSnapshot || null;
  }

  function updateSuggestions() {
    const query = normalizeName(input.value);
    selectedId = '';
    highlighted = -1;
    input.removeAttribute('aria-activedescendant');
    if (!query || run?.status !== 'playing') { suggestions.hidden = true; input.setAttribute('aria-expanded','false'); suggestions.innerHTML = ''; submit.disabled = true; return; }
    const alreadyGuessed = new Set(run!.guessed || []);
    const matches = players.filter((player) => normalizeName(player.name).includes(query) && !alreadyGuessed.has(player.id)).slice(0, 7);
    suggestions.innerHTML = matches.length ? matches.map((player,index) => `<button type="button" id="guess-option-${index}" class="guess-suggestion" role="option" aria-selected="false" data-player-id="${escapeHtml(player.id)}"><span>${escapeHtml(player.name)}</span><small>${escapeHtml(player.position)} · ${escapeHtml(player.rarity)}</small></button>`).join('') : '<div class="guess-no-suggestion">No hay jugadores disponibles con ese nombre.</div>';
    suggestions.hidden = false;
    input.setAttribute('aria-expanded','true');
    submit.disabled = true;
  }

  function selectSuggestion(playerId: string) {
    const player = players.find((item) => item.id === playerId);
    if (!player || (run?.guessed || []).includes(playerId)) return;
    selectedId = playerId;
    input.value = player.name;
    suggestions.hidden = true;
    input.setAttribute('aria-expanded','false'); input.removeAttribute('aria-activedescendant');
    submit.disabled = false;
    input.focus();
  }

  function renderClues() {
    const holder = root.querySelector<HTMLElement>('[data-guess-clues]')!;
    if (!run) {
      holder.innerHTML = '<div class="guess-clues-empty"><span>01</span><p>Las pistas aparecerán aquí. Analiza la carta y encuentra al jugador.</p></div>';
      return;
    }
    const target = getTarget();
    if (!target) return;
    const deck = clueDeck(target);
    const visibleCount = Math.min(deck.length, 2 + errors());
    holder.innerHTML = deck.slice(0, visibleCount).map((clue, index) => `<article class="guess-clue"><span>${String(index + 1).padStart(2, '0')}</span><div><small>${escapeHtml(clue.label)}</small><p>${escapeHtml(clue.text)}</p></div></article>`).join('');
  }

  function renderCard() {
    const card = root.querySelector<HTMLElement>('[data-mystery-card]')!;
    const target = getTarget();
    const visible = target && ['won','lost'].includes(run?.status ?? '');
    card.className = `mystery-card futin-mystery-base${visible ? ' is-revealed' : ''}`;
    // Only revealed fields enter the shared renderer, including its ARIA label.
    // Do not pass the hidden player's id: catalog merging could reveal the name.
    const stats = target ? statValues(target) : {};
    card.innerHTML = window.FutinCard.render({
      name: visible ? target.name : 'IDENTIDAD RESERVADA',
      rating: target && (visible || errors() >= 4) ? target.rating : '??',
      position: target && (visible || errors() >= 3) ? target.position : '—',
      countryCode: visible ? target.countryCode : '',
      country: visible ? target.country : '',
      club: visible ? target.club : '',
      photo: visible ? target.photo || target.portrait : 'assets/ui/player-silhouette.svg?v=10',
      cardStats: Object.fromEntries(['RIT','TIR','PAS','REG','DEF','FIS'].map((label,index) => [label,visible ? Object.values(stats)[index] : '—']))
    },{type:target ? window.FutinCard.typeFor(target) : 'gold',special:true});
    root.querySelector<HTMLElement>('[data-guess-card-caption]')!.textContent = String(!target ? 'La carta aparecerá al comenzar' : visible ? `${target.name} · ${target.rarity}` : `Carta ${target.rarity.toLocaleLowerCase('es')} · jugador oculto`);
  }

  function render() {
    refreshDaily();
    const remaining = Math.max(0, maxDaily - daily.attempts);
    root.querySelector<HTMLElement>('[data-guess-attempts]')!.textContent = String(String(remaining));
    root.querySelector<HTMLElement>('[data-guess-gems]')!.textContent = String(numberFormat.format(run?.status === 'won' ? (run!.payoutGems ?? 0) : run?.status === 'playing' ? prize().gems : startingPrize.gems));
    root.querySelector<HTMLElement>('[data-guess-xp]')!.textContent = String(numberFormat.format(run?.status === 'won' ? (run!.payoutXp ?? 0) : run?.status === 'playing' ? prize().xp : startingPrize.xp));
    root.querySelector<HTMLElement>('[data-guess-errors]')!.textContent = String(`${errors()} / ${maxErrors} FALLOS`);
    renderClues();
    renderCard();

    const playing = run?.status === 'playing';
    input.disabled = !playing;
    input.value = playing ? input.value : '';
    submit.disabled = !playing || !selectedId;
    start.disabled = playing || remaining === 0;
    start.textContent = String(playing ? 'DESAFÍO EN CURSO' : remaining ? run?.status === 'won' || run?.status === 'lost' ? 'JUGAR OTRO DESAFÍO' : 'COMENZAR DESAFÍO' : 'VUELVE MAÑANA');
    start.insertAdjacentHTML('beforeend', !playing && remaining ? ' <span>→</span>' : '');
    if (!playing && suggestions) { suggestions.hidden = true; suggestions.innerHTML = ''; input.setAttribute('aria-expanded','false'); input.removeAttribute('aria-activedescendant'); }

    if (playing) feedback.textContent = run!.lastMiss
      ? `No es ${run!.lastMiss}. El premio bajó a ${numberFormat.format(prize().gems)} monedas y ${numberFormat.format(prize().xp)} XP. Se desbloqueó una pista nueva.`
      : `Elige un nombre de la lista. Te quedan ${maxErrors - errors()} ${maxErrors - errors() === 1 ? 'intento' : 'intentos'} antes de revelar la respuesta.`;
    else if (run?.status === 'won') feedback.textContent = String(`¡Correcto! Era ${getTarget()?.name}. Recibiste ${numberFormat.format(run!.payoutGems ?? 0)} monedas y ${numberFormat.format(run!.payoutXp ?? 0)} XP.`);
    else if (run?.status === 'lost') feedback.textContent = String(`Se agotaron las pistas. El jugador era ${getTarget()?.name}. El próximo reto te espera.`);
    else if (remaining === 0) feedback.textContent = String('Ya jugaste tus tres desafíos de hoy. Vuelve mañana para intentarlo de nuevo.');
    else feedback.textContent = String(`Tienes ${remaining} desafío${remaining === 1 ? '' : 's'} disponible${remaining === 1 ? '' : 's'} hoy.`);
  }

  function begin() {
    refreshDaily();
    if (daily.attempts >= maxDaily || !players.length) { render(); return; }
    players = getPlayers();
    const target = players[Math.floor(Math.random() * players.length)];
    const id = window.crypto?.randomUUID?.() || `guess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const nextDaily = { date: today(), attempts: daily.attempts + 1 };
    if (!write(keys.daily, nextDaily)) { feedback.textContent = String('No se pudo guardar el intento en este dispositivo. Inténtalo de nuevo.'); return; }
    daily = nextDaily;
    run = { id, date: today(), targetId: target.id, playerSnapshot: target, status: 'playing', errors: 0, guessed: [] };
    saveRun();
    selectedId = '';
    input.value = '';
    render();
  }

  function payPrize() {
    const payout = prize();
    const paid = read<{ids: string[]}>(keys.paid, { ids: [] });
    if ((paid.ids || []).includes(run!.id)) return { gems: payout.gems, xp: 0 };
    window.FutinWallet.credit(`guess:${run!.id}`,payout.gems,'¿Quién es el jugador?');
    paid.ids = [...(paid.ids || []), run!.id];
    localStorage.setItem(keys.paid, JSON.stringify(paid));
    window.dispatchEvent(new CustomEvent('futin:walletchange'));
    const result = window.FutinSeasonPass?.awardOnce(`minigame:player-guess:${run!.id}`, payout.xp, 'minigame');
    return { gems: payout.gems, xp: result?.xpAwarded || 0 };
  }

  function guess() {
    if (run?.status !== 'playing' || !selectedId) return;
    const chosen = players.find((player) => player.id === selectedId);
    const target = getTarget();
    if (!chosen || !target || (run!.guessed || []).includes(chosen.id)) return;
    run!.guessed = [...(run!.guessed || []), chosen.id];
    if (chosen.id === target.id) {
      try {
        const paid = payPrize();
        run!.status = 'won';
        run!.payoutGems = paid.gems;
        run!.payoutXp = paid.xp;
      } catch {
        run!.guessed = run!.guessed.filter((id) => id !== chosen.id);
        feedback.textContent = 'No pudimos registrar el premio. El desafío sigue disponible; vuelve a confirmar.';
        return;
      }
    } else {
      run!.errors += 1;
      run!.lastMiss = chosen.name;
      if (run!.errors >= maxErrors) run!.status = 'lost';
    }
    saveRun();
    selectedId = '';
    input.value = '';
    render();
  }

  start.addEventListener('click', begin);
  input.addEventListener('input', updateSuggestions);
  input.addEventListener('keydown', (event) => {
    const options = [...suggestions.querySelectorAll<HTMLElement>('[data-player-id]')];
    if (event.key === 'ArrowDown' && options.length) { event.preventDefault(); highlighted = Math.min(options.length - 1, highlighted + 1); options.forEach((option, index) => option.classList.toggle('is-highlighted', index === highlighted)); }
    else if (event.key === 'ArrowUp' && options.length) { event.preventDefault(); highlighted = Math.max(0, highlighted - 1); options.forEach((option, index) => option.classList.toggle('is-highlighted', index === highlighted)); }
    else if (event.key === 'Enter' && highlighted >= 0 && options[highlighted]) { event.preventDefault(); selectSuggestion(options[highlighted].dataset.playerId!); }
    else if (event.key === 'Escape') { suggestions.hidden = true; input.setAttribute('aria-expanded','false'); }
    if (highlighted >= 0 && !suggestions.hidden) {
      input.setAttribute('aria-activedescendant',options[highlighted].id);
      options.forEach((option,index) => option.setAttribute('aria-selected',String(index === highlighted)));
    }
  });
  suggestions.addEventListener('click', (event) => {
    const option = eventElement(event).closest<HTMLElement>('[data-player-id]');
    if (option) selectSuggestion(option.dataset.playerId!);
  });
  form.addEventListener('submit', (event) => { event.preventDefault(); guess(); });
  window.addEventListener('storage', (event) => {
    if ([keys.roster, keys.daily, keys.run, keys.gems].includes(event.key ?? '')) {
      if (event.key === keys.roster) players = getPlayers();
      if (event.key === keys.daily) daily = read(keys.daily, daily);
      if (event.key === keys.run) run = read<GuessRun | null>(keys.run, run);
      render();
    }
  });

  window.addEventListener('futin:daychange',() => {
    if (run?.status !== 'playing') { run = null; saveRun(); }
    render();
  });
  document.addEventListener('visibilitychange',() => { if (!document.hidden) render(); });
  if (!['playing', 'won', 'lost'].includes(run?.status ?? '') || (run?.date !== today() && run?.status !== 'playing')) run = null;
  render();
})();




export {};
