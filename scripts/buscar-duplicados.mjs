// Script para buscar plantillas duplicadas en la biblioteca oficial.
// NO modifica nada: solo lee y reporta. Util para auditar antes de fusionar
// o borrar entradas.
//
// Detecta duplicados por:
//   1. Titulo exacto (case-insensitive).
//   2. Shortcut exacto (considera que un shortcut puede repetirse entre titulos).
//   3. Contenido identico (dos plantillas con el mismo body).
//
// Uso: node scripts/buscar-duplicados.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const JSON_PATH = resolve(__dirname, "../src/data/defaultTemplates.json");

function parseShortcutAliases(value = "") {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeContent(content) {
  // Comparamos el contenido sin espacios/saltos redundantes para encontrar
  // duplicados reales aunque difieran en formato.
  return String(content || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function main() {
  const raw = readFileSync(JSON_PATH, "utf8");
  const templates = JSON.parse(raw);

  console.log(`Total de plantillas: ${templates.length}`);
  console.log("");

  // 1) Duplicados por titulo.
  const titleGroups = new Map();
  for (const template of templates) {
    const key = String(template.title || "").trim().toLowerCase();
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
      duplicateTitles.push({ title: list[0].title, items: list });
    }
  }

  console.log("=== DUPLICADOS POR TITULO ===");
  if (duplicateTitles.length === 0) {
    console.log("No se encontraron duplicados por titulo.");
  } else {
    for (const group of duplicateTitles) {
      console.log(`\n- "${group.title}" (${group.items.length} copias)`);
      for (const item of group.items) {
        const shortcuts = parseShortcutAliases(item.shortcut).join(", ") || "(sin atajo)";
        const len = normalizeContent(item.content).length;
        console.log(`   * id: ${item.id} | atajos: ${shortcuts} | contenido: ${len} chars | categoria: ${item.category}`);
      }
    }
  }
  console.log("");

  // 2) Duplicados por shortcut.
  const shortcutsMap = new Map();
  for (const template of templates) {
    const aliases = parseShortcutAliases(template.shortcut);
    for (const alias of aliases) {
      const key = alias.trim().toLowerCase();
      if (!key) {
        continue;
      }
      if (!shortcutsMap.has(key)) {
        shortcutsMap.set(key, []);
      }
      shortcutsMap.get(key).push(template);
    }
  }

  const duplicateShortcuts = [];
  for (const [key, list] of shortcutsMap.entries()) {
    if (list.length > 1) {
      duplicateShortcuts.push({ shortcut: key, items: list });
    }
  }

  console.log("=== DUPLICADOS POR ATAJO ===");
  if (duplicateShortcuts.length === 0) {
    console.log("No se encontraron duplicados por atajo.");
  } else {
    for (const group of duplicateShortcuts) {
      console.log(`\n- Atajo "${group.shortcut}" (${group.items.length} usos)`);
      for (const item of group.items) {
        console.log(`   * id: ${item.id} | titulo: ${item.title}`);
      }
    }
  }
  console.log("");

  // 3) Duplicados por contenido identico.
  const contentGroups = new Map();
  for (const template of templates) {
    const key = normalizeContent(template.content);
    if (!key) {
      continue;
    }
    if (!contentGroups.has(key)) {
      contentGroups.set(key, []);
    }
    contentGroups.get(key).push(template);
  }

  const duplicateContents = [];
  for (const [, list] of contentGroups.entries()) {
    if (list.length > 1) {
      duplicateContents.push({ items: list });
    }
  }

  console.log("=== DUPLICADOS POR CONTENIDO IDENTICO ===");
  if (duplicateContents.length === 0) {
    console.log("No se encontraron duplicados por contenido.");
  } else {
    for (const group of duplicateContents) {
      console.log(`\n- (${group.items.length} plantillas con el mismo contenido)`);
      for (const item of group.items) {
        console.log(`   * id: ${item.id} | titulo: ${item.title} | categoria: ${item.category}`);
      }
    }
  }
  console.log("");

  // Resumen final.
  const totalGrupos = duplicateTitles.length + duplicateShortcuts.length + duplicateContents.length;
  console.log("=== RESUMEN ===");
  console.log(`Titulos duplicados: ${duplicateTitles.length}`);
  console.log(`Atajos duplicados: ${duplicateShortcuts.length}`);
  console.log(`Contenidos duplicados: ${duplicateContents.length}`);
  console.log(`Total de grupos con duplicados: ${totalGrupos}`);

  if (totalGrupos > 0) {
    console.log("\nSUGERENCIA: revisa las plantillas marcadas y decide cual conservar.");
    console.log("No se modifica ningun archivo. Este script solo lee y reporta.");
  }
}

main();