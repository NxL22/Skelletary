export function exportTemplatesToMarkdown(templates = []) {
  const grouped = templates.reduce((accumulator, template) => {
    const category = template.category || "Otros";

    if (!accumulator[category]) {
      accumulator[category] = [];
    }

    accumulator[category].push(template);
    return accumulator;
  }, {});

  const sections = Object.keys(grouped)
    .sort((left, right) => left.localeCompare(right, "es"))
    .map((category) => {
      const entries = grouped[category]
        .slice()
        .sort((left, right) => left.title.localeCompare(right.title, "es"))
        .map((template) => {
          const shortcut = template.shortcut || "";
          return [
            `### ${template.title}`,
            "",
            `Código: ${shortcut}`,
            "",
            template.content.trim(),
          ].join("\n");
        })
        .join("\n\n");

      return [`## ${category}`, "", entries].join("\n");
    });

  return ["# Plantillas radiológicas - Skelletary", "", ...sections].join("\n\n");
}
