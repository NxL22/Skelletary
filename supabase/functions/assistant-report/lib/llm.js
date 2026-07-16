// Cliente MiniMax OpenAI-compatible.
// `reasoning_split` evita que el razonamiento termine mezclado con el informe.

const DEFAULT_TIMEOUT_MS = 45_000;
const MAX_COMPLETION_TOKENS = 1200;

function requestBody({ model, systemPrompt, userInput, thinkingMode, serviceTier, stream }) {
  return {
    model,
    temperature: 0.1,
    top_p: 0.9,
    max_completion_tokens: MAX_COMPLETION_TOKENS,
    reasoning_split: true,
    thinking: { type: thinkingMode },
    service_tier: serviceTier,
    stream,
    ...(stream ? { stream_options: { include_usage: true } } : {}),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput },
    ],
  };
}

async function fetchMiniMax({ apiKey, baseUrl, body, signal, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (!apiKey) throw new Error("Falta MINIMAX_API_KEY en los secrets.");
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const cleanup = () => {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  };
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      const error = new Error(`MiniMax respondio ${response.status}: ${detail.slice(0, 400)}`);
      error.status = response.status;
      throw error;
    }
    return { response, cleanup };
  } catch (error) {
    cleanup();
    if (error?.name === "AbortError") {
      const aborted = new Error(
        signal?.aborted
          ? "La solicitud fue cancelada."
          : "MiniMax tardo demasiado en responder.",
      );
      aborted.name = signal?.aborted ? "AbortError" : "ProviderTimeoutError";
      throw aborted;
    }
    throw error;
  }
}

export async function callLlm({
  apiKey,
  baseUrl,
  model,
  systemPrompt,
  userInput,
  thinkingMode = "disabled",
  serviceTier = "standard",
  signal = null,
}) {
  const { response, cleanup } = await fetchMiniMax({
    apiKey,
    baseUrl,
    signal,
    body: requestBody({ model, systemPrompt, userInput, thinkingMode, serviceTier, stream: false }),
  });
  try {
    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (!text || typeof text !== "string") throw new Error("MiniMax no devolvio contenido util.");
    return {
      text: text.trim(),
      model: payload?.model ?? model,
      usage: payload?.usage ?? null,
    };
  } finally {
    cleanup();
  }
}

function appendContent(current, incoming) {
  if (!incoming) return current;
  // MiniMax puede entregar deltas o contenido acumulado segun el modelo.
  if (incoming.startsWith(current)) return incoming;
  return current + incoming;
}

export async function callLlmStream({
  apiKey,
  baseUrl,
  model,
  systemPrompt,
  userInput,
  thinkingMode = "disabled",
  serviceTier = "standard",
  signal = null,
  onContent = null,
}) {
  const { response, cleanup } = await fetchMiniMax({
    apiKey,
    baseUrl,
    signal,
    body: requestBody({ model, systemPrompt, userInput, thinkingMode, serviceTier, stream: true }),
  });
  if (!response.body) {
    cleanup();
    throw new Error("MiniMax no devolvio un stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let usage = null;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const raw = trimmed.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const event = JSON.parse(raw);
          if (event.usage) usage = event.usage;
          const content = event?.choices?.[0]?.delta?.content;
          if (typeof content === "string" && content) {
            text = appendContent(text, content);
            onContent?.(text);
          }
        } catch {
          // Keepalive o linea parcial: no forma parte del informe.
        }
      }
    }
  } finally {
    cleanup();
  }
  if (!text.trim()) throw new Error("MiniMax no devolvio contenido util.");
  return { text: text.trim(), model, usage };
}

export { appendContent, MAX_COMPLETION_TOKENS };
