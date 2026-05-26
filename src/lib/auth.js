import { getSupabaseClient } from "./supabaseClient";

export const AUTH_REDIRECT_MODE = {
  default: "default",
  invite: "invite",
  recovery: "recovery",
};

const configuredAppUrl = normalizeConfiguredAppUrl(import.meta.env.VITE_APP_URL);

function normalizeConfiguredAppUrl(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  try {
    const url = new URL(rawValue);
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function getRuntimeAppUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  const url = new URL(window.location.href);
  url.hash = "";
  return url.toString();
}

function buildAuthRedirectUrl(mode) {
  const baseUrl = configuredAppUrl || getRuntimeAppUrl();

  if (!baseUrl) {
    return "";
  }

  const url = new URL(baseUrl);
  // En recuperacion e invitacion usamos una URL publica canonica cuando existe
  // para no depender del host actual, que podria ser un preview temporal o localhost.
  url.searchParams.set("auth_mode", mode);
  url.hash = "";
  return url.toString();
}

export function readAuthRedirectModeFromUrl() {
  if (typeof window === "undefined") {
    return AUTH_REDIRECT_MODE.default;
  }

  const mode = new URL(window.location.href).searchParams.get("auth_mode");

  if (mode === AUTH_REDIRECT_MODE.invite || mode === AUTH_REDIRECT_MODE.recovery) {
    return mode;
  }

  return AUTH_REDIRECT_MODE.default;
}

export function clearAuthRedirectModeFromUrl() {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete("auth_mode");
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

export async function getCurrentSession() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signInWithPassword(email, password) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase no esta configurado todavia.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
}

export async function sendPasswordResetEmail(email) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase no esta configurado todavia.");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildAuthRedirectUrl(AUTH_REDIRECT_MODE.recovery),
  });

  if (error) {
    throw error;
  }
}

export async function updateUserPassword(password) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase no esta configurado todavia.");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw error;
  }
}

export async function ensureUserProfile(user) {
  const supabase = getSupabaseClient();

  if (!supabase || !user?.id) {
    return;
  }

  const { data: existingProfile, error: readError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (existingProfile) {
    return;
  }

  // El trigger de Auth deberia crear esta fila al alta. Solo intentamos
  // repararla en clientes viejos donde la cuenta quedo sin perfil publico.
  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    email: user.email || "",
    access_status: "pending",
  });

  if (!error) {
    return;
  }

  const { data: repairedProfile, error: repairedReadError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (repairedReadError) {
    throw repairedReadError;
  }

  if (!repairedProfile) {
    throw error;
  }
}

export async function signOut() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export function subscribeToAuthChanges(callback) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return () => {};
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(_event, session);
  });

  return () => subscription.unsubscribe();
}
