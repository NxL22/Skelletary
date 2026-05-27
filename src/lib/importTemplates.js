import * as XLSX from "xlsx";
import { normalizeTemplateContentSpacing } from "./reportFormatting";
import { createTemplateId, sanitizeTemplateText } from "./templates";

const REQUIRED_FIELDS = ["title", "category", "content"];

export const IMPORT_FIELD_OPTIONS = [
  { value: "title", label: "Titulo" },
  { value: "category", label: "Categoria" },
  { value: "shortcut", label: "Shortcut" },
  { value: "content", label: "Contenido" },
];

function normalizeCellValue(value) {
  return sanitizeTemplateText(
    typeof value === "string" ? value.trim() : `${value ?? ""}`.trim(),
  );
}

function guessFieldByHeader(header) {
  const normalizedHeader = header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (["titulo", "title", "nombre"].includes(normalizedHeader)) {
    return "title";
  }

  if (["categoria", "category", "seccion"].includes(normalizedHeader)) {
    return "category";
  }

  if (["shortcut", "codigo", "atajo"].includes(normalizedHeader)) {
    return "shortcut";
  }

  if (["contenido", "content", "plantilla", "texto", "informe"].includes(normalizedHeader)) {
    return "content";
  }

  return "";
}

export async function parseSpreadsheetFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("El archivo no contiene hojas legibles.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  });

  if (!rows.length) {
    throw new Error("El archivo no contiene filas para importar.");
  }

  const headers = rows[0].map((cell, index) => normalizeCellValue(cell) || `Columna ${index + 1}`);
  const previewRows = rows.slice(1).filter((row) => row.some((cell) => normalizeCellValue(cell)));

  return {
    headers,
    rows: previewRows.map((row) =>
      headers.reduce((record, header, index) => {
        record[header] = normalizeCellValue(row[index]);
        return record;
      }, {}),
    ),
  };
}

export function buildSuggestedMapping(headers = []) {
  return headers.reduce((mapping, header) => {
    mapping[header] = guessFieldByHeader(header);
    return mapping;
  }, {});
}

export function validateImportedRows(rows = [], mapping = {}, existingTemplates = []) {
  const existingLookup = new Set(
    existingTemplates
      .filter((template) => template.libraryOrigin === "personal")
      .map((template) => `${template.title}|${template.category}|${template.content}`.toLowerCase()),
  );

  const seenInImport = new Set();

  return rows.map((row, index) => {
    const mapped = {
      title: normalizeCellValue(row[findHeaderForField(mapping, "title")]),
      category:
        normalizeCellValue(row[findHeaderForField(mapping, "category")]) || "Otros",
      shortcut: normalizeCellValue(row[findHeaderForField(mapping, "shortcut")]),
      // Normalizamos el interlineado al importar para que la copia final
      // mantenga solo la separacion clinica entre secciones principales.
      content: normalizeTemplateContentSpacing(
        normalizeCellValue(row[findHeaderForField(mapping, "content")]),
      ),
    };

    const missingFields = REQUIRED_FIELDS.filter((field) => !mapped[field]);
    const duplicateKey = `${mapped.title}|${mapped.category}|${mapped.content}`.toLowerCase();
    const isDuplicate = Boolean(mapped.title && mapped.content && (existingLookup.has(duplicateKey) || seenInImport.has(duplicateKey)));

    if (mapped.title && mapped.content) {
      seenInImport.add(duplicateKey);
    }

    return {
      rowNumber: index + 2,
      raw: row,
      mapped,
      duplicateKey,
      isDuplicate,
      isValid: !missingFields.length && !isDuplicate,
      reason: missingFields.length
        ? `Faltan campos requeridos: ${missingFields.join(", ")}`
        : isDuplicate
          ? "Duplicada dentro de tu cuenta o del mismo archivo."
          : "",
    };
  });
}

function findHeaderForField(mapping, targetField) {
  return Object.keys(mapping).find((header) => mapping[header] === targetField);
}

export function buildImportableTemplates(validatedRows = []) {
  return validatedRows
    .filter((row) => row.isValid)
    .map((row) => ({
      id: createTemplateId(row.mapped.title),
      title: row.mapped.title,
      category: row.mapped.category,
      shortcut: row.mapped.shortcut,
      content: row.mapped.content,
      favorite: false,
      copyCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastCopiedAt: null,
      sourceType: "import",
    }));
}
