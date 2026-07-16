import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyGenerationRoute,
  extractBaseRequest,
  findMissingRequiredVariables,
  normalizeSearchText,
  resolveFastPath,
  selectTemplate,
} from "../supabase/functions/assistant-report/lib/templateSelector.js";
import {
  isValidStructuredReport,
  sanitizeReport,
  stripReasoning,
} from "../supabase/functions/assistant-report/lib/sanitize.js";
import { appendContent } from "../supabase/functions/assistant-report/lib/llm.js";
import {
  validateClinicalOutput,
  validateTemplateCompleteness,
} from "../supabase/functions/assistant-report/lib/clinicalValidation.js";

const report = (impression) => `ANTECEDENTES CLÍNICOS:\n{{antecedente}}\n\nHALLAZGOS:\nHallazgos de prueba.\n\nIMPRESIÓN:\n${impression}`;
const templates = [
  {
    source_template_id: "eco-inguinal-normal-ecografia-inguinal",
    source_hash: "normal",
    title: "Eco Inguinal - Normal",
    category: "Ecografía inguinal",
    normalized_content: report("Examen sin hallazgos patológicos."),
    variables: ["antecedente"],
    metadata: { shortcut: "ecoinguinaln" },
  },
  {
    source_template_id: "eco-inguinal-hernia-inguinal-ecografia-inguinal",
    source_hash: "hernia",
    title: "Eco Inguinal - Hernia Inguinal",
    category: "Ecografía inguinal",
    normalized_content: report("Hernia inguinal."),
    variables: ["antecedente", "medida"],
    metadata: { shortcut: "ecoherniainguinal" },
  },
  {
    source_template_id: "partes-blandas-normal",
    source_hash: "pb",
    title: "Partes blandas normal",
    category: "Ecografía partes blandas",
    normalized_content: report("Sin hallazgos."),
    variables: [],
    metadata: { shortcut: "partes blandas normal" },
  },
  {
    source_template_id: "eco-caderas-normal-ecografia-inguinal",
    source_hash: "caderas",
    title: "Eco Caderas - Normal",
    category: "Ecografía inguinal",
    normalized_content: report("Normal."),
    variables: [],
    metadata: { shortcut: "ecocaderasnormal" },
  },
  {
    source_template_id: "eco-abdomen-normal-ecografia-abdominal",
    source_hash: "abdomen-normal",
    title: "Eco abdomen - Normal",
    category: "Ecografía abdominal",
    normalized_content: `ANTECEDENTES CLÍNICOS:\n{{antecedente}}\n\nHALLAZGOS:\nInforme confeccionado basándose en imágenes representativas disponibles a distancia y comentarios del ejecutor del examen.\nHígado normal.\nVesícula biliar sin cálculos.\nVía biliar normal.\nBazo y páncreas sin alteraciones.\nRiñones normales.\nAorta abdominal conservada.\nNo se observa líquido libre intraabdominal.\n\nIMPRESIÓN:\nExamen sin hallazgos de significado patológico.`,
    variables: ["antecedente"],
    metadata: { shortcut: "ecoabdomenn" },
  },
  {
    source_template_id: "eco-abdomen-esteatosis-ecografia-abdominal",
    source_hash: "abdomen-esteatosis",
    title: "Eco abdomen - Esteatosis",
    category: "Ecografía abdominal",
    normalized_content: report("Esteatosis hepática."),
    variables: ["antecedente"],
    metadata: { shortcut: "ecoabdomenest" },
  },
];

test("normaliza abreviaturas habituales", () => {
  assert.equal(normalizeSearchText("Ecotomografía reg. ing. izq"), "ecografia region inguinal izquierda");
});

test("elige inguinal normal y no hernia para el caso reportado", () => {
  const result = selectTemplate(
    templates,
    "Ecotomografía Partes Blandas Inguinal Izquierda agrega: reg ing der sin hallazgos de hernias u otras alteraciones",
  );
  assert.equal(result.template.source_template_id, "eco-inguinal-normal-ecografia-inguinal");
});

test("elige hernia cuando es un hallazgo positivo", () => {
  const result = selectTemplate(templates, "eco inguinal con hernia inguinal");
  assert.equal(result.template.source_template_id, "eco-inguinal-hernia-inguinal-ecografia-inguinal");
});

test("elige primero la base completa y no la variante agregada", () => {
  const input = "eco de abdomen normal completo agrega esteatosis";
  assert.equal(extractBaseRequest(input), "eco abdomen normal");
  const result = selectTemplate(templates, input);
  assert.equal(result.template.source_template_id, "eco-abdomen-normal-ecografia-abdominal");
});

test("fast path solo acepta titulo o atajo exactos", () => {
  assert.equal(resolveFastPath(templates[0], "ecoinguinaln").eligible, true);
  assert.equal(resolveFastPath(templates[0], "ecoinguinaln agrega hallazgo").eligible, false);
  assert.deepEqual(
    resolveFastPath(templates[1], "ecoherniainguinal").pendingVariables,
    [],
  );
  assert.equal(classifyGenerationRoute("cambia una linea y ademas agrega otra"), "complex");
});

test("pide una variable clinica indispensable antes de generar", () => {
  const template = { variables: ["antecedente", "volumen_aproximado"] };
  assert.deepEqual(findMissingRequiredVariables(template, "eco prostata"), ["volumen aproximado"]);
  assert.deepEqual(findMissingRequiredVariables(template, "eco prostata volumen 34 cc"), []);
  assert.deepEqual(
    findMissingRequiredVariables({ variables: [], normalized_content: "Anillo con diámetro de mm." }, "eco hernia"),
    ["medida faltante"],
  );
});

test("saneador elimina think y conserva informe completo", () => {
  const raw = `<think>razonamiento privado</think>\n${report("Normal.").replace("{{antecedente}}", "Sin diagnostico.")}`;
  const result = sanitizeReport(raw);
  assert.equal(result.valid, true);
  assert.doesNotMatch(result.text, /think|razonamiento privado/i);
});

test("saneador rechaza espacios clinicos sin resolver", () => {
  const raw = report("Quiste de ___ mm.")
    .replace("{{antecedente}}", "Sin diagnóstico.");
  const result = sanitizeReport(raw);
  assert.equal(result.valid, false);
  assert.equal(result.text, "");
  assert.match(result.warnings.join(" "), /sin resolver/);
});

test("saneador rechaza razonamiento truncado sin informe", () => {
  const raw = "<think>The user is requesting an ultrasound. Let me think";
  const result = sanitizeReport(raw);
  assert.equal(result.valid, false);
  assert.equal(result.text, "");
  assert.equal(stripReasoning(raw), "");
});

test("valida las tres secciones y acumula streams delta o acumulativos", () => {
  const valid = report("Normal.").replace("{{antecedente}}", "Sin diagnostico.");
  assert.equal(isValidStructuredReport(valid), true);
  assert.equal(appendContent("HALL", "AZGOS"), "HALLAZGOS");
  assert.equal(appendContent("HALL", "HALLAZGOS"), "HALLAZGOS");
});

test("bloquea medidas y lateralidad inventadas", () => {
  const result = validateClinicalOutput({
    output: "Region derecha con nodulo de 8 mm.",
    templateContent: "Region inguinal sin alteraciones.",
    userInput: "eco inguinal izquierda",
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /8 mm|derecha/);
});

test("bloquea informes que acortan una plantilla completa", () => {
  const base = templates.find((template) => template.source_hash === "abdomen-normal").normalized_content;
  const result = validateTemplateCompleteness({
    templateContent: base,
    output: report("Esteatosis hepática.").replace("{{antecedente}}", "Sin diagnóstico."),
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /higado|vesicula|rinon|breve/i);
});

test("aplica el umbral clinico de asimetria renal", () => {
  const output = report("Asimetría renal significativa, con riñón derecho menor.")
    .replace("{{antecedente}}", "Sin diagnóstico.");
  const result = validateClinicalOutput({
    output,
    templateContent: report("Riñones sin alteraciones."),
    userInput: "riñón derecho 9,0 cm e izquierdo 10,5 cm",
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /2,0 cm/);
});
