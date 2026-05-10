import { CircleX, Search } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  resultCount,
  templateCount,
}) {
  return (
    <section className="glass-panel rounded-[28px] p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan" />
          <input
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Buscar por titulo, categoria, shortcut o contenido..."
            className="field-shell w-full pr-14 text-base"
            style={{ paddingLeft: "2.69em" }}
          />
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-900/85 text-slate-400 shadow-[0_10px_25px_rgba(15,23,42,0.28)] transition duration-200 hover:scale-105 hover:border-rose/40 hover:bg-rose/15 hover:text-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60"
              aria-label="Limpiar busqueda"
            >
              <CircleX className="h-[18px] w-[18px]" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="badge-soft">{templateCount} plantillas</span>
          <span className="badge-soft">{resultCount} resultados</span>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Busca por fragmentos o sin acentos. Ejemplos: nor, varic nor, torax.
      </p>
    </section>
  );
}
