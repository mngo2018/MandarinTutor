"use client";

import type { VocabItem } from "./types";

/**
 * Minimal spaced-repetition store backed by localStorage (Leitner boxes).
 * Box 0 = new/just-missed, higher box = longer interval. This is a scaffold
 * intended to be swapped for a real backend (Postgres) when accounts exist.
 */
export interface SrsCard extends VocabItem {
  box: number; // 0..5
  due: number; // epoch ms
  seen: number;
}

const KEY = "mandarin-tutor:srs";
const DAY = 24 * 60 * 60 * 1000;
const INTERVALS = [0, 1, 2, 4, 8, 16]; // days per box

function load(): Record<string, SrsCard> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, SrsCard>;
  } catch {
    return {};
  }
}

function save(cards: Record<string, SrsCard>) {
  localStorage.setItem(KEY, JSON.stringify(cards));
}

export function addVocab(items: VocabItem[]): void {
  const cards = load();
  let changed = false;
  for (const item of items) {
    if (!item.hanzi || cards[item.hanzi]) continue;
    cards[item.hanzi] = { ...item, box: 0, due: Date.now(), seen: 0 };
    changed = true;
  }
  if (changed) save(cards);
}

export function allCards(): SrsCard[] {
  return Object.values(load()).sort((a, b) => a.due - b.due);
}

export function dueCards(): SrsCard[] {
  const now = Date.now();
  return allCards().filter((c) => c.due <= now);
}

export function grade(hanzi: string, correct: boolean): void {
  const cards = load();
  const card = cards[hanzi];
  if (!card) return;
  card.box = correct ? Math.min(card.box + 1, INTERVALS.length - 1) : 0;
  card.due = Date.now() + INTERVALS[card.box] * DAY;
  card.seen += 1;
  save(cards);
}
