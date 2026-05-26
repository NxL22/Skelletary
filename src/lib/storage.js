export const DEFAULT_PIN = "1991";
export const EDIT_UNLOCK_MINUTES = 30;

const TEMPLATE_CACHE_KEY = "skelletary.templates";
const PIN_KEY = "skelletary.pin";
const EDIT_UNLOCK_KEY = "skelletary.editUnlockedUntil";
const SESSION_CACHE_KEY = "skelletary.cachedSession";

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
