import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Heart, Layers3, ShieldAlert } from "lucide-react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import CategorySidebar from "./components/CategorySidebar";
import PaginationControls from "./components/PaginationControls";
import TemplateCard from "./components/TemplateCard";
import TemplateDetailModal from "./components/TemplateDetailModal";
import TemplateEditorModal from "./components/TemplateEditorModal";
import VariableFillModal from "./components/VariableFillModal";
import PinModal from "./components/PinModal";
import SettingsModal from "./components/SettingsModal";
import EmptyState from "./components/EmptyState";
import HelpModal from "./components/HelpModal";
import ToastStack from "./components/ToastStack";
import ScrollToTopButton from "./components/ScrollToTopButton";
import AuthScreen from "./components/AuthScreen";
import ImportTemplatesModal from "./components/ImportTemplatesModal";
import PasswordChangeModal from "./components/PasswordChangeModal";
import defaultTemplates from "./data/defaultTemplates.json";
import { copyText, playCopyFeedback } from "./lib/clipboard";
import { resolveAccessState } from "./lib/access";
import {
  AUTH_REDIRECT_MODE,
  clearAuthRedirectModeFromUrl,
  ensureUserProfile,
  getCurrentSession,
  readAuthRedirectModeFromUrl,
  sendPasswordResetEmail,
  signInWithPassword,
  signOut,
  subscribeToAuthChanges,
  updateUserPassword,
} from "./lib/auth";
import {
  deleteUserTemplateRemote,
  duplicateToPersonalLibrary,
  fetchRemoteWorkspace,
  hasMeaningfulLegacyData,
  importUserTemplatesRemote,
  migrateLocalWorkspaceToRemote,
  saveUserTemplateRemote,
  upsertTemplateStatsRemote,
} from "./lib/remoteTemplates";
import {
  DEFAULT_PIN,
  getEditUnlockExpiresAt,
  hasCompletedLocalMigration,
  isEditUnlocked,
  loadCachedSession,
  loadPin,
  loadTemplates,
  lockEdit,
  markLocalMigrationCompleted,
  saveCachedSession,
  savePin,
  saveTemplates,
  unlockEdit,
} from "./lib/storage";
import { isSupabaseConfigured } from "./lib/supabaseClient";
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

const APP_VERSION = "2.0.0";
const TEMPLATES_PER_PAGE = 60;
const LOCAL_MODE_ACCESS = {
  status: "active",
  hasAccess: true,
  label: "Modo local",
  detail: "La app esta funcionando con cache local mientras terminas la configuracion del backend.",
};

function mergeStoredWithSeededTemplates(storedTemplates, seededTemplates) {
  const storedIds = new Set(storedTemplates.map((template) => template.id));
  const missingSeededTemplates = seededTemplates.filter((template) => !storedIds.has(template.id));

  if (!missingSeededTemplates.length) {
    return storedTemplates;
  }

  // Conservamos lo que el navegador ya conocia, pero reinyectamos el catalogo oficial
  // que falte para no perder plantillas base cuando la version del producto crece.
  return [...storedTemplates, ...missingSeededTemplates];
}

function getInitialLocalTemplates() {
  const seededTemplates = normalizeTemplates(defaultTemplates).map((template) => ({
    ...template,
    libraryOrigin: "core",
    isUserOwned: false,
  }));
  const storedTemplates = loadTemplates();

  if (storedTemplates?.length) {
    const normalizedStoredTemplates = normalizeTemplates(storedTemplates);
    return mergeStoredWithSeededTemplates(normalizedStoredTemplates, seededTemplates);
  }

  saveTemplates(seededTemplates);
  return seededTemplates;
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
  const backendConfigured = isSupabaseConfigured();
  const [templates, setTemplates] = useState(getInitialLocalTemplates);
  const [legacyTemplatesSnapshot] = useState(() => loadTemplates() || []);
  const [searchValue, setSearchValue] = useState("");
  const deferredQuery = useDeferredValue(searchValue);
  const [activeView, setActiveView] = useState(SPECIAL_VIEWS.all);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [editorState, setEditorState] = useState({ open: false, template: null });
  const [variableState, setVariableState] = useState({ open: false, template: null });
  const [pinMode, setPinMode] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  const [session, setSession] = useState(() => loadCachedSession());
  const [authRedirectMode, setAuthRedirectMode] = useState(() => readAuthRedirectModeFromUrl());
  const [profile, setProfile] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(backendConfigured);
  const [migrationPromptVisible, setMigrationPromptVisible] = useState(false);
  const [editUnlocked, setEditUnlocked] = useState(isEditUnlocked());
  const [unlockExpiresAt, setUnlockExpiresAt] = useState(getEditUnlockExpiresAt());
  const [toasts, setToasts] = useState([]);
  const resultsTopRef = useRef(null);

  const accessState = backendConfigured ? resolveAccessState(profile) : LOCAL_MODE_ACCESS;
  const hasCloudAccess = Boolean(backendConfigured && session?.user?.id && accessState.hasAccess);
  // Cuando el usuario llega desde un correo de invitacion o recuperacion,
  // obligamos a mostrar la pantalla de acceso aunque ya exista sesion.
  const shouldHandlePasswordFlow = Boolean(
    authRedirectMode === AUTH_REDIRECT_MODE.invite || authRedirectMode === AUTH_REDIRECT_MODE.recovery,
  );
  const shouldRenderAuthScreen = Boolean(
    backendConfigured &&
      (shouldHandlePasswordFlow || (!workspaceLoading && (!session?.user?.id || !accessState.hasAccess))),
  );
  const editingEnabled = hasCloudAccess;
  const settingsEnabled = hasCloudAccess;
  const addTemplateEnabled = hasCloudAccess;

  const filteredTemplates = filterAndSortTemplates(templates, {
    query: deferredQuery,
    activeView,
  });
  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / TEMPLATES_PER_PAGE));
  const resolvedPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (resolvedPage - 1) * TEMPLATES_PER_PAGE;
  const paginatedTemplates = filteredTemplates.slice(
    pageStartIndex,
    pageStartIndex + TEMPLATES_PER_PAGE,
  );
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) || null;
  const categories = getTemplateCategories(templates);
  const categoryCounts = getCategoryCounts(templates);
  const favoriteCount = templates.filter((template) => template.favorite).length;
  const recentCount = templates.filter((template) => template.lastCopiedAt).length;
  const viewHeading = getViewHeading(activeView);
  const canOfferMigration = useMemo(
    () =>
      Boolean(
        hasCloudAccess &&
          session?.user?.id &&
          !hasCompletedLocalMigration(session.user.id) &&
          hasMeaningfulLegacyData(legacyTemplatesSnapshot),
      ),
    [hasCloudAccess, legacyTemplatesSnapshot, session?.user?.id],
  );

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

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredQuery, activeView]);

  useEffect(() => {
    if (currentPage !== resolvedPage) {
      setCurrentPage(resolvedPage);
    }
  }, [currentPage, resolvedPage]);

  useEffect(() => {
    if (!backendConfigured) {
      setWorkspaceLoading(false);
      return;
    }

    let isMounted = true;

    async function bootstrapSession() {
      try {
        const currentSession = await getCurrentSession();

        if (isMounted) {
          setSession(currentSession);
          saveCachedSession(currentSession);
        }
      } catch {
        if (isMounted) {
          pushToast("No pudimos restaurar la sesion actual.", "error");
          setWorkspaceLoading(false);
        }
      }
    }

    bootstrapSession();

    const unsubscribe = subscribeToAuthChanges((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthRedirectMode(AUTH_REDIRECT_MODE.recovery);
      } else if (event === "SIGNED_IN") {
        setAuthRedirectMode(readAuthRedirectModeFromUrl());
      } else if (event === "SIGNED_OUT") {
        setAuthRedirectMode(AUTH_REDIRECT_MODE.default);
      }

      setSession(nextSession);
      saveCachedSession(nextSession);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [backendConfigured]);

  useEffect(() => {
    if (!backendConfigured) {
      return;
    }

    if (!session?.user?.id) {
      setProfile(null);
      setWorkspaceLoading(false);
      lockEdit();
      setEditUnlocked(false);
      setUnlockExpiresAt(null);
      return;
    }

    let isMounted = true;

    async function loadRemoteWorkspace() {
      setWorkspaceLoading(true);

      try {
        // Dejamos que el login repare cuentas antiguas o nuevas que aun no tengan
        // fila en profiles para no depender de una carga manual extra antes de entrar.
        await ensureUserProfile(session.user);
        const workspace = await fetchRemoteWorkspace(session.user.id);

        if (!isMounted) {
          return;
        }

        const nextAccessState = resolveAccessState(workspace.profile);
        setProfile(
          workspace.profile || {
            id: session.user.id,
            email: session.user.email || "",
            hasCoreLibrary: true,
            accessStatus: "pending",
            trialStartsAt: null,
            trialEndsAt: null,
            subscriptionEndsAt: null,
          },
        );

        if (nextAccessState.hasAccess) {
          setTemplates(workspace.templates);
        }

        setWorkspaceLoading(false);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        pushToast(
          error.message || "No pudimos sincronizar tu biblioteca con la nube.",
          "error",
        );
        setWorkspaceLoading(false);
      }
    }

    loadRemoteWorkspace();

    return () => {
      isMounted = false;
    };
  }, [backendConfigured, session?.user?.email, session?.user?.id]);

  useEffect(() => {
    setMigrationPromptVisible(canOfferMigration);
  }, [canOfferMigration]);

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

  function handlePageChange(nextPage) {
    const targetPage = Math.max(1, Math.min(nextPage, totalPages));

    if (targetPage === resolvedPage) {
      return;
    }

    setCurrentPage(targetPage);
    resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function refreshRemoteWorkspace() {
    if (!backendConfigured || !session?.user?.id) {
      return;
    }

    const workspace = await fetchRemoteWorkspace(session.user.id);
    setProfile(
      workspace.profile || {
        id: session.user.id,
        email: session.user.email || "",
        hasCoreLibrary: true,
        accessStatus: "pending",
      },
    );
    setTemplates(workspace.templates);
  }

  async function handleAuthenticate({ email, password }) {
    await signInWithPassword(email, password);
    pushToast("Sesion iniciada", "success");
  }

  async function handlePasswordRecovery(email) {
    await sendPasswordResetEmail(email);
    pushToast("Te enviamos el correo para cambiar tu contraseña.", "success");
  }

  async function handlePasswordUpdate(nextPassword) {
    await updateUserPassword(nextPassword);
    clearAuthRedirectModeFromUrl();
    setAuthRedirectMode(AUTH_REDIRECT_MODE.default);
    await refreshRemoteWorkspace();
    pushToast("Tu contraseña ya fue actualizada.", "success");
  }

  async function handleSignOut() {
    try {
      await signOut();
      clearAuthRedirectModeFromUrl();
      setAuthRedirectMode(AUTH_REDIRECT_MODE.default);
      setProfile(null);
      lockEdit();
      setEditUnlocked(false);
      setUnlockExpiresAt(null);
      pushToast("Sesion cerrada", "info");
    } catch {
      pushToast("No pudimos cerrar la sesion.", "error");
    }
  }

  async function handleMigrateLocalData() {
    if (!session?.user?.id) {
      return;
    }

    try {
      await migrateLocalWorkspaceToRemote(session.user.id, legacyTemplatesSnapshot);
      markLocalMigrationCompleted(session.user.id);
      setMigrationPromptVisible(false);
      await refreshRemoteWorkspace();
      pushToast("Tus datos locales ya quedaron migrados a la nube.", "success");
    } catch (error) {
      pushToast(error.message || "No pudimos migrar tus datos locales.", "error");
    }
  }

  async function handleToggleFavorite(template) {
    const nextFavorite = !template.favorite;

    setTemplates((current) =>
      current.map((entry) =>
        entry.id === template.id ? { ...entry, favorite: nextFavorite } : entry,
      ),
    );

    if (hasCloudAccess && session?.user?.id) {
      try {
        await upsertTemplateStatsRemote(session.user.id, template, { favorite: nextFavorite });
      } catch {
        pushToast("No pudimos sincronizar favoritas.", "error");
      }
    }

    pushToast(nextFavorite ? "Plantilla agregada a favoritas" : "Plantilla quitada de favoritas", "success");
  }

  async function handleCopyResult(template, finalText, successMessage) {
    try {
      await copyText(finalText);
      void playCopyFeedback();

      const updatedTemplate = markTemplateCopied(template);

      setTemplates((current) =>
        current.map((entry) => (entry.id === template.id ? updatedTemplate : entry)),
      );

      if (hasCloudAccess && session?.user?.id) {
        await upsertTemplateStatsRemote(session.user.id, updatedTemplate, {
          copyCount: updatedTemplate.copyCount,
          lastCopiedAt: updatedTemplate.lastCopiedAt,
          favorite: updatedTemplate.favorite,
        });
      }

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
    if (!editingEnabled) {
      pushToast("Inicia sesion con acceso vigente para editar tu biblioteca.", "info");
      return;
    }

    if (!editUnlocked) {
      pushToast("Desbloquea la edicion con tu PIN local antes de modificar plantillas.", "info");
      return;
    }

    if (template && !template.isUserOwned) {
      pushToast("Las plantillas oficiales se editan desde VS Code y luego se publican.", "info");
      return;
    }

    setSelectedTemplateId(null);
    setEditorState({ open: true, template });
  }

  async function handleSaveTemplate(form, originalTemplate) {
    if (!session?.user?.id) {
      pushToast("Debes iniciar sesion para guardar plantillas personales.", "error");
      return;
    }

    try {
      const localTemplate = originalTemplate
        ? updateTemplateRecord(originalTemplate, form)
        : createTemplate({
            ...form,
            libraryOrigin: "personal",
            isUserOwned: true,
            sourceType: "manual",
          });

      const savedTemplate = await saveUserTemplateRemote(session.user.id, localTemplate, originalTemplate);

      if (originalTemplate) {
        setTemplates((current) =>
          current.map((entry) => (entry.id === originalTemplate.id ? savedTemplate : entry)),
        );
        pushToast("Plantilla personal actualizada", "success");
      } else {
        setTemplates((current) => [savedTemplate, ...current]);
        setCurrentPage(1);
        pushToast("Plantilla personal creada", "success");
      }

      closeEditor();
    } catch (error) {
      pushToast(error.message || "No pudimos guardar la plantilla.", "error");
    }
  }

  async function handleDuplicate(template) {
    if (!session?.user?.id) {
      pushToast("Debes iniciar sesion para duplicar plantillas.", "error");
      return;
    }

    try {
      const duplicate = hasCloudAccess
        ? await duplicateToPersonalLibrary(session.user.id, template)
        : duplicateTemplateRecord(template);

      setTemplates((current) => [duplicate, ...current]);
      setCurrentPage(1);
      closeEditor();
      setSelectedTemplateId(duplicate.id);
      pushToast(
        template.libraryOrigin === "core"
          ? "Plantilla oficial duplicada a tu biblioteca personal"
          : "Plantilla duplicada",
        "success",
      );
    } catch (error) {
      pushToast(error.message || "No pudimos duplicar la plantilla.", "error");
    }
  }

  async function handleDelete(template) {
    if (!template.isUserOwned) {
      pushToast("Las plantillas oficiales no se eliminan desde la app.", "info");
      return;
    }

    if (!window.confirm(`Eliminar la plantilla "${template.title}" de tu biblioteca personal?`)) {
      return;
    }

    try {
      await deleteUserTemplateRemote(template.id);
      setTemplates((current) => current.filter((entry) => entry.id !== template.id));
      closeEditor();
      setSelectedTemplateId(null);
      pushToast("Plantilla personal eliminada", "success");
    } catch (error) {
      pushToast(error.message || "No pudimos eliminar la plantilla.", "error");
    }
  }

  async function handleImportTemplates({ fileName, importKind, rows }) {
    if (!session?.user?.id) {
      throw new Error("Debes iniciar sesion para importar plantillas.");
    }

    if (!editUnlocked) {
      throw new Error("Desbloquea la edicion con tu PIN local antes de importar.");
    }

    const importedTemplates = await importUserTemplatesRemote({
      userId: session.user.id,
      fileName,
      importKind,
      rows,
    });

    setTemplates((current) => [...importedTemplates, ...current]);
    setCurrentPage(1);
    pushToast(`${importedTemplates.length} plantillas importadas a tu biblioteca personal.`, "success");
  }

  function handleBlockedExport() {
    pushToast("La exportacion esta deshabilitada para todos en esta fase del producto.", "info");
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

    if (!hasCloudAccess) {
      return {
        success: false,
        message: "Necesitas una cuenta activa para desbloquear la edicion.",
      };
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

  async function handleAccountPasswordChange(nextPassword) {
    await updateUserPassword(nextPassword);
    pushToast("Contraseña de acceso actualizada.", "success");
    setPasswordChangeOpen(false);
  }

  if (backendConfigured && workspaceLoading) {
    return (
      <>
        <AuthScreen
          accessState={accessState}
          backendConfigured={backendConfigured}
          authMode={authRedirectMode}
          loading
          session={session}
          onPasswordRecovery={handlePasswordRecovery}
          onSubmit={handleAuthenticate}
          onSignOut={handleSignOut}
          onUpdatePassword={handlePasswordUpdate}
        />
        <ToastStack toasts={toasts} />
      </>
    );
  }

  if (shouldRenderAuthScreen) {
    return (
      <>
        <AuthScreen
          accessState={accessState}
          backendConfigured={backendConfigured}
          authMode={authRedirectMode}
          session={session}
          onPasswordRecovery={handlePasswordRecovery}
          onSubmit={handleAuthenticate}
          onSignOut={handleSignOut}
          onUpdatePassword={handlePasswordUpdate}
        />
        <ToastStack toasts={toasts} />
      </>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(123,223,246,0.08),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(184,181,255,0.08),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(246,171,200,0.08),transparent_24%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <Header
          accountEmail={profile?.email || session?.user?.email || ""}
          accessState={accessState}
          addTemplateDisabled={!addTemplateEnabled}
          backendConfigured={backendConfigured}
          editUnlocked={editUnlocked}
          editingEnabled={editingEnabled}
          hasSession={Boolean(session?.user?.id)}
          settingsDisabled={!settingsEnabled}
          unlockDisabled={!editingEnabled}
          unlockExpiresAt={unlockExpiresAt}
          onAccountClick={() => {
            if (!backendConfigured) {
              pushToast("Configura Supabase para activar el acceso con correo.", "info");
              return;
            }

            setSettingsOpen(true);
          }}
          onHelpClick={() => setHelpOpen(true)}
          onUnlockClick={() => setPinMode("unlock")}
          onLockClick={handleLockEdit}
          onNewTemplate={() => openEditor(null)}
          onSettingsClick={() => setSettingsOpen(true)}
          onSignOut={handleSignOut}
        />

        {backendConfigured ? (
          <div className="rounded-[24px] border border-cyan/20 bg-cyan/10 px-4 py-3 text-sm text-slate-100">
            <span className="font-medium text-white">Estado de acceso:</span> {accessState.label}.{" "}
            <span className="text-slate-300">{accessState.detail}</span>
          </div>
        ) : (
          <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
            Supabase aun no esta configurado. La app sigue mostrando la biblioteca oficial local
            para que puedas continuar el desarrollo y la curacion del catalogo.
          </div>
        )}

        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          resultCount={filteredTemplates.length}
          templateCount={templates.length}
        />

        {migrationPromptVisible ? (
          <div className="glass-panel rounded-[24px] border border-cyan/20 bg-cyan/10 p-4 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-white">Encontramos datos locales para migrar</p>
                <p className="mt-1 text-sm leading-6 text-slate-200">
                  Puedes subir favoritas, recents y plantillas personales guardadas en este
                  navegador a tu cuenta en la nube.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMigrationPromptVisible(false)}
                  className="button-secondary"
                >
                  Ahora no
                </button>
                <button type="button" onClick={handleMigrateLocalData} className="button-primary">
                  Importar datos locales
                </button>
              </div>
            </div>
          </div>
        ) : null}

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
            <div ref={resultsTopRef} className="glass-panel rounded-[28px] p-4 shadow-card">
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
                  {totalPages > 1 ? (
                    <span className="badge-soft">
                      Pagina {resolvedPage}/{totalPages}
                    </span>
                  ) : null}
                  <span className="badge-soft">
                    {editingEnabled
                      ? editUnlocked
                        ? "Edicion desbloqueada"
                        : "Modo lectura"
                      : "Edicion en pausa"}
                  </span>
                </div>
              </div>
            </div>

            {filteredTemplates.length ? (
              <>
                <PaginationControls
                  currentPage={resolvedPage}
                  totalPages={totalPages}
                  totalItems={filteredTemplates.length}
                  pageSize={TEMPLATES_PER_PAGE}
                  onPageChange={handlePageChange}
                />

                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {paginatedTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onOpen={openTemplate}
                      onCopy={handleCopy}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>

                <PaginationControls
                  currentPage={resolvedPage}
                  totalPages={totalPages}
                  totalItems={filteredTemplates.length}
                  pageSize={TEMPLATES_PER_PAGE}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <EmptyState
                query={deferredQuery}
                title={deferredQuery ? "No encontramos plantillas" : "Biblioteca vacia"}
                description={
                  deferredQuery
                    ? "Prueba con otro termino o cambia la categoria seleccionada. Skelly seguira buscando contigo."
                    : editingEnabled
                      ? "Aun no hay plantillas en esta vista. Puedes crear una nueva o importar desde Excel o CSV."
                      : "No hay plantillas visibles en este filtro. Cambia de categoria o revisa si ya activaste tu acceso."
                }
              />
            )}
          </main>
        </div>

        {!editUnlocked && editingEnabled ? (
          <div className="glass-panel rounded-[24px] border border-rose/20 bg-rose/10 p-4 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 text-rose" />
                <div>
                  <p className="font-medium text-white">Modo lectura activo</p>
                  <p className="mt-1 text-sm leading-6 text-slate-200">
                    Puedes buscar, filtrar, copiar y marcar favoritas. Para editar o importar a tu
                    biblioteca personal, desbloquea la edicion con tu PIN local.
                  </p>
                </div>
              </div>

              <button type="button" onClick={() => setPinMode("unlock")} className="button-primary">
                Desbloquear
              </button>
            </div>
          </div>
        ) : null}

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
        accessState={accessState}
        appVersion={APP_VERSION}
        canImport={editingEnabled}
        canManagePassword={Boolean(session?.user?.id)}
        editUnlocked={editUnlocked}
        profile={profile}
        onBlockedExport={handleBlockedExport}
        onOpenChangePin={() => {
          setSettingsOpen(false);
          setPinMode("change");
        }}
        onOpenImport={() => {
          if (!editingEnabled) {
            pushToast("Necesitas una cuenta activa para importar plantillas.", "error");
            return;
          }

          setImportOpen(true);
        }}
        onOpenChangePassword={() => {
          setSettingsOpen(false);
          setPasswordChangeOpen(true);
        }}
        onSignOut={handleSignOut}
      />

      <HelpModal
        createTemplateDisabled={!addTemplateEnabled}
        editingEnabled={editingEnabled}
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        editUnlocked={editUnlocked}
        unlockDisabled={!editingEnabled}
        onUnlockClick={() => setPinMode("unlock")}
        onCreateTemplate={() => openEditor(null)}
      />

      <ImportTemplatesModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        existingTemplates={templates}
        onImport={handleImportTemplates}
      />

      <PasswordChangeModal
        open={passwordChangeOpen}
        onClose={() => setPasswordChangeOpen(false)}
        onSubmit={handleAccountPasswordChange}
      />

      <ToastStack toasts={toasts} />
      <ScrollToTopButton />
    </div>
  );
}
