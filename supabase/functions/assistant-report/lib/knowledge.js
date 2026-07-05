// lib/knowledge.js
// =====================================================================
// Carga la knowledge base desde el bucket privado `assistant-knowledge` de
// Supabase Storage. Los archivos esperados son:
//   - guia-estilo.md            (siempre)
//   - diccionario-plantillas.md (siempre)
//   - plantillas-corregidas.md  (se carga por bloques por codigo)
//
// Mantenemos una cache en memoria por 10 minutos para no leer Storage en
// cada request. Es seguro porque la knowledge es del owner y cambia raro.

const CACHE_TTL_MS = 10 * 60 * 1000;

let cache = null;

const STYLE_PATH = "guia-estilo.md";
const DICTIONARY_PATH = "diccionario-plantillas.md";
const TEMPLATES_PATH = "plantillas-corregidas.md";

// Divide el archivo `Plantillas_Radiologia_Corregidas_GPT.md` por secciones
// `## <Nombre de plantilla>` y arma un Map<code, contenido>. Asi la Edge
// Function puede cargar solo la plantilla que la usuaria eligio del dropdown
// en vez de inyectar el archivo entero (~50k tokens) en cada prompt.
function parseTemplatesIndex(rawMarkdown) {
  const sections = new Map();
  if (!rawMarkdown) {
    return sections;
  }

  // Capturamos el nombre de la plantilla y su codigo (en una linea `Codigo: \`x\``).
  // Cada bloque arranca con "## <Nombre>" y termina en el siguiente "## " o EOF.
  const sectionPattern = /^##\s+(.+?)\s*$/gm;
  const codePattern = /C[oó]digo:\s*`([^`]+)`/;

  const matches = [];
  let match;
  while ((match = sectionPattern.exec(rawMarkdown)) !== null) {
    matches.push({ title: match[1].trim(), start: match.index });
  }

  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i];
    const end = i + 1 < matches.length ? matches[i + 1].start : rawMarkdown.length;
    const block = rawMarkdown.slice(current.start, end);

    const codeMatch = block.match(codePattern);
    if (!codeMatch) {
      continue;
    }
    const code = codeMatch[1].trim().toLowerCase();
    sections.set(code, block.trim());
  }

  return sections;
}

async function readText(adminClient, path) {
  const { data, error } = await adminClient.storage
    .from("assistant-knowledge")
    .download(path);
  if (error || !data) {
    throw new Error(
      `No pudimos descargar ${path} del bucket assistant-knowledge. Detalle: ${
        error?.message ?? "sin datos"
      }`,
    );
  }
  return await data.text();
}

// =====================================================================
// Selector de plantillas candidatas por keyword (RAG minimalista)
// =====================================================================
//
// Por que existe: MiniMax y modelos similares se distraen cuando reciben
// las 166 plantillas en cada prompt. Prefieren que les pasemos solo 1-5
// plantillas relevantes al input actual y elijan entre esas.
//
// Como funciona: hacemos matching por codigo + tokens, no por embeddings
// (no queremos agregar infraestructura de vector store para esto). El
// matching es determinista y rapido.
//
// Scoring:
//   - Match exacto del codigo en el input: +100 puntos (caso perfecto,
//     ej: usuaria selecciono del dropdown o escribe el codigo tal cual).
//   - Match por token del codigo (longitud >= 3) presente en el input:
//     +10 puntos por token.
//   - Match por palabra del titulo de la plantilla (heuristica suave): +5.
//
// Devuelve hasta `maxCandidates` plantillas ordenadas por score descendente.
// Solo incluye plantillas con score > 0. Si nada matchea, devuelve array
// vacio y el caller cae al diccionario completo como fallback.

function normalizeText(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenize(text) {
  return normalizeText(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

function pickCandidateTemplates({ userInput, templatesByCode, maxCandidates = 5 }) {
  if (!userInput || !templatesByCode || templatesByCode.size === 0) {
    return [];
  }

  const normalizedInput = normalizeText(userInput);
  const inputTokens = new Set(tokenize(userInput));

  const scored = [];
  for (const [code, content] of templatesByCode.entries()) {
    const normalizedCode = normalizeText(code);
    let score = 0;

    // Match exacto del codigo en el input (caso dropdown o copy-paste).
    if (normalizedInput.includes(normalizedCode)) {
      score += 100;
    }

    // Match por tokens del codigo (sin espacios ni guiones).
    const codeTokens = tokenize(code);
    for (const token of codeTokens) {
      if (inputTokens.has(token)) {
        score += 10;
      }
    }

    // Match suave por palabras del titulo de la plantilla.
    const titleMatch = content.match(/^##\s+(.+?)\s*$/m);
    if (titleMatch) {
      const titleTokens = tokenize(titleMatch[1]);
      for (const token of titleTokens) {
        if (inputTokens.has(token)) {
          score += 5;
        }
      }
    }

    if (score > 0) {
      scored.push({ code, content, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxCandidates).map((c) => ({
    code: c.code,
    content: c.content,
  }));
}

export async function loadKnowledge(adminClient, { forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && cache && now - cache.loadedAt < CACHE_TTL_MS) {
    return cache.contents;
  }

  const [guideStyle, dictionary, templatesRaw] = await Promise.all([
    readText(adminClient, STYLE_PATH),
    readText(adminClient, DICTIONARY_PATH),
    readText(adminClient, TEMPLATES_PATH).catch(() => ""),
  ]);

  const templatesByCode = parseTemplatesIndex(templatesRaw);

  cache = {
    loadedAt: now,
    contents: {
      guideStyle,
      dictionary,
      templatesRaw,
      templatesByCode,
    },
  };

  return cache.contents;
}

export { pickCandidateTemplates };