// lib/llm.js
// =====================================================================
// Cliente HTTP para el LLM. Usa el formato OpenAI-compatible (que es el
// que MiniMax expone), por lo que si el owner quiere cambiar a OpenAI o
// Anthropic solo tiene que ajustar base URL y modelo.
//
// Parametros:
//   - systemPrompt: el prompt armado por lib/prompt.js
//   - userInput:    el mensaje crudo de la usuaria
//
// Devuelve { text, model } con el contenido del primer choice.

const DEFAULT_TIMEOUT_MS = 60_000;
// Los informes radiologicos estructurados rara vez pasan de 800 tokens.
// Capeamos a 1000 para evitar que el modelo verboso gaste tokens de mas y
// para reducir latencia.
const MAX_TOKENS = 1000;
// Temperatura muy baja: queremos consistencia absoluta en el formato de
// 3 secciones. Tambien ayuda a reducir la probabilidad de que el modelo
// emita chain-of-thought visible.
const TEMPERATURE = 0.1;
// Parametros opcionales para proveedores tipo reasoning (MiniMax/M3, o1).
// Si el proveedor los ignora, no rompen nada.
const REASONING_EFFORT = "none";

async function callLlm({
  apiKey,
  baseUrl,
  model,
  systemPrompt,
  userInput,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  if (!apiKey) {
    throw new Error("Falta MINIMAX_API_KEY en los secrets del Edge Function.");
  }
  if (!baseUrl) {
    throw new Error("Falta MINIMAX_BASE_URL en los secrets del Edge Function.");
  }

  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
        reasoning: { effort: REASONING_EFFORT },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput },
        ],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("El asistente tardo demasiado en responder.");
    }
    throw new Error(
      `No pudimos contactar al proveedor de IA: ${error?.message ?? error}`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `El proveedor de IA respondio con estado ${response.status}. ${detail.slice(0, 400)}`,
    );
  }

  const payload = await response.json();
  const text = payload?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") {
    throw new Error("El proveedor de IA no devolvio texto util.");
  }
  return { text: text.trim(), model };
}

export { callLlm };