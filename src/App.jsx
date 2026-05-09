import { useDeferredValue, useEffect, useState } from "react";
import { Heart, Layers3, ShieldAlert } from "lucide-react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import CategorySidebar from "./components/CategorySidebar";
import TemplateCard from "./components/TemplateCard";
import TemplateDetailModal from "./components/TemplateDetailModal";
import TemplateEditorModal from "./components/TemplateEditorModal";
import VariableFillModal from "./components/VariableFillModal";
import PinModal from "./components/PinModal";
import SettingsModal from "./components/SettingsModal";
import EmptyState from "./components/EmptyState";
import ToastStack from "./components/ToastStack";
import ScrollToTopButton from "./components/ScrollToTopButton";
import defaultTemplates from "./data/defaultTemplates.json";
import { copyText } from "./lib/clipboard";
import { exportTemplatesToMarkdown } from "./lib/exportMarkdown";
import {
  DEFAULT_PIN,
  getEditUnlockExpiresAt,
  isEditUnlocked,
  loadPin,
  loadTemplates,
  lockEdit,
  resetTemplates,
  savePin,
  saveTemplates,
  unlockEdit,
} from "./lib/storage";
import {
  SPECIAL_VIEWS,
  createTemplate,
  duplicateTemplateRecord,
  filterAndSortTemplates,
  getCategoryCounts,
  getTemplateCategories,
  markTemplateCopied,
  normalizeTemplates,
  updateTemplateRecord,
} from "./lib/templates";
import { blankVariables, fillVariables, hasVariables } from "./lib/variables";

const APP_VERSION = "1.0.0";

function getInitialTemplates() {
  const storedTemplates = loadTemplates();

  if (storedTemplates?.length) {
    return normalizeTemplates(storedTemplates);
  }

  const seededTemplates = normalizeTemplates(defaultTemplates);
  resetTemplates(seededTemplates);
  return seededTemplates;
}

function buildFileDateStamp() {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getViewHeading(activeView) {
  if (activeView === SPECIAL_VIEWS.all) {
    return "Todas las plantillas";
  }

  if (activeView === SPECIAL_VIEWS.favorites) {
    return "Favoritas";
  }

  if (activeView === SPECIAL_VIEWS.recent) {
    return "Recientes";
  }

  return activeView;
}

export default function App() {
  const [templates, setTemplates] = useState(getInitialTemplates);
  const [searchValue, setSearchValue] = useState("");
  const deferredQuery = useDeferredValue(searchValue);
  const [activeView, setActiveView] = useState(SPECIAL_VIEWS.all);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [editorState, setEditorState] = useState({ open: false, template: null });
  const [variableState, setVariableState] = useState({ open: false, template: null });
  const [pinMode, setPinMode] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editUnlocked, setEditUnlocked] = useState(isEditUnlocked());
  const [unlockExpiresAt, setUnlockExpiresAt] = useState(getEditUnlockExpiresAt());
  const [toasts, setToasts] = useState([]);

  const filteredTemplates = filterAndSortTemplates(templates, {
    query: deferredQuery,
    activeView,
  });
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) || null;
  const categories = getTemplateCategories(templates);
  const categoryCounts = getCategoryCounts(templates);
  const favoriteCount = templates.filter((template) => template.favorite).length;
  const recentCount = templates.filter((template) => template.lastCopiedAt).length;
  const viewHeading = getViewHeading(activeView);

  useEffect(() => {
    saveTemplates(templates);
  }, [templates]);

  useEffect(() => {
    function syncEditState() {
      setEditUnlocked(isEditUnlocked());
      setUnlockExpiresAt(getEditUnlockExpiresAt());
    }

    syncEditState();
    const intervalId = window.setInterval(syncEditState, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (selectedTemplateId && !templates.some((template) => template.id === selectedTemplateId)) {
      setSelectedTemplateId(null);
    }
  }, [selectedTemplateId, templates]);

  function pushToast(message, tone = "info") {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }

  function closeEditor() {
    setEditorState({ open: false, template: null });
  }

  function closeVariableModal() {
    setVariableState({ open: false, template: null });
  }

  function syncUnlockState() {
    setEditUnlocked(isEditUnlocked());
    setUnlockExpiresAt(getEditUnlockExpiresAt());
  }

  function handleToggleFavorite(template) {
    setTemplates((current) =>
      current.map((entry) =>
        entry.id === template.id ? { ...entry, favorite: !entry.favorite } : entry,
      ),
    );

    pushToast(
      template.favorite ? "Plantilla quitada de favoritas" : "Plantilla agregada a favoritas",
      "success",
    );
  }

  async function handleCopyResult(template, finalText, successMessage) {
    try {
      await copyText(finalText);
      setTemplates((current) =>
        current.map((entry) =>
          entry.id === template.id ? markTemplateCopied(entry) : entry,
        ),
      );
      pushToast(successMessage, "success");
    } catch {
      pushToast("No fue posible copiar la plantilla al portapapeles.", "error");
    }
  }

  function handleCopy(template) {
    if (hasVariables(template.content)) {
      setVariableState({ open: true, template });
      return;
    }

    handleCopyResult(template, template.content, "Plantilla copiada");
  }

  function handleCopyBlank(template) {
    closeVariableModal();
    handleCopyResult(template, blankVariables(template.content), "Plantilla copiada sin completar");
  }

  function handleConfirmVariables(values, template) {
    closeVariableModal();
    handleCopyResult(
      template,
      fillVariables(template.content, values),
      "Plantilla completada y copiada",
    );
  }

  function handleCopyFilledFromDetail(values, template) {
    handleCopyResult(
      template,
      fillVariables(template.content, values),
      "Plantilla completada y copiada",
    );
  }

  function openTemplate(template) {
    setSelectedTemplateId(template.id);
  }

  function openEditor(template = null) {
    if (!editUnlocked) {
      return;
    }

    setSelectedTemplateId(null);
    setEditorState({ open: true, template });
  }

  function handleSaveTemplate(form, originalTemplate) {
    if (originalTemplate) {
      setTemplates((current) =>
        current.map((entry) =>
          entry.id === originalTemplate.id
            ? updateTemplateRecord(entry, form)
            : entry,
        ),
      );
      pushToast("Plantilla actualizada", "success");
    } else {
      const template = createTemplate(form);
      setTemplates((current) => [template, ...current]);
      pushToast("Plantilla creada", "success");
    }

    closeEditor();
  }

  function handleDuplicate(template) {
    if (!editUnlocked) {
      return;
    }

    const duplicate = duplicateTemplateRecord(template);
    setTemplates((current) => [duplicate, ...current]);
    closeEditor();
    setSelectedTemplateId(duplicate.id);
    pushToast("Plantilla duplicada", "success");
  }

  function handleDelete(template) {
    if (!editUnlocked) {
      return;
    }

    if (!window.confirm(`Eliminar la plantilla "${template.title}"?`)) {
      return;
    }

    setTemplates((current) => current.filter((entry) => entry.id !== template.id));
    closeEditor();
    setSelectedTemplateId(null);
    pushToast("Plantilla eliminada", "success");
  }

  function handleExportJson() {
    const payload = {
      templates,
      exportedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
    };

    downloadFile(
      `skelletary-backup-${buildFileDateStamp()}.json`,
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8",
    );
    pushToast("Backup exportado", "success");
  }

  async function handleImportFile(file) {
    if (!editUnlocked) {
      pushToast("Desbloquea edicion para importar un backup.", "error");
      return;
    }

    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      if (!Array.isArray(payload.templates)) {
        throw new Error("Formato invalido");
      }

      if (!window.confirm("Reemplazar las plantillas actuales por las del backup?")) {
        return;
      }

      const importedTemplates = normalizeTemplates(payload.templates);
      setTemplates(importedTemplates);
      setActiveView(SPECIAL_VIEWS.all);
      setSearchValue("");
      setSelectedTemplateId(null);
      pushToast("Backup importado correctamente", "success");
    } catch {
      pushToast("El archivo no contiene un backup valido.", "error");
    }
  }

  function handleExportMarkdown() {
    downloadFile(
      "Plantillas_Radiologia_Skelletary.md",
      exportTemplatesToMarkdown(templates),
      "text/markdown;charset=utf-8",
    );
    pushToast("Markdown exportado", "success");
  }

  function handleRestoreDefaults() {
    if (!editUnlocked) {
      pushToast("Desbloquea edicion para restaurar las plantillas base.", "error");
      return;
    }

    if (!window.confirm("Restaurar las plantillas base y reemplazar los cambios locales?")) {
      return;
    }

    const seededTemplates = normalizeTemplates(defaultTemplates);
    resetTemplates(seededTemplates);
    setTemplates(seededTemplates);
    setActiveView(SPECIAL_VIEWS.all);
    setSearchValue("");
    setSelectedTemplateId(null);
    pushToast("Plantillas base restauradas", "success");
  }

  async function handlePinSubmit(form, mode) {
    if (mode === "change") {
      if (form.currentPin !== loadPin()) {
        return { success: false, message: "El PIN actual no coincide." };
      }

      if (!form.nextPin.trim()) {
        return { success: false, message: "Escribe un nuevo PIN." };
      }

      if (form.nextPin !== form.confirmPin) {
        return { success: false, message: "La confirmacion del PIN no coincide." };
      }

      savePin(form.nextPin);
      pushToast("PIN actualizado", "success");
      return { success: true };
    }

    if (form.pin !== (loadPin() || DEFAULT_PIN)) {
      return { success: false, message: "PIN incorrecto." };
    }

    const expiresAt = unlockEdit();
    setUnlockExpiresAt(expiresAt);
    setEditUnlocked(true);
    pushToast("Edicion desbloqueada", "success");
    return { success: true };
  }

  function handleLockEdit() {
    lockEdit();
    syncUnlockState();
    closeEditor();
    pushToast("Edicion bloqueada", "info");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(123,223,246,0.08),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(184,181,255,0.08),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(246,171,200,0.08),transparent_24%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <Header
          editUnlocked={editUnlocked}
          unlockExpiresAt={unlockExpiresAt}
          onUnlockClick={() => setPinMode("unlock")}
          onLockClick={handleLockEdit}
          onNewTemplate={() => openEditor(null)}
          onSettingsClick={() => setSettingsOpen(true)}
        />

        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          resultCount={filteredTemplates.length}
          templateCount={templates.length}
        />

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <CategorySidebar
            categories={categories}
            activeView={activeView}
            onChange={setActiveView}
            counts={categoryCounts}
            favoriteCount={favoriteCount}
            recentCount={recentCount}
          />

          <main className="space-y-4">
            <div className="glass-panel rounded-[28px] p-4 shadow-card">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                    <Layers3 className="h-3.5 w-3.5 text-cyan" />
                    Vista activa
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-white">{viewHeading}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {deferredQuery
                      ? "Busqueda en tiempo real por titulo, categoria, shortcut y contenido."
                      : "Orden automatico: favoritas, mas usadas, mas recientes y alfabetico."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="badge-soft">{favoriteCount} favoritas</span>
                  <span className="badge-soft">{recentCount} recientes</span>
                  <span className="badge-soft">
                    {editUnlocked ? "Edicion desbloqueada" : "Modo lectura"}
                  </span>
                </div>
              </div>
            </div>

            {filteredTemplates.length ? (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onOpen={openTemplate}
                    onCopy={handleCopy}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                query={deferredQuery}
                title={deferredQuery ? "No encontramos plantillas" : "Biblioteca vacia"}
                description={
                  deferredQuery
                    ? "Prueba con otro termino o cambia la categoria seleccionada. Skelly seguira buscando contigo."
                    : editUnlocked
                      ? "Aun no hay plantillas en esta vista. Puedes crear una nueva o restaurar las plantillas base desde Ajustes."
                      : "No hay plantillas visibles en este filtro. Cambia de categoria o revisa si hay backups importados."
                }
              />
            )}
          </main>
        </div>

        {!editUnlocked && (
          <div className="glass-panel rounded-[24px] border border-rose/20 bg-rose/10 p-4 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 text-rose" />
                <div>
                  <p className="font-medium text-white">Modo lectura activo</p>
                  <p className="mt-1 text-sm leading-6 text-slate-200">
                    Puedes buscar, filtrar, copiar y marcar favoritas. Para crear o editar
                    plantillas, desbloquea el modo edicion con tu PIN local.
                  </p>
                </div>
              </div>

              <button type="button" onClick={() => setPinMode("unlock")} className="button-primary">
                Desbloquear
              </button>
            </div>
          </div>
        )}

        <div className="pb-1 text-center text-xs uppercase tracking-[0.18em] text-slate-500">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-slate-400">
            <Heart className="h-3.5 w-3.5 fill-rose text-rose drop-shadow-[0_0_10px_rgba(246,171,200,0.45)]" />
            Hecho con cariño para mi esposa
          </div>
        </div>
      </div>

      <TemplateDetailModal
        template={selectedTemplate}
        open={Boolean(selectedTemplate)}
        editUnlocked={editUnlocked}
        onClose={() => setSelectedTemplateId(null)}
        onCopy={handleCopy}
        onCopyBlank={handleCopyBlank}
        onCopyFilled={handleCopyFilledFromDetail}
        onToggleFavorite={handleToggleFavorite}
        onEdit={openEditor}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />

      <TemplateEditorModal
        open={editorState.open}
        template={editorState.template}
        categories={categories}
        onClose={closeEditor}
        onSave={handleSaveTemplate}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />

      <VariableFillModal
        open={variableState.open}
        template={variableState.template}
        onClose={closeVariableModal}
        onConfirm={handleConfirmVariables}
        onCopyBlank={handleCopyBlank}
      />

      <PinModal
        open={Boolean(pinMode)}
        mode={pinMode}
        onClose={() => setPinMode(null)}
        onSubmit={handlePinSubmit}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        editUnlocked={editUnlocked}
        onExportJson={handleExportJson}
        onImportFile={handleImportFile}
        onExportMarkdown={handleExportMarkdown}
        onRestoreDefaults={handleRestoreDefaults}
        onOpenChangePin={() => {
          setSettingsOpen(false);
          setPinMode("change");
        }}
      />

      <ToastStack toasts={toasts} />
      <ScrollToTopButton />
    </div>
  );
}
