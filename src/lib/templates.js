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

function matchesQuery(template, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    template.title,
    template.category,
    template.shortcut,
    template.content,
  ]
    .join(" ")
    .toLocaleLowerCase("es");

  return haystack.includes(query);
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
  const normalizedQuery = options.query?.trim().toLocaleLowerCase("es") || "";
  const activeView = options.activeView || SPECIAL_VIEWS.all;

  const filtered = templates.filter(
    (template) => matchesView(template, activeView) && matchesQuery(template, normalizedQuery),
  );

  if (normalizedQuery) {
    return filtered.sort(alphaCompare);
  }

  if (activeView === SPECIAL_VIEWS.recent) {
    return filtered.sort((left, right) => {
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

  return filtered.sort((left, right) => {
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
