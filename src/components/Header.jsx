import {
  Bone,
  ClipboardList,
  CircleHelp,
  Info,
  LogOut,
  Plus,
  Pointer,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { getAccessCountdownLabel, getProfileDisplayName } from "../lib/access";
import { getPublicAssetPath } from "../lib/publicAssets";
import AnimatedLockIcon from "./AnimatedLockIcon";
import SkellyDashboardMascota from "./SkellyDashboardMascota";
import AssistantPanel from "./AssistantPanel";

// Header principal del dashboard.
//
// LAYOUT ORIGINAL (rollback 2026-07-04): vuelve al grid de 2 columnas con
// Skely mascota + Asistente vertical angosto a la derecha, y tarjetas
// Flujo + Cuenta a la izquierda. Asi Skely mascota vuelve a verse grande
// como antes.
//
// Mejoras que se mantienen adentro del Asistente:
//   - Sin dropdown de plantilla.
//   - Send flotante en el textarea.
//   - Botones de feedback (👍 / ✏️) con modo edicion in-place.
//   - Streaming SSE del Edge Function.

function RadiologyPulseBadge() {
  return (
    <div className="radiology-badge">
      <svg
        className="radiology-badge__icon"
        viewBox="0 0 32 16"
        aria-hidden="true"
      >
        <path
          className="radiology-badge__pulse-base"
          d="M2 8 H7 L9 4 L12 12 L15 2 L18 14 L21 8 H30"
        />
        <path
          className="radiology-badge__pulse-active"
          d="M2 8 H7 L9 4 L12 12 L15 2 L18 14 L21 8 H30"
        />
      </svg>
      <span>Asistente radiologico</span>
    </div>
  );
}

function SurfaceCard({ as: Tag = "div", className = "", children, ...props }) {
  return (
    <Tag
      className={`group relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(34,43,67,0.92),rgba(28,36,58,0.88))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_40px_rgba(6,12,28,0.18)] ${className}`}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(123,223,246,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_38%)]" />
      <div className="relative flex h-full flex-col">{children}</div>
    </Tag>
  );
}

function CardEyebrow({ children }) {
  return <p className="text-[14px] uppercase tracking-[0.22em] text-slate-500">{children}</p>;
}

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
      <div className="skelly-avatar-shell relative h-20 w-20">
        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/55 bg-[radial-gradient(circle_at_top,#ffffff_0%,#edf6ff_55%,#d7e7f5_100%)] shadow-[0_16px_34px_rgba(8,15,35,0.32)] ring-4 ring-white/10">
          <div className="absolute inset-[4px] rounded-full border border-cyan/15 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(224,236,247,0.88))]" />
          <Bone className="relative z-10 h-8 w-8 text-cyan" />
        </div>
        <svg className="skelly-avatar-ring" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="skelly-avatar-ring__base" cx="50" cy="50" r="47" />
          <circle className="skelly-avatar-ring__active-glow" cx="50" cy="50" r="47" />
          <circle className="skelly-avatar-ring__active" cx="50" cy="50" r="47" />
        </svg>
      </div>
    );
  }

  return (
    <div className="skelly-avatar-shell relative h-20 w-20">
      <div className="relative h-20 w-20 overflow-hidden rounded-full border border-white/55 bg-[radial-gradient(circle_at_top,#ffffff_0%,#eef6ff_55%,#d8e6f4_100%)] shadow-[0_16px_34px_rgba(8,15,35,0.32)] ring-4 ring-white/10">
        <div className="absolute inset-[4px] rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(226,238,248,0.82))]" />
        <img
          src={getPublicAssetPath("imagenes de Skelly/skelly_logo.webp")}
          alt="Logo de Skelletary"
          className="relative z-10 h-full w-full object-contain object-center scale-[1.34]"
          onError={onMissing}
        />
      </div>
      <svg className="skelly-avatar-ring" viewBox="0 0 100 100" aria-hidden="true">
        <circle className="skelly-avatar-ring__base" cx="50" cy="50" r="47" />
        <circle className="skelly-avatar-ring__active-glow" cx="50" cy="50" r="47" />
        <circle className="skelly-avatar-ring__active" cx="50" cy="50" r="47" />
      </svg>
    </div>
  );
}

export default function Header({
  accessState,
  addTemplateDisabled,
  backendConfigured,
  editUnlocked,
  editingEnabled,
  hasAssistantAccess = false,
  hasSession,
  profile,
  skellyIntroToken,
  unlockDisabled,
  unlockExpiresAt,
  onAccountClick,
  onHelpClick,
  onPushToast,
  onUnlockClick,
  onLockClick,
  onNewTemplate,
  onSignOut,
  onFeedbackRecorded = null,
}) {
  const [brandMissing, setBrandMissing] = useState(false);
  const remainingLabel = getRemainingTimeLabel(unlockExpiresAt);
  const accountLabel = getProfileDisplayName(profile);
  const accessSummary = getAccessCountdownLabel(profile, accessState);

  return (
    <header className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/60 p-5 shadow-glow sm:p-7 xl:p-8 2xl:p-9">
      <div className="scan-grid absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(123,223,246,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(246,171,200,0.16),transparent_32%)]" />

      <div className="relative grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-start 2xl:gap-7 2xl:grid-cols-[1.18fr_0.92fr]">
        {/* Columna izquierda: logo, tarjetas Flujo + Cuenta, botones. */}
        <div className="flex flex-col gap-4 lg:gap-5">
          <div>
            <div className="mb-5 flex items-center gap-4">
              <BrandBadge missing={brandMissing} onMissing={() => setBrandMissing(true)} />

              <div>
                <RadiologyPulseBadge />
                <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl 2xl:text-[3.7rem]">
                  Skelletary
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Repositorio de plantillas radiologicas
                </p>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)] 2xl:gap-4">
              <SurfaceCard className="min-h-[216px] 2xl:min-h-[228px]">
                <CardEyebrow>Flujo recomendado</CardEyebrow>
                <p className="mt-4 max-w-xl font-display text-[clamp(1.7rem,2.4vw,2.3rem)] leading-[1.28] text-white">
                  Busca, completa variables y copia sin friccion.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="badge-soft">Copiado inmediato</span>
                  <span className="badge-soft">Variables guiadas</span>
                  <span className="badge-soft">Dictado por voz</span>
                </div>
                <div className="mt-auto pt-5">
                  <div className="h-px bg-gradient-to-r from-white/10 via-cyan/20 to-transparent" />
                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    Flujo pensado para encontrar rapido, completar una vez y copiar sin romper el ritmo.
                  </p>
                </div>
              </SurfaceCard>

              <SurfaceCard
                as="button"
                type="button"
                onClick={onAccountClick}
                className="min-h-[216px] text-left transition duration-200 hover:border-cyan/35 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_40px_rgba(10,24,45,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70 2xl:min-h-[228px]"
                title="Abre el detalle de tu cuenta y estado de acceso"
              >
                <CardEyebrow>Cuenta</CardEyebrow>
                <p className="mt-4 truncate font-display text-[clamp(1.65rem,2.1vw,2.15rem)] text-white">
                  {accountLabel}
                </p>
                <p className="mt-4 text-lg text-slate-100">{accessSummary}</p>
                <p className="mt-2 text-[15px] uppercase tracking-[0.18em] text-slate-500">
                  {accessState?.label || "Acceso pendiente"}
                </p>
                <div className="mt-auto pt-5">
                  <div className="h-px bg-gradient-to-r from-white/10 via-cyan/20 to-transparent" />
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-cyan/85">
                    <Pointer className="h-4 w-4" />
                    Haz clic para ver el detalle
                  </div>
                </div>
              </SurfaceCard>
            </div>
          </div>

          {/* Bloque de ayuda del Asistente: SIEMPRE abierto, sin colapso, para
              que la altura del card del Header sea estable y predecible
              (nada de "saltos" cuando la usuaria hace foco o recibe output). */}
          <div className="overflow-hidden rounded-2xl border border-cyan/15 bg-cyan/[0.04]">
            <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-200">
              <Info className="h-4 w-4 text-cyan" />
              <span>Como usar Skelly te asiste</span>
            </div>
            <div className="space-y-3 border-t border-cyan/15 px-4 py-4 text-[18px] leading-7 text-slate-200">
              <p>
                Escribi una sola linea en lenguaje natural contandonos que
                examen queres informar (ej: <span className="font-mono text-cyan">eco abdomen esteatosis</span>)
                y Skelly elige la plantilla mas adecuada entre las que conoce
                y redacta el informe listo para copiar y pegar.
              </p>
              <p>
                Tambien podes dictarselo a Skelly con el microfono: el
                boton de dictado aparece al lado del boton de enviar.
              </p>
              <p>
                Si el caso tiene varios hallazgos posibles (por ejemplo
                diferentes estados de la vesicula) y el dato es
                indispensable, Skelly te va a hacer una sola pregunta breve
                antes de redactar.
              </p>
              <div>
                <p className="font-semibold text-white">Como aprende Skelly</p>
                <p className="mt-1">
                  Debajo del informe aparecen dos botones.{" "}
                  <span className="font-mono text-cyan">Sirvio tal cual</span>{" "}
                  confirma que el informe quedo bien y lo guarda como ejemplo
                  positivo.{" "}
                  <span className="font-mono text-cyan">Lo retoque y guardo version final</span>{" "}
                  te deja editar el informe y guarda tu version corregida
                  para que Skelly aprenda tu estilo en futuros informes.
                </p>
              </div>
              <p className="rounded-xl border border-lavender/20 bg-lavender/[0.06] px-3 py-2 text-[17px] leading-6 text-lavender">
                <span className="font-semibold">Configuracion:</span> las
                plantillas, la guia de estilo y los parametros del modelo
                los maneja el administrador de la aplicacion (owner). Si
                necesitas un cambio (nueva plantilla, ajuste de formato,
                conocimiento nuevo) avisale a el.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            {editUnlocked ? (
              <>
                <button
                  type="button"
                  onClick={onNewTemplate}
                  disabled={addTemplateDisabled}
                  title={addTemplateDisabled ? "Necesitas una cuenta activa para crear plantillas" : undefined}
                  className="button-primary group"
                >
                  <Plus className="h-4 w-4" />
                  Nueva plantilla
                </button>
                <button type="button" onClick={onLockClick} className="button-secondary group">
                  <AnimatedLockIcon mode="lock" className="h-4 w-4" />
                  Bloquear edicion
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onUnlockClick}
                disabled={unlockDisabled}
                title={unlockDisabled ? "Necesitas una cuenta activa para editar" : undefined}
                className="button-primary group"
              >
                <AnimatedLockIcon mode="unlock" className="h-4 w-4" />
                Desbloquear edicion
              </button>
            )}

            <a href="#/botones-eco" className="button-secondary group">
              <ClipboardList className="h-4 w-4" />
              Botones Eco
            </a>

            {hasSession ? (
              <button type="button" onClick={onSignOut} className="button-secondary group">
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            ) : null}
          </div>
        </div>

        {/* Columna derecha: Skelly mascota + Asistente vertical angosto (layout original). */}
        <div className="glass-panel relative overflow-hidden rounded-[28px] p-4 2xl:p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(184,181,255,0.16),transparent_40%)]" />

          <div className="relative flex h-full flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <div className="min-w-0">
                <p className="text-[15px] uppercase tracking-[0.22em] text-slate-400">Skelly</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-white">
                  Tu asistente radiologica
                </h2>
                <p className="mt-2 max-w-none text-sm leading-6 text-slate-400">
                  Tu secretaria con IA: redacta informes por vos, copia plantillas sin friccion
                  y aprende tu estilo con cada informe que le confirmas o corriges.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:justify-start sm:gap-3">
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[15px] font-medium ${
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
                  {backendConfigured
                    ? editingEnabled
                      ? editUnlocked
                        ? `Edicion desbloqueada${remainingLabel ? ` - ${remainingLabel}` : ""}`
                        : "Modo lectura"
                      : accessState?.label || "Acceso pendiente"
                    : "Backend pendiente"}
                </div>

                <button
                  type="button"
                  title="Abre una guia rapida para aprender a usar Skelletary"
                  onClick={onHelpClick}
                  className="button-secondary group sm:min-w-[138px] sm:justify-center"
                >
                  Skelly te guia
                  <CircleHelp className="h-4 w-4" />
                </button>
              </div>
            </div>

            <SkellyDashboardMascota
              introToken={skellyIntroToken}
              userId={profile?.id || null}
            />

            {/* Asistente: vertical angosto, dentro del card derecho.
                Mejoras internas (sin dropdown, send flotante, feedback, modo edicion). */}
            <AssistantPanel
              profile={profile}
              hasAccess={hasAssistantAccess && hasSession}
              onPushToast={onPushToast}
              onFeedbackRecorded={onFeedbackRecorded}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
