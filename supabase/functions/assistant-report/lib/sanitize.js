// Sanitizador estricto de informes.
// Una respuesta incompleta nunca se presenta como si fuera un informe valido.

const HEADERS = {
  "antecedentes clinicos": "ANTECEDENTES CLINICOS:",
  hallazgos: "HALLAZGOS:",
  impresion: "IMPRESION:",
};

function normalizeLineEndings(value) {
  return String(value ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function normalizeForMatch(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripReasoning(value) {
  let text = normalizeLineEndings(value);
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");

  // Si el proveedor corto el stream dentro de <think>, solo conservamos un
  // informe posterior si realmente existe. De otro modo descartamos todo.
  const openThink = text.toLowerCase().lastIndexOf("<think>");
  if (openThink !== -1) {
    const afterThink = text.slice(openThink + 7);
    const reportIndex = afterThink.search(/ANTECEDENTES\s+CL[IÍ]NICOS\s*:/i);
    text = reportIndex === -1 ? text.slice(0, openThink) : afterThink.slice(reportIndex);
  }

  return text
    .replace(/<\/think>/gi, "")
    .replace(/^\s*(Let me|I need to|The user|Looking at|First,|Therefore|Now I)[^\n]*(?:\n|$)/gim, "")
    .trim();
}

function cleanMarkdown(value) {
  return value
    .replace(/```[a-z]*\s*/gi, "")
    .replace(/```/g, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .trim();
}

function canonicalizeHeaders(value) {
  return value
    .split("\n")
    .map((line) => {
      const key = normalizeForMatch(line.replace(/:\s*$/, ""));
      return HEADERS[key] ?? line.trimEnd();
    })
    .join("\n");
}

function extractSections(value) {
  const positions = Object.values(HEADERS).map((header) => ({
    header,
    index: value.indexOf(header),
  }));
  if (positions.some((item) => item.index === -1)) return null;
  const ordered = [...positions].sort((left, right) => left.index - right.index);
  if (ordered.map((item) => item.header).join("|") !== Object.values(HEADERS).join("|")) return null;

  const result = {};
  ordered.forEach((item, index) => {
    const next = ordered[index + 1];
    const key = normalizeForMatch(item.header.replace(":", ""));
    result[key] = value.slice(item.index + item.header.length, next?.index ?? value.length).trim();
  });
  return result;
}

function normalizeSectionBody(value) {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line, index, lines) => line || (index > 0 && index < lines.length - 1))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizePlaceholders(value) {
  return String(value ?? "")
    .replace(/\{\{\s*antecedente\s*\}\}/gi, "Sin diagnóstico.");
}

function hasReasoningMarkers(value) {
  return /<\/?think>|\b(Let me|I need to|The user is requesting|Looking at the template)\b/i.test(value);
}

export function sanitizeReport(rawText, { requireSystematicPhrase = false } = {}) {
  const warnings = [];
  if (!rawText || typeof rawText !== "string") {
    return { text: "", warnings: ["El asistente devolvio una respuesta vacia."], valid: false, isFallback: true };
  }

  const withoutReasoning = stripReasoning(rawText);
  const questionMatch = withoutReasoning.match(/^\s*PREGUNTA\s*:\s*(.+)$/is);
  if (questionMatch?.[1]?.trim()) {
    return { text: "", question: questionMatch[1].trim(), warnings: [], valid: false, isFallback: false };
  }

  let text = canonicalizeHeaders(cleanMarkdown(withoutReasoning));
  const firstHeader = text.indexOf(HEADERS["antecedentes clinicos"]);
  if (firstHeader > 0) text = text.slice(firstHeader);
  const sections = extractSections(text);
  if (!sections) {
    return {
      text: "",
      warnings: ["MiniMax no devolvio las tres secciones obligatorias."],
      valid: false,
      isFallback: true,
    };
  }

  const antecedentes = normalizePlaceholders(
    normalizeSectionBody(sections["antecedentes clinicos"]) || "Sin diagnóstico.",
  );
  let hallazgos = normalizePlaceholders(normalizeSectionBody(sections.hallazgos));
  const impresion = normalizePlaceholders(normalizeSectionBody(sections.impresion));
  if (!hallazgos || !impresion) {
    return {
      text: "",
      warnings: ["El informe llego incompleto."],
      valid: false,
      isFallback: true,
    };
  }

  const systematicPhrase = "Informe confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.";
  if (requireSystematicPhrase && !/informe confeccionado/i.test(hallazgos)) {
    hallazgos = `${systematicPhrase}\n${hallazgos}`;
  }

  const finalText = [
    HEADERS["antecedentes clinicos"], antecedentes, "",
    HEADERS.hallazgos, hallazgos, "",
    HEADERS.impresion, impresion,
  ].join("\n");

  // Un placeholder pendiente convierte la salida en pregunta o error. Asi la
  // usuaria nunca recibe un informe aparentemente terminado con datos vacios.
  if (/\{\{[^}]+\}\}|_{3,}/.test(finalText)) warnings.push("El informe contiene variables sin resolver.");
  if (/\b(?:di[aá]metro|saco(?:\s+herniado)?|medida|tama[nñ]o|espesor|longitud|volumen)\s+(?:de\s+)?(?:mm|cm|cc|ml)\b/i.test(finalText)) {
    warnings.push("El informe contiene una medida sin resolver.");
  }
  if (hasReasoningMarkers(finalText)) warnings.push("El informe contiene razonamiento interno.");
  const valid = warnings.length === 0;
  return { text: valid ? finalText : "", warnings, valid, isFallback: !valid };
}

export function safeReportPreview(rawText) {
  const text = cleanMarkdown(stripReasoning(rawText));
  const normalized = canonicalizeHeaders(text);
  const start = normalized.indexOf(HEADERS["antecedentes clinicos"]);
  return start === -1 ? "" : normalized.slice(start).trim();
}

export function isValidStructuredReport(value) {
  return sanitizeReport(value).valid;
}
