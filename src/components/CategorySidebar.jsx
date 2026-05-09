import { Clock3, FolderOpen, LayoutGrid, Star } from "lucide-react";
import { SPECIAL_VIEWS } from "../lib/templates";

const SPECIAL_ICONS = {
  [SPECIAL_VIEWS.all]: LayoutGrid,
  [SPECIAL_VIEWS.favorites]: Star,
  [SPECIAL_VIEWS.recent]: Clock3,
};

function ViewButton({ active, label, count, onClick }) {
  const Icon = SPECIAL_ICONS[label] || FolderOpen;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${
        active
          ? "border border-cyan/30 bg-cyan/10 text-white"
          : "border border-transparent bg-white/0 text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="flex items-center gap-3">
        <Icon className={`h-4 w-4 ${active ? "text-cyan" : "text-slate-500"}`} />
        {label}
      </span>
      <span className="rounded-full bg-slate-950/70 px-2 py-1 text-xs text-slate-400">{count}</span>
    </button>
  );
}

export default function CategorySidebar({
  categories,
  activeView,
  onChange,
  counts,
  favoriteCount,
  recentCount,
}) {
  const items = [
    { label: SPECIAL_VIEWS.all, count: Object.values(counts).reduce((sum, value) => sum + value, 0) },
    { label: SPECIAL_VIEWS.favorites, count: favoriteCount },
    { label: SPECIAL_VIEWS.recent, count: recentCount },
    ...categories.map((category) => ({ label: category, count: counts[category] || 0 })),
  ];

  return (
    <>
      <div className="glass-panel rounded-[24px] p-3 shadow-card lg:hidden">
        <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
          Categoría
        </label>
        <select
          value={activeView}
          onChange={(event) => onChange(event.target.value)}
          className="field-shell py-3"
        >
          {items.map((item) => (
            <option key={item.label} value={item.label}>
              {item.label} ({item.count})
            </option>
          ))}
        </select>
      </div>

      <aside className="glass-panel hidden rounded-[28px] p-4 shadow-card lg:block">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Biblioteca</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-white">Categorías</h2>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <ViewButton
              key={item.label}
              active={item.label === activeView}
              label={item.label}
              count={item.count}
              onClick={() => onChange(item.label)}
            />
          ))}
        </div>
      </aside>
    </>
  );
}
