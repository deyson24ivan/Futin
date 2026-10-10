import type {CareerPlayer, MatchSession, Chance, Tactic} from '../../domain/career';
import {required} from '../dom';
import {escapeHtml} from '../dom';
import {eventElement} from '../dom';
(() => {
  "use strict";
  const career = window.FutinCareer;
  if (!career) return;
  const $ = <T extends HTMLElement = HTMLElement>(selector: string): T => required<T>(selector);
  const $$ = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)];

  const money = (value: unknown) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value) || 0);
  const teamById = (id: string) => career.getState().league.teams.find((team) => team.id === id)!;
  const roundCount = () => Math.max(0, ...career.getState().fixtures.map((fixture) => fixture.round));
  const rowForClub = () => career.getStandings().find((row) => row.teamId === career.getState().selectedClubId);
  let activeMatch: MatchSession | null = null;
  let selectedTactic: Tactic = "balanced";
  let livePlaybackTimer: number | null = null;
  let livePlaying = false;
  let pendingSlotId: string | null = null;
  let pendingLeagueId: string | null = null;
  let pendingTeamId: string | null = null;
  let renameSlotId: string | null = null;
  let squadDrag: {id: string; card: HTMLElement; x: number; y: number; started: boolean; targetId: string | null; timer: number} | null = null;
  let suppressSquadClick = false;
  let modalReturnFocus: HTMLElement | null = null;

  function renderClubSelect() {
    const select = $<HTMLSelectElement>("#career-club"); const current = career.getState().selectedClubId;
    select.innerHTML = career.getState().league.teams.map((team) => `<option value="${escapeHtml(team.id)}">${escapeHtml(team.name)}</option>`).join("");
    select.value = current;
  }
  function showSaveManager() {
    $(`[data-save-manager]`).hidden = false;
    $(`[data-career-dashboard]`).hidden = true;
    renderCareerSlots();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function showCareerDashboard() {
    $(`[data-save-manager]`).hidden = true;
    $(`[data-career-dashboard]`).hidden = false;
    openTab("matches");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openCareerSetup(slotId: string) {
    const slot = career.getCareerSlots().find((entry) => entry.id === slotId);
    if (!slot || slot.occupied) return;
    pendingSlotId = slotId;
    pendingLeagueId = null;
    pendingTeamId = null;
    $<HTMLInputElement>('[data-career-name]').value = '';
    $<HTMLButtonElement>('[data-setup-save]').disabled = true;
    $(`[data-setup-slot-number]`).textContent = String(String(slot.index).padStart(2, "0"));
    $(`[data-setup-leagues]`).hidden = false;
    $(`[data-setup-teams]`).hidden = true;
    $(`[data-setup-subtitle]`).textContent = String("Primero selecciona una liga para ver sus equipos.");
    $(`[data-league-options]`).innerHTML = career.getAvailableLeagues().map((league) => `<button class="career-choice-card league-choice-card" type="button" data-league-id="${escapeHtml(league.id)}"><span class="choice-card-top"><i>${window.FutinIcons.icon('trophy')}</i><b>${league.teams.length} CLUBES</b></span><strong>${escapeHtml(league.name)}</strong><small>${escapeHtml(league.country)}</small><span class="choice-card-cta">VER EQUIPOS ${window.FutinIcons.icon('arrow')}</span></button>`).join("");
    modalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const modal = $(`[data-career-setup]`); modal.hidden = false; modal.setAttribute("aria-hidden", "false"); document.body.classList.add("career-setup-open");
    $<HTMLInputElement>('[data-career-name]').focus();
  }
  function closeCareerSetup() {
    const modal = $(`[data-career-setup]`); modal.hidden = true; modal.setAttribute("aria-hidden", "true"); document.body.classList.remove("career-setup-open");
    pendingSlotId = null; pendingLeagueId = null; pendingTeamId = null;
    modalReturnFocus?.focus();
  }
  function showLeagueTeams(leagueId: string) {
    const league = career.getAvailableLeagues().find((entry) => entry.id === leagueId);
    if (!league) return;
    pendingLeagueId = league.id;
    pendingTeamId = null;
    $<HTMLButtonElement>('[data-setup-save]').disabled = true;
    $(`[data-selected-league-title]`).textContent = String(league.name);
    $(`[data-selected-league-country]`).textContent = String(league.country.toUpperCase());
    $(`[data-setup-leagues]`).hidden = true;
    $(`[data-setup-teams]`).hidden = false;
    $(`[data-setup-subtitle]`).textContent = String("Elige el club que dirigirás en esta carrera.");
    $(`[data-team-options]`).innerHTML = league.teams.map((team, index) => `<button class="career-choice-card team-choice-card" type="button" data-team-id="${escapeHtml(team.id)}"><span class="team-choice-crest">${escapeHtml(team.shortName)}</span><span class="team-choice-copy"><strong>${escapeHtml(team.name)}</strong><small>Equipo ${String(index + 1).padStart(2, "0")} · ${escapeHtml(league.name)}</small></span><span class="team-choice-rating">${team.rating}<small>OVR</small></span></button>`).join("");
  }
  function renderCareerSlots() {
    const slots = career.getCareerSlots(); const occupied = slots.filter((slot) => slot.occupied).length;
    $(`[data-slot-counter]`).textContent = String(`${occupied} / ${slots.length} ESPACIOS`);
    const grid = $(`[data-career-slots]`);
    slots.forEach((slot) => {
      const card = grid.querySelectorAll<HTMLElement>("[data-career-slot-card]")[slot.index - 1];
      if (!card) return;
      card.classList.toggle("is-empty", !slot.occupied); card.classList.toggle("is-active-save", slot.isActive);
      if (!slot.occupied) {
        card.innerHTML = `<div class="save-slot-top"><span>ESPACIO ${String(slot.index).padStart(2, "0")}</span><span class="save-empty-mark" aria-hidden="true">＋</span></div><div class="save-slot-art is-empty-art"><img src="assets/premium/legacy-trophy.png?v=11" alt="" /><span>UNA NUEVA HISTORIA</span></div><h2>Tu próximo legado</h2><p>Dale un nombre a tu carrera y elige el club que llevarás a la cima.</p><button class="button button-secondary" type="button" data-slot-action="create" data-slot-id="${escapeHtml(slot.id)}">NUEVA CARRERA <span>→</span></button>`;
        return;
      }
      const rounds = slot.totalRounds;
      card.innerHTML = `<div class="save-slot-top"><span>${slot.isActive ? "PARTIDA ACTIVA" : `ESPACIO ${String(slot.index).padStart(2, "0")}`}</span><button class="save-delete" type="button" data-slot-action="delete" data-slot-id="${escapeHtml(slot.id)}" aria-label="Eliminar ${escapeHtml(slot.name)}">×</button></div><h2>${escapeHtml(slot.name)}</h2><p class="save-slot-club">${escapeHtml(slot.teamName || "Club por elegir")}</p><p>${escapeHtml(slot.leagueName || "Liga FUTIN")} · Temp. ${String(slot.season).padStart(2, "0")}</p><div class="save-slot-progress"><span>Jornada ${String(slot.currentRound).padStart(2, "0")} / ${String(rounds).padStart(2, "0")}</span><i><b style="width:${rounds ? Math.min(100, slot.currentRound / rounds * 100) : 0}%"></b></i></div><button type="button" class="button ${slot.isActive ? "button-neon" : "button-secondary"} save-load" data-slot-action="load" data-slot-id="${escapeHtml(slot.id)}">${slot.isActive ? "CONTINUAR CARRERA" : "CARGAR CARRERA"} <span>→</span></button>`;
      card.querySelector<HTMLElement>('h2')!.insertAdjacentHTML('beforebegin', `<div class="save-slot-art"><img src="assets/premium/legacy-trophy.png?v=11" alt="" /><span>TEMPORADA ${String(slot.season).padStart(2, '0')}</span></div>`);
      card.querySelector<HTMLElement>('h2')!.insertAdjacentHTML('afterend', `<button class="save-rename" type="button" data-slot-action="rename" data-slot-id="${escapeHtml(slot.id)}" aria-label="Editar nombre de ${escapeHtml(slot.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16 3 5 5-12 12-6 1 1-6L16 3Zm-2 2 5 5"/></svg> Editar nombre</button>`);
    });
  }
  const careerSlotsGrid = $(`[data-career-slots]`);
  careerSlotsGrid.addEventListener("click", (event) => {
      const button = eventElement(event).closest<HTMLElement>("[data-slot-action]"); if (!button) return;
      const { slotAction } = button.dataset; const slotId = button.dataset.slotId || button.closest<HTMLElement>("[data-career-slot-card]")?.dataset.careerSlotId; if (!slotId) return;
      try {
        if (slotAction === "create") { openCareerSetup(slotId); }
        if (slotAction === "load") { career.loadCareer(slotId); activeMatch = null; selectedTactic = "balanced"; showCareerDashboard(); }
        if (slotAction === 'rename') {
          const slot = career.getCareerSlots().find(entry => entry.id === slotId);
          if (!slot) return;
          renameSlotId = slotId;
          $<HTMLInputElement>('[data-rename-name]').value = slot.name;
          $('[data-rename-error]').hidden = true;
          $<HTMLDialogElement>('[data-career-rename]').showModal();
          $<HTMLInputElement>('[data-rename-name]').focus(); $<HTMLInputElement>('[data-rename-name]').select();
        }
        if (slotAction === "delete") {
          const slot = career.getCareerSlots().find((entry) => entry.id === slotId);
          if (!window.confirm(`¿Eliminar ${slot?.name || "esta carrera"}? Esta acción borra su partida guardada.`)) return;
          career.deleteCareer(slotId); activeMatch = null; renderCareerSlots();
        }
      } catch (error) { window.alert((error instanceof Error ? error.message : String(error))); }
  });
  $('[data-rename-cancel]').addEventListener('click', () => $<HTMLDialogElement>('[data-career-rename]').close());
  $('[data-rename-form]').addEventListener('submit', event => {
    event.preventDefault();
    try {
      if (!renameSlotId) return;
      career.renameCareer(renameSlotId, $<HTMLInputElement>('[data-rename-name]').value);
      $<HTMLDialogElement>('[data-career-rename]').close(); renderCareerSlots();
      careerSlotsGrid.querySelector<HTMLElement>(`[data-slot-action="rename"][data-slot-id="${renameSlotId}"]`)?.focus();
    } catch (error) { $('[data-rename-error]').textContent = String((error instanceof Error ? error.message : String(error))); $('[data-rename-error]').hidden = false; }
  });
  renderCareerSlots();
  $(`[data-career-setup]`).addEventListener("click", (event) => {
    if (eventElement(event).matches("[data-career-setup]")) { closeCareerSetup(); return; }
    if (eventElement(event).closest<HTMLElement>("[data-setup-close]")) { closeCareerSetup(); return; }
    if (eventElement(event).closest<HTMLElement>("[data-setup-back]")) {
      pendingLeagueId = null; pendingTeamId = null; $(`[data-setup-teams]`).hidden = true; $(`[data-setup-leagues]`).hidden = false;
      $(`[data-setup-subtitle]`).textContent = String("Primero selecciona una liga para ver sus equipos."); return;
    }
    const leagueButton = eventElement(event).closest<HTMLElement>("[data-league-id]");
    if (leagueButton) {
      const input = $<HTMLInputElement>('[data-career-name]');
      input.setCustomValidity(input.value.trim() ? '' : 'Escribe el nombre de tu carrera.');
      if (!input.reportValidity()) return;
      showLeagueTeams(leagueButton.dataset.leagueId!); return;
    }
    const teamButton = eventElement(event).closest<HTMLElement>("[data-team-id]");
    if (teamButton) {
      pendingTeamId = teamButton.dataset.teamId!;
      $$('[data-team-id]').forEach(button => button.setAttribute('aria-pressed', String(button === teamButton)));
      $<HTMLButtonElement>('[data-setup-save]').disabled = false; return;
    }
    if (!eventElement(event).closest<HTMLElement>('[data-setup-save]') || !pendingSlotId || !pendingLeagueId || !pendingTeamId) return;
    const input = $<HTMLInputElement>('[data-career-name]');
    input.setCustomValidity(input.value.trim() ? '' : 'Escribe el nombre de tu carrera.');
    if (!input.reportValidity()) return;
    try {
      career.createCareer(pendingSlotId, pendingLeagueId, pendingTeamId, input.value);
      const state = career.getState();
      window.FutinNotifications.add({title:'Nueva carrera',text:`Diriges a ${teamById(state.selectedClubId).name} en ${state.league.name}.`,href:'carrera.html',type:'trophy'});
      closeCareerSetup(); activeMatch = null; selectedTactic = "balanced"; showCareerDashboard();
    } catch (error) { window.alert((error instanceof Error ? error.message : String(error))); }
  });
  $<HTMLInputElement>('[data-career-name]').addEventListener('input', event => (eventElement(event) as HTMLInputElement).setCustomValidity(''));
  function renderNextMatch() {
    const state = career.getState(); const fixture = state.fixtures.find((f) => f.round === state.currentRound + 1 && f.status !== "played");
    const target = $("[data-next-match]");
    if (!fixture) {
      target.innerHTML = `<div class="career-season-ended"><strong>TEMPORADA COMPLETADA</strong><span>La clasificación final está lista. Tu carrera puede continuar.</span></div>`;
      $("[data-next-round]").textContent = String("FIN DE TEMPORADA"); $("[data-round-date]").textContent = String("Comienza la siguiente temporada con tu club");
      $<HTMLButtonElement>("[data-simulate-round]").disabled = false; $<HTMLButtonElement>("[data-simulate-round]").innerHTML = `COMENZAR TEMPORADA ${String(state.season + 1).padStart(2, "0")} <span>→</span>`; return;
    }
    const userFixture = fixture.homeId === state.selectedClubId || fixture.awayId === state.selectedClubId ? fixture : state.fixtures.find((f) => f.round === fixture.round && (f.homeId === state.selectedClubId || f.awayId === state.selectedClubId));
    const shown = userFixture || fixture; const home = teamById(shown.homeId), away = teamById(shown.awayId);
    target.innerHTML = `<div class="team-block"><span class="team-crest crest-home">${escapeHtml(home.shortName)}</span><strong>${escapeHtml(home.name.toUpperCase())}</strong><small class="team-ovr">${home.rating} OVR</small></div><div class="match-time"><span>JORNADA ${String(shown.round).padStart(2, "0")}</span><strong>VS</strong><small>${escapeHtml(career.getState().league.name.toUpperCase())}</small><span class="match-edge">${shown.homeId === state.selectedClubId ? "LOCAL" : shown.awayId === state.selectedClubId ? "VISITANTE" : "PARTIDO DESTACADO"}</span></div><div class="team-block"><span class="team-crest crest-away">${escapeHtml(away.shortName)}</span><strong>${escapeHtml(away.name.toUpperCase())}</strong><small class="team-ovr">${away.rating} OVR</small></div>`;
    $("[data-next-round]").textContent = String(`${state.league.name.toUpperCase()} · JORNADA ${String(shown.round).padStart(2, "0")}`);
    $("[data-round-date]").textContent = String(`${state.fixtures.filter((f) => f.round === shown.round).length - 1} partidos se simulan en segundo plano`);
    $<HTMLButtonElement>("[data-simulate-round]").disabled = false;
    $<HTMLButtonElement>("[data-simulate-round]").innerHTML = activeMatch && !activeMatch.finished ? `CONTINUAR MI PARTIDO <span>→</span>` : `JUGAR MI PARTIDO <span>→</span>`;
  }
  function addLiveEvent(text: string, minute: number | null = null, type = "") {
    const feed = $(`[data-live-events]`);
    if (feed.querySelector<HTMLElement>(".live-feed-empty")!) feed.innerHTML = "";
    const row = document.createElement("div"); row.className = `live-event ${type ? `event-${type}` : ""}`;
    if (minute !== null) { const time = document.createElement("b"); time.textContent = String(`${minute}'`); row.append(time); }
    const copy = document.createElement("span"); copy.textContent = String(text); row.append(copy); feed.prepend(row);
    while (feed.children.length > 12) feed.lastElementChild?.remove();
    $(`[data-live-event-count]`).textContent = String(`${activeMatch?.events.length || 0} EVENTOS`);
  }
  function showMatchModal(session: MatchSession) {
    modalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const modal = $(`[data-match-modal]`); modal.hidden = false; modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("match-sim-open"); renderLiveMatch(session);
    modal.querySelector<HTMLElement>('[data-match-close]')!.focus();
  }
  function clearLivePlaybackTimer() {
    if (livePlaybackTimer !== null) window.clearTimeout(livePlaybackTimer);
    livePlaybackTimer = null;
  }
  function getPlaybackDelay() {
    const speed = career.getState().settings?.matchSpeed || "normal";
    return speed === "fast" ? 480 : speed === "slow" ? 1350 : 850;
  }
  function scheduleLiveStep(delay = getPlaybackDelay()) {
    clearLivePlaybackTimer();
    if (!livePlaying || !activeMatch || activeMatch.finished || activeMatch.pendingChance) return;
    livePlaybackTimer = window.setTimeout(() => { livePlaybackTimer = null; runLiveStep(); }, delay);
  }
  function startLivePlayback(delay = 850) {
    if (!activeMatch || activeMatch.finished || activeMatch.pendingChance) return;
    livePlaying = true; renderLiveMatch(activeMatch); scheduleLiveStep(delay);
  }
  function pauseLivePlayback() {
    livePlaying = false; clearLivePlaybackTimer();
    if (activeMatch) renderLiveMatch(activeMatch);
  }
  function hideMatchModal() {
    livePlaying = false; clearLivePlaybackTimer();
    const modal = $(`[data-match-modal]`); modal.hidden = true; modal.setAttribute("aria-hidden", "true"); document.body.classList.remove("match-sim-open");
    modalReturnFocus?.focus();
  }
  function renderLiveMatch(session: MatchSession) {
    const home = teamById(session.homeId), away = teamById(session.awayId);
    $(`[data-live-round]`).textContent = String(String(session.round).padStart(2, "0"));
    $(`[data-live-home-name]`).textContent = String(home.name.toUpperCase()); $(`[data-live-away-name]`).textContent = String(away.name.toUpperCase());
    $(`[data-live-home-crest]`).textContent = String(home.shortName); $(`[data-live-away-crest]`).textContent = String(away.shortName);
    $(`[data-live-home-ovr]`).textContent = String(`OVR ${home.rating}`); $(`[data-live-away-ovr]`).textContent = String(`OVR ${away.rating}`);
    const homeLines = career.teamLines(home), awayLines = career.teamLines(away);
    (["attack", "midfield", "defense"] as const).forEach((line) => { $(`[data-home-${line}]`).textContent = String(Math.round(homeLines[line])); $(`[data-away-${line}]`).textContent = String(Math.round(awayLines[line])); });
    $(`[data-live-home-score]`).textContent = String(session.homeGoals); $(`[data-live-away-score]`).textContent = String(session.awayGoals);
    $(`[data-live-clock]`).textContent = String(`${String(session.minute).padStart(2, "0")}'`);
    $(`[data-live-status]`).textContent = String(session.finished ? "FINAL" : session.minute === 0 ? "POR INICIAR" : "EN DIRECTO");
    $(`[data-home-possession]`).textContent = String(session.stats.homePossession); $(`[data-away-possession]`).textContent = String(session.stats.awayPossession);
    $(`[data-possession-bar]`).style.width = `${session.stats.homePossession}%`;
    $(`[data-home-shots]`).textContent = String(session.stats.homeShots); $(`[data-away-shots]`).textContent = String(session.stats.awayShots);
    $(`[data-home-target]`).textContent = String(session.stats.homeOnTarget); $(`[data-away-target]`).textContent = String(session.stats.awayOnTarget);
    $(`[data-live-event-count]`).textContent = String(`${session.events.length} EVENTOS`);
    const possessionIsUser = session.possessionTeamId === session.userTeamId;
    $(`[data-live-ball]`).classList.toggle("ball-user", possessionIsUser); $(`[data-live-ball]`).classList.toggle("ball-opponent", !possessionIsUser);
    $(`[data-live-ball]`).classList.toggle("ball-home-possession", session.possessionTeamId === session.homeId); $(`[data-live-ball]`).classList.toggle("ball-away-possession", session.possessionTeamId === session.awayId);
    if (session.minute === 0) $(`[data-live-caption]`).textContent = String("EL PARTIDO ESTÁ POR COMENZAR");
    else if (session.pendingChance) $(`[data-live-caption]`).textContent = String(session.pendingChance.userIsAttacking ? "TU EQUIPO ESTÁ FRENTE AL ARCO" : "EL RIVAL REMATA · ¡ES TU TURNO DE ATAJAR!");
    else $(`[data-live-caption]`).textContent = String(possessionIsUser ? "TU EQUIPO TIENE EL BALÓN" : "EL RIVAL CONTROLA LA POSESIÓN");
    $$(`[data-tactic]`).forEach((button) => {
      const selected = button.dataset.tactic === selectedTactic;
      button.classList.toggle("is-selected", selected); button.setAttribute("aria-pressed", String(selected));
    });
    const rivalTactic = session.userTeamId === session.homeId ? session.awayTactic : session.homeTactic;
    $(`[data-rival-tactic]`).textContent = String(rivalTactic === "attack" ? "ATAQUE" : rivalTactic === "defensive" ? "DEFENSIVA" : "EQUILIBRADA");
    const advance = $<HTMLButtonElement>(`[data-match-advance]`), back = $(`[data-match-back]`);
    advance.hidden = session.finished; back.hidden = !session.finished;
    advance.disabled = Boolean(session.pendingChance);
    advance.innerHTML = session.pendingChance ? `RESUELVE LA JUGADA` : session.minute === 0 ? `INICIAR PARTIDO <span>→</span>` : livePlaying ? `PAUSAR SIMULACIÓN <span>Ⅱ</span>` : `REANUDAR PARTIDO <span>→</span>`;
    if (session.finished) {
      $(`[data-live-caption]`).textContent = String(`FINAL · ${home.name} ${session.homeGoals} — ${session.awayGoals} ${away.name}`);
      $(`[data-chance-panel]`).hidden = true;
      $(`[data-live-events]`).scrollTop = 0;
    }
  }
  function showChance(chance: Chance) {
    const panel = $(`[data-chance-panel]`); const grid = $(`[data-goal-grid]`);
    panel.hidden = false;
    const favorableCount = clampCount(Math.round(chance.probability / 10));
    const displayedProbability = favorableCount * 10;
    chance.probability = displayedProbability;
    $(`[data-chance-good-count]`).textContent = String(favorableCount); $(`[data-chance-bad-count]`).textContent = String(10 - favorableCount);
    const attacking = chance.type === "shoot";
    $(`[data-chance-kicker]`).textContent = String(chance.isGreatChance ? "¡GRAN OPORTUNIDAD!" : attacking ? "OPORTUNIDAD DE GOL" : "OPORTUNIDAD DE ATAJAR");
    $(`[data-chance-title]`).textContent = String(attacking ? `¡${displayedProbability}% DE GOL!` : `¡${displayedProbability}% DE ATAJAR!`);
    $(`[data-chance-copy]`).textContent = String(attacking ? `${chance.shooterName} (${chance.shooterPosition}) define frente a ${chance.keeperName}. Elige una de las diez casillas.` : `${chance.shooterName} remata. Tu portero ${chance.keeperName} tiene ${displayedProbability}% de probabilidad de atajarla. Elige una casilla.`);
    $(`[data-chance-hint]`).textContent = String("Las casillas se revelan después de elegir.");
    const cells = Array.from({ length: 10 }, (_, index) => ({ index, favorable: index < favorableCount }));
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    grid.innerHTML = cells.map((cell, index) => `<button class="goal-cell" type="button" data-goal-cell data-favorable="${cell.favorable}" aria-label="Casilla ${index + 1}"><span>${String(index + 1).padStart(2, "0")}</span></button>`).join("");
    grid.querySelectorAll<HTMLButtonElement>(`[data-goal-cell]`).forEach((cell) => cell.addEventListener("click", () => {
      grid.querySelectorAll<HTMLButtonElement>(`[data-goal-cell]`).forEach((button) => {
        button.disabled = true;
        button.classList.add(button.dataset.favorable === "true" ? "is-favorable" : "is-unfavorable");
        button.setAttribute("aria-label", `Casilla ${button.textContent.trim()}, ${button.dataset.favorable === "true" ? "favorable" : "desfavorable"}`);
      });
      const success = cell.dataset.favorable === "true"; cell.classList.add(success ? "picked-good" : "picked-bad");
      if (!activeMatch) return;
      const resolved = career.resolveInteractiveChance(activeMatch, success); if (!resolved) return;
      $(`[data-chance-title]`).textContent = String(resolved.outcome === "goal" ? "¡GOOOOL!" : resolved.outcome === "save" ? "¡ATAJADÓN!" : resolved.outcome === "saved" ? "¡EL PORTERO LA DETUVO!" : resolved.outcome === "goal-against" ? "GOL DEL RIVAL" : "¡SE FUE AFUERA!");
      $(`[data-chance-copy]`).textContent = String(resolved.event.text); $(`[data-chance-hint]`).textContent = String("La jugada terminó. El partido continuará automáticamente.");
      addLiveEvent(resolved.event.text ?? "", resolved.event.minute, resolved.outcome); renderLiveMatch(activeMatch);
      panel.hidden = false;
      startLivePlayback(1500);
    }));
  }
  function clampCount(value: number) { return Math.min(9, Math.max(1, value)); }
  function completeLiveMatch() {
    if (!activeMatch) return;
    livePlaying = false; clearLivePlaybackTimer();
    const fixture = career.finishInteractiveMatch(activeMatch);
    const h = teamById(fixture.homeId), a = teamById(fixture.awayId);
    const userIsHome = fixture.homeId === career.getState().selectedClubId;
    const userGoals = (userIsHome ? fixture.homeGoals : fixture.awayGoals) ?? 0;
    const opponentGoals = (userIsHome ? fixture.awayGoals : fixture.homeGoals) ?? 0;
    const result = userGoals > opponentGoals ? "win" : userGoals === opponentGoals ? "draw" : "loss";
    const slotId = career.getActiveSlotId() || "career";
    const seasonPass = window.FutinSeasonPass;
    const matchXp = seasonPass?.awardCareerMatch({
      id: `${slotId}:${career.getState().league.id}:${career.getState().season}:${fixture.id}`,
      result,
    });
    let titleXp = null;
    const finalRound = fixture.round === roundCount();
    if (finalRound && career.getStandings()[0]?.teamId === career.getState().selectedClubId) {
      titleXp = seasonPass?.awardCareerTitle(`${slotId}:${career.getState().league.id}:${career.getState().season}`);
    }
    activeMatch.finished = true; renderLiveMatch(activeMatch);
    addLiveEvent(`Final: ${h.name} ${fixture.homeGoals} — ${fixture.awayGoals} ${a.name}.`, 90, "final");
    const xpNotes = [];
    if (matchXp?.xpAwarded) xpNotes.push(`+${matchXp.xpAwarded} XP del pase`);
    if (titleXp?.xpAwarded) xpNotes.push(`+${titleXp.xpAwarded} XP por ganar la liga`);
    const seasonResult = finalRound && titleXp?.awarded ? " ¡Campeón de liga!" : "";
    window.FutinNotifications.add({id:`career-result:${slotId}:${career.getState().season}:${fixture.id}`,title:titleXp?.awarded ? 'Campeón de liga' : 'Partido finalizado',text:`${h.name} ${fixture.homeGoals} — ${fixture.awayGoals} ${a.name}${xpNotes.length ? ` · ${xpNotes.join(' · ')}` : ''}.`,href:'carrera.html',type:'trophy'});
    $(`[data-career-feedback]`).textContent = String(`Tu partido terminó: ${h.name} ${fixture.homeGoals} — ${fixture.awayGoals} ${a.name}.${seasonResult} Los otros encuentros de la jornada ya están registrados.${xpNotes.length ? ` ${xpNotes.join(" · ")}.` : ""}`);
    render();
  }
  function runLiveStep() {
    if (!activeMatch || activeMatch.finished || activeMatch.pendingChance) return;
    if (activeMatch.minute >= 90) { completeLiveMatch(); return; }
    $(`[data-chance-panel]`).hidden = true;
    const result = career.advanceInteractiveMatch(activeMatch, selectedTactic);
    if (result.event) addLiveEvent(result.event.text ?? "", result.event.minute, result.event.type);
    if (result.chance) showChance(result.chance);
    renderLiveMatch(activeMatch);
    if (result.type === "finished") completeLiveMatch();
    else if (result.chance) { livePlaying = false; clearLivePlaybackTimer(); renderLiveMatch(activeMatch); }
    else scheduleLiveStep();
  }

  function renderStandings() {
    const rows = career.getStandings();
    $$("[data-standings]").forEach((tbody) => {
      tbody.innerHTML = rows.map((r, i) => `<tr class="${r.teamId === career.getState().selectedClubId ? "is-user-club" : ""}"><td>${String(i + 1).padStart(2, "0")}</td><td><span class="table-crest">${escapeHtml(r.team.shortName)}</span><strong>${escapeHtml(r.team.name)}</strong></td><td>${r.played}</td><td>${r.won}</td><td>${r.drawn}</td><td>${r.lost}</td><td>${r.goalsFor}</td><td>${r.goalsAgainst}</td><td class="${r.goalDiff > 0 ? "positive" : r.goalDiff < 0 ? "negative" : ""}">${r.goalDiff > 0 ? "+" : ""}${r.goalDiff}</td><td><b>${r.points}</b></td></tr>`).join("");
    });
    const mine = rowForClub();
    $("[data-my-rank]").textContent = String(mine ? `${String(rows.findIndex((r) => r.teamId === mine.teamId) + 1).padStart(2, "0")} / ${rows.length}` : "—");
    $("[data-stat-rank]").textContent = String(mine ? `${String(rows.findIndex((r) => r.teamId === mine.teamId) + 1).padStart(2, "0")}º` : "—");
    $("[data-stat-points]").textContent = String(mine?.points ?? 0); $("[data-stat-played]").textContent = String(mine?.played ?? 0); $("[data-stat-rating]").textContent = String(mine?.team.rating ?? "—");
    const complete = roundCount() ? career.getState().currentRound / roundCount() * 100 : 0;
    $$("[data-season-progress-label]").forEach((el) => { el.textContent = String(`${Math.round(complete)}%`); });
    $$("[data-season-progress-bar]").forEach((el) => { el.style.width = `${complete}%`; });
    $$("[data-round-counter]").forEach((el) => { el.textContent = String(`JORNADA ${String(career.getState().currentRound).padStart(2, "0")} / ${String(roundCount()).padStart(2, "0")}`); });
    $$("[data-mini-standings]").forEach((el) => { el.innerHTML = rows.slice(0, 5).map((r, i) => `<div class="career-mini-row ${r.teamId === career.getState().selectedClubId ? "is-user-club" : ""}"><span>${String(i + 1).padStart(2, "0")}</span><i class="table-crest">${escapeHtml(r.team.shortName)}</i><strong>${escapeHtml(r.team.name)}</strong><small>${r.played} PJ</small><b>${r.points}</b></div>`).join(""); });
  }
  function renderRoundSelector() {
    const select = $<HTMLSelectElement>("[data-round-select]"); const selected = Math.min(Number(select.value) || career.getState().currentRound || 1, roundCount());
    select.innerHTML = Array.from({ length: roundCount() }, (_, i) => `<option value="${i + 1}">Jornada ${String(i + 1).padStart(2, "0")}${i + 1 <= career.getState().currentRound ? " · Jugada" : ""}</option>`).join("");
    select.value = String(selected || 1); renderFixtures(selected || 1);
  }
  function renderFixtures(round: number | string) {
    const matches = career.getState().fixtures.filter((f) => f.round === Number(round));
    $("[data-fixtures]").innerHTML = matches.map((f) => {
      const home = teamById(f.homeId), away = teamById(f.awayId), score = f.status === "played" ? `${f.homeGoals} — ${f.awayGoals}` : "VS";
      const goals = f.status === "played" ? f.events.filter((event) => event.type === "goal").map((event) => `${event.minute}' ${escapeHtml(event.playerName)}`).join(" · ") || "Sin goles" : "Pendiente";
      return `<div class="fixture-row ${f.homeId === career.getState().selectedClubId || f.awayId === career.getState().selectedClubId ? "is-user-club" : ""}"><span class="fixture-team">${escapeHtml(home.name)}</span><strong class="fixture-score ${f.status === "played" ? "is-played" : ""}">${score}</strong><span class="fixture-team">${escapeHtml(away.name)}</span><small>${goals}</small></div>`;
    }).join("") || `<p class="career-empty">No hay partidos en esta jornada.</p>`;
  }
  function renderRecentResults() {
    const played = career.getState().fixtures.filter((f) => f.status === "played").slice(-5).reverse();
    $("[data-recent-results]").innerHTML = played.length ? played.map((f) => { const h = teamById(f.homeId), a = teamById(f.awayId); return `<div class="career-result-row"><span>${escapeHtml(h.shortName)} <b>${f.homeGoals} — ${f.awayGoals}</b> ${escapeHtml(a.shortName)}</span><small>J${String(f.round).padStart(2, "0")}</small></div>`; }).join("") : `<p class="career-empty compact">Aún no se han jugado partidos. Simula la primera jornada.</p>`;
  }
  function renderSquad() {
    const previousCardRects = new Map([...document.querySelectorAll<HTMLElement>("[data-career-player-id]")].map((card) => [card.dataset.careerPlayerId!, card.getBoundingClientRect()]));
    const team = teamById(career.getState().selectedClubId);
    const players = [...(team?.players || [])].sort((a, b) => a.squadSlot! - b.squadSlot! || b.overall - a.overall);
    const starters = new Set(players.filter((player) => player.squadSlot! < 11).map((player) => player.id));
    const state = career.getState();
    const formation = state.teamFormation || "4-3-3";
    const pattern = window.FutinFormations.rows(formation);
    const field = $(`[data-career-pitch]`);
    field.style.setProperty('--formation-rows',String(pattern.length));
    const ordered = players.filter((player) => player.squadSlot! < 11).sort((a, b) => a.squadSlot! - b.squadSlot!);
    const makeCard = (player: CareerPlayer, extraClass = "") => {
      const faceStats = [["PAC", player.pace], ["SHO", player.shooting], ["PAS", player.passing], ["DRI", player.dribbling ?? Math.round((player.pace + player.passing) / 2)], ["DEF", player.defending], ["PHY", player.physical]];
      const type = window.FutinCard.baseTypeFor(player);
      const country = window.FutinCardData.country(player.countryCode || player.country || player.nationality || state.league.country);
      const frontLabel = `${player.name}, valoración ${player.overall}, ${player.position}${country ? `, ${country.name}` : ''}. Ver estadísticas`;
      const detailId = `career-card-details-${player.id}`;
      return `<button type="button" class="career-player-card career-mini-card ${extraClass}" data-career-player-id="${escapeHtml(player.id)}" data-front-label="${escapeHtml(frontLabel)}" data-back-label="${escapeHtml(player.name)}, volver al frente" aria-label="${escapeHtml(frontLabel)}" aria-pressed="false"><span class="career-card-rotator"><span class="career-mini-front" aria-hidden="false">${window.FutinCard.mini({...player, countryCode:country?.code, rating:player.overall})}</span><span class="career-mini-back bronze-card bronze-card-special bronze-type-${type}" aria-hidden="true"><img class="bronze-base" src="assets/cards/bronze/base-half.png" alt="" draggable="false"/>${window.FutinCard.finish()}<span class="career-mini-details" id="${escapeHtml(detailId)}"><strong>${escapeHtml(player.name)}</strong><span class="career-mini-stats">${faceStats.map(([label, value]) => `<span><small>${label}</small><b>${escapeHtml(value ?? '--')}</b></span>`).join('')}</span><span class="career-mini-facts"><span><small>EDAD</small><b>${escapeHtml(player.age ?? '--')} <small>años</small></b></span><span><small>POTENCIAL</small><b>${escapeHtml(player.potential ?? '--')}</b></span></span><span class="career-mini-value"><small>VALOR</small><b>${money(player.value)}</b></span></span></span></span></button>`;
    };
    let playerIndex = 0;
    field.innerHTML = pattern.map((count, rowIndex) => `<div class="career-card-row career-card-row-${rowIndex}" style="--row-size:${count}">${Array.from({ length: count }, (_, column) => {
      const player = ordered[playerIndex++];
      const role = window.FutinFormations.catalog[formation][rowIndex][column];
      return `<div class="career-tactical-slot">${player ? makeCard(player) : '<span class="career-slot-empty">+</span>'}<span class="tactical-position">${role}</span></div>`;
    }).join("")}</div>`).join("");
    $(`[data-squad-team]`).textContent = String(team ? team.name.toUpperCase() : "PLANTILLA DEL CLUB");
    $$(`[data-squad-count]`).forEach((el) => { el.textContent = String(`${players.length} JUGADORES`); });
    $(`[data-career-starter-count]`).textContent = String(`${ordered.length} TITULARES`);
    $(`[data-career-squad-rating]`).innerHTML = `${ordered.length ? Math.round(ordered.reduce((sum, player) => sum + player.overall, 0) / ordered.length) : "—"} <small>OVR</small>`;
    $<HTMLSelectElement>(`[data-career-formation]`).value = formation;
    window.dispatchEvent(new CustomEvent('futin:formationchange'));
    $(`[data-career-formation-label]`).textContent = String(formation);
    const bench = players.filter((player) => player.squadSlot! >= 11 && player.squadSlot! < 18).sort((a, b) => a.squadSlot! - b.squadSlot!);
    const reserves = players.filter((player) => player.squadSlot! >= 18).sort((a, b) => a.squadSlot! - b.squadSlot!);
    $(`[data-career-bench-count]`).textContent = String(`${bench.length} / 7`);
    $(`[data-career-bench]`).innerHTML = bench.map((player) => makeCard(player, "career-bench-card")).join("") || `<p class="career-empty">Todavía no hay suplentes.</p>`;
    $(`[data-career-reserve-count]`).textContent = String(`${reserves.length} / 5`);
    $(`[data-career-reserves]`).innerHTML = reserves.map((player) => makeCard(player, "career-bench-card")).join("") || `<p class="career-empty">Todavía no hay jugadores en reserva.</p>`;
    $(`[data-squad-rows]`).innerHTML = players.map((player) => {
      const stats = [["Ritmo", player.pace], ["Tiro", player.shooting], ["Pase", player.passing], ["Defensa", player.defending], ["Físico", player.physical]].map(([name, value]) => `<span>${name}<b>${value}</b></span>`).join("");
      const required = player.overall < player.potential ? career.xpToNext(player.overall) : 0;
      const status = player.squadSlot! < 11 ? "TITULAR" : player.squadSlot! < 18 ? "SUPLENTE" : "RESERVA";
      return `<tr class="career-player-row" data-career-player-row="${escapeHtml(player.id)}" tabindex="0" aria-expanded="false"><td><strong>${escapeHtml(player.name)}</strong></td><td><span class="position-pill">${escapeHtml(player.position)}</span></td><td><b class="player-ovr">${player.overall}</b></td><td>${player.potential}</td><td>${player.age}</td><td>${player.goals || 0}</td><td>${player.assists || 0}</td><td>${money(player.value)}</td><td><span class="squad-player-status ${status === "TITULAR" ? "is-starter" : ""}">${status}</span></td></tr><tr data-career-player-detail="${escapeHtml(player.id)}" hidden><td colspan="9"><div class="player-detail-content"><div class="player-detail-stats">${stats}</div><div class="player-detail-progress"><span>${required ? `PROGRESO AL SIGUIENTE NIVEL · ${player.xp || 0} / ${required} XP` : "POTENCIAL ALCANZADO"}</span><i><b style="width:${required ? Math.min(100, Math.round((player.xp || 0) / required * 100)) : 100}%"></b></i></div></div></td></tr>`;
    }).join("");
    renderCareerTraining(); renderAcademy();
    if (previousCardRects.size && typeof Element.prototype.animate === "function") {
      requestAnimationFrame(() => document.querySelectorAll<HTMLElement>("[data-career-player-id]").forEach((card) => {
        const before = previousCardRects.get(card.dataset.careerPlayerId!);
        if (!before) return;
        const after = card.getBoundingClientRect();
        const dx = before.left - after.left, dy = before.top - after.top;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) card.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], { duration: 300, easing: "cubic-bezier(.2,.75,.2,1)" });
      }));
    }
  }
  function renderCareerTraining() {
    const team = teamById(career.getState().selectedClubId);
    const select = $<HTMLSelectElement>(`[data-training-player]`); const previous = select.value;
    const players = [...(team?.players || [])].sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name, "es"));
    select.innerHTML = players.map((player) => `<option value="${escapeHtml(player.id)}">${escapeHtml(player.name)} · ${player.position} · ${player.overall} OVR</option>`).join("");
    if (players.some((player) => player.id === previous)) select.value = previous;
    const player = players.find((entry) => entry.id === select.value) || players[0];
    if (!player) { $(`[data-training-card]`).innerHTML = `<p class="career-empty">No hay futbolistas en este club.</p>`; return; }
    const required = player.overall < player.potential ? career.xpToNext(player.overall) : 0;
    const xp = required ? Math.min(required, player.xp || 0) : 0;
    const xpModel = career.trainingXpBreakdown(player);
    const ageEffect = player.age <= 20 ? "impulso joven" : player.age <= 23 ? "desarrollo joven" : player.age <= 29 ? "ritmo de madurez" : "desarrollo veterano";
    $(`[data-training-card]`).innerHTML = `<div class="training-avatar"><span class="career-face"><i></i></span><div><small>${escapeHtml(player.position)} · ${player.age} AÑOS</small><strong>${escapeHtml(player.name)}</strong><span>${player.overall} OVR <i>·</i> ${player.potential} POT</span></div><b>${player.overall}</b></div><div class="training-xp"><div><span>EXPERIENCIA DE NIVEL</span><strong>${required ? `${xp} / ${required} XP` : "POTENCIAL ALCANZADO"}</strong></div><i><b style="width:${required ? Math.round(xp / required * 100) : 100}%"></b></i></div><p class="training-gain">Sesión: <b>+${xpModel.total} XP</b> <span>· ${ageEffect} ×${xpModel.ageMultiplier.toFixed(2)} · potencial ×${xpModel.potentialMultiplier.toFixed(2)}</span></p>`;
    $<HTMLButtonElement>(`[data-train-player]`).disabled = player.overall >= player.potential;
  }
  function renderAcademy() {
    const academy = career.getState().academy;
    $(`[data-academy-month]`).textContent = String(`MES ${String(academy.month).padStart(2, "0")}`);
    $(`[data-academy-status]`).textContent = String(academy.signedThisMonth ? "FICHAJE DEL MES REALIZADO" : "ELIGE A 1 DE LOS 3 JÓVENES");
    $(`[data-academy-candidates]`).innerHTML = academy.candidates.map((player, index) => `<article class="academy-card ${player.overall >= 69 ? "is-exceptional" : ""}"><div class="academy-card-top"><span>JOVEN ${String(index + 1).padStart(2, "0")}</span><b>${player.overall}<small>OVR</small></b></div><span class="academy-face"><i></i></span><h3>${escapeHtml(player.name)}</h3><p>${escapeHtml(player.position)} <i>·</i> ${player.age} AÑOS</p><div class="academy-potential"><span>POTENCIAL</span><strong>${player.potential}</strong></div><button type="button" class="button ${academy.signedThisMonth ? "button-secondary" : "button-neon"}" data-sign-academy="${escapeHtml(player.id)}" ${academy.signedThisMonth ? "disabled" : ""}>${academy.signedThisMonth ? "SELECCIÓN CERRADA" : "FICHAR JOVEN"}</button>${player.overall >= 69 ? `<small class="academy-lucky">TALENTO EXCEPCIONAL</small>` : ""}</article>`).join("");
  }
  function renderCareerStats() {
    const team = teamById(career.getState().selectedClubId);
    const standing = rowForClub();
    const players = [...(team?.players || [])];
    const renderLeaders = (selector: string, key: "goals" | "assists", suffix: string) => {
      const leaders = [...players].sort((a, b) => (b[key] || 0) - (a[key] || 0) || b.overall - a.overall).slice(0, 5);
      const container = $(selector);
      container.innerHTML = leaders.some((player) => player[key] > 0) ? leaders.map((player, index) => `<div class="career-leader-row"><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(player.position)}</small><b>${player[key] || 0} ${suffix}</b></div>`).join("") : `<p class="career-empty compact">Las estadísticas aparecerán después de jugar partidos.</p>`;
    };
    $(`[data-stats-club]`).textContent = String(team?.name.toUpperCase() || "MI CLUB");
    $(`[data-club-stat-played]`).textContent = String(standing?.played || 0);
    $(`[data-club-stat-for]`).textContent = String(standing?.goalsFor || 0);
    $(`[data-club-stat-against]`).textContent = String(standing?.goalsAgainst || 0);
    $(`[data-club-stat-points]`).textContent = String(standing?.points || 0);
    $(`[data-club-stat-diff]`).textContent = String(standing ? `${standing.goalDiff > 0 ? "+" : ""}${standing.goalDiff}` : "0");
    renderLeaders("[data-top-scorers]", "goals", "GOL");
    renderLeaders("[data-top-assists]", "assists", "AS");
  }
  function renderCareerSettings() {
    const state = career.getState();
    const team = teamById(state.selectedClubId);
    const activeSlot = career.getCareerSlots().find((slot) => slot.isActive);
    $<HTMLSelectElement>(`[data-match-speed]`).value = state.settings?.matchSpeed || "normal";
    $(`[data-settings-slot]`).textContent = String(`ESPACIO ${String(activeSlot?.index || 1).padStart(2, "0")}`);
    $(`[data-settings-club]`).textContent = String(team?.name || "—");
    $(`[data-settings-league]`).textContent = String(state.league.name);
    $(`[data-settings-season]`).textContent = String(`TEMPORADA ${String(state.season).padStart(2, "0")}`);
  }
  function render() {
    const state = career.getState();
    $$("[data-season-number]").forEach((el) => { el.textContent = String(String(state.season).padStart(2, "0")); }); $$("[data-league-name]").forEach((e) => { e.textContent = String(state.league.name.toUpperCase()); });
    renderClubSelect(); renderNextMatch(); renderStandings(); renderRoundSelector(); renderRecentResults(); renderSquad(); renderCareerStats(); renderCareerSettings();
    window.FutinPremium?.renderAchievements();
  }
  function openTab(name: string) {
    $$("[data-career-tab]").forEach((tab) => { const active = tab.dataset.careerTab! === name; tab.classList.toggle("is-active", active); tab.setAttribute("aria-selected", String(active)); });
    $$ ("[data-career-view]").forEach((view) => { const active = view.dataset.careerView === name; view.hidden = !active; view.classList.toggle("is-visible", active); });
    if (name === "squad") openCareerTeamTab("lineup");
  }

  function openCareerTeamTab(name: string) {
    $$ ("[data-career-team-tab]").forEach((tab) => { const active = tab.dataset.careerTeamTab! === name; tab.classList.toggle("is-active", active); tab.setAttribute("aria-selected", String(active)); });
    $$ ("[data-career-team-view]").forEach((view) => { const active = view.dataset.careerTeamView === name; view.hidden = !active; view.classList.toggle("is-visible", active); });
  }

  $$("[data-career-tab]").forEach((tab) => tab.addEventListener("click", () => openTab(tab.dataset.careerTab!)));
  $$("[data-open-tab]").forEach((button) => button.addEventListener("click", () => openTab(button.dataset.openTab!)));
  $$ ("[data-career-team-tab]").forEach((tab) => tab.addEventListener("click", () => openCareerTeamTab(tab.dataset.careerTeamTab!)));
  $<HTMLSelectElement>("[data-career-formation]").addEventListener("change", (event) => { career.setTeamFormation((eventElement(event) as HTMLInputElement).value); renderSquad(); });
  $<HTMLSelectElement>("[data-training-player]").addEventListener("change", renderCareerTraining);
  $<HTMLButtonElement>("[data-train-player]").addEventListener("click", () => {
    const outcome = career.trainSelectedPlayer($<HTMLSelectElement>("[data-training-player]").value);
    if ("error" in outcome) { $("[data-training-feedback]").textContent = String(outcome.error); return; }
    const player = outcome.player;
    $("[data-training-feedback]").textContent = String(outcome.levelsGained ? `${player.name} subió ${outcome.levelsGained} nivel${outcome.levelsGained === 1 ? "" : "es"}: ahora tiene ${player.overall} OVR.` : `${player.name} ganó ${outcome.earned} XP. Le faltan ${Math.max(0, outcome.nextXp - player.xp)} XP para subir.`);
    render();
  });
  $("[data-advance-academy]").addEventListener("click", () => {
    const academy = career.advanceAcademyMonth();
    $("[data-academy-feedback]").textContent = String(`Llegaron tres prospectos nuevos para el mes ${academy.month}.`);
    render();
  });
  $("[data-academy-candidates]").addEventListener("click", (event) => {
    const button = eventElement(event).closest<HTMLElement>("[data-sign-academy]"); if (!button) return;
    const result = career.signAcademyPlayer(button.dataset.signAcademy!);
    let xpNote = "";
    if (!("error" in result) && window.FutinSeasonPass) {
      const rarity = result.player.overall >= 75 ? "Oro" : result.player.overall >= 65 ? "Plata" : "Bronce";
      const award = window.FutinSeasonPass.awardPlayerUnlock({ id: result.player.id, rarity });
      if (award.xpAwarded) xpNote = ` +${award.xpAwarded} XP del pase.`;
    }
    $("[data-academy-feedback]").textContent = String("error" in result ? result.error : `${result.player.name} se unió al club.${xpNote}`);
    render();
  });
  $("[data-squad-rows]").addEventListener("click", (event) => {
    const row = eventElement(event).closest<HTMLElement>("[data-career-player-row]"); if (!row) return;
    const detail = $(`[data-career-player-detail="${CSS.escape(row.dataset.careerPlayerRow!)}"]`);
    detail.hidden = !detail.hidden; row.setAttribute("aria-expanded", String(!detail.hidden));
  });
  $("[data-squad-rows]").addEventListener("keydown", (event) => { if ((event.key === "Enter" || event.key === " ") && eventElement(event).matches("[data-career-player-row]")) { event.preventDefault(); eventElement(event).click(); } });
  $$ ("[data-career-pitch], [data-career-bench], [data-career-reserves]").forEach((container) => container.addEventListener("click", (event) => {
    const card = eventElement(event).closest<HTMLElement>("[data-career-player-id]"); if (!card) return;
    if (suppressSquadClick) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    const flipped = card.classList.toggle("is-flipped");
    card.setAttribute('aria-pressed',String(flipped));
    card.setAttribute('aria-label',flipped ? card.dataset.backLabel! : card.dataset.frontLabel!);
    card.querySelector<HTMLElement>('.career-mini-front')!.setAttribute('aria-hidden',String(flipped));
    card.querySelector<HTMLElement>('.career-mini-back')!.setAttribute('aria-hidden',String(!flipped));
    if (flipped) card.setAttribute('aria-describedby',card.querySelector<HTMLElement>('.career-mini-details')!.id);
    else card.removeAttribute('aria-describedby');
  }));
  document.addEventListener("pointerdown", (event) => {
    const card = eventElement(event).closest<HTMLElement>("[data-career-player-id]");
    if (!card || (event.button !== undefined && event.button !== 0)) return;
    squadDrag = { id: card.dataset.careerPlayerId!, card, x: event.clientX, y: event.clientY, started: false, targetId: null, timer: window.setTimeout(() => { if (squadDrag) { squadDrag.started = true; card.classList.add("is-dragging"); } }, 240) };
  });
  document.addEventListener("pointermove", (event) => {
    if (!squadDrag) return;
    if (!squadDrag.started && Math.hypot(event.clientX - squadDrag.x, event.clientY - squadDrag.y) > 10) { window.clearTimeout(squadDrag.timer); squadDrag = null; return; }
    if (!squadDrag.started) return;
    const hovered = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-career-player-id]");
    document.querySelectorAll<HTMLElement>(".career-player-card.is-drop-target").forEach((item) => item.classList.remove("is-drop-target"));
    squadDrag.targetId = hovered && hovered.dataset.careerPlayerId! !== squadDrag.id ? hovered.dataset.careerPlayerId! : null;
    hovered?.classList.toggle("is-drop-target", Boolean(squadDrag.targetId));
  });
  const finishSquadDrag = () => {
    if (!squadDrag) return;
    window.clearTimeout(squadDrag.timer);
    if (squadDrag.started) {
      suppressSquadClick = true;
      if (squadDrag.targetId && career.swapSquadPlayers(squadDrag.id, squadDrag.targetId)) renderSquad();
      window.setTimeout(() => { suppressSquadClick = false; }, 0);
    }
    document.querySelectorAll<HTMLElement>(".career-player-card.is-dragging,.career-player-card.is-drop-target").forEach((item) => item.classList.remove("is-dragging", "is-drop-target"));
    squadDrag = null;
  };
  document.addEventListener("pointerup", finishSquadDrag);
  document.addEventListener("pointercancel", finishSquadDrag);
  $<HTMLSelectElement>("#career-club").addEventListener("change", (event) => {
    if (activeMatch && !activeMatch.finished) { (eventElement(event) as HTMLInputElement).value = career.getState().selectedClubId; $(`[data-career-feedback]`).textContent = String("Termina el partido en curso antes de cambiar de club."); return; }
    activeMatch = null; career.selectClub((eventElement(event) as HTMLInputElement).value); $("[data-career-feedback]").textContent = "Club seleccionado. Solo jugarás tus partidos; los demás se simulan en segundo plano."; render();
  });
  $<HTMLButtonElement>("[data-simulate-round]").addEventListener("click", () => {
    if (activeMatch && !activeMatch.finished) { showMatchModal(activeMatch); return; }
    activeMatch = null; selectedTactic = "balanced";
    const button = $<HTMLButtonElement>("[data-simulate-round]"); button.disabled = true; button.textContent = String("PREPARANDO PARTIDO…");
    const finalRound = roundCount();
    if (career.getState().currentRound >= finalRound) {
      career.resetSeason();
      $(`[data-career-feedback]`).textContent = String(`Temporada ${String(career.getState().season).padStart(2, "0")} iniciada. Preparando el primer partido…`);
      render(); button.disabled = true; button.textContent = String("PREPARANDO PARTIDO…");
    }
    window.setTimeout(() => {
      const session = career.prepareInteractiveMatch();
      if (!session) { $(`[data-career-feedback]`).textContent = String("La temporada ya terminó."); render(); return; }
      if ("bye" in session) {
        const finishedSeason = session.round === roundCount();
        const isChampion = finishedSeason && career.getStandings()[0]?.teamId === career.getState().selectedClubId;
        const title = isChampion ? window.FutinSeasonPass?.awardCareerTitle(`${career.getActiveSlotId() || "career"}:${career.getState().league.id}:${career.getState().season}`) : null;
        const titleNote = title?.xpAwarded ? ` ¡Campeón de liga! +${title.xpAwarded} XP del pase.` : "";
        $(`[data-career-feedback]`).textContent = `Tu club descansa en la jornada ${session.round}; se simularon los partidos restantes.${titleNote}`;
        render(); return;
      }
      activeMatch = session;
      $(`[data-live-events]`).innerHTML = `<p class="live-feed-empty">El árbitro está listo para dar inicio.</p>`;
      $(`[data-chance-panel]`).hidden = true;
      showMatchModal(activeMatch);
      addLiveEvent(`Todo listo: ${session.homeName} recibe a ${session.awayName}.`, null, "kickoff");
    }, 220);
  });
  $<HTMLButtonElement>(`[data-match-advance]`).addEventListener("click", () => {
    if (livePlaying) pauseLivePlayback();
    else startLivePlayback();
  });
  $$("[data-tactic]").forEach((button) => button.addEventListener("click", () => {
    selectedTactic = button.dataset.tactic as Tactic;
    if (activeMatch) { if (activeMatch.userTeamId === activeMatch.homeId) activeMatch.homeTactic = selectedTactic; else activeMatch.awayTactic = selectedTactic; }
    $$(`[data-tactic]`).forEach((choice) => {
      const selected = choice === button;
      choice.classList.toggle("is-selected", selected); choice.setAttribute("aria-pressed", String(selected));
    });
    const tacticLabel = selectedTactic === "attack" ? "ofensivo" : selectedTactic === "defensive" ? "defensivo" : "equilibrado";
    $(`[data-live-caption]`).textContent = String(`PLAN ${tacticLabel.toUpperCase()} SELECCIONADO`);
    if (activeMatch) renderLiveMatch(activeMatch);
  }));
  $("[data-match-close]").addEventListener("click", () => {
    if (activeMatch?.finished) { activeMatch = null; render(); }
    else if (activeMatch) $(`[data-career-feedback]`).textContent = String("Partido pausado. Puedes volver cuando quieras con “Continuar mi partido”.");
    hideMatchModal();
  });
  $("[data-match-back]").addEventListener("click", () => { activeMatch = null; hideMatchModal(); render(); });
  $$("[data-open-saves]").forEach((button) => button.addEventListener("click", showSaveManager));
  $<HTMLSelectElement>("[data-round-select]").addEventListener("change", (event) => renderFixtures((eventElement(event) as HTMLInputElement).value));
  $("[data-import-data]").addEventListener("click", () => $("[data-data-file]").click());
  $("[data-data-file]").addEventListener("change", async (event) => {
    const file = (eventElement(event) as HTMLInputElement).files?.[0]; if (!file) return;
    try {
      const json = JSON.parse(await file.text()); activeMatch = null; career.importLeague(json); openTab("matches"); $("[data-career-feedback]").textContent = String(`Liga “${career.getState().league.name}” importada. Se generó su calendario completo.`); render();
    } catch (error) { window.alert(`No se pudo importar la liga: ${(error instanceof Error ? error.message : String(error))}`); }
    (eventElement(event) as HTMLInputElement).value = "";
  });
  $("[data-download-template]").addEventListener("click", () => {
    const data = JSON.stringify(career.exportLeagueTemplate(), null, 2); const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "futin-formato-liga.json"; link.click(); URL.revokeObjectURL(url);
  });
  $("[data-reset-season]").addEventListener("click", () => { if (!window.confirm("¿Reiniciar la temporada? Se borrarán resultados y estadísticas de esta temporada. La media actual de los jugadores se conserva.")) return; activeMatch = null; hideMatchModal(); career.resetSeason(); $("[data-career-feedback]").textContent = String("Nueva temporada creada. Se conserva la progresión de los jugadores."); render(); });
  $<HTMLSelectElement>(`[data-match-speed]`).addEventListener("change", (event) => {
    career.updateSettings({ matchSpeed: (eventElement(event) as HTMLInputElement).value });
    if (livePlaying) scheduleLiveStep();
  });

  document.addEventListener('keydown',event => {
    const modal = [$('[data-career-setup]'),$('[data-match-modal]')].find(node => !node.hidden);
    if (!modal) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (modal.matches('[data-career-setup]')) closeCareerSetup();
      else $('[data-match-close]').click();
    }
    if (event.key === 'Tab') {
      const focusable = [...modal.querySelectorAll<HTMLElement>('button:not(:disabled),select,input,a[href],[tabindex="0"]')].filter(node => node.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  renderCareerSlots();
  $(`[data-save-manager]`).hidden = false;
  $(`[data-career-dashboard]`).hidden = true;
})();



export {};
