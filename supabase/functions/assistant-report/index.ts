// Edge Function: assistant-report
// =====================================================================
// Skelletary - modulo Asistente de informes (Skelly).
// Recibe un input en lenguaje natural de la radiologa, lo pasa por un
// LLM (configurable, default MiniMax-compat) con la knowledge base
// cargada desde Storage, y devuelve el informe en texto plano.
//
// Validaciones (en este orden, falla rapido):
//   1. Sesion Supabase valida (Authorization Bearer).
//   2. La cuenta tiene acceso comercial vigente (active o trial no vencido).
//   3. La cuenta tiene `has_assistant_access = true`.
//   4. Rate limit OK (300 envios / ventana movil de 12h).
//
// Si todo pasa, llama al LLM con el system prompt armado por lib/prompt.js
// y sanitiza la respuesta antes de devolverla.
//
// Variables de entorno requeridas (configurar en Supabase Edge Function secrets):
//   - MINIMAX_API_KEY         API key del proveedor LLM
//   - MINIMAX_BASE_URL        Base URL (default: https://api.minimax.io/v1)
//   - MINIMAX_MODEL           Modelo a usar (default: MiniMax-M3)
//   - SUPABASE_URL            La URL de tu proyecto Supabase
//   - SUPABASE_ANON_KEY       Anon key (para construir el cliente por request)
//   - SUPABASE_SERVICE_ROLE_KEY  Service role (para escribir en assistant_usage)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.1";
import { buildPrompt } from "./lib/prompt.js";
import { loadKnowledge, pickCandidateTemplates } from "./lib/knowledge.js";
import { checkAndIncrementUsage, getRemainingUsage } from "./lib/usage.js";
import { sanitizeReport } from "./lib/sanitize.js";
import { callLlm } from "./lib/llm.js";
import {
  buildExamplesBlock,
  loadRecentFeedback,
} from "./lib/feedback.js";
import { buildMemoryBlock, retrieveMemories } from "./lib/memory.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

  // Cliente anon para resolver al usuario a partir del access token.
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

  // Cliente con service role para leer/escribir cosas del modulo (profiles, usage).
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
  const requestStartedAt = Date.now();
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

  const userInput = String(payload?.input ?? "").trim();
  const templateCode = payload?.templateCode
    ? String(payload.templateCode)
    : null;

  if (!userInput) {
    return jsonResponse(
      { error: "Escribe un mensaje para Skelletary." },
      400,
    );
  }

  if (userInput.length > 2000) {
    return jsonResponse(
      { error: "El mensaje es demasiado largo (maximo 2000 caracteres)." },
      400,
    );
  }

  // Defense in depth: validar que el input parece un informe radiologico antes
  // de gastar tokens en el LLM. Si el input es muy corto o no contiene ninguna
  // palabra clave de modalidad, lo rechazamos con BAD_INPUT.
  const MODALITY_KEYWORDS = [
    "eco", "ecografia", "ecograf",
    "rx", "rayos", "radiograf",
    "tac", "tomograf",
    "rm", "resonancia",
    "doppler",
    "mamograf", "mamografia",
    "scanner",
    "ultrasonid",
    "angio", "angiograf",
    "torax", "abdomen", "abdominal", "hombro", "rodilla", "pelvis",
    "cerebro", "craneo", "columna",
    "informe", "hallazgo", "antecedente",
  ];
  const normalizedInput = userInput.toLowerCase();
  const hasModalityKeyword = MODALITY_KEYWORDS.some((keyword) =>
    normalizedInput.includes(keyword)
  );
  // La usamos tambien despues, en el sanitizer, para diferenciar
  // el mensaje de fallback segun si el input parecia medico o no.
  const inputHadModality = userInput.length >= 10 && hasModalityKeyword;
  if (!inputHadModality) {
    return jsonResponse(
      {
        error: "Solo puedo ayudar a redactar informes radiologicos.",
        code: "BAD_INPUT",
        detail:
          "Contame el examen o los hallazgos (ej: eco abdomen, rx torax, tac cerebro).",
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

  // 2) Rate limit.
  const usage = await checkAndIncrementUsage(adminClient, userId);
  if (!usage.allowed) {
    return jsonResponse(
      {
        error: "Has alcanzado el limite de envios del asistente.",
        code: "RATE_LIMITED",
        remaining: usage.remaining,
        windowStart: usage.windowStart,
        windowEnd: usage.windowEnd,
      },
      429,
    );
  }

  // Knowledge, feedback y memoria son independientes. Cargarlos juntos reduce
  // el tiempo muerto antes de pedir el primer token al proveedor.
  let knowledge;
  let examplesBlock = "";
  let memoryBlock = "";
  try {
    const [loadedKnowledge, recentFeedback, memories] = await Promise.all([
      loadKnowledge(adminClient),
      loadRecentFeedback(adminClient, userId, { limit: 2 }).catch(() => []),
      retrieveMemories(adminClient, userId, userInput, templateCode, 4),
    ]);
    knowledge = loadedKnowledge;
    examplesBlock = buildExamplesBlock(recentFeedback);
    memoryBlock = buildMemoryBlock(memories);
  } catch (error) {
    return jsonResponse(
      {
        error:
          "No pudimos cargar la knowledge base del asistente. Revisa que el bucket assistant-knowledge exista y los archivos esten subidos.",
        detail: error?.message ?? String(error),
      },
      500,
    );
  }

  // 5) Armar prompt y llamar al LLM.
  //
  // RAG minimalista: si la usuaria selecciono plantilla del dropdown usamos
  // esa exacta como candidata principal. Si no, filtramos por keyword del
  // input y devolvemos las 1-5 plantillas mas relevantes. El diccionario
  // completo queda solo como fallback si no hay candidatas por keyword.
  const dropdownTemplate = templateCode
    ? knowledge.templatesByCode.get(templateCode)
    : null;
  const keywordCandidates = pickCandidateTemplates({
    userInput,
    templatesByCode: knowledge.templatesByCode,
    maxCandidates: 5,
  });
  // Si hay dropdown, va primera. Las keyword candidates vienen despues,
  // sin duplicar.
  const seenCodes = new Set();
  const candidateTemplates = [];
  if (dropdownTemplate) {
    candidateTemplates.push({ code: templateCode, content: dropdownTemplate });
    seenCodes.add(templateCode);
  }
  for (const candidate of keywordCandidates) {
    if (seenCodes.has(candidate.code)) continue;
    candidateTemplates.push(candidate);
    seenCodes.add(candidate.code);
  }

  const systemPrompt = buildPrompt({
    styleGuide: knowledge.guideStyle,
    candidateTemplates,
    dictionaryFallback: knowledge.dictionary,
    examplesBlock,
    memoryBlock,
  });
  const retrievalMs = Date.now() - requestStartedAt;

  // 6) Llamar al LLM. Si el cliente pidio stream (?stream=true o header Accept:
  //    text/event-stream), devolvemos los tokens conforme llegan. Si no,
  //    devolvemos el JSON completo como antes para compatibilidad.
  const wantsStream = shouldStream(request);

  if (wantsStream) {
    return await handleStreamedResponse({
      apiKey: getEnv("MINIMAX_API_KEY"),
      baseUrl: getEnv("MINIMAX_BASE_URL", "https://api.minimax.io/v1"),
      model: getEnv("MINIMAX_MODEL", "MiniMax-M3"),
      systemPrompt,
      userInput,
      templateCode,
      hadModality: inputHadModality,
      usage: {
        count: usage.count,
        windowStart: usage.windowStart,
        windowEnd: usage.windowEnd,
        remaining: getRemainingUsage(usage),
      },
      timings: { retrievalMs, requestStartedAt },
    });
  }

  let llmResult;
  try {
    llmResult = await callLlm({
      apiKey: getEnv("MINIMAX_API_KEY"),
      baseUrl: getEnv("MINIMAX_BASE_URL", "https://api.minimax.io/v1"),
      model: getEnv("MINIMAX_MODEL", "MiniMax-M3"),
      systemPrompt,
      userInput,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: "El asistente no pudo generar el informe en este momento.",
        detail: error?.message ?? String(error),
      },
      502,
    );
  }

  const sanitized = sanitizeReport(llmResult.text, {
    templateCode,
    hadModality: inputHadModality,
  });

  // Si el LLM devolvio una pregunta breve (paso 3 del algoritmo), la
  // propagamos al front con un campo dedicado. El front distingue esto
  // de un informe por la presencia de `question`.
  if (sanitized.question) {
    return jsonResponse({
      text: "",
      question: sanitized.question,
      usage: {
        count: usage.count,
        windowStart: usage.windowStart,
        windowEnd: usage.windowEnd,
        remaining: getRemainingUsage(usage),
      },
    });
  }

  return jsonResponse({
    text: sanitized.text,
    isFallback: Boolean(sanitized.isFallback),
    usage: {
      count: usage.count,
      windowStart: usage.windowStart,
      windowEnd: usage.windowEnd,
      remaining: getRemainingUsage(usage),
    },
    timings: {
      retrievalMs,
      totalMs: Date.now() - requestStartedAt,
    },
  });
});

// =====================================================================
// Helpers para el modo streaming SSE.
// =====================================================================

/**
 * Detecta si el cliente quiere stream. Aceptamos `?stream=1` o el header
 * Accept: text/event-stream.
 */
function shouldStream(request) {
  const url = new URL(request.url);
  if (url.searchParams.get("stream") === "1") {
    return true;
  }
  const accept = request.headers.get("Accept") || "";
  return accept.includes("text/event-stream");
}

/**
 * Procesa el stream del LLM y lo expone como SSE al cliente.
 * Cada chunk del LLM se serializa como `data: <json>\n\n`. Al final emite
 * `data: [DONE]\n\n` para que el cliente sepa que termino.
 */
async function handleStreamedResponse({
  apiKey,
  baseUrl,
  model,
  systemPrompt,
  userInput,
  templateCode,
  usage,
  hadModality = false,
  timings = {},
}) {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  let llmResponse;
  try {
    llmResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 1000,
        stream: true,
        reasoning: { effort: "none" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput },
        ],
      }),
    });
  } catch (error) {
    return jsonResponse(
      {
        error: "El asistente no pudo generar el informe en este momento.",
        detail: error?.message ?? String(error),
      },
      502,
    );
  }

  if (!llmResponse.ok || !llmResponse.body) {
    const detail = await llmResponse.text().catch(() => "");
    return jsonResponse(
      {
        error: `El proveedor de IA respondio con estado ${llmResponse.status}.`,
        detail: detail.slice(0, 400),
      },
      502,
    );
  }

  // Vamos acumulando el texto crudo para sanitizarlo al final antes de cerrar.
  let accumulatedText = "";
  const reader = llmResponse.body.getReader();
  const decoder = new TextDecoder();

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      function emit(payload) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      }

      try {
        emit({ type: "start", usage, timings: { retrievalMs: timings.retrievalMs ?? null } });

        let upstreamBuffer = "";
        let lastPreview = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          upstreamBuffer += decoder.decode(value, { stream: true });
          // El stream del LLM viene como "data: {...}\n\n".
          // Parseamos cada linea `data:` y extraemos content.
          const lines = upstreamBuffer.split("\n");
          upstreamBuffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) {
              continue;
            }
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") {
              continue;
            }
            try {
              const parsed = JSON.parse(payload);
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (delta) {
                if (!timings.firstTokenAt) timings.firstTokenAt = Date.now();
                accumulatedText += delta;
                // Solo mostramos previews que ya tienen estructura de informe.
                // El valor es el texto completo para que el cliente lo reemplace,
                // evitando concatenar fragmentos que luego cambie el sanitizer.
                if (accumulatedText.includes("HALLAZGOS:") && accumulatedText.includes("\n")) {
                  const preview = accumulatedText.replace(/```/g, "").trim();
                  if (preview.length > lastPreview.length + 24) {
                    lastPreview = preview;
                    emit({ type: "preview", text: preview });
                  }
                }
              }
            } catch {
              // Ignorar lineas que no parsean (keepalive, etc).
            }
          }
        }

        // Sanitizamos el texto acumulado antes de cerrar el stream.
        const sanitized = sanitizeReport(accumulatedText, {
          templateCode,
          hadModality,
        });
        // Si el LLM devolvio una pregunta breve (paso 3 del algoritmo),
        // la propagamos al front como `question` en el evento `done`.
        // El front distingue esto de un informe por la presencia de `question`.
        const donePayload = sanitized.question
          ? {
              type: "done",
              text: "",
              question: sanitized.question,
              warnings: [],
              isFallback: false,
              timings: {
                retrievalMs: timings.retrievalMs ?? null,
                firstTokenMs: timings.firstTokenAt ? timings.firstTokenAt - timings.requestStartedAt : null,
                totalMs: Date.now() - timings.requestStartedAt,
              },
            }
          : {
              type: "done",
              text: sanitized.text,
              warnings: sanitized.warnings,
              isFallback: Boolean(sanitized.isFallback),
              timings: {
                retrievalMs: timings.retrievalMs ?? null,
                firstTokenMs: timings.firstTokenAt ? timings.firstTokenAt - timings.requestStartedAt : null,
                totalMs: Date.now() - timings.requestStartedAt,
              },
            };
        emit(donePayload);
        emit("[DONE]");
        controller.close();
      } catch (error) {
        emit({ type: "error", error: error?.message ?? String(error) });
        controller.close();
      }
    },
  });

  return new Response(body, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
