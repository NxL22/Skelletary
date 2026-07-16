// src/lib/assistant.js
// =====================================================================
// Cliente del Edge Function `assistant-report`.
//
// Dos modos:
//   1. invokeAssistant(): JSON completo (compatibilidad con clientes viejos).
//   2. invokeAssistantStream(): SSE, recibe los tokens conforme llegan.
//
// Errores tipados:
//   - AssistantError(code, message, detail?)
//     codes: RATE_LIMITED, UNAUTHORIZED, NO_ACCESS, NO_ASSISTANT,
//             BAD_INPUT, NETWORK, SERVER, EMPTY

import { getSupabaseClient } from "./supabaseClient";

const ENDPOINT = "assistant-report";
const FEEDBACK_ENDPOINT = "assistant-feedback";

// =====================================================================
// Errores tipados
// =====================================================================

export class AssistantError extends Error {
  constructor(code, message, detail = null, extra = null) {
    super(message);
    this.name = "AssistantError";
    this.code = code;
    this.detail = detail;
    this.extra = extra;
  }
}

function describeStatus(status, body) {
  if (status === 401) {
    return new AssistantError(
      "UNAUTHORIZED",
      "Tu sesion no es valida. Vuelve a iniciar sesion.",
      body?.error,
    );
  }
  if (status === 403) {
    return new AssistantError(
      "NO_ACCESS",
      body?.error || "Tu cuenta no tiene acceso al asistente.",
      body?.error,
    );
  }
  if (status === 429) {
    return new AssistantError(
      "RATE_LIMITED",
      body?.error || "Has alcanzado el limite de envios del asistente.",
      body?.error,
      {
        windowStart: body?.windowStart,
        windowEnd: body?.windowEnd,
      },
    );
  }
  if (status === 400) {
    return new AssistantError(
      "BAD_INPUT",
      body?.error || "El mensaje enviado no es valido.",
      body?.error,
    );
  }
  if (status === 422) {
    return new AssistantError(
      "PRIVACY_BLOCKED",
      body?.error || "Detectamos datos que no deben guardarse.",
      body?.detail || body?.error,
    );
  }
  if (status >= 500) {
    return new AssistantError(
      "SERVER",
      body?.error || "El asistente tuvo un problema. Intenta de nuevo.",
      body?.error,
    );
  }
  return new AssistantError(
    "UNKNOWN",
    body?.error || `Respuesta inesperada del asistente (${status}).`,
    body?.error,
  );
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

// =====================================================================
// Helpers para llamadas directas con fetch (necesario para SSE)
// =====================================================================

async function getAccessToken() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token ?? null;
  } catch {
    return null;
  }
}

function getFunctionUrl(functionName) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }
  // supabase-js expone supabaseUrl en la raiz del cliente.
  const baseUrl = supabase.supabaseUrl;
  if (!baseUrl) {
    return null;
  }
  return `${baseUrl}/functions/v1/${functionName}`;
}

async function getAnonKey() {
  // El anon key esta disponible en supabase.supabaseKey (v2).
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }
  return supabase.supabaseKey ?? null;
}

// =====================================================================
// invokeAssistant: modo JSON completo (compatibilidad)
// =====================================================================

export async function invokeAssistant({ input, templateCode = null }) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new AssistantError(
      "NETWORK",
      "Supabase no esta configurado en este cliente.",
    );
  }

  let data;
  let error;
  try {
    const response = await supabase.functions.invoke(ENDPOINT, {
      body: { input, templateCode },
    });
    data = response?.data;
    error = response?.error;
  } catch (networkError) {
    throw new AssistantError(
      "NETWORK",
      "No pudimos contactar al asistente. Revisa tu conexion.",
      networkError?.message ?? String(networkError),
    );
  }

  if (error) {
    const status = error?.context?.status ?? 0;
    const body =
      error?.context?.body && typeof error.context.body === "string"
        ? safeJson(error.context.body)
        : null;
    throw describeStatus(status, body);
  }

  if (!data || typeof data !== "object") {
    throw new AssistantError(
      "UNKNOWN",
      "El asistente devolvio una respuesta vacia.",
    );
  }

  if (data?.error) {
    throw describeStatus(data?.status ?? 400, data);
  }

  return {
    status: data.status ?? (data.question ? "question" : "report"),
    text: data.text ?? "",
    question: typeof data.question === "string" ? data.question : null,
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
    usage: data.usage ?? null,
    isFallback: Boolean(data.isFallback),
    timings: data.timings ?? null,
    requestId: data.requestId ?? null,
    selectedTemplateId: data.selectedTemplateId ?? null,
    promptVersion: data.promptVersion ?? null,
    model: data.model ?? null,
    route: data.route ?? null,
  };
}

// =====================================================================
// invokeAssistantStream: modo SSE token por token
// =====================================================================

/**
 * Llama al Edge Function con SSE y entrega cada chunk al callback `onDelta`.
 * Devuelve una promesa que se resuelve con el texto completo + warnings + usage.
 *
 * onDelta(chunk): recibe texto incremental. Cada chunk ya viene sanitizado
 *                 desde el backend (lo aplicamos al final, no en cada delta
 *                 porque seria muy costoso). El cliente puede ir acumulando.
 *
 * onStart(usage): se dispara una sola vez al inicio con el contador de uso.
 */
export async function invokeAssistantStream({
  input,
  templateCode = null,
  onDelta = null,
  onPreview = null,
  onStart = null,
  signal = null,
}) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new AssistantError(
      "NETWORK",
      "Supabase no esta configurado en este cliente.",
    );
  }

  const url = getFunctionUrl(ENDPOINT);
  const accessToken = await getAccessToken();
  const anonKey = await getAnonKey();

  if (!url || !accessToken || !anonKey) {
    throw new AssistantError(
      "NETWORK",
      "Falta la URL o las credenciales del backend.",
    );
  }

  let response;
  try {
    response = await fetch(`${url}?stream=1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ input, templateCode }),
      signal,
    });
  } catch (networkError) {
    if (signal?.aborted) {
      throw new AssistantError(
        "TIMEOUT",
        "Skelly tardo demasiado. Puedes intentarlo de nuevo.",
      );
    }
    throw new AssistantError(
      "NETWORK",
      "No pudimos contactar al asistente. Revisa tu conexion.",
      networkError?.message ?? String(networkError),
    );
  }

  if (!response.ok) {
    let body = null;
    try {
      const text = await response.text();
      body = safeJson(text);
    } catch {
      // ignore
    }
    throw describeStatus(response.status, body);
  }

  if (!response.body) {
    throw new AssistantError(
      "UNKNOWN",
      "El servidor no devolvio un stream.",
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";
  let usage = null;
  let finalText = "";
  let warnings = [];
  let question = null;
  let isFallback = false;
  let timings = null;
  let status = null;
  let requestId = null;
  let selectedTemplateId = null;
  let promptVersion = null;
  let model = null;
  let route = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    // Procesamos cada evento SSE completo (terminado en \n\n).
    let boundary;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const eventChunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      const line = eventChunk.split("\n").find((l) => l.startsWith("data:"));
      if (!line) {
        continue;
      }
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") {
        continue;
      }

      let parsed = null;
      try {
        parsed = JSON.parse(payload);
      } catch {
        continue;
      }

      if (parsed?.type === "start") {
        usage = parsed.usage;
        onStart?.(usage);
        requestId = parsed.requestId ?? requestId;
        continue;
      }

      if (parsed?.type === "delta" && typeof parsed.text === "string") {
        accumulated += parsed.text;
        onDelta?.(parsed.text);
        continue;
      }

      if (parsed?.type === "preview" && typeof parsed.text === "string") {
        onPreview?.(parsed.text);
        continue;
      }

      if (parsed?.type === "done") {
        status = parsed.status ?? (parsed.question ? "question" : "report");
        finalText = parsed.text ?? "";
        question = typeof parsed.question === "string" ? parsed.question : null;
        warnings = Array.isArray(parsed.warnings) ? parsed.warnings : [];
        isFallback = Boolean(parsed.isFallback);
        timings = parsed.timings ?? null;
        requestId = parsed.requestId ?? requestId;
        selectedTemplateId = parsed.selectedTemplateId ?? null;
        promptVersion = parsed.promptVersion ?? null;
        model = parsed.model ?? null;
        route = parsed.route ?? null;
        continue;
      }

      if (parsed?.type === "error") {
        throw new AssistantError(
          parsed.code || "SERVER",
          parsed.error || "El asistente tuvo un problema durante el stream.",
        );
      }
    }
  }

  // Un stream cortado no es un informe. Mostrar el acumulado podria exponer
  // razonamiento o un texto clinico incompleto.
  if (!status && !question) {
    throw new AssistantError("EMPTY", "La respuesta se interrumpio antes de terminar. Intenta de nuevo.");
  }

  return {
    status,
    text: finalText,
    question,
    warnings,
    usage,
    isFallback,
    timings,
    requestId,
    selectedTemplateId,
    promptVersion,
    model,
    route,
  };
}

// =====================================================================
// submitAssistantFeedback: persiste feedback y aprendizaje personal
// =====================================================================

export async function submitAssistantFeedback({
  originalInput,
  skellyOutput,
  humanOutput,
  templateCode = null,
  promptVersion = null,
  model = null,
}) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new AssistantError(
      "NETWORK",
      "Supabase no esta configurado en este cliente.",
    );
  }

  let data;
  let error;
  try {
    const response = await supabase.functions.invoke(FEEDBACK_ENDPOINT, {
      body: { originalInput, skellyOutput, humanOutput, templateCode, promptVersion, model },
    });
    data = response?.data;
    error = response?.error;
  } catch (networkError) {
    throw new AssistantError(
      "NETWORK",
      "No pudimos enviar el feedback. Revisa tu conexion.",
      networkError?.message ?? String(networkError),
    );
  }

  if (error) {
    const status = error?.context?.status ?? 0;
    const body =
      error?.context?.body && typeof error.context.body === "string"
        ? safeJson(error.context.body)
        : null;
    throw describeStatus(status, body);
  }

  if (!data || typeof data !== "object") {
    throw new AssistantError(
      "UNKNOWN",
      "El backend devolvio una respuesta vacia al guardar el feedback.",
    );
  }

  return {
    appended: Boolean(data.appended),
    reason: data.reason ?? null,
    feedbackId: data.feedbackId ?? null,
    learningStatus: data.learningStatus ?? null,
    activated: Boolean(data.activated),
    confidence: Number.isFinite(Number(data.confidence)) ? Number(data.confidence) : null,
    supportCount: Number(data.supportCount ?? 0),
  };
}
