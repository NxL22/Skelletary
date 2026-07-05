// src/lib/profile.js
// =====================================================================
// Helpers para gestionar el perfil del usuario en Supabase.
// Hoy expone solo `updateDisplayName`. Mas adelante se pueden sumar mas
// actualizaciones (foto, preferencias locales sincronizadas, etc).

import { getSupabaseClient } from "./supabaseClient";

/**
 * Actualiza el campo `display_name` del perfil del usuario autenticado.
 *
 * Validaciones:
 *   - El nombre se trimea antes de mandar.
 *   - El servidor valida que tenga entre 2 y 60 caracteres (trigger SQL).
 *   - Si el input queda vacio, devuelve el nombre al fallback del email.
 *
 * @param {string} newName - El nuevo nombre que quiere usar el usuario.
 * @returns {Promise<object>} El perfil actualizado.
 */
export async function updateDisplayName(newName) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase no esta configurado en este cliente.");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) {
    throw new Error("No hay sesion valida.");
  }

  const cleaned = String(newName ?? "").trim();

  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: cleaned })
    .eq("id", userData.user.id)
    .select()
    .single();

  if (error) {
    // Re-empaquetamos el error del trigger para que la UI pueda mostrarlo
    // en espanol sin filtrar codigos SQL crudos al usuario final.
    if (/display_name/i.test(error.message) && /2 y 60|entre 2/i.test(error.message)) {
      throw new Error("El nombre debe tener entre 2 y 60 caracteres.");
    }
    throw new Error(error.message || "No pudimos guardar el nombre.");
  }

  return data;
}