// Casos sinteticos sin datos de pacientes. Los 30 primeros fuerzan los
// puntos mas riesgosos; el resto recorre la biblioteca oficial exacta.

const inguinalNormalPrompts = [
  "Ecotomografía Partes Blandas Inguinal Izquierda agrega: reg ing der sin hallazgos de hernias u otras alteraciones, se explora en decubito y en bipedestacion",
  "eco inguinal izquierda agrega region inguinal derecha sin hernias en decubito y bipedestacion",
  "ecografia inguinal izq; agregar reg ing der normal, evaluada de pie y acostada",
  "eco partes blandas inguinal izquierda agrega derecha sin alteraciones ni hernias",
  "eco inguinal bilateral sin hernias, explorada en decubito y bipedestacion",
];

const hardGroups = [
  ...inguinalNormalPrompts.map((input, index) => ({
    key: `inguinal-normal-${index + 1}`,
    input,
    expectedShortcut: "ecoinguinaln",
    required: ["HALLAZGOS", "IMPRESION", "derech"],
    forbidden: ["<think>", "hernia inguinal con contenido"],
    expectedRoute: "standard",
    critical: true,
  })),
  ...[
    "eco inguinal con hernia inguinal",
    "ecoherniainguinal agrega sin signos de complicacion",
    "eco partes blandas inguinal con defecto herniario",
    "eco inguinal hernia con contenido adiposo",
    "informe ecoherniainguinal",
  ].map((input, index) => ({
    key: `inguinal-hernia-${index + 1}`,
    input,
    expectedShortcut: "ecoherniainguinal",
    required: ["HALLAZGOS", "IMPRESION", "hernia"],
    forbidden: ["<think>"],
    expectedRoute: "standard",
    critical: true,
  })),
  ...[
    "eco inguinal con hernia crural",
    "ecografia region crural agrega hernia crural",
    "eco partes blandas crural con defecto herniario",
    "ecoherniacrural agrega sin signos de complicacion",
    "informe de hernia crural",
  ].map((input, index) => ({
    key: `crural-${index + 1}`,
    input,
    expectedShortcut: "ecoherniacrural",
    required: ["HALLAZGOS", "IMPRESION", "crural"],
    forbidden: ["<think>"],
    expectedRoute: "standard",
    critical: true,
  })),
  ...[
    ["eco abdomen con esteatosis", "ecoabdomenest", "esteatosis"],
    ["ecografia abdominal con colelitiasis", "ecoabdomencolelitiasis", "calculo"],
    ["eco abdomen con esteatosis y colelitiasis", "ecoabdomen estcole", "esteatosis"],
    ["eco abdomen con colecistectomia", "ecoabdomencolecis", "colecistect"],
    ["eco abdomen normal", "ecoabdomenn", "HALLAZGOS"],
    ["eco de abdomen normal agrega esteatosis", "ecoabdomenn", "esteatosis"],
  ].map(([input, expectedShortcut, required], index) => ({
    key: `abdomen-${index + 1}`,
    input,
    expectedShortcut,
    required: [required, "IMPRESION"],
    forbidden: ["<think>"],
    expectedRoute: expectedShortcut === "ecoabdomenn" && !input.includes("agrega") ? "fast-path" : "standard",
    critical: true,
  })),
  {
    key: "variable-volumen-1",
    input: "ECO PROSTATA",
    expectedShortcut: "eco prostata",
    required: [],
    forbidden: ["<think>"],
    expectedRoute: "clarification",
    critical: true,
    risk: "variable",
  },
  {
    key: "variable-volumen-2",
    input: "ecohbpn",
    expectedShortcut: "ecohbpn",
    required: [],
    forbidden: ["<think>"],
    expectedRoute: "clarification",
    critical: true,
    risk: "variable",
  },
  ...[
    "ecografia",
    "eco region",
  ].map((input, index) => ({
    key: `ambiguedad-${index + 1}`,
    input,
    expectedShortcut: null,
    required: [],
    forbidden: ["<think>"],
    expectedRoute: "clarification",
    critical: true,
    risk: "ambiguity",
  })),
  {
    key: "contradiccion-hernia",
    input: "eco inguinal sin hernia agrega hernia inguinal",
    expectedShortcut: null,
    required: [],
    forbidden: ["<think>"],
    expectedRoute: "clarification",
    critical: true,
    risk: "contradiction",
  },
  ...[
    ["ecoinguinaln cambia region izquierda por bilateral", "bilateral"],
    ["ecoinguinaln reemplaza decubito por decubito y bipedestacion", "bipedestacion"],
  ].map(([input, required], index) => ({
    key: `edicion-${index + 1}`,
    input,
    expectedShortcut: "ecoinguinaln",
    required: [required, "IMPRESION"],
    forbidden: ["<think>"],
    expectedRoute: "standard",
    critical: true,
    risk: index === 0 ? "replace" : "change",
  })),
];

// Variantes ortograficas adicionales para completar 30 casos dificiles.
const hardCases = [...hardGroups];
for (let index = 0; hardCases.length < 30; index += 1) {
  const input = `${inguinalNormalPrompts[index % inguinalNormalPrompts.length]} agrega: sin adenopatias regionales`;
  const instructionCount = (input.match(/\b(agrega|agregar)\b/gi) ?? []).length;
  hardCases.push({
    key: `inguinal-alias-${index + 1}`,
    input,
    expectedShortcut: "ecoinguinaln",
    required: ["HALLAZGOS", "IMPRESION", "adenopat"],
    forbidden: ["<think>", "contenido omental"],
    expectedRoute: instructionCount >= 2 ? "complex" : "standard",
    critical: true,
  });
}

export function buildEvaluationCases(templates) {
  const byShortcut = new Map(templates.map((template) => [String(template.shortcut || "").toLowerCase(), template]));
  const unresolvedMeasure = (template, input) => {
    if (!template) return false;
    const content = String(template.content ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const blankCount = (content.match(/\b(?:diametro|saco(?: herniado)?|medida|tamano|espesor|longitud|volumen)\s+(?:de\s+)?(?:mm|cm|cc|ml)\b/g) ?? []).length;
    const suppliedCount = (String(input).match(/\b\d+(?:[.,]\d+)?\s*(?:mm|cm|cc|ml)\b/gi) ?? []).length;
    return blankCount > suppliedCount;
  };
  const resolvedHard = hardCases.map((item) => {
    const template = byShortcut.get(item.expectedShortcut);
    return {
      ...item,
      expectedTemplateId: template?.id ?? null,
      expectedRoute: item.expectedRoute === "clarification" || unresolvedMeasure(template, item.input)
        ? "clarification"
        : item.expectedRoute,
      hard: true,
    };
  });

  const exactCases = templates
    .filter((template) => {
      if (!template.shortcut || !template.content) return false;
      const variables = [...template.content.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)]
        .map((match) => match[1].trim().toLowerCase());
      return variables.every((name) => name === "antecedente")
        && !unresolvedMeasure(template, template.shortcut);
    })
    .slice(0, 70)
    .map((template, index) => ({
      key: `exact-${String(index + 1).padStart(3, "0")}`,
      input: template.shortcut,
      expectedTemplateId: template.id,
      required: ["HALLAZGOS", "IMPRESION"],
      forbidden: ["<think>"],
      expectedRoute: "fast-path",
      critical: false,
      hard: false,
      risk: index % 2 === 0 ? "truncation" : "reasoning-leak",
    }));

  return [...resolvedHard, ...exactCases].slice(0, 100);
}
