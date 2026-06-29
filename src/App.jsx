// App.jsx
// ============================================================
// Orquestador principal de la aplicacion. Vive en la raiz y decide:
//   1. Si mostrar AuthScreen o el Dashboard segun la sesion.
//   2. Cargar la biblioteca del usuario desde Supabase o desde cache local.
//   3. Manejar la migracion de datos locales al primer login.
//   4. Orquestar los modales (detalle, edicion, variables, ayuda, etc.).
//   5. Disparar el saludo de Skelly cuando el dashboard esta listo.
//
// Toda la logica de negocio vive en `src/lib/`. Este archivo solo conecta
// piezas y maneja estado de UI.

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Heart, Layers3, ShieldAlert } from "lucide-react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import CategorySidebar from "./components/CategorySidebar";
import PaginationControls from "./components/PaginationControls";
import AnimatedLockIcon from "./components/AnimatedLockIcon";
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
import PasswordChangeModal from "./components/PasswordChangeModal";
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
  fetchRemoteWorkspace,
  hasMeaningfulLegacyData,
  migrateLocalWorkspaceToRemote,
  saveUserTemplateRemote,
  upsertTemplateStatsRemote,
} from "./lib/remoteTemplates";
import {
  clearAppStorage,
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
  filterAndSortTemplates,
  getCategoryCounts,
  getTemplateCategories,
  markTemplateCopied,
  normalizeTemplates,
  updateTemplateRecord,
} from "./lib/templates";
import { normalizeTemplateContentSpacing } from "./lib/reportFormatting";
import { blankVariables, fillVariables, hasVariables } from "./lib/variables";

const APP_VERSION = "2.0.0";
const TOAST_DURATION_MS = 4000;
const MOBILE_VIEWPORT_MAX_WIDTH = 639;
const TEMPLATE_GRID_GAP_PX = 16;
const TEMPLATE_CARD_MIN_WIDTH_PX = 240;
const TEMPLATE_GRID_MAX_COLUMNS = 6;
const TEMPLATE_GRID_MIN_DESKTOP_ROWS = 3;
const TEMPLATE_GRID_MAX_DESKTOP_ROWS = 5;
const TEMPLATE_GRID_MOBILE_PAGE_SIZE = 6;
const TEMPLATE_CARD_FALLBACK_HEIGHT_PX = 274;
const TEMPLATE_GRID_BOTTOM_BREATHING_ROOM_PX = 112;

function getViewportWidth() {
  if (typeof window === "undefined") {
    return 0;
  }

  return window.innerWidth;
}

function useElementMetrics(element, fallbackMetrics) {
  const [metrics, setMetrics] = useState(fallbackMetrics);

  useEffect(() => {
    if (!element) {
      setMetrics(fallbackMetrics);
      return undefined;
    }

    function syncElementMetrics() {
      const rect = element.getBoundingClientRect();
      setMetrics({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        documentTop: Math.round(rect.top + window.scrollY),
      });
    }

    syncElementMetrics();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncElementMetrics);
      return () => window.removeEventListener("resize", syncElementMetrics);
    }

    // Observamos la "casa" real de la grilla y la altura real de una tarjeta para
    // que ancho y alto reaccionen al espacio util, no a supuestos fijos.
    const observer = new ResizeObserver(() => {
      syncElementMetrics();
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [element, fallbackMetrics]);

  return metrics;
}

function resolveTemplateGridLayout({
  viewportWidth,
  viewportHeight,
  availableWidth,
  gridDocumentTop,
  cardHeight,
}) {
  if (viewportWidth <= MOBILE_VIEWPORT_MAX_WIDTH) {
    return {
      columns: 1,
      rows: TEMPLATE_GRID_MOBILE_PAGE_SIZE,
      pageSize: TEMPLATE_GRID_MOBILE_PAGE_SIZE,
    };
  }

  const safeAvailableWidth = Math.max(availableWidth, TEMPLATE_CARD_MIN_WIDTH_PX);
  const inferredColumns = Math.floor(
    (safeAvailableWidth + TEMPLATE_GRID_GAP_PX) /
      (TEMPLATE_CARD_MIN_WIDTH_PX + TEMPLATE_GRID_GAP_PX),
  );
  const columns = Math.max(2, Math.min(TEMPLATE_GRID_MAX_COLUMNS, inferredColumns || 2));
  const safeCardHeight = Math.max(cardHeight, TEMPLATE_CARD_FALLBACK_HEIGHT_PX);
  const availableHeight = Math.max(
    safeCardHeight,
    viewportHeight - gridDocumentTop - TEMPLATE_GRID_BOTTOM_BREATHING_ROOM_PX,
  );
  const inferredRows = Math.floor(
    (availableHeight + TEMPLATE_GRID_GAP_PX) / (safeCardHeight + TEMPLATE_GRID_GAP_PX),
  );
  const rows = Math.max(
    TEMPLATE_GRID_MIN_DESKTOP_ROWS,
    Math.min(TEMPLATE_GRID_MAX_DESKTOP_ROWS, inferredRows || TEMPLATE_GRID_MIN_DESKTOP_ROWS),
  );

  return {
    columns,
    rows,
    pageSize: columns * rows,
  };
}

function useViewportSize() {
  const [viewportSize, setViewportSize] = useState(() => ({
    width: getViewportWidth(),
    height: typeof window === "undefined" ? 0 : window.innerHeight,
  }));

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    function syncViewportSize() {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Leemos el viewport real porque ahora el layout decide columnas y filas
    // segun el espacio util disponible, no con valores fijos.
    syncViewportSize();
    window.addEventListener("resize", syncViewportSize);

    return () => window.removeEventListener("resize", syncViewportSize);
  }, []);

  return viewportSize;
}

function getInitialLocalTemplates() {
  const storedTemplates = loadTemplates();
  return storedTemplates?.length ? normalizeTemplates(storedTemplates) : [];
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
  const viewportSize = useViewportSize();
  const viewportWidth = viewportSize.width;
  const [templateGridHost, setTemplateGridHost] = useState(null);
  const [templateCardProbe, setTemplateCardProbe] = useState(null);
  const [templates, setTemplates] = useState(getInitialLocalTemplates);
  const [legacyTemplatesSnapshot, setLegacyTemplatesSnapshot] = useState(() => loadTemplates() || []);
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
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  const [session, setSession] = useState(() => loadCachedSession());
  const [authRedirectMode, setAuthRedirectMode] = useState(() => readAuthRedirectModeFromUrl());
  const [profile, setProfile] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(backendConfigured);
  const [migrationPromptVisible, setMigrationPromptVisible] = useState(false);
  const [editUnlocked, setEditUnlocked] = useState(isEditUnlocked());
  const [unlockExpiresAt, setUnlockExpiresAt] = useState(getEditUnlockExpiresAt());
  const [pendingSkellyIntro, setPendingSkellyIntro] = useState(false);
  const [skellyIntroToken, setSkellyIntroToken] = useState(0);
  const [toasts, setToasts] = useState([]);
  const resultsTopRef = useRef(null);
  const toastTimeoutsRef = useRef(new Map());

  const accessState = resolveAccessState(profile);
  const hasCloudAccess = Boolean(backendConfigured && session?.user?.id && accessState.hasAccess);
  // Cuando el usuario llega desde un correo de invitacion o recuperacion,
  // obligamos a mostrar la pantalla de acceso aunque ya exista sesion.
  const shouldHandlePasswordFlow = Boolean(
    authRedirectMode === AUTH_REDIRECT_MODE.invite || authRedirectMode === AUTH_REDIRECT_MODE.recovery,
  );
  // La biblioteca no debe renderizarse sin sesion valida. Si falta backend,
  // dejamos el acceso bloqueado en la pantalla de login/configuracion.
  const shouldRenderAuthScreen = Boolean(
    !backendConfigured ||
      shouldHandlePasswordFlow ||
      (!workspaceLoading && (!session?.user?.id || !accessState.hasAccess)),
  );
  const editingEnabled = hasCloudAccess;
  const addTemplateEnabled = hasCloudAccess;

  const filteredTemplates = filterAndSortTemplates(templates, {
    query: deferredQuery,
    activeView,
  });
  const templateGridFallbackMetrics = useMemo(
    () => ({
      width: viewportWidth,
      height: 0,
      documentTop: 0,
    }),
    [viewportWidth],
  );
  const templateCardFallbackMetrics = useMemo(
    () => ({
      width: 0,
      height: TEMPLATE_CARD_FALLBACK_HEIGHT_PX,
      documentTop: 0,
    }),
    [],
  );
  const templateGridMetrics = useElementMetrics(templateGridHost, templateGridFallbackMetrics);
  const templateCardMetrics = useElementMetrics(templateCardProbe, templateCardFallbackMetrics);
  const templateGridLayout = resolveTemplateGridLayout({
    viewportWidth,
    viewportHeight: viewportSize.height,
    availableWidth: templateGridMetrics.width,
    gridDocumentTop: templateGridMetrics.documentTop,
    cardHeight: templateCardMetrics.height,
  });
  const templatesPerPage = templateGridLayout.pageSize;
  // La misma fuente de verdad controla columnas y page size para que la pagina
  // siempre corte exactamente donde termina la ultima fila visible.
  const templateGridStyle = {
    gridTemplateColumns: `repeat(${templateGridLayout.columns}, minmax(0, 1fr))`,
  };
  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / templatesPerPage));
  const resolvedPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (resolvedPage - 1) * templatesPerPage;
  const paginatedTemplates = filteredTemplates.slice(
    pageStartIndex,
    pageStartIndex + templatesPerPage,
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
    if (!session?.user?.id) {
      return;
    }

    saveTemplates(templates);
  }, [session?.user?.id, templates]);

  useEffect(() => {
    return () => {
      // Si la app desmonta, soltamos los temporizadores para que no intenten
      // modificar estado despues de que el usuario haya salido o navegado.
      toastTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      toastTimeoutsRef.current.clear();
    };
  }, []);

  function clearClientSessionFootprint() {
    // Limpiamos todo lo que haya quedado en localStorage para que otra cuenta
    // no herede cache, PIN ni metricas locales al reutilizar el mismo navegador.
    clearAppStorage();
    setTemplates([]);
    setLegacyTemplatesSnapshot([]);
    setSelectedTemplateId(null);
    setEditorState({ open: false, template: null });
    setVariableState({ open: false, template: null });
    setSettingsOpen(false);
    setHelpOpen(false);
    setPasswordChangeOpen(false);
    setMigrationPromptVisible(false);
    setSearchValue("");
    setActiveView(SPECIAL_VIEWS.all);
    setCurrentPage(1);
    lockEdit();
    setEditUnlocked(false);
    setUnlockExpiresAt(null);
  }

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
          if (currentSession?.user?.id) {
            saveCachedSession(currentSession);
          } else {
            clearClientSessionFootprint();
          }
        }
      } catch {
        if (isMounted) {
          pushToast("No pudimos restaurar la sesion actual.", "error");
          clearClientSessionFootprint();
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

      if (nextSession?.user?.id) {
        saveCachedSession(nextSession);
      } else {
        clearClientSessionFootprint();
      }
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
      clearClientSessionFootprint();
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
        } else {
          setTemplates([]);
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

  useEffect(() => {
    if (!pendingSkellyIntro) {
      return;
    }

    const canShowDashboard =
      !workspaceLoading && Boolean(session?.user?.id) && accessState.hasAccess && !shouldRenderAuthScreen;

    if (!canShowDashboard) {
      return;
    }

    // Disparamos el saludo solo cuando el dashboard ya quedo realmente listo.
    // Asi la transicion login -> carga -> app no se come la entrada de Skelly.
    setSkellyIntroToken((current) => current + 1);
    setPendingSkellyIntro(false);
  }, [
    accessState.hasAccess,
    pendingSkellyIntro,
    session?.user?.id,
    shouldRenderAuthScreen,
    workspaceLoading,
  ]);

  function dismissToast(id) {
    const timeoutId = toastTimeoutsRef.current.get(id);

    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      toastTimeoutsRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function pushToast(message, tone = "info") {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    setToasts((current) => [...current, { id, message, tone }]);
    const timeoutId = window.setTimeout(() => {
      toastTimeoutsRef.current.delete(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);

    toastTimeoutsRef.current.set(id, timeoutId);
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
    const nextAccessState = resolveAccessState(workspace.profile);
    setProfile(
      workspace.profile || {
        id: session.user.id,
        email: session.user.email || "",
        hasCoreLibrary: true,
        accessStatus: "pending",
      },
    );
    setTemplates(nextAccessState.hasAccess ? workspace.templates : []);
  }

  async function handleAuthenticate({ email, password }) {
    await signInWithPassword(email, password);
    setPendingSkellyIntro(true);
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
    setPendingSkellyIntro(true);
    pushToast("Tu contraseña ya fue actualizada.", "success");
  }

  async function handleSignOut() {
    try {
      await signOut();
      clearAuthRedirectModeFromUrl();
      setAuthRedirectMode(AUTH_REDIRECT_MODE.default);
      setSession(null);
      clearClientSessionFootprint();
      setProfile(null);
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
      await copyText(normalizeTemplateContentSpacing(finalText));
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

    setSelectedTemplateId(null);
    setEditorState({ open: true, template });
  }

  async function handleSaveTemplate(form, originalTemplate) {
    if (!session?.user?.id) {
      pushToast("Debes iniciar sesion para guardar plantillas personales.", "error");
      return;
    }

    try {
      // Las plantillas oficiales se "promueven" automaticamente a personales al
      // guardar: conservamos el mismo ID para que el merge en la nube las siga
      // mostrando donde estaba la oficial original.
      const isPromotingOfficial = Boolean(originalTemplate && !originalTemplate.isUserOwned);
      const baseRecord = isPromotingOfficial
        ? {
            ...originalTemplate,
            libraryOrigin: "personal",
            isUserOwned: true,
            sourceType: "duplicated_from_core",
          }
        : originalTemplate;

      const localTemplate = baseRecord
        ? updateTemplateRecord(baseRecord, form)
        : createTemplate({
            ...form,
            libraryOrigin: "personal",
            isUserOwned: true,
            sourceType: "manual",
          });

      const savedTemplate = await saveUserTemplateRemote(session.user.id, localTemplate, baseRecord);

      if (originalTemplate) {
        setTemplates((current) =>
          current.map((entry) => (entry.id === originalTemplate.id ? savedTemplate : entry)),
        );
        pushToast(
          isPromotingOfficial
            ? "Tu edicion quedo guardada en tu biblioteca"
            : "Plantilla actualizada",
          "success",
        );
      } else {
        setTemplates((current) => [savedTemplate, ...current]);
        setCurrentPage(1);
        pushToast("Plantilla creada", "success");
      }

      closeEditor();
    } catch (error) {
      pushToast(error.message || "No pudimos guardar la plantilla.", "error");
    }
  }

  async function handleUpdateShortcuts(template, nextShortcuts) {
    if (!session?.user?.id) {
      pushToast("Debes iniciar sesion para editar atajos.", "error");
      throw new Error("Sesion requerida.");
    }

    try {
      // Para atajos, las plantillas oficiales se promueven igual a personales:
      // copiamos la fila a user_templates con los atajos nuevos y el mismo ID.
      const isPromotingOfficial = !template.isUserOwned;
      const baseRecord = isPromotingOfficial
        ? {
            ...template,
            libraryOrigin: "personal",
            isUserOwned: true,
            sourceType: "duplicated_from_core",
          }
        : template;

      const updatedLocalTemplate = updateTemplateRecord(baseRecord, {
        shortcut: nextShortcuts.join(", "),
      });
      const savedTemplate = await saveUserTemplateRemote(session.user.id, updatedLocalTemplate, baseRecord);

      setTemplates((current) =>
        current.map((entry) => (entry.id === template.id ? savedTemplate : entry)),
      );
      pushToast("Atajos actualizados", "success");
      return savedTemplate;
    } catch (error) {
      pushToast(error.message || "No pudimos guardar los atajos.", "error");
      throw error;
    }
  }

  async function handleDelete(template) {
    if (!template.isUserOwned) {
      pushToast("Edita primero esta plantilla para poder personalizarla y luego eliminarla.", "info");
      return;
    }

    if (!window.confirm(`Eliminar la plantilla "${template.title}"?`)) {
      return;
    }

    try {
      await deleteUserTemplateRemote(template.id);
      setTemplates((current) => current.filter((entry) => entry.id !== template.id));
      closeEditor();
      setSelectedTemplateId(null);
      pushToast("Plantilla eliminada", "success");
    } catch (error) {
      pushToast(error.message || "No pudimos eliminar la plantilla.", "error");
    }
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
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
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
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(123,223,246,0.08),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(184,181,255,0.08),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(246,171,200,0.08),transparent_24%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1880px] flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 2xl:gap-7 2xl:px-10">
        <Header
          accessState={accessState}
          addTemplateDisabled={!addTemplateEnabled}
          backendConfigured={backendConfigured}
          editUnlocked={editUnlocked}
          editingEnabled={editingEnabled}
          hasSession={Boolean(session?.user?.id)}
          profile={profile}
          skellyIntroToken={skellyIntroToken}
          unlockDisabled={!editingEnabled}
          unlockExpiresAt={unlockExpiresAt}
          onAccountClick={() => setSettingsOpen(true)}
          onHelpClick={() => setHelpOpen(true)}
          onUnlockClick={() => setPinMode("unlock")}
          onLockClick={handleLockEdit}
          onNewTemplate={() => openEditor(null)}
          onSignOut={handleSignOut}
        />

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

        <div className="grid gap-6 lg:grid-cols-[292px_minmax(0,1fr)] 2xl:gap-7 2xl:grid-cols-[320px_minmax(0,1fr)]">
          <CategorySidebar
            categories={categories}
            activeView={activeView}
            onChange={setActiveView}
            counts={categoryCounts}
            favoriteCount={favoriteCount}
            recentCount={recentCount}
            viewportWidth={viewportWidth}
          />

          <main className="space-y-4 2xl:space-y-5">
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
                      ? "Busqueda en tiempo real por titulo, categoria, atajos y contenido. Los atajos de tus plantillas se ajustan desde el detalle de la plantilla."
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
                  pageSize={templatesPerPage}
                  onPageChange={handlePageChange}
                />

                <div ref={setTemplateGridHost} className="grid gap-4" style={templateGridStyle}>
                  {paginatedTemplates.map((template, index) => (
                    <div
                      key={template.id}
                      ref={index === 0 ? setTemplateCardProbe : null}
                      className="h-full"
                    >
                      <TemplateCard
                        template={template}
                        onOpen={openTemplate}
                        onCopy={handleCopy}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                query={deferredQuery}
                title={deferredQuery ? "No encontramos plantillas" : "Biblioteca vacia"}
                description={
                  deferredQuery
                    ? "Prueba con otro termino o cambia la categoria seleccionada. Skelly seguira buscando contigo."
                    : editingEnabled
                      ? "Aun no hay plantillas en esta vista. Puedes crear una nueva cuando quieras."
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
                    Puedes buscar, filtrar, copiar y marcar favoritas. Para editar plantillas,
                    desbloquea la edicion con tu PIN local.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPinMode("unlock")}
                className="button-primary group"
              >
                <AnimatedLockIcon mode="unlock" className="h-4 w-4" />
                Desbloquear
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-center gap-2 pb-1 text-center text-xs uppercase tracking-[0.18em] text-cyan/85">
          <span className="footer-heart-shell" aria-hidden="true">
            <Heart className="footer-heart-icon h-3.5 w-3.5 fill-rose text-rose" />
          </span>
          <span>Hecho con cariño para mi esposa</span>
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
        onDelete={handleDelete}
        onUpdateShortcuts={handleUpdateShortcuts}
      />

      <TemplateEditorModal
        open={editorState.open}
        template={editorState.template}
        categories={categories}
        onClose={closeEditor}
        onSave={handleSaveTemplate}
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
        canManagePassword={Boolean(session?.user?.id)}
        editUnlocked={editUnlocked}
        profile={profile}
        onOpenChangePin={() => {
          setSettingsOpen(false);
          setPinMode("change");
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

      <PasswordChangeModal
        open={passwordChangeOpen}
        onClose={() => setPasswordChangeOpen(false)}
        onSubmit={handleAccountPasswordChange}
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <ScrollToTopButton />
    </div>
  );
}
