import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { buildEvaluationCases } from "./assistant-eval-cases.mjs";
import { buildPrompt, PROMPT_VERSION } from "../supabase/functions/assistant-report/lib/prompt.js";
import { callLlmStream } from "../supabase/functions/assistant-report/lib/llm.js";
import { sanitizeReport } from "../supabase/functions/assistant-report/lib/sanitize.js";
import { validateClinicalOutput } from "../supabase/functions/assistant-report/lib/clinicalValidation.js";
import {
  classifyGenerationRoute,
  findMissingRequiredVariables,
  resolveFastPath,
  selectTemplate,
} from "../supabase/functions/assistant-report/lib/templateSelector.js";

const env = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} en el entorno.`);
  return value;
};
const templatesSource = JSON.parse(await readFile(new URL("../src/data/defaultTemplates.json", import.meta.url), "utf8"));
const templates = templatesSource.map((template) => ({
  source_template_id: template.id,
  source_hash: "local-eval",
  title: template.title,
  category: template.category,
  normalized_content: template.content,
  variables: [...new Set([...template.content.matchAll(/\{\{([^}]+)\}\}/g)].map((match) => match[1].trim()))],
  metadata: { shortcut: template.shortcut || "" },
}));
const cases = buildEvaluationCases(templatesSource);
if (cases.length !== 100) throw new Error(`El set debe tener 100 casos; tiene ${cases.length}.`);

const supabase = createClient(
  env("VITE_SUPABASE_URL"),
  process.env.SUPABASE_SERVICE_ROLE_KEY || env("SUPABASE_SECRET_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const config = {
  apiKey: env("MINIMAX_API_KEY"),
  baseUrl: process.env.MINIMAX_BASE_URL || "https://api.minimax.io/v1",
  serviceTier: process.env.MINIMAX_SERVICE_TIER || "standard",
};
const matrix = [
  { model: "MiniMax-M3", thinkingMode: "disabled" },
  { model: "MiniMax-M3", thinkingMode: "adaptive" },
  { model: "MiniMax-M2.7-highspeed", thinkingMode: "adaptive" },
];

const normalize = (value) => String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const percentile = (values, percentileValue) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * percentileValue) - 1)];
};

async function evaluateCase(item, candidate) {
  const startedAt = Date.now();
  const selection = selectTemplate(templates, item.input);
  const template = selection.template;
  let output = "";
  let route = null;
  let detail = {};
  let firstTokenMs = 0;
  let question = null;
  try {
    if (selection.question || !template) {
      route = "clarification";
      question = selection.question || "Falta precisar el examen.";
    } else if (findMissingRequiredVariables(template, item.input).length > 0) {
      route = "clarification";
      question = "Falta completar una variable clínica indispensable.";
    } else {
      const fastPath = resolveFastPath(template, item.input);
      route = fastPath.eligible ? "fast-path" : classifyGenerationRoute(item.input);
      if (fastPath.eligible) {
        output = sanitizeReport(fastPath.text, { requireSystematicPhrase: /ecograf/i.test(template.category) }).text;
      } else {
        const prompt = buildPrompt({ template, userInput: item.input, memories: [] });
        const llm = await callLlmStream({
          ...config,
          model: candidate.model,
          systemPrompt: prompt,
          userInput: item.input,
          thinkingMode: candidate.thinkingMode,
          onContent: () => {
            if (!firstTokenMs) firstTokenMs = Date.now() - startedAt;
          },
        });
        output = sanitizeReport(llm.text, { requireSystematicPhrase: /ecograf/i.test(template.category) }).text;
        detail.tokenUsage = llm.usage;
      }
    }
  } catch (error) {
    detail.error = error?.message ?? String(error);
  }
  const normalizedOutput = normalize(output);
  const requiredOk = item.required.every((term) => normalizedOutput.includes(normalize(term)));
  const forbiddenOk = item.forbidden.every((term) => !normalizedOutput.includes(normalize(term)));
  const templateOk = item.expectedTemplateId === null
    ? Boolean(selection.question)
    : template?.source_template_id === item.expectedTemplateId;
  const structureOk = sanitizeReport(output).valid;
  const clinical = template ? validateClinicalOutput({ output, templateContent: template.normalized_content, userInput: item.input }) : { valid: false, errors: ["Sin plantilla"] };
  const routeOk = item.expectedRoute === route;
  const isClarification = item.expectedRoute === "clarification";
  const passed = isClarification
    ? Boolean(templateOk && routeOk && question)
    : Boolean(templateOk && structureOk && clinical.valid && requiredOk && forbiddenOk && routeOk);
  return {
    case_key: item.key,
    input: item.input,
    expected_rules: {
      templateId: item.expectedTemplateId,
      required: item.required,
      forbidden: item.forbidden,
      route: item.expectedRoute,
      critical: item.critical,
    },
    output,
    passed,
    latency_ms: Date.now() - startedAt,
    detail: { ...detail, firstTokenMs, selectedTemplateId: template?.source_template_id ?? null, route, askedQuestion: Boolean(question), templateOk, structureOk, clinicalOk: clinical.valid, clinicalErrors: clinical.errors, requiredOk, forbiddenOk, routeOk },
  };
}

async function runCandidate(candidate, selectedCases, repetitions, stage) {
  const { data: run, error: runError } = await supabase.from("assistant_eval_runs").insert({
    model: `${candidate.model}:${candidate.thinkingMode}`,
    prompt_version: `${PROMPT_VERSION}:${stage}`,
  }).select().single();
  if (runError) throw runError;
  const results = [];
  try {
    for (let repetition = 0; repetition < repetitions; repetition += 1) {
      for (const item of selectedCases) results.push(await evaluateCase(item, candidate));
    }
    const rows = results.map((result) => ({ ...result, run_id: run.id }));
    for (let offset = 0; offset < rows.length; offset += 100) {
      const { error } = await supabase.from("assistant_eval_results").insert(rows.slice(offset, offset + 100));
      if (error) throw error;
    }
    const passedCount = results.filter((result) => result.passed).length;
    const criticalFailures = results.filter((result) => result.expected_rules.critical && !result.passed).length;
    const reportResults = results.filter((result) => result.detail.route !== "clarification");
    const fastPathResults = results.filter((result) => result.detail.route === "fast-path");
    const metrics = {
      total: results.length,
      passed: passedCount,
      passRate: Number(((passedCount / results.length) * 100).toFixed(2)),
      criticalFailures,
      p95FirstTokenMs: percentile(reportResults.map((result) => result.detail.firstTokenMs).filter((value) => value > 0), 0.95),
      p95TotalMs: percentile(reportResults.map((result) => result.latency_ms), 0.95),
      p95FastPathMs: percentile(fastPathResults.map((result) => result.latency_ms), 0.95),
      averageMs: Math.round(results.reduce((sum, result) => sum + result.latency_ms, 0) / results.length),
    };
    await supabase.from("assistant_eval_runs").update({ status: "completed", metrics, completed_at: new Date().toISOString() }).eq("id", run.id);
    return { candidate, metrics };
  } catch (error) {
    await supabase.from("assistant_eval_runs").update({ status: "failed", metrics: { error: error?.message ?? String(error) }, completed_at: new Date().toISOString() }).eq("id", run.id);
    throw error;
  }
}

const hardCases = cases.filter((item) => item.hard).slice(0, 30);
const stageOne = [];
for (const candidate of matrix) stageOne.push(await runCandidate(candidate, hardCases, 2, "hard"));
stageOne.sort((left, right) => {
  if (left.metrics.criticalFailures !== right.metrics.criticalFailures) return left.metrics.criticalFailures - right.metrics.criticalFailures;
  if (Math.abs(left.metrics.passRate - right.metrics.passRate) > 1) return right.metrics.passRate - left.metrics.passRate;
  return left.metrics.p95TotalMs - right.metrics.p95TotalMs;
});
const eligible = stageOne.filter((result) => result.metrics.criticalFailures === 0);
if (eligible.length === 0) {
  throw new Error("Ninguna configuracion supero los casos criticos. No se debe publicar.");
}
const winner = eligible[0].candidate;
const finalRun = await runCandidate(winner, cases, 1, "full");
const publicationReady = finalRun.metrics.criticalFailures === 0
  && finalRun.metrics.passRate >= 98
  && (finalRun.metrics.p95FirstTokenMs ?? Infinity) < 5_000
  && (finalRun.metrics.p95TotalMs ?? Infinity) < 12_000
  && (finalRun.metrics.p95FastPathMs ?? Infinity) < 1_000;
if (!publicationReady) {
  throw new Error(`La configuracion ganadora no cumple el umbral de publicacion: ${JSON.stringify(finalRun.metrics)}`);
}
console.log(JSON.stringify({ winner, metrics: finalRun.metrics }, null, 2));
