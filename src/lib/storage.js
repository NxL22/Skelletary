export const DEFAULT_PIN = "1991";
export const EDIT_UNLOCK_MINUTES = 30;

const TEMPLATES_KEY = "skelletary.templates";
const PIN_KEY = "skelletary.pin";
const EDIT_UNLOCK_KEY = "skelletary.editUnlockedUntil";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function loadTemplates() {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(TEMPLATES_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveTemplates(templates) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export function resetTemplates(defaultTemplates) {
  saveTemplates(defaultTemplates);
  return defaultTemplates;
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
