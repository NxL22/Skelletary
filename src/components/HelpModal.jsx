import { Copy, Plus, Search, Sparkles, Unlock } from "lucide-react";
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
      subtitle="Guía rápida para buscar mejor, crear plantillas y usar variables sin enredos."
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            Todo se guarda localmente en este navegador, incluyendo tus plantillas y tu PIN.
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
                title={createTemplateDisabled ? "Disponible cuando el proyecto tenga backend" : undefined}
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
                title={unlockDisabled ? "Disponible cuando el proyecto tenga backend" : undefined}
                className="button-primary"
              >
                <Unlock className="h-4 w-4" />
                Desbloquear edición
              </button>
            )}

            <button type="button" onClick={onClose} className="button-secondary">
              Cerrar guía
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
                Busca por fragmentos, copia rápido y deja listas tus variables.
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-200 sm:text-base">
                No necesitas escribir el término exacto. Puedes usar partes de una palabra,
                varias palabras cortas o escribir sin acentos y Skelly intentará encontrar lo
                más relevante.
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
            label="Búsqueda"
            title="Cómo buscar sin ser exacto"
            description="El buscador revisa título, categoría, shortcut y contenido de cada plantilla."
          >
            <Tip>Escribe fragmentos: nor encuentra normal, normales y coincidencias parecidas.</Tip>
            <Tip>Escribe sin acentos si quieres: torax también encuentra tórax.</Tip>
            <Tip>Combina partes: varic nor prioriza plantillas de várices con contenido normal.</Tip>
          </GuideCard>

          <GuideCard
            icon={Copy}
            label="Uso diario"
            title="Cómo copiar y filtrar rápido"
            description="Puedes buscar, cambiar de categoría, marcar favoritas y volver a las recientes."
          >
            <Tip>Abre una plantilla para verla completa antes de copiar si quieres revisar detalles.</Tip>
            <Tip>Favoritas y Recientes te sirven para tus informes de uso frecuente.</Tip>
            <Tip>Si una plantilla tiene variables, Skelly te pedirá completarlas antes de copiar.</Tip>
          </GuideCard>

          <GuideCard
            icon={Plus}
            label="Creación"
            title="Cómo crear una plantilla nueva"
            description={
              editingEnabled
                ? "Para crear o editar necesitas desbloquear el modo edición con tu PIN local."
                : "La creación propia está en pausa hasta conectar backend, cuentas y la biblioteca personal del usuario."
            }
          >
            {editingEnabled ? (
              <>
                <Tip>Luego pulsa Nueva plantilla y completa título, categoría, shortcut y contenido.</Tip>
                <Tip>El shortcut es opcional, pero ayuda mucho para encontrar plantillas muy rápido.</Tip>
                <Tip>Todo lo que guardes queda almacenado en este navegador hasta que importes o restaures un backup.</Tip>
              </>
            ) : (
              <>
                <Tip>Por ahora Skelletary funciona como una biblioteca curada, rápida y confiable para consultar y copiar.</Tip>
                <Tip>Cuando llegue el backend, cada médico podrá tener sus propias plantillas aparte de la biblioteca base incluida en la app.</Tip>
                <Tip>La idea es mantener la experiencia simple, profesional y lista para uso diario clínico.</Tip>
              </>
            )}
          </GuideCard>

          <GuideCard
            icon={Sparkles}
            label="Variables"
            title="Cómo escribir variables dentro del texto"
            description="Cualquier texto entre llaves dobles se convierte en un campo editable al copiar."
          >
            <div className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4 font-mono text-[13px] leading-6 text-cyan/90">
              ANTECEDENTES CLÍNICOS: {"{{antecedente}}"}
              <br />
              HALLAZGOS: lesión de {"{{tamaño}}"} mm en {"{{localizacion}}"}.
            </div>
            <Tip>Si repites el mismo nombre de variable, la app te lo pedirá una sola vez.</Tip>
            <Tip>Si dejas una variable vacía, al copiar se reemplaza por ___.</Tip>
          </GuideCard>
        </div>
      </div>
    </ModalShell>
  );
}