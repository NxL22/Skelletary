import { KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";

function emptyState(mode) {
  return mode === "change"
    ? { currentPin: "", nextPin: "", confirmPin: "", pin: "" }
    : { currentPin: "", nextPin: "", confirmPin: "", pin: "" };
}

export default function PinModal({ open, mode, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyState(mode));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(emptyState(mode));
    setError("");
  }, [open, mode]);

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await onSubmit(form, mode);

    if (!result.success) {
      setError(result.message || "No fue posible completar la acción.");
      return;
    }

    onClose();
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const isChangeMode = mode === "change";

  return (
    <ModalShell
      open={open}
      title={isChangeMode ? "Cambiar PIN" : "Desbloquear edición"}
      subtitle={
        isChangeMode
          ? "El PIN es una barrera local para evitar cambios accidentales."
          : "El modo edición se mantendrá activo por 30 minutos."
      }
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="button-secondary">
            Cancelar
          </button>
          <button type="submit" form="pin-form" className="button-primary">
            {isChangeMode ? <ShieldCheck className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
            {isChangeMode ? "Guardar PIN" : "Desbloquear"}
          </button>
        </div>
      }
    >
      <form id="pin-form" onSubmit={handleSubmit} className="space-y-4">
        {isChangeMode ? (
          <>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">PIN actual</span>
              <input
                type="password"
                value={form.currentPin}
                onChange={(event) => updateField("currentPin", event.target.value)}
                className="field-shell"
                inputMode="numeric"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Nuevo PIN</span>
              <input
                type="password"
                value={form.nextPin}
                onChange={(event) => updateField("nextPin", event.target.value)}
                className="field-shell"
                inputMode="numeric"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Confirmar nuevo PIN</span>
              <input
                type="password"
                value={form.confirmPin}
                onChange={(event) => updateField("confirmPin", event.target.value)}
                className="field-shell"
                inputMode="numeric"
              />
            </label>
          </>
        ) : (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">PIN</span>
            <input
              type="password"
              value={form.pin}
              onChange={(event) => updateField("pin", event.target.value)}
              className="field-shell"
              inputMode="numeric"
              autoFocus
            />
          </label>
        )}

        {error ? <p className="text-sm text-rose">{error}</p> : null}
      </form>
    </ModalShell>
  );
}
