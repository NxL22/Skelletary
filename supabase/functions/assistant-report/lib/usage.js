// lib/usage.js
// =====================================================================
// Rate limit del modulo Asistente: 300 envios por ventana movil de 12h.
// La ventana se resetea automaticamente cuando han pasado 12h desde el
// primer envio de la ventana actual.

const WINDOW_MS = 12 * 60 * 60 * 1000;
const LIMIT = 300;

function isWindowExpired(windowStart) {
  if (!windowStart) {
    return true;
  }
  const startedAt = new Date(windowStart).getTime();
  if (Number.isNaN(startedAt)) {
    return true;
  }
  return Date.now() - startedAt >= WINDOW_MS;
}

function nextWindowEnd(windowStart) {
  const startedAt = new Date(windowStart).getTime();
  return new Date(startedAt + WINDOW_MS).toISOString();
}

// Hace un UPSERT atomico en assistant_usage. Si la ventana esta vencida,
// reinicia count y window_start. Si no, suma 1.
// Devuelve { allowed, count, windowStart, windowEnd, remaining }.
export async function checkAndIncrementUsage(adminClient, userId) {
  // Leemos la fila actual (puede no existir).
  const { data: existing, error: readError } = await adminClient
    .from("assistant_usage")
    .select("window_start, count")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    throw new Error(`No pudimos leer tu contador: ${readError.message}`);
  }

  const nowIso = new Date().toISOString();
  const windowExpired = !existing || isWindowExpired(existing.window_start);
  const currentCount = windowExpired ? 0 : existing.count;

  if (currentCount >= LIMIT) {
    return {
      allowed: false,
      count: currentCount,
      windowStart: existing.window_start,
      windowEnd: nextWindowEnd(existing.window_start),
      remaining: 0,
    };
  }

  const nextCount = currentCount + 1;
  const nextWindowStart = windowExpired ? nowIso : existing.window_start;

  // UPSERT con la fila nueva.
  const { error: upsertError } = await adminClient
    .from("assistant_usage")
    .upsert(
      {
        user_id: userId,
        window_start: nextWindowStart,
        count: nextCount,
        updated_at: nowIso,
      },
      { onConflict: "user_id" },
    );

  if (upsertError) {
    throw new Error(`No pudimos registrar el envio: ${upsertError.message}`);
  }

  return {
    allowed: true,
    count: nextCount,
    windowStart: nextWindowStart,
    windowEnd: nextWindowEnd(nextWindowStart),
    remaining: Math.max(0, LIMIT - nextCount),
  };
}

export function getRemainingUsage(usage) {
  if (!usage || typeof usage.count !== "number") {
    return LIMIT;
  }
  return Math.max(0, LIMIT - usage.count);
}

// Para uso en tests / admin.
export const USAGE_LIMIT = LIMIT;
export const USAGE_WINDOW_MS = WINDOW_MS;