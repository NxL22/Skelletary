import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

function buildVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-right", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis-left",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis-left",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-right",
    totalPages,
  ];
}

function PagerButton({ disabled, onClick, ariaLabel, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="button-secondary button-no-lift !rounded-full !px-3 !py-2 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) {
  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const visiblePages = buildVisiblePages(currentPage, totalPages);

  return (
    <div className="glass-panel rounded-[24px] p-4 shadow-card">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Paginación</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Mostrando {startItem}-{endItem} de {totalItems} plantillas. Página {currentPage} de {totalPages}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PagerButton
            disabled={currentPage === 1}
            onClick={() => onPageChange(1)}
            ariaLabel="Ir a la primera página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </PagerButton>

          <PagerButton
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            ariaLabel="Ir a la página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </PagerButton>

          {visiblePages.map((page) =>
            typeof page === "number" ? (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? "page" : undefined}
                className={
                  page === currentPage
                    ? "button-primary !rounded-full !px-4 !py-2"
                    : "button-secondary !rounded-full !px-4 !py-2"
                }
              >
                {page}
              </button>
            ) : (
              <span
                key={page}
                className="inline-flex min-w-8 items-center justify-center px-1 text-sm text-slate-500"
              >
                ...
              </span>
            ),
          )}

          <PagerButton
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            ariaLabel="Ir a la página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </PagerButton>

          <PagerButton
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
            ariaLabel="Ir a la última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </PagerButton>
        </div>
      </div>
    </div>
  );
}
