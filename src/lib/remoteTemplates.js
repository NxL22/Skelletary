import defaultTemplates from "../data/defaultTemplates.json";
import { normalizeProfile } from "./access";
import { normalizeTemplateContentSpacing } from "./reportFormatting";
import { getSupabaseClient } from "./supabaseClient";
import {
  createTemplateId,
  duplicateTemplateRecord,
  getTemplateDisplayShortcut,
  normalizeTemplate,
  normalizeTemplates,
  sanitizeTemplateText,
} from "./templates";

function toRemoteTemplatePayload(template, userId) {
  const title = sanitizeTemplateText(template.title.trim());
  const category = sanitizeTemplateText(template.category.trim());
  const shortcut = getTemplateDisplayShortcut({
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

function createTemplateLookup(templates) {
  return new Map(templates.map((template) => [template.id, template]));
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

function mergeRemoteData(coreRows = [], userRows = [], statsRows = [], hasCoreLibrary = true) {
  const statsLookup = buildStatsLookup(statsRows);
  const coreTemplates = hasCoreLibrary
    ? normalizeCoreTemplates(coreRows).map((template) => attachStats(template, "core", statsLookup))
    : [];
  const userTemplates = normalizeUserTemplates(userRows).map((template) =>
    attachStats(template, "personal", statsLookup),
  );

  return [...coreTemplates, ...userTemplates];
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

  const { error: templateError } = await supabase.from("user_templates").delete().eq("id", templateId);
  const { error: statsError } = await supabase.from("user_template_stats").delete().eq("template_id", templateId);

  if (templateError || statsError) {
    throw templateError || statsError;
  }
}

export async function duplicateToPersonalLibrary(userId, template) {
  const duplicatedTemplate = {
    ...duplicateTemplateRecord(template),
    libraryOrigin: "personal",
    isUserOwned: true,
    sourceType: template.libraryOrigin === "core" ? "duplicated_from_core" : "manual",
  };

  return saveUserTemplateRemote(userId, duplicatedTemplate);
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
    last_copied_at: changes.lastCopiedAt ?? template.lastCopiedAt ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("user_template_stats").upsert(payload);

  if (error) {
    throw error;
  }

  return payload;
}

export async function importUserTemplatesRemote({
  userId,
  fileName,
  importKind,
  rows,
}) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  const templatesToInsert = rows.map((row) =>
    toRemoteTemplatePayload(
      {
        ...row,
        id: row.id || createTemplateId(row.title),
        createdAt: row.createdAt || new Date().toISOString(),
        updatedAt: row.updatedAt || new Date().toISOString(),
        sourceType: importKind,
      },
      userId,
    ),
  );

  const { data: importJob, error: jobError } = await supabase
    .from("import_jobs")
    .insert({
      user_id: userId,
      kind: importKind,
      status: "completed",
      filename: fileName,
      summary_json: {
        imported: templatesToInsert.length,
      },
    })
    .select("id")
    .single();

  if (jobError) {
    throw jobError;
  }

  const importRowsPayload = templatesToInsert.map((template) => ({
    import_job_id: importJob.id,
    title: template.title,
    category: template.category,
    shortcut: template.shortcut,
    content: template.content,
    status: "imported",
  }));

  const [{ error: templatesError }, { error: rowsError }] = await Promise.all([
    supabase.from("user_templates").upsert(templatesToInsert),
    supabase.from("import_rows").insert(importRowsPayload),
  ]);

  if (templatesError || rowsError) {
    throw templatesError || rowsError;
  }

  return normalizeTemplates(templatesToInsert).map((template) => ({
    ...template,
    libraryOrigin: "personal",
    isUserOwned: true,
    sourceType: importKind,
  }));
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
  const personalLookup = createTemplateLookup(personalTemplates);
  const statsRows = extractLegacyStats(localTemplates);

  if (personalTemplates.length) {
    await importUserTemplatesRemote({
      userId,
      fileName: "migracion-local",
      importKind: "manual",
      rows: personalTemplates,
    });
  }

  await Promise.all(
    statsRows.map((stat) => {
      const template =
        stat.template_origin === "personal"
          ? personalLookup.get(stat.template_id) || {
              id: stat.template_id,
              libraryOrigin: "personal",
              favorite: stat.favorite,
              copyCount: stat.copy_count,
              lastCopiedAt: stat.last_copied_at,
            }
          : {
              id: stat.template_id,
              libraryOrigin: "core",
              favorite: stat.favorite,
              copyCount: stat.copy_count,
              lastCopiedAt: stat.last_copied_at,
            };

      return upsertTemplateStatsRemote(userId, template, {
        favorite: stat.favorite,
        copyCount: stat.copy_count,
        lastCopiedAt: stat.last_copied_at,
      });
    }),
  );
}
