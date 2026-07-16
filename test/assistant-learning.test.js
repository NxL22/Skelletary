import test from "node:test";
import assert from "node:assert/strict";
import {
  correctionSummary,
  extractVariables,
  generalizeText,
  sanitizeClinicalText,
} from "../supabase/functions/assistant-feedback/lib/learning.js";

test("separa medidas del conocimiento reusable", () => {
  const variables = extractVariables("nodulo de 8 mm", "Mide 8 mm y volumen 2,5 cc");
  assert.deepEqual(variables.map((item) => item.value), ["8 mm", "2,5 cc"]);
  assert.equal(generalizeText("Nodulo de 8 mm", variables), "Nodulo de {{medida_1}}");
});

test("bloquea identificadores antes de persistir", () => {
  const result = sanitizeClinicalText("Paciente: Maria Perez, RUT: 12.345.678-5");
  assert.equal(result.blocked, true);
  assert.match(result.text, /DATO_PROTEGIDO/);
});

test("distingue aceptacion de correccion", () => {
  assert.equal(correctionSummary("Informe final", "Informe final").accepted, true);
  const corrected = correctionSummary("Linea vieja", "Linea nueva");
  assert.equal(corrected.accepted, false);
  assert.deepEqual(corrected.addedLines, ["Linea nueva"]);
});
