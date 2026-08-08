import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Heart,
  LockKeyhole,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import BotonesEcoCard from "./BotonesEcoCard";
import BotonesEcoEditorModal from "./BotonesEcoEditorModal";
import {
  createEcoCard,
  filterEcoCards,
  getDefaultEcoCards,
  groupEcoCards,
  updateEcoCard,
} from "../lib/botonesEco";
import {
  buildEcoCardsFromSources,
  deleteAllRemoteEcoCards,
  fetchRemoteEcoCards,
  migrateLegacyEcoCards,
  saveRemoteEcoCard,
} from "../lib/remoteEcoCards";
import {
  clearLegacyEcoCards,
  hasCompletedEcoMigration,
  loadEcoCardsCache,
  loadLegacyEcoCards,
  markEcoMigrationCompleted,
  saveEcoCardsCache,
} from "../lib/storage";
import { copyText, playCopyFeedback } from "../lib/clipboard";
import { getPublicAssetPath } from "../lib/publicAssets";

const COPY_FEEDBACK_DURATION_MS = 1400;

function getCachedCards(userId) {
  const cachedCards = loadEcoCardsCache(userId);
  return cachedCards?.length ? cachedCards : getDefaultEcoCards();
}

export default function BotonesEcoPage({
  session,
  editingEnabled,
  editUnlocked,
  onPushToast,
  onUnlockClick,
}) {
  const userId = session?.user?.id || null;
  const [cards, setCards] = useState(() => getCachedCards(userId));
  const [legacyCards, setLegacyCards] = useState(() => loadLegacyEcoCards() || []);
  const [migrationVisible, setMigrationVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [editorState, setEditorState] = useState({ open: false, card: null });
  const [resetting, setResetting] = useState(false);
  const copyTimeoutRef = useRef(null);
  const toastHandlerRef = useRef(onPushToast);

  useEffect(() => {
    toastHandlerRef.current = onPushToast;
  }, [onPushToast]);

  const filteredCards = useMemo(() => filterEcoCards(cards, query), [cards, query]);
  const groupedCards = useMemo(() => groupEcoCards(filteredCards), [filteredCards]);
  const customCardCount = cards.filter((card) => !card.isDefault).length;

  useEffect(() => {
    let isMounted = true;
    const localCards = loadLegacyEcoCards() || [];
    const cachedCards = getCachedCards(userId);

    setLegacyCards(localCards);
    setCards(cachedCards);
    setLoading(true);

    if (!userId) {
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    async function loadCards() {
      try {
        const remoteCards = await fetchRemoteEcoCards(userId);
        if (!isMounted) {
          return;
        }

        setCards(buildEcoCardsFromSources({ remoteCards, legacyCards: localCards }));

        const hasPendingMigration =
          localCards.length > 0 && !hasCompletedEcoMigration(userId);
        setMigrationVisible(hasPendingMigration);
      } catch {
        if (!isMounted) {
          return;
        }

        // La copia local permite seguir leyendo la herramienta si la tabla aun
        // no fue aplicada en Supabase o la red esta temporalmente caida. Las
        // operaciones de guardado siguen exigiendo nube para no perder datos.
        setCards(cachedCards);
        toastHandlerRef.current(
          "No pudimos sincronizar Botones Eco. Mostramos los datos guardados.",
          "info",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCards();

    return () => {
      isMounted = false;
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, [userId]);

  useEffect(() => {
    if (userId && cards.length) {
      saveEcoCardsCache(userId, cards);
    }
  }, [cards, userId]);

  async function refreshCards(nextLegacyCards = legacyCards) {
    const remoteCards = await fetchRemoteEcoCards(userId);
    const nextCards = buildEcoCardsFromSources({
      remoteCards,
      legacyCards: nextLegacyCards,
    });
    setCards(nextCards);
    return nextCards;
  }

  async function handleCopy(card) {
    try {
      await copyText(card.copyText);
      void playCopyFeedback();
      setCopiedId(card.id);
      // La busqueda solo se limpia despues de copiar bien: asi el usuario no
      // pierde su contexto si el navegador bloquea el portapapeles.
      setQuery("");
      toastHandlerRef.current("Texto copiado", "success");

      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = window.setTimeout(() => {
        setCopiedId(null);
        copyTimeoutRef.current = null;
      }, COPY_FEEDBACK_DURATION_MS);
    } catch {
      toastHandlerRef.current("No fue posible copiar el texto al portapapeles.", "error");
    }
  }

  function handleEdit(card) {
    if (!editingEnabled) {
      toastHandlerRef.current("Necesitas una cuenta con acceso vigente para editar tarjetas.", "info");
      return;
    }

    if (!editUnlocked) {
      onUnlockClick();
      return;
    }

    setEditorState({ open: true, card });
  }

  function handleNewCard() {
    if (!editingEnabled) {
      toastHandlerRef.current("Necesitas una cuenta con acceso vigente para agregar tarjetas.", "info");
      return;
    }

    if (!editUnlocked) {
      onUnlockClick();
      return;
    }

    setEditorState({ open: true, card: null });
  }

  async function handleSave(form) {
    const originalCard = editorState.card;
    const nextCard = originalCard
      ? updateEcoCard(originalCard, form)
      : createEcoCard(cards, form);

    if (!nextCard) {
      throw new Error("Completa el nombre y el texto que se copiara.");
    }

    await saveRemoteEcoCard(userId, nextCard);
    setCards((current) => {
      const alreadyExists = current.some((card) => card.id === nextCard.id);
      return alreadyExists
        ? current.map((card) => (card.id === nextCard.id ? nextCard : card))
        : [...current, nextCard];
    });
    setEditorState({ open: false, card: null });
    toastHandlerRef.current(originalCard ? "Tarjeta actualizada" : "Tarjeta agregada", "success");
  }

  async function handleMigration() {
    try {
      await migrateLegacyEcoCards(userId, legacyCards);
      markEcoMigrationCompleted(userId);
      clearLegacyEcoCards();
      setLegacyCards([]);
      setMigrationVisible(false);
      await refreshCards([]);
      toastHandlerRef.current("Tus tarjetas de Botones Eco ya quedaron migradas.", "success");
    } catch (error) {
      toastHandlerRef.current(error.message || "No pudimos migrar tus tarjetas.", "error");
    }
  }

  async function handleReset() {
    if (!editingEnabled || !editUnlocked) {
      handleNewCard();
      return;
    }

    const confirmed = window.confirm(
      "¿Quieres devolver Botones Eco a sus tarjetas y textos originales? Se perderan tus personalizaciones y tarjetas nuevas.",
    );

    if (!confirmed) {
      return;
    }

    setResetting(true);

    try {
      await deleteAllRemoteEcoCards(userId);
      clearLegacyEcoCards();
      markEcoMigrationCompleted(userId);
      setLegacyCards([]);
      setMigrationVisible(false);
      setCards(getDefaultEcoCards());
      toastHandlerRef.current("Botones Eco volvio a sus valores originales.", "success");
    } catch (error) {
      toastHandlerRef.current(error.message || "No pudimos restablecer Botones Eco.", "error");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(123,223,246,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(184,181,255,0.10),transparent_28%)]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-[1760px] flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <header className="rounded-[30px] border border-white/10 bg-slate-950/70 p-4 shadow-glow sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <a
                href="#/"
                className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-full border border-cyan/25 bg-slate-950/70 shadow-[0_14px_32px_rgba(2,8,23,0.28)] transition hover:border-cyan/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/80"
                aria-label="Volver a Skelletary"
              >
                <img
                  src={getPublicAssetPath("imagenes de Skelly/skelletary-eco-avatar.png")}
                  alt="Skelletary"
                  className="h-full w-full object-contain"
                />
              </a>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
                  <ClipboardCheck className="h-4 w-4" />
                  Herramienta de flujo
                </div>
                <h1 className="mt-1 truncate font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Botones Eco
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                  Encuentra una instruccion de ecografia y copiala con un solo clic.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-2 text-xs font-medium text-emerald-200">
                {loading ? <Sparkles className="h-3.5 w-3.5 animate-pulse" /> : <Check className="h-3.5 w-3.5" />}
                {loading ? "Sincronizando" : "Listo para copiar"}
              </div>
              <a href="#/" className="button-secondary group">
                <ArrowLeft className="h-4 w-4" />
                Volver a plantillas
              </a>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Accesos clinicos</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white">Copia el punto de partida correcto</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Las tarjetas oficiales conservan sus imagenes originales. Tus cambios y tarjetas nuevas quedan asociados a tu cuenta.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400 lg:justify-end">
            <span><strong className="font-semibold text-white">{cards.length}</strong> tarjetas</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span><strong className="font-semibold text-white">{groupedCards.length}</strong> grupos visibles</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span><strong className="font-semibold text-white">{customCardCount}</strong> personalizadas</span>
          </div>
        </section>

        {migrationVisible ? (
          <section className="flex flex-col gap-4 rounded-[24px] border border-cyan/20 bg-cyan/[0.06] p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-white">Encontramos tarjetas locales de Botones Eco</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Puedes subir tus nombres, textos y tarjetas personalizadas a tu cuenta en la nube.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setMigrationVisible(false)} className="button-secondary">
                Ahora no
              </button>
              <button type="button" onClick={handleMigration} className="button-primary">
                Migrar tarjetas
              </button>
            </div>
          </section>
        ) : null}

        <section className="flex flex-col gap-3 rounded-[20px] border border-white/10 bg-slate-950/45 p-2.5 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Buscar tarjetas de Botones Eco</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan/80" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="field-shell !rounded-xl !pl-12 !pr-12 placeholder:text-slate-400/70"
              placeholder="Buscar por nombre, grupo o texto"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
                aria-label="Limpiar busqueda"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>

          <div className="flex flex-wrap gap-2 sm:flex-none">
            <button type="button" onClick={handleNewCard} className="button-primary !rounded-xl group">
              <Plus className="h-4 w-4" />
              Nueva tarjeta
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="button-secondary !rounded-xl px-3 group"
              title="Restaurar tarjetas y textos originales"
            >
              <RotateCcw className={`h-4 w-4 ${resetting ? "animate-spin" : ""}`} />
              Restablecer
            </button>
            {!editUnlocked ? (
              <button type="button" onClick={onUnlockClick} className="button-secondary !rounded-xl px-3 group">
                <LockKeyhole className="h-4 w-4" />
                Desbloquear edicion
              </button>
            ) : null}
          </div>
        </section>

        {loading && !cards.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" aria-label="Cargando tarjetas">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-[258px] animate-pulse rounded-[24px] border border-white/10 bg-white/[0.04]" />
            ))}
          </div>
        ) : groupedCards.length ? (
          <div className="space-y-7">
            {groupedCards.map((group) => (
              <section key={group.id} aria-labelledby={`eco-group-${group.id}`}>
                <div className="mb-4 flex items-center gap-3">
                  <h2 id={`eco-group-${group.id}`} className="font-display text-[17px] font-semibold tracking-tight text-white">
                    {group.title}
                  </h2>
                  <span className="h-px flex-1 bg-gradient-to-r from-cyan/25 to-transparent" />
                  <span className="text-xs font-medium text-slate-500">{group.cards.length}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {group.cards.map((card) => (
                    <BotonesEcoCard
                      key={card.id}
                      card={card}
                      copied={copiedId === card.id}
                      canEdit={editingEnabled}
                      onCopy={handleCopy}
                      onEdit={handleEdit}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-cyan/70" />
            <h2 className="mt-4 font-display text-xl font-semibold text-white">No encontramos tarjetas</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Prueba con otro termino o limpia la busqueda para volver a ver todos tus accesos.
            </p>
          </section>
        )}

        <footer className="flex flex-col gap-2 border-t border-white/10 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2">
            <span>Hecho con cariño para mi esposa</span>
            <span className="footer-heart-shell" aria-hidden="true">
              <Heart className="footer-heart-icon h-3.5 w-3.5 fill-current text-rose" />
            </span>
          </span>
          <span className="text-xs uppercase tracking-[0.16em] text-slate-600">Skelletary · Botones Eco</span>
        </footer>
      </main>

      <BotonesEcoEditorModal
        open={editorState.open}
        card={editorState.card}
        onClose={() => setEditorState({ open: false, card: null })}
        onSave={handleSave}
      />
    </div>
  );
}
