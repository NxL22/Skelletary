import {
  Copy,
  Heart,
  MinusCircle,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  DISPLAY_SHORTCUT_MAX_LENGTH,
  getTemplateShortcutAliases,
} from "../lib/templates";
import { getVoiceUsageHint, mergeVoiceTranscript } from "../lib/voiceInput";
import {
  extractVariables,
  fillVariables,
  getVariableFallbackValue,
  hasVariables,
  isAntecedentVariable,
} from "../lib/variables";
import ModalShell from "./ModalShell";
import TemplateContent from "./TemplateContent";
import VoiceFieldButton from "./VoiceFieldButton";

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <div className="mt-2 text-sm font-medium text-white break-words">{value}</div>
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

function normalizeShortcutKey(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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
  onDelete,
  onUpdateShortcuts,
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
  const hasAntecedentVariable = variables.some((variableName) => isAntecedentVariable(variableName));
  const shortcutAliases = getTemplateShortcutAliases(template);
  const [shortcutDraft, setShortcutDraft] = useState(shortcutAliases);
  const [shortcutInput, setShortcutInput] = useState("");
  const [shortcutError, setShortcutError] = useState("");
  const [isEditingShortcuts, setIsEditingShortcuts] = useState(false);
  const [isSavingShortcuts, setIsSavingShortcuts] = useState(false);

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

  useEffect(() => {
    if (!open) {
      return;
    }

    setShortcutDraft(shortcutAliases);
    setShortcutInput("");
    setShortcutError("");
    setIsEditingShortcuts(false);
    setIsSavingShortcuts(false);
  }, [open, template.id, template.shortcut]);

  const previewText = variableEnabled
    ? fillVariables(template.content, values)
    : template.content;

  function handleStartShortcutEdit() {
    setShortcutDraft(shortcutAliases);
    setShortcutInput("");
    setShortcutError("");
    setIsEditingShortcuts(true);
  }

  function handleCancelShortcutEdit() {
    setShortcutDraft(shortcutAliases);
    setShortcutInput("");
    setShortcutError("");
    setIsEditingShortcuts(false);
  }

  function handleRemoveShortcut(shortcutAlias) {
    setShortcutDraft((current) => current.filter((entry) => entry !== shortcutAlias));
  }

  function handleAddShortcut() {
    const nextShortcut = shortcutInput.trim();

    if (!nextShortcut) {
      setShortcutError("Escribe un atajo antes de agregarlo.");
      return;
    }

    const normalizedNextShortcut = normalizeShortcutKey(nextShortcut);
    const alreadyExists = shortcutDraft.some(
      (shortcutAlias) => normalizeShortcutKey(shortcutAlias) === normalizedNextShortcut,
    );

    if (alreadyExists) {
      setShortcutError("Ese atajo ya esta en la lista.");
      return;
    }

    setShortcutDraft((current) => [...current, nextShortcut]);
    setShortcutInput("");
    setShortcutError("");
  }

  async function handleSaveShortcuts() {
    setIsSavingShortcuts(true);
    setShortcutError("");

    try {
      await onUpdateShortcuts(template, shortcutDraft);
      setIsEditingShortcuts(false);
    } catch {
      setShortcutError("No pudimos guardar los atajos ahora mismo.");
    } finally {
      setIsSavingShortcuts(false);
    }
  }

  function renderShortcutStat() {
    // Tanto las plantillas oficiales como las personales se pueden editar
    // desde el detalle: las oficiales se promueven automaticamente a personales
    // al guardar y conservan el mismo ID para no romper el historial.
    if (!editUnlocked) {
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {shortcutAliases.map((shortcutAlias) => (
              <span key={shortcutAlias} className="badge-soft max-w-full break-all font-mono text-cyan">
                {shortcutAlias}
              </span>
            ))}
          </div>
          <p className="text-xs leading-5 text-slate-400">
            Aqui puedes ajustar los atajos de esta plantilla. Si quieres, agregarlos o eliminarlos.
            Desbloquea la edicion local para empezar.
          </p>
        </div>
      );
    }

    if (!isEditingShortcuts) {
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {shortcutAliases.map((shortcutAlias) => (
              <span key={shortcutAlias} className="badge-soft max-w-full break-all font-mono text-cyan">
                {shortcutAlias}
              </span>
            ))}
          </div>
          <p className="text-xs leading-5 text-slate-400">
            Aqui puedes ajustar los atajos de esta plantilla. Si quieres, agregarlos o eliminarlos.
          </p>
          <p className="text-xs leading-5 text-slate-400">
            Cada atajo se muestra como un tag. El tag principal es el que sale en las tarjetas y tiene un maximo de {DISPLAY_SHORTCUT_MAX_LENGTH} caracteres. Si es mas largo, Skelletary muestra una version corta.
          </p>
          <button type="button" onClick={handleStartShortcutEdit} className="button-secondary button-no-lift">
            <Pencil className="h-4 w-4" />
            Editar atajos
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {shortcutDraft.map((shortcutAlias) => (
            <span
              key={shortcutAlias}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1 text-xs text-cyan"
            >
              <span className="break-all font-mono">{shortcutAlias}</span>
              <button
                type="button"
                onClick={() => handleRemoveShortcut(shortcutAlias)}
                className="rounded-full p-0.5 text-cyan/80 transition hover:bg-white/10 hover:text-white"
                aria-label={`Quitar atajo ${shortcutAlias}`}
                title={`Quitar atajo ${shortcutAlias}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        {!shortcutDraft.length ? (
          <p className="text-xs leading-5 text-slate-400">
            Si guardas sin atajos, Skelletary generara uno automaticamente desde el titulo y la categoria.
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={shortcutInput}
            onChange={(event) => setShortcutInput(event.target.value)}
            className="field-shell min-w-0 flex-1 font-mono"
            placeholder="Ej. ecoabdnormal"
          />
          <button type="button" onClick={handleAddShortcut} className="button-secondary button-no-lift">
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        </div>

        <p className="text-xs leading-5 text-slate-400">
          Aqui puedes ajustar los atajos de esta plantilla. Si quieres, agregarlos o eliminarlos.
        </p>
        <p className="text-xs leading-5 text-slate-400">
          El primer atajo queda como principal y se muestra como tag. Puedes quitar los tags que no quieras y dejar solo los que realmente usas.
        </p>
        <p className="text-xs leading-5 text-slate-400">
          El tag principal tiene un maximo de {DISPLAY_SHORTCUT_MAX_LENGTH} caracteres. Si es mas largo, Skelletary muestra una version corta.
        </p>

        {shortcutError ? <p className="text-xs leading-5 text-rose">{shortcutError}</p> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveShortcuts}
            disabled={isSavingShortcuts}
            className="button-primary button-no-lift"
          >
            <Save className="h-4 w-4" />
            {isSavingShortcuts ? "Guardando..." : "Guardar atajos"}
          </button>
          <button type="button" onClick={handleCancelShortcutEdit} className="button-secondary button-no-lift">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

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
                <button type="button" onClick={() => onEdit(template)} className="button-secondary">
                  <Pencil className="h-4 w-4" />
                  Editar plantilla
                </button>
                {template.isUserOwned ? (
                  <button type="button" onClick={() => onDelete(template)} className="button-danger">
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
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
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="rounded-[26px] border border-white/10 bg-slate-950/50 p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              {shortcutAliases.map((shortcutAlias) => (
                <span
                  key={shortcutAlias}
                  title={shortcutAlias}
                  className="badge-soft max-w-full break-all font-mono text-cyan"
                >
                  {shortcutAlias}
                </span>
              ))}
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
                {hasAntecedentVariable
                  ? 'Si dejas la variable "antecedente" en blanco, Skelletary la rellenara automaticamente con Sin diagnóstico. Las demas variables vacias se copiaran como ___.'
                  : "Rellena solo lo necesario. Si dejas algo vacio, se copiara como ___."}
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
                      placeholder={`Escribe un valor o deja vacio para usar ${getVariableFallbackValue(variableName)}`}
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
            label={shortcutAliases.length > 1 ? "Atajos" : "Atajo"}
            value={renderShortcutStat()}
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
