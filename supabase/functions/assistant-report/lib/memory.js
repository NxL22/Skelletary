// Recuperacion semantica compacta. Si embeddings o la migracion aun no estan
// disponibles, devuelve vacio para mantener operativo el RAG anterior.

export async function retrieveMemories(adminClient, userId, input, templateCode, limit = 4) {
  try {
    const session = new Supabase.ai.Session("gte-small");
    const embedding = await session.run(String(input), { mean_pool: true, normalize: true });
    const { data, error } = await adminClient.rpc("match_assistant_memories", {
      query_embedding: embedding,
      requesting_user_id: userId,
      requested_template_code: templateCode,
      match_count: Math.min(Math.max(limit, 1), 4),
    });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Memoria semantica no disponible; continuamos con RAG base:", error?.message ?? error);
    return [];
  }
}

export function buildMemoryBlock(memories) {
  if (!memories?.length) return "";
  const lines = [
    "MEMORIAS HUMANAS VALIDADAS (usa solo si corresponden exactamente al caso; nunca copies medidas):",
    "",
  ];
  memories.forEach((memory, index) => {
    lines.push(`Memoria ${index + 1} (confianza ${Number(memory.confidence).toFixed(2)}):`);
    lines.push(`Entrada generalizada: ${memory.generalized_input}`);
    lines.push("Resultado aprobado generalizado:");
    lines.push(memory.generalized_output);
    lines.push("");
  });
  return lines.join("\n");
}
