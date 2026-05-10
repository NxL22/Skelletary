import {
  Bone,
  CircleHelp,
  Lock,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Unlock,
} from "lucide-react";
import { useState } from "react";

const SKELLY_ASSET_BASE = "/imagenes%20de%20Skelly";

function getRemainingTimeLabel(expiresAt) {
  if (!expiresAt) {
    return "";
  }

  const difference = new Date(expiresAt).getTime() - Date.now();
  const minutes = Math.max(0, Math.ceil(difference / 60000));
  return `${minutes} min`;
}

function BrandBadge({ missing, onMissing }) {
  if (missing) {
    return (
      <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/55 bg-[radial-gradient(circle_at_top,#ffffff_0%,#edf6ff_55%,#d7e7f5_100%)] shadow-[0_16px_34px_rgba(8,15,35,0.32)] ring-4 ring-white/10">
        <div className="absolute inset-[4px] rounded-full border border-cyan/15 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(224,236,247,0.88))]" />
        <Bone className="relative z-10 h-8 w-8 text-cyan" />
      </div>
    );
  }

  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-full border border-white/55 bg-[radial-gradient(circle_at_top,#ffffff_0%,#eef6ff_55%,#d8e6f4_100%)] shadow-[0_16px_34px_rgba(8,15,35,0.32)] ring-4 ring-white/10">
      <div className="absolute inset-[4px] rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(226,238,248,0.82))]" />
      <img
        src={`${SKELLY_ASSET_BASE}/skelly_logo.png`}
        alt="Logo de Skelletary"
        className="relative z-10 h-full w-full object-contain object-center scale-[1.34]"
        onError={onMissing}
      />
    </div>
  );
}

function HeroMascot({ missing, onMissing }) {
  if (missing) {
    return (
      <div className="flex w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-cyan/20 bg-[linear-gradient(180deg,#f6fbff,#dfe9f4)] px-6 py-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-rose/20 bg-rose/10">
          <Bone className="h-8 w-8 text-rose" />
        </div>
        <p className="font-display text-lg font-semibold text-slate-900">Skelly lista para copiar</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Si luego agregas o reemplazas <span className="font-mono text-cyan">/public/imagenes de Skelly/skelly-bust.png</span>, este espacio la mostrará automáticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[320px] items-end justify-center overflow-hidden rounded-[28px] border border-cyan/10 bg-[linear-gradient(180deg,#f5fbff_0%,#e8f1f9_56%,#dce8f5_100%)] px-4 pt-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(123,223,246,0.18),transparent_28%),radial-gradient(circle_at_75%_18%,rgba(184,181,255,0.18),transparent_20%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(40,86,128,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(40,86,128,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="pointer-events-none absolute inset-x-8 top-6 h-px bg-gradient-to-r from-transparent via-cyan/50 to-transparent" />
      <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-slate-200/60 bg-white/70 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-700 backdrop-blur">
        Diagnostic mode
      </div>
      <img
        src={`${SKELLY_ASSET_BASE}/skelly-bust.png`}
        alt="Skelly, asistente radiológica"
        className="relative z-10 h-full w-full object-cover object-[center_14%] scale-[1.08] drop-shadow-[0_24px_35px_rgba(85,120,155,0.35)]"
        onError={onMissing}
      />
    </div>
  );
}

export default function Header({
  addTemplateDisabled,
  editUnlocked,
  editingEnabled,
  settingsDisabled,
  unlockDisabled,
  unlockExpiresAt,
  onHelpClick,
  onUnlockClick,
  onLockClick,
  onNewTemplate,
  onSettingsClick,
}) {
  const [brandMissing, setBrandMissing] = useState(false);
  const [heroMissing, setHeroMissing] = useState(false);
  const remainingLabel = getRemainingTimeLabel(unlockExpiresAt);

  return (
    <header className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/60 p-5 shadow-glow sm:p-7">
      <div className="scan-grid absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(123,223,246,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(246,171,200,0.16),transparent_32%)]" />

      <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.95fr] lg:items-stretch">
        <div className="flex flex-col justify-between">
          <div>
            <div className="mb-5 flex items-center gap-4">
              <BrandBadge missing={brandMissing} onMissing={() => setBrandMissing(true)} />

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan">
                  <Sparkles className="h-3.5 w-3.5" />
                  Asistente radiológico
                </div>
                <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Skelletary
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Repositorio de plantillas radiológicas
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Velocidad</p>
                <p className="mt-2 font-display text-lg text-white">Copiar en un clic</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Flujo</p>
                <p className="mt-2 font-display text-lg text-white">Variables completables</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Control</p>
                <p className="mt-2 font-display text-lg text-white">Backup y PIN local</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSettingsClick}
              disabled={settingsDisabled}
              title={settingsDisabled ? "Disponible cuando el proyecto tenga backend" : undefined}
              className="button-secondary"
            >
              <Settings2 className="h-4 w-4" />
              Ajustes
            </button>

            {editUnlocked ? (
              <>
                <button
                  type="button"
                  onClick={onNewTemplate}
                  disabled={addTemplateDisabled}
                  title={addTemplateDisabled ? "Disponible cuando el proyecto tenga backend" : undefined}
                  className="button-primary"
                >
                  <Plus className="h-4 w-4" />
                  Nueva plantilla
                </button>
                <button type="button" onClick={onLockClick} className="button-secondary">
                  <Lock className="h-4 w-4" />
                  Bloquear edición
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onUnlockClick}
                disabled={unlockDisabled}
                title={unlockDisabled ? "Disponible cuando el proyecto tenga backend" : undefined}
                className="button-primary"
              >
                <Unlock className="h-4 w-4" />
                Desbloquear edición
              </button>
            )}
          </div>
        </div>

        <div className="glass-panel relative overflow-hidden rounded-[28px] p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(184,181,255,0.16),transparent_40%)]" />

          <div className="relative flex h-full flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Skelly</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-white">
                  Tu asistente radiológica
                </h2>
                <p className="mt-1 max-w-sm text-sm leading-6 text-slate-400">
                  Skelly te ayuda a completar tus plantillas con variables inteligentes y a mantener tu trabajo seguro con backups automáticos y un PIN local.
                </p>
                <button
                  type="button"
                  title="Abre una guía rápida para aprender a usar Skelletary"
                  onClick={onHelpClick}
                  className="button-secondary mt-4"
                >
                  Skelly te guía
                  <CircleHelp className="h-4 w-4" />
                </button>
              </div>

              <div
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                  editingEnabled && editUnlocked
                    ? "bg-emerald-400/10 text-emerald-200"
                    : "bg-white/5 text-slate-300"
                }`}
              >
                {editingEnabled && editUnlocked ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                {editingEnabled && editUnlocked
                  ? `Edición desbloqueada${remainingLabel ? ` · ${remainingLabel}` : ""}`
                  : editingEnabled
                    ? "Modo lectura"
                    : "Edición en pausa"}
              </div>
            </div>

            <HeroMascot missing={heroMissing} onMissing={() => setHeroMissing(true)} />
          </div>
        </div>
      </div>
    </header>
  );
}
