import { KeyRound, Save } from "lucide-react";
import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import PasswordField from "./PasswordField";

export default function PasswordChangeModal({ open, onClose, onSubmit }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setError("");
    setSaving(false);
  }, [open]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (password.trim().length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("La confirmacion no coincide.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSubmit(password.trim());
    } catch (submitError) {
      setError(submitError.message || "No pudimos actualizar la contraseña.");
      setSaving(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Cambiar contraseña de acceso"
      subtitle="Este cambio afecta el inicio de sesion de tu cuenta. El PIN local sigue siendo un control separado para editar."
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="button-secondary">
            Cerrar
          </button>
          <button type="submit" form="password-change-form" className="button-primary" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar contraseña"}
          </button>
        </div>
      }
    >
      <form id="password-change-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-[24px] border border-cyan/20 bg-cyan/10 p-4 text-sm leading-6 text-slate-200">
          <div className="flex items-center gap-2 font-medium text-white">
            <KeyRound className="h-4 w-4 text-cyan" />
            Acceso clasico con contraseña
          </div>
          <p className="mt-2">
            Skelletary ya no ofrece registro libre desde la web. Solo puedes iniciar sesion,
            recuperar o cambiar tu contraseña.
          </p>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Nueva contraseña</span>
          <PasswordField
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            inputClassName="field-shell"
            autoComplete="new-password"
            placeholder="Al menos 8 caracteres"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Confirmar contraseña</span>
          <PasswordField
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            inputClassName="field-shell"
            autoComplete="new-password"
            placeholder="Repite la nueva contraseña"
          />
        </label>

        {error ? <p className="text-sm text-rose">{error}</p> : null}
      </form>
    </ModalShell>
  );
}
