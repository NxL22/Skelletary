import { normalizeTemplateContentSpacing } from "./reportFormatting";

export const SPECIAL_VIEWS = {
  all: "Todas",
  favorites: "Favoritas",
  recent: "Recientes",
};
export const DISPLAY_SHORTCUT_MAX_LENGTH = 18;
const TITLE_SPLIT_PATTERN = /\s[-–]\s/;
const TITLE_MODALITY_PREFIX_RULES = [
  {
    categoryNeedles: ["angiotac"],
    prefixes: ["angio tac de ", "angio tac ", "tac "],
  },
  {
    categoryNeedles: ["radiografia"],
    prefixes: ["radiografia de ", "radiografia ", "rx "],
  },
  {
    categoryNeedles: ["ecografia"],
    prefixes: ["ecografia de ", "ecografia ", "eco "],
  },
  {
    categoryNeedles: ["resonancia"],
    prefixes: ["resonancia magnetica de ", "resonancia magnetica ", "rm "],
  },
  {
    categoryNeedles: ["doppler"],
    prefixes: ["doppler "],
  },
  {
    categoryNeedles: ["urotac"],
    prefixes: ["uro tac "],
  },
];
const TITLE_LOWERCASE_WORDS = new Set([
  "a",
  "al",
  "con",
  "de",
  "del",
  "e",
  "en",
  "la",
  "las",
  "los",
  "o",
  "para",
  "por",
  "sin",
  "un",
  "una",
  "y",
]);
const TITLE_UPPERCASE_TOKENS = new Set([
  "AP",
  "CT",
  "DHC",
  "EEII",
  "EESS",
  "FP",
  "LAT",
  "PA",
  "RM",
  "RX",
  "TAC",
  "TC",
]);
const TITLE_VISUAL_REPLACEMENTS = new Map([
  ["abd", "Abdomen"],
  ["clavicula", "Clavícula"],
  ["pelv", "Pelvis"],
  ["torax", "Tórax"],
  ["tx", "Tórax"],
]);

const SHORTCUT_STOP_WORDS = new Set([
  "a",
  "al",
  "con",
  "de",
  "del",
  "el",
  "en",
  "la",
  "las",
  "los",
  "o",
  "para",
  "por",
  "sin",
  "un",
  "una",
  "y",
]);

function toSlug(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSearchText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function sanitizeTemplateText(value = "") {
  return value.replace(/\bnormalin\b/gi, "normal");
}

function parseShortcutAliases(value = "") {
  return value
    .split(",")
    .map((shortcut) => sanitizeTemplateText(shortcut.trim()))
    .filter(Boolean);
}

function dedupeShortcutAliases(shortcuts = []) {
  const seen = new Set();

  return shortcuts.filter((shortcut) => {
    const normalizedShortcut = normalizeSearchText(shortcut);

    if (!normalizedShortcut || seen.has(normalizedShortcut)) {
      return false;
    }

    seen.add(normalizedShortcut);
    return true;
  });
}

function getShortcutSourceWords(template) {
  return normalizeSearchText(`${template.title || ""} ${template.category || ""}`)
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !SHORTCUT_STOP_WORDS.has(word));
}

function buildGeneratedShortcut(template) {
  const sourceWords = getShortcutSourceWords(template);

  if (!sourceWords.length) {
    return "plantilla";
  }

  const pieces = [];
  let usedLength = 0;

  sourceWords.forEach((word, index) => {
    if (usedLength >= DISPLAY_SHORTCUT_MAX_LENGTH) {
      return;
    }

    const maxWordLength = index === 0 ? 5 : index === 1 ? 4 : 4;
    const nextPiece = word.slice(0, maxWordLength);
    const separatorLength = pieces.length ? 1 : 0;

    if (usedLength + separatorLength + nextPiece.length > DISPLAY_SHORTCUT_MAX_LENGTH) {
      return;
    }

    pieces.push(nextPiece);
    usedLength += separatorLength + nextPiece.length;
  });

  return pieces.join(" ");
}

export function getTemplateShortcutAliases(template) {
  // Guardamos varios atajos en el mismo campo separados por comas para no abrir
  // otra capa de complejidad en storage, Supabase o migraciones.
  const aliases = dedupeShortcutAliases(
    parseShortcutAliases(template.shortcut?.trim() || ""),
  );

  if (aliases.length) {
    return aliases;
  }

  return [buildGeneratedShortcut(template)];
}

export function getTemplateStoredShortcut(template) {
  return getTemplateShortcutAliases(template).join(", ");
}

export function getTemplateDisplayShortcut(template) {
  const [primaryShortcut] = getTemplateShortcutAliases(template);

  if (primaryShortcut && primaryShortcut.length <= DISPLAY_SHORTCUT_MAX_LENGTH) {
    return primaryShortcut;
  }

  // Si el atajo principal es demasiado largo, fabricamos uno corto desde
  // titulo y categoria para que la tarjeta no se deforme.
  return buildGeneratedShortcut(template);
}

function normalizeTitleComparison(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

function capitalizeFirstCharacter(value = "") {
  if (!value) {
    return "";
  }

  return value.charAt(0).toLocaleUpperCase("es") + value.slice(1);
}

function splitWordDecoration(word = "") {
  const match = word.match(/^([^0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ]*)(.*?)([^0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ]*)$/u);

  if (!match) {
    return {
      leading: "",
      core: word,
      trailing: "",
    };
  }

  return {
    leading: match[1] || "",
    core: match[2] || "",
    trailing: match[3] || "",
  };
}

function formatDisplayTitleWord(word = "", index = 0) {
  const { leading, core, trailing } = splitWordDecoration(word);

  if (!core) {
    return word;
  }

  const normalizedCore = normalizeTitleComparison(core);
  const uppercaseToken = core.toLocaleUpperCase("es");

  if (TITLE_UPPERCASE_TOKENS.has(uppercaseToken)) {
    return `${leading}${uppercaseToken}${trailing}`;
  }

  if (TITLE_VISUAL_REPLACEMENTS.has(normalizedCore)) {
    return `${leading}${TITLE_VISUAL_REPLACEMENTS.get(normalizedCore)}${trailing}`;
  }

  if (index > 0 && TITLE_LOWERCASE_WORDS.has(normalizedCore)) {
    return `${leading}${normalizedCore}${trailing}`;
  }

  return `${leading}${capitalizeFirstCharacter(core.toLocaleLowerCase("es"))}${trailing}`;
}

function formatDisplayTitleSegment(value = "") {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => formatDisplayTitleWord(word, index))
    .join(" ");
}

function splitTitleForCard(fullTitle) {
  const parts = fullTitle
    .split(TITLE_SPLIT_PATTERN)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  return {
    primary: parts[0],
    secondary: parts.slice(1).join(" - "),
  };
}

function removeRedundantModalityPrefix(title = "", category = "") {
  const normalizedCategory = normalizeTitleComparison(category);

  for (const rule of TITLE_MODALITY_PREFIX_RULES) {
    const matchesCategory = rule.categoryNeedles.some((needle) =>
      normalizedCategory.includes(needle),
    );

    if (!matchesCategory) {
      continue;
    }

    for (const prefix of rule.prefixes) {
      const normalizedTitle = normalizeTitleComparison(title);

      if (!normalizedTitle.startsWith(prefix)) {
        continue;
      }

      const trimmedTitle = title.slice(prefix.length).trim();

      if (trimmedTitle.length < 4) {
        return title.trim();
      }

      return capitalizeFirstCharacter(trimmedTitle);
    }
  }

  return title.trim();
}

export function getTemplateCardHeading(template) {
  const fullTitle = sanitizeTemplateText(template.title?.trim() || "");

  if (!fullTitle) {
    return {
      full: "",
      primary: "",
      secondary: "",
    };
  }

  // La tarjeta puede mostrar un nombre mas corto que el titulo fuente,
  // pero sin tocar la data real ni sacrificar utilidad clinica.
  const splitHeading = splitTitleForCard(fullTitle);

  if (splitHeading) {
    return {
      full: fullTitle,
      primary: formatDisplayTitleSegment(
        removeRedundantModalityPrefix(splitHeading.primary, template.category || ""),
      ),
      secondary: formatDisplayTitleSegment(splitHeading.secondary),
    };
  }

  const condensedPrimary = formatDisplayTitleSegment(
    removeRedundantModalityPrefix(fullTitle, template.category || ""),
  );

  return {
    full: fullTitle,
    primary: condensedPrimary,
    secondary: "",
  };
}

function nowIso() {
  return new Date().toISOString();
}

function fallbackId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `template-${Date.now()}`;
}

export function createTemplateId(title) {
  const slug = toSlug(title);
  return slug ? `${slug}-${Date.now()}` : fallbackId();
}

export function normalizeTemplate(template, index = 0) {
  const createdAt = template.createdAt || nowIso();
  const title = sanitizeTemplateText(template.title?.trim() || `Plantilla ${index + 1}`);
  const category = sanitizeTemplateText(template.category?.trim() || "Otros");
  const shortcut = getTemplateStoredShortcut({
    ...template,
    title,
    category,
  });

  return {
    id: template.id || createTemplateId(title),
    title,
    category,
    shortcut,
    // Saneamos alias heredados al normalizar para que el usuario vea el texto
    // corregido aunque la fuente original siga teniendo versiones antiguas.
    content: normalizeTemplateContentSpacing(sanitizeTemplateText(template.content || "")),
    favorite: Boolean(template.favorite),
    copyCount: Number(template.copyCount || 0),
    createdAt,
    updatedAt: template.updatedAt || createdAt,
    lastCopiedAt: template.lastCopiedAt || null,
    libraryOrigin: template.libraryOrigin || "core",
    isUserOwned: Boolean(template.isUserOwned),
    sourceType: template.sourceType || "manual",
  };
}

export function normalizeTemplates(templates = []) {
  return templates.map((template, index) => normalizeTemplate(template, index));
}

export function createTemplate(input) {
  const timestamp = nowIso();
  const title = sanitizeTemplateText(input.title.trim());
  const category = sanitizeTemplateText(input.category.trim());
  const shortcut = getTemplateStoredShortcut({
    ...input,
    title,
    category,
  });

  return {
    id: createTemplateId(title),
    title,
    category,
    shortcut,
    content: normalizeTemplateContentSpacing(sanitizeTemplateText(input.content)),
    favorite: false,
    copyCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastCopiedAt: null,
    libraryOrigin: input.libraryOrigin || "personal",
    isUserOwned: input.isUserOwned ?? true,
    sourceType: input.sourceType || "manual",
  };
}

export function updateTemplateRecord(template, changes) {
  const title =
    changes.title !== undefined
      ? sanitizeTemplateText(changes.title.trim())
      : template.title;
  const category =
    changes.category !== undefined
      ? sanitizeTemplateText(changes.category.trim())
      : template.category;
  const rawShortcut =
    changes.shortcut !== undefined
      ? sanitizeTemplateText(changes.shortcut.trim())
      : template.shortcut;

  return {
    ...template,
    ...changes,
    title,
    category,
    shortcut: getTemplateStoredShortcut({
      ...template,
      ...changes,
      title,
      category,
      shortcut: rawShortcut,
    }),
    content:
      changes.content !== undefined
        ? normalizeTemplateContentSpacing(sanitizeTemplateText(changes.content))
        : template.content,
    updatedAt: nowIso(),
    libraryOrigin: changes.libraryOrigin ?? template.libraryOrigin,
    isUserOwned: changes.isUserOwned ?? template.isUserOwned,
    sourceType: changes.sourceType ?? template.sourceType,
  };
}

export function markTemplateCopied(template) {
  return {
    ...template,
    copyCount: Number(template.copyCount || 0) + 1,
    lastCopiedAt: nowIso(),
  };
}

export function getTemplateCategories(templates = []) {
  return [...new Set(templates.map((template) => template.category).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "es"));
}

export function getCategoryCounts(templates = []) {
  return templates.reduce((counts, template) => {
    counts[template.category] = (counts[template.category] || 0) + 1;
    return counts;
  }, {});
}

function buildSearchFields(template) {
  const title = normalizeSearchText(template.title);
  const category = normalizeSearchText(template.category);
  const shortcut = normalizeSearchText(
    [
      template.shortcut,
      ...getTemplateShortcutAliases(template),
      getTemplateDisplayShortcut(template),
    ]
      .filter(Boolean)
      .join(" "),
  );
  const content = normalizeSearchText(template.content);

  return {
    title,
    category,
    shortcut,
    content,
    haystack: [title, category, shortcut, content].filter(Boolean).join(" "),
  };
}

function getQueryTokens(query) {
  return normalizeSearchText(query)
    .split(/\s+/)
    .filter(Boolean);
}

function matchesQuery(searchFields, queryTokens) {
  if (!queryTokens.length) {
    return true;
  }

  return queryTokens.every((token) => searchFields.haystack.includes(token));
}

function getFieldScore(fieldValue, token, scores) {
  if (!fieldValue) {
    return 0;
  }

  if (fieldValue === token) {
    return scores.exact;
  }

  if (fieldValue.startsWith(token)) {
    return scores.prefix;
  }

  if (fieldValue.includes(token)) {
    return scores.contains;
  }

  return 0;
}

function getSearchScore(searchFields, normalizedQuery, queryTokens) {
  let score = 0;

  if (normalizedQuery) {
    score += getFieldScore(searchFields.title, normalizedQuery, {
      exact: 320,
      prefix: 260,
      contains: 220,
    });
    score += getFieldScore(searchFields.shortcut, normalizedQuery, {
      exact: 300,
      prefix: 240,
      contains: 180,
    });
    score += getFieldScore(searchFields.category, normalizedQuery, {
      exact: 170,
      prefix: 130,
      contains: 100,
    });

    if (searchFields.content.includes(normalizedQuery)) {
      score += 60;
    }
  }

  queryTokens.forEach((token) => {
    score += getFieldScore(searchFields.title, token, {
      exact: 160,
      prefix: 130,
      contains: 100,
    });
    score += getFieldScore(searchFields.shortcut, token, {
      exact: 140,
      prefix: 110,
      contains: 90,
    });
    score += getFieldScore(searchFields.category, token, {
      exact: 80,
      prefix: 60,
      contains: 40,
    });

    if (searchFields.content.includes(token)) {
      score += 24;
    }
  });

  return score;
}

function matchesView(template, activeView) {
  if (activeView === SPECIAL_VIEWS.all) {
    return true;
  }

  if (activeView === SPECIAL_VIEWS.favorites) {
    return template.favorite;
  }

  if (activeView === SPECIAL_VIEWS.recent) {
    return Boolean(template.lastCopiedAt);
  }

  return template.category === activeView;
}

function alphaCompare(left, right) {
  return left.title.localeCompare(right.title, "es");
}

export function filterAndSortTemplates(templates = [], options = {}) {
  const normalizedQuery = normalizeSearchText(options.query || "");
  const queryTokens = getQueryTokens(normalizedQuery);
  const activeView = options.activeView || SPECIAL_VIEWS.all;

  const filtered = templates
    .map((template) => ({
      template,
      searchFields: normalizedQuery ? buildSearchFields(template) : null,
    }))
    .filter(({ template, searchFields }) => {
      if (!matchesView(template, activeView)) {
        return false;
      }

      return normalizedQuery ? matchesQuery(searchFields, queryTokens) : true;
    });

  if (normalizedQuery) {
    return filtered
      .sort((left, right) => {
        const scoreDifference =
          getSearchScore(right.searchFields, normalizedQuery, queryTokens) -
          getSearchScore(left.searchFields, normalizedQuery, queryTokens);

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        return alphaCompare(left.template, right.template);
      })
      .map(({ template }) => template);
  }

  const plainFiltered = filtered.map(({ template }) => template);

  if (activeView === SPECIAL_VIEWS.recent) {
    return plainFiltered.sort((left, right) => {
      const leftDate = left.lastCopiedAt ? new Date(left.lastCopiedAt).getTime() : 0;
      const rightDate = right.lastCopiedAt ? new Date(right.lastCopiedAt).getTime() : 0;

      if (rightDate !== leftDate) {
        return rightDate - leftDate;
      }

      if (right.copyCount !== left.copyCount) {
        return right.copyCount - left.copyCount;
      }

      return alphaCompare(left, right);
    });
  }

  return plainFiltered.sort((left, right) => {
    if (left.favorite !== right.favorite) {
      return left.favorite ? -1 : 1;
    }

    if (right.copyCount !== left.copyCount) {
      return right.copyCount - left.copyCount;
    }

    const leftUpdated = new Date(left.updatedAt).getTime();
    const rightUpdated = new Date(right.updatedAt).getTime();

    if (rightUpdated !== leftUpdated) {
      return rightUpdated - leftUpdated;
    }

    return alphaCompare(left, right);
  });
}
