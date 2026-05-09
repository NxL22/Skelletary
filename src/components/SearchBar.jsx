import { Search, X } from "lucide-react";

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
            placeholder="Buscar por título, categoría, shortcut o contenido..."
            className="field-shell w-full pr-12 text-base"
            style={{ paddingLeft: "2.69em" }}
          />
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="badge-soft">{templateCount} plantillas</span>
          <span className="badge-soft">{resultCount} resultados</span>
        </div>
      </div>
    </section>
  );
}
