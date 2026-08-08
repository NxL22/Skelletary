import {
  Activity,
  Bone,
  Check,
  CircleDot,
  Copy,
  Footprints,
  GitBranch,
  Hand,
  HeartPulse,
  Layers3,
  ScanLine,
  Sparkles,
  UserRound,
  Waves,
} from "lucide-react";
import { useState } from "react";
import { getEcoCardImagePath } from "../lib/botonesEco";

const VISUAL_ICONS = {
  abdomen: ScanLine,
  "abdomen-infantil": CircleDot,
  renal: Activity,
  pelvis: UserRound,
  tiroides: CircleDot,
  genitourinario: Activity,
  doppler: Waves,
  "doppler-cuello": GitBranch,
  vascular: GitBranch,
  hombro: Bone,
  mano: Hand,
  pie: Footprints,
  extremidad: Bone,
  cara: UserRound,
  torax: HeartPulse,
  "partes-blandas": Layers3,
  general: Sparkles,
};

const GROUP_ICON_ACCENTS = {
  "abdomen-pelvis": "text-cyan",
  cuello: "text-lavender",
  genitourinario: "text-rose",
  "doppler-vascular": "text-emerald-200",
  musculoesqueletico: "text-amber-200",
  "partes-blandas": "text-sky-200",
  "mis-tarjetas": "text-slate-200",
};

// Cada familia conserva una identidad cromatica, pero la expresamos como una
// atmosfera alrededor de la imagen. Asi el color ayuda a orientarse sin
// convertir la tarjeta en una etiqueta con una linea decorativa.
const GROUP_THEMES = {
  "abdomen-pelvis": {
    wash: "from-cyan/[0.11]",
    glow: "bg-cyan/[0.14]",
    frame: "border-cyan/15",
  },
  cuello: {
    wash: "from-indigo-300/[0.1]",
    glow: "bg-indigo-300/[0.13]",
    frame: "border-indigo-200/15",
  },
  genitourinario: {
    wash: "from-rose-300/[0.09]",
    glow: "bg-rose-300/[0.12]",
    frame: "border-rose-200/15",
  },
  "doppler-vascular": {
    wash: "from-emerald-300/[0.1]",
    glow: "bg-emerald-300/[0.13]",
    frame: "border-emerald-200/15",
  },
  musculoesqueletico: {
    wash: "from-amber-300/[0.09]",
    glow: "bg-amber-300/[0.12]",
    frame: "border-amber-200/15",
  },
  "partes-blandas": {
    wash: "from-sky-300/[0.1]",
    glow: "bg-sky-300/[0.13]",
    frame: "border-sky-200/15",
  },
  "mis-tarjetas": {
    wash: "from-white/[0.08]",
    glow: "bg-white/[0.1]",
    frame: "border-white/15",
  },
};

function VisualIcon({ visualKey, className = "h-8 w-8" }) {
  const Icon = VISUAL_ICONS[visualKey] || Sparkles;
  return <Icon aria-hidden="true" className={className} strokeWidth={1.65} />;
}

export default function BotonesEcoCard({ card, copied, onCopy, onEdit, canEdit }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imagePath = getEcoCardImagePath(card);
  const iconAccentClass = GROUP_ICON_ACCENTS[card.groupId] || GROUP_ICON_ACCENTS["mis-tarjetas"];
  const theme = GROUP_THEMES[card.groupId] || GROUP_THEMES["mis-tarjetas"];
  const imageFrameClass = `relative flex h-[112px] w-[136px] items-center justify-center overflow-hidden rounded-[18px] border ${theme.frame} bg-slate-900/55 shadow-[0_12px_30px_rgba(2,8,23,0.2)]`;

  return (
    <article className="relative flex min-h-[264px] h-full flex-col overflow-hidden rounded-[20px] border border-white/10 bg-slate-900/60 shadow-card focus-within:border-cyan/40">
      <button
        type="button"
        onClick={() => onCopy(card)}
        className="relative flex min-h-0 flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan/80 active:bg-white/[0.02]"
        aria-label={`Copiar ${card.name}`}
      >
        <span
          className={`pointer-events-none absolute inset-x-0 top-0 h-36 rounded-t-[20px] bg-gradient-to-b ${theme.wash} to-transparent opacity-80`}
          aria-hidden="true"
        />

        <div className="flex min-h-8 items-center justify-end px-4 pt-4">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${copied ? "text-cyan" : "text-slate-400"}`}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </span>
        </div>

        <div className="flex h-[136px] shrink-0 items-center justify-center px-5 py-3">
          {imagePath && !imageFailed ? (
            <div className={imageFrameClass}>
              <span
                className={`pointer-events-none absolute -inset-6 rounded-full blur-2xl ${theme.glow}`}
                aria-hidden="true"
              />
              <img
                src={imagePath}
                alt=""
                className="relative h-full w-full object-contain opacity-90 mix-blend-screen [filter:invert(1)_hue-rotate(150deg)_saturate(1.2)]"
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            </div>
          ) : (
            <div className={imageFrameClass}>
              <span
                className={`pointer-events-none absolute -inset-6 rounded-full blur-2xl ${theme.glow}`}
                aria-hidden="true"
              />
              <VisualIcon visualKey={card.visualKey} className={`relative h-11 w-11 ${iconAccentClass}`} />
            </div>
          )}
        </div>

        <div className="flex min-h-[88px] flex-1 flex-col px-4 pb-4">
          <h3 className="h-[3.25rem] overflow-hidden font-display text-[17px] font-semibold leading-6 text-white line-clamp-2">
            {card.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-slate-400/80">
            {card.copyText}
          </p>
        </div>
      </button>

      <div className="flex min-h-12 shrink-0 items-center justify-end border-t border-white/10 px-4 py-2.5">
        <button
          type="button"
          onClick={() => onEdit(card)}
          disabled={!canEdit}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70 disabled:cursor-not-allowed disabled:opacity-50"
          title={canEdit ? `Editar ${card.name}` : "Desbloquea la edicion para modificar tarjetas"}
        >
          Editar
        </button>
      </div>
    </article>
  );
}

export { VisualIcon };
