// storage.js
// ============================================================
// Wrapper de localStorage. Skelletary usa la nube (Supabase) como fuente
// principal de verdad; localStorage solo guarda cache + preferencias.
//
// Hay tres familias de datos en localStorage:
//   1. Cache de biblioteca y sesion: se limpian al cerrar sesion.
//   2. Estado de UI (PIN, edicion desbloqueada): se limpia al cerrar sesion.
//   3. Preferencias persistentes por usuario (ej. silenciar a Skelly):
//      se conservan al cerrar sesion porque son decisiones de UX.
//
// `clearAppStorage()` borra las primeras dos familias y deja la tercera.

export const DEFAULT_PIN = "1991";
export const EDIT_UNLOCK_MINUTES = 30;

const TEMPLATE_CACHE_KEY = "skelletary.templates";
const PIN_KEY = "skelletary.pin";
const EDIT_UNLOCK_KEY = "skelletary.editUnlockedUntil";
const SESSION_CACHE_KEY = "skelletary.cachedSession";
const STORAGE_PREFIX = "skelletary.";
const PREFERENCE_PREFIX = "skelletary.preference.";
const ECO_CARDS_CACHE_PREFIX = "skelletary.botonesEco.cards.";
const ECO_MIGRATION_PREFIX = "skelletary.botonesEco.migration.";
const LEGACY_ECO_CARDS_KEY = "botones-eco-tarjetas";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function loadJson(key) {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveJson(key, value) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadTemplates() {
  const cachedTemplates = loadJson(TEMPLATE_CACHE_KEY);
  return Array.isArray(cachedTemplates) ? cachedTemplates : null;
}

export function saveTemplates(templates) {
  saveJson(TEMPLATE_CACHE_KEY, templates);
}

// Botones Eco tiene un cache separado de la biblioteca radiologica. Asi una
// tarjeta de acceso rapido nunca termina mezclada con una plantilla de informe
// ni se conserva accidentalmente en el espacio de otra cuenta.
export function loadEcoCardsCache(userId) {
  if (!userId) {
    return null;
  }

  const cachedCards = loadJson(`${ECO_CARDS_CACHE_PREFIX}${userId}`);
  return Array.isArray(cachedCards) ? cachedCards : null;
}

export function saveEcoCardsCache(userId, cards) {
  if (!userId || !Array.isArray(cards)) {
    return;
  }

  saveJson(`${ECO_CARDS_CACHE_PREFIX}${userId}`, cards);
}

export function loadLegacyEcoCards() {
  const legacyCards = loadJson(LEGACY_ECO_CARDS_KEY);
  return Array.isArray(legacyCards) ? legacyCards : null;
}

export function clearLegacyEcoCards() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(LEGACY_ECO_CARDS_KEY);
}

export function hasCompletedEcoMigration(userId) {
  if (!canUseStorage() || !userId) {
    return false;
  }

  return window.localStorage.getItem(`${ECO_MIGRATION_PREFIX}${userId}`) === "done";
}

export function markEcoMigrationCompleted(userId) {
  if (!canUseStorage() || !userId) {
    return;
  }

  window.localStorage.setItem(`${ECO_MIGRATION_PREFIX}${userId}`, "done");
}

export function resetTemplates(defaultTemplates) {
  saveTemplates(defaultTemplates);
  return defaultTemplates;
}

export function loadCachedSession() {
  return loadJson(SESSION_CACHE_KEY);
}

export function saveCachedSession(session) {
  if (!session) {
    clearCachedSession();
    return;
  }

  saveJson(SESSION_CACHE_KEY, {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    user: session.user
      ? {
          id: session.user.id,
          email: session.user.email,
        }
      : null,
  });
}

export function clearCachedSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(SESSION_CACHE_KEY);
}

export function loadPin() {
  if (!canUseStorage()) {
    return DEFAULT_PIN;
  }

  return window.localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
}

export function savePin(pin) {
  if (!canUseStorage()) {
    return pin;
  }

  window.localStorage.setItem(PIN_KEY, pin);
  return pin;
}

export function getEditUnlockExpiresAt() {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(EDIT_UNLOCK_KEY);
}

export function isEditUnlocked() {
  const expiresAt = getEditUnlockExpiresAt();

  if (!expiresAt) {
    return false;
  }

  const isValid = new Date(expiresAt).getTime() > Date.now();

  if (!isValid) {
    lockEdit();
  }

  return isValid;
}

export function unlockEdit() {
  if (!canUseStorage()) {
    return null;
  }

  const expiresAt = new Date(
    Date.now() + EDIT_UNLOCK_MINUTES * 60 * 1000,
  ).toISOString();
  window.localStorage.setItem(EDIT_UNLOCK_KEY, expiresAt);
  return expiresAt;
}

export function lockEdit() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(EDIT_UNLOCK_KEY);
}

export function getMigrationKey(userId) {
  return `skelletary.localMigration.${userId}`;
}

export function hasCompletedLocalMigration(userId) {
  if (!canUseStorage() || !userId) {
    return false;
  }

  return window.localStorage.getItem(getMigrationKey(userId)) === "done";
}

export function markLocalMigrationCompleted(userId) {
  if (!canUseStorage() || !userId) {
    return;
  }

  window.localStorage.setItem(getMigrationKey(userId), "done");
}

function getSkellyGreetingMutedKey(userId) {
  return `${PREFERENCE_PREFIX}skellyGreetingMuted.${userId}`;
}

export function loadSkellyGreetingMuted(userId) {
  if (!canUseStorage() || !userId) {
    return false;
  }

  return window.localStorage.getItem(getSkellyGreetingMutedKey(userId)) === "true";
}

export function saveSkellyGreetingMuted(userId, muted) {
  if (!canUseStorage() || !userId) {
    return muted;
  }

  window.localStorage.setItem(getSkellyGreetingMutedKey(userId), String(Boolean(muted)));
  return muted;
}

export function clearAppStorage() {
  if (!canUseStorage()) {
    return;
  }

  const keysToRemove = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    // Conservamos preferencias explicitas del usuario, como silenciar a Skelly,
    // porque no son cache de sesion sino decisiones de UX que deben persistir.
    if (key?.startsWith(STORAGE_PREFIX) && !key.startsWith(PREFERENCE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    window.localStorage.removeItem(key);
  });
}
