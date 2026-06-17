import { ChevronLeft, ChevronRight, Clock3, FolderOpen, LayoutGrid, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SPECIAL_VIEWS } from "../lib/templates";
import SearchField from "./SearchField";

const SPECIAL_ICONS = {
  [SPECIAL_VIEWS.all]: LayoutGrid,
  [SPECIAL_VIEWS.favorites]: Star,
  [SPECIAL_VIEWS.recent]: Clock3,
};

const CATEGORY_SLOT_MIN_HEIGHT_PX = 54;
const CATEGORY_SLOT_GAP_PX = 8;

function getCategoryPageSize(viewportWidth = 0) {
  // Limitamos cuantas carpetas se muestran por pagina para que el panel lateral
  // respire mejor en cada breakpoint y no termine empujando un bloque vacio enorme.
  if (viewportWidth >= 1536) {
    return 9;
  }

  if (viewportWidth >= 1024) {
    return 8;
  }

  if (viewportWidth >= 640) {
    return 6;
  }

  return 5;
}

function normalizeCategorySearch(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

function ViewButton({ active, label, count, onClick }) {
  const Icon = SPECIAL_ICONS[label] || FolderOpen;

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`group flex min-h-[54px] w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${
        active
          ? "border border-cyan/30 bg-cyan/10 text-white"
          : "border border-transparent bg-white/0 text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon
          className={`h-4 w-4 transition duration-200 ${
            active
              ? "text-cyan"
              : "text-slate-500 group-hover:translate-x-0.5 group-hover:text-cyan/80"
          }`}
        />
        <span className="truncate">{label}</span>
      </span>
      <span className="ml-3 shrink-0 rounded-full bg-slate-950/70 px-2 py-1 text-xs text-slate-400 transition duration-200 group-hover:border-cyan/20 group-hover:text-slate-200">
        {count}
      </span>
    </button>
  );
}

function CategoryPageControls({ currentPage, totalPages, totalItems, pageSize, onPageChange }) {
  const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  return (
    <div className="mt-4 rounded-[22px] border border-white/10 bg-slate-950/35 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Categorias</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {startItem}-{endItem} de {totalItems}. Pagina {currentPage} de {totalPages}.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={totalPages <= 1 || currentPage === 1}
            aria-label="Ir a la pagina anterior de categorias"
            className="button-secondary button-no-lift !rounded-full !px-3 !py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={totalPages <= 1 || currentPage === totalPages}
            aria-label="Ir a la pagina siguiente de categorias"
            className="button-secondary button-no-lift !rounded-full !px-3 !py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CategorySidebar({
  categories,
  activeView,
  onChange,
  counts,
  favoriteCount,
  recentCount,
  viewportWidth,
}) {
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryPage, setCategoryPage] = useState(1);
  const normalizedSearch = normalizeCategorySearch(categorySearch);
  const categoryPageSize = getCategoryPageSize(viewportWidth);
  const specialItems = [
    { label: SPECIAL_VIEWS.all, count: Object.values(counts).reduce((sum, value) => sum + value, 0) },
    { label: SPECIAL_VIEWS.favorites, count: favoriteCount },
    { label: SPECIAL_VIEWS.recent, count: recentCount },
  ];

  const filteredCategoryItems = useMemo(() => {
    const baseItems = categories.map((category) => ({
      label: category,
      count: counts[category] || 0,
    }));

    if (!normalizedSearch) {
      return baseItems;
    }

    const matchingItems = baseItems.filter((item) =>
      normalizeCategorySearch(item.label).includes(normalizedSearch),
    );

    if (
      activeView &&
      !SPECIAL_ICONS[activeView] &&
      !matchingItems.some((item) => item.label === activeView)
    ) {
      const activeItem = baseItems.find((item) => item.label === activeView);

      if (activeItem) {
        return [activeItem, ...matchingItems];
      }
    }

    return matchingItems;
  }, [activeView, categories, counts, normalizedSearch]);

  const totalCategoryPages = Math.max(1, Math.ceil(filteredCategoryItems.length / categoryPageSize));
  const resolvedCategoryPage = Math.min(categoryPage, totalCategoryPages);
  const categoryStartIndex = (resolvedCategoryPage - 1) * categoryPageSize;
  const paginatedCategoryItems = filteredCategoryItems.slice(
    categoryStartIndex,
    categoryStartIndex + categoryPageSize,
  );
  const categorySlots = Array.from({ length: categoryPageSize }, (_, index) => {
    return paginatedCategoryItems[index] || null;
  });
  const categoryListMinHeight =
    categoryPageSize * CATEGORY_SLOT_MIN_HEIGHT_PX +
    Math.max(0, categoryPageSize - 1) * CATEGORY_SLOT_GAP_PX;

  useEffect(() => {
    setCategoryPage(1);
  }, [normalizedSearch]);

  useEffect(() => {
    if (categoryPage !== resolvedCategoryPage) {
      setCategoryPage(resolvedCategoryPage);
    }
  }, [categoryPage, resolvedCategoryPage]);

  useEffect(() => {
    if (SPECIAL_ICONS[activeView]) {
      return;
    }

    const activeIndex = filteredCategoryItems.findIndex((item) => item.label === activeView);

    if (activeIndex === -1) {
      return;
    }

    // Si la carpeta activa cae en otra pagina, movemos el paginador para que
    // la seleccion visible siempre coincida con lo que el usuario esta viendo.
    const nextPage = Math.floor(activeIndex / categoryPageSize) + 1;

    if (nextPage !== resolvedCategoryPage) {
      setCategoryPage(nextPage);
    }
  }, [activeView, categoryPageSize, filteredCategoryItems, resolvedCategoryPage]);

  function handleCategoryPageChange(nextPage) {
    const targetPage = Math.max(1, Math.min(nextPage, totalCategoryPages));

    if (targetPage === resolvedCategoryPage) {
      return;
    }

    setCategoryPage(targetPage);
  }

  const specialItemsMarkup = (
    <div className="space-y-2">
      {specialItems.map((item) => (
        <ViewButton
          key={item.label}
          active={item.label === activeView}
          label={item.label}
          count={item.count}
          onClick={() => onChange(item.label)}
        />
      ))}
    </div>
  );

  const categoryItemsMarkup = paginatedCategoryItems.length ? (
    <div
      className="space-y-2"
      style={{ minHeight: `${categoryListMinHeight}px` }}
    >
      {categorySlots.map((item, index) =>
        item ? (
          <ViewButton
            key={item.label}
            active={item.label === activeView}
            label={item.label}
            count={item.count}
            onClick={() => onChange(item.label)}
          />
        ) : (
          <div
            key={`category-placeholder-${index}`}
            aria-hidden="true"
            className="min-h-[54px] rounded-2xl border border-dashed border-white/[0.05] bg-slate-950/[0.16]"
          />
        ),
      )}
    </div>
  ) : (
    <div
      className="flex items-center rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-4 text-sm text-slate-400"
      style={{ minHeight: `${categoryListMinHeight}px` }}
    >
      No encontramos categorias con ese termino.
    </div>
  );

  return (
    <>
      <div className="glass-panel rounded-[24px] p-3 shadow-card lg:hidden">
        <div className="mb-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Navegacion</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-white">Categorias</h2>
        </div>

        <div className="space-y-4">
          <SearchField
            value={categorySearch}
            onChange={setCategorySearch}
            placeholder="Buscar categoria..."
            voiceTitle="Dictar categoria"
            inputClassName="py-3 text-sm"
            iconClassName="h-4 w-4 text-slate-500"
          />

          {specialItemsMarkup}

          <div className="h-px bg-white/10" />

          {categoryItemsMarkup}

          <CategoryPageControls
            currentPage={resolvedCategoryPage}
            totalPages={totalCategoryPages}
            totalItems={filteredCategoryItems.length}
            pageSize={categoryPageSize}
            onPageChange={handleCategoryPageChange}
          />
        </div>
      </div>

      <aside className="glass-panel hidden self-start rounded-[28px] p-4 shadow-card lg:block">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Navegacion</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-white">Categorias</h2>
        </div>

        <div className="mb-4">
          <SearchField
            value={categorySearch}
            onChange={setCategorySearch}
            placeholder="Filtrar categorias..."
            voiceTitle="Dictar categoria"
            inputClassName="py-3 text-sm"
            iconClassName="h-4 w-4 text-slate-500"
          />
        </div>

        {specialItemsMarkup}

        <div className="my-4 h-px bg-white/10" />

        {categoryItemsMarkup}

        <CategoryPageControls
          currentPage={resolvedCategoryPage}
          totalPages={totalCategoryPages}
          totalItems={filteredCategoryItems.length}
          pageSize={categoryPageSize}
          onPageChange={handleCategoryPageChange}
        />
      </aside>
    </>
  );
}
