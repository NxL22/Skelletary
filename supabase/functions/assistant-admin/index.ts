import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-skelly-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});
const env = (name) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Variable requerida: ${name}`);
  return value;
};
const hash = async (value) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};
const safeEqual = (left, right) => {
  const a = new TextEncoder().encode(String(left));
  const b = new TextEncoder().encode(String(right));
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) result |= a[index] ^ b[index];
  return result === 0;
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return reply({ error: "Metodo no permitido." }, 405);

  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const userClient = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: authData } = await userClient.auth.getUser();
  if (!authData?.user?.id) return reply({ error: "Sesion no valida." }, 401);
  const userId = authData.user.id;
  // El PIN es una segunda barrera, no una forma de convertir a otra usuaria en
  // owner. El UUID se guarda como secret y nunca viaja al frontend.
  if (!safeEqual(userId, env("ASSISTANT_OWNER_USER_ID"))) {
    return reply({ error: "Skelly Lab es exclusivo del owner." }, 403);
  }
  const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
  const payload = await request.json().catch(() => ({}));
  const action = String(payload.action ?? "overview");

  if (action === "login") {
    const { data: attempt } = await admin.from("assistant_admin_attempts").select("*").eq("user_id", userId).maybeSingle();
    if (attempt?.blocked_until && new Date(attempt.blocked_until).getTime() > Date.now()) {
      return reply({ error: "Demasiados intentos. Espera 15 minutos." }, 429);
    }
    if (!safeEqual(String(payload.pin ?? ""), env("ASSISTANT_ADMIN_PIN"))) {
      const failed = (attempt?.failed_count ?? 0) + 1;
      await admin.from("assistant_admin_attempts").upsert({
        user_id: userId, failed_count: failed >= 5 ? 0 : failed,
        blocked_until: failed >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : null,
        updated_at: new Date().toISOString(),
      });
      return reply({ error: "PIN incorrecto." }, 403);
    }
    const rawSession = crypto.randomUUID() + crypto.randomUUID();
    await admin.from("assistant_admin_sessions").insert({
      token_hash: await hash(rawSession), user_id: userId,
      expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
    });
    await admin.from("assistant_admin_attempts").delete().eq("user_id", userId);
    return reply({ token: rawSession, expiresIn: 1800 });
  }

  const adminToken = request.headers.get("x-skelly-admin-token") ?? "";
  const { data: session } = await admin.from("assistant_admin_sessions")
    .select("user_id, expires_at").eq("token_hash", await hash(adminToken)).maybeSingle();
  if (!session || session.user_id !== userId || new Date(session.expires_at).getTime() <= Date.now()) {
    return reply({ error: "La sesion privada vencio." }, 403);
  }

  if (action === "set-status") {
    const status = ["active", "disabled"].includes(payload.status) ? payload.status : null;
    if (!status) return reply({ error: "Estado invalido." }, 400);
    const { error } = await admin.from("assistant_memories").update({ status, updated_at: new Date().toISOString() }).eq("id", payload.memoryId);
    if (error) throw error;
    await admin.from("assistant_audit_log").insert({ actor_user_id: userId, action: `memory.${status}`, target_type: "memory", target_id: payload.memoryId });
  }

  if (action === "promote-global") {
    const { data: memory, error: memoryError } = await admin
      .from("assistant_memories")
      .select("id, signature, scope, status")
      .eq("id", payload.memoryId)
      .maybeSingle();
    if (memoryError) throw memoryError;
    if (!memory) return reply({ error: "La memoria ya no existe." }, 404);
    const { error } = await admin
      .from("assistant_memories")
      .update({ scope: "global", user_id: null, status: "active", updated_at: new Date().toISOString() })
      .eq("id", memory.id);
    if (error) {
      return reply({ error: "Ya existe una memoria global equivalente o no pudo promoverse." }, 409);
    }
    await admin.from("assistant_audit_log").insert({
      actor_user_id: userId,
      action: "memory.promote_global",
      target_type: "memory",
      target_id: memory.id,
      detail: { previousScope: memory.scope, previousStatus: memory.status },
    });
  }

  if (action === "rollback") {
    const { data: version } = await admin.from("assistant_memory_versions").select("snapshot").eq("memory_id", payload.memoryId).order("version", { ascending: false }).limit(1).maybeSingle();
    if (!version?.snapshot) return reply({ error: "No existe una version anterior." }, 404);
    const snapshot = version.snapshot;
    const { error } = await admin.from("assistant_memories").update({
      generalized_output: snapshot.generalized_output,
      confidence: snapshot.confidence,
      support_count: snapshot.support_count,
      correction_count: snapshot.correction_count,
      contradiction_count: snapshot.contradiction_count,
      status: snapshot.status ?? "active",
      updated_at: new Date().toISOString(),
    }).eq("id", payload.memoryId);
    if (error) throw error;
    await admin.from("assistant_audit_log").insert({ actor_user_id: userId, action: "memory.rollback", target_type: "memory", target_id: payload.memoryId });
  }

  const [{ data: memories }, { count: feedbackCount }, { count: templateCount }, { data: evaluations }] = await Promise.all([
    admin.from("assistant_memories").select("id, user_id, scope, template_code, generalized_input, generalized_output, confidence, support_count, contradiction_count, status, updated_at").order("updated_at", { ascending: false }).limit(100),
    admin.from("assistant_feedback_triplets").select("id", { count: "exact", head: true }),
    admin.from("assistant_ai_templates").select("source_template_id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("assistant_eval_runs").select("id, model, prompt_version, status, metrics, started_at, completed_at").order("started_at", { ascending: false }).limit(10),
  ]);
  return reply({
    metrics: {
      feedback: feedbackCount ?? 0,
      memories: memories?.length ?? 0,
      active: memories?.filter((item) => item.status === "active").length ?? 0,
      conflicts: memories?.filter((item) => item.status === "quarantined" || item.contradiction_count > 0).length ?? 0,
      templates: templateCount ?? 0,
    },
    memories: memories ?? [],
    evaluations: evaluations ?? [],
  });
});
