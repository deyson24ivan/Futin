(() => {
  const lineup = document.querySelector('[data-home-lineup]');
  if (!lineup) return;

  const formations = Object.fromEntries(window.FutinFormations.names.map(name => [name,window.FutinFormations.rows(name)]));
  const initialPlayers = window.FutinPlayers.initialRoster().players.filter(player => player.zone === 'starter');
  function readClub() {
    try {
      const saved = JSON.parse(localStorage.getItem('futin-roster-v1'));
      if (saved && Array.isArray(saved.players) && formations[saved.formation]) return saved;
    } catch { /* A new club displays its starting eleven. */ }
    return { formation:'4-3-3', players:initialPlayers };
  }

  function card(player, index) {
    if (player) {
      const details = {...window.FutinPlayers.catalog.find(item=>item.id===player.id),...player};
      return window.FutinCard.mini(details);
    }
    return '<svg viewBox="0 0 300 440" aria-hidden="true"><path d="M30 55 130 20 150 40 170 20 270 55v300q-5 40-120 75Q35 395 30 355Z" fill="#15323e" stroke="#7294a5" stroke-dasharray="8 8" stroke-width="3"/><text x="150" y="220" fill="#8eafbd" text-anchor="middle" font-size="65">+</text></svg>';
  }

  function render() {
    const club = readClub();
    const rows = formations[club.formation];
    const starters = club.players.filter(player => player && player.zone === 'starter').sort((a,b) => Number(a.slot) - Number(b.slot)).slice(0,11);
    const average = starters.length ? Math.round(starters.reduce((sum,player) => sum + (Number(player.rating) || 0),0) / starters.length) : '—';
    document.querySelector('[data-home-overall]').textContent = average;
    document.querySelector('[data-home-formation]').textContent = club.formation;
    document.querySelector('[data-home-starters]').textContent = starters.length;
    let slot = 0;
    lineup.innerHTML = rows.map((count,row) => Array.from({length:count},(_,column) => {
      const index = slot++;
      const player = starters.find(item => Number(item.slot) === index);
      const left = ((column + 1) / (count + 1)) * 100;
      const top = ((row + .5) / rows.length) * 100;
      const role = window.FutinFormations.catalog[club.formation][row][column];
      // Reserve a separate line for the tactical role, including empty slots.
      const sizing = `height:${76 / rows.length}%;width:auto;max-width:${count === 5 ? 15 : 19}%;aspect-ratio:${player ? '1024/1088' : '300/440'};`;
      return `<span class="home-player" style="left:${left}%;top:${top}%;${sizing}">${card(player,index)}<span class="tactical-position">${role}</span></span>`;
    }).join('')).join('');
    updateDate();
  }
  function updateDate() {
    document.querySelector('[data-home-date]').textContent = new Intl.DateTimeFormat('es-CO', {weekday:'long',day:'numeric',month:'long'}).format(new Date()).toLocaleUpperCase('es');
  }
  window.addEventListener('storage', event => { if (event.key === 'futin-roster-v1') render(); });
  window.addEventListener('pageshow', render);
  window.addEventListener('futin:profilechange',render);
  window.addEventListener('futin:rosterchange',render);
  setInterval(updateDate,60000);
  render();
})();

