// Edge Function: assistant-report
// Selector deterministico + tres rutas de generacion de Skelly Redactor.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.1";
import { checkAndIncrementUsage, getRemainingUsage } from "./lib/usage.js";
import { buildPrompt, PROMPT_VERSION } from "./lib/prompt.js";
import { retrieveMemories } from "./lib/memory.js";
import { callLlm, callLlmStream } from "./lib/llm.js";
import { safeReportPreview, sanitizeReport } from "./lib/sanitize.js";
import { validateClinicalOutput } from "./lib/clinicalValidation.js";
import {
  classifyGenerationRoute,
  findMissingRequiredVariables,
  loadActiveTemplates,
  resolveFastPath,
  selectTemplate,
} from "./lib/templateSelector.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

function getEnv(name, fallback) {
  const value = Deno.env.get(name);
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Variable de entorno requerida: ${name}`);
}

async function resolveUserContext(request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return { error: "Falta el token de sesion.", status: 401 };
  const accessToken = authHeader.slice(7).trim();
  const url = getEnv("SUPABASE_URL");
  const anonKey = getEnv("SUPABASE_ANON_KEY");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user?.id) return { error: "Tu sesion no es valida. Inicia sesion de nuevo.", status: 401 };

  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, access_status, trial_ends_at, subscription_ends_at, has_assistant_access")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profileError) return { error: "No pudimos leer tu perfil.", status: 500 };
  if (!profile?.has_assistant_access) return { error: "Tu cuenta no tiene habilitado el asistente.", status: 403 };

  const now = Date.now();
  const trialValid = profile.access_status === "trial" && (!profile.trial_ends_at || new Date(profile.trial_ends_at).getTime() > now);
  const activeValid = profile.access_status === "active" && (!profile.subscription_ends_at || new Date(profile.subscription_ends_at).getTime() > now);
  if (!trialValid && !activeValid) return { error: "Tu acceso a Skelletary no esta vigente.", status: 403 };
  return { userId: userData.user.id, adminClient };
}

function usagePayload(usage) {
  return {
    count: usage.count,
    windowStart: usage.windowStart,
    windowEnd: usage.windowEnd,
    remaining: getRemainingUsage(usage),
  };
}

function buildMetadata(context, extra = {}) {
  return {
    requestId: context.requestId,
    selectedTemplateId: context.template.source_template_id,
    templateHash: context.template.source_hash,
    promptVersion: PROMPT_VERSION,
    selectorVersion: context.selection.selectorVersion,
    route: context.route,
    usage: usagePayload(context.usage),
    ...extra,
  };
}

function providerConfig() {
  return {
    apiKey: getEnv("MINIMAX_API_KEY"),
    baseUrl: getEnv("MINIMAX_BASE_URL", "https://api.minimax.io/v1"),
    primaryModel: getEnv("MINIMAX_MODEL", "MiniMax-M3"),
    fallbackModel: getEnv("MINIMAX_FALLBACK_MODEL", "MiniMax-M2.7-highspeed"),
    serviceTier: getEnv("MINIMAX_SERVICE_TIER", "standard"),
  };
}

function validateGeneratedResult(rawText, context) {
  const requireSystematicPhrase = /ecograf/i.test(String(context.template.category ?? ""));
  const sanitized = sanitizeReport(rawText, { requireSystematicPhrase });
  if (!sanitized.valid) return sanitized;
  const clinical = validateClinicalOutput({
    output: sanitized.text,
    templateContent: context.template.normalized_content,
    userInput: context.userInput,
  });
  if (!clinical.valid) {
    return { text: "", warnings: clinical.errors, valid: false, isFallback: true };
  }
  return sanitized;
}

async function retryOnce({ config, context, reason, signal }) {
  // M2.7 solo entra cuando M3 realmente no esta disponible. Una salida invalida
  // se corrige con el mismo M3 y pensamiento adaptativo.
  const useFallback = reason === "provider";
  const model = useFallback ? config.fallbackModel : config.primaryModel;
  const result = await callLlm({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model,
    systemPrompt: context.systemPrompt,
    userInput: context.userInput,
    thinkingMode: "adaptive",
    serviceTier: config.serviceTier,
    signal,
  });
  return { ...result, retryReason: reason };
}

async function generateNonStream(context, signal = null) {
  if (context.fastPath.eligible) {
    const sanitizeStartedAt = Date.now();
    const sanitized = validateGeneratedResult(context.fastPath.text, context);
    context.timings.sanitizeMs = Date.now() - sanitizeStartedAt;
    if (!sanitized.valid) throw new Error(sanitized.warnings.join(" "));
    return { sanitized, model: "deterministic", tokenUsage: null, retried: false };
  }

  const config = providerConfig();
  const thinkingMode = context.route === "complex" ? "adaptive" : "disabled";
  let result;
  let retried = false;
  const providerStartedAt = Date.now();
  try {
    result = await callLlm({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.primaryModel,
      systemPrompt: context.systemPrompt,
      userInput: context.userInput,
      thinkingMode,
      serviceTier: config.serviceTier,
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    result = await retryOnce({ config, context, reason: "provider", signal });
    retried = true;
  }
  context.timings.providerMs = Date.now() - providerStartedAt;
  let sanitizeStartedAt = Date.now();
  let sanitized = validateGeneratedResult(result.text, context);
  context.timings.sanitizeMs = Date.now() - sanitizeStartedAt;
  if (!sanitized.valid && !retried) {
    const retryStartedAt = Date.now();
    result = await retryOnce({ config, context, reason: "invalid-output", signal });
    context.timings.providerMs += Date.now() - retryStartedAt;
    retried = true;
    sanitizeStartedAt = Date.now();
    sanitized = validateGeneratedResult(result.text, context);
    context.timings.sanitizeMs += Date.now() - sanitizeStartedAt;
  }
  if (!sanitized.valid) throw new Error(sanitized.warnings.join(" ") || "MiniMax no devolvio un informe valido.");
  return { sanitized, model: result.model, tokenUsage: result.usage, retried };
}

async function prepareContext({ request, userInput, templateCode, usage, userId, adminClient, timings }) {
  const requestId = crypto.randomUUID();
  const selectionStartedAt = Date.now();
  const templates = await loadActiveTemplates(adminClient);
  let selection = selectTemplate(templates, userInput);
  if (templateCode) {
    const explicit = templates.find((item) =>
      item.source_template_id === templateCode || item.metadata?.shortcut === templateCode
    );
    if (explicit) selection = { ...selection, template: explicit, question: null, reasons: ["seleccion-explicita"] };
  }
  timings.selectionMs = Date.now() - selectionStartedAt;
  if (selection.question || !selection.template) return { requestId, question: selection.question, selection };

  const missingVariables = findMissingRequiredVariables(selection.template, userInput);
  if (missingVariables.length > 0) {
    return {
      requestId,
      question: `Falta completar: ${missingVariables.join(", ")}.`,
      selection,
    };
  }

  const fastPath = resolveFastPath(selection.template, userInput);
  const route = fastPath.eligible ? "fast-path" : classifyGenerationRoute(userInput);
  const memoryStartedAt = Date.now();
  const memories = fastPath.eligible
    ? []
    : await retrieveMemories(adminClient, userId, userInput, selection.template.source_template_id, 3);
  timings.memoryMs = Date.now() - memoryStartedAt;
  const systemPrompt = fastPath.eligible ? "" : buildPrompt({ template: selection.template, userInput, memories });

  return {
    request,
    requestId,
    userInput,
    userId,
    template: selection.template,
    selection,
    fastPath,
    route,
    memories,
    systemPrompt,
    usage,
    timings,
  };
}

function streamResponse(context) {
  const encoder = new TextEncoder();
  const startedAt = context.timings.requestStartedAt;
  const body = new ReadableStream({
    async start(controller) {
      const emit = (payload) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      emit({ type: "start", status: "started", stage: "generation", ...buildMetadata(context) });
      let firstTokenAt = null;
      let lastPreview = "";
      try {
        if (context.fastPath.eligible) {
          const sanitizeStartedAt = Date.now();
          const sanitized = validateGeneratedResult(context.fastPath.text, context);
          context.timings.sanitizeMs = Date.now() - sanitizeStartedAt;
          if (!sanitized.valid) throw new Error(sanitized.warnings.join(" "));
          emit({ type: "preview", requestId: context.requestId, text: sanitized.text });
          emit({
            type: "done", status: "report", text: sanitized.text, warnings: [], isFallback: false,
            ...buildMetadata(context, { model: "deterministic", timings: { ...context.timings, firstTokenMs: 0, totalMs: Date.now() - startedAt } }),
          });
          emit("[DONE]");
          controller.close();
          return;
        }

        const config = providerConfig();
        const thinkingMode = context.route === "complex" ? "adaptive" : "disabled";
        let result;
        let retried = false;
        const providerStartedAt = Date.now();
        try {
          result = await callLlmStream({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            model: config.primaryModel,
            systemPrompt: context.systemPrompt,
            userInput: context.userInput,
            thinkingMode,
            serviceTier: config.serviceTier,
            signal: context.request.signal,
            onContent: (currentText) => {
              if (!firstTokenAt) firstTokenAt = Date.now();
              const preview = safeReportPreview(currentText);
              if (preview && preview.length >= lastPreview.length + 24) {
                lastPreview = preview;
                emit({ type: "preview", requestId: context.requestId, text: preview });
              }
            },
          });
        } catch (error) {
          if (context.request.signal.aborted) throw error;
          result = await retryOnce({ config, context, reason: "provider", signal: context.request.signal });
          retried = true;
        }

        context.timings.providerMs = Date.now() - providerStartedAt;
        let sanitizeStartedAt = Date.now();
        let sanitized = validateGeneratedResult(result.text, context);
        context.timings.sanitizeMs = Date.now() - sanitizeStartedAt;
        if (!sanitized.valid && !retried) {
          const retryStartedAt = Date.now();
          result = await retryOnce({ config, context, reason: "invalid-output", signal: context.request.signal });
          context.timings.providerMs += Date.now() - retryStartedAt;
          retried = true;
          sanitizeStartedAt = Date.now();
          sanitized = validateGeneratedResult(result.text, context);
          context.timings.sanitizeMs += Date.now() - sanitizeStartedAt;
        }
        if (!sanitized.valid) throw new Error(sanitized.warnings.join(" ") || "MiniMax no devolvio un informe valido.");

        const totalMs = Date.now() - startedAt;
        emit({
          type: "done", status: "report", text: sanitized.text, warnings: sanitized.warnings,
          isFallback: false, tokenUsage: result.usage ?? null,
          ...buildMetadata(context, {
            model: result.model,
            retried,
            timings: { ...context.timings, firstTokenMs: firstTokenAt ? firstTokenAt - startedAt : null, totalMs },
          }),
        });
        emit("[DONE]");
        controller.close();
      } catch (error) {
        emit({ type: "error", requestId: context.requestId, code: "INVALID_OUTPUT", error: error?.message ?? String(error) });
        controller.close();
      }
    },
  });
  return new Response(body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}

serve(async (request) => {
  const requestStartedAt = Date.now();
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Metodo no permitido." }, 405);

  const payload = await request.json().catch(() => null);
  const userInput = String(payload?.input ?? "").trim();
  const templateCode = payload?.templateCode ? String(payload.templateCode).trim() : null;
  if (!userInput) return jsonResponse({ error: "Escribe un mensaje para Skelly.", code: "BAD_INPUT" }, 400);
  if (userInput.length > 2000) return jsonResponse({ error: "El mensaje supera 2000 caracteres.", code: "BAD_INPUT" }, 400);

  const authStartedAt = Date.now();
  const auth = await resolveUserContext(request);
  if (auth.error) return jsonResponse({ error: auth.error }, auth.status);
  const timings = { requestStartedAt, authMs: Date.now() - authStartedAt };
  const usageStartedAt = Date.now();
  const usage = await checkAndIncrementUsage(auth.adminClient, auth.userId);
  timings.usageMs = Date.now() - usageStartedAt;
  if (!usage.allowed) return jsonResponse({ error: "Has alcanzado el limite de envios.", code: "RATE_LIMITED", ...usage }, 429);

  try {
    const context = await prepareContext({ request, userInput, templateCode, usage, userId: auth.userId, adminClient: auth.adminClient, timings });
    if (context.question) {
      const response = {
        type: "done",
        status: "question",
        requestId: context.requestId,
        text: "",
        question: context.question,
        selectedTemplateId: context.selection?.template?.source_template_id ?? null,
        promptVersion: PROMPT_VERSION,
        model: "deterministic",
        route: "clarification",
        warnings: [],
        timings: { ...timings, totalMs: Date.now() - requestStartedAt },
        usage: usagePayload(usage),
      };
      return shouldStream(request) ? sseSingle(response) : jsonResponse(response);
    }
    if (shouldStream(request)) return streamResponse(context);

    const result = await generateNonStream(context, request.signal);
    return jsonResponse({
      status: "report", text: result.sanitized.text, warnings: result.sanitized.warnings,
      isFallback: false, tokenUsage: result.tokenUsage,
      ...buildMetadata(context, {
        model: result.model,
        retried: result.retried,
        timings: { ...timings, totalMs: Date.now() - requestStartedAt },
      }),
    });
  } catch (error) {
    return jsonResponse({ error: "Skelly no pudo generar un informe valido.", code: "INVALID_OUTPUT", detail: error?.message ?? String(error) }, 502);
  }
});

function shouldStream(request) {
  const url = new URL(request.url);
  return url.searchParams.get("stream") === "1" || (request.headers.get("Accept") ?? "").includes("text/event-stream");
}

function sseSingle(payload) {
  const start = {
    type: "start",
    status: "started",
    requestId: payload.requestId,
    promptVersion: payload.promptVersion,
    route: payload.route,
    stage: payload.status === "question" ? "clarification" : "generation",
    usage: payload.usage,
  };
  return new Response(`data: ${JSON.stringify(start)}\n\ndata: ${JSON.stringify(payload)}\n\ndata: [DONE]\n\n`, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
