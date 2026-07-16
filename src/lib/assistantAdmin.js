import { getSupabaseClient } from "./supabaseClient";

const FUNCTION_NAME = "assistant-admin";

export async function callAssistantAdmin(action, payload = {}, adminToken = null) {
  const supabase = getSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const response = await fetch(`${supabase.supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionData?.session?.access_token ?? ""}`,
      apikey: supabase.supabaseKey,
      ...(adminToken ? { "x-skelly-admin-token": adminToken } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "No pudimos abrir Skelly Lab.");
  return body;
}
