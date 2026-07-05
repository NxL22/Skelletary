// Edge Function: assistant-feedback
// =====================================================================
// Recibe el feedback del usuario sobre un informe del Asistente y lo
// persiste en el bucket privado `assistant-feedback` como un archivo
// markdown por usuaria (feedback/{user_id}.md).
//
// Validaciones (en este orden, falla rapido):
//   1. Sesion Supabase valida (Authorization Bearer).
//   2. La cuenta tiene acceso comercial vigente (active o trial no vencido).
//   3. La cuenta tiene `has_assistant_access = true`.
//   4. Body con los 3 campos requeridos + longitudes maximas.
//
// Si todo pasa, hashea el input y llama a appendFeedback() con dedup y
// retencion de 50 ultimas entradas. NO incrementa el rate limit del Asistente.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.1";
import { appendFeedback, sha256Hex } from "./lib/feedback.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_FIELD_LENGTH = 2000;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getEnv(name, fallback) {
  const value = Deno.env.get(name);
  if (value === undefined || value === "") {
    if (fallback === undefined) {
      throw new Error(`Variable de entorno requerida: ${name}`);
    }
    return fallback;
  }
  return value;
}

async function resolveUserContext(request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { error: "Falta el token de sesion.", status: 401 };
  }
  const accessToken = authHeader.replace("Bearer ", "").trim();

  const supabaseUrl = getEnv("SUPABASE_URL");
  const anonKey = getEnv("SUPABASE_ANON_KEY");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user?.id) {
    return {
      error: "Tu sesion no es valida. Inicia sesion de nuevo.",
      status: 401,
    };
  }
  const userId = userData.user.id;

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select(
      "id, access_status, trial_ends_at, subscription_ends_at, has_assistant_access",
    )
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return {
      error: "No pudimos leer tu perfil.",
      status: 500,
      detail: profileError.message,
    };
  }

  if (!profile) {
    return {
      error: "Tu cuenta aun no tiene perfil en Skelletary.",
      status: 403,
    };
  }

  if (!profile.has_assistant_access) {
    return {
      error: "Tu cuenta no tiene habilitado el asistente. Pidele al owner que active el flag --ai-access.",
      status: 403,
    };
  }

  const access = profile.access_status;
  const now = Date.now();
  const trialEndsAt = profile.trial_ends_at
    ? new Date(profile.trial_ends_at).getTime()
    : null;
  const subscriptionEndsAt = profile.subscription_ends_at
    ? new Date(profile.subscription_ends_at).getTime()
    : null;

  let hasCommercialAccess = false;
  if (access === "active") {
    hasCommercialAccess =
      subscriptionEndsAt === null || subscriptionEndsAt > now;
  } else if (access === "trial") {
    hasCommercialAccess = trialEndsAt === null || trialEndsAt > now;
  }

  if (!hasCommercialAccess) {
    return {
      error: "Tu acceso a Skelletary no esta vigente.",
      status: 403,
    };
  }

  return { userId, adminClient };
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Metodo no permitido." }, 405);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Cuerpo JSON invalido." }, 400);
  }

  const originalInput = String(payload?.originalInput ?? "").trim();
  const skellyOutput = String(payload?.skellyOutput ?? "").trim();
  const humanOutput = String(payload?.humanOutput ?? "").trim();
  const templateCode = payload?.templateCode
    ? String(payload.templateCode).trim()
    : null;

  if (!originalInput || !skellyOutput || !humanOutput) {
    return jsonResponse(
      {
        error:
          "Faltan campos obligatorios: originalInput, skellyOutput y humanOutput.",
      },
      400,
    );
  }

  if (
    originalInput.length > MAX_FIELD_LENGTH ||
    skellyOutput.length > MAX_FIELD_LENGTH ||
    humanOutput.length > MAX_FIELD_LENGTH
  ) {
    return jsonResponse(
      {
        error: `Cada campo debe tener maximo ${MAX_FIELD_LENGTH} caracteres.`,
      },
      400,
    );
  }

  // 1) Sesion + flags.
  const ctx = await resolveUserContext(request);
  if (ctx.error) {
    return jsonResponse({ error: ctx.error }, ctx.status);
  }
  const { userId, adminClient } = ctx;

  // 2) Append feedback con dedup y retencion de 50 entradas.
  try {
    const inputHash = await sha256Hex(originalInput);
    const result = await appendFeedback(adminClient, userId, {
      templateCode,
      inputHash,
      userInput: originalInput,
      humanOutput,
    });

    return jsonResponse({
      ok: true,
      appended: result.appended,
      reason: result.reason ?? null,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: "No pudimos guardar el feedback.",
        detail: error?.message ?? String(error),
      },
      500,
    );
  }
});