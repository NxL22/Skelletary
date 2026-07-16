// Convierte feedback humano en memoria segura y reutilizable. Los valores
// particulares del paciente se reemplazan por variables antes de generalizar.

const IDENTIFIER_PATTERNS = [
  { label: "RUT", regex: /\b\d{1,2}\.\d{3}\.\d{3}-[\dkK]\b/g },
  { label: "correo", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { label: "telefono", regex: /(?:\+?56\s*)?(?:9\s*)?\d{4}[\s-]?\d{4}\b/g },
  { label: "identificador", regex: /\b(?:paciente|nombre|ficha|rut|dni)\s*[:#-]\s*[^\n,;]+/gi },
];

const VALUE_PATTERN = /\b\d+(?:[.,]\d+)?\s*(?:mm|cm|cc|ml|gr|g|hz|mhz|%|semanas?|dias?|meses?|años?)\b/gi;

export function sanitizeClinicalText(value) {
  let text = String(value ?? "").trim();
  const found = [];
  for (const pattern of IDENTIFIER_PATTERNS) {
    if (pattern.regex.test(text)) found.push(pattern.label);
    pattern.regex.lastIndex = 0;
    text = text.replace(pattern.regex, "[DATO_PROTEGIDO]");
  }
  return { text, blocked: found.length > 0, reasons: [...new Set(found)] };
}

export function extractVariables(...texts) {
  const values = [];
  for (const text of texts) {
    for (const match of String(text ?? "").matchAll(VALUE_PATTERN)) {
      const value = match[0].replace(/\s+/g, " ").trim();
      if (!values.includes(value)) values.push(value);
    }
  }
  return values.map((value, index) => ({ name: `medida_${index + 1}`, value }));
}

export function generalizeText(text, variables) {
  let result = String(text ?? "");
  for (const variable of [...variables].sort((a, b) => b.value.length - a.value.length)) {
    result = result.replaceAll(variable.value, `{{${variable.name}}}`);
  }
  return result.trim();
}

export function correctionSummary(skellyOutput, approvedOutput) {
  const accepted = skellyOutput.trim() === approvedOutput.trim();
  const beforeLines = new Set(skellyOutput.split("\n").map((line) => line.trim()).filter(Boolean));
  const afterLines = new Set(approvedOutput.split("\n").map((line) => line.trim()).filter(Boolean));
  return {
    accepted,
    addedLines: [...afterLines].filter((line) => !beforeLines.has(line)).slice(0, 20),
    removedLines: [...beforeLines].filter((line) => !afterLines.has(line)).slice(0, 20),
  };
}

export function hasValidReportStructure(value) {
  const normalized = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  const antecedentes = normalized.indexOf("ANTECEDENTES CLINICOS:");
  const hallazgos = normalized.indexOf("HALLAZGOS:");
  const impresion = normalized.indexOf("IMPRESION:");
  return antecedentes >= 0 && hallazgos > antecedentes && impresion > hallazgos;
}

export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(String(text));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createEmbedding(text) {
  try {
    const session = new Supabase.ai.Session("gte-small");
    return await session.run(String(text), { mean_pool: true, normalize: true });
  } catch (error) {
    console.warn("Embedding no disponible; el aprendizaje queda guardado para reintento:", error?.message ?? error);
    return null;
  }
}
