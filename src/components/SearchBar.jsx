import SearchField from "./SearchField";

export default function SearchBar({
  value,
  onChange,
  resultCount,
  templateCount,
}) {
  return (
    <section className="glass-panel rounded-[28px] p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <SearchField
          value={value}
          onChange={onChange}
          placeholder="Buscar por titulo, categoria, atajo o contenido..."
          voiceTitle="Dictar busqueda"
          className="flex-1"
        />

        <div className="flex flex-wrap gap-2">
          <span className="badge-soft">{templateCount} plantillas</span>
          <span className="badge-soft">{resultCount} resultados</span>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Busca por fragmentos o sin acentos. Tambien puedes dictar con el micro. Ejemplos: nor, varic nor, torax.
      </p>
    </section>
  );
}
