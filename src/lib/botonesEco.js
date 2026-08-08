import defaultEcoCards from "../data/defaultEcoCards.json";
import { getPublicAssetPath } from "./publicAssets";

export const ECO_GROUPS = [
  { id: "abdomen-pelvis", title: "Abdomen y pelvis" },
  { id: "cuello", title: "Cuello" },
  { id: "genitourinario", title: "Genitourinario" },
  { id: "doppler-vascular", title: "Doppler vascular" },
  { id: "musculoesqueletico", title: "Musculoesquelético" },
  { id: "partes-blandas", title: "Partes blandas" },
  { id: "mis-tarjetas", title: "Mis tarjetas" },
];

export const ECO_VISUAL_OPTIONS = [
  { value: "abdomen", label: "Abdomen" },
  { value: "abdomen-infantil", label: "Abdomen infantil" },
  { value: "renal", label: "Riñón" },
  { value: "pelvis", label: "Pelvis" },
  { value: "tiroides", label: "Tiroides" },
  { value: "genitourinario", label: "Genitourinario" },
  { value: "doppler", label: "Doppler" },
  { value: "doppler-cuello", label: "Doppler carotídeo" },
  { value: "vascular", label: "Vascular" },
  { value: "hombro", label: "Hombro" },
  { value: "mano", label: "Mano o muñeca" },
  { value: "pie", label: "Pie" },
  { value: "extremidad", label: "Extremidad" },
  { value: "cara", label: "Cara" },
  { value: "torax", label: "Tórax" },
  { value: "partes-blandas", label: "Partes blandas" },
  { value: "general", label: "General" },
];

const DEFAULT_ECO_CARD_IDS = new Set(defaultEcoCards.map((card) => card.id));
const GROUP_IDS = new Set(ECO_GROUPS.map((group) => group.id));
const REMOVED_LEGACY_IDS = new Set(["eco-muslo"]);
const REMOVED_LEGACY_NAMES = new Set(["eco muslo", "eco gluteo"]);

function normalizeSearchText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeLegacyName(value = "") {
  return normalizeSearchText(value);
}

function slugify(value = "") {
  return normalizeSearchText(value).replace(/\s+/g, "-");
}

function cloneCard(card) {
  return { ...card };
}

export function inferEcoVisualKey(name = "", groupId = "") {
  const normalizedName = normalizeSearchText(name);

  if (normalizedName.includes("doppler carotideo")) return "doppler-cuello";
  if (normalizedName.includes("doppler")) {
    return normalizedName.includes("arterial") || normalizedName.includes("venoso")
      ? "vascular"
      : "doppler";
  }
  if (normalizedName.includes("tiroides")) return "tiroides";
  if (normalizedName.includes("renal")) return "renal";
  if (normalizedName.includes("abdomen")) {
    return normalizedName.includes("infantil") ? "abdomen-infantil" : "abdomen";
  }
  if (normalizedName.includes("pelvis") || normalizedName.includes("pelviana")) return "pelvis";
  if (normalizedName.includes("hombro")) return "hombro";
  if (normalizedName.includes("muneca") || normalizedName.includes("mano")) return "mano";
  if (normalizedName.includes("pie")) return "pie";
  if (normalizedName.includes("cara")) return "cara";
  if (normalizedName.includes("torac")) return "torax";
  if (normalizedName.includes("partes blandas")) return "partes-blandas";
  if (groupId === "doppler-vascular") return "vascular";
  if (groupId === "musculoesqueletico") return "extremidad";
  if (groupId === "genitourinario") return "genitourinario";
  if (groupId === "cuello") return "tiroides";
  if (groupId === "abdomen-pelvis") return "abdomen";
  if (groupId === "partes-blandas") return "partes-blandas";

  return "general";
}

export function normalizeEcoCard(card = {}, fallback = {}) {
  const id = String(card.id || card.cardId || fallback.id || "").trim();
  const name = String(card.name || card.nombre || fallback.name || "").trim();
  const copyText = String(card.copyText || card.textoCopiado || fallback.copyText || "").trim();
  const groupId = GROUP_IDS.has(card.groupId || card.grupo)
    ? card.groupId || card.grupo
    : GROUP_IDS.has(fallback.groupId)
      ? fallback.groupId
      : "mis-tarjetas";

  if (!id || !name || !copyText) {
    return null;
  }

  return {
    id,
    groupId,
    name,
    copyText,
    visualKey: card.visualKey || fallback.visualKey || inferEcoVisualKey(name, groupId),
    createdAt: card.createdAt || card.created_at || fallback.createdAt || null,
    updatedAt: card.updatedAt || card.updated_at || fallback.updatedAt || null,
    isDefault: Boolean(fallback.isDefault ?? card.isDefault),
    isUserOwned: Boolean(card.isUserOwned ?? card.user_id),
  };
}

export function getDefaultEcoCards() {
  return defaultEcoCards.map((card) =>
    normalizeEcoCard({ ...card, isDefault: true }, { ...card, isDefault: true }),
  );
}

export function mergeEcoCards(defaultCards = getDefaultEcoCards(), personalCards = []) {
  const defaults = defaultCards.filter(Boolean).map((card) => ({
    ...card,
    isDefault: true,
    isUserOwned: false,
  }));
  const defaultsById = new Map(defaults.map((card) => [card.id, card]));
  const mergedById = new Map(defaults.map((card) => [card.id, card]));

  personalCards.forEach((rawCard) => {
    const baseCard = defaultsById.get(rawCard.id) || null;
    const card = normalizeEcoCard(rawCard, baseCard || {});

    if (!card) {
      return;
    }

    mergedById.set(card.id, {
      ...(baseCard || {}),
      ...card,
      isDefault: Boolean(baseCard),
      isUserOwned: true,
    });
  });

  const orderedDefaults = defaults.map((card) => mergedById.get(card.id));
  const personalOnly = [...mergedById.values()]
    .filter((card) => !defaultsById.has(card.id))
    .sort((first, second) => {
      const firstDate = first.updatedAt || first.createdAt || "";
      const secondDate = second.updatedAt || second.createdAt || "";
      return secondDate.localeCompare(firstDate) || first.name.localeCompare(second.name, "es");
    });

  return [...orderedDefaults, ...personalOnly];
}

export function normalizeLegacyEcoCards(legacyCards = []) {
  if (!Array.isArray(legacyCards)) {
    return [];
  }

  const defaultsById = new Map(getDefaultEcoCards().map((card) => [card.id, card]));

  return legacyCards
    .map((legacyCard) => {
      const baseCard = defaultsById.get(legacyCard?.id);
      return normalizeEcoCard(
        {
          id: legacyCard?.id,
          groupId: legacyCard?.groupId || legacyCard?.grupo,
          name: legacyCard?.name || legacyCard?.nombre,
          copyText: legacyCard?.copyText || legacyCard?.textoCopiado,
          visualKey: legacyCard?.visualKey,
          isUserOwned: true,
        },
        baseCard || {},
      );
    })
    .filter(Boolean)
    .filter((card) => {
      const normalizedName = normalizeLegacyName(card.name);
      return !REMOVED_LEGACY_IDS.has(card.id) && !REMOVED_LEGACY_NAMES.has(normalizedName);
    });
}

export function getMeaningfulLegacyEcoCards(legacyCards = []) {
  const defaultsById = new Map(getDefaultEcoCards().map((card) => [card.id, card]));

  return normalizeLegacyEcoCards(legacyCards).filter((card) => {
    const defaultCard = defaultsById.get(card.id);

    if (!defaultCard) {
      return true;
    }

    return (
      card.groupId !== defaultCard.groupId ||
      card.name !== defaultCard.name ||
      card.copyText !== defaultCard.copyText
    );
  });
}

export function filterEcoCards(cards = [], query = "") {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return cards;
  }

  return cards.filter((card) =>
    normalizeSearchText(`${card.name} ${card.groupId} ${card.copyText}`).includes(normalizedQuery),
  );
}

export function groupEcoCards(cards = []) {
  return ECO_GROUPS.map((group) => ({
    ...group,
    cards: cards.filter((card) => card.groupId === group.id),
  })).filter((group) => group.cards.length > 0);
}

export function getEcoCardImagePath(card) {
  if (!card?.isDefault || !DEFAULT_ECO_CARD_IDS.has(card.id)) {
    return null;
  }

  return getPublicAssetPath(`botones-eco/tarjetas/${card.id}.png`);
}

export function createEcoCard(existingCards = [], form = {}) {
  const baseId = slugify(form.name) || "tarjeta";
  let id = `tarjeta-${baseId}`;
  let suffix = 2;
  const existingIds = new Set(existingCards.map((card) => card.id));

  while (existingIds.has(id)) {
    id = `tarjeta-${baseId}-${suffix}`;
    suffix += 1;
  }

  const now = new Date().toISOString();
  return normalizeEcoCard({
    id,
    groupId: form.groupId || "mis-tarjetas",
    name: form.name,
    copyText: form.copyText,
    visualKey: form.visualKey || inferEcoVisualKey(form.name, form.groupId),
    createdAt: now,
    updatedAt: now,
    isUserOwned: true,
  });
}

export function updateEcoCard(card, form = {}) {
  const now = new Date().toISOString();
  return normalizeEcoCard({
    ...card,
    groupId: form.groupId || "mis-tarjetas",
    name: form.name,
    copyText: form.copyText,
    visualKey: form.visualKey || inferEcoVisualKey(form.name, form.groupId),
    updatedAt: now,
    isUserOwned: true,
  }, card);
}

export function getEcoCardGroupTitle(groupId) {
  return ECO_GROUPS.find((group) => group.id === groupId)?.title || "Mis tarjetas";
}
