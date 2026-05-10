export const SPECIAL_VIEWS = {
  all: "Todas",
  favorites: "Favoritas",
  recent: "Recientes",
};

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
  const title = template.title?.trim() || `Plantilla ${index + 1}`;

  return {
    id: template.id || createTemplateId(title),
    title,
    category: template.category?.trim() || "Otros",
    shortcut: template.shortcut?.trim() || "",
    content: template.content?.trim() || "",
    favorite: Boolean(template.favorite),
    copyCount: Number(template.copyCount || 0),
    createdAt,
    updatedAt: template.updatedAt || createdAt,
    lastCopiedAt: template.lastCopiedAt || null,
  };
}

export function normalizeTemplates(templates = []) {
  return templates.map((template, index) => normalizeTemplate(template, index));
}

export function createTemplate(input) {
  const timestamp = nowIso();
  return {
    id: createTemplateId(input.title),
    title: input.title.trim(),
    category: input.category.trim(),
    shortcut: input.shortcut?.trim() || "",
    content: input.content.trim(),
    favorite: false,
    copyCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastCopiedAt: null,
  };
}

export function updateTemplateRecord(template, changes) {
  return {
    ...template,
    ...changes,
    title: changes.title?.trim() ?? template.title,
    category: changes.category?.trim() ?? template.category,
    shortcut: changes.shortcut?.trim() ?? template.shortcut,
    content: changes.content?.trim() ?? template.content,
    updatedAt: nowIso(),
  };
}

export function duplicateTemplateRecord(template) {
  const timestamp = nowIso();
  return {
    ...template,
    id: createTemplateId(`copia-${template.title}`),
    title: `Copia de ${template.title}`,
    shortcut: template.shortcut ? `${template.shortcut}-copia` : "",
    favorite: false,
    copyCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastCopiedAt: null,
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
  const shortcut = normalizeSearchText(template.shortcut);
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
