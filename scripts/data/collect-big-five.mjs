/** Public reference data only. Wikipedia attribution and Wikidata provenance travel with exports. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'data/big-five');
const CACHE = path.join(OUT, '.cache');
const SEASON = '2026-27';
const DATE = process.env.FUTIN_REFERENCE_DATE || '2026-10-07';
const LEAGUES = [
  ['premier-league', 'Premier League', 'Inglaterra', '2026–27 Premier League', 20],
  ['la-liga', 'LaLiga', 'España', '2026–27 La Liga', 20],
  ['serie-a', 'Serie A', 'Italia', '2026–27 Serie A', 20],
  ['bundesliga', 'Bundesliga', 'Alemania', '2026–27 Bundesliga', 18],
  ['ligue-1', 'Ligue 1', 'Francia', '2026–27 Ligue 1', 18],
].map(([id, name, country, page, expectedTeams]) => ({ id, name, country, page, expectedTeams }));
const wikiUrl = title => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
const decode = s => s.replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => String.fromCodePoint(n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n)))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ');
const plain = html => decode(html.replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, '').replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
const links = html => [...html.matchAll(/<a\b[^>]*href="\/wiki\/([^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
  .map(m => ({ title: decode(decodeURIComponent(m[1])).replaceAll('_', ' '), name: plain(m[2]) }))
  .filter(a => !/^(File|Help|Template|Category|Special|Wikipedia):/.test(a.title));
const identifier = title => `wiki-${crypto.createHash('sha256').update(title).digest('hex').slice(0, 20)}`;
let lastRequest = 0;
const cachedIdentities = new Map();
const cachedEntities = new Map();

function rememberIdentities(data) {
  if (!data.query?.pages) return;
  const aliases = new Map([...(data.query.normalized || []), ...(data.query.redirects || [])].map(x => [x.from, x.to]));
  const pages = new Map(Object.values(data.query.pages).filter(p => p.pageprops?.wikibase_item).map(p => [p.title, p.pageprops.wikibase_item]));
  for (const [title, id] of pages) cachedIdentities.set(title, id);
  for (const title of aliases.keys()) {
    let canonical = title;
    const seen = new Set();
    while (aliases.has(canonical) && !seen.has(canonical)) { seen.add(canonical); canonical = aliases.get(canonical); }
    if (pages.has(canonical)) cachedIdentities.set(title, pages.get(canonical));
  }
}

async function warmCache() {
  if (process.argv.includes('--refresh')) return;
  // Reuse individual identities across changes in batch boundaries when a roster is corrected.
  for (const filename of await fs.readdir(CACHE)) {
    const raw = gunzipSync(await fs.readFile(path.join(CACHE, filename))).toString();
    if (!raw.includes('"entities"') && !raw.includes('"pageprops"')) continue;
    const data = JSON.parse(raw);
    rememberIdentities(data);
    for (const [id, entity] of Object.entries(data.entities || {})) {
      if ((cachedEntities.get(id)?.lastrevid || 0) <= (entity.lastrevid || 0)) cachedEntities.set(id, entity);
    }
  }
}

async function request(base, params) {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const filename = path.join(CACHE, `${crypto.createHash('sha256').update(url.href).digest('hex')}.json.gz`);
  if (!process.argv.includes('--refresh')) {
    try { return JSON.parse(gunzipSync(await fs.readFile(filename)).toString()); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 1000 - (Date.now() - lastRequest))));
    lastRequest = Date.now();
    const response = await fetch(url, { headers: { 'User-Agent': 'FutinDataCollector/1.0 (local football reference export)', Accept: 'application/json' }, signal: AbortSignal.timeout(90000) });
    if (response.status === 429 || response.status >= 500) {
      const wait = Math.max(Number(response.headers.get('retry-after')) || 0, 2 ** attempt * 2);
      console.log(`Reintento HTTP ${response.status}: ${wait}s`);
      await new Promise(resolve => setTimeout(resolve, wait * 1000));
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url.origin}`);
    const data = await response.json();
    if (data.error?.code === 'maxlag') { console.log(`Fuente ocupada: ${data.error.info}`); await new Promise(resolve => setTimeout(resolve, 10000)); continue; }
    if (data.error) throw new Error(`${data.error.code}: ${data.error.info}`);
    await fs.writeFile(filename, gzipSync(JSON.stringify(data)));
    return data;
  }
  throw new Error(`No se pudo descargar ${url.href}`);
}

async function page(title) {
  const data = await request('https://en.wikipedia.org/w/api.php', { action: 'parse', page: title, prop: 'text|revid', redirects: 1, format: 'json', maxlag: 5 });
  return { title: data.parse.title, html: data.parse.text['*'], revision: data.parse.revid };
}

function teamsFromPage(html) {
  const tables = [...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].map(m => m[0]);
  const table = tables.find(t => /Stadium|Venue/i.test(plain([...t.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(m => m[1]).join(' '))) && /Capacity/i.test(plain(t)));
  if (!table) throw new Error('No se encontró la tabla de equipos y estadios');
  return [...new Map([...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].flatMap(m => {
    const first = m[1].match(/<td\b[^>]*>([\s\S]*?)<\/td>/i);
    const club = first && links(first[1])[0];
    return club ? [[club.title, club]] : [];
  })).values()];
}

function squadFromPage(html) {
  // Track source sections so loaned-out and academy players never become first-team registrations.
  const events = [...html.matchAll(/<h([2-6])\b[^>]*>[\s\S]*?<\/h\1>|<tr\b[^>]*class="[^"]*\bvcard\b[^"]*"[^>]*>[\s\S]*?<\/tr>/gi)];
  const sections = [];
  const players = [];
  let previousEnd = 0;
  let loan = false;
  for (const event of events) {
    const token = event[0];
    const between = html.slice(previousEnd, event.index);
    previousEnd = event.index + token.length;
    if (/Out on loan/i.test(plain(between))) loan = true;
    if (token.startsWith('<h')) {
      const level = Number(event[1]);
      sections.splice(level - 2);
      sections[level - 2] = plain(token).replace(/\[edit\]/g, '').trim();
      loan = /loan/i.test(sections.join(' '));
      continue;
    }
    const cells = [...token.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(m => m[1]);
    if (cells.length < 4 || !/^(GK|DF|MF|FW)$/.test(plain(cells[1]))) continue;
    const playerNameCell = cells[3].match(/<span\b[^>]*class="[^"]*\bfn\b[^"]*"[^>]*>([\s\S]*?)<\/span>/i)?.[1];
    if (playerNameCell == null) throw new Error('Fila de plantilla sin nombre fn: revisar el formato de origen');
    // A loan's club link is outside fn; it must never be mistaken for the player's identity.
    const playerLink = links(playerNameCell)[0];
    const name = playerLink?.name || plain(playerNameCell).replace(/\s*\([^)]*\)/g, '').trim();
    const section = sections.filter(Boolean).join(' / ');
    if (/former|past players|notable players|all.time|hall of fame|retired/i.test(section)) continue;
    const status = loan ? 'loaned-out' : /academy|under.?\d|youth|reserve|development|junior|primavera|\bB(?: Team)?\b|\bII\b/i.test(section) ? 'academy' : /other players|under contract/i.test(section) ? 'under-contract' : 'first-team';
    players.push({ name, title: playerLink?.title || null, shirtNumber: /^\d+$/.test(plain(cells[0])) ? Number(plain(cells[0])) : null, position: ({ GK: 'POR', DF: 'DEF', MF: 'MED', FW: 'DEL' })[plain(cells[1])], positionSource: plain(cells[1]), sportingNationality: plain(cells[2]), status, section });
  }
  return [...new Map(players.map(p => [`${p.title || p.name}|${p.status}`, p])).values()];
}

async function entitiesForTitles(titles) {
  const result = new Map(titles.filter(t => cachedIdentities.has(t)).map(t => [t, cachedIdentities.get(t)]));
  titles = titles.filter(t => !result.has(t));
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const data = await request('https://en.wikipedia.org/w/api.php', { action: 'query', prop: 'pageprops', titles: batch.join('|'), redirects: 1, format: 'json', maxlag: 5 });
    rememberIdentities(data);
    const aliases = new Map([...(data.query.normalized || []), ...(data.query.redirects || [])].map(x => [x.from, x.to]));
    const pages = new Map(Object.values(data.query.pages).map(p => [p.title, p.pageprops?.wikibase_item || null]));
    for (const title of batch) {
      let canonical = title;
      const seen = new Set();
      while (aliases.has(canonical) && !seen.has(canonical)) { seen.add(canonical); canonical = aliases.get(canonical); }
      result.set(title, pages.get(canonical) || null);
    }
    console.log(`Identidades: ${Math.min(i + 50, titles.length)}/${titles.length}`);
  }
  return result;
}

async function entities(ids) {
  const result = new Map(ids.filter(id => cachedEntities.has(id)).map(id => [id, cachedEntities.get(id)]));
  ids = ids.filter(id => !result.has(id));
  for (let i = 0; i < ids.length; i += 50) {
    const data = await request('https://www.wikidata.org/w/api.php', { action: 'wbgetentities', ids: ids.slice(i, i + 50).join('|'), props: 'claims|labels|info', languages: 'es|en', format: 'json', maxlag: 15 });
    for (const [id, value] of Object.entries(data.entities)) result.set(id, value);
    console.log(`Biografías: ${Math.min(i + 50, ids.length)}/${ids.length}`);
  }
  return result;
}

function claims(entity, property) {
  const all = (entity?.claims?.[property] || []).filter(c => c.rank !== 'deprecated' && c.mainsnak.snaktype === 'value');
  const best = all.some(c => c.rank === 'preferred') ? all.filter(c => c.rank === 'preferred') : all;
  return best.map(c => c.mainsnak.datavalue.value);
}

function ageOn(birthDate) {
  if (!birthDate) return null;
  const [year, month, day] = birthDate.split('-').map(Number);
  const [refYear, refMonth, refDay] = DATE.split('-').map(Number);
  return refYear - year - (refMonth < month || (refMonth === month && refDay < day) ? 1 : 0);
}

function birthDateFromInfobox(text) {
  const line = text.match(/\|\s*birth_date\s*=([^\n]+)/i)?.[1]?.replace(/<!--[\s\S]*?-->/g, '') || '';
  const template = line.match(/{{\s*(?:birth date(?: and age)?|bda)\s*\|([^{}]+)}}/i);
  const parts = template?.[1].split('|').map(s => s.trim()).filter(s => /^\d+$/.test(s));
  let year, month, day;
  if (parts?.length >= 3) [year, month, day] = parts.slice(0, 3).map(Number);
  else {
    const named = line.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
    if (!named) return null;
    day = Number(named[1]); year = Number(named[3]);
    month = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].indexOf(named[2].toLowerCase()) + 1;
  }
  if (year < 1900 || year > Number(DATE.slice(0, 4)) || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const candidate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === candidate ? candidate : null;
}

async function supplementBirthDates(players, titlesByPlayerId) {
  const missing = [...players.values()].filter(p => !p.birthDate && titlesByPlayerId.get(p.id));
  for (let i = 0; i < missing.length; i += 50) {
    const batch = missing.slice(i, i + 50);
    const titles = batch.map(p => titlesByPlayerId.get(p.id));
    const data = await request('https://en.wikipedia.org/w/api.php', { action: 'query', prop: 'revisions', rvprop: 'ids|content', rvslots: 'main', titles: titles.join('|'), redirects: 1, format: 'json', maxlag: 5 });
    const aliases = new Map([...(data.query.normalized || []), ...(data.query.redirects || [])].map(x => [x.from, x.to]));
    const pages = new Map(Object.values(data.query.pages).map(p => [p.title, p]));
    for (const player of batch) {
      let title = titlesByPlayerId.get(player.id);
      const seen = new Set();
      while (aliases.has(title) && !seen.has(title)) { seen.add(title); title = aliases.get(title); }
      const revision = pages.get(title)?.revisions?.[0];
      const birthDate = birthDateFromInfobox(revision?.slots?.main?.['*'] || '');
      if (!birthDate) continue;
      player.birthDate = birthDate;
      player.birthYear = Number(birthDate.slice(0, 4));
      player.age = ageOn(birthDate);
      player.birthDateSource = { provider: 'Wikipedia', url: wikiUrl(title), revision: revision.revid, license: 'CC-BY-SA-4.0' };
    }
    console.log(`Fechas complementarias: ${Math.min(i + 50, missing.length)}/${missing.length}`);
  }
}

async function writeJson(name, value) { await fs.writeFile(path.join(OUT, name), JSON.stringify(value, null, 2) + '\n', 'utf8'); }
async function writeCsv(name, rows, fields) {
  // Quote every cell; protect spreadsheet users against formula execution in downloaded text.
  const cell = value => {
    let text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (/^[=+@\-]/.test(text)) text = "'" + text;
    return `"${text.replaceAll('"', '""')}"`;
  };
  await fs.writeFile(path.join(OUT, name), '\uFEFF' + [fields, ...rows.map(row => fields.map(f => row[f]))].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n');
}

async function main() {
  await fs.mkdir(CACHE, { recursive: true });
  await warmCache();
  const clubs = [], registrations = [], collected = [], issues = [];
  for (const league of LEAGUES) {
    const source = await page(league.page);
    league.sourceUrl = wikiUrl(source.title);
    league.sourceRevision = source.revision;
    const teams = teamsFromPage(source.html);
    if (teams.length !== league.expectedTeams) throw new Error(`${league.name}: ${teams.length} equipos encontrados; se esperaban ${league.expectedTeams}`);
    league.teamCount = teams.length;
    console.log(`${league.name}: ${teams.length} equipos`);
    for (const team of teams) {
      const source = await page(team.title);
      const clubId = identifier(source.title);
      const club = { id: clubId, name: team.name, leagueId: league.id, country: league.country, season: SEASON, wikipediaTitle: source.title, sourceUrl: wikiUrl(source.title), sourceRevision: source.revision, license: 'CC-BY-SA-4.0', firstTeamCount: 0, totalListedCount: 0 };
      const squad = squadFromPage(source.html);
      club.firstTeamCount = squad.filter(p => p.status === 'first-team').length;
      club.totalListedCount = squad.length;
      if (club.firstTeamCount < 15) issues.push({ type: 'small-or-missing-roster', club: club.name, count: club.firstTeamCount, sourceUrl: club.sourceUrl });
      clubs.push(club);
      for (const player of squad) {
        const provisionalId = identifier(player.title || `${source.title}:${player.name}`);
        collected.push({ ...player, provisionalId, club });
        registrations.push({ playerId: provisionalId, clubId, leagueId: league.id, season: SEASON, status: player.status, shirtNumber: player.shirtNumber, rosterSection: player.section, sourceUrl: club.sourceUrl, sourceRevision: club.sourceRevision, license: 'CC-BY-SA-4.0' });
      }
      console.log(`  ${club.name}: ${club.firstTeamCount} primer equipo; ${squad.length} incluidos`);
    }
  }
  await writeJson('rosters-intermediate.json', { leagues: LEAGUES, clubs, collected, registrations, issues });
  if (process.argv.includes('--rosters-only')) return;

  const titles = [...new Set([...clubs.map(c => c.wikipediaTitle), ...collected.map(p => p.title).filter(Boolean)])];
  const idsByTitle = await entitiesForTitles(titles);
  const biographies = await entities([...new Set([...idsByTitle.values()].filter(Boolean))]);
  const relatedIds = new Set();
  for (const entity of biographies.values()) {
    for (const property of ['P27', 'P413', 'P115', 'P159']) {
      for (const value of claims(entity, property)) if (value.id) relatedIds.add(value.id);
    }
  }
  const related = await entities([...relatedIds]);
  const describe = id => ({ id, name: related.get(id)?.labels?.es?.value || related.get(id)?.labels?.en?.value || id });
  const players = new Map(), finalIds = new Map(), titlesByPlayerId = new Map();
  for (const item of collected) {
    const wikidataId = idsByTitle.get(item.title) || null;
    const id = wikidataId || item.provisionalId;
    finalIds.set(item.provisionalId, id);
    if (item.title) titlesByPlayerId.set(id, item.title);
    if (players.has(id)) continue;
    const entity = biographies.get(wikidataId);
    const births = claims(entity, 'P569');
    const birthYears = [...new Set(births.map(b => b.time.match(/^\+(\d{4})/)?.[1]).filter(Boolean))];
    const birthYear = birthYears.length === 1 ? Number(birthYears[0]) : null;
    const exactDates = [...new Set(births.filter(b => b.precision >= 11 && !b.before && !b.after && b.calendarmodel.endsWith('/Q1985727')).map(b => b.time.match(/^\+(\d{4}-\d{2}-\d{2})/)?.[1]).filter(Boolean))];
    const birthDate = exactDates.length === 1 ? exactDates[0] : null;
    const birthDateCandidates = exactDates.length > 1 ? exactDates : [];
    if (birthDateCandidates.length) issues.push({ type: 'ambiguous-birth-date', playerId: id, name: item.name, candidates: birthDateCandidates, sourceUrl: `https://www.wikidata.org/wiki/${wikidataId}` });
    const height = claims(entity, 'P2048')[0];
    const heightCm = height?.unit?.endsWith('/Q174728') ? Number(height.amount) : height?.unit?.endsWith('/Q11573') ? Math.round(Number(height.amount) * 100) : null;
    const citizenshipIds = claims(entity, 'P27').map(v => v.id);
    const positionIds = claims(entity, 'P413').map(v => v.id);
    players.set(id, { id, originalName: item.name, futinName: '', birthDate, birthYear, birthDateCandidates, age: ageOn(birthDate), ageReferenceDate: DATE, sportingNationality: item.sportingNationality, citizenshipIds, citizenships: citizenshipIds.map(describe), position: item.position, positionIds, detailedPositions: positionIds.map(describe), heightCm, wikipediaUrl: item.title ? wikiUrl(item.title) : null, wikidataId, wikidataRevision: entity?.lastrevid || null, biographicalLicense: wikidataId ? 'CC0-1.0' : null, rosterLicense: 'CC-BY-SA-4.0', overall: null, potential: null, pace: null, shooting: null, passing: null, dribbling: null, defending: null, physical: null, goalkeeping: null, value: null, cardDesign: null, portrait: null });
    players.get(id).birthDateSource = birthDate ? { provider: 'Wikidata', url: `https://www.wikidata.org/wiki/${wikidataId}`, revision: entity?.lastrevid || null, license: 'CC0-1.0' } : null;
  }
  await supplementBirthDates(players, titlesByPlayerId);
  for (const club of clubs) {
    club.wikidataId = idsByTitle.get(club.wikipediaTitle) || null;
    const entity = biographies.get(club.wikidataId);
    club.stadiums = claims(entity, 'P115').map(v => describe(v.id));
    club.headquarters = claims(entity, 'P159').map(v => describe(v.id));
    // Club metadata can have historical statements; it is kept separate from season rosters.
    club.inception = claims(entity, 'P571')[0]?.time || null;
    club.biographicalLicense = club.wikidataId ? 'CC0-1.0' : null;
  }
  for (const r of registrations) r.playerId = finalIds.get(r.playerId);
  const allPlayers = [...players.values()];
  const firstTeamIds = new Set(registrations.filter(r => r.status === 'first-team').map(r => r.playerId));
  for (const id of firstTeamIds) {
    const active = registrations.filter(r => r.playerId === id && r.status === 'first-team');
    if (new Set(active.map(r => r.clubId)).size > 1) issues.push({ type: 'multiple-first-team-clubs', playerId: id, name: players.get(id).originalName, sourceUrls: active.map(r => r.sourceUrl) });
  }
  const summary = LEAGUES.map(l => {
    const listed = registrations.filter(r => r.leagueId === l.id);
    const firstTeam = listed.filter(r => r.status === 'first-team');
    return { leagueId: l.id, name: l.name, teams: clubs.filter(c => c.leagueId === l.id).length, firstTeamRegistrations: firstTeam.length, totalRegistrations: listed.length, firstTeamWithBirthDate: firstTeam.filter(r => players.get(r.playerId).birthDate).length };
  });
  const manifest = { schemaVersion: 1, season: SEASON, referenceDate: DATE, collectedAt: new Date().toISOString(), scope: 'Men: first-team rosters, with separately identified academy and loaned-out players when listed', completeOfficialRegistrationList: false, sourceProviders: ['Wikipedia', 'Wikidata'], licenses: ['CC-BY-SA-4.0', 'CC0-1.0'], counts: { leagues: LEAGUES.length, clubs: clubs.length, uniquePlayers: allPlayers.length, uniqueFirstTeamPlayers: firstTeamIds.size, registrations: registrations.length, withBirthDate: allPlayers.filter(p => p.birthDate).length, withWikidataIdentity: allPlayers.filter(p => p.wikidataId).length }, leagues: summary, issues, missingGameAttributes: ['overall', 'potential', 'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical', 'goalkeeping', 'value'], notes: ['Source rosters may be incomplete or stale; this is not a certified list of every registered player.', 'Age calculated on referenceDate only when a precise birth date exists.', 'No EA ratings, pictures, flags or crests have been downloaded.', 'Broad positions POR/DEF/MED/DEL follow squad tables; detailed position IDs retained where available.'] };
  await writeJson('manifest.json', manifest);
  await writeJson('leagues.json', LEAGUES);
  await writeJson('clubs.json', clubs);
  await writeJson('players.json', allPlayers);
  await writeJson('registrations.json', registrations);
  await writeJson('big-five.json', { manifest, leagues: LEAGUES, clubs, players: allPlayers, registrations });
  await writeCsv('clubs.csv', clubs, ['id', 'name', 'leagueId', 'country', 'season', 'wikidataId', 'stadiums', 'headquarters', 'inception', 'firstTeamCount', 'totalListedCount', 'sourceUrl', 'sourceRevision', 'license', 'biographicalLicense']);
  const clubById = new Map(clubs.map(c => [c.id, c]));
  const flat = registrations.map(r => ({ ...players.get(r.playerId), ...r, clubName: clubById.get(r.clubId).name }));
  const fields = ['playerId', 'originalName', 'futinName', 'leagueId', 'clubId', 'clubName', 'season', 'status', 'shirtNumber', 'birthDate', 'birthYear', 'birthDateCandidates', 'birthDateSource', 'age', 'ageReferenceDate', 'sportingNationality', 'citizenships', 'position', 'detailedPositions', 'heightCm', 'overall', 'potential', 'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical', 'goalkeeping', 'value', 'cardDesign', 'wikipediaUrl', 'wikidataId', 'sourceUrl', 'sourceRevision', 'license', 'biographicalLicense'];
  await writeCsv('players.csv', flat, fields);
  await writeCsv('first-team.csv', flat.filter(p => p.status === 'first-team'), fields);
  for (const league of LEAGUES) {
    await writeJson(`${league.id}.json`, { league, clubs: clubs.filter(c => c.leagueId === league.id), players: allPlayers.filter(p => registrations.some(r => r.playerId === p.id && r.leagueId === league.id)), registrations: registrations.filter(r => r.leagueId === league.id) });
    await writeCsv(`${league.id}.csv`, flat.filter(p => p.leagueId === league.id), fields);
  }
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch(error => { console.error(error.stack); process.exitCode = 1; });
