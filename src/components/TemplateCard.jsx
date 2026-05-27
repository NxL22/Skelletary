import { Copy, Heart, Sparkles, Star } from "lucide-react";
import { DISPLAY_SHORTCUT_MAX_LENGTH, getTemplateDisplayShortcut } from "../lib/templates";
import { extractVariables, hasVariables } from "../lib/variables";
import TemplateContent from "./TemplateContent";

function formatUpdated(updatedAt) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(updatedAt));
}

export default function TemplateCard({
  template,
  onOpen,
  onCopy,
  onToggleFavorite,
}) {
  const variables = extractVariables(template.content);
  const variableCount = variables.length;
  const variableEnabled = hasVariables(template.content);
  const visibleVariables = variables.slice(0, 3);
  const variableSummaryLabel = `${variableCount} ${variableCount === 1 ? "variable" : "variables"}`;
  const variableHintLabel =
    variableCount === 1
      ? "Variable a completar antes de copiar"
      : "Variables a completar antes de copiar";
  const shortcut = getTemplateDisplayShortcut(template);
  const shouldShowShortcut = Boolean(shortcut) && shortcut.length <= DISPLAY_SHORTCUT_MAX_LENGTH;

  return (
    <article
      className="group glass-panel flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] p-5 shadow-card transition hover:-translate-y-1 hover:border-cyan/20 hover:bg-white/[0.07]"
      onClick={() => onOpen(template)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex min-w-0 flex-wrap items-start gap-2">
            <span className="badge-soft">{template.category}</span>
            {shouldShowShortcut ? (
              <div className="group/shortcut relative">
                <span className="badge-soft font-mono text-cyan">{shortcut}</span>
                <div className="pointer-events-none absolute left-0 top-[calc(100%+0.55rem)] z-20 w-56 rounded-2xl border border-cyan/20 bg-slate-950/96 px-3 py-2 text-xs leading-5 text-slate-200 opacity-0 shadow-[0_18px_40px_rgba(5,10,25,0.38)] transition duration-200 group-hover/shortcut:opacity-100 group-focus-within/shortcut:opacity-100">
                  Atajo rapido para encontrar esta plantilla mas facil en el buscador.
                </div>
              </div>
            ) : null}
            {variableEnabled ? (
              <span className="badge-soft text-rose">
                <Sparkles className="h-3.5 w-3.5" />
                {variableSummaryLabel}
              </span>
            ) : null}
          </div>

          <h3 className="font-display text-xl font-semibold text-white">{template.title}</h3>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(template);
          }}
          className={`shrink-0 rounded-full p-2 transition ${
            template.favorite
              ? "bg-rose/10 text-rose"
              : "text-slate-500 hover:bg-white/10 hover:text-rose"
          }`}
          aria-label={template.favorite ? "Quitar de favoritas" : "Marcar como favorita"}
          title={template.favorite ? "Quitar de favoritas" : "Marcar como favorita"}
        >
          {template.favorite ? <Heart className="h-5 w-5 fill-current" /> : <Star className="h-5 w-5" />}
        </button>
      </div>

      <div className="mt-4 flex-1 rounded-[22px] bg-slate-950/40 p-4">
        {variableEnabled ? (
          <div className="mb-4 rounded-2xl border border-rose/20 bg-rose/10 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Sparkles className="h-4 w-4 text-rose" />
              {variableHintLabel}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {visibleVariables.map((variableName) => (
                <span key={variableName} className="placeholder-chip">
                  {variableName}
                </span>
              ))}
              {variableCount > visibleVariables.length ? (
                <span className="badge-soft text-rose">
                  +{variableCount - visibleVariables.length} mas
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
        <TemplateContent text={template.content} compact />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          <span>{template.copyCount} copias</span>
          <span>Actualizada {formatUpdated(template.updatedAt)}</span>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onCopy(template);
          }}
          className="button-primary !rounded-2xl !px-4 !py-2"
        >
          <Copy className="h-4 w-4" />
          Copiar
        </button>
      </div>
    </article>
  );
}
