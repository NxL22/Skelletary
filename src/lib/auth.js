import { getSupabaseClient } from "./supabaseClient";

export const AUTH_REDIRECT_MODE = {
  default: "default",
  invite: "invite",
  recovery: "recovery",
};

function buildAuthRedirectUrl(mode) {
  if (typeof window === "undefined") {
    return "";
  }

  const url = new URL(window.location.href);
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

  // Si la cuenta existe en Auth pero aun no tiene perfil publico,
  // la creamos sin tocar estados ya activados manualmente.
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email || "",
      access_status: "pending",
    },
    {
      onConflict: "id",
      ignoreDuplicates: true,
    },
  );

  if (error) {
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
