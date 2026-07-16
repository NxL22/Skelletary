// Validaciones clinicas conservadoras posteriores al modelo.
// No reemplazan la revision medica: bloquean invenciones mecanicamente
// detectables antes de que la respuesta llegue a la interfaz.

const MEASURE_PATTERN = /\b\d+(?:[.,]\d+)?\s*(?:mm|cm|cc|ml|g|gr|%|semanas?|dias?|meses?|anos?)\b/gi;
const LATERALITY_GROUPS = [
  ["izquierda", "izquierdo"],
  ["derecha", "derecho"],
  ["bilateral"],
];
const CLINICAL_TERMS = [
  "hernia", "hematoma", "coleccion", "quiste", "celulitis", "desgarro",
  "tendinosis", "tendinopatia", "litiasis", "colelitiasis", "esteatosis",
  "polipo", "adenopatia", "tumor", "fractura", "trombosis", "derrame",
];

const ANATOMY_CONCEPTS = [
  ["higado"], ["vesicula"], ["via biliar"], ["rinon", "rinones"],
  ["bazo"], ["pancreas"], ["aorta"], ["vejiga"], ["prostata"],
  ["utero"], ["ovario", "ovarios"], ["tiroides"], ["testiculo", "testiculos"],
  ["inguinal"], ["crural"], ["hombro"], ["rodilla"], ["cadera"],
  ["tobillo"], ["muneca"], ["mama"], ["liquido libre"],
];

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeasures(value) {
  return [...normalize(value).matchAll(MEASURE_PATTERN)].map((match) =>
    match[0].replace(",", ".").replace(/\s+/g, " ")
  );
}

function validateRenalAsymmetry({ normalizedOutput, normalizedTemplate, normalizedInput }) {
  const errors = [];
  const mentionsAsymmetry = /asimetria renal|rinon.{0,35}\bmenor\b|\bmenor\b.{0,35}rinon/.test(normalizedOutput);
  if (mentionsAsymmetry && !/asimetria renal|rinon.{0,35}\bmenor\b/.test(normalizedTemplate)) {
    const lengths = [...normalizedInput.matchAll(/\b(\d+(?:[.,]\d+)?)\s*cm\b/g)]
      .map((match) => Number(match[1].replace(",", ".")))
      .filter(Number.isFinite);
    const difference = lengths.length >= 2 ? Math.abs(lengths[0] - lengths[1]) : null;
    if (difference === null || difference < 2) {
      errors.push("Asimetria renal no autorizada: requiere dos longitudes con diferencia de al menos 2,0 cm.");
    }
  }

  const callsKidneyEnlarged = /rinon.{0,35}\b(aumentado|nefromegalia)\b|\b(aumentado|nefromegalia)\b.{0,35}rinon/.test(normalizedOutput);
  if (callsKidneyEnlarged && !/aumentado|nefromegalia/.test(`${normalizedTemplate} ${normalizedInput}`)) {
    errors.push("No hay evidencia independiente para informar nefromegalia.");
  }
  return errors;
}

function countClinicalWords(value) {
  return normalize(value)
    .replace(/antecedentes clinicos|hallazgos|impresion/g, " ")
    .replace(/\{\{[^}]+\}\}|_+/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3)
    .length;
}

export function validateTemplateCompleteness({ output, templateContent }) {
  const errors = [];
  const normalizedOutput = normalize(output);
  const normalizedTemplate = normalize(templateContent);

  const missingConcepts = ANATOMY_CONCEPTS
    .filter((aliases) => aliases.some((alias) => normalizedTemplate.includes(alias)))
    .filter((aliases) => !aliases.some((alias) => normalizedOutput.includes(alias)))
    .map((aliases) => aliases[0]);
  if (missingConcepts.length > 0) {
    errors.push(`La respuesta acorto la plantilla y omitio: ${missingConcepts.join(", ")}.`);
  }

  const outputMeasures = extractMeasures(normalizedOutput);
  const missingMeasures = [...new Set(extractMeasures(normalizedTemplate))]
    .filter((measure) => !outputMeasures.includes(measure));
  if (missingMeasures.length > 0) {
    errors.push(`La respuesta elimino medidas de la plantilla: ${missingMeasures.join(", ")}.`);
  }

  const templateWords = countClinicalWords(normalizedTemplate);
  const outputWords = countClinicalWords(normalizedOutput);
  if (templateWords >= 35 && outputWords < Math.floor(templateWords * 0.55)) {
    errors.push("La respuesta es demasiado breve para provenir de la plantilla completa.");
  }

  return { valid: errors.length === 0, errors };
}

export function validateClinicalOutput({ output, templateContent, userInput }) {
  const errors = [];
  const normalizedOutput = normalize(output);
  const allowedContext = `${normalize(templateContent)} ${normalize(userInput)}`;

  const allowedMeasures = new Set(extractMeasures(allowedContext));
  const inventedMeasures = extractMeasures(normalizedOutput).filter((measure) => !allowedMeasures.has(measure));
  if (inventedMeasures.length > 0) {
    errors.push(`Medidas no autorizadas: ${[...new Set(inventedMeasures)].join(", ")}.`);
  }

  for (const group of LATERALITY_GROUPS) {
    const used = group.find((lateralidad) => normalizedOutput.includes(lateralidad));
    const allowed = group.some((lateralidad) => allowedContext.includes(lateralidad));
    if (used && !allowed) {
      errors.push(`Lateralidad no autorizada: ${used}.`);
    }
  }

  for (const term of CLINICAL_TERMS) {
    if (normalizedOutput.includes(term) && !allowedContext.includes(term)) {
      errors.push(`Hallazgo no autorizado: ${term}.`);
    }
  }

  errors.push(...validateRenalAsymmetry({
    normalizedOutput,
    normalizedTemplate: normalize(templateContent),
    normalizedInput: normalize(userInput),
  }));

  const completeness = validateTemplateCompleteness({ output, templateContent });
  errors.push(...completeness.errors);

  return { valid: errors.length === 0, errors };
}

export { extractMeasures };
