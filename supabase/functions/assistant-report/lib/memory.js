// Recuperacion de memorias personales y conocimiento global promovido por owner.

export async function retrieveMemories(adminClient, userId, input, templateCode, limit = 3) {
  try {
    const session = new Supabase.ai.Session("gte-small");
    const embedding = await session.run(String(input), { mean_pool: true, normalize: true });
    const { data, error } = await adminClient.rpc("match_assistant_memories", {
      query_embedding: embedding,
      requesting_user_id: userId,
      requested_template_code: templateCode,
      match_count: Math.min(Math.max(limit, 1), 3),
    });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    // La memoria mejora la respuesta, pero nunca debe impedir un informe.
    console.warn("Memoria no disponible; continuamos con la plantilla:", error?.message ?? error);
    return [];
  }
}
