// Seleccion deterministica de la plantilla oficial.
//
// La IA no debe adivinar entre varias plantillas clinicamente distintas.
// Este modulo normaliza el lenguaje habitual de las radiologas, puntua la
// biblioteca privada y entrega una sola plantilla o una pregunta breve.

const CACHE_TTL_MS = 10 * 60 * 1000;
const SELECTOR_VERSION = "deterministic-complete-v2";

let templateCache = null;

const GENERIC_TOKENS = new Set([
  "eco", "ecografia", "ecotomografia", "partes", "blandas", "examen",
  "informe", "region", "agrega", "agregar", "cambia", "cambiar",
  "reemplaza", "reemplazar", "izquierda", "derecha", "bilateral",
]);

const ANATOMY_TOKENS = new Set([
  "inguinal", "crural", "abdomen", "abdominal", "pelvis", "hombro",
  "rodilla", "cadera", "tobillo", "muneca", "mano", "pie", "cuello",
  "tiroides", "mamaria", "mama", "testicular", "escrotal", "renal",
  "vesical", "prostata", "torax", "cerebro", "craneo", "columna",
  "lumbar", "cervical", "dorsal", "muslo", "pantorrilla", "codo",
]);

const PATHOLOGY_TOKENS = new Set([
  "hernia", "hernioplastia", "hematoma", "coleccion", "quiste",
  "celulitis", "desgarro", "tendinosis", "tendinopatia", "litiasis",
  "colelitiasis", "esteatosis", "polipo", "masa", "adenopatia",
  "colecistectomia", "colesterolosis", "colesterolsis",
]);

const MODIFICATION_PATTERN = /\b(agrega|agregar|anade|anadir|cambia|cambiar|reemplaza|reemplazar|quita|quitar|elimina|eliminar|modifica|modificar)\b/i;

export function normalizeSearchText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\becotomografia\b/g, "ecografia")
    .replace(/\b(completo|completa)\b/g, " ")
    .replace(/\bde\b/g, " ")
    .replace(/\breg\.?\s+ing\.?\b/g, "region inguinal")
    .replace(/\bing\.?\b/g, "inguinal")
    .replace(/\bizq\.?\b/g, "izquierda")
    .replace(/\bder\.?\b/g, "derecha")
    .replace(/\bbiped\.?\b/g, "bipedestacion")
    .replace(/\bcaderas\b/g, "cadera")
    .replace(/\brodillas\b/g, "rodilla")
    .replace(/\bhombros\b/g, "hombro")
    .replace(/\babdominal\b/g, "abdomen")
    .replace(/\bherniari[oa]s?\b/g, "hernia")
    .replace(/\bcolecistectomizad[oa]s?\b/g, "colecistectomia")
    .replace(/\bcolecistecomizad[oa]s?\b/g, "colecistectomia")
    .replace(/\bcolecistectomias?\b/g, "colecistectomia")
    .replace(/\bcalculos?\b/g, "colelitiasis")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractBaseRequest(value) {
  const normalized = normalizeSearchText(value);
  const modification = normalized.match(MODIFICATION_PATTERN);

  // Todo lo anterior al verbo de edicion identifica la plantilla completa.
  // Los hallazgos posteriores se aplican despues y nunca deben cambiar al azar
  // la base elegida (p. ej. "abdomen normal agrega esteatosis").
  return modification?.index > 0
    ? normalized.slice(0, modification.index).trim()
    : normalized;
}

function tokenize(value) {
  return normalizeSearchText(value).split(" ").filter((token) => token.length >= 3);
}

function includesPhrase(haystack, needle) {
  return Boolean(needle) && (` ${haystack} `).includes(` ${needle} `);
}

function hasNormalIntent(input) {
  return /\b(normal|sin hallazgos|sin alteraciones|sin hernias?|no se (observan|identifican|aprecian))\b/.test(input);
}

function hasNegatedPathology(input, pathology) {
  const escaped = pathology.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:sin|no(?:\\s+se)?(?:\\s+observan|\\s+identifican|\\s+aprecian)?)[^.;\\n]{0,35}\\b${escaped}s?\\b`).test(input);
}

export function findContradictoryPathology(value) {
  const clauses = normalizeSearchText(value).split(
    /\b(?:agrega|agregar|anade|anadir|cambia|cambiar|reemplaza|reemplazar|modifica|modificar)\b/,
  );
  for (const pathology of PATHOLOGY_TOKENS) {
    let hasPositive = false;
    let hasNegative = false;
    for (const clause of clauses) {
      if (!includesPhrase(clause, pathology) && !includesPhrase(clause, `${pathology}s`)) continue;
      if (hasNegatedPathology(clause, pathology)) hasNegative = true;
      else hasPositive = true;
    }
    if (hasPositive && hasNegative) return pathology;
  }
  return null;
}

function scoreTemplate(template, normalizedInput) {
  const title = normalizeSearchText(template.title);
  const category = normalizeSearchText(template.category);
  const shortcut = normalizeSearchText(template.metadata?.shortcut);
  const searchable = `${title} ${category} ${shortcut}`.trim();
  const inputTokens = new Set(tokenize(normalizedInput));
  const searchableTokens = new Set(tokenize(searchable));
  let score = 0;
  const reasons = [];

  if (normalizedInput === shortcut) {
    score += 400;
    reasons.push("atajo");
  } else if (
    includesPhrase(normalizedInput, shortcut)
    && (shortcut.length >= 10 || shortcut.split(" ").length >= 2)
  ) {
    score += 300;
    reasons.push("atajo");
  }
  if (includesPhrase(normalizedInput, title)) {
    score += 120;
    reasons.push("titulo");
  }
  if (includesPhrase(normalizedInput, category)) {
    score += 80;
    reasons.push("categoria");
  }

  for (const token of inputTokens) {
    if (!searchableTokens.has(token)) continue;
    if (ANATOMY_TOKENS.has(token)) score += 42;
    else if (PATHOLOGY_TOKENS.has(token)) score += 48;
    else if (GENERIC_TOKENS.has(token)) score += 2;
    else score += 8;
  }

  // La region anatomica concreta manda sobre categorias paraguas. Por ejemplo,
  // "inguinal" debe superar "partes blandas" aunque ambas frases aparezcan.
  const titleTokens = new Set(tokenize(title));
  const categoryTokens = new Set(tokenize(category));
  for (const anatomy of ANATOMY_TOKENS) {
    if (!inputTokens.has(anatomy)) continue;
    if (titleTokens.has(anatomy)) score += 90;
    else if (categoryTokens.has(anatomy)) score += 45;
    else if (/partes blandas/.test(category)) score -= 30;
  }
  for (const anatomy of ANATOMY_TOKENS) {
    const isNeighborLabel = (
      anatomy === "inguinal"
      && inputTokens.has("crural")
      && titleTokens.has("crural")
    ) || (
      anatomy === "crural"
      && inputTokens.has("inguinal")
      && titleTokens.has("inguinal")
    );
    if (titleTokens.has(anatomy) && !inputTokens.has(anatomy) && !isNeighborLabel) score -= 70;
  }

  const normalIntent = hasNormalIntent(normalizedInput);
  const positivePathologies = [...PATHOLOGY_TOKENS].filter((term) =>
    inputTokens.has(term) && !hasNegatedPathology(normalizedInput, term)
  );
  const isNormalTemplate = /\bnormal\b/.test(title) || /sin hallazgos/.test(title);

  // Una hernia inguinal y una crural son variantes incompatibles. La region
  // escrita por la radiologa debe romper el empate sin pedirle que repita datos.
  if (positivePathologies.includes("hernia") && inputTokens.has("inguinal")) {
    if (includesPhrase(title, "hernia inguinal")) score += 100;
    if (includesPhrase(title, "hernia crural")) score -= 100;
  }
  if (positivePathologies.includes("hernia") && inputTokens.has("crural")) {
    if (includesPhrase(title, "hernia crural")) score += 100;
    if (includesPhrase(title, "hernia inguinal")) score -= 100;
  }

  if (isNormalTemplate && (normalIntent || positivePathologies.length === 0)) {
    score += normalIntent ? 75 : 35;
    reasons.push("variante-normal");
  }

  for (const pathology of PATHOLOGY_TOKENS) {
    if (!searchableTokens.has(pathology)) continue;
    if (hasNegatedPathology(normalizedInput, pathology)) {
      score -= 140;
      reasons.push(`negacion-${pathology}`);
    } else if (!inputTokens.has(pathology) && !isNormalTemplate) {
      score -= 30;
    }
  }

  // "Crural" e "inguinal" son variantes vecinas, pero no equivalentes.
  if (inputTokens.has("crural") && searchableTokens.has("inguinal") && !searchableTokens.has("crural")) {
    score -= 60;
  }
  if (inputTokens.has("inguinal") && searchableTokens.has("crural") && !searchableTokens.has("inguinal")) {
    score -= 45;
  }

  return { score, reasons };
}

export async function loadActiveTemplates(adminClient, { forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && templateCache && now - templateCache.loadedAt < CACHE_TTL_MS) {
    return templateCache.items;
  }

  const { data, error } = await adminClient
    .from("assistant_ai_templates")
    .select("source_template_id, source_hash, title, category, normalized_content, variables, metadata, status")
    .eq("status", "active");
  if (error) {
    throw new Error(`No pudimos cargar la biblioteca privada: ${error.message}`);
  }

  const items = Array.isArray(data) ? data : [];
  templateCache = { loadedAt: now, items };
  return items;
}

export function selectTemplate(templates, userInput) {
  const contradiction = findContradictoryPathology(userInput);
  if (contradiction) {
    return {
      question: `¿Debo informar presencia o ausencia de ${contradiction}?`,
      ranked: [],
      selectorVersion: SELECTOR_VERSION,
    };
  }
  const normalizedInput = extractBaseRequest(userInput);
  const ranked = templates
    .map((template) => ({ template, ...scoreTemplate(template, normalizedInput) }))
    .sort((left, right) => right.score - left.score || left.template.title.localeCompare(right.template.title));

  const first = ranked[0];
  const second = ranked[1];
  if (!first || first.score < 35) {
    return {
      question: "¿Qué examen y región anatómica necesitas informar?",
      ranked: ranked.slice(0, 3),
      selectorVersion: SELECTOR_VERSION,
    };
  }

  const firstIsExact = first.reasons.includes("atajo") || first.reasons.includes("titulo");
  const hasSpecificAnatomy = [...ANATOMY_TOKENS].some((term) => tokenize(normalizedInput).includes(term));
  if (!firstIsExact && !hasSpecificAnatomy && second && first.score - second.score < 8) {
    return {
      question: "¿Qué examen y región anatómica necesitas informar?",
      ranked: ranked.slice(0, 3),
      selectorVersion: SELECTOR_VERSION,
    };
  }

  const hasExplicitPathology = [...PATHOLOGY_TOKENS].some((term) =>
    normalizedInput.includes(term) && !hasNegatedPathology(normalizedInput, term)
  );
  const exactSelection = firstIsExact;
  if (hasExplicitPathology && !exactSelection && second && first.score - second.score < 8) {
    return {
      question: "Hay más de una variante posible. ¿Cuál es el hallazgo principal que debe quedar en la impresión?",
      ranked: ranked.slice(0, 3),
      selectorVersion: SELECTOR_VERSION,
    };
  }

  return {
    template: first.template,
    score: first.score,
    reasons: first.reasons,
    ranked: ranked.slice(0, 3),
    selectorVersion: SELECTOR_VERSION,
  };
}

export function resolveFastPath(template, userInput) {
  const normalizedInput = normalizeSearchText(userInput);
  const title = normalizeSearchText(template.title);
  const shortcut = normalizeSearchText(template.metadata?.shortcut);
  const isExact = normalizedInput === title || (shortcut && normalizedInput === shortcut);
  if (!isExact || MODIFICATION_PATTERN.test(userInput)) {
    return { eligible: false, pendingVariables: [] };
  }

  const content = String(template.normalized_content ?? "");
  const pendingVariables = [...content.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)]
    .map((match) => normalizeSearchText(match[1]))
    .filter((name) => name !== "antecedente");
  if (pendingVariables.length > 0) {
    return { eligible: false, pendingVariables: [...new Set(pendingVariables)] };
  }

  const text = content
    .replace(/\{\{\s*antecedente\s*\}\}/gi, "Sin diagnóstico.")
    .trim();
  return { eligible: true, text, pendingVariables: [] };
}

export function findMissingRequiredVariables(template, userInput) {
  const variables = Array.isArray(template?.variables) ? template.variables : [];
  const input = normalizeSearchText(userInput);
  const hasExplicitVolume = /\b\d+(?:[.,]\d+)?\s*(?:cc|cm3|ml)\b/i.test(String(userInput ?? ""));

  const missingVariables = variables
    .map((name) => normalizeSearchText(name))
    .filter((name) => name && name !== "antecedente")
    .filter((name) => {
      if (name.includes("volumen")) return !hasExplicitVolume;
      return !input.includes(name);
    });

  // Algunas plantillas historicas tienen "diametro de mm" sin {{variable}}.
  // Las tratamos como dato obligatorio para no copiar un hueco ni inventarlo.
  const normalizedContent = normalizeSearchText(template?.normalized_content);
  const blankMeasurePattern = /\b(?:diametro|saco(?: herniado)?|medida|tamano|espesor|longitud|volumen)\s+(?:de\s+)?(?:mm|cm|cc|ml)\b/g;
  const blankMeasureCount = (normalizedContent.match(blankMeasurePattern) ?? []).length;
  const suppliedMeasureCount = (String(userInput ?? "").match(/\b\d+(?:[.,]\d+)?\s*(?:mm|cm|cc|ml)\b/gi) ?? []).length;
  if (blankMeasureCount > suppliedMeasureCount) missingVariables.push("medida faltante");

  return [...new Set(missingVariables)];
}

export function classifyGenerationRoute(userInput) {
  const matches = normalizeSearchText(userInput).match(/\b(agrega|agregar|cambia|cambiar|reemplaza|reemplazar|quita|quitar|elimina|eliminar|modifica|modificar)\b/g) ?? [];
  const hasMultipleInstructions = matches.length >= 2 || /\b(ademas|tambien|por otra parte)\b/.test(normalizeSearchText(userInput));
  return hasMultipleInstructions ? "complex" : "standard";
}

export { SELECTOR_VERSION };
