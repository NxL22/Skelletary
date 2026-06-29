// Script para analizar las plantillas:
// 1. Detectar plantillas duplicadas (por titulo o shortcut)
// 2. Normalizar la seccion de antecedentes para que TODAS las plantillas
//    tengan solo la variable {{antecedente}} despues de "ANTECEDENTES CLINICOS:"
//    (o agregar la seccion si no existe).
//
// Uso: node scripts/analizar-plantillas.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const JSON_PATH = resolve(__dirname, "../src/data/defaultTemplates.json");
const REPORT_PATH = resolve(__dirname, "./analisis-plantillas.txt");
const CLEAN_PATH = resolve(__dirname, "../src/data/defaultTemplates.json");

const ANTECEDENT_HEADING = "ANTECEDENTES CLINICOS:";
const ANTECEDENT_VARIABLE = "{{antecedente}}";

// Encuentra TODAS las secciones de "antecedentes clinicos:" dentro del
// contenido de la plantilla. Esto evita confundir secciones con el prefijo
// ANTECEDENTES CLINICOS: dentro del cuerpo (por ejemplo en hallazgos o
// impresion, donde podriamos ver texto como "antecedentes clinicos de
// hypertension").
function findAntecedentSections(content) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const matches = [];
  let inAntecedentSection = false;
  let buffer = [];
  let lineIndex = -1;

  function flushIfMatches(startIndex, endIndex) {
    if (buffer.length === 0) {
      return;
    }

    // Una seccion valida inicia con un encabezado "ANTECEDENTES CLINICOS:"
    // (con o sin punto, con o sin acentos). Descartamos otras coincidencias.
    const headingLine = buffer[0]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[:.]+$/, "");

    if (headingLine === "antecedentes clinicos") {
      matches.push({
        startLine: startIndex,
        endLine: endIndex,
        // Solo las lineas posteriores al encabezado pueden contener
        // valores de antecedentes.
        bodyLines: buffer.slice(1),
      });
    }

    buffer = [];
  }

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const normalizedLine = rawLine
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[:.]+$/, "");

    const startsSection = normalizedLine.startsWith("antecedentes clinicos");

    if (startsSection && !inAntecedentSection) {
      inAntecedentSection = true;
      lineIndex = index;
      buffer.push(rawLine);
      continue;
    }

    if (inAntecedentSection) {
      // La seccion termina cuando aparece otro encabezado estructurado.
      const isNewHeading =
        normalizedLine === "hallazgos" ||
        normalizedLine === "hallazgo" ||
        normalizedLine === "impresion" ||
        normalizedLine === "impresion diagnostica";

      if (isNewHeading) {
        flushIfMatches(lineIndex, index);
        inAntecedentSection = false;
        continue;
      }

      buffer.push(rawLine);
    }
  }

  // Cierra la seccion final si el archivo termina sin otro encabezado.
  if (inAntecedentSection) {
    flushIfMatches(lineIndex, lines.length);
  }

  return matches;
}

function isAntecedentOnly(bodyLines) {
  const filtered = bodyLines.filter((line) => line.trim() !== "");
  return filtered.length === 1 && filtered[0].trim() === ANTECEDENT_VARIABLE;
}

function hasAntecedentSection(content) {
  return findAntecedentSections(content).length > 0;
}

function normalizeAntecedents(content) {
  const sections = findAntecedentSections(content);
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let workingLines = lines.slice();
  let mutated = false;

  // Si hay multiples secciones (raro), dejamos la primera valida y eliminamos
  // las demas para evitar duplicacion de headers.
  let firstSectionStart = -1;
  let replaced = false;
  let sectionCount = 0;

  // Procesamos desde el final hacia el inicio para que los indices no se invaliden.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    sectionCount += 1;

    if (firstSectionStart === -1) {
      firstSectionStart = section.startLine;
    } else {
      // Eliminamos secciones duplicadas.
      workingLines = [
        ...workingLines.slice(0, section.startLine),
        ...workingLines.slice(section.endLine),
      ];
      mutated = true;
    }
  }

  if (firstSectionStart === -1) {
    return { content, mutated: false };
  }

  const firstSection = sections[0];
  if (firstSection) {
    const onlyVariable = isAntecedentOnly(firstSection.bodyLines);
    if (!onlyVariable) {
      // Reemplazamos la seccion: dejamos el encabezado y la variable sola.
      const newLines = [
        ...workingLines.slice(0, firstSection.startLine),
        ANTECEDENT_HEADING,
        ANTECEDENT_VARIABLE,
        ...workingLines.slice(firstSection.endLine),
      ];
      workingLines = newLines;
      mutated = true;
      replaced = true;
    }
  }

  if (!mutated && sectionCount === 0) {
    // No hay seccion de antecedentes, la agregamos al inicio del contenido.
    const trimmed = workingLines.join("\n").trim();
    workingLines = [ANTECEDENT_HEADING, ANTECEDENT_VARIABLE, "", trimmed];
    mutated = true;
    replaced = true;
  }

  return {
    content: workingLines.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    mutated,
    replaced,
  };
}

function buildShortcutsMap(templates) {
  const map = new Map();
  for (const template of templates) {
    const aliases = parseShortcutAliases(template.shortcut || "");
    for (const alias of aliases) {
      const key = alias.trim().toLowerCase();
      if (!key) {
        continue;
      }
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(template);
    }
  }
  return map;
}

function parseShortcutAliases(value = "") {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function main() {
  const raw = readFileSync(JSON_PATH, "utf8");
  const templates = JSON.parse(raw);

  const report = [];
  report.push(`Total de plantillas analizadas: ${templates.length}`);
  report.push("");

  // 1) Duplicados
  const titleGroups = new Map();
  for (const template of templates) {
    const key = (template.title || "").trim().toLowerCase();
    if (!key) {
      continue;
    }
    if (!titleGroups.has(key)) {
      titleGroups.set(key, []);
    }
    titleGroups.get(key).push(template);
  }

  const duplicateTitles = [];
  for (const [key, list] of titleGroups.entries()) {
    if (list.length > 1) {
      duplicateTitles.push({ title: list[0].title, ids: list.map((t) => t.id) });
    }
  }

  report.push("=== DUPLICADOS POR TITULO ===");
  if (duplicateTitles.length === 0) {
    report.push("No se encontraron duplicados por titulo.");
  } else {
    for (const group of duplicateTitles) {
      report.push(`- "${group.title}" -> IDs: ${group.ids.join(", ")}`);
    }
  }
  report.push("");

  const shortcutsMap = buildShortcutsMap(templates);
  const duplicateShortcuts = [];
  for (const [key, list] of shortcutsMap.entries()) {
    if (list.length > 1) {
      duplicateShortcuts.push({ shortcut: key, ids: list.map((t) => t.id) });
    }
  }

  report.push("=== DUPLICADOS POR ATAJO ===");
  if (duplicateShortcuts.length === 0) {
    report.push("No se encontraron duplicados por atajo.");
  } else {
    for (const group of duplicateShortcuts) {
      const titles = group.ids.map((id) => {
        const t = templates.find((candidate) => candidate.id === id);
        return `(${t?.title || ""})`;
      });
      report.push(`- "${group.shortcut}" -> IDs: ${group.ids.join(", ")} ${titles.join(" ")}`);
    }
  }
  report.push("");

  // 2) Plantillas sin seccion de antecedentes
  const missingAntecedent = templates.filter((t) => !hasAntecedentSection(t.content || ""));
  report.push("=== PLANTILLAS SIN SECCION ANTECEDENTES ===");
  if (missingAntecedent.length === 0) {
    report.push("Todas las plantillas tienen seccion de antecedentes.");
  } else {
    for (const t of missingAntecedent) {
      report.push(`- [${t.id}] ${t.title}`);
    }
  }
  report.push("");

  // 3) Plantillas con antecedentes que NO son solo la variable
  const dirtyAntecedents = [];
  for (const template of templates) {
    const sections = findAntecedentSections(template.content || "");
    if (sections.length === 0) {
      continue;
    }
    const firstSection = sections[0];
    if (!isAntecedentOnly(firstSection.bodyLines)) {
      dirtyAntecedents.push({
        id: template.id,
        title: template.title,
        currentBody: firstSection.bodyLines
          .filter((line) => line.trim() !== "")
          .map((line) => line.trim())
          .join(" | "),
      });
    }
  }

  report.push("=== ANTECEDENTES QUE NO SON SOLO LA VARIABLE ===");
  if (dirtyAntecedents.length === 0) {
    report.push("Todas las plantillas tienen SOLO {{antecedente}} en antecedentes.");
  } else {
    for (const entry of dirtyAntecedents) {
      report.push(`- [${entry.id}] ${entry.title}: "${entry.currentBody}"`);
    }
  }
  report.push("");

  // 4) Accion: Normalizar los antecedentes
  let updatedCount = 0;
  const updatedTitles = [];
  const cleanTemplates = templates.map((template) => {
    const result = normalizeAntecedents(template.content || "");
    if (result.mutated) {
      updatedCount += 1;
      updatedTitles.push(`[${template.id}] ${template.title}`);
    }
    return {
      ...template,
      content: result.content,
    };
  });

  report.push("=== NORMALIZACION ===");
  report.push(`Total de plantillas normalizadas: ${updatedCount}`);
  for (const title of updatedTitles) {
    report.push(`- ${title}`);
  }

  writeFileSync(REPORT_PATH, report.join("\n"), "utf8");
  console.log("Reporte generado en:", REPORT_PATH);

  // Solo escribimos el JSON limpio si hubo cambios reales para no tocar timestamps.
  if (updatedCount > 0) {
    writeFileSync(CLEAN_PATH, JSON.stringify(cleanTemplates, null, 4), "utf8");
    console.log(`Archivo limpio actualizado con ${updatedCount} cambios.`);
  } else {
    console.log("No se detectaron antecedentes sucios, nada que limpiar.");
  }
}

main();
