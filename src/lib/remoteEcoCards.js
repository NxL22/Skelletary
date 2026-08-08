import {
  getDefaultEcoCards,
  getMeaningfulLegacyEcoCards,
  mergeEcoCards,
  normalizeEcoCard,
  normalizeLegacyEcoCards,
} from "./botonesEco";
import { getSupabaseClient } from "./supabaseClient";

function toRemotePayload(userId, card) {
  return {
    user_id: userId,
    card_id: card.id,
    group_id: card.groupId,
    name: card.name,
    copy_text: card.copyText,
    visual_key: card.visualKey,
    created_at: card.createdAt || new Date().toISOString(),
    updated_at: card.updatedAt || new Date().toISOString(),
  };
}

function normalizeRemoteRow(row) {
  return normalizeEcoCard({
    id: row.card_id,
    groupId: row.group_id,
    name: row.name,
    copyText: row.copy_text,
    visualKey: row.visual_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isUserOwned: true,
  });
}

function getClientOrThrow() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  return supabase;
}

export async function fetchRemoteEcoCards(userId) {
  const supabase = getClientOrThrow();
  const { data, error } = await supabase
    .from("user_eco_cards")
    .select("card_id, group_id, name, copy_text, visual_key, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(normalizeRemoteRow).filter(Boolean);
}

export async function saveRemoteEcoCard(userId, card) {
  const supabase = getClientOrThrow();
  const normalizedCard = normalizeEcoCard(card);

  if (!normalizedCard) {
    throw new Error("La tarjeta no tiene un formato valido.");
  }

  const { error } = await supabase
    .from("user_eco_cards")
    .upsert(toRemotePayload(userId, normalizedCard), { onConflict: "user_id,card_id" });

  if (error) {
    throw error;
  }

  return { ...normalizedCard, isUserOwned: true };
}

export async function saveRemoteEcoCards(userId, cards = []) {
  if (!cards.length) {
    return [];
  }

  const supabase = getClientOrThrow();
  const payload = cards
    .map((card) => normalizeEcoCard(card))
    .filter(Boolean)
    .map((card) => toRemotePayload(userId, card));

  if (!payload.length) {
    return [];
  }

  const { error } = await supabase
    .from("user_eco_cards")
    .upsert(payload, { onConflict: "user_id,card_id" });

  if (error) {
    throw error;
  }

  return payload;
}

export async function deleteAllRemoteEcoCards(userId) {
  const supabase = getClientOrThrow();
  const { error } = await supabase.from("user_eco_cards").delete().eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function migrateLegacyEcoCards(userId, legacyCards = []) {
  const cardsToMigrate = getMeaningfulLegacyEcoCards(legacyCards);

  if (!cardsToMigrate.length) {
    return [];
  }

  await saveRemoteEcoCards(userId, cardsToMigrate);
  return cardsToMigrate;
}

export function buildEcoCardsFromSources({ remoteCards = [], legacyCards = [] } = {}) {
  // El remoto gana sobre el cache o la migracion local. Asi una cuenta que ya
  // fue migrada no vuelve a ver una personalizacion antigua por accidente.
  const normalizedLegacyCards = normalizeLegacyEcoCards(legacyCards);
  const normalizedRemoteCards = remoteCards.map((card) => normalizeEcoCard(card)).filter(Boolean);

  return mergeEcoCards(getDefaultEcoCards(), [
    ...normalizedLegacyCards,
    ...normalizedRemoteCards,
  ]);
}
