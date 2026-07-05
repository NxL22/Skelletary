import {
  CalendarClock,
  KeyRound,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import {
  formatAccessDeadline,
  getAccessCountdownLabel,
  getProfileDisplayName,
} from "../lib/access";
import { updateDisplayName } from "../lib/profile";

function ActionCard({ title, description, children }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-4 flex flex-wrap gap-3">{children}</div>
    </div>
  );
}

// SettingsModal con el modulo de cambio de nombre del usuario.
// El nombre se persiste en profiles.display_name via el helper updateDisplayName.
// El trigger SQL (validate_display_name) valida longitud server-side.
export default function SettingsModal({
  open,
  onClose,
  accessState,
  appVersion,
  canManagePassword,
  editUnlocked,
  profile,
  onOpenChangePin,
  onOpenChangePassword,
  onSignOut,
  onProfileUpdated,
}) {
  const accountLabel = getProfileDisplayName(profile);
  const countdownLabel = getAccessCountdownLabel(profile, accessState);
  const deadlineLabel = formatAccessDeadline(profile);

  const [draftName, setDraftName] = useState(profile?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");

  // Sincronizamos el draft cuando se abre el modal o cambia el perfil.
  useEffect(() => {
    if (open) {
      setDraftName(profile?.displayName ?? "");
      setNameError("");
    }
  }, [open, profile?.displayName]);

  async function handleSaveName() {
    setNameError("");
    const cleaned = draftName.trim();

    if (cleaned.length < 2 || cleaned.length > 60) {
      setNameError("El nombre debe tener entre 2 y 60 caracteres.");
      return;
    }

    setSavingName(true);
    try {
      const updated = await updateDisplayName(cleaned);
      if (onProfileUpdated && updated) {
        onProfileUpdated(updated);
      }
    } catch (saveError) {
      setNameError(saveError?.message || "No pudimos guardar el nombre.");
    } finally {
      setSavingName(false);
    }
  }

  return (
    <ModalShell
      open={open}
      title="Ajustes"
      subtitle="Cuenta, acceso y controles locales del espacio de trabajo."
      onClose={onClose}
    >
      <div className="space-y-4">
        {/* Nueva ActionCard: Mi perfil. Primera, antes de Cuenta y acceso. */}
        <ActionCard
          title="Mi perfil"
          description="Tu nombre visible aparece en la cabecera y al pie del dashboard. Cambialo cuando quieras."
        >
          <div className="w-full space-y-3">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Nombre para mostrar
              </span>
              <input
                type="text"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                maxLength={60}
                placeholder="Ej. Dra. Giannina"
                className="field-shell"
              />
              {profile?.email ? (
                <p className="mt-2 text-xs text-slate-500">
                  Correo de la cuenta: <span className="font-mono">{profile.email}</span>
                </p>
              ) : null}
            </label>

            {nameError ? (
              <p className="text-sm text-rose">{nameError}</p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveName}
                disabled={savingName || draftName.trim() === (profile?.displayName ?? "")}
                className="button-primary group"
              >
                <Save className="h-4 w-4" />
                {savingName ? "Guardando..." : "Guardar nombre"}
              </button>
            </div>
          </div>
        </ActionCard>

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
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan">
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
          title="Proteccion local"
          description="El PIN sigue funcionando como una barrera local para evitar cambios accidentales en tus plantillas."
        >
          <button
            type="button"
            onClick={onOpenChangePin}
            className="button-secondary"
            disabled={!editUnlocked}
          >
            <ShieldCheck className="h-4 w-4" />
            Cambiar PIN
          </button>

          <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
            Version actual: {appVersion}
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