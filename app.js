// React owns the shared navigation. Legacy controllers only update page content.
const navigationLinks = [...document.querySelectorAll(".main-nav .nav-link")].filter(link => !link.closest('[data-react-shell]'));

function updateActiveNavigation() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  navigationLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === currentPage;
    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

updateActiveNavigation();

const gemBalanceNodes = document.querySelectorAll("[data-gem-balance]");
const defaultGemBalance = 2450;

function getGemBalance() {
  if (window.FutinWallet) return window.FutinWallet.get().balance;
  try {
    const storedBalance = localStorage.getItem("futin-gems");
    if (storedBalance === null) return defaultGemBalance;
    const savedBalance = Number(storedBalance);
    return Number.isFinite(savedBalance) && savedBalance >= 0 ? savedBalance : defaultGemBalance;
  } catch {
    return defaultGemBalance;
  }
}

function syncGemBalance() {
  const formattedBalance = new Intl.NumberFormat("es-CO").format(getGemBalance());
  gemBalanceNodes.forEach((node) => { node.textContent = formattedBalance; });
}

window.addEventListener("futin:walletchange", syncGemBalance);
window.addEventListener("storage", syncGemBalance);
syncGemBalance();
// The season pass uses its own XP track; it is separate from player career training.
const seasonPassLevels = 50;
// 5,292 XP total: about 176 XP per calendar day across a 30-day season.
const seasonPassInitialXp = 60;
const seasonPassXpStep = 2;
const seasonPassStorageKey = 'futin-season-01-xp';
const seasonPassEconomyVersionKey = 'futin-season-01-economy-version';
const seasonPassAwardsKey = 'futin-season-01-awards';
const seasonPassDailyKey = 'futin-season-01-daily';
const seasonPassDailyCaps = { collection: 200, career: 150, minigame: 150 };

function seasonPassXpForLevel(level) {
  return seasonPassInitialXp + (level - 1) * seasonPassXpStep;
}

const seasonPassXpCap = Array.from({ length: seasonPassLevels - 1 }, (_, index) => seasonPassXpForLevel(index + 1)).reduce((sum, xp) => sum + xp, 0);
const seasonPassNumber = (value) => new Intl.NumberFormat('es-CO').format(value);
const seasonPassLevelLabel = (value) => String(value).padStart(2, '0');

function getSeasonPassXp() {
  try {
    let saved = Number.parseInt(localStorage.getItem(seasonPassStorageKey) || '0', 10);
    if (localStorage.getItem(seasonPassEconomyVersionKey) !== '2') {
      // Preserve existing test progress proportionally after balancing the 30-day track.
      saved = Number.isFinite(saved) ? Math.round(Math.max(0, saved) / 53900 * seasonPassXpCap) : 0;
      localStorage.setItem(seasonPassStorageKey, String(saved));
      localStorage.setItem(seasonPassEconomyVersionKey, '2');
    }
    return Number.isFinite(saved) ? Math.max(0, Math.min(seasonPassXpCap, saved)) : 0;
  } catch {
    return 0;
  }
}

function getSeasonPassState(totalXp = getSeasonPassXp()) {
  let remainingXp = Math.max(0, Math.min(seasonPassXpCap, Math.floor(Number(totalXp) || 0)));
  let level = 1;

  while (level < seasonPassLevels) {
    const requirement = seasonPassXpForLevel(level);
    if (remainingXp < requirement) break;
    remainingXp -= requirement;
    level += 1;
  }

  const completed = level === seasonPassLevels;
  const requiredXp = completed ? 0 : seasonPassXpForLevel(level);
  return {
    level,
    levelLabel: seasonPassLevelLabel(level),
    totalXp: Math.max(0, Math.min(seasonPassXpCap, Math.floor(Number(totalXp) || 0))),
    currentXp: completed ? 0 : remainingXp,
    requiredXp,
    xpToNext: completed ? 0 : Math.max(0, requiredXp - remainingXp),
    progress: completed ? 1 : (requiredXp ? remainingXp / requiredXp : 0),
    completed,
    nextLevel: completed ? null : level + 1,
    xpCap: seasonPassXpCap,
  };
}

function saveSeasonPassXp(totalXp) {
  const previousLevel = getSeasonPassState().level;
  const value = Math.max(0, Math.min(seasonPassXpCap, Math.floor(Number(totalXp) || 0)));
  try { localStorage.setItem(seasonPassStorageKey, String(value)); } catch { /* Keep the in-memory UI usable if storage is unavailable. */ }
  const state = getSeasonPassState(value);
  if (state.level > previousLevel) window.FutinNotifications?.add({id:`pass-level:${state.level}`,title:`Nivel ${state.level} alcanzado`,text:'Tu pase de temporada sigue avanzando.',href:'pase.html',type:'trophy'});
  window.dispatchEvent(new CustomEvent('futin:seasonpasschange', { detail: state }));
  return state;
}

function readSeasonPassJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
  } catch { return fallback; }
}

function seasonPassToday() {
  return window.FutinClock?.dayKey() || new Date().toISOString().slice(0,10);
}

function seasonPassAwardOnce(id, amount, category = null) {
  const awardId = String(id || '').trim();
  const requested = Math.max(0, Math.floor(Number(amount) || 0));
  if (!awardId || !requested) return { awarded: false, xpAwarded: 0, state: getSeasonPassState() };
  const awards = readSeasonPassJson(seasonPassAwardsKey, {});
  if (Object.prototype.hasOwnProperty.call(awards, awardId)) return { awarded: false, xpAwarded: 0, state: getSeasonPassState() };

  let actual = requested;
  if (category && seasonPassDailyCaps[category]) {
    const today = seasonPassToday();
    const daily = readSeasonPassJson(seasonPassDailyKey, { date: today, earned: {} });
    if (daily.date !== today) { daily.date = today; daily.earned = {}; }
    const remaining = Math.max(0, seasonPassDailyCaps[category] - Number(daily.earned?.[category] || 0));
    actual = Math.min(requested, remaining);
    daily.earned ||= {};
    daily.earned[category] = Number(daily.earned[category] || 0) + actual;
    try { localStorage.setItem(seasonPassDailyKey, JSON.stringify(daily)); } catch { /* XP remains available for this session. */ }
  }
  awards[awardId] = { date: seasonPassToday(), xp: actual };
  try { localStorage.setItem(seasonPassAwardsKey, JSON.stringify(awards)); } catch { /* Duplicate protection is best-effort when storage is unavailable. */ }
  const state = actual ? saveSeasonPassXp(getSeasonPassXp() + actual) : getSeasonPassState();
  return { awarded: actual > 0, xpAwarded: actual, state };
}

function seasonPassPlayerXp(player) {
  const raw = String(player?.rarity || player?.tier || player?.category || player?.cardDesign || '').trim().toLowerCase();
  const finish = String(player?.finish || player?.version || player?.cardDesign || '').toLowerCase();
  const hasSpecialFinish = player?.special === true || player?.isSpecial === true || finish.includes('especial') || finish.includes('special');
  if (raw.includes('bronce') || raw.includes('bronze')) return 15 + (hasSpecialFinish ? 5 : 0);
  if (raw.includes('plata') || raw.includes('silver')) return 25 + (hasSpecialFinish ? 5 : 0);
  if (raw.includes('oro') || raw.includes('gold')) return 35 + (hasSpecialFinish ? 5 : 0);
  if (raw.includes('elite') || raw.includes('élite') || raw.includes('especial') || raw.includes('special') || raw.includes('icon')) return 50;
  const overall = Number(player?.overall ?? player?.rating);
  return overall >= 85 ? 50 : overall >= 75 ? 35 : overall >= 65 ? 25 : 15;
}

function seasonPassAwardPlayerUnlock(player, playerId = player?.id) {
  if (!player || !playerId) return { awarded: false, xpAwarded: 0, state: getSeasonPassState() };
  const key = String(playerId);
  return seasonPassAwardOnce(`player-unlock:${key}`, seasonPassPlayerXp(player), 'collection');
}

function seasonPassAwardCareerMatch({ id, result }) {
  const outcome = String(result || '').toLowerCase();
  const bonus = outcome === 'win' || outcome === 'won' || outcome === 'victory' ? 75
    : outcome === 'draw' || outcome === 'tie' ? 35 : 0;
  return seasonPassAwardOnce(`career-match:${id}`, 25 + bonus, 'career');
}

function seasonPassAwardCareerTitle(id) {
  return seasonPassAwardOnce(`career-title:${id}`, 600);
}

function refreshSeasonPassWidgets() {
  const state = getSeasonPassState();
  document.querySelectorAll('[data-pass-level]').forEach((node) => { node.textContent = state.levelLabel; });
  document.querySelectorAll('[data-pass-current-xp]').forEach((node) => { node.textContent = seasonPassNumber(state.currentXp); });
  document.querySelectorAll('[data-pass-xp-required]').forEach((node) => { node.textContent = state.completed ? '—' : seasonPassNumber(state.requiredXp); });
  document.querySelectorAll('[data-pass-total-xp]').forEach((node) => { node.textContent = seasonPassNumber(state.totalXp); });
  document.querySelectorAll('[data-pass-progress-meter]').forEach((node) => { node.style.width = `${state.progress * 100}%`; });
  document.querySelectorAll('.pass-progress-track').forEach((node) => {
    node.setAttribute('aria-valuenow', String(Math.round(state.progress * 100)));
    node.setAttribute('aria-valuetext', state.completed ? 'Pase completado' : `${Math.round(state.progress * 100)} por ciento del nivel actual`);
  });
  document.querySelectorAll('[data-pass-next-note]').forEach((node) => {
    node.textContent = state.completed
      ? 'Has completado los 50 niveles de esta temporada.'
      : `Te faltan ${seasonPassNumber(state.xpToNext)} XP para llegar al nivel ${seasonPassLevelLabel(state.nextLevel)}.`;
  });
  document.querySelectorAll('[data-pass-status]').forEach((node) => {
    node.textContent = state.completed ? 'PASE COMPLETADO' : `NIVEL ${state.levelLabel} DE 50`;
  });
  document.querySelectorAll('[data-pass-node]').forEach((node) => {
    const nodeLevel = Number(node.dataset.passNode);
    const status = nodeLevel < state.level ? 'completed' : nodeLevel === state.level ? 'current' : 'upcoming';
    node.classList.toggle('is-completed', status === 'completed');
    node.classList.toggle('is-current', status === 'current');
    node.classList.toggle('is-upcoming', status === 'upcoming');
    if (status === 'current') node.setAttribute('aria-current', 'step');
    else node.removeAttribute('aria-current');
    node.setAttribute('aria-label', `Nivel ${nodeLevel}${status === 'completed' ? ', completado' : status === 'current' ? ', actual' : ', pendiente'}`);
    const stateNode = node.querySelector('[data-pass-node-state]');
    if (stateNode) stateNode.textContent = status === 'completed' ? 'LISTO' : status === 'current' ? 'ACTUAL' : 'NIVEL';
  });
}

window.FutinSeasonPass = {
  dailyCaps: seasonPassDailyCaps,
  getDailyEarned() {
    const daily = readSeasonPassJson(seasonPassDailyKey, {});
    return daily.date === seasonPassToday() ? daily.earned || {} : {};
  },
  maxLevel: seasonPassLevels,
  getState: getSeasonPassState,
  xpForLevel: seasonPassXpForLevel,
  setXp: saveSeasonPassXp,
  xpCap: seasonPassXpCap,
  awardOnce: seasonPassAwardOnce,
  awardPlayerUnlock: seasonPassAwardPlayerUnlock,
  awardCareerMatch: seasonPassAwardCareerMatch,
  awardCareerTitle: seasonPassAwardCareerTitle,
  addXp(amount) {
    const addition = Math.max(0, Math.floor(Number(amount) || 0));
    return saveSeasonPassXp(getSeasonPassXp() + addition);
  },
  refresh: refreshSeasonPassWidgets,
};
window.addEventListener('futin:playerunlocked', (event) => {
  const detail = event.detail || {};
  const reward = seasonPassAwardPlayerUnlock(detail.player, detail.playerId);
  if (reward.xpAwarded) window.dispatchEvent(new CustomEvent('futin:xpaward', { detail: { source: 'player-unlock', xp: reward.xpAwarded, state: reward.state } }));
});
window.addEventListener('futin:seasonpasschange', refreshSeasonPassWidgets);
window.addEventListener('storage', (event) => {
  if (event.key === seasonPassStorageKey) refreshSeasonPassWidgets();
});
refreshSeasonPassWidgets();
try { window.FutinWallet?.deliverCards(); } catch { /* Pending cards are recovered when storage becomes available. */ }
