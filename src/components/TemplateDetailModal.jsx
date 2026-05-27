import { Copy, Files, Heart, MinusCircle, Pencil, Sparkles, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  DISPLAY_SHORTCUT_MAX_LENGTH,
  getTemplateDisplayShortcut,
} from "../lib/templates";
import { getVoiceUsageHint, mergeVoiceTranscript } from "../lib/voiceInput";
import { extractVariables, fillVariables, hasVariables } from "../lib/variables";
import ModalShell from "./ModalShell";
import TemplateContent from "./TemplateContent";
import VoiceFieldButton from "./VoiceFieldButton";

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "Nunca";
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function TemplateDetailModal({
  template,
  open,
  editUnlocked,
  onClose,
  onCopy,
  onCopyBlank,
  onCopyFilled,
  onToggleFavorite,
  onEdit,
  onDuplicate,
  onDelete,
}) {
  if (!template) {
    return null;
  }

  const variableEnabled = hasVariables(template.content);
  const variables = useMemo(
    () => extractVariables(template.content),
    [template.content],
  );
  const variableDetectedLabel =
    variables.length === 1 ? "Variable detectada" : "Variables detectadas";
  const inlineFillLabel =
    variables.length === 1 ? "Completar variable aqui mismo" : "Completar variables aqui mismo";
  const [values, setValues] = useState({});
  const shortcut = getTemplateDisplayShortcut(template);
  const shouldShowShortcut = Boolean(shortcut) && shortcut.length <= DISPLAY_SHORTCUT_MAX_LENGTH;

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(
      variables.reduce((accumulator, variableName) => {
        accumulator[variableName] = "";
        return accumulator;
      }, {}),
    );
  }, [open, template.id, variables]);

  const previewText = variableEnabled
    ? fillVariables(template.content, values)
    : template.content;

  return (
    <ModalShell
      open={open}
      wide
      title={template.title}
      subtitle={template.category}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onToggleFavorite(template)}
              className="button-secondary"
            >
              {template.favorite ? (
                <Heart className="h-4 w-4 fill-current text-rose" />
              ) : (
                <Star className="h-4 w-4" />
              )}
              {template.favorite ? "Favorita" : "Agregar a favoritas"}
            </button>

            {editUnlocked ? (
              <>
                <button type="button" onClick={() => onDuplicate(template)} className="button-secondary">
                  <Files className="h-4 w-4" />
                  Duplicar
                </button>
                {template.isUserOwned ? (
                  <>
                    <button type="button" onClick={() => onEdit(template)} className="button-secondary">
                      <Pencil className="h-4 w-4" />
                      Editar
                    </button>
                    <button type="button" onClick={() => onDelete(template)} className="button-danger">
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  </>
                ) : null}
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            {variableEnabled ? (
              <button type="button" onClick={() => onCopyBlank(template)} className="button-secondary">
                <MinusCircle className="h-4 w-4" />
                Copiar sin completar
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => (variableEnabled ? onCopyFilled(values, template) : onCopy(template))}
              className="button-primary"
            >
              <Copy className="h-4 w-4" />
              {variableEnabled ? "Completar y copiar" : "Copiar"}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="rounded-[26px] border border-white/10 bg-slate-950/50 p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              {shouldShowShortcut ? (
                <span
                  title={shortcut}
                  className="badge-soft max-w-full break-all font-mono text-cyan"
                >
                  {shortcut}
                </span>
              ) : null}
              {variableEnabled ? <span className="badge-soft text-rose">{variableDetectedLabel}</span> : null}
            </div>
            <TemplateContent text={template.content} />
          </div>

          {variableEnabled ? (
            <div className="rounded-[26px] border border-rose/20 bg-rose/10 p-5">
              <div className="flex items-center gap-2 text-base font-semibold text-white">
                <Sparkles className="h-4 w-4 text-rose" />
                {inlineFillLabel}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Rellena solo lo necesario. Si dejas algo vacio, se copiara como <span className="font-mono">___</span>.
              </p>
              <p className="mt-3 text-xs leading-5 text-slate-400">
                {getVoiceUsageHint("medical-content")}
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {variables.map((variableName) => (
                  <label key={variableName} className="block">
                    <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-100">
                      <span>{variableName}</span>
                      <VoiceFieldButton
                        onTranscript={(transcript) =>
                          setValues((current) => ({
                            ...current,
                            [variableName]: mergeVoiceTranscript(current[variableName], transcript, {
                              format: "medical-content",
                            }),
                          }))
                        }
                        title={`Dictar variable ${variableName}`}
                        idleLabel={`Dictar variable ${variableName}`}
                        listeningLabel="Detener dictado"
                      />
                    </span>
                    <input
                      type="text"
                      value={values[variableName] || ""}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [variableName]: event.target.value,
                        }))
                      }
                      className="field-shell"
                      placeholder="Escribe un valor..."
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {variableEnabled ? (
            <div className="rounded-[26px] border border-cyan/20 bg-cyan/10 p-5">
              <div className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
                <Copy className="h-4 w-4 text-cyan" />
                Vista previa del texto final
              </div>
              <TemplateContent text={previewText} />
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <Stat
            label="Atajo"
            value={shortcut || "Sin atajo"}
          />
          <Stat label="Copias" value={template.copyCount} />
          <Stat label="Ultima copia" value={formatDate(template.lastCopiedAt)} />
          <Stat label="Creada" value={formatDate(template.createdAt)} />
          <Stat label="Actualizada" value={formatDate(template.updatedAt)} />
        </div>
      </div>
    </ModalShell>
  );
}
