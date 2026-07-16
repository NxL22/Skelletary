import { useEffect, useState } from "react";
import { Activity, BrainCircuit, LogOut, RotateCcw, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";
import { callAssistantAdmin } from "../lib/assistantAdmin";

export default function SkellyLab() {
  const [pin, setPin] = useState("");
  const [token, setToken] = useState(() => sessionStorage.getItem("skelly-lab-token") || "");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(token));

  async function load(currentToken = token) {
    setLoading(true);
    try {
      setData(await callAssistantAdmin("overview", {}, currentToken));
      setError("");
    } catch (nextError) {
      sessionStorage.removeItem("skelly-lab-token");
      setToken("");
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (token) load(token); }, []);

  async function login(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await callAssistantAdmin("login", { pin });
      sessionStorage.setItem("skelly-lab-token", result.token);
      setToken(result.token);
      setPin("");
      await load(result.token);
    } catch (nextError) {
      setError(nextError.message);
      setLoading(false);
    }
  }

  async function mutate(action, payload) {
    setLoading(true);
    try {
      setData(await callAssistantAdmin(action, payload, token));
      setError("");
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token || !data) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <form onSubmit={login} className="w-full max-w-md border-l-2 border-cyan bg-slate-900/80 p-8">
        <ShieldCheck className="mb-6 h-10 w-10 text-cyan" />
        <p className="font-mono text-[15px] uppercase tracking-[0.22em] text-cyan">Ruta privada</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Skelly Lab</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Auditoría y reversión del aprendizaje automático. El aprendizaje no espera aprobación.</p>
        <input autoFocus type="password" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="PIN privado" className="mt-7 w-full border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan" />
        {error ? <p className="mt-3 text-sm text-rose">{error}</p> : null}
        <button disabled={loading} className="button-primary mt-5 w-full justify-center">{loading ? "Verificando..." : "Entrar al laboratorio"}</button>
      </form>
    </main>;
  }

  const metrics = [
    ["Feedback validado", data.metrics.feedback], ["Memorias", data.metrics.memories],
    ["Activas", data.metrics.active], ["Conflictos", data.metrics.conflicts],
    ["Plantillas IA", data.metrics.templates],
  ];
  return <main className="min-h-screen bg-slate-950 text-slate-100">
    <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-white/10 bg-slate-900/60 p-6 lg:border-b-0 lg:border-r">
        <BrainCircuit className="h-9 w-9 text-cyan" />
        <h1 className="mt-4 font-display text-2xl font-semibold">Skelly Lab</h1>
        <nav className="mt-10 space-y-2 text-sm"><p className="border-l-2 border-cyan bg-cyan/10 px-3 py-2 text-cyan">Aprendizaje</p><p className="px-3 py-2 text-slate-500">Evaluaciones · próximo ciclo</p></nav>
        {/* Navegamos a la ruta base real para forzar que App salga del modo
            Skelly Lab. Usar solo `#/` cambia el hash, pero no garantiza un
            nuevo render porque la app no depende de un router. */}
        <a href={window.location.pathname || "/"} className="mt-12 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><LogOut className="h-4 w-4" /> Volver a Skelletary</a>
      </aside>
      <section className="p-5 sm:p-8 lg:p-10">
        <div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[15px] uppercase tracking-[0.2em] text-cyan">Memoria colectiva</p><h2 className="mt-2 font-display text-3xl font-semibold">Estado del aprendizaje</h2></div><Activity className="h-7 w-7 text-emerald-400" /></div>
        <div className="mt-8 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3 xl:grid-cols-5">{metrics.map(([label, value]) => <div key={label} className="bg-slate-900 p-5 text-center"><strong className="block text-3xl text-white">{value}</strong><span className="mt-2 block text-[15px] uppercase tracking-wider text-slate-400">{label}</span></div>)}</div>
        {error ? <p className="mt-5 border-l-2 border-rose bg-rose/10 p-3 text-sm text-rose">{error}</p> : null}
        <div className="mt-10"><h3 className="font-display text-xl font-semibold">Memorias recientes</h3><div className="mt-4 divide-y divide-white/10 border-y border-white/10">{data.memories.map((memory) => <article key={memory.id} className="grid gap-4 py-5 xl:grid-cols-[1fr_150px_160px]"><div><p className="line-clamp-2 text-sm text-slate-300">{memory.generalized_input}</p><p className="mt-2 line-clamp-2 font-mono text-[15px] text-slate-500">{memory.generalized_output}</p></div><div className="text-sm"><p className="text-center text-2xl font-semibold text-cyan">{Math.round(Number(memory.confidence) * 100)}%</p><p className="text-center text-[15px] text-slate-500">confianza · {memory.support_count} apoyos</p></div><div className="flex items-center justify-end gap-2"><button title="Revertir ultima version" onClick={() => mutate("rollback", { memoryId: memory.id })} className="border border-white/10 p-2 hover:border-cyan"><RotateCcw className="h-4 w-4" /></button><button title={memory.status === "active" ? "Desactivar" : "Activar"} onClick={() => mutate("set-status", { memoryId: memory.id, status: memory.status === "active" ? "disabled" : "active" })} className="border border-white/10 p-2 hover:border-cyan">{memory.status === "active" ? <ToggleRight className="h-5 w-5 text-emerald-400" /> : <ToggleLeft className="h-5 w-5 text-slate-500" />}</button></div></article>)}</div></div>
        {loading ? <p className="mt-5 text-sm text-cyan">Actualizando...</p> : null}
      </section>
    </div>
  </main>;
}
