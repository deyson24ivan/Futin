import type {PenaltyRun} from '../domain/game';
(() => {
  const page = document.querySelector<HTMLElement>('.minigames-experience')!;
  if (!page) return;

  const dailyKey = 'futin-death-penalty-daily';
  const runKey = 'futin-death-penalty-run';
  const gemKey = 'futin-gems';
  const paidRunsKey = 'futin-death-penalty-paid';
  const maxAttempts = 3;
  const rewards = [
    { gems: 25, xp: 15 }, { gems: 50, xp: 25 }, { gems: 90, xp: 35 },
    { gems: 160, xp: 50 }, { gems: 280, xp: 70 }, { gems: 500, xp: 90 },
    { gems: 900, xp: 120 }, { gems: 1800, xp: 160 }, { gems: 5000, xp: 250 },
  ];
  const cells = [...page.querySelectorAll<HTMLButtonElement>('[data-goal-cell]')];
  const startButton = page.querySelector<HTMLButtonElement>('[data-start-run]')!;
  const retireButton = page.querySelector<HTMLButtonElement>('[data-retire]')!;
  const feedback = page.querySelector<HTMLElement>('[data-game-feedback]')!;
  const numberFormat = new Intl.NumberFormat('es-CO');
  let daily = readObject(dailyKey, { date: today(), attempts: 0 });
  let run = readObject<PenaltyRun | null>(runKey, null);
  let shotLocked = false;

  function today() {
    return window.FutinClock.dayKey();
  }

  function readObject<T>(key: string, fallback: T): T {
    try {
      const stored = JSON.parse(localStorage.getItem(key) || 'null');
      return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored as T : fallback;
    } catch { return fallback; }
  }

  function writeObject(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  }

  function refreshDaily() {
    daily = readObject(dailyKey,daily);
    if (daily.date !== today()) daily = { date: today(), attempts: 0 };
    daily.attempts = Math.min(maxAttempts, Math.max(0, Math.floor(Number(daily.attempts) || 0)));
    writeObject(dailyKey, daily);
  }

  function makeCells(round: number) {
    const danger = new Set();
    while (danger.size < round) danger.add(Math.floor(Math.random() * 10));
    return Array.from({ length: 10 }, (_, index) => ({ index, safe: !danger.has(index), chosen: false }));
  }

  function saveRun() { writeObject(runKey, run); }

  function dailyLeft() {
    refreshDaily();
    return Math.max(0, maxAttempts - Number(daily.attempts || 0));
  }

  function payoutFor(round: number, half = false) {
    if (round < 1) return { gems: 0, xp: 0 };
    const prize = rewards[Math.min(round, rewards.length) - 1];
    return half ? { gems: Math.floor(prize.gems / 2), xp: Math.floor(prize.xp / 2) } : { ...prize };
  }

  function currentDisplayPrize() {
    if (!run) return { gems: 0, xp: 0 };
    if (run!.status === 'settled') return { gems: Number(run!.payoutGems || 0), xp: Number(run!.payoutXp || 0) };
    return payoutFor(run!.securedRound || 0);
  }

  function renderGrid() {
    const revealed = Boolean(run?.revealed);
    const available = !shotLocked && run?.status === 'playing' && run!.phase === 'choosing';
    cells.forEach((button, index) => {
      const cell = run?.cells?.[index];
      button.disabled = !available || Boolean(cell?.chosen);
      button.classList.toggle('is-safe', Boolean(revealed && cell?.safe));
      button.classList.toggle('is-danger', Boolean(revealed && cell && !cell.safe));
      button.classList.toggle('is-selected', Boolean(cell?.chosen));
      button.textContent = String(revealed && cell ? (cell.safe ? '✓' : '×') : String(index + 1).padStart(2, '0'));
      button.setAttribute('aria-label', revealed && cell
        ? `Hueco ${index + 1}, ${cell.safe ? 'penal convertido' : 'penal atajado'}`
        : `Lanzar al hueco ${index + 1}`);
    });
  }

  function render() {
    refreshDaily();
    const left = dailyLeft();
    page.querySelector<HTMLElement>('[data-attempts-left]')!.textContent = String(String(left));
    page.querySelectorAll<HTMLElement>('[data-attempt-dots] i').forEach((dot, index) => {
      dot.classList.toggle('is-used', index < daily.attempts);
      dot.classList.toggle('is-available', index >= daily.attempts);
    });

    const isPlaying = run?.status === 'playing';
    const isSettled = run?.status === 'settled';
    const round = isPlaying ? Math.min(9, Number(run!.round) || 1) : 1;
    const displayRound = run?.phase === 'advance' ? Math.min(9, round + 1) : round;
    const probability = (10 - displayRound) * 10;
    const nextPrize = rewards[displayRound - 1];
    const secured = currentDisplayPrize();

    page.querySelector<HTMLElement>('[data-round-label]')!.textContent = isSettled
      ? run!.outcome === 'complete' ? 'RETO COMPLETADO' : run!.outcome === 'retired' ? 'RETIRO CONFIRMADO' : 'PENAL ATAJADO'
      : isPlaying ? run!.phase === 'advance' ? `RONDA ${String(run!.securedRound).padStart(2, '0')} SUPERADA` : `RONDA ${String(round).padStart(2, '0')} / 09 · A LANZAR`
        : 'PREPARADO PARA EL RETO';
    page.querySelector<HTMLElement>('[data-probability]')!.textContent = String(isSettled ? 'FIN DEL RETO' : `${probability}% DE ACIERTO`);
    page.querySelector<HTMLElement>('[data-next-round-label]')!.textContent = String(isSettled ? 'RESULTADO' : `PREMIO · RONDA ${String(displayRound).padStart(2, '0')}`);
    page.querySelector<HTMLElement>('[data-next-probability]')!.textContent = String(isSettled ? (run!.outcome === 'failed' ? 'MITAD DEL PREMIO' : 'PREMIO COBRADO') : `${probability}% de acierto`);
    page.querySelector<HTMLElement>('[data-next-gems]')!.textContent = String(numberFormat.format(isSettled ? secured.gems : nextPrize.gems));
    page.querySelector<HTMLElement>('[data-next-xp]')!.textContent = String(numberFormat.format(isSettled ? secured.xp : nextPrize.xp));
    page.querySelector<HTMLElement>('[data-secured-gems]')!.textContent = String(numberFormat.format(secured.gems));
    page.querySelector<HTMLElement>('[data-secured-xp]')!.textContent = String(numberFormat.format(secured.xp));
    page.querySelector<HTMLElement>('[data-prize-state]')!.textContent = String(isSettled ? 'ENTREGADO' : run?.securedRound ? `RONDA ${String(run!.securedRound).padStart(2, '0')} ASEGURADA` : 'AÚN SIN PREMIO');
    page.querySelector<HTMLElement>('[data-risk-note]')!.textContent = isSettled
      ? run!.outcome === 'failed' ? 'El premio por fallar se calculó como la mitad del último escalón superado.' : 'La recompensa ya se añadió a tu monedero y a tu pase.'
      : run?.securedRound ? 'Puedes retirarte ahora y cobrar todo el premio asegurado. Si fallas, cobras la mitad.' : 'Supera la primera ronda para asegurar un premio y habilitar la retirada.';

    page.querySelectorAll<HTMLElement>('[data-round-progress] i').forEach((step, index) => {
      const n = index + 1;
      step.classList.toggle('is-cleared', Boolean((run?.securedRound ?? 0) >= n));
      step.classList.toggle('is-current', Boolean(isPlaying && displayRound === n));
      step.classList.toggle('is-failed', Boolean(isSettled && run!.outcome === 'failed' && run!.round === n));
      step.setAttribute('aria-label', `Ronda ${n}${(run?.securedRound ?? 0) >= n ? ', superada' : ''}`);
    });

    if (isSettled) {
      const outcomeText = run!.outcome === 'complete' ? '¡Nueve penales convertidos! Alcanzaste el premio máximo.'
        : run!.outcome === 'retired' ? 'Buena decisión. Te llevas el premio completo de tu último escalón.'
          : run!.securedRound ? `Penal atajado. Se te entregó la mitad del premio de la ronda ${String(run!.securedRound).padStart(2, '0')}.` : 'Penal atajado. No alcanzaste a asegurar un premio.';
      feedback.textContent = String(`${outcomeText} Recibiste ${numberFormat.format(secured.gems)} monedas y ${numberFormat.format(secured.xp)} XP.`);
    } else if (isPlaying && run!.phase === 'advance') {
      feedback.textContent = displayRound === 9
        ? 'Un acierto más te lleva al premio final. Puedes retirarte con todo lo que ya aseguraste.'
        : `¡Gol! Premio asegurado: ${numberFormat.format(secured.gems)} monedas y ${numberFormat.format(secured.xp)} XP. ¿Sigues al ${probability}% o te retiras?`;
    } else if (isPlaying) {
      feedback.textContent = String(`Elige uno de los diez huecos. Tienes un ${probability}% de convertir el penal de esta ronda.`);
    } else if (left === 0) {
      feedback.textContent = String('Ya usaste tus tres intentos de hoy. Vuelve mañana para un nuevo desafío.');
    } else {
      feedback.textContent = String(`Empieza el reto. Te quedan ${left} intento${left === 1 ? '' : 's'} hoy.`);
    }

    retireButton.hidden = !isPlaying || !run!.securedRound;
    retireButton.disabled = !isPlaying || shotLocked;
    startButton.disabled = shotLocked || (!isPlaying && left === 0);
    startButton.hidden = isPlaying && run!.phase !== 'advance';
    startButton.textContent = isPlaying ? `JUGAR RONDA ${String(displayRound).padStart(2, '0')}`
      : isSettled ? left ? 'JUGAR OTRO INTENTO' : 'INTENTOS AGOTADOS'
        : left ? 'COMENZAR RETO' : 'VUELVE MAÑANA';
    startButton.insertAdjacentHTML('beforeend', !isPlaying && left ? ' <span>→</span>' : '');

    renderGrid();
  }

  function createRun() {
    refreshDaily();
    if (daily.attempts >= maxAttempts) { render(); return; }
    daily.attempts += 1;
    if (!writeObject(dailyKey, daily)) {
      daily.attempts -= 1;
      feedback.textContent = String('No se pudo guardar el intento en este dispositivo. Revisa el espacio disponible.');
      return;
    }
    const id = window.crypto?.randomUUID?.() || `run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    run = { id, date: today(), status: 'playing', phase: 'choosing', round: 1, securedRound: 0, cells: makeCells(1), revealed: false };
    window.dispatchEvent(new CustomEvent('futin:penaltyready'));
    saveRun();
    render();
  }

  function beginNextRound() {
    if (!run || run!.status !== 'playing' || run!.phase !== 'advance') return;
    run!.round += 1;
    run!.phase = 'choosing';
    run!.cells = makeCells(run!.round);
    run!.revealed = false;
    window.dispatchEvent(new CustomEvent('futin:penaltyready'));
    saveRun();
    render();
  }

  function readPaidRuns() {
    try {
      const saved = JSON.parse(localStorage.getItem(paidRunsKey) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch { return []; }
  }

  function creditGems(id: string, amount: number) {
    if (amount <= 0) return;
    const paid = readPaidRuns();
    if (paid.includes(id)) return;
    window.FutinWallet.credit(`penalty:${id}`,amount,'Penalti decisivo');
    paid.push(id);
    localStorage.setItem(paidRunsKey, JSON.stringify(paid));
    window.dispatchEvent(new CustomEvent('futin:walletchange'));
  }

  function settle(outcome: string, half = false) {
    if (!run || run!.status !== 'playing') return;
    const prize = payoutFor(run!.securedRound || 0, half);
    const id = run!.id;
    try {
      creditGems(id, prize.gems);
      const xpReward = window.FutinSeasonPass?.awardOnce(`minigame:death-penalty:${id}`, prize.xp, 'minigame');
      run!.payoutGems = prize.gems;
      run!.payoutXp = xpReward?.xpAwarded || 0;
      run!.outcome = outcome;
      run!.status = 'settled';
      run!.settledAt = Date.now();
      saveRun();
    } catch {
      feedback.textContent = 'No pudimos registrar el premio. Tu intento quedó guardado; vuelve a intentarlo en un momento.';
      return;
    }
    render();
  }

  function takeShot(index: number) {
    if (shotLocked || !run || run!.status !== 'playing' || run!.phase !== 'choosing') return;
    const cell = run!.cells[index];
    if (!cell || cell.chosen) return;
    shotLocked = true;
    window.dispatchEvent(new CustomEvent('futin:penaltyshot',{detail:{index,safe:cell.safe}}));
    window.setTimeout(()=>{shotLocked=false;render();},matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1800);
    cell.chosen = true;
    run!.revealed = true;
    if (cell.safe) {
      run!.securedRound = run!.round;
      run!.phase = 'advance';
      if (run!.round === rewards.length) {
        // The final green completes the challenge and pays the full jackpot.
        settle('complete');
        return;
      }
      saveRun();
      feedback.textContent = String(`¡Gol! Premio asegurado: ${numberFormat.format(payoutFor(run!.securedRound).gems)} monedas y ${numberFormat.format(payoutFor(run!.securedRound).xp)} XP. Puedes continuar o retirarte.`);
    } else {
      settle('failed', true);
      return;
    }
    render();
  }

  startButton.addEventListener('click', () => {
    if (shotLocked) return;
    if (run?.status === 'playing' && run!.phase === 'advance') beginNextRound();
    else if (!run || run!.status === 'settled') createRun();
  });
  retireButton.addEventListener('click', () => { if (!shotLocked) settle('retired'); });
  cells.forEach((button, index) => button.addEventListener('click', () => takeShot(index)));
  window.addEventListener('storage', (event) => {
    if ([gemKey, dailyKey, runKey].includes(event.key ?? '')) {
      if (event.key === dailyKey) daily = readObject(dailyKey, { date: today(), attempts: 0 });
      if (event.key === runKey) run = readObject<PenaltyRun | null>(runKey, null);
      render();
    }
  });
  window.addEventListener('futin:daychange',() => {
    if (run?.status === 'settled') { run = null; saveRun(); }
    render();
  });
  document.addEventListener('visibilitychange',() => { if (!document.hidden) render(); });

  // Resume an in-progress penalty after a reload without spending another attempt.
  if (run?.status === 'playing' && (!Array.isArray(run!.cells) || run!.cells.length !== 10)) {
    run!.cells = makeCells(Math.min(9, Math.max(1, Number(run!.round) || 1)));
    run!.phase = 'choosing';
    run!.revealed = false;
    saveRun();
  }
  render();
})();



export {};
