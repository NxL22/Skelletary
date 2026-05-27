import {
  BadgeInfo,
  CalendarClock,
  FileSpreadsheet,
  KeyRound,
  Lock,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import ModalShell from "./ModalShell";
import {
  formatAccessDeadline,
  getAccessCountdownLabel,
  getProfileDisplayName,
} from "../lib/access";

function ActionCard({ title, description, children }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-4 flex flex-wrap gap-3">{children}</div>
    </div>
  );
}

export default function SettingsModal({
  open,
  onClose,
  accessState,
  appVersion,
  canImport,
  canManagePassword,
  editUnlocked,
  profile,
  onBlockedExport,
  onOpenChangePin,
  onOpenChangePassword,
  onOpenImport,
  onSignOut,
}) {
  const accountLabel = getProfileDisplayName(profile);
  const countdownLabel = getAccessCountdownLabel(profile, accessState);
  const deadlineLabel = formatAccessDeadline(profile);

  return (
    <ModalShell
      open={open}
      title="Ajustes"
      subtitle="Cuenta, acceso y controles locales del espacio de trabajo."
      onClose={onClose}
    >
      <div className="space-y-4">
        <ActionCard
          title="Cuenta y acceso"
          description="Este es el lugar central para revisar tu estado de acceso y manejar tu sesion."
        >
          <div className="grid w-full gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-slate-300">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Cuenta</div>
              <div className="mt-2 font-display text-xl text-white">{accountLabel}</div>
              {profile?.email ? (
                <div className="mt-2 break-all text-sm text-slate-400">{profile.email}</div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-cyan/15 bg-cyan/10 px-4 py-4 text-sm text-slate-100">
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan/80">
                Estado actual
              </div>
              <div className="mt-2 font-medium text-white">{accessState?.label || "Acceso pendiente"}</div>
              <div className="mt-2 text-slate-200">{countdownLabel}</div>
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-300">
                <CalendarClock className="h-4 w-4 text-cyan" />
                {deadlineLabel === "Sin fecha" ? "Sin fecha de vencimiento cargada" : `Vence el ${deadlineLabel}`}
              </div>
            </div>
          </div>

          <div className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300">
            {accessState?.detail || "Tu cuenta aun no tiene un estado de acceso definido."}
          </div>

          <button type="button" onClick={onSignOut} className="button-secondary">
            <UserRound className="h-4 w-4" />
            Cerrar sesion
          </button>

          <button
            type="button"
            onClick={onOpenChangePassword}
            className="button-secondary"
            disabled={!canManagePassword}
          >
            <KeyRound className="h-4 w-4" />
            Cambiar contraseña
          </button>
        </ActionCard>

        <ActionCard
          title="Importar plantillas"
          description="Sube plantillas desde Excel o CSV para agregarlas a tu cuenta."
        >
          <button
            type="button"
            onClick={onOpenImport}
            className="button-primary"
            disabled={!canImport || !editUnlocked}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Importar Excel o CSV
          </button>

          {!editUnlocked ? (
            <div className="rounded-2xl border border-rose/20 bg-rose/10 px-4 py-3 text-sm text-slate-200">
              Desbloquea la edicion con tu PIN local antes de importar.
            </div>
          ) : null}
        </ActionCard>

        <ActionCard
          title="Proteccion local"
          description="El PIN sigue funcionando como una barrera local para evitar cambios accidentales en tus plantillas."
        >
          <button
            type="button"
            onClick={onOpenChangePin}
            className="button-secondary"
            disabled={!canImport || !editUnlocked}
          >
            <ShieldCheck className="h-4 w-4" />
            Cambiar PIN
          </button>

          <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
            Version actual: {appVersion}
          </div>
        </ActionCard>

        <ActionCard
          title="Exportacion deshabilitada"
          description="En esta fase del producto nadie puede sacar datos desde la app. Solo se permite cargar informacion hacia la plataforma."
        >
          <button type="button" onClick={onBlockedExport} className="button-secondary">
            <Lock className="h-4 w-4" />
            Intentar exportar
          </button>

          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
            <div className="flex items-center gap-2 font-medium">
              <BadgeInfo className="h-4 w-4" />
              Regla actual del producto
            </div>
            <p className="mt-2 leading-6">
              Puedes meter plantillas a Skelletary, pero por ahora no puedes sacar la data desde la app.
            </p>
          </div>
        </ActionCard>

        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="button-primary">
            <X className="h-4 w-4" />
            Cerrar ajustes
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
