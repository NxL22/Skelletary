// lib/feedback.js
// =====================================================================
// Helper para el sistema de retroalimentacion del Asistente.
//
// Estructura del archivo .md en el bucket `assistant-feedback`:
//   feedback/{user_id}.md
//
// Cada entrada es un bloque separado por `---` con este formato:
//
//   ## {timestamp ISO} | template: {template_code?} | hash: {sha256 del input}
//
//   ### Input del usuario
//   {input literal}
//
//   ### Informe aprobado
//   {informe final que dejo el usuario}
//
// Por que Storage y no DB:
//   - Mas espacio gratis en Supabase free (1 GB vs 500 MB).
//   - Texto plano descargable como backup.
//   - PHI no queda en Postgres, mas facil de mover/borrar.

const MAX_FEEDBACK_ENTRIES = 50;
const DEFAULT_FEEDBACK_LIMIT = 4;
const STORAGE_PATH_PREFIX = "feedback";
const STORAGE_BUCKET = "assistant-feedback";

// ---- Hashing -----------------------------------------------------------------

/**
 * Calcula SHA256 de un string. Usamos la Web Crypto API nativa (Deno).
 * @param {string} text
 * @returns {Promise<string>} Hex en lowercase.
 */
export async function sha256Hex(text) {
  const data = new TextEncoder().encode(String(text ?? ""));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// ---- Serializacion -----------------------------------------------------------

function escapeTripleDash(text) {
  // Los bloques se separan por `---`. Si el contenido trae un `---` propio,
  // lo escapamos para que el parser no se confunda.
  return String(text ?? "").replace(/^---$/gm, "\\---");
}

/**
 * Serializa una entrada de feedback a markdown.
 */
export function serializeFeedbackEntry({ createdAt, templateCode, inputHash, userInput, humanOutput }) {
  const timestamp = createdAt || new Date().toISOString();
  const templatePart = templateCode ? `template: ${templateCode}` : "template:";
  return [
    `## ${timestamp} | ${templatePart} | hash: ${inputHash}`,
    "",
    "### Input del usuario",
    escapeTripleDash(userInput).trim(),
    "",
    "### Informe aprobado",
    escapeTripleDash(humanOutput).trim(),
  ].join("\n");
}

// ---- Parseo ------------------------------------------------------------------

/**
 * Parsea el markdown completo y devuelve los ultimos N bloques.
 * Estructura de cada bloque parseado:
 *   { timestamp, templateCode, inputHash, userInput, humanOutput }
 */
export function parseFeedbackMarkdown(text, limit = DEFAULT_FEEDBACK_LIMIT) {
  if (!text || typeof text !== "string") {
    return [];
  }

  // Dividimos por bloques `---`. Filtramos vacios.
  const blocks = text
    .split(/^---$/gm)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  const parsed = [];
  for (const block of blocks) {
    const entry = parseFeedbackBlock(block);
    if (entry) {
      parsed.push(entry);
    }
  }

  // Devolvemos los ultimos N en orden cronologico (mas recientes primero).
  return parsed.slice(-Math.max(1, limit)).reverse();
}

function parseFeedbackBlock(block) {
  const lines = block.split("\n");
  const headerLine = lines.find((line) => line.startsWith("## "));
  if (!headerLine) {
    return null;
  }

  // Header: `## 2026-07-04T... | template: eco_abdomen | hash: abc123`
  const headerMatch = headerLine.match(/^##\s+(\S+)\s*\|\s*template:\s*(\S*)\s*\|\s*hash:\s*(\S+)/);
  if (!headerMatch) {
    return null;
  }
  const timestamp = headerMatch[1];
  const templateCode = headerMatch[2] || null;
  const inputHash = headerMatch[3];

  // Cuerpo: dos secciones ### Input del usuario y ### Informe aprobado.
  const sections = splitSections(lines.slice(1));

  return {
    timestamp,
    templateCode,
    inputHash,
    userInput: unescapeTripleDash(sections.input || "").trim(),
    humanOutput: unescapeTripleDash(sections.output || "").trim(),
  };
}

function splitSections(lines) {
  const result = { input: null, output: null };
  let current = null;
  const buffer = { input: [], output: [] };

  for (const line of lines) {
    if (line.trim() === "### Input del usuario") {
      current = "input";
      continue;
    }
    if (line.trim() === "### Informe aprobado") {
      current = "output";
      continue;
    }
    if (current) {
      buffer[current].push(line);
    }
  }

  result.input = buffer.input.join("\n");
  result.output = buffer.output.join("\n");
  return result;
}

function unescapeTripleDash(text) {
  return String(text ?? "").replace(/^\\---$/gm, "---");
}

// ---- Acceso a Storage --------------------------------------------------------

/**
 * Descarga el archivo de feedback del usuario desde el bucket.
 * Si no existe, devuelve string vacio (no es error).
 */
export async function downloadFeedbackFile(adminClient, userId) {
  const path = `${STORAGE_PATH_PREFIX}/${userId}.md`;
  const { data, error } = await adminClient.storage
    .from(STORAGE_BUCKET)
    .download(path);

  if (error || !data) {
    // Caso normal: el usuario aun no tiene feedback.
    return "";
  }
  return await data.text();
}

/**
 * Sube el archivo de feedback al bucket (sobrescribe).
 */
export async function uploadFeedbackFile(adminClient, userId, markdown) {
  const path = `${STORAGE_PATH_PREFIX}/${userId}.md`;
  const blob = new Blob([markdown], { type: "text/markdown; charset=utf-8" });
  const { error } = await adminClient.storage
    .from(STORAGE_BUCKET)
    .upload(path, blob, { upsert: true, contentType: "text/markdown; charset=utf-8" });

  if (error) {
    throw new Error(`No pudimos guardar el feedback: ${error.message}`);
  }
}

/**
 * Lee los ultimos N pares del usuario. Devuelve array vacio si no hay.
 */
export async function loadRecentFeedback(adminClient, userId, { limit = DEFAULT_FEEDBACK_LIMIT } = {}) {
  const text = await downloadFeedbackFile(adminClient, userId);
  if (!text) {
    return [];
  }
  return parseFeedbackMarkdown(text, limit);
}

// ---- Append con dedup y retencion --------------------------------------------

/**
 * Append una nueva entrada de feedback al archivo del usuario.
 * - Deduplica por hash del input: si ya existe, no hace nada.
 * - Trunca a los ultimos MAX_FEEDBACK_ENTRIES para acotar el tamaño.
 */
export async function appendFeedback(adminClient, userId, entry) {
  const currentText = await downloadFeedbackFile(adminClient, userId);
  const existingEntries = currentText ? parseFeedbackMarkdown(currentText, MAX_FEEDBACK_ENTRIES) : [];

  // Dedup por hash del input.
  const isDuplicate = existingEntries.some(
    (existing) => existing.inputHash === entry.inputHash,
  );
  if (isDuplicate) {
    return { appended: false, reason: "duplicate" };
  }

  // Append la nueva entrada al final.
  const newEntry = serializeFeedbackEntry({
    createdAt: new Date().toISOString(),
    templateCode: entry.templateCode || null,
    inputHash: entry.inputHash,
    userInput: entry.userInput,
    humanOutput: entry.humanOutput,
  });

  // Re-serializamos TODAS las entradas para mantener orden y formato consistente.
  const allEntries = [
    ...existingEntries.reverse(), // existentes en orden cronologico (viejo -> nuevo)
    parseFeedbackBlock(newEntry), // nueva entrada
  ];

  const newText = allEntries
    .map((e, idx) => {
      const isLast = idx === allEntries.length - 1;
      const block = serializeFeedbackEntry({
        createdAt: e.timestamp,
        templateCode: e.templateCode,
        inputHash: e.inputHash,
        userInput: e.userInput,
        humanOutput: e.humanOutput,
      });
      return isLast ? `\n${block}\n` : `\n---\n${block}\n`;
    })
    .join("");

  await uploadFeedbackFile(adminClient, userId, newText.trim() + "\n");
  return { appended: true };
}

// ---- Serializacion para el prompt --------------------------------------------

/**
 * Serializa una lista de entradas de feedback al bloque que va en el system prompt.
 * El LLM los usa como ejemplos de estilo a imitar (no a copiar literal).
 */
export function buildExamplesBlock(entries) {
  if (!entries || entries.length === 0) {
    return "";
  }

  const lines = [
    "EJEMPLOS PREVIOS DEL USUARIO (estilo a imitar, no copies literal):",
    "",
  ];

  entries.forEach((entry, index) => {
    lines.push(`Ejemplo ${index + 1}:`);
    lines.push(`Input del usuario: ${entry.userInput}`);
    lines.push("Informe final aprobado:");
    lines.push(entry.humanOutput);
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  return lines.join("\n");
}

export const FEEDBACK_LIMITS = {
  MAX_ENTRIES: MAX_FEEDBACK_ENTRIES,
  DEFAULT_LIMIT: DEFAULT_FEEDBACK_LIMIT,
};
