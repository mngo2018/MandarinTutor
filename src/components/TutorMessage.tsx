"use client";

import { useEffect, useState } from "react";
import { speak, canSpeak, prefetchSpeech } from "@/lib/speak";
import { addVocab } from "@/lib/srs";
import type { TutorReply } from "@/lib/types";

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

  useEffect(() => {
    if (autoPlay) speak(reply.hanzi);
    else prefetchSpeech(reply.hanzi);
  }, [reply.hanzi, autoPlay]);

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
        {canSpeak() && reply.hanzi && (
          <button
            type="button"
            aria-label="Play audio"
            onClick={() => speak(reply.hanzi)}
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
            {expectingActive && onSpeak && (
              <button
                type="button"
                onClick={onSpeak}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-white transition ${
                  recording ? "animate-pulse bg-red-600" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {recording ? "⏹ Stop" : "🎤 Say it"}
              </button>
            )}
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
