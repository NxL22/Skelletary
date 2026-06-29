import defaultTemplates from "../data/defaultTemplates.json";
import { normalizeProfile } from "./access";
import { normalizeTemplateContentSpacing } from "./reportFormatting";
import { getSupabaseClient } from "./supabaseClient";
import {
  createTemplateId,
  getTemplateStoredShortcut,
  normalizeTemplate,
  normalizeTemplates,
  sanitizeTemplateText,
} from "./templates";

function toRemoteTemplatePayload(template, userId) {
  const title = sanitizeTemplateText(template.title.trim());
  const category = sanitizeTemplateText(template.category.trim());
  const shortcut = getTemplateStoredShortcut({
    ...template,
    title,
    category,
    shortcut: sanitizeTemplateText(template.shortcut?.trim() || ""),
  });

  return {
    id: template.id || createTemplateId(title),
    user_id: userId,
    title,
    category,
    shortcut,
    content: normalizeTemplateContentSpacing(sanitizeTemplateText(template.content)),
    created_at: template.createdAt,
    updated_at: template.updatedAt,
    source_type: template.sourceType || "manual",
  };
}

function buildStatsLookup(statsRows = []) {
  return statsRows.reduce((lookup, row) => {
    lookup[`${row.template_origin}:${row.template_id}`] = row;
    return lookup;
  }, {});
}

function attachStats(template, origin, statsLookup) {
  const stat = statsLookup[`${origin}:${template.id}`];

  return {
    ...template,
    libraryOrigin: origin,
    isUserOwned: origin === "personal",
    favorite: Boolean(stat?.favorite || template.favorite),
    copyCount: Number(stat?.copy_count ?? template.copyCount ?? 0),
    lastCopiedAt: stat?.last_copied_at || template.lastCopiedAt || null,
  };
}

function normalizeCoreTemplates(coreRows = []) {
  const source = coreRows.length ? coreRows : defaultTemplates;
  return normalizeTemplates(source).map((template) => ({
    ...template,
    libraryOrigin: "core",
    isUserOwned: false,
  }));
}

function normalizeUserTemplates(userRows = []) {
  return normalizeTemplates(userRows).map((template) => ({
    ...template,
    libraryOrigin: "personal",
    isUserOwned: true,
    sourceType: template.sourceType || "manual",
  }));
}

// Cuando el usuario edita una plantilla oficial, la app crea automaticamente
// una entrada en user_templates con el mismo ID. En el merge, las plantillas
// personales ganan sobre las oficiales con el mismo ID para que el usuario
// vea sus cambios sin perder la version original para otros.
function mergeRemoteData(coreRows = [], userRows = [], statsRows = [], hasCoreLibrary = true) {
  const statsLookup = buildStatsLookup(statsRows);
  const coreTemplates = hasCoreLibrary
    ? normalizeCoreTemplates(coreRows).map((template) => attachStats(template, "core", statsLookup))
    : [];
  const userTemplates = normalizeUserTemplates(userRows).map((template) =>
    attachStats(template, "personal", statsLookup),
  );

  const personalIds = new Set(userTemplates.map((template) => template.id));
  const filteredCoreTemplates = coreTemplates.filter((template) => !personalIds.has(template.id));

  return [...filteredCoreTemplates, ...userTemplates];
}

export async function fetchRemoteWorkspace(userId) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  const profileResult = await supabase
    .from("profiles")
    .select(
      "id, email, display_name, has_core_library, access_status, trial_starts_at, trial_ends_at, subscription_ends_at, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (profileResult.error) {
    throw profileResult.error;
  }

  const normalizedProfile = normalizeProfile(profileResult.data);
  const hasCoreLibrary = normalizedProfile?.hasCoreLibrary ?? true;

  // Primero leemos el perfil porque ahi vive la decision comercial de compartir
  // o no la biblioteca oficial con ese usuario en particular.
  const [coreResult, userResult, statsResult] = await Promise.all([
    hasCoreLibrary
      ? supabase
          .from("core_templates")
          .select("id, title, category, shortcut, content, created_at, updated_at")
          .eq("is_published", true)
          .order("category", { ascending: true })
          .order("title", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("user_templates")
      .select("id, title, category, shortcut, content, created_at, updated_at, source_type")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("user_template_stats")
      .select("template_id, template_origin, favorite, copy_count, last_copied_at")
      .eq("user_id", userId),
  ]);

  const errors = [coreResult.error, userResult.error, statsResult.error].filter(Boolean);

  if (errors.length) {
    throw errors[0];
  }

  return {
    profile: normalizedProfile,
    templates: mergeRemoteData(coreResult.data, userResult.data, statsResult.data, hasCoreLibrary),
  };
}

export async function saveUserTemplateRemote(userId, template, originalTemplate = null) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  const normalizedTemplate = normalizeTemplate(
    originalTemplate
      ? {
          ...originalTemplate,
          ...template,
        }
      : template,
  );

  const payload = toRemoteTemplatePayload(normalizedTemplate, userId);
  const { error } = await supabase.from("user_templates").upsert(payload);

  if (error) {
    throw error;
  }

  return {
    ...normalizedTemplate,
    libraryOrigin: "personal",
    isUserOwned: true,
    sourceType: payload.source_type,
  };
}

export async function deleteUserTemplateRemote(templateId) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  // Solo borramos en user_templates. Si la plantilla es oficial y nunca fue
  // editada, no habra fila ahi y la oficial seguira visible desde core_templates.
  const { error: templateError } = await supabase.from("user_templates").delete().eq("id", templateId);
  const { error: statsError } = await supabase.from("user_template_stats").delete().eq("template_id", templateId);

  if (templateError || statsError) {
    throw templateError || statsError;
  }
}

export async function upsertTemplateStatsRemote(userId, template, changes) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  const payload = {
    user_id: userId,
    template_id: template.id,
    template_origin: template.libraryOrigin === "personal" ? "personal" : "core",
    favorite: Boolean(changes.favorite ?? template.favorite),
    copy_count: Number(changes.copyCount ?? template.copyCount ?? 0),
    last_copied_at: (changes.lastCopiedAt ?? template.lastCopiedAt) || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("user_template_stats").upsert(payload);

  if (error) {
    throw error;
  }

  return payload;
}

export function extractLegacyPersonalTemplates(localTemplates = []) {
  const officialIds = new Set(defaultTemplates.map((template) => template.id));

  return normalizeTemplates(localTemplates)
    .filter((template) => template.libraryOrigin === "personal" || !officialIds.has(template.id))
    .map((template) => ({
      ...template,
      libraryOrigin: "personal",
      isUserOwned: true,
      sourceType: "manual",
    }));
}

export function extractLegacyStats(localTemplates = []) {
  return normalizeTemplates(localTemplates).map((template) => ({
    template_id: template.id,
    template_origin: template.libraryOrigin === "personal" ? "personal" : "core",
    favorite: Boolean(template.favorite),
    copy_count: Number(template.copyCount || 0),
    last_copied_at: template.lastCopiedAt || null,
  }));
}

export function hasMeaningfulLegacyData(localTemplates = []) {
  const personalTemplates = extractLegacyPersonalTemplates(localTemplates);
  const hasPersonalTemplates = personalTemplates.length > 0;
  const hasStats = normalizeTemplates(localTemplates).some(
    (template) => template.favorite || template.copyCount > 0 || Boolean(template.lastCopiedAt),
  );

  return hasPersonalTemplates || hasStats;
}

export async function migrateLocalWorkspaceToRemote(userId, localTemplates = []) {
  const personalTemplates = extractLegacyPersonalTemplates(localTemplates);
  const statsRows = extractLegacyStats(localTemplates);

  if (personalTemplates.length) {
    // Guardamos las plantillas personales en user_templates. Usamos el cliente
    // de Supabase directamente aqui porque ya no existe importUserTemplatesRemote
    // desde que se elimino la importacion masiva de la app.
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error("Supabase no esta configurado.");
    }

    const payload = personalTemplates.map((template) =>
      toRemoteTemplatePayload(template, userId),
    );

    const { error: templatesError } = await supabase.from("user_templates").upsert(payload);

    if (templatesError) {
      throw templatesError;
    }
  }

  await Promise.all(
    statsRows.map((stat) =>
      upsertTemplateStatsRemote(
        userId,
        {
          id: stat.template_id,
          libraryOrigin: stat.template_origin,
          favorite: stat.favorite,
          copyCount: stat.copy_count,
          lastCopiedAt: stat.last_copied_at,
        },
        {
          favorite: stat.favorite,
          copyCount: stat.copy_count,
          lastCopiedAt: stat.last_copied_at,
        },
      ),
    ),
  );
}
