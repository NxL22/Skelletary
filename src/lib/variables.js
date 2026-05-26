const VARIABLE_REGEX = /{{\s*([^}]+)\s*}}/g;

export function extractVariables(content = "") {
  const found = new Set();

  for (const match of content.matchAll(VARIABLE_REGEX)) {
    const variableName = match[1]?.trim();

    if (variableName) {
      found.add(variableName);
    }
  }

  return [...found];
}

export function fillVariables(content = "", values = {}) {
  return content.replace(VARIABLE_REGEX, (_, variableName) => {
    const key = variableName.trim();
    const value = values[key];
    return value?.trim() ? value.trim() : "___";
  });
}

export function blankVariables(content = "") {
  return content.replace(VARIABLE_REGEX, "___");
}

export function hasVariables(content = "") {
  return /{{\s*[^}]+\s*}}/.test(content);
}

