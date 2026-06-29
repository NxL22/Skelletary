import { Copy, Heart, Sparkles, Star } from "lucide-react";
import {
  DISPLAY_SHORTCUT_MAX_LENGTH,
  getTemplateCardHeading,
  getTemplateDisplayShortcut,
  getTemplateShortcutAliases,
} from "../lib/templates";
import { extractVariables, hasVariables } from "../lib/variables";
import TemplateContent from "./TemplateContent";

const TITLE_CLAMP_STYLE = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
};

const SUBTITLE_CLAMP_STYLE = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
};

// Fijamos alturas internas para que la ventana de preview se vea pareja entre
// tarjetas sin cambiar el tamano general de la card fuera del responsive.
const CARD_META_MIN_HEIGHT_CLASS = "min-h-[6.4rem]";
const CARD_HEADER_MIN_HEIGHT_CLASS = "min-h-[10.75rem]";
const CARD_PREVIEW_MIN_HEIGHT_CLASS = "min-h-[18.5rem]";
const CARD_FOOTER_MIN_HEIGHT_CLASS = "min-h-[4.5rem]";

function formatUpdated(updatedAt) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(updatedAt));
}

function normalizeCategoryLabel(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getCategoryBadgeTone(category = "") {
  const normalizedCategory = normalizeCategoryLabel(category);

  // Pintamos solo el chip de categoria para que cada familia de estudio se
  // reconozca rapido sin tocar el titulo clinico del informe.
  if (normalizedCategory.includes("angio")) {
    return "border border-emerald-400/25 bg-emerald-400/12 text-emerald-100";
  }

  if (normalizedCategory.includes("doppler")) {
    return "border border-sky-400/25 bg-sky-400/12 text-sky-100";
  }

  if (
    normalizedCategory.includes("ecografia") ||
    normalizedCategory.includes("eco ") ||
    normalizedCategory.startsWith("eco")
  ) {
    return "border border-violet-400/25 bg-violet-400/12 text-violet-100";
  }

  if (normalizedCategory.includes("resonancia") || /\brm\b/.test(normalizedCategory)) {
    return "border border-fuchsia-400/25 bg-fuchsia-400/12 text-fuchsia-100";
  }

  if (
    normalizedCategory.includes("radiografia") ||
    normalizedCategory.includes("rx") ||
    normalizedCategory.includes("rayos")
  ) {
    return "border border-amber-300/25 bg-amber-300/12 text-amber-100";
  }

  if (
    normalizedCategory.includes("tac") ||
    normalizedCategory.includes("tomografia") ||
    /\bct\b/.test(normalizedCategory) ||
    /\btc\b/.test(normalizedCategory)
  ) {
    return "border border-teal-300/25 bg-teal-300/12 text-teal-100";
  }

  return "border border-white/10 bg-white/5 text-slate-300";
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
  const shortcutAliases = getTemplateShortcutAliases(template);
  const shortcut = getTemplateDisplayShortcut(template);
  const extraShortcutCount = Math.max(shortcutAliases.length - 1, 0);
  const shouldShowShortcut = Boolean(shortcut) && shortcut.length <= DISPLAY_SHORTCUT_MAX_LENGTH;
  const shortcutHelpText =
    shortcutAliases.length > 1
      ? `Atajos disponibles: ${shortcutAliases.join(", ")}`
      : "Atajo rapido para encontrar esta plantilla mas facil en el buscador.";
  const categoryBadgeTone = getCategoryBadgeTone(template.category);
  const cardHeading = getTemplateCardHeading(template);

  return (
    <article
      className="group glass-panel flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] p-5 shadow-card transition hover:-translate-y-1 hover:border-cyan/20 hover:bg-white/[0.07]"
      onClick={() => onOpen(template)}
    >
      <div className={`flex items-start justify-between gap-3 ${CARD_HEADER_MIN_HEIGHT_CLASS}`}>
        <div className="min-w-0 flex-1">
          <div className={`mb-2 space-y-2 ${CARD_META_MIN_HEIGHT_CLASS}`}>
            <div className="flex min-h-[1.75rem] min-w-0 items-start">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${categoryBadgeTone}`}
              >
                {template.category}
              </span>
            </div>

            <div className="flex min-h-[1.75rem] min-w-0 items-start gap-2">
              {shouldShowShortcut ? (
                <div className="relative cursor-help" title={shortcutHelpText} aria-label={shortcutHelpText}>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge-soft font-mono text-cyan" title={shortcutHelpText}>
                      {shortcut}
                    </span>
                    {extraShortcutCount ? (
                      <span className="badge-soft text-slate-300" title={shortcutHelpText}>
                        {`+${extraShortcutCount} m\u00e1s`}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex min-h-[1.75rem] min-w-0 items-start">
              {variableEnabled ? (
                <span className="badge-soft text-rose">
                  <Sparkles className="h-3.5 w-3.5" />
                  {variableSummaryLabel}
                </span>
              ) : null}
            </div>
          </div>

          <div className="min-h-[4.9rem]" title={cardHeading.full}>
            <h3
              className="font-display text-[1.18rem] font-semibold leading-[1.15] tracking-[-0.03em] text-white"
              style={TITLE_CLAMP_STYLE}
            >
              {cardHeading.primary}
            </h3>
            {cardHeading.secondary ? (
              <p
                className="mt-1 text-sm leading-5 text-slate-400"
                style={SUBTITLE_CLAMP_STYLE}
              >
                {cardHeading.secondary}
              </p>
            ) : null}
          </div>
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

      <div className={`mt-4 flex-1 rounded-[22px] bg-slate-950/40 p-4 ${CARD_PREVIEW_MIN_HEIGHT_CLASS}`}>
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
                  {`+${variableCount - visibleVariables.length} m\u00e1s`}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
        <TemplateContent text={template.content} compact={variableEnabled} />
      </div>

      <div className={`mt-4 flex items-center justify-between gap-3 ${CARD_FOOTER_MIN_HEIGHT_CLASS}`}>
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
