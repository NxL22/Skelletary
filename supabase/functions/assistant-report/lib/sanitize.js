// lib/sanitize.js
// =====================================================================
// Limpia la respuesta del LLM para garantizar:
//   - Sin Markdown (sin ```, sin #, sin **, sin *, sin _ de negrita).
//   - Sin explicaciones antes ni despues del informe.
//   - Formato exacto: ANTECEDENTES CLINICOS: ... \n\n HALLAZGOS: ... \n\n IMPRESION: ...
//   - Frase sistematica en HALLAZGOS cuando aplique (ecografia).
//   - Una sola linea en blanco entre secciones, ninguna dentro.
//
// Devuelve uno de dos shapes:
//
//   - { question, text: "", warnings: [] } cuando el LLM devuelve una
//     pregunta breve (formato PREGUNTA: ...). Esto pasa cuando el modelo
//     aplica el paso 3 del algoritmo del prompt y no puede elegir una
//     variante conservadora sin arriesgar inventar hallazgos.
//
//   - { text, warnings: string[] } cuando el LLM devolvio un informe.
//     `text` es el informe limpio, `warnings` son notas para la UI.
//
// El front distingue los dos por la presencia de `question`.

const SYSTEMATIC_PHRASE =
  "Informe confeccionado basandose en imagenes representativas disponibles a distancia y comentarios del ejecutor del examen.";

// Algunos modelos devuelven la frase con tildes. Las normalizamos para que
// matchee exactamente la frase sistematica canonica.
const SYSTEMATIC_PHRASE_NORMALIZED = SYSTEMATIC_PHRASE.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

// Modalidades en las que SI se agrega la frase sistematica al inicio de
// HALLAZGOS. Doppler y otras no la llevan salvo que la plantilla base
// la incluya (en cuyo caso ya viene en el contenido).
const MODALITIES_WITH_PHRASE = new Set([
  "ecografia",
  "eco",
  "eco.",
]);

function stripCodeFences(text) {
  return text.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "");
}

function stripHeadings(text) {
  // Quita lineas que son titulos markdown (`##`, `###`, `#`).
  return text
    .split("\n")
    .map((line) => line.replace(/^\s{0,3}#{1,6}\s+/, ""))
    .join("\n");
}

function stripBoldMarkers(text) {
  // Quita ** y __ que se usan como negrita en MD. No es perfecto (no
  // distingue contexto) pero combinado con el prompt agresivo alcanza.
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2");
}

function stripBulletMarkers(text) {
  // Quita - o * al inicio de linea.
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s+/, ""))
    .join("\n");
}

function stripPreamble(text) {
  // Si el modelo arranca con algo antes del PRIMER ANTECEDENTES CLINICOS:
  // lo descartamos. Pero ojo: algunos modelos (MiniMax/M3 con reasoning
  // visible) emiten un bloque "ANTECEDENTES CLINICOS:" VACIO como parte
  // del chain-of-thought, seguido del razonamiento, y luego el bloque
  // REAL con contenido. Si agarramos el primero (vacio) y descartamos
  // todo lo anterior, perdemos el contenido bueno. Asi que agarramos
  // el ULTIMO bloque "ANTECEDENTES CLINICOS:" que tenga contenido real
  // en las lineas siguientes.
  const headerRegex = /^[ \t]*ANTECEDENTES\s+CL[IÍ]N[IÍ]COS\s*:[ \t]*$/gm;
  const allMatches = [];
  let match;
  while ((match = headerRegex.exec(text)) !== null) {
    allMatches.push({
      index: match.index,
      end: match.index + match[0].length,
    });
  }
  if (allMatches.length === 0) {
    return text;
  }

  // Buscamos el ULTIMO header que tenga contenido real inmediatamente
  // despues (no este seguido de otra linea vacia o de otro header vacio).
  for (let i = allMatches.length - 1; i >= 0; i -= 1) {
    const candidate = allMatches[i];
    const afterHeader = text.slice(candidate.end);
    // Tomamos las primeras ~5 lineas despues del header para ver si
    // tienen contenido o son parte del COT.
    const previewLines = afterHeader
      .split("\n")
      .slice(0, 5)
      .map((line) => line.trim());
    const hasRealContent = previewLines.some((line) => {
      if (!line) return false;
      // Descartamos lineas que parecen parte del COT (empiezan con
      // verbos imperativos en ingles o patrones de razonamiento).
      if (/^(Wait|Looking at|Now I|Now let|First|Therefore|So I|Thus|I need|Let me|The correct|The standard|For \w+, I|Okay|Alright)/i.test(line)) {
        return false;
      }
      // Si la siguiente "linea" es otro header (HALLAZGOS:, IMPRESION:),
      // este bloque de ANTECEDENTES esta vacio.
      if (/^(HALLAZGOS|IMPRESI[OÓ]N|ANTECEDENTES)/i.test(line)) {
        return false;
      }
      return true;
    });
    if (hasRealContent) {
      return text.slice(candidate.index);
    }
  }
  // Si ninguno tiene contenido claro, agarramos el primero como fallback
  // (mejor eso que nada: el sanitizer ya tiene fallbacks adicionales).
  return text.slice(allMatches[0].index);
}

function stripTrailingNoise(text) {
  // Cortamos cualquier cosa despues de la ultima linea de IMPRESION: valida.
  // Si hay ruido como "Nota:", "Basado en...", lo eliminamos.
  const impressionMatch = /(IMPRESI[OÓ]N:\s*[\s\S]*?)(?:\n\s*\n|\s*$)/i.exec(
    text,
  );
  if (!impressionMatch) {
    return text;
  }
  return text.slice(0, impressionMatch.index + impressionMatch[1].length).trimEnd();
}

function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

// Defensa contra chain-of-thought visible en la salida de modelos reasoning
// (MiniMax/M3, o1, etc.). Si el LLM emite su proceso de pensamiento dentro del
// content (porque el parametro `reasoning.effort` no desactivo el COT, o
// porque el modo streaming lo concatena), descartamos las lineas o bloques
// que claramente son ruido de razonamiento y no texto clinico.
//
// Que descarta:
//   - Lineas en bloque que empiezan con "Let me", "I need to", "Now I",
//     "Now let", "So I", "The correct", "The standard" y similares.
//   - Bloques en ingles predominante (un informe radiologico valido esta
//     en espanol; un parrafo extenso en ingles casi seguro es COT colado).
//   - Lineas numeradas al estilo "1. ", "2. " cuando no son parte de
//     ANATOMIA/TECNICA/INDICACIONES del informe.
//
// NO descarta hallazgos clinicos en espanol aunque contengan "se observa"
// o "compatible con" (esos pasan normales).
function stripChainOfThought(text) {
  const COT_LINE_PATTERNS = [
    /^\s*\d+\.\s+[A-Z][a-z]?\s/m, // "1. ", "2. " seguido de palabra corta en minuscula (no TEM/INDICACIONES)
    // Verbos imperativos / razonamiento del LLM en ingles.
    /^\s*Let me\b/i,
    /^\s*I need to\b/i,
    /^\s*I will\b/i,
    /^\s*I should\b/i,
    /^\s*Now I\b/i,
    /^\s*Now let\b/i,
    /^\s*So I\b/i,
    /^\s*The correct approach\b/i,
    /^\s*The standard structure\b/i,
    /^\s*For \w+, I\b/i,
    /^\s*Wait\b/i, // "Wait, looking at the template..."
    /^\s*Looking at\b/i,
    /^\s*First,?\s/i,
    /^\s*Therefore\b/i,
    /^\s*Thus\b/i,
    /^\s*Okay\b/i,
    /^\s*Alright\b/i,
    /^\s*Based on\b/i,
    /^\s*According to\b/i,
    /^\s*Let'?s\b/i,
    /^\s*I'?ll\b/i,
  ];

  const blocks = text.split(/\n\s*\n/);
  const keptBlocks = [];
  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) {
      keptBlocks.push(block);
      continue;
    }
    // Lineas individuales con patron COT.
    const lines = block.split("\n");
    let allLinesAreCot = lines.length > 0;
    const cleanedLines = [];
    for (const line of lines) {
      const isCotLine = COT_LINE_PATTERNS.some((pattern) => pattern.test(line));
      if (isCotLine) {
        allLinesAreCot = allLinesAreCot && true;
        continue; // descartar linea
      }
      cleanedLines.push(line);
    }
    const cleanedBlock = cleanedLines.join("\n").trim();
    // Bloque vacio: descartar.
    if (!cleanedBlock) {
      continue;
    }
    // Bloque entero en ingles (mas de 60% palabras tipicas en ingles) Y
    // longitud >= 80 chars: descartar.
    if (looksLikeEnglishParagraph(cleanedBlock)) {
      continue;
    }
    keptBlocks.push(block);
  }
  return keptBlocks.join("\n\n");
}

const ENGLISH_STOPWORDS = new Set([
  "the", "and", "to", "of", "a", "in", "is", "that", "this", "for",
  "with", "as", "be", "by", "or", "from", "an", "are", "it", "not",
  "have", "has", "had", "but", "on", "so", "i", "you", "we", "they",
  "would", "should", "could", "can", "will", "let", "need", "now",
  "then", "there", "these", "those", "into", "than", "about", "if",
  "no", "yes", "do", "does", "did", "what", "when", "where", "which",
  "while", "before", "after", "between", "through", "during",
]);

// Frases tipicas de chain-of-thought en modelos con reasoning visible.
// Si aparecen en cualquier parte del bloque, lo descartamos como COT.
const COT_PHRASES = [
  /\baccording to (the |my )?(rules|instructions|prompt)\b/i,
  /\blooking at (the |my |this )?(template|rules|input|prompt)\b/i,
  /\b(the |my )?(next |previous )?(section|step) is\b/i,
  /\bi'?ll (start|write|create|format|generate)\b/i,
  /\bthe correct (approach|template|answer|response)\b/i,
  /\blet'?s (start|begin|write|create|see)\b/i,
  /\bin (the |this )?(template|example) (above|below)\b/i,
];

function looksLikeEnglishParagraph(block) {
  if (block.length < 40) {
    return false;
  }
  const tokens = block.toLowerCase().match(/[a-z']+/g) ?? [];
  if (tokens.length < 8) {
    return false;
  }
  let englishCount = 0;
  let spanishCount = 0;
  const SPANISH_MARKERS = new Set([
    "el", "la", "los", "las", "de", "del", "que", "en", "un", "una",
    "con", "por", "para", "como", "sin", "sobre", "entre", "se",
    "es", "son", "no", "si", "su", "sus", "este", "esta", "estos",
    "tambien", "tampoco", "ademas", "desde", "hasta", "cuando",
  ]);
  for (const token of tokens) {
    if (ENGLISH_STOPWORDS.has(token)) {
      englishCount += 1;
    } else if (SPANISH_MARKERS.has(token)) {
      spanishCount += 1;
    }
  }
  // Si predominan palabras tipicas del ingles y casi no hay marcadores
  // espanol, es razonamiento colado.
  const englishRatio = englishCount / tokens.length;
  const spanishRatio = spanishCount / tokens.length;
  if (englishRatio > 0.15 && spanishRatio < 0.08) {
    return true;
  }
  // Si el bloque contiene frases tipicas de COT (segun los patrones
  // arriba), tambien lo descartamos aunque tenga mezcla de idiomas.
  for (const phrase of COT_PHRASES) {
    if (phrase.test(block)) {
      return true;
    }
  }
  return false;
}

function collapseTripleBlanks(text) {
  return text.replace(/\n{3,}/g, "\n\n");
}

function trimLine(line) {
  // Quita espacios al inicio y al final de cada linea, pero conserva
  // saltos de linea.
  return line.replace(/[ \t]+$/g, "").replace(/^[ \t]+/, "");
}

function findSection(text, header) {
  const regex = new RegExp(`^${escapeRegex(header)}\\s*$`, "gm");
  const match = regex.exec(text);
  if (!match) {
    return null;
  }
  return { start: match.index, end: match.index + match[0].length };
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSection(text, header) {
  const start = findSection(text, header);
  if (!start) {
    return null;
  }
  // El final de la seccion es donde arranca la siguiente seccion esperada
  // o fin del texto.
  const nextHeaders = [
    "ANTECEDENTES CLINICOS:",
    "ANTECEDENTES CLÍNICOS:",
    "HALLAZGOS:",
    "IMPRESION:",
    "IMPRESIÓN:",
  ].filter((h) => h !== header);
  let end = text.length;
  for (const next of nextHeaders) {
    const idx = findSection(text, next);
    if (idx && idx.start > start.end && idx.start < end) {
      end = idx.start;
    }
  }
  return text.slice(start.end, end).trim();
}

// Normaliza la linea de antecedentes cuando esta "vacia" o solo contiene
// variantes de "sin diagnostico". Regla del sistema: SIEMPRE "Sin diagnostico."
// (sin tilde, con punto). Asi los informes son consistentes entre todos.
// Esto evita que el LLM escriba "Sin diagnóstico", "sin antecedentes",
// "sin info", etc. y nos ahorra warnings en la UI.
const EMPTY_ANTECEDENTES_PATTERNS = [
  /^sin\s+diagn[oó]stico\.?$/i,
  /^sin\s+antecedentes\.?$/i,
  /^sin\s+antecedente\.?$/i,
  /^sin\s+info\.?$/i,
  /^sin\s+informaci[oó]n\.?$/i,
  /^no\s+refiere\s+antecedentes?\.?$/i,
  /^sin\s+diagn[oó]stico\s+previo\.?$/i,
];

function normalizeAntecedentes(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) {
    return "Sin diagnostico.";
  }
  for (const pattern of EMPTY_ANTECEDENTES_PATTERNS) {
    if (pattern.test(trimmed)) {
      return "Sin diagnostico.";
    }
  }
  return trimmed;
}

function buildStructuredReport({ antecedentes, hallazgos, impresion }) {
  const parts = ["ANTECEDENTES CLINICOS:"];
  // Regla fija del sistema: si no hay antecedentes, SIEMPRE exactamente
  // "Sin diagnostico." (sin tilde, con punto). El LLM puede entregar
  // variantes; normalizeAntecedentes las mapea a la canonica.
  parts.push(normalizeAntecedentes(antecedentes));
  parts.push("");
  parts.push("HALLAZGOS:");
  parts.push(hallazgos.trim());
  parts.push("");
  parts.push("IMPRESION:");
  parts.push(impresion.trim());
  return parts.join("\n");
}

function ensureSystematicPhrase(hallazgos) {
  // Si la primera linea no contiene la frase sistematica (case + accent
  // insensitive), la anteponemos. Esto es defensa en profundidad: el prompt
  // ya la pide, pero si el modelo se olvida, la sanitizacion la agrega.
  const firstLine = hallazgos.split("\n")[0] ?? "";
  const normalized = firstLine.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (normalized.includes(SYSTEMATIC_PHRASE_NORMALIZED)) {
    return hallazgos;
  }
  return `${SYSTEMATIC_PHRASE}\n${hallazgos.trim()}`.trim();
}

function shouldInjectSystematicPhrase({ templateCode, hallazgos }) {
  if (!templateCode) {
    return false;
  }
  const lowered = templateCode.toLowerCase();
  for (const modality of MODALITIES_WITH_PHRASE) {
    if (lowered.includes(modality)) {
      return true;
    }
  }
  // Si la plantilla ya incluye la frase, no la duplicamos.
  const normalized = hallazgos
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (normalized.includes(SYSTEMATIC_PHRASE_NORMALIZED)) {
    return false;
  }
  return false;
}

export function sanitizeReport(
  rawText,
  { templateCode = null, hadModality = false } = {},
) {
  const warnings = [];
  if (!rawText || typeof rawText !== "string") {
    return {
      text: "",
      warnings: ["El asistente devolvio una respuesta vacia."],
    };
  }

  // ===========================================================================
  // Detector de pregunta breve (paso 3 del algoritmo del prompt).
  // ===========================================================================
  //
  // El LLM, cuando aplica la regla "variante conservadora o pregunta breve",
  // puede responder con el formato:
  //
  //   PREGUNTA: <texto de la pregunta>
  //
  // Antes de pasar por todo el pipeline de limpieza, chequeamos esto y
  // devolvemos un shape distinto. Asi el front sabe que tiene que mostrar
  // una pregunta y dejar a la usuaria responder, en vez de mostrar el
  // informe.
  //
  // Condiciones para considerarlo una pregunta (no un informe):
  //   1. El texto limpio empieza con "PREGUNTA:" (case-insensitive, con o
  //      sin acento, con espacio flexible despues del :).
  //   2. NO contiene "ANTECEDENTES CLINICOS:" antes del primer "PREGUNTA:".
  //   3. Despues del prefijo hay contenido real (no esta vacio).
  //
  // Si pasa todas, devolvemos { question, text: "", warnings: [] }.
  const preguntaMatch = rawText.match(/^\s*PREGUNTA\s*:\s*(.+)/is);
  const hasAntecedentesHeader =
    /\bANTECEDENTES\s+CLINI?COS\s*:/i.test(rawText.split(/PREGUNTA\s*:/i)[0] ?? "");
  if (preguntaMatch && !hasAntecedentesHeader) {
    const questionText = preguntaMatch[1].trim();
    if (questionText) {
      return {
        text: "",
        question: questionText,
        warnings: [],
      };
    }
  }

  let text = normalizeLineEndings(rawText);
  text = stripCodeFences(text);
  text = stripHeadings(text);
  text = stripBoldMarkers(text);
  text = stripBulletMarkers(text);
  text = stripPreamble(text);
  text = stripChainOfThought(text);
  text = stripTrailingNoise(text);
  text = text
    .split("\n")
    .map(trimLine)
    .join("\n")
    .trim();

  // Extraemos las 3 secciones canonicales y reensamblamos.
  let antecedentes = extractSection(text, "ANTECEDENTES CLINICOS:");
  if (!antecedentes) {
    antecedentes = extractSection(text, "ANTECEDENTES CLÍNICOS:");
  }
  let hallazgos = extractSection(text, "HALLAZGOS:");
  let impresion = extractSection(text, "IMPRESION:");
  if (!impresion) {
    impresion = extractSection(text, "IMPRESIÓN:");
  }

  if (!antecedentes) {
    warnings.push("No se detecto la seccion ANTECEDENTES CLINICOS.");
  }
  if (!hallazgos) {
    warnings.push("No se detecto la seccion HALLAZGOS.");
  }
  if (!impresion) {
    warnings.push("No se detecto la seccion IMPRESION.");
  }

  // Validacion de consistencia interna (defense in depth: complementa la
  // checklist del paso 6 del prompt del LLM). Si el informe tiene
  // contradicciones clinicas obvias, devolvemos un warning. NO rechazamos
  // el informe: la usuaria debe ver el output igual y decidir.
  //
  // Que detecta (heuristicas suaves):
  //   - Higado descrito como normal (ecogenicidad/forma/tamano normales)
  //     Y a la vez mencion de esteatosis o higado graso.
  //   - Vesicula descrita como "sin calculos" Y "con calculos" en el mismo
  //     informe.
  //
  // Esto NO compara con la plantilla original (eso seria trampa: diff
  // forzado). Solo verifica consistencia interna del output.
  if (hallazgos) {
    const normalizedHallazgos = hallazgos
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const liverNormal = /higado[^.]*(forma|tamano|ecogenicidad)\s+normales?/.test(
      normalizedHallazgos,
    );
    const liverSteatosis = /esteatosis|higado\s+graso/.test(normalizedHallazgos);
    if (liverNormal && liverSteatosis) {
      warnings.push(
        "El higado aparece como normal y con esteatosis en el mismo informe. Revisa.",
      );
    }

    const gallbladderNoStones = /vesicula[^.]*sin\s+calculos|sin\s+imagenes?\s+sugerentes?\s+de\s+litiasis/.test(
      normalizedHallazgos,
    );
    const gallbladderStones = /vesicula[^.]*con\s+calculos|calculos\s+moviles|wall.echo.shadow|wes/.test(
      normalizedHallazgos,
    );
    if (gallbladderNoStones && gallbladderStones) {
      warnings.push(
        "La vesicula aparece con calculos y sin calculos en el mismo informe. Revisa.",
      );
    }
  }

  // Defense in depth: si NO se detecta ninguna de las 3 secciones, esto no
  // parece un informe radiologico. Hay tres modos de fallback segun el
  // contexto del input original:
  //
  //   1. Input fuera de dominio (no contenia keywords de modalidad):
  //      fallback generico, tono Skelly. La usuaria intento hablarle
  //      de otra cosa.
  //
  //   2. Input medico + el LLM devolvio texto sin secciones:
  //      devolvemos el texto crudo del LLM con un warning claro. No
  //      perdemos lo que dijo el modelo (puede haber sido una respuesta
  //      conversacional o un informe mal formateado que la usuaria igual
  //      quiera leer).
  //
  //   3. Input medico + el LLM no devolvio texto:
  //      fallback de error de IA con sugerencia para reformular.
  if (!antecedentes && !hallazgos && !impresion) {
    const cleanedText = (text ?? "").trim();

    if (!hadModality) {
      // Modo 1: input fuera de dominio.
      return {
        text: "Skelly solo redacta informes radiologicos.",
        warnings: [
          "Tu mensaje no parece un pedido de informe. Ej: 'eco abdomen esteatosis', 'rx torax', 'doppler carotideo'.",
        ],
        isFallback: true,
      };
    }

    if (cleanedText.length > 0) {
      // Modo 2: input medico + el LLM devolvio texto crudo.
      return {
        text: cleanedText,
        warnings: [
          "La respuesta no parece un informe radiologico. Revisa antes de usar.",
        ],
        isFallback: true,
      };
    }

    // Modo 3: input medico + LLM no devolvio nada util.
    return {
      text: "Skelly no recibio una respuesta util del asistente.",
      warnings: [
        "Podes intentar de nuevo o reformular el pedido con mas detalle.",
      ],
      isFallback: true,
    };
  }

  // Si falta alguna seccion (pero hay al menos una), devolvemos el texto
  // crudo saneado para que la usuaria al menos vea lo que llego.
  if (!antecedentes || !hallazgos || !impresion) {
    return {
      text: collapseTripleBlanks(text),
      warnings,
      isFallback: false,
    };
  }

  if (shouldInjectSystematicPhrase({ templateCode, hallazgos })) {
    hallazgos = ensureSystematicPhrase(hallazgos);
  }

  const finalText = buildStructuredReport({
    antecedentes,
    hallazgos,
    impresion,
  });

  return {
    text: collapseTripleBlanks(finalText),
    warnings,
    isFallback: false,
  };
}