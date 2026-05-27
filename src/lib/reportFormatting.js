const STRUCTURED_SECTION_HEADINGS = new Set([
  "antecedentes clinicos",
  "hallazgos",
  "hallazgo",
  "impresion",
  "impresion diagnostica",
]);

function normalizeHeadingLabel(line = "") {
  return line
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[:.]+$/g, "")
    .trim();
}

function isStructuredSectionHeading(line = "") {
  return STRUCTURED_SECTION_HEADINGS.has(normalizeHeadingLabel(line));
}

export function normalizeTemplateContentSpacing(content = "") {
  const normalizedContent = `${content ?? ""}`
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""));

  const hasStructuredSections = normalizedContent.some((line) =>
    isStructuredSectionHeading(line.trim()),
  );

  if (!hasStructuredSections) {
    return normalizedContent.join("\n").trim();
  }

  const output = [];
  let hasSeenStructuredHeading = false;

  for (const rawLine of normalizedContent) {
    const trimmedLine = rawLine.trim();

    if (!trimmedLine) {
      if (!hasSeenStructuredHeading && output.at(-1) && output.at(-1) !== "") {
        output.push("");
      }

      continue;
    }

    if (isStructuredSectionHeading(trimmedLine)) {
      while (output.at(-1) === "") {
        output.pop();
      }

      if (output.length) {
        output.push("");
      }

      output.push(trimmedLine);
      hasSeenStructuredHeading = true;
      continue;
    }

    // En informes estructurados dejamos el texto corrido dentro de cada bloque
    // para evitar interlineados extra al copiar desde plantillas generadas por GPT.
    output.push(trimmedLine);
  }

  while (output.at(-1) === "") {
    output.pop();
  }

  return output.join("\n");
}
