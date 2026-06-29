import { Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getVoiceUsageHint, mergeVoiceTranscript } from "../lib/voiceInput";
import ModalShell from "./ModalShell";
import VoiceFieldButton from "./VoiceFieldButton";

function emptyForm() {
  return {
    title: "",
    category: "",
    shortcut: "",
    content: "",
  };
}

export default function TemplateEditorModal({
  open,
  template,
  categories,
  onClose,
  onSave,
  onDelete,
}) {
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      template
        ? {
            title: template.title,
            category: template.category,
            shortcut: template.shortcut || "",
            content: template.content,
          }
        : emptyForm(),
    );
    setError("");
  }, [open, template]);

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.category.trim() || !form.content.trim()) {
      setError("Titulo, categoria y contenido son obligatorios.");
      return;
    }

    onSave(form, template);
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <ModalShell
      open={open}
      wide
      title={template ? "Editar plantilla" : "Nueva plantilla"}
      subtitle="Crea, ajusta o refina el informe antes de guardarlo en tu cuenta."
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            {template ? (
              <button type="button" onClick={() => onDelete(template)} className="button-danger">
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onClose} className="button-secondary">
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button type="submit" form="template-editor-form" className="button-primary">
              <Save className="h-4 w-4" />
              Guardar
            </button>
          </div>
        </div>
      }
    >
      <form id="template-editor-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-200">
              <span>Titulo</span>
              <VoiceFieldButton
                onTranscript={(transcript) => updateField("title", mergeVoiceTranscript(form.title, transcript))}
                title="Dictar titulo"
                idleLabel="Dictar titulo"
                listeningLabel="Detener dictado de titulo"
              />
            </span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="field-shell"
              placeholder="Ej. Ecografia abdominal normal"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-200">
              <span>Categoria</span>
              <VoiceFieldButton
                onTranscript={(transcript) => updateField("category", mergeVoiceTranscript(form.category, transcript))}
                title="Dictar categoria"
                idleLabel="Dictar categoria"
                listeningLabel="Detener dictado de categoria"
              />
            </span>
            <input
              list="template-categories"
              type="text"
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
              className="field-shell"
              placeholder="Ej. Ecografia abdominal"
            />
            <datalist id="template-categories">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Atajos editables</span>
          <input
            type="text"
            value={form.shortcut}
            onChange={(event) => updateField("shortcut", event.target.value)}
            className="field-shell font-mono"
            placeholder="Ej. ecoabdnormal, abdomen normal"
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Puedes cambiar estos atajos cuando quieras. Escribe varios separados por coma y el primero se usa como atajo principal.
          </p>
        </label>

        <label className="block">
          <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-200">
            <span>Contenido</span>
            <VoiceFieldButton
              onTranscript={(transcript) =>
                updateField(
                  "content",
                  mergeVoiceTranscript(form.content, transcript, { format: "medical-content" }),
                )
              }
              title="Dictar contenido"
              idleLabel="Dictar contenido"
              listeningLabel="Detener dictado clinico"
            />
          </span>
          <textarea
            value={form.content}
            onChange={(event) => updateField("content", event.target.value)}
            className="field-shell min-h-[360px] resize-y font-mono text-[13px] leading-6"
            placeholder={"ANTECEDENTES CLINICOS:\n\nHALLAZGOS:\n...\n\nIMPRESION:\n..."}
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {getVoiceUsageHint("medical-content")}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Si no escribes <span className="font-mono">{"{{antecedente}}"}</span>, Skelletary lo agregara al usar la plantilla y, si queda en blanco, copiara <span className="font-medium text-slate-300">Sin diagnóstico</span>.
          </p>
        </label>

        {error ? <p className="text-sm text-rose">{error}</p> : null}
      </form>
    </ModalShell>
  );
}
