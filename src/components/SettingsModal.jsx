import {
  BadgeInfo,
  FileSpreadsheet,
  KeyRound,
  Lock,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import ModalShell from "./ModalShell";

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
  return (
    <ModalShell
      open={open}
      title="Ajustes"
      subtitle="Cuenta, importacion y controles locales del espacio de trabajo."
      onClose={onClose}
    >
      <div className="space-y-4">
        <ActionCard
          title="Cuenta y acceso"
          description="Aqui queda visible el estado comercial de tu acceso y los controles de sesion."
        >
          <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
            <div className="font-medium text-white">{profile?.email || "Sin sesion activa"}</div>
            <div className="mt-1">{accessState?.label || "Acceso pendiente"}</div>
            <div className="mt-1">
              Biblioteca oficial:{" "}
              {profile?.hasCoreLibrary === false ? "no compartida para esta cuenta" : "compartida"}
            </div>
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
          title="Importar a mi biblioteca"
          description="Sube plantillas desde Excel o CSV. Se importan a tu biblioteca personal, nunca a la biblioteca oficial."
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
          description="El PIN sigue funcionando como una barrera local para evitar cambios accidentales en tu biblioteca personal."
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
          description="En esta fase del producto nadie puede sacar datos desde la app. Solo se permite cargar informacion hacia tu biblioteca personal."
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
