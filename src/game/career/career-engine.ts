import type {CareerState, CareerLeague, CareerTeam, CareerPlayer, CareerSlot, Fixture, MatchSession, ByeRound, MatchEvent, Tactic, DemoClub, DemoLeague, CareerSettings} from '../../domain/career';
/* Motor local de carrera. La simulación trabaja con datos normalizados y no depende de una API concreta. */


  const STORAGE_KEY = "futin-career-save-v1";
  const SAVE_SLOTS_KEY = "futin-career-save-slots-v1";
  const ACTIVE_SLOT_KEY = "futin-career-active-slot-v1";
  const SAVE_SLOT_COUNT = 8;
  const POSITION_GROUPS = ["POR", "DEF", "MED", "DEL"];
  const FIRST_NAMES = ["Alex", "Mateo", "Nicolás", "Samuel", "Tomás", "Emilio", "Julián", "Andrés", "Thiago", "Bruno", "Damián", "Gabriel", "Iván", "Santiago", "Leo", "Daniel", "Martín", "Esteban", "Marco", "Kevin"];
  const LAST_NAMES = ["Ríos", "Vega", "Mora", "Salas", "Luna", "Pardo", "Soto", "Cruz", "Rey", "Silva", "Torres", "Rojas", "Gil", "Arias", "Navarro", "Cárdenas", "León", "Castro", "Fuentes", "Mendoza"];
  const YOUTH_POSITIONS = ["POR", "DEF", "MED", "DEL"];
  const CLUBS: DemoClub[] = [
    ["futin-city", "Futin City", "FC", 82], ["real-valle", "Real Valle", "RV", 79], ["norte-verde", "Norte Verde", "NV", 77], ["atletico-puerto", "Atlético Puerto", "AP", 76], ["sierra-club", "Sierra Club", "SC", 74],
    ["union-del-sol", "Unión del Sol", "US", 73], ["deportivo-lago", "Deportivo Lago", "DL", 72], ["capital-atletico", "Capital Atlético", "CA", 71], ["club-aurora", "Club Aurora", "AU", 69], ["ferroviarios", "Ferroviarios", "FE", 68],
  ];
  const DEMO_LEAGUES: DemoLeague[] = [
    { id: "liga-futin", name: "Liga FUTIN", country: "FUTIN", clubs: CLUBS },
    { id: "liga-andina", name: "Liga Andina", country: "Región Andina", clubs: [
      ["condores-valle", "Cóndores del Valle", "CDV", 81], ["nevado-fc", "Nevado FC", "NEV", 78], ["altura-real", "Altura Real", "ALT", 77], ["atletico-paramo", "Atlético Páramo", "PAR", 76], ["deportivo-cumbre", "Deportivo Cumbre", "CUM", 74], ["union-cafetera", "Unión Cafetera", "UCA", 73], ["real-bosque", "Real Bosque", "RBO", 72], ["once-minero", "Once Minero", "OMI", 71], ["estrellas-sur", "Estrellas del Sur", "EDS", 69], ["rio-blanco", "Río Blanco", "RBL", 68],
    ] },
    { id: "liga-pacifica", name: "Liga Pacífica", country: "Costa Pacífica", clubs: [
      ["mar-azul", "Mar Azul FC", "MAZ", 82], ["puerto-esmeralda", "Puerto Esmeralda", "PES", 79], ["tiburones-costa", "Tiburones de la Costa", "TDC", 77], ["real-manglar", "Real Manglar", "RMA", 75], ["deportivo-brisa", "Deportivo Brisa", "DBR", 74], ["union-faro", "Unión del Faro", "UFA", 73], ["islas-unidas", "Islas Unidas", "ISU", 72], ["atletico-oleaje", "Atlético Oleaje", "AOL", 71], ["bahia-dorada", "Bahía Dorada", "BDO", 70], ["sol-pacifico", "Sol Pacífico", "SPA", 68],
    ] },
    { id: "liga-metropolitana", name: "Liga Metropolitana", country: "Distrito Central", clubs: [
      ["capital-norte", "Capital Norte", "CAN", 83], ["metro-unido", "Metro Unido", "MET", 80], ["academia-central", "Academia Central", "ACE", 78], ["real-estacion", "Real Estación", "RES", 76], ["deportivo-plaza", "Deportivo Plaza", "DPL", 75], ["atletico-avenida", "Atlético Avenida", "AAV", 74], ["union-distrito", "Unión del Distrito", "UDI", 72], ["barrio-alto", "Barrio Alto FC", "BAF", 71], ["ferro-central", "Ferro Central", "FCE", 70], ["juventud-urbana", "Juventud Urbana", "JUR", 69],
    ] },
  ];
  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
  const hashSeed = (text: string) => { let h = 2166136261; for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const DEMO_COUNTRIES = ['CO','AR','BR','ES','UY','CL','MX','FR','PT','EC'];
  const demoCountry = (id: string) => DEMO_COUNTRIES[hashSeed(String(id)) % DEMO_COUNTRIES.length];
  function rng(seed: number) { let x = seed >>> 0; return () => { x += 0x6D2B79F5; let t = x; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function makeDemoLeague(definition: DemoLeague = DEMO_LEAGUES[0]) {
    const teams = definition.clubs.map(([id, name, shortName, rating], ti) => {
      const players: CareerPlayer[] = Array.from({ length: 23 }, (_, i) => {
        const group = POSITION_GROUPS[i < 2 ? 0 : i < 9 ? 1 : i < 17 ? 2 : 3];
        const strengthOffset = Math.round((rating - 74) * 0.55);
        const overall = clamp(57 + ((i * 7 + ti * 3) % 20) + strengthOffset, 52, 88);
        const potential = clamp(overall + 2 + ((ti + i * 3) % 15), overall, 94);
        const key = `${id}-${i + 1}`;
        const bias = group === "POR" ? 22 : group === "DEF" ? 5 : group === "MED" ? 12 : 18;
        return {
          id: key, name: `${FIRST_NAMES[(i * 3 + ti * 5) % FIRST_NAMES.length]} ${LAST_NAMES[(i * 7 + ti * 2) % LAST_NAMES.length]}`,
          teamId: id, position: group, overall, potential, countryCode:demoCountry(key),
          pace: clamp(overall + ((i * 11 + ti) % 17) - 8, 35, 97), shooting: clamp(overall + bias + ((i * 5) % 13) - 8, 30, 98),
          passing: clamp(overall + 4 + ((i * 9) % 15) - 7, 35, 98), defending: clamp(overall + (group === "DEF" ? 13 : -4) + ((i * 3) % 14), 28, 98),
          physical: clamp(overall + 2 + ((i * 13) % 17) - 8, 35, 98), goalkeeping: group === "POR" ? clamp(overall + 7, 40, 97) : 8,
          value: 0, age: 18 + ((i * 7 + ti * 3) % 19), xp: 0, appearances: 0, goals: 0, assists: 0,
        };
      });
      assignSquadSlots({ players });
      return { id, name, shortName, rating, players };
    });
    return { id: definition.id, name: definition.name, country: definition.country, teams };
  }

  function roundRobin(teams: CareerTeam[], season: number) {
    const ids = teams.map((t) => t.id);
    if (ids.length < 2) throw new Error("La liga necesita al menos dos equipos.");
    const rotating: (string | null)[] = [...ids]; if (rotating.length % 2) rotating.push(null);
    const size = rotating.length, half = size / 2, rounds: Fixture[][] = [];
    for (let r = 0; r < size - 1; r++) {
      const fixtures = [];
      for (let i = 0; i < half; i++) {
        const a = rotating[i], b = rotating[size - 1 - i]; if (!a || !b) continue;
        const flip = (r + i) % 2 === 1;
        fixtures.push({ id: `s${season}-r${r + 1}-${i}`, round: r + 1, homeId: flip ? b : a, awayId: flip ? a : b, status: "scheduled", homeGoals: null, awayGoals: null, events: [] });
      }
      rounds.push(fixtures);
      rotating.splice(1, 0, rotating.pop()!);
    }
    const firstLeg = rounds.flat();
    const secondLeg = firstLeg.map((f) => ({ ...f, id: f.id.replace("-r", "-v-r"), round: f.round + rounds.length, homeId: f.awayId, awayId: f.homeId, status: "scheduled", homeGoals: null, awayGoals: null, events: [] }));
    return [...firstLeg, ...secondLeg];
  }

  // Curva exponencial suave: cada punto de OVR encarece el siguiente nivel.
  // La edad modifica la XP obtenida, mientras que el potencial aporta hasta un 20%.
  function xpToNext(overall: number) { return Math.round(900 * Math.exp((clamp(overall, 55, 99) - 70) * .085)); }
  function xpAgeMultiplier(age: number) { return clamp(Math.exp(-.06 * ((Number(age) || 24) - 20)), .45, 1.4); }
  function trainingXpBreakdown(player: CareerPlayer) {
    const ageMultiplier = xpAgeMultiplier(player.age);
    const potentialMultiplier = 1 + Math.min(.2, Math.max(0, (player.potential || player.overall) - player.overall) * .006);
    return { ageMultiplier, potentialMultiplier, total: Math.round(600 * ageMultiplier * potentialMultiplier) };
  }
  function trainingXpGain(player: CareerPlayer) { return trainingXpBreakdown(player).total; }
  function playerMarketValue(player: CareerPlayer) {
    const overall = clamp(Number(player.overall) || 50, 1, 99), potential = clamp(Number(player.potential) || overall, overall, 99), age = Number(player.age) || 24;
    const ageFactor = age <= 17 ? 1.48 : age <= 20 ? 1.38 : age <= 23 ? 1.2 : age <= 27 ? 1.04 : age <= 30 ? .9 : age <= 33 ? .75 : .58;
    const positionFactor = player.position === "DEL" ? 1.28 : player.position === "MED" ? 1.12 : player.position === "DEF" ? 1 : .84;
    const potentialFactor = 1 + Math.min(.55, Math.max(0, potential - overall) * .012);
    return Math.round(overall ** 2 * 5000 * ageFactor * positionFactor * potentialFactor / 100000) * 100000;
  }
  function marketValue(player: CareerPlayer) { return playerMarketValue(player); }
  function assignSquadSlots(team: Pick<CareerTeam, 'players'>) {
    const sorted = [...team.players].sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name, "es"));
    const usedSlots = new Set();
    sorted.forEach((player, index) => {
      if (typeof player.squadSlot !== 'number' || !Number.isInteger(player.squadSlot) || player.squadSlot < 0 || usedSlots.has(player.squadSlot)) {
        let next = index;
        while (usedSlots.has(next)) next++;
        player.squadSlot = next;
      }
      usedSlots.add(player.squadSlot);
      player.value = playerMarketValue(player);
    });
  }
  function completeDemoSquads(league: CareerLeague) {
    const demoIndex = DEMO_LEAGUES.findIndex((entry) => entry.id === league.id);
    if (demoIndex < 0) return;
    const extraPositions = ["DEF", "DEF", "MED", "MED", "DEL"];
    league.teams.forEach((team, teamIndex) => {
      for (let extra = 0; extra < 5 && team.players.length < 23; extra++) {
        const index = team.players.length, overall = clamp(team.rating - 5 - ((teamIndex + extra * 2) % 5), 48, 84), position = extraPositions[extra];
        const name = `${FIRST_NAMES[(teamIndex * 3 + extra + 7) % FIRST_NAMES.length]} ${LAST_NAMES[(teamIndex * 5 + extra + 11) % LAST_NAMES.length]}`;
        const player = { id: `${team.id}-depth-${extra + 1}`, name, teamId: team.id, position, overall, potential: clamp(overall + 8 + ((teamIndex + extra) % 8), overall, 94), age: 19 + ((teamIndex + extra * 3) % 9), xp: 0, pace: clamp(overall + extra % 5, 35, 92), shooting: clamp(overall + (position === "DEL" ? 12 : 2), 30, 95), passing: clamp(overall + 5, 32, 95), defending: clamp(overall + (position === "DEF" ? 11 : -3), 28, 95), physical: clamp(overall + 4, 35, 95), goalkeeping: 8, value: 0, appearances: 0, goals: 0, assists: 0 };
        player.value = marketValue(player); team.players.push(player);
      }
      team.players.forEach(player => { if (!player.countryCode && !player.country && !player.nationality) player.countryCode = demoCountry(player.id); });
    });
  }
  function makeAcademyCandidates(month: number) {
    return Array.from({ length: 3 }, (_, index) => {
      const roll = Math.random();
      const overall = roll < .84 ? 58 + Math.floor(Math.random() * 9) : roll < .96 ? 67 + Math.floor(Math.random() * 2) : 69 + Math.floor(Math.random() * 4);
      const potential = Math.min(95, overall + 17 + Math.floor(Math.random() * 12));
      const position = YOUTH_POSITIONS[Math.floor(Math.random() * YOUTH_POSITIONS.length)];
      const name = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
      const bias = position === "DEF" ? 5 : position === "MED" ? 11 : position === "DEL" ? 18 : 20;
      return { id: `youth-${month}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`, name, teamId: null, position, overall, potential, age: 15 + Math.floor(Math.random() * 3), xp: 0, pace: clamp(overall + Math.floor(Math.random() * 15) - 7, 30, 94), shooting: clamp(overall + bias + Math.floor(Math.random() * 13) - 7, 30, 94), passing: clamp(overall + Math.floor(Math.random() * 15) - 6, 30, 94), defending: clamp(overall + (position === "DEF" ? 9 : -4) + Math.floor(Math.random() * 12), 25, 94), physical: clamp(overall + Math.floor(Math.random() * 15) - 6, 30, 94), goalkeeping: position === "POR" ? overall + 7 : 8, value: Math.round(overall * overall * 1000), appearances: 0, goals: 0, assists: 0 };
    });
  }

  function makeInitialState(league: CareerLeague = makeDemoLeague(), season = 1, selectedClubId = league.teams[0]?.id): CareerState {
    const cleanLeague = { ...league, teams: league.teams.map((team) => { const clean = { ...team, players: (team.players || []).map((player, index) => ({ ...player, age: Number(player.age) || 18 + ((index * 7) % 19), xp: Number(player.xp) || 0, squadSlot: Number.isInteger(player.squadSlot) ? player.squadSlot : undefined, appearances: 0, goals: 0, assists: 0 })) }; assignSquadSlots(clean); return clean; }) };
    return { version: 1, league: cleanLeague, season, currentRound: 0, selectedClubId: selectedClubId || cleanLeague.teams[0]?.id, teamFormation: "4-3-3", fixtures: roundRobin(cleanLeague.teams, season), lastRoundSummary: [], settings: { matchSpeed: "normal" }, academy: { month: 1, candidates: makeAcademyCandidates(1), signedThisMonth: false }, updatedAt: Date.now() };
  }

  function normalizeLoadedState(parsed: CareerState | null) {
    if (parsed?.version !== 1 || !Array.isArray(parsed.league?.teams) || parsed.league.teams.length < 2) return null;
    const ids = new Set(parsed.league.teams.map((team) => team.id));
    if (!parsed.selectedClubId || !ids.has(parsed.selectedClubId)) parsed.selectedClubId = parsed.league.teams[0].id;
    const expectedFixtureCount = parsed.league.teams.length * (parsed.league.teams.length - 1);
    const validFixtures = Array.isArray(parsed.fixtures) && parsed.fixtures.length === expectedFixtureCount && parsed.fixtures.every((fixture) => ids.has(fixture.homeId) && ids.has(fixture.awayId));
    if (!validFixtures) { parsed.fixtures = roundRobin(parsed.league.teams, parsed.season || 1); parsed.currentRound = 0; }
    const maxRound = parsed.fixtures.reduce((max, fixture) => Math.max(max, Number(fixture.round) || 0), 0);
    parsed.currentRound = clamp(Number(parsed.currentRound) || 0, 0, maxRound);
    if (!window.FutinFormations.names.includes(parsed.teamFormation)) parsed.teamFormation = "4-3-3";
    if (!Array.isArray(parsed.lastRoundSummary)) parsed.lastRoundSummary = [];
    if (!parsed.settings || typeof parsed.settings !== "object") parsed.settings = {matchSpeed: 'normal'};
    if (!["slow", "normal", "fast"].includes(parsed.settings.matchSpeed)) parsed.settings.matchSpeed = "normal";
    completeDemoSquads(parsed.league);
    parsed.league.teams.forEach((team) => { team.players.forEach((player, index) => { player.age = Number(player.age) || 18 + ((index * 7) % 19); player.xp = Number(player.xp) || 0; }); assignSquadSlots(team); });
    if (!parsed.academy || typeof parsed.academy !== "object") parsed.academy = { month: 1, candidates: makeAcademyCandidates(1), signedThisMonth: false };
    parsed.academy.month = Math.max(1, Number(parsed.academy.month) || 1);
    if (!Array.isArray(parsed.academy.candidates) || parsed.academy.candidates.length !== 3) parsed.academy.candidates = makeAcademyCandidates(parsed.academy.month);
    parsed.academy.signedThisMonth = Boolean(parsed.academy.signedThisMonth);
    return parsed;
  }
  function readJson<T>(key: string): T | null { try { return JSON.parse(localStorage.getItem(key) || 'null') as T | null; } catch { return null; } }
  function readSlots() {
    const saved = readJson<CareerSlot[]>(SAVE_SLOTS_KEY);
    if (Array.isArray(saved)) return Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => saved[index] || { id: `career-slot-${index + 1}`, state: null });
    const legacy = normalizeLoadedState(readJson<CareerState>(STORAGE_KEY));
    const slots: CareerSlot[] = Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => ({ id: `career-slot-${index + 1}`, state: null }));
    if (legacy) {
      slots[0] = { id: "career-slot-1", name: "Carrera anterior", state: legacy };
      try { localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots)); localStorage.removeItem(STORAGE_KEY); } catch { /* la migración permanece disponible en memoria */ }
    }
    return slots;
  }
  let saveSlots = readSlots();
  let activeSlotId: string | null = null;
  try { activeSlotId = localStorage.getItem(ACTIVE_SLOT_KEY); } catch { /* el modo archivo puede bloquear storage */ }
  if (!saveSlots.some((slot) => slot.id === activeSlotId && slot.state)) activeSlotId = null;
  const loadedState = activeSlotId ? normalizeLoadedState(saveSlots.find(slot => slot.id === activeSlotId)!.state) : null;
  if (activeSlotId && !loadedState) activeSlotId = null;
  let state: CareerState = loadedState ?? makeInitialState();

  function save(next = state) {
    next.updatedAt = Date.now(); state = next;
    if (!activeSlotId) return;
    const index = saveSlots.findIndex((slot) => slot.id === activeSlotId);
    if (index < 0) return;
    const team = next.league.teams.find((entry) => entry.id === next.selectedClubId);
    saveSlots[index] = { ...saveSlots[index], state: next, name: saveSlots[index].name || `Carrera ${index + 1}`, teamName: team?.name || "Sin club", leagueName: next.league.name, season: next.season, currentRound: next.currentRound };
    try { localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(saveSlots)); } catch { /* el estado sigue disponible durante esta sesión */ }
  }

  function getCareerSlots() {
    return saveSlots.map((slot, index) => ({ index: index + 1, id: slot.id, occupied: Boolean(slot.state), name: slot.name || `Carrera ${index + 1}`, teamName: slot.teamName || slot.state?.league?.teams?.find((team) => team.id === slot.state!.selectedClubId)?.name || "", leagueName: slot.leagueName || slot.state?.league?.name || "", season: slot.season || slot.state?.season || 1, currentRound: slot.currentRound ?? slot.state?.currentRound ?? 0, totalRounds: slot.state?.fixtures?.reduce((max, fixture) => Math.max(max, fixture.round), 0) || 0, isActive: slot.id === activeSlotId }));
  }
  function getAvailableLeagues() {
    return DEMO_LEAGUES.map((league) => ({
      id: league.id, name: league.name, country: league.country,
      teams: league.clubs.map(([id, name, shortName, rating]) => ({ id, name, shortName, rating })),
    }));
  }
  function validCareerName(value: unknown) {
    const name = String(value ?? '').trim().replace(/\s+/g, ' ');
    if (!name || name.length > 40) throw new Error('Escribe un nombre de carrera de entre 1 y 40 caracteres.');
    return name;
  }
  function renameCareer(slotId: string, value: string) {
    const slot = saveSlots.find(entry => entry.id === slotId && entry.state);
    if (!slot) throw new Error('No hay una carrera guardada en ese espacio.');
    const name = validCareerName(value);
    // Persist metadata before changing the in-memory slot; gameplay is preserved.
    const next = saveSlots.map(entry => entry.id === slotId ? {...entry, name} : entry);
    localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(next));
    saveSlots = next;
    return name;
  }
  function createCareer(slotId: string, leagueId = DEMO_LEAGUES[0].id, selectedClubId?: string, careerName?: string) {
    const name = validCareerName(careerName);
    const slot = saveSlots.find((entry) => entry.id === slotId);
    if (!slot) throw new Error("Ese espacio de carrera no existe.");
    if (slot.state) throw new Error("Ese espacio ya tiene una carrera guardada.");
    const definition = DEMO_LEAGUES.find((entry) => entry.id === leagueId);
    if (!definition) throw new Error("No encontramos esa liga.");
    const league = makeDemoLeague(definition);
    if (!league.teams.some((team) => team.id === selectedClubId)) throw new Error("Selecciona un equipo válido para empezar.");
    activeSlotId = slotId;
    state = makeInitialState(league, 1, selectedClubId);
    try { localStorage.setItem(ACTIVE_SLOT_KEY, activeSlotId); } catch { /* modo temporal */ }
    const index = saveSlots.indexOf(slot);
    saveSlots[index] = { ...slot, name, state };
    save(); return state;
  }
  function loadCareer(slotId: string) {
    const slot = saveSlots.find((entry) => entry.id === slotId && entry.state);
    if (!slot) throw new Error("No hay una carrera guardada en ese espacio.");
    const loaded = normalizeLoadedState(slot.state);
    if (!loaded) throw new Error("No se pudo recuperar la carrera guardada.");
    activeSlotId = slotId; state = loaded;
    try { localStorage.setItem(ACTIVE_SLOT_KEY, activeSlotId); } catch { /* modo temporal */ }
    save(); return state;
  }
  function deleteCareer(slotId: string) {
    const index = saveSlots.findIndex((entry) => entry.id === slotId);
    if (index < 0 || !saveSlots[index].state) return false;
    saveSlots[index] = { id: `career-slot-${index + 1}`, state: null };
    if (activeSlotId === slotId) {
      activeSlotId = null; state = makeInitialState();
      try { localStorage.removeItem(ACTIVE_SLOT_KEY); } catch { /* modo temporal */ }
    }
    try { localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(saveSlots)); } catch { /* el cambio permanece en memoria */ }
    return true;
  }

  function getStandings() {
    const rows = state.league.teams.map((team) => ({ teamId: team.id, team, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 }));
    const byId = new Map(rows.map((r) => [r.teamId, r]));
    state.fixtures.filter((f) => f.status === "played").forEach((f) => {
      const h = byId.get(f.homeId), a = byId.get(f.awayId); if (!h || !a) return;
      h.played++; a.played++; h.goalsFor += f.homeGoals!; h.goalsAgainst += f.awayGoals!; a.goalsFor += f.awayGoals!; a.goalsAgainst += f.homeGoals!;
      if (f.homeGoals! > f.awayGoals!) { h.won++; h.points += 3; a.lost++; }
      else if (f.homeGoals! < f.awayGoals!) { a.won++; a.points += 3; h.lost++; }
      else { h.drawn++; a.drawn++; h.points++; a.points++; }
    });
    rows.forEach((r) => { r.goalDiff = r.goalsFor - r.goalsAgainst; });
    return rows.sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor || b.team.rating - a.team.rating || a.team.name.localeCompare(b.team.name, "es"));
  }

  function teamLines(team: CareerTeam) {
    const roster = team.players || [];
    const avg = (key: 'overall' | 'shooting' | 'passing' | 'defending', fallback: number) => roster.length ? roster.reduce((s, p) => s + (Number(p[key]) || Number(p.overall) || fallback), 0) / roster.length : team.rating || fallback;
    const attack = (roster.filter((p) => p.position === "DEL").reduce((s, p) => s + (p.shooting || p.overall), 0) / Math.max(1, roster.filter((p) => p.position === "DEL").length)) || avg("shooting", team.rating);
    const midfield = roster.filter((p) => p.position === "MED").reduce((s, p) => s + (p.passing || p.overall), 0) / Math.max(1, roster.filter((p) => p.position === "MED").length) || avg("passing", team.rating);
    const defense = roster.filter((p) => p.position === "DEF").reduce((s, p) => s + (p.defending || p.overall), 0) / Math.max(1, roster.filter((p) => p.position === "DEF").length) || avg("defending", team.rating);
    const keeper = roster.find((p) => p.position === "POR");
    return { attack, midfield, defense, keeper: keeper?.goalkeeping || keeper?.overall || team.rating, overall: avg("overall", team.rating) };
  }

  function poisson(lambda: number, random: () => number) { const limit = Math.exp(-lambda); let k = 0, product = 1; do { k++; product *= random(); } while (product > limit && k < 10); return k - 1; }
  function scorerFor(team: CareerTeam, random: () => number, excluded = new Set<string>()) {
    const eligible = team.players.filter((p) => !excluded.has(p.id) && p.position !== "POR");
    if (!eligible.length) return null;
    const weights = eligible.map((p) => Math.max(1, (p.shooting || p.overall) * (p.position === "DEL" ? 1.9 : p.position === "MED" ? 1.2 : .45)));
    let roll = random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < eligible.length; i++) { roll -= weights[i]; if (roll <= 0) return eligible[i]; }
    return eligible.at(-1);
  }
  function simulateFixture(fixture: Fixture, round: number) {
    const home = state.league.teams.find((t) => t.id === fixture.homeId)!, away = state.league.teams.find((t) => t.id === fixture.awayId)!;
    const random = rng(hashSeed(`${state.season}:${fixture.id}:${home.rating}:${away.rating}`));
    const h = teamLines(home), a = teamLines(away);
    const homeXg = clamp(1.25 + (h.attack - a.defense) / 31 + (h.midfield - a.midfield) / 65 - (a.keeper - 70) / 55 + .22, .18, 3.4);
    const awayXg = clamp(1.1 + (a.attack - h.defense) / 31 + (a.midfield - h.midfield) / 65 - (h.keeper - 70) / 55, .15, 3.1);
    const homeGoals = poisson(homeXg, random), awayGoals = poisson(awayXg, random), events: MatchEvent[] = [], scorerIds = new Set();
    for (const [club, goals, side] of [[home, homeGoals, "home"], [away, awayGoals, "away"]] as [CareerTeam, number, string][]) {
      for (let n = 0; n < goals; n++) {
        const scorer = scorerFor(club, random, new Set()); if (!scorer) continue;
        scorer.goals = (scorer.goals || 0) + 1; scorerIds.add(scorer.id);
        const assistCandidate = scorerFor(club, random, new Set([scorer.id])); const assist = random() < .72 ? assistCandidate : null;
        if (assist) assist.assists = (assist.assists || 0) + 1;
        events.push({ minute: 5 + Math.floor(random() * 86), type: "goal", teamId: club.id, side, playerId: scorer.id, playerName: scorer.name, assistName: assist?.name || null });
      }
    }
    [home, away].forEach((club) => club.players.forEach((p) => {
      p.appearances = (p.appearances || 0) + 1;
      const growth = Math.max(0, (p.potential || p.overall) - p.overall);
      const progressChance = .025 + growth / 700;
      if (p.overall < p.potential && random() < progressChance) { p.overall++; p.value = marketValue(p); }
    }));
    [home, away].forEach((club) => {
      const bestEleven = [...club.players].sort((x, y) => y.overall - x.overall).slice(0, 11);
      if (bestEleven.length) club.rating = Math.round(bestEleven.reduce((sum, p) => sum + p.overall, 0) / bestEleven.length);
    });
    events.sort((x, y) => x.minute - y.minute);
    return { ...fixture, status: "played", homeGoals, awayGoals, events, homeXg: Number(homeXg.toFixed(2)), awayXg: Number(awayXg.toFixed(2)), round };
  }

  function simulateNextRound() {
    const next = state.currentRound + 1;
    if (next > state.fixtures.reduce((max, f) => Math.max(max, f.round), 0)) return null;
    const batch = state.fixtures.filter((f) => f.round === next && f.status !== "played");
    if (!batch.length) return null;
    const results = batch.map((f) => simulateFixture(f, next));
    const done = new Map(results.map((f) => [f.id, f]));
    state.fixtures = state.fixtures.map((f) => done.get(f.id) || f); state.currentRound = next; state.lastRoundSummary = results; save();
    return results;
  }

  function prepareInteractiveMatch(): MatchSession | ByeRound | null {
    const round = state.currentRound + 1;
    if (round > state.fixtures.reduce((max, fixture) => Math.max(max, fixture.round), 0)) return null;
    const ownFixture = state.fixtures.find((fixture) => fixture.round === round && fixture.status !== "played" && (fixture.homeId === state.selectedClubId || fixture.awayId === state.selectedClubId));
    const cpuFixtures = state.fixtures.filter((fixture) => fixture.round === round && fixture.status !== "played" && fixture.id !== ownFixture?.id);
    const cpuResults = cpuFixtures.map((fixture) => simulateFixture(fixture, round));
    const resultById = new Map(cpuResults.map((fixture) => [fixture.id, fixture]));
    state.fixtures = state.fixtures.map((fixture) => resultById.get(fixture.id) || fixture);
    state.lastRoundSummary = [...state.fixtures.filter((fixture) => fixture.round === round && fixture.status === "played")];
    save();
    if (!ownFixture) {
      state.currentRound = round; save();
      return { round, bye: true, cpuResults };
    }
    const home = state.league.teams.find((team) => team.id === ownFixture.homeId)!;
    const away = state.league.teams.find((team) => team.id === ownFixture.awayId)!;
    return {
      round, fixtureId: ownFixture.id, homeId: home.id, awayId: away.id, homeName: home.name, awayName: away.name,
      homeShortName: home.shortName, awayShortName: away.shortName, homeRating: home.rating, awayRating: away.rating,
      userTeamId: state.selectedClubId, minute: 0, homeGoals: 0, awayGoals: 0, finished: false,
      homeTactic: "balanced", awayTactic: "balanced", possessionTeamId: home.id,
      stats: { homeShots: 0, awayShots: 0, homeOnTarget: 0, awayOnTarget: 0, homePossession: 50, awayPossession: 50, homePossessionTicks: 0, awayPossessionTicks: 0 },
      events: [], pendingChance: null, cpuResults,
    };
  }

  function getTacticModifiers(tactic: Tactic) {
    if (tactic === "defensive") return { attack: -7, control: -5, protection: 11, chance: -0.035 };
    if (tactic === "attack") return { attack: 10, control: 7, protection: -8, chance: 0.055 };
    return { attack: 0, control: 0, protection: 0, chance: 0 };
  }

  function chooseMatchTactic(session: MatchSession, teamId: string): Tactic {
    if (teamId === session.userTeamId) return teamId === session.homeId ? session.homeTactic : session.awayTactic;
    const score = teamId === session.homeId ? session.homeGoals - session.awayGoals : session.awayGoals - session.homeGoals;
    if (score < 0 && session.minute >= 55) return "attack";
    if (score > 0 && session.minute >= 72) return "defensive";
    return teamLines(state.league.teams.find((team) => team.id === teamId)!).overall + Math.random() * 8 > 80 ? "attack" : "balanced";
  }

  function advanceInteractiveMatch(session: MatchSession, userTactic: Tactic = 'balanced') {
    if (session.finished || session.pendingChance) return { type: session.pendingChance ? "chance-pending" : "finished", session };
    if (!["defensive", "balanced", "attack"].includes(userTactic)) userTactic = "balanced";
    session.homeTactic = session.userTeamId === session.homeId ? userTactic : session.homeTactic;
    session.awayTactic = session.userTeamId === session.awayId ? userTactic : session.awayTactic;
    if (session.minute >= 90) { session.finished = true; return { type: "finished", session }; }

    const home = state.league.teams.find((team) => team.id === session.homeId)!;
    const away = state.league.teams.find((team) => team.id === session.awayId)!;
    const homeLines = teamLines(home), awayLines = teamLines(away);
    const homeStyle = chooseMatchTactic(session, home.id), awayStyle = chooseMatchTactic(session, away.id);
    session.homeTactic = homeStyle; session.awayTactic = awayStyle;
    const hm = getTacticModifiers(homeStyle), am = getTacticModifiers(awayStyle);
    const homeControl = homeLines.midfield + hm.control, awayControl = awayLines.midfield + am.control;
    const homePossessionChance = clamp(.5 + (homeControl - awayControl) / 120, .28, .72);
    const possessionTeamId = Math.random() < homePossessionChance ? home.id : away.id;
    session.possessionTeamId = possessionTeamId;
    const minuteStep = 1 + Math.floor(Math.random() * 3);
    session.minute = Math.min(90, session.minute + minuteStep);
    if (possessionTeamId === home.id) session.stats.homePossessionTicks += minuteStep; else session.stats.awayPossessionTicks += minuteStep;
    const possessionTotal = session.stats.homePossessionTicks + session.stats.awayPossessionTicks;
    session.stats.homePossession = Math.round(session.stats.homePossessionTicks / possessionTotal * 100);
    session.stats.awayPossession = 100 - session.stats.homePossession;
    const isHomePossession = possessionTeamId === home.id;
    const attackTeam = isHomePossession ? home : away, defendTeam = isHomePossession ? away : home;
    const attackLines = isHomePossession ? homeLines : awayLines, defendLines = isHomePossession ? awayLines : homeLines;
    const attackMods = isHomePossession ? hm : am, defendMods = isHomePossession ? am : hm;
    const attackStyle = isHomePossession ? homeStyle : awayStyle, defendStyle = isHomePossession ? awayStyle : homeStyle;
    const beat: MatchEvent = { type: "build-up", minute: session.minute, possessionTeamId, homeTactic: homeStyle, awayTactic: awayStyle };

    const turnoverChance = clamp(.17 + (defendLines.defense - attackLines.midfield) / 240 + defendMods.protection / 360, .07, .4);
    if (Math.random() < turnoverChance) {
      beat.type = "turnover"; beat.text = `${defendTeam.name} recupera el balón y corta el avance.`;
      session.events.push(beat); return { type: "event", event: beat, session };
    }

    const shotChance = clamp(.42 + (attackLines.attack - defendLines.defense) / 320 + attackMods.chance - defendMods.protection / 650, .28, .58);
    if (Math.random() >= shotChance) {
      beat.type = "build-up"; beat.text = `${attackTeam.name} mueve el balón y busca espacios.`;
      session.events.push(beat); return { type: "event", event: beat, session };
    }

    const shooter = scorerFor(attackTeam, Math.random); const goalkeeper = defendTeam.players.find((player) => player.position === "POR") || [...defendTeam.players].sort((a, b) => (b.goalkeeping || b.overall) - (a.goalkeeping || a.overall))[0];
    if (!shooter || !goalkeeper) {
      beat.type = "build-up"; beat.text = `${attackTeam.name} llega al área, pero no consigue rematar.`;
      session.events.push(beat); return { type: "event", event: beat, session };
    }
    if (isHomePossession) session.stats.homeShots++; else session.stats.awayShots++;
    const shooting = shooter.shooting || shooter.overall;
    const reflexes = goalkeeper.goalkeeping || goalkeeper.overall;
    const accuracy = clamp(.66 + (shooting - reflexes) / 260 + (attackStyle === "attack" ? .035 : 0), .48, .84);
    if (Math.random() > accuracy) {
      beat.type = "shot-off-target";
      beat.text = `${shooter.name} remata desde el área, pero el balón se va desviado.`;
      beat.playerName = shooter.name;
      session.events.push(beat);
      return { type: "event", event: beat, session };
    }
    if (isHomePossession) session.stats.homeOnTarget++; else session.stats.awayOnTarget++;
    const isGreatChance = shooter.position === "DEL" && shooter.overall >= 76 || Math.random() < .13;
    const attackTacticBonus = attackStyle === "attack" ? 7 : attackStyle === "defensive" ? -4 : 0;
    const keeperTacticBonus = defendStyle === "defensive" ? 8 : defendStyle === "attack" ? -5 : 0;
    const goalChance = clamp(.49 + (shooting - reflexes) / 150 + attackTacticBonus / 100 - keeperTacticBonus / 100 + (isGreatChance ? .14 : 0), .08, .92);
    const userIsAttacking = attackTeam.id === session.userTeamId;
    const probability = userIsAttacking ? goalChance : 1 - goalChance;
    const chance = {
      id: `${session.fixtureId}-chance-${session.events.length + 1}`, teamId: attackTeam.id, opponentId: defendTeam.id,
      shooterId: shooter.id, shooterName: shooter.name, shooterPosition: shooter.position, keeperId: goalkeeper.id, keeperName: goalkeeper.name,
      userIsAttacking, isGreatChance, probability: Math.round(probability * 100), goalChance: Math.round(goalChance * 100),
      type: userIsAttacking ? "shoot" : "save", minute: session.minute,
    };
    beat.type = "chance"; beat.text = isGreatChance ? `¡Gran oportunidad para ${attackTeam.name}! ${shooter.name} queda frente al arco.` : `${attackTeam.name} encuentra espacio y remata ${shooter.name}.`;
    beat.playerName = shooter.name; session.events.push(beat);
    session.pendingChance = chance;
    return { type: "chance", event: beat, chance, session };
  }

  function resolveInteractiveChance(session: MatchSession, success: boolean) {
    const chance = session.pendingChance; if (!chance) return null;
    const attackTeam = state.league.teams.find((team) => team.id === chance.teamId)!;
    const isHomeAttack = chance.teamId === session.homeId;
    let outcome;
    if (chance.type === "shoot") {
      if (success) { outcome = "goal"; if (isHomeAttack) session.homeGoals++; else session.awayGoals++; }
      else outcome = "saved";
    } else {
      if (success) outcome = "save";
      else { outcome = "goal-against"; if (isHomeAttack) session.homeGoals++; else session.awayGoals++; }
    }
    chance.outcome = outcome; chance.success = Boolean(success); chance.teamName = attackTeam.name;
    const label = outcome === "goal" ? "¡GOLAZO!" : outcome === "save" ? "¡ATAJADÓN!" : outcome === "saved" ? `El portero ${chance.keeperName} detiene el remate` : outcome === "goal-against" ? "Gol del rival" : "El remate se va afuera";
    const resultEvent = { minute: chance.minute, type: outcome, teamId: chance.teamId, playerId: chance.shooterId, playerName: chance.shooterName, text: label };
    session.events.push(resultEvent); session.pendingChance = null;
    return { outcome, event: resultEvent, session };
  }

  function finishInteractiveMatch(session: MatchSession) {
    if (session.pendingChance) throw new Error("Resuelve la oportunidad antes de finalizar el partido.");
    session.finished = true;
    const home = state.league.teams.find((team) => team.id === session.homeId)!, away = state.league.teams.find((team) => team.id === session.awayId)!;
    const matchEvents = session.events.filter((event) => event.type === "goal" || event.type === "goal-against").map((event) => ({ ...event, type: "goal", side: event.teamId === home.id ? "home" : "away" }));
    matchEvents.forEach((event) => {
      const club = event.teamId === home.id ? home : away; const scorer = club.players.find((player) => player.id === event.playerId);
      if (scorer) scorer.goals = (scorer.goals || 0) + 1;
      const teammates = club.players.filter((player) => player.position !== "POR" && player.id !== event.playerId);
      if (teammates.length && Math.random() < .65) teammates[Math.floor(Math.random() * teammates.length)].assists++;
    });
    [home, away].forEach((club) => {
      club.players.forEach((player) => {
        player.appearances = (player.appearances || 0) + 1;
        const potentialGap = Math.max(0, (player.potential || player.overall) - player.overall);
        if (player.overall < player.potential && Math.random() < .035 + potentialGap / 650) { player.overall++; player.value = marketValue(player); }
      });
      const bestEleven = [...club.players].sort((a, b) => b.overall - a.overall).slice(0, 11);
      if (bestEleven.length) club.rating = Math.round(bestEleven.reduce((sum, player) => sum + player.overall, 0) / bestEleven.length);
    });
    const fixture = state.fixtures.find((item) => item.id === session.fixtureId)!;
    Object.assign(fixture, { status: "played", homeGoals: session.homeGoals, awayGoals: session.awayGoals, events: matchEvents, homeShots: session.stats.homeShots, awayShots: session.stats.awayShots, homeOnTarget: session.stats.homeOnTarget, awayOnTarget: session.stats.awayOnTarget });
    state.currentRound = session.round;
    state.lastRoundSummary = state.fixtures.filter((item) => item.round === session.round && item.status === "played");
    save(); return fixture;
  }

  function validateImportedLeague(input: unknown) {
    const wrapper = input as {league?: unknown} | null;
    const league = (wrapper?.league || input) as CareerLeague;
    if (!league || !Array.isArray(league.teams) || league.teams.length < 2) throw new Error("El archivo debe contener una liga con al menos 2 equipos.");
    const ids = new Set();
    const teams = league.teams.map((t, ti) => {
      if (!t?.name) throw new Error(`El equipo ${ti + 1} no tiene nombre.`);
      const id = String(t.id || `club-${ti + 1}`).trim(); if (ids.has(id)) throw new Error(`ID de equipo duplicado: ${id}`); ids.add(id);
      const players = (t.players || []).map((p, pi) => {
        const overall = clamp(Number(p.overall) || 60, 1, 99);
        return { id: String(p.id || `${id}-player-${pi + 1}`), name: String(p.name || `Jugador ${pi + 1}`), teamId: id, countryCode: String(p.countryCode || p.country || p.nationality || ''), portrait: String(p.portrait || p.photo || ''), dribbling: p.dribbling == null ? undefined : clamp(Number(p.dribbling) || overall, 1, 99), position: POSITION_GROUPS.includes(String(p.position).toUpperCase()) ? String(p.position).toUpperCase() : "MED", overall, potential: clamp(Number(p.potential) || overall, overall, 99), age: clamp(Number(p.age) || 24, 15, 42), xp: 0, pace: Number(p.pace) || overall, shooting: Number(p.shooting) || overall, passing: Number(p.passing) || overall, defending: Number(p.defending) || overall, physical: Number(p.physical) || overall, goalkeeping: Number(p.goalkeeping) || (String(p.position).toUpperCase() === "POR" ? overall : 8), value: Number(p.value) || overall * overall * 1400, appearances: 0, goals: 0, assists: 0 };
      });
      const rating = clamp(Number(t.rating) || (players.length ? Math.round(players.reduce((s, p) => s + p.overall, 0) / players.length) : 65), 1, 99);
      return { id, name: String(t.name), shortName: String(t.shortName || t.name.slice(0, 3).toUpperCase()), rating, players };
    });
    return { id: String(league.id || "imported-league"), name: String(league.name || "Liga importada"), country: String(league.country || "—"), teams };
  }

  function importLeague(input: unknown) {
    const league = validateImportedLeague(input); state = makeInitialState(league, 1); save(); return state;
  }
  function resetSeason() { const settings = { ...(state.settings || {}) }, academy = state.academy, teamFormation = state.teamFormation; state = makeInitialState(state.league, state.season + 1, state.selectedClubId); state.settings = settings; state.academy = academy; state.teamFormation = teamFormation; save(); return state; }
  function selectClub(id: string) { if (state.league.teams.some((t) => t.id === id)) { state.selectedClubId = id; save(); } }
  function setTeamFormation(formation: string) { if (window.FutinFormations.names.includes(formation)) { state.teamFormation = formation; save(); } return state.teamFormation; }
  function trainSelectedPlayer(playerId: string) {
    const team = state.league.teams.find((entry) => entry.id === state.selectedClubId)!;
    const player = team?.players.find((entry) => entry.id === playerId);
    if (!player) return { error: "No encontramos ese jugador en tu club." };
    if (player.overall >= player.potential) return { error: "Este jugador ya alcanzó su potencial." };
    const earned = trainingXpGain(player);
    player.xp = (Number(player.xp) || 0) + earned;
    const previous = player.overall;
    while (player.overall < player.potential && player.xp >= xpToNext(player.overall)) {
      player.xp -= xpToNext(player.overall); player.overall++; player.value = marketValue(player);
      (["pace", "shooting", "passing", "defending", "physical", "goalkeeping"] as const).forEach((key) => { if (player[key]) player[key] = Math.min(99, player[key] + 1); });
    }
    const bestEleven = [...team.players].sort((a, b) => b.overall - a.overall).slice(0, 11);
    if (bestEleven.length) team.rating = Math.round(bestEleven.reduce((sum, entry) => sum + entry.overall, 0) / bestEleven.length);
    save(); return { player, earned, levelsGained: player.overall - previous, nextXp: player.overall < player.potential ? xpToNext(player.overall) : 0 };
  }
  function advanceAcademyMonth() { state.academy.month++; state.academy.candidates = makeAcademyCandidates(state.academy.month); state.academy.signedThisMonth = false; save(); return state.academy; }
  function swapSquadPlayers(firstId: string, secondId: string) {
    const team = state.league.teams.find((entry) => entry.id === state.selectedClubId)!;
    const first = team?.players.find((entry) => entry.id === firstId), second = team?.players.find((entry) => entry.id === secondId);
    if (!first || !second || first.id === second.id) return false;
    [first.squadSlot, second.squadSlot] = [second.squadSlot, first.squadSlot];
    save(); return true;
  }
  function signAcademyPlayer(playerId: string) {
    if (state.academy.signedThisMonth) return { error: "Ya fichaste a un canterano este mes." };
    const player = state.academy.candidates.find((entry) => entry.id === playerId);
    if (!player) return { error: "Ese prospecto ya no está disponible." };
    const team = state.league.teams.find((entry) => entry.id === state.selectedClubId)!;
    const signed = { ...player, teamId: team.id, squadSlot: Math.max(-1, ...team.players.map((entry) => Number(entry.squadSlot) || 0)) + 1 };
    if (!signed.countryCode && DEMO_LEAGUES.some(league => league.id === state.league.id)) signed.countryCode = demoCountry(signed.id);
    signed.value = marketValue(signed); team.players.push(signed); state.academy.signedThisMonth = true; save(); return { player: signed };
  }
  function updateSettings(patch: Partial<CareerSettings> = {}) {
    const matchSpeed = ["slow", "normal", "fast"].includes(patch.matchSpeed ?? "") ? patch.matchSpeed! : state.settings.matchSpeed;
    state.settings = { ...state.settings, matchSpeed };
    save(); return { ...state.settings };
  }
  function replaceStateFromJson(input: unknown) { return importLeague(input); }
  function exportLeagueTemplate() {
    return { schemaVersion: 1, league: { id: "mi-liga", name: "Nombre de liga", country: "País", teams: [{ id: "club-a", name: "Club A", shortName: "A", rating: 70, players: [{ id: "player-a", name: "Jugador A", position: "DEL", overall: 68, potential: 82, shooting: 72, passing: 62, defending: 30, physical: 64, pace: 70, goalkeeping: 8, value: 800000 }] }, { id: "club-b", name: "Club B", shortName: "B", rating: 68, players: [] }] } };
  }

  export const careerApi = { getState: () => state, getStandings, getCareerSlots, getAvailableLeagues, getActiveSlotId: () => activeSlotId, createCareer, renameCareer, loadCareer, deleteCareer, simulateNextRound, prepareInteractiveMatch, advanceInteractiveMatch, resolveInteractiveChance, finishInteractiveMatch, selectClub, setTeamFormation, swapSquadPlayers, resetSeason, updateSettings, trainSelectedPlayer, advanceAcademyMonth, signAcademyPlayer, xpToNext, xpAgeMultiplier, trainingXpGain, trainingXpBreakdown, marketValue, importLeague, replaceStateFromJson, validateImportedLeague, exportLeagueTemplate, teamLines, saveSlotCount: SAVE_SLOT_COUNT };

window.FutinCareer = careerApi;
