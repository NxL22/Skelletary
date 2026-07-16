import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json" },
});
const env = (name) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Falta ${name}.`);
  return value;
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Metodo no permitido." }, 405);

  const bearer = request.headers.get("Authorization") ?? "";
  if (!bearer.startsWith("Bearer ")) return json({ error: "Falta la sesion." }, 401);
  const accessToken = bearer.slice(7).trim();
  const url = env("SUPABASE_URL");
  const anon = env("SUPABASE_ANON_KEY");
  const service = env("SUPABASE_SERVICE_ROLE_KEY");
  const authClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: auth } = await authClient.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return json({ error: "Tu sesion no es valida." }, 401);

  const payload = await request.json().catch(() => ({}));
  const templateId = String(payload?.templateId ?? "").trim();
  if (!templateId) return json({ error: "Falta el identificador de la plantilla." }, 400);

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile } = await admin.from("profiles")
    .select("access_status, trial_ends_at, subscription_ends_at")
    .eq("id", userId).maybeSingle();
  const now = Date.now();
  const access = profile?.access_status === "active"
    ? !profile.subscription_ends_at || new Date(profile.subscription_ends_at).getTime() > now
    : profile?.access_status === "trial"
      ? !profile.trial_ends_at || new Date(profile.trial_ends_at).getTime() > now
      : false;
  if (!access) return json({ error: "Tu acceso no esta vigente." }, 403);

  // La propiedad se comprueba en backend antes de borrar. Las oficiales nunca
  // tienen fila en user_templates y no pueden eliminarse por esta ruta.
  const { data: owned } = await admin.from("user_templates")
    .select("id").eq("id", templateId).eq("user_id", userId).maybeSingle();
  if (!owned) return json({ error: "Solo puedes eliminar plantillas de tu biblioteca personal." }, 403);

  const { error: statsError } = await admin.from("user_template_stats")
    .delete().eq("user_id", userId).eq("template_id", templateId);
  const { error: templateError } = await admin.from("user_templates")
    .delete().eq("id", templateId).eq("user_id", userId);
  if (statsError || templateError) return json({ error: "No pudimos eliminar la plantilla." }, 500);
  return json({ deleted: true, templateId });
});
