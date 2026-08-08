import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import { ECO_GROUPS, ECO_VISUAL_OPTIONS, inferEcoVisualKey } from "../lib/botonesEco";

function getInitialForm(card) {
  return {
    name: card?.name || "",
    groupId: card?.groupId || "mis-tarjetas",
    copyText: card?.copyText || "",
    visualKey: card?.visualKey || inferEcoVisualKey(card?.name || "", card?.groupId || "mis-tarjetas"),
  };
}

export default function BotonesEcoEditorModal({ open, card, onClose, onSave }) {
  const [form, setForm] = useState(() => getInitialForm(card));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(getInitialForm(card));
    setError("");
    setSaving(false);
  }, [card, open]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const normalizedForm = {
      ...form,
      name: form.name.trim(),
      copyText: form.copyText.trim(),
    };

    if (!normalizedForm.name || !normalizedForm.copyText) {
      setError("Completa el nombre y el texto que se copiara.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave(normalizedForm);
    } catch (saveError) {
      setError(saveError.message || "No pudimos guardar la tarjeta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      open={open}
      title={card ? "Editar tarjeta" : "Agregar tarjeta"}
      subtitle={card ? "La copia sigue siendo inmediata; aqui solo ajustas su identidad." : "Crea un acceso rapido para tu flujo de trabajo."}
      onClose={onClose}
      darkPanel
      wide
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="button-secondary" disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="botones-eco-editor" className="button-primary" disabled={saving}>
            {saving ? "Guardando..." : card ? "Guardar cambios" : "Agregar tarjeta"}
          </button>
        </div>
      }
    >
      <form id="botones-eco-editor" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="font-medium text-white">Nombre visible</span>
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="field-shell"
              placeholder="Ejemplo: Eco abdomen control"
              autoFocus
              maxLength={120}
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="font-medium text-white">Grupo</span>
            <select
              value={form.groupId}
              onChange={(event) => updateField("groupId", event.target.value)}
              className="field-shell"
            >
              {ECO_GROUPS.map((group) => (
                <option key={group.id} value={group.id} className="bg-slate-950">
                  {group.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-2 text-sm text-slate-300">
          <span className="font-medium text-white">Texto que se copiara</span>
          <textarea
            value={form.copyText}
            onChange={(event) => updateField("copyText", event.target.value)}
            className="field-shell min-h-32 resize-y leading-6"
            placeholder="Escribe exactamente la instruccion que quieres llevar al portapapeles."
            maxLength={2000}
          />
        </label>

        <label className="block space-y-2 text-sm text-slate-300">
          <span className="font-medium text-white">Identidad visual</span>
          <select
            value={form.visualKey}
            onChange={(event) => updateField("visualKey", event.target.value)}
            className="field-shell"
          >
            {ECO_VISUAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-950">
                {option.label}
              </option>
            ))}
          </select>
          <span className="block text-xs leading-5 text-slate-500">
            Esta referencia ayuda a distinguir rapidamente tus tarjetas nuevas. Las tarjetas oficiales conservan su imagen original.
          </span>
        </label>

        {error ? (
          <p role="alert" className="rounded-2xl border border-rose/25 bg-rose/10 px-4 py-3 text-sm leading-6 text-rose-100">
            {error}
          </p>
        ) : null}
      </form>
    </ModalShell>
  );
}
