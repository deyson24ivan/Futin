(() => {
  const pitch = document.querySelector("#interactivePitch");
  if (!pitch) return;

  const saveKey = "futin-roster-v1";
  const formations = window.FutinFormations.catalog;

  const freshRoster = window.FutinPlayers.initialRoster();
  let state = readState();
  let drag = null;
  let suppressCardClick = false;
  let appliedFilters = { position: "all", rarity: "all", rating: 0 };
  const modal = document.querySelector("#playerModal");
  let playerReturnFocus = null;
  const formationSelect = document.querySelector("#formationSelect");

  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(saveKey));
      if (saved && Array.isArray(saved.players) && formations[saved.formation]) {
        return { ...freshRoster, formation: saved.formation, activeInventory: saved.activeInventory || "club", players: saved.players.map((player) => ({ ...player, rarity:player.rarity === 'ÍCONO' ? 'ESPECIAL' : player.rarity, stats: player.stats || [70, 70, 70, 70, 70] })) };
      }
    } catch (error) {
      console.warn("No se pudo leer la plantilla guardada.", error);
    }
    return structuredClone(freshRoster);
  }

  function persist() {
    localStorage.setItem(saveKey, JSON.stringify(state));
  }

  function getPlayer(id) {
    return state.players.find((player) => player.id === id);
  }

  function playersIn(zone) {
    return state.players.filter((player) => player.zone === zone).sort((a, b) => a.slot - b.slot);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }
  function cardDesignFor(player) {
    const availableDesigns = ["bronze-normal", "bronze-special", "silver-normal", "silver-special", "gold-normal", "gold-special", "elite-special", "special-tier"];
    if (availableDesigns.includes(player.cardDesign)) return player.cardDesign;
    const seededDesign = freshRoster.players.find((item) => item.id === player.id)?.cardDesign;
    if (availableDesigns.includes(seededDesign)) return seededDesign;
    if (player.rarity === "ÍCONO" || player.rarity === "ESPECIAL") return "special-tier";
    if (player.rarity === "ÉLITE") return "elite-special";
    const material = player.rarity === "BRONCE" ? "bronze" : player.rarity === "PLATA" ? "silver" : "gold";
    return `${material}-normal`;
  }
  function cardButton(player, compact = false) {
    return `<div class="player-card-tile bronze-tile ${compact ? 'roster-tile' : 'lineup-tile'}"><button type="button" class="${compact ? 'roster-card' : 'lineup-card'} png-card-button" data-card-id="${escapeHtml(player.id)}" aria-label="${escapeHtml(player.name)}, valoración ${player.rating}, ${escapeHtml(player.position)}">${window.FutinCard.render({...player, cardDesign:cardDesignFor(player)})}</button></div>`;
  }

  function renderPitch() {
    let slotIndex = 0;
    const mappedRows = formations[state.formation].map((roles) => roles.map((role) => ({ role, index: slotIndex++ })));
    const rows = mappedRows.map((slots, rowIndex) => {
      const cards = slots.map(({ role, index }) => {
        const player = state.players.find((candidate) => candidate.zone === "starter" && candidate.slot === index);
        return `<div class="interactive-slot${player ? ' bronze-slot' : ''}" data-slot-index="${index}" data-role="${role}">${player ? cardButton(player) : `<button type="button" class="empty-lineup-slot" data-slot-index="${index}" aria-label="Posición vacía, ${role}"><span>+</span></button>`}<span class="tactical-position">${role}</span></div>`;
      }).join("");
      return `<div class="interactive-pitch-row pitch-row-${rowIndex}" style="--row-size:${slots.length};--line-index:${rowIndex}">${cards}</div>`;
    }).join("");
    pitch.style.setProperty("--formation-rows", mappedRows.length);
    pitch.style.setProperty("--largest-line", Math.max(...mappedRows.map(row => row.length)));
    pitch.innerHTML = `<div class="pitch-lines"><span></span><span></span></div>${rows}`;
    document.querySelector("#formationTitle").textContent = `FORMACIÓN ${state.formation}`;
    document.querySelector("#formationLabel").textContent = state.formation;
    const starters = playersIn("starter");
    const rating = starters.length ? Math.round(starters.reduce((sum, player) => sum + player.rating, 0) / starters.length) : "—";
    document.querySelector("#squadRating").innerHTML = `${rating} <small>OVR</small>`;
    document.querySelector("#starterCount").textContent = `${starters.length} TITULARES`;
  }

  function renderBench() {
    const bench = playersIn("bench");
    document.querySelector("#benchCards").innerHTML = bench.length
      ? bench.map((player) => cardButton(player, true)).join("")
      : `<p class="inventory-empty-inline">No tienes suplentes. Añade cartas desde el club.</p>`;
    document.querySelector("#benchCount").textContent = `${bench.length} CARTAS`;
  }

  function renderReserves() {
    const reserves = playersIn('reserve');
    document.querySelector('#reserveCards').innerHTML = reserves.length
      ? reserves.map(player => cardButton(player, true)).join('')
      : '<p class="inventory-empty-inline">Tu segunda línea está por construir. Abre una carta del club y elige «Mover a reservas».</p>';
    document.querySelector('#reserveCount').textContent = `${reserves.length} CARTAS`;
  }

  function renderInventory() {
    const zone = state.activeInventory === "transfer" ? "transfer" : "club";
    const stored = playersIn(zone);
    document.querySelectorAll(".inventory-tab").forEach((tab) => {
      const active = tab.dataset.inventory === zone;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.id = `inventory-tab-${tab.dataset.inventory}`;
      tab.setAttribute('aria-controls','clubCards');
    });
    document.querySelector('#clubCards').setAttribute('role','tabpanel');
    document.querySelector('#clubCards').setAttribute('aria-labelledby',`inventory-tab-${zone}`);
    document.querySelector("#clubTabCount").textContent = playersIn("club").length;
    document.querySelector("#transferTabCount").textContent = playersIn("transfer").length;
    const filtered = stored.filter((player) =>
      (appliedFilters.position === "all" || player.position === appliedFilters.position) &&
      (appliedFilters.rarity === "all" || player.rarity === appliedFilters.rarity) &&
      player.rating >= Number(appliedFilters.rating)
    );
    const activeFilterCount = [appliedFilters.position !== "all", appliedFilters.rarity !== "all", Number(appliedFilters.rating) > 0].filter(Boolean).length;
    document.querySelector("#collectionCount").textContent = `${stored.length} CARTAS`;
    document.querySelector("#inventorySummary").textContent = `Mostrando ${filtered.length} de ${stored.length} cartas`;
    const filterBadge = document.querySelector("#filterBadge");
    filterBadge.textContent = String(activeFilterCount);
    filterBadge.hidden = activeFilterCount === 0;
    document.querySelector("#clubCards").innerHTML = filtered.map((player) => cardButton(player, true)).join("");
    const emptyInventory = document.querySelector("#emptyInventory");
    emptyInventory.hidden = filtered.length > 0;
    emptyInventory.textContent = stored.length === 0
      ? zone === "transfer" ? "Todavía no tienes cartas en transferibles." : "Selecciona una carta y guárdala en el club para verla aquí."
      : "Ninguna carta coincide con estos filtros. Prueba otros criterios o límpialos.";
  }

  function render() {
    const previousCardRects = new Map([...document.querySelectorAll("[data-card-id]")].map((card) => [card.dataset.cardId, card.getBoundingClientRect()]));
    formationSelect.value = state.formation;
    window.dispatchEvent(new CustomEvent('futin:formationchange'));
    renderPitch();
    renderBench();
    renderReserves();
    renderInventory();
    persist();
    if (previousCardRects.size && typeof Element.prototype.animate === "function") {
      requestAnimationFrame(() => document.querySelectorAll("[data-card-id]").forEach((card) => {
        const before = previousCardRects.get(card.dataset.cardId);
        if (!before) return;
        const after = card.getBoundingClientRect();
        const dx = before.left - after.left, dy = before.top - after.top;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) card.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], { duration: 300, easing: "cubic-bezier(.2,.75,.2,1)" });
      }));
    }
  }

  function openPlayer(id) {
    const player = getPlayer(id);
    if (!player) return;
    playerReturnFocus = document.activeElement;
    const [ritmo, tiro, pase, defensa, fisico] = player.stats;
    const playerStats = [["Ritmo", ritmo], ["Tiro", tiro], ["Pase", pase], ["Regate", Math.round((ritmo + pase) / 2)], ["Defensa", defensa], ["Físico", fisico]];
    const statMarkup = playerStats.map(([name, value]) => `<div class="player-stat"><span>${name}</span><div class="stat-track"><i style="width:${value}%"></i></div><strong>${value}</strong></div>`).join("");
    const place = player.zone === "starter" ? "Once titular" : player.zone === "bench" ? "Suplentes" : player.zone === "reserve" ? "Reservas" : player.zone === "transfer" ? "Transferibles" : "Club";
    const canBench = ["club", "transfer", "reserve"].includes(player.zone) && playersIn("bench").length < 7;
    const actions = `<button class="modal-action" data-action="lineup">${player.zone === 'starter' ? 'Cambiar posición' : 'Añadir al once titular'}</button>` + (player.zone === "transfer"
      ? `<button class="modal-action" data-action="club">Guardar en el club</button>${canBench ? `<button class="modal-action" data-action="bench">Añadir a suplentes</button>` : ""}`
      : player.zone === "club"
        ? `<button class="modal-action" data-action="transfer">Enviar a transferibles</button>${canBench ? `<button class="modal-action" data-action="bench">Añadir a suplentes</button>` : ""}`
        : `<button class="modal-action" data-action="transfer">Enviar a transferibles</button><button class="modal-action" data-action="club">Almacenar en el club</button>${['starter','reserve'].includes(player.zone) && playersIn("bench").length < 7 ? `<button class="modal-action" data-action="bench">Mover a suplentes</button>` : ""}`)
      + (player.zone !== 'reserve' ? '<button class="modal-action" data-action="reserve">Mover a reservas</button>' : '');
    modal.innerHTML = `<div class="player-modal-backdrop" data-close-modal></div><section class="player-modal-card" role="dialog" aria-modal="true" aria-labelledby="modalPlayerName"><button type="button" class="modal-close" aria-label="Cerrar" data-close-modal>×</button><div class="modal-player-top"><div class="modal-player-card card-design-${cardDesignFor(player)} rarity-${player.rarity === "ÍCONO" ? "icon-card" : player.rarity.toLowerCase()}"><span>${player.rating}</span><b>${escapeHtml(player.initials)}</b><small>${escapeHtml(player.position)}</small></div><div><p class="eyebrow">${escapeHtml(player.rarity)} · ${place.toUpperCase()}</p><h2 id="modalPlayerName">${escapeHtml(player.name)}</h2><span class="modal-position">${escapeHtml(player.position)} <i>·</i> VALORACIÓN ${player.rating}</span></div></div><div class="modal-stats"><p class="eyebrow">ESTADÍSTICAS</p>${statMarkup}</div><div class="modal-actions">${actions}</div></section>`;
    modal.dataset.playerId = id;
    const visualCard = modal.querySelector('.modal-player-card');
    visualCard.className = 'modal-bronze-card';
    visualCard.innerHTML = window.FutinCard.render({...player, cardDesign:cardDesignFor(player)});
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector(".modal-close").focus();
  }

  function closeModal() {
    modal.hidden = true;
    modal.innerHTML = "";
    document.body.classList.remove("modal-open");
    if (playerReturnFocus?.isConnected) playerReturnFocus.focus();
  }

  function openLineupSelector(playerId = null, slotIndex = null) {
    if (modal.hidden) playerReturnFocus = document.activeElement;
    const player = playerId ? getPlayer(playerId) : null;
    const roles = formations[state.formation].flat();
    const choices = player ? roles.map((role,slot) => {
      const occupant = state.players.find(item => item.zone === 'starter' && item.slot === slot);
      return `<button type="button" class="lineup-choice" data-place-player="${escapeHtml(player.id)}" data-place-slot="${slot}"><b>${escapeHtml(role)}</b><span>${escapeHtml(occupant?.name || 'Posición disponible')}<small>${occupant ? `Media ${occupant.rating}` : 'Sin jugador'}</small></span></button>`;
    }) : state.players.filter(item => item.zone !== 'starter').map(item => `<button type="button" class="lineup-choice" data-place-player="${escapeHtml(item.id)}" data-place-slot="${slotIndex}"><b>${item.rating}</b><span>${escapeHtml(item.name)}<small>${escapeHtml(item.position)} · ${escapeHtml(item.rarity)}</small></span></button>`);
    modal.innerHTML = `<div class="player-modal-backdrop" data-close-modal></div><section class="player-modal-card" role="dialog" aria-modal="true" aria-labelledby="lineup-picker-title"><button class="modal-close" type="button" data-close-modal aria-label="Cerrar">×</button><p class="eyebrow">ORGANIZA TU EQUIPO</p><h2 id="lineup-picker-title">${player ? 'Elige su posición' : 'Elige un jugador'}</h2><p class="lineup-choice-note">${player ? `${escapeHtml(player.name)} ocupará la posición que selecciones. El jugador reemplazado volverá al club.` : 'Selecciona un jugador de tu club o banquillo para completar el once.'}</p><div class="lineup-choices">${choices.length ? choices.join('') : '<p>No hay jugadores disponibles. Abre un sobre para ampliar el club.</p>'}</div></section>`;
    modal.hidden = false; document.body.classList.add('modal-open'); modal.querySelector('.modal-close').focus();
  }

  function placePlayer(id,slot) {
    const player = getPlayer(id);
    if (!player || !Number.isInteger(slot) || slot < 0 || slot > 10) return;
    const occupant = state.players.find(item => item.zone === 'starter' && item.slot === slot);
    if (occupant?.id === player.id) { closeModal(); return; }
    if (occupant) { occupant.zone = ['starter','bench','reserve'].includes(player.zone) ? player.zone : 'club'; occupant.slot = occupant.zone === 'club' ? -1 : player.slot; }
    player.zone = 'starter'; player.slot = slot; closeModal(); render();
    window.FutinToast(`${player.name} ya está en tu once titular.`);
  }

  function moveToZone(player, zone) {
    if (!player) return;
    if (zone === "bench" && playersIn("bench").length >= 7 && player.zone !== "bench") return;
    if (["starter", "bench", "reserve"].includes(player.zone)) player.slot = -1;
    player.zone = zone;
    player.slot = ["bench", "reserve"].includes(zone) ? Math.max(-1, ...playersIn(zone).map((item) => item.slot)) + 1 : -1;
    closeModal();
    render();
  }

  function exchange(firstId, secondId) {
    const first = getPlayer(firstId);
    const second = getPlayer(secondId);
    if (!first || !second || first.id === second.id) return;
    if (!["starter", "bench", "reserve"].includes(first.zone) || !["starter", "bench", "reserve"].includes(second.zone)) return;
    [first.zone, second.zone] = [second.zone, first.zone];
    [first.slot, second.slot] = [second.slot, first.slot];
    render();
  }

  function moveToEmptySlot(playerId, slotIndex) {
    const player = getPlayer(playerId);
    if (!player || player.zone === "starter") return;
    const occupying = state.players.find((candidate) => candidate.zone === "starter" && candidate.slot === slotIndex);
    if (occupying) return exchange(playerId, occupying.id);
    player.zone = "starter";
    player.slot = slotIndex;
    render();
  }

  function startHoldDrag(event, card) {
    if (event.button !== undefined && event.button !== 0) return;
    const player = getPlayer(card.dataset.cardId);
    if (!player || !["starter", "bench", "reserve"].includes(player.zone)) return;
    drag = { id: player.id, startX: event.clientX, startY: event.clientY, started: false, targetId: null, targetSlot: null };
    drag.timer = window.setTimeout(() => {
      if (!drag) return;
      drag.started = true;
      card.classList.add("is-dragging");
      document.body.classList.add("roster-dragging");
      document.querySelector("#dragAnnouncement").textContent = `Moviendo ${player.name}. Suelta sobre una carta titular o suplente para intercambiar.`;
    }, 220);
  }

  document.addEventListener("pointerdown", (event) => {
    const card = event.target.closest("[data-card-id]");
    if (card) startHoldDrag(event, card);
  });

  document.addEventListener("pointermove", (event) => {
    if (!drag) return;
    if (!drag.started && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 10) {
      window.clearTimeout(drag.timer);
      drag = null;
      return;
    }
    if (!drag.started) return;
    const hovered = document.elementFromPoint(event.clientX, event.clientY);
    const targetCard = hovered?.closest("[data-card-id]");
    const targetSlot = hovered?.closest("[data-slot-index]");
    document.querySelectorAll(".drop-target").forEach((item) => item.classList.remove("drop-target"));
    drag.targetId = targetCard?.dataset.cardId && targetCard.dataset.cardId !== drag.id ? targetCard.dataset.cardId : null;
    drag.targetSlot = !targetCard && targetSlot ? Number(targetSlot.dataset.slotIndex) : null;
    (targetCard || (!targetCard && targetSlot))?.classList.add("drop-target");
  });

  document.addEventListener("pointerup", () => {
    if (!drag) return;
    window.clearTimeout(drag.timer);
    if (drag.started) {
      suppressCardClick = true;
      const source = getPlayer(drag.id);
      if (drag.targetId) exchange(drag.id, drag.targetId);
      else if (drag.targetSlot !== null && ["bench", "reserve"].includes(source?.zone)) moveToEmptySlot(drag.id, drag.targetSlot);
      window.setTimeout(() => { suppressCardClick = false; }, 0);
    }
    document.querySelectorAll(".is-dragging, .drop-target").forEach((item) => item.classList.remove("is-dragging", "drop-target"));
    document.body.classList.remove("roster-dragging");
    drag = null;
  });

  document.addEventListener("pointercancel", () => {
    if (drag) window.clearTimeout(drag.timer);
    drag = null;
    document.querySelectorAll(".is-dragging, .drop-target").forEach((item) => item.classList.remove("is-dragging", "drop-target"));
    document.body.classList.remove("roster-dragging");
  });

  document.addEventListener("click", (event) => {
    const placement = event.target.closest('[data-place-player]');
    if (placement) { placePlayer(placement.dataset.placePlayer,Number(placement.dataset.placeSlot)); return; }
    const empty = event.target.closest('.empty-lineup-slot');
    if (empty) { openLineupSelector(null,Number(empty.dataset.slotIndex)); return; }
    const card = event.target.closest("[data-card-id]");
    if (card) {
      if (suppressCardClick) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      openPlayer(card.dataset.cardId);
      return;
    }
    const action = event.target.closest("[data-action]");
    if (action) {
      const selectedId = modal.dataset.playerId;
      const selected = getPlayer(selectedId);
      const destination = action.dataset.action;
      if (destination === 'lineup') { openLineupSelector(selectedId); return; }
      if (["club", "transfer", "bench", "reserve"].includes(destination)) moveToZone(selected, destination);
      return;
    }
    if (event.target.closest("[data-close-modal]")) {
      closeModal();
      return;
    }
    const tab = event.target.closest("[data-inventory]");
    if (tab) {
      state.activeInventory = tab.dataset.inventory;
      renderInventory();
      persist();
      return;
    }
    if (event.target.closest("#filterToggle")) {
      const button = document.querySelector("#filterToggle");
      const panel = document.querySelector("#filterPanel");
      panel.hidden = !panel.hidden;
      button.setAttribute("aria-expanded", String(!panel.hidden));
      return;
    }
    const filterAction = event.target.closest("[data-filter-action]");
    if (filterAction?.dataset.filterAction === "apply") {
      appliedFilters = {
        position: document.querySelector("#filterPosition").value,
        rarity: document.querySelector("#filterRarity").value,
        rating: Number(document.querySelector("#filterRating").value),
      };
      document.querySelector("#filterPanel").hidden = true;
      document.querySelector("#filterToggle").setAttribute("aria-expanded", "false");
      renderInventory();
      return;
    }
    if (filterAction?.dataset.filterAction === "clear") {
      appliedFilters = { position: "all", rarity: "all", rating: 0 };
      document.querySelector("#filterPosition").value = "all";
      document.querySelector("#filterRarity").value = "all";
      document.querySelector("#filterRating").value = "0";
      renderInventory();
    }
  });

  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
    if (event.key === 'Tab') {
      const buttons = [...modal.querySelectorAll('button:not(:disabled)')];
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
    }
  });

  formationSelect.addEventListener("change", () => {
    if (!formations[formationSelect.value]) return;
    state.formation = formationSelect.value;
    render();
  });

  window.addEventListener('storage',event => { if (event.key === saveKey) { state = readState(); render(); } });
  window.addEventListener('futin:rosterchange',() => { state = readState(); render(); });
  render();
})();

