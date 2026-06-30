"use client";

import { useState } from "react";
import { speak } from "@/lib/speak";
import { dueCards, grade, type SrsCard } from "@/lib/srs";

export function ReviewPanel({ onClose }: { onClose: () => void }) {
  const [queue, setQueue] = useState<SrsCard[]>(() => dueCards());
  const [flipped, setFlipped] = useState(false);

  const card = queue[0];

  function answer(correct: boolean) {
    if (!card) return;
    grade(card.hanzi, correct);
    setFlipped(false);
    setQueue((q) => q.slice(1));
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Review</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {!card ? (
          <p className="py-10 text-center text-slate-500">
            🎉 Nothing due right now. Save vocab from the chat and come back later!
          </p>
        ) : (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                speak(card.hanzi);
                setFlipped(true);
              }}
              className="flex min-h-40 w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6"
            >
              <span className="text-5xl font-semibold">{card.hanzi}</span>
              {flipped && (
                <span className="mt-3 text-center">
                  <span className="block text-lg text-rose-600">{card.pinyin}</span>
                  <span className="block text-slate-600">{card.english}</span>
                </span>
              )}
            </button>
            <p className="mt-2 text-center text-sm text-slate-400">
              {flipped ? "Did you get it?" : "Tap the card to reveal & hear it"}
            </p>

            {flipped && (
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => answer(false)}
                  className="flex-1 rounded-xl bg-rose-100 py-2 font-medium text-rose-700 hover:bg-rose-200"
                >
                  Again
                </button>
                <button
                  type="button"
                  onClick={() => answer(true)}
                  className="flex-1 rounded-xl bg-emerald-100 py-2 font-medium text-emerald-700 hover:bg-emerald-200"
                >
                  Got it
                </button>
              </div>
            )}
            <p className="mt-3 text-center text-xs text-slate-400">
              {queue.length} card{queue.length === 1 ? "" : "s"} left
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
