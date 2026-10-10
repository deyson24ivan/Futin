/**
 * Resolución matemática de una oportunidad de gol.
 * Atributos esperados: atacante.shooting y portero.reflexes, ambos de 0 a 100.
 */

export const SHOT_INPUT_WINDOW_MS = 5_000;

/**
 * Portería de 4 columnas x 2 filas. Las cuatro esquinas ofrecen más premio,
 * pero tienen menor precisión; las zonas interiores son más fáciles de apuntar.
 */
export const GOAL_ZONES = Object.freeze([
  Object.freeze({ id: "upper-left", label: "Esquina superior izquierda", row: 0, column: 0, type: "corner", baseAccuracy: 0.62, reflexMultiplier: 0.28, shotBonus: 3 }),
  Object.freeze({ id: "upper-center-left", label: "Centro superior izquierdo", row: 0, column: 1, type: "center", baseAccuracy: 0.94, reflexMultiplier: 1, shotBonus: 0 }),
  Object.freeze({ id: "upper-center-right", label: "Centro superior derecho", row: 0, column: 2, type: "center", baseAccuracy: 0.94, reflexMultiplier: 1, shotBonus: 0 }),
  Object.freeze({ id: "upper-right", label: "Esquina superior derecha", row: 0, column: 3, type: "corner", baseAccuracy: 0.62, reflexMultiplier: 0.28, shotBonus: 3 }),
  Object.freeze({ id: "lower-left", label: "Esquina inferior izquierda", row: 1, column: 0, type: "corner", baseAccuracy: 0.62, reflexMultiplier: 0.28, shotBonus: 3 }),
  Object.freeze({ id: "lower-center-left", label: "Centro inferior izquierdo", row: 1, column: 1, type: "center", baseAccuracy: 0.94, reflexMultiplier: 1, shotBonus: 0 }),
  Object.freeze({ id: "lower-center-right", label: "Centro inferior derecho", row: 1, column: 2, type: "center", baseAccuracy: 0.94, reflexMultiplier: 1, shotBonus: 0 }),
  Object.freeze({ id: "lower-right", label: "Esquina inferior derecha", row: 1, column: 3, type: "corner", baseAccuracy: 0.62, reflexMultiplier: 0.28, shotBonus: 3 }),
]);

const MIN_ATTRIBUTE = 0;
const MAX_ATTRIBUTE = 100;
const ACCURACY_PER_SHOOTING_POINT = 0.003;
const GOAL_CHANCE_SPREAD = 12;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function readAttribute(player, key, roleName) {
  const value = Number(player?.[key] ?? player?.attributes?.[key]);
  if (!Number.isFinite(value)) {
    throw new TypeError(`${roleName} debe incluir el atributo numérico "${key}".`);
  }
  return clamp(value, MIN_ATTRIBUTE, MAX_ATTRIBUTE);
}

function readRoll(random) {
  const value = Number(random());
  if (!Number.isFinite(value)) throw new TypeError("La función aleatoria debe devolver un número finito.");
  return clamp(value, 0, 1 - Number.EPSILON);
}

function getZone(zoneId) {
  const zone = GOAL_ZONES.find((candidate) => candidate.id === zoneId);
  if (!zone) throw new RangeError(`Zona de tiro desconocida: ${zoneId}`);
  return zone;
}

function logistic(value) {
  return 1 / (1 + Math.exp(-value));
}

/** Calcula las probabilidades de una zona sin consumir azar. */
export function getShotProbabilities({ attacker, goalkeeper, zoneId }) {
  const zone = getZone(zoneId);
  const shooting = readAttribute(attacker, "shooting", "El atacante");
  const reflexes = readAttribute(goalkeeper, "reflexes", "El portero");

  const accuracyChance = clamp(
    zone.baseAccuracy + (shooting - 70) * ACCURACY_PER_SHOOTING_POINT,
    0.25,
    0.995,
  );
  const effectiveReflexes = reflexes * zone.reflexMultiplier;
  const adjustedShot = shooting + zone.shotBonus;
  const goalChanceIfOnTarget = logistic((adjustedShot - effectiveReflexes) / GOAL_CHANCE_SPREAD);

  return {
    zoneId: zone.id,
    zoneType: zone.type,
    accuracyChance,
    goalChanceIfOnTarget,
    expectedGoalChance: accuracyChance * goalChanceIfOnTarget,
    effectiveReflexes,
  };
}

/** Resuelve un tiro apuntado por el usuario a una de las ocho zonas. */
export function resolveShot({ attacker, goalkeeper, zoneId, random = Math.random }) {
  const probabilities = getShotProbabilities({ attacker, goalkeeper, zoneId });
  const accuracyRoll = readRoll(random);
  const onTarget = accuracyRoll < probabilities.accuracyChance;

  if (!onTarget) {
    return {
      outcome: "miss",
      control: "user",
      ...probabilities,
      onTarget: false,
      accuracyRoll,
      saveRoll: null,
    };
  }

  const saveRoll = readRoll(random);
  const scored = saveRoll < probabilities.goalChanceIfOnTarget;
  return {
    outcome: scored ? "goal" : "saved",
    control: "user",
    ...probabilities,
    onTarget: true,
    accuracyRoll,
    saveRoll,
  };
}

/** La IA pondera las ocho zonas por su probabilidad esperada de gol. */
export function chooseAutomaticZone({ attacker, goalkeeper, random = Math.random }) {
  const options = GOAL_ZONES.map((zone) => ({
    zone,
    weight: getShotProbabilities({ attacker, goalkeeper, zoneId: zone.id }).expectedGoalChance ** 2,
  }));
  const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
  let choice = readRoll(random) * totalWeight;

  for (const option of options) {
    choice -= option.weight;
    if (choice < 0) return option.zone.id;
  }
  return options.at(-1).zone.id;
}

/** Resuelve automáticamente un tiro cuando se agota el tiempo. */
export function resolveAutomaticShot({ attacker, goalkeeper, random = Math.random }) {
  const zoneId = chooseAutomaticZone({ attacker, goalkeeper, random });
  return {
    ...resolveShot({ attacker, goalkeeper, zoneId, random }),
    control: "ai",
  };
}

/**
 * Abre la ventana interactiva de cinco segundos.
 * `chooseZone(id)` resuelve la elección del usuario; al vencer el plazo,
 * la IA elige zona y resuelve usando Tiro y Reflejos.
 */
export function createGoalOpportunity({
  attacker,
  goalkeeper,
  onResolved = () => {},
  random = Math.random,
  timeoutMs = SHOT_INPUT_WINDOW_MS,
}) {
  let finished = false;
  let timerId;
  const startedAt = Date.now();
  const duration = Math.max(0, Number(timeoutMs) || 0);

  function finish(result) {
    if (finished) return null;
    finished = true;
    clearTimeout(timerId);
    onResolved(result);
    return result;
  }

  timerId = setTimeout(() => {
    finish(resolveAutomaticShot({ attacker, goalkeeper, random }));
  }, duration);

  return {
    durationMs: duration,
    getRemainingMs() {
      return finished ? 0 : Math.max(0, duration - (Date.now() - startedAt));
    },
    chooseZone(zoneId) {
      if (finished) return null;
      return finish(resolveShot({ attacker, goalkeeper, zoneId, random }));
    },
    cancel() {
      if (finished) return false;
      finished = true;
      clearTimeout(timerId);
      return true;
    },
    isFinished() {
      return finished;
    },
  };
}
