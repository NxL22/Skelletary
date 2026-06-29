const VARIABLE_REGEX = /{{\s*([^}]+)\s*}}/g;
const STRUCTURED_SECTION_HEADINGS = new Set([
  "antecedentes clinicos",
  "hallazgos",
  "hallazgo",
  "impresion",
  "impresion diagnostica",
]);
const ANTECEDENT_VARIABLE_NAME = "antecedente";
const ANTECEDENT_SECTION_LABEL = "ANTECEDENTES CLINICOS:";
const EMPTY_VARIABLE_FALLBACK = "___";
const ANTECEDENT_FALLBACK = "Sin diagnóstico";

function normalizeTextKey(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[:.]+$/g, "")
    .trim();
}

function matchStructuredHeading(line = "") {
  const normalizedLine = normalizeTextKey(line);

  for (const heading of STRUCTURED_SECTION_HEADINGS) {
    if (normalizedLine === heading || normalizedLine.startsWith(`${heading}:`)) {
      return heading;
    }
  }

  return null;
}

export function isAntecedentVariable(variableName = "") {
  return normalizeTextKey(variableName) === ANTECEDENT_VARIABLE_NAME;
}

export function getVariableFallbackValue(variableName = "") {
  return isAntecedentVariable(variableName) ? ANTECEDENT_FALLBACK : EMPTY_VARIABLE_FALLBACK;
}

export function ensureRequiredTemplateVariables(content = "") {
  const lines = `${content ?? ""}`
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""));

  if (
    [...`${content ?? ""}`.matchAll(VARIABLE_REGEX)].some((match) =>
      isAntecedentVariable(match[1] || ""),
    )
  ) {
    return lines.join("\n").trim();
  }

  const antecedentHeadingIndex = lines.findIndex(
    (line) => matchStructuredHeading(line) === "antecedentes clinicos",
  );

  // Si el template no trae antecedentes, lo agregamos al inicio para que todas
  // las plantillas compartan la misma puerta de entrada al contexto clinico.
  if (antecedentHeadingIndex === -1) {
    const body = lines.join("\n").trim();
    return [ANTECEDENT_SECTION_LABEL, `{{${ANTECEDENT_VARIABLE_NAME}}}`, "", body]
      .filter((part, index, parts) => !(part === "" && parts[index + 1] === ""))
      .join("\n")
      .trim();
  }

  let nextSectionIndex = lines.length;

  for (let index = antecedentHeadingIndex + 1; index < lines.length; index += 1) {
    if (matchStructuredHeading(lines[index])) {
      nextSectionIndex = index;
      break;
    }
  }

  const nextSectionLines = lines.slice(nextSectionIndex).filter(
    (line, index, array) => !(index === 0 && !line.trim() && array[1]),
  );

  return [
    ...lines.slice(0, antecedentHeadingIndex),
    ANTECEDENT_SECTION_LABEL,
    `{{${ANTECEDENT_VARIABLE_NAME}}}`,
    ...(nextSectionLines.length ? [""] : []),
    ...nextSectionLines,
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractVariables(content = "") {
  const found = new Set();
  const preparedContent = ensureRequiredTemplateVariables(content);

  for (const match of preparedContent.matchAll(VARIABLE_REGEX)) {
    const variableName = match[1]?.trim();

    if (variableName) {
      found.add(variableName);
    }
  }

  return [...found];
}

export function fillVariables(content = "", values = {}) {
  const preparedContent = ensureRequiredTemplateVariables(content);

  return preparedContent.replace(VARIABLE_REGEX, (_, variableName) => {
    const key = variableName.trim();
    const value = values[key];
    return value?.trim() ? value.trim() : getVariableFallbackValue(key);
  });
}

export function blankVariables(content = "") {
  const preparedContent = ensureRequiredTemplateVariables(content);

  return preparedContent.replace(VARIABLE_REGEX, (_, variableName) =>
    getVariableFallbackValue(variableName),
  );
}

export function hasVariables(content = "") {
  return extractVariables(content).length > 0;
}
