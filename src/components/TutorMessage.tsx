"use client";

import { useEffect, useState } from "react";
import { speak, canSpeak, prefetchSpeech } from "@/lib/speak";
import { addVocab } from "@/lib/srs";
import type { Pronunciation, TutorReply } from "@/lib/types";

const RATING_META: Record<
  Pronunciation["rating"],
  { label: string; cls: string }
> = {
  great: { label: "Great! 很棒", cls: "bg-emerald-100 text-emerald-800" },
  good: { label: "Good 不错", cls: "bg-amber-100 text-amber-800" },
  needs_work: { label: "Keep practicing 加油", cls: "bg-rose-100 text-rose-800" },
};

export function PronunciationCard({ pron }: { pron: Pronunciation }) {
  const meta = RATING_META[pron.rating];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.cls}`}
        >
          {meta.label}
        </span>
        <span className="text-xs text-slate-400">pronunciation</span>
      </div>
      {pron.tones.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pron.tones.map((t, i) => (
            <span
              key={i}
              title={t.note}
              className={`rounded-lg px-2 py-1 ${
                t.ok
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              <span className="font-medium">{t.char}</span> {t.pinyin}{" "}
              {t.ok ? "✓" : "⚠"}
            </span>
          ))}
        </div>
      )}
      {pron.tip && <p className="mt-2 text-slate-600">💡 {pron.tip}</p>}
    </div>
  );
}

export function TutorMessage({
  reply,
  kid,
  autoPlay = false,
  expectingActive = false,
  recording = false,
  onSpeak,
}: {
  reply: TutorReply;
  kid: boolean;
  autoPlay?: boolean;
  expectingActive?: boolean;
  recording?: boolean;
  onSpeak?: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const spoken = reply.speech?.trim() || reply.hanzi;
  const target = reply.expecting?.hanzi;

  useEffect(() => {
    if (autoPlay) speak(spoken);
    else prefetchSpeech(spoken);
  }, [spoken, autoPlay]);

  // Warm the pure-Mandarin target so its 🔊 plays instantly, even when the
  // coaching line above is bilingual.
  useEffect(() => {
    if (target) prefetchSpeech(target);
  }, [target]);

  return (
    <div
      className={`max-w-[85%] self-start rounded-2xl border p-4 shadow-sm ${
        kid
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          <p className={`font-semibold leading-snug ${kid ? "text-3xl" : "text-2xl"}`}>
            {reply.hanzi}
          </p>
          <p className="mt-1 text-base text-rose-600">{reply.pinyin}</p>
          <p className="mt-1 text-slate-600">{reply.english}</p>
        </div>
        {canSpeak() && spoken && (
          <button
            type="button"
            aria-label="Play audio"
            onClick={() => speak(spoken)}
            className="shrink-0 rounded-full bg-rose-100 p-2 text-xl transition hover:bg-rose-200"
          >
            🔊
          </button>
        )}
      </div>

      {reply.expecting && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
            🎤 Your turn — say:
          </p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <span className={`font-semibold ${kid ? "text-2xl" : "text-xl"}`}>
                {reply.expecting.hanzi}
              </span>{" "}
              <span className="text-rose-600">{reply.expecting.pinyin}</span>
              <span className="ml-2 text-sm text-slate-500">
                “{reply.expecting.english}”
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {canSpeak() && target && (
                <button
                  type="button"
                  aria-label="Hear it in Mandarin"
                  onClick={() => speak(target)}
                  className="rounded-full bg-white p-2 text-lg shadow-sm transition hover:bg-rose-100"
                >
                  🔊
                </button>
              )}
              {expectingActive && onSpeak && (
                <button
                  type="button"
                  onClick={onSpeak}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium text-white transition ${
                    recording ? "animate-pulse bg-red-600" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {recording ? "⏹ Stop" : "🎤 Say it"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {reply.notes && (
        <p className="mt-3 rounded-lg bg-black/5 px-3 py-2 text-sm text-slate-700">
          💡 {reply.notes}
        </p>
      )}

      {reply.vocab.length > 0 && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            {reply.vocab.map((v) => (
              <button
                key={v.hanzi}
                type="button"
                onClick={() => speak(v.hanzi)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm hover:bg-slate-50"
                title={`${v.pinyin} — ${v.english}`}
              >
                <span className="font-medium">{v.hanzi}</span>{" "}
                <span className="text-rose-600">{v.pinyin}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={saved}
            onClick={() => {
              addVocab(reply.vocab);
              setSaved(true);
            }}
            className="mt-2 text-sm font-medium text-emerald-700 disabled:text-slate-400"
          >
            {saved ? "✓ Saved to review" : "+ Save vocab to review"}
          </button>
        </div>
      )}
    </div>
  );
}
