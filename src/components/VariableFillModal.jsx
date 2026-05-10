import { Copy, MinusCircle, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { extractVariables } from "../lib/variables";
import ModalShell from "./ModalShell";

export default function VariableFillModal({
  open,
  template,
  onClose,
  onConfirm,
  onCopyBlank,
}) {
  const variables = useMemo(
    () => (template ? extractVariables(template.content) : []),
    [template],
  );
  const modalTitle = variables.length === 1 ? "Completar variable" : "Completar variables";
  const modalSubtitle =
    variables.length === 1
      ? "La variable vacía se reemplazará por ___ al copiar."
      : "Las variables vacías se reemplazarán por ___ al copiar.";
  const [values, setValues] = useState({});

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
  }, [open, template, variables]);

  if (!template) {
    return null;
  }

  return (
    <ModalShell
      open={open}
      title={modalTitle}
      subtitle={modalSubtitle}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => onCopyBlank(template)} className="button-secondary">
            <MinusCircle className="h-4 w-4" />
            Copiar sin completar
          </button>
          <button type="button" onClick={() => onConfirm(values, template)} className="button-primary">
            <Copy className="h-4 w-4" />
            Completar y copiar
          </button>
        </div>
      }
    >
      <div className="mb-5 rounded-[24px] border border-rose/20 bg-rose/10 p-4 text-sm text-white">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="h-4 w-4" />
          {template.title}
        </div>
      </div>

      <div className="space-y-4">
        {variables.map((variableName) => (
          <label key={variableName} className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">{variableName}</span>
            <input
              type="text"
              value={values[variableName] || ""}
              onChange={(event) =>
                setValues((current) => ({ ...current, [variableName]: event.target.value }))
              }
              className="field-shell"
              placeholder="Escribe un valor o déjalo vacío para usar ___"
            />
          </label>
        ))}
      </div>
    </ModalShell>
  );
}
