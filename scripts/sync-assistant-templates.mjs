// Sincroniza una copia privada, unidireccional y trazable de la biblioteca
// oficial. Nunca escribe de vuelta en defaultTemplates.json.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const env = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} en el entorno.`);
  return value;
};
const templates = JSON.parse(await readFile(new URL("../src/data/defaultTemplates.json", import.meta.url), "utf8"));
const backendKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env("SUPABASE_SECRET_KEY");
const supabase = createClient(env("VITE_SUPABASE_URL"), backendKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const variablePattern = /\{\{([^}]+)\}\}/g;
const rows = templates.map((template) => ({
  source_template_id: template.id,
  source_hash: createHash("sha256").update(template.content).digest("hex"),
  title: template.title,
  category: template.category,
  normalized_content: template.content,
  variables: [...new Set([...template.content.matchAll(variablePattern)].map((match) => match[1].trim()))],
  metadata: { shortcut: template.shortcut || "", source: "defaultTemplates.json" },
  status: "active",
  synced_at: new Date().toISOString(),
}));

for (let offset = 0; offset < rows.length; offset += 100) {
  const { error } = await supabase.from("assistant_ai_templates").upsert(rows.slice(offset, offset + 100));
  if (error) throw error;
}
console.log(`Biblioteca privada sincronizada: ${rows.length} plantillas.`);
