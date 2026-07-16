import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import ModalShell from "./ModalShell";

export default function DeleteTemplateModal({ template, open, onClose, onConfirm }) {
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    if (!open) setConfirmation("");
  }, [open, template?.id]);

  if (!template) return null;
  const normalizedConfirmation = confirmation.trim().toLowerCase();
  const canDelete = normalizedConfirmation === "eliminar";

  return (
    <ModalShell open={open} title="Eliminar plantilla" subtitle="Esta accion no se puede deshacer." onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-rose/25 bg-rose/10 p-4 text-sm leading-6 text-slate-200">
          Vas a eliminar <strong className="text-white">{template.title}</strong> de tu biblioteca personal.
        </div>
        <label className="block text-sm text-slate-300" htmlFor="delete-template-confirmation">
          Escribe <strong className="font-mono text-rose">eliminar</strong> para confirmar.
          <input
            id="delete-template-confirmation"
            autoFocus
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="field-shell mt-2 w-full"
            placeholder="eliminar"
            autoComplete="off"
          />
        </label>
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onClose} className="button-secondary">Cancelar</button>
        <button
          type="button"
          disabled={!canDelete}
          onClick={() => onConfirm(normalizedConfirmation)}
          className="button-danger disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
          Si, eliminar
        </button>
      </div>
    </ModalShell>
  );
}
