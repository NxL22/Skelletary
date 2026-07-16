// Edge Function: assistant-feedback
// =====================================================================
// Recibe el feedback sobre un informe y lo persiste como aprendizaje personal.
// La copia Markdown se mantiene solo como respaldo historico del flujo anterior.
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
import { appendFeedback } from "./lib/feedback.js";
import {
  correctionSummary,
  createEmbedding,
  extractVariables,
  generalizeText,
  hasValidReportStructure,
  sanitizeClinicalText,
  sha256Hex,
} from "./lib/learning.js";

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
  const promptVersion = payload?.promptVersion
    ? String(payload.promptVersion).slice(0, 80)
    : "clinical-fast-v1";
  const requestModel = payload?.model
    ? String(payload.model).slice(0, 80)
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

  // 2) Guardar el triplete completo. Una correccion posterior del mismo input
  // crea una version nueva: nunca se pierde el criterio humano mas reciente.
  try {
    const sanitizedInput = sanitizeClinicalText(originalInput);
    const sanitizedSkelly = sanitizeClinicalText(skellyOutput);
    const sanitizedApproved = sanitizeClinicalText(humanOutput);
    const privacyReasons = [
      ...sanitizedInput.reasons,
      ...sanitizedSkelly.reasons,
      ...sanitizedApproved.reasons,
    ];
    if (privacyReasons.length > 0) {
      return jsonResponse({
        error: "No guardamos este aprendizaje porque detectamos posibles datos identificables.",
        code: "PRIVACY_BLOCKED",
        detail: `Revisa: ${[...new Set(privacyReasons)].join(", ")}.`,
      }, 422);
    }

    if (!hasValidReportStructure(sanitizedApproved.text)) {
      return jsonResponse({
        error: "La version final debe conservar ANTECEDENTES CLINICOS, HALLAZGOS e IMPRESION.",
        code: "BAD_INPUT",
      }, 400);
    }

    const inputHash = await sha256Hex(sanitizedInput.text.toLowerCase());
    const { data: latest } = await adminClient
      .from("assistant_feedback_triplets")
      .select("version")
      .eq("user_id", userId)
      .eq("input_hash", inputHash)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const version = (latest?.version ?? 0) + 1;
    const variables = extractVariables(
      sanitizedInput.text,
      sanitizedSkelly.text,
      sanitizedApproved.text,
    );
    const summary = correctionSummary(sanitizedSkelly.text, sanitizedApproved.text);
    const generalizedInput = generalizeText(sanitizedInput.text, variables);
    const generalizedOutput = generalizeText(sanitizedApproved.text, variables);
    const signature = await sha256Hex(`${templateCode ?? ""}\n${generalizedInput.toLowerCase()}`);
    const model = requestModel || getEnv("MINIMAX_MODEL", "MiniMax-M3");

    const { data: feedback, error: feedbackError } = await adminClient
      .from("assistant_feedback_triplets")
      .insert({
        user_id: userId,
        input_hash: inputHash,
        version,
        feedback_kind: summary.accepted ? "accepted" : "corrected",
        template_code: templateCode,
        sanitized_input: sanitizedInput.text,
        sanitized_skelly_output: sanitizedSkelly.text,
        sanitized_approved_output: sanitizedApproved.text,
        variables,
        correction_summary: summary,
        model,
        prompt_version: promptVersion,
        validation_status: "active",
      })
      .select("id")
      .single();
    if (feedbackError) throw feedbackError;

    const embedding = await createEmbedding(generalizedInput);
    const { data: existingMemory } = await adminClient
      .from("assistant_memories")
      .select("id, generalized_output, confidence, support_count, correction_count, contradiction_count")
      .eq("user_id", userId)
      .eq("scope", "personal")
      .eq("signature", signature)
      .maybeSingle();

    let memory;
    if (existingMemory) {
      const contradicts = existingMemory.generalized_output.trim() !== generalizedOutput.trim();
      const supportCount = existingMemory.support_count + (contradicts ? 0 : 1);
      const contradictionCount = existingMemory.contradiction_count + (contradicts ? 1 : 0);
      // Una contradiccion no debe influir silenciosamente en futuros informes.
      // Queda visible en Skelly Lab para que el owner pueda revisarla.
      const status = contradicts ? "quarantined" : "active";
      const confidence = Math.max(0.1, Math.min(0.95,
        Number(existingMemory.confidence) + (contradicts ? -0.15 : 0.12)));
      const snapshot = { ...existingMemory, status, confidence };
      await adminClient.from("assistant_memory_versions").insert({
        memory_id: existingMemory.id,
        feedback_id: feedback.id,
        version: supportCount + contradictionCount,
        snapshot,
      });
      const { data, error } = await adminClient.from("assistant_memories").update({
        generalized_output: contradicts ? existingMemory.generalized_output : generalizedOutput,
        confidence,
        support_count: supportCount,
        correction_count: existingMemory.correction_count + (summary.accepted ? 0 : 1),
        contradiction_count: contradictionCount,
        status,
        embedding: embedding ?? undefined,
        updated_at: new Date().toISOString(),
      }).eq("id", existingMemory.id).select().single();
      if (error) throw error;
      memory = data;
    } else {
      const { data, error } = await adminClient.from("assistant_memories").insert({
        user_id: userId,
        scope: "personal",
        signature,
        template_code: templateCode,
        generalized_input: generalizedInput,
        generalized_output: generalizedOutput,
        embedding,
        confidence: summary.accepted ? 0.40 : 0.30,
        correction_count: summary.accepted ? 0 : 1,
        status: embedding ? "active" : "quarantined",
        source_feedback_id: feedback.id,
        metadata: { variables: variables.map((item) => item.name) },
      }).select().single();
      if (error) throw error;
      memory = data;
    }

    // Backup legible: no participa de la recuperacion ni bloquea nuevas versiones.
    await appendFeedback(adminClient, userId, {
      templateCode,
      inputHash: `${inputHash}-v${version}`,
      userInput: sanitizedInput.text,
      humanOutput: sanitizedApproved.text,
    }).catch((error) => console.warn("No se pudo actualizar backup Markdown:", error?.message ?? error));

    return jsonResponse({
      ok: true,
      appended: true,
      feedbackId: feedback.id,
      learningStatus: memory.status,
      activated: memory.status === "active" && Boolean(memory.embedding),
      confidence: Number(memory.confidence),
      supportCount: memory.support_count,
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
