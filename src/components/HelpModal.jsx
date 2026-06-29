import { Copy, PencilLine, Plus, Search, Sparkles } from "lucide-react";
import AnimatedLockIcon from "./AnimatedLockIcon";
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
      darkPanel
      title="Skelly te explica la app"
      subtitle="Guia rapida para buscar mejor, editar atajos y usar variables con claridad."
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
                className="button-primary group"
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
                className="button-primary group"
              >
                <AnimatedLockIcon mode="unlock" className="h-4 w-4" />
                Desbloquear edicion
              </button>
            )}

            <button type="button" onClick={onClose} className="button-secondary group">
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
                Busca por fragmentos, ajusta tus atajos y copia rapido.
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-200 sm:text-base">
                No necesitas escribir el termino exacto. Puedes usar partes de una palabra, varias
                palabras cortas o escribir sin acentos. Ademas, los atajos de tus plantillas se pueden
                ajustar desde el detalle de cada plantilla, tambien en las oficiales.
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
            title="Como buscar y ajustar atajos"
            description="El buscador revisa titulo, categoria, atajo y contenido. En tus plantillas puedes agregar, editar y eliminar atajos."
          >
            <Tip>Escribe fragmentos: nor encuentra normal, normales y coincidencias parecidas.</Tip>
            <Tip>Escribe sin acentos si quieres: torax tambien encuentra torax.</Tip>
            <Tip>Combina partes: varic nor prioriza plantillas de varices con contenido normal.</Tip>
            <Tip>Abre la plantilla y usa Editar atajos para agregar, quitar o corregir chips sin entrar al editor completo.</Tip>
            <Tip>El primer atajo es el principal y el chip visible en las tarjetas tiene un maximo de 18 caracteres. Si es mas largo, Skelletary muestra una version corta.</Tip>
            <Tip>Tanto en plantillas oficiales como personales puedes ajustar los atajos sin salir del detalle.</Tip>
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
            icon={PencilLine}
            label="Edicion"
            title="Como editar plantillas oficiales y personales"
            description="Edita titulo, categoria, atajos y contenido desde el mismo lugar. La nube guarda los cambios."
          >
            <Tip>Las plantillas oficiales y personales usan el mismo editor. La diferencia la notas al guardar: la oficial pasa a tu biblioteca personal con tus cambios.</Tip>
            <Tip>El PIN local sigue siendo la barrera para evitar cambios accidentales. Desbloquea para editar.</Tip>
            <Tip>El boton Eliminar solo aparece en plantillas que ya estan en tu biblioteca personal.</Tip>
          </GuideCard>

          <GuideCard
            icon={Sparkles}
            label="Variables"
            title="Como escribir variables dentro del texto"
            description="Skelletary siempre te guiara con al menos un antecedente editable antes de copiar."
          >
            <div className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4 font-mono text-[13px] leading-6 text-cyan/90">
              ANTECEDENTES CLINICOS: {"{{antecedente}}"}
              <br />
              HALLAZGOS: lesion de {"{{tamano}}"} mm en {"{{localizacion}}"}.
            </div>
            <Tip>Si dejas la variable antecedente en blanco, Skelletary la rellenara automaticamente con Sin diagnóstico.</Tip>
            <Tip>Si repites el mismo nombre de variable, la app te lo pedira una sola vez.</Tip>
            <Tip>Las demas variables vacias se reemplazan por ___ al copiar.</Tip>
          </GuideCard>
        </div>
      </div>
    </ModalShell>
  );
}
