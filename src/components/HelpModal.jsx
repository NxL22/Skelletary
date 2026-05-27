import { Copy, FileSpreadsheet, Plus, Search, Sparkles, Unlock } from "lucide-react";
import ModalShell from "./ModalShell";

function GuideCard({ icon: Icon, label, title, description, children }) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan/20 bg-cyan/10 text-cyan shadow-[0_12px_24px_rgba(8,15,35,0.2)]">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm leading-6 text-slate-200">{children}</div>
    </section>
  );
}

function Tip({ children }) {
  return <p className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">{children}</p>;
}

export default function HelpModal({
  createTemplateDisabled,
  editingEnabled,
  open,
  onClose,
  editUnlocked,
  unlockDisabled,
  onUnlockClick,
  onCreateTemplate,
}) {
  return (
    <ModalShell
      open={open}
      wide
      title="Skelly te explica la app"
      subtitle="Guia rapida para buscar mejor, importar plantillas y usar variables sin enredos."
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            La nube guarda tus plantillas cuando tu cuenta ya esta activa.
          </p>

          <div className="flex flex-wrap gap-3">
            {editUnlocked ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCreateTemplate();
                }}
                disabled={createTemplateDisabled}
                title={createTemplateDisabled ? "Necesitas una cuenta activa para crear plantillas" : undefined}
                className="button-primary"
              >
                <Plus className="h-4 w-4" />
                Crear plantilla
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onUnlockClick();
                }}
                disabled={unlockDisabled}
                title={unlockDisabled ? "Necesitas una cuenta activa para editar" : undefined}
                className="button-primary"
              >
                <Unlock className="h-4 w-4" />
                Desbloquear edicion
              </button>
            )}

            <button type="button" onClick={onClose} className="button-secondary">
              Cerrar guia
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[28px] border border-cyan/20 bg-[linear-gradient(135deg,rgba(123,223,246,0.16),rgba(255,255,255,0.04))] p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_30%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan">Skelly onboarding</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
                Busca por fragmentos, copia rapido y deja listas tus variables.
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-200 sm:text-base">
                No necesitas escribir el termino exacto. Puedes usar partes de una palabra, varias
                palabras cortas o escribir sin acentos y Skelly intentara encontrar lo mas relevante.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-100 backdrop-blur">
              Ejemplos: nor, varic nor, torax, eco abd normal
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <GuideCard
            icon={Search}
            label="Busqueda"
            title="Como buscar sin ser exacto"
            description="El buscador revisa titulo, categoria, atajo y contenido de cada plantilla."
          >
            <Tip>Escribe fragmentos: nor encuentra normal, normales y coincidencias parecidas.</Tip>
            <Tip>Escribe sin acentos si quieres: torax tambien encuentra torax.</Tip>
            <Tip>Combina partes: varic nor prioriza plantillas de varices con contenido normal.</Tip>
          </GuideCard>

          <GuideCard
            icon={Copy}
            label="Uso diario"
            title="Como copiar y filtrar rapido"
            description="Puedes buscar, cambiar de categoria, marcar favoritas y volver a las recientes."
          >
            <Tip>Abre una plantilla para verla completa antes de copiar si quieres revisar detalles.</Tip>
            <Tip>Favoritas y Recientes te sirven para tus informes de uso frecuente.</Tip>
            <Tip>Si una plantilla tiene variables, Skelly te pedira completarlas antes de copiar.</Tip>
          </GuideCard>

          <GuideCard
            icon={FileSpreadsheet}
            label="Importacion"
            title="Como traer tus plantillas sin JSON"
            description="Puedes cargar Excel y CSV con una vista previa antes de guardar."
          >
            <Tip>Sube tu archivo y mapea sus columnas a titulo, categoria, shortcut y contenido.</Tip>
            <Tip>Las filas invalidas se marcan antes de importar para evitar errores raros.</Tip>
            <Tip>Lo que importes queda disponible en tu cuenta apenas termine la carga.</Tip>
          </GuideCard>

          <GuideCard
            icon={Sparkles}
            label="Variables"
            title="Como escribir variables dentro del texto"
            description="Cualquier texto entre llaves dobles se convierte en un campo editable al copiar."
          >
            <div className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4 font-mono text-[13px] leading-6 text-cyan/90">
              ANTECEDENTES CLINICOS: {"{{antecedente}}"}
              <br />
              HALLAZGOS: lesion de {"{{tamano}}"} mm en {"{{localizacion}}"}.
            </div>
            <Tip>Si repites el mismo nombre de variable, la app te lo pedira una sola vez.</Tip>
            <Tip>Si dejas una variable vacia, al copiar se reemplaza por ___.</Tip>
          </GuideCard>
        </div>
      </div>
    </ModalShell>
  );
}
