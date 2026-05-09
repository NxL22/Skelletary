import { FileJson, FileText, RotateCcw, ShieldCheck, Upload, X } from "lucide-react";
import { useRef } from "react";
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
  editUnlocked,
  onExportJson,
  onImportFile,
  onExportMarkdown,
  onRestoreDefaults,
  onOpenChangePin,
}) {
  const inputRef = useRef(null);

  return (
    <ModalShell
      open={open}
      title="Ajustes"
      subtitle="Todo se guarda localmente en este navegador."
      onClose={onClose}
    >
      <div className="space-y-4">
        <ActionCard
          title="Backups"
          description="Exporta un respaldo JSON completo o importa uno existente para restaurar la biblioteca."
        >
          <button type="button" onClick={onExportJson} className="button-secondary">
            <FileJson className="h-4 w-4" />
            Exportar JSON
          </button>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="button-secondary"
            disabled={!editUnlocked}
          >
            <Upload className="h-4 w-4" />
            Importar backup
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onImportFile(file);
              }
              event.target.value = "";
            }}
          />
        </ActionCard>

        <ActionCard
          title="Exportación para GPT"
          description="Descarga todas las plantillas agrupadas por categoría en Markdown."
        >
          <button type="button" onClick={onExportMarkdown} className="button-secondary">
            <FileText className="h-4 w-4" />
            Exportar Markdown
          </button>
        </ActionCard>

        <ActionCard
          title="Mantenimiento"
          description="Restaura la base original y administra el PIN local del modo edición."
        >
          <button
            type="button"
            onClick={onRestoreDefaults}
            className="button-secondary"
            disabled={!editUnlocked}
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar plantillas base
          </button>

          <button
            type="button"
            onClick={onOpenChangePin}
            className="button-secondary"
            disabled={!editUnlocked}
          >
            <ShieldCheck className="h-4 w-4" />
            Cambiar PIN
          </button>

          <button type="button" onClick={onClose} className="button-primary">
            <X className="h-4 w-4" />
            Cerrar ajustes
          </button>
        </ActionCard>

        {!editUnlocked ? (
          <p className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-400">
            Importar backup, restaurar plantillas base y cambiar PIN requieren edición desbloqueada.
          </p>
        ) : null}
      </div>
    </ModalShell>
  );
}
