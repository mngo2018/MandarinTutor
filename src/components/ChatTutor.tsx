"use client";

import { useEffect, useRef, useState } from "react";
import { LESSONS } from "@/lib/lessons";
import type {
  Audience,
  ChatMessage,
  Lesson,
  Mode,
  Pronunciation,
  TeachingStyle,
  TutorReply,
  VocabItem,
} from "@/lib/types";
import { blobToWav } from "@/lib/wav";
import { TutorMessage, PronunciationCard } from "./TutorMessage";
import { ReviewPanel } from "./ReviewPanel";

type DisplayMsg =
  | { role: "user"; content: string; pron?: Pronunciation }
  | { role: "assistant"; reply: TutorReply; autoPlay?: boolean };

const nowMs = (): number => Date.now();

interface LessonProgress {
  done: number;
  total: number;
  currentHanzi?: string;
  complete: boolean;
  doneSet: Set<string>;
  masteredCount: number;
}

/**
 * Derive lesson progress from the conversation. The tutor introduces vocab in
 * order and sets `expecting` to the phrase it currently wants spoken, so the
 * position of the latest target tells us how far along the learner is.
 */
function computeLessonProgress(
  lesson: Lesson,
  messages: DisplayMsg[],
): LessonProgress {
  const vocab = lesson.vocab;
  const total = vocab.length;
  const vocabSet = new Set(vocab.map((v) => v.hanzi));

  const assistant = messages.filter(
    (m): m is Extract<DisplayMsg, { role: "assistant" }> =>
      m.role === "assistant",
  );

  const last = assistant[assistant.length - 1];
  const cur = last?.reply.expecting?.hanzi;

  // Vocab phrases the tutor has cued at some point. Scenarios may also cue
  // custom phrases not in the list — those simply don't count toward the dots.
  const asked = new Set<string>();
  for (const m of assistant) {
    const e = m.reply.expecting?.hanzi;
    if (e && vocabSet.has(e)) asked.add(e);
  }

  // Complete only when the tutor has stopped asking for anything (recap / goal
  // reached) — never just because the current cue isn't a listed vocab item.
  const complete = assistant.length > 0 && !cur;

  const doneSet = complete
    ? new Set(vocabSet)
    : new Set([...asked].filter((h) => h !== cur));
  const done = complete ? total : doneSet.size;

  const masteredCount = Math.min(
    total,
    messages.filter(
      (m) => m.role === "user" && m.pron && m.pron.rating !== "needs_work",
    ).length,
  );

  return { done, total, currentHanzi: cur, complete, doneSet, masteredCount };
}

export function ChatTutor() {
  const [audience, setAudience] = useState<Audience>("adults");
  const [style, setStyle] = useState<TeachingStyle>("bilingual");
  const [mode, setMode] = useState<Mode>("lesson");
  const [lessonId, setLessonId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<DisplayMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [offline, setOffline] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const kid = audience === "kids";
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<DisplayMsg[]>(messages);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRef = useRef(false);
  const pressStartRef = useRef(0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (maxTimerRef.current !== null) clearTimeout(maxTimerRef.current);
      void audioCtxRef.current?.close();
    };
  }, []);

  async function send(
    history: DisplayMsg[],
    ctx?: { mode?: Mode; lessonId?: string | undefined },
    opts?: { autoPlay?: boolean },
  ) {
    const apiMessages: ChatMessage[] = history.map((m) =>
      m.role === "user"
        ? { role: "user", content: m.content }
        : { role: "assistant", content: m.reply.hanzi },
    );

    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          audience,
          style,
          mode: ctx?.mode ?? mode,
          lessonId: ctx?.lessonId !== undefined ? ctx.lessonId : lessonId,
        }),
      });
      const data = await res.json();
      setOffline(Boolean(data.mock));
      setMessages((prev) => [
        ...prev,
        { role: "assistant", reply: data.reply, autoPlay: opts?.autoPlay },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          reply: {
            hanzi: "对不起",
            pinyin: "duì bù qǐ",
            english: "Sorry — something went wrong. Please try again.",
            vocab: [],
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const next: DisplayMsg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    void send(next, undefined, { autoPlay: mode === "lesson" });
  }

  function cleanupAudioMonitor() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (maxTimerRef.current !== null) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }

  // Auto-stop on silence: watch the mic level and stop ~1.5s after the speaker
  // finishes (only once they've actually started talking).
  function monitorSilence(stream: MediaStream) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const SILENCE_MS = 1500;
    const THRESHOLD = 0.02; // RMS; speech is well above ambient noise
    let lastLoud = nowMs();
    let spoke = false;

    const tick = () => {
      if (!audioCtxRef.current) return;
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      const now = nowMs();
      if (rms > THRESHOLD) {
        lastLoud = now;
        spoke = true;
      }
      if (spoke && now - lastLoud > SILENCE_MS) {
        stopRecording();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  async function startRecording() {
    if (recording || transcribing || loading) return;
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        cleanupAudioMonitor();
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        void transcribeAndSend(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      monitorSilence(stream);
      // Safety cap so a forgotten recording can't run forever.
      maxTimerRef.current = setTimeout(() => stopRecording(), 20000);
    } catch {
      setMicError("Microphone access was blocked. Allow it in your browser to speak.");
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  // Press-and-hold = push-to-talk (release to send). Quick tap = hands-free
  // (record until you stop speaking). A second tap stops an active recording.
  function micDown() {
    if (transcribing || loading) return;
    if (recording) {
      stopRecording();
      return;
    }
    heldRef.current = true;
    pressStartRef.current = nowMs();
    void startRecording();
  }

  function micUp() {
    if (!heldRef.current) return;
    heldRef.current = false;
    const held = nowMs() - pressStartRef.current;
    if (held >= 400) stopRecording();
  }

  function activeTarget(): VocabItem | undefined {
    const msgs = messagesRef.current;
    const last = msgs[msgs.length - 1];
    return last && last.role === "assistant" ? last.reply.expecting : undefined;
  }

  async function transcribeOnly(blob: Blob): Promise<string> {
    const ext = blob.type.includes("mp4")
      ? "mp4"
      : blob.type.includes("ogg")
        ? "ogg"
        : "webm";
    const form = new FormData();
    form.append("audio", blob, `speech.${ext}`);
    const res = await fetch("/api/transcribe", { method: "POST", body: form });
    if (!res.ok) return "";
    const data = await res.json();
    return (data.text ?? "").trim();
  }

  async function transcribeAndSend(blob: Blob) {
    if (!blob.size || loading) return;
    setTranscribing(true);
    try {
      const target = activeTarget();
      let transcript = "";
      let pron: Pronunciation | undefined;

      // In a guided lesson with a target phrase, analyze pronunciation/tones
      // from the actual audio. Falls back to plain transcription on failure.
      if (target) {
        try {
          const wav = await blobToWav(blob);
          const form = new FormData();
          form.append("audio", wav, "speech.wav");
          form.append("hanzi", target.hanzi);
          form.append("pinyin", target.pinyin);
          form.append("english", target.english);
          const res = await fetch("/api/pronunciation", {
            method: "POST",
            body: form,
          });
          if (res.ok) {
            pron = (await res.json()) as Pronunciation;
            transcript = (pron.transcript ?? "").trim();
          }
        } catch {
          // fall through to plain transcription
        }
      }

      if (!transcript) transcript = await transcribeOnly(blob);
      if (!transcript) {
        setMicError("Didn't catch that — try speaking again.");
        return;
      }

      const next: DisplayMsg[] = [
        ...messagesRef.current,
        { role: "user", content: transcript, pron },
      ];
      setMessages(next);
      void send(next, undefined, { autoPlay: true });
    } catch {
      setMicError("Transcription failed — please try again.");
    } finally {
      setTranscribing(false);
    }
  }

  function startLesson(id: string) {
    const lesson = LESSONS.find((l) => l.id === id);
    if (!lesson) return;
    setMode("lesson");
    setLessonId(id);
    const content =
      lesson.kind === "scenario"
        ? `Let's start the "${lesson.title}" roleplay. Set the scene and begin in character — give me my first line to say.`
        : `Let's start the "${lesson.title}" lesson. Teach me the first word.`;
    const kickoff: DisplayMsg[] = [{ role: "user", content }];
    setMessages(kickoff);
    void send(kickoff, { mode: "lesson", lessonId: id }, { autoPlay: true });
  }

  function startFree() {
    setMode("free");
    setLessonId(undefined);
    const kickoff: DisplayMsg[] = [
      { role: "user", content: "Hi! I'd like to practice some Mandarin conversation." },
    ];
    setMessages(kickoff);
    void send(kickoff, { mode: "free", lessonId: undefined });
  }

  const currentLesson =
    mode === "lesson" && lessonId
      ? LESSONS.find((l) => l.id === lessonId)
      : undefined;
  const progress = currentLesson
    ? computeLessonProgress(currentLesson, messages)
    : null;

  return (
    <div
      className={`flex h-full flex-col ${
        kid ? "bg-gradient-to-b from-sky-50 to-amber-50" : "bg-slate-50"
      }`}
    >
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐼</span>
            <h1 className="text-lg font-bold">
              Mandarin Tutor
              <span className="ml-2 align-middle text-base font-normal text-slate-400">
                你的中文老师
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Toggle
              value={audience}
              onChange={(v) => setAudience(v as Audience)}
              options={[
                { value: "kids", label: "🧒 Kids" },
                { value: "adults", label: "🧑 Adults" },
              ]}
            />
            <Toggle
              value={style}
              onChange={(v) => setStyle(v as TeachingStyle)}
              options={[
                { value: "immersion", label: "🇨🇳 Immersion" },
                { value: "bilingual", label: "🌐 Bilingual" },
              ]}
            />
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              📚 Review
            </button>
          </div>
        </div>
      </header>

      {/* Mode + lesson picker */}
      <div className="mx-auto w-full max-w-3xl px-4 pt-3">
        <Toggle
          value={mode}
          onChange={(v) => {
            const m = v as Mode;
            setMode(m);
            if (m === "free") startFree();
            else {
              setLessonId(undefined);
              setMessages([]);
            }
          }}
          options={[
            { value: "lesson", label: "📖 Lessons" },
            { value: "free", label: "💬 Free chat" },
          ]}
        />

        {mode === "lesson" && (
          <div className="mt-3 space-y-3">
            <LessonGrid
              label="📚 Basics"
              lessons={LESSONS.filter((l) => (l.kind ?? "vocab") === "vocab")}
              lessonId={lessonId}
              onPick={startLesson}
            />
            <LessonGrid
              label={kid ? "🎒 Story quests" : "🗺️ Real-life scenarios"}
              lessons={LESSONS.filter(
                (l) => l.kind === "scenario" && l.track === audience,
              )}
              lessonId={lessonId}
              onPick={startLesson}
            />
          </div>
        )}

        {currentLesson && progress && messages.length > 0 && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">
                {currentLesson.emoji} {currentLesson.title}
              </span>
              <span className="text-slate-500">
                {Math.min(progress.done, progress.total)} / {progress.total}
              </span>
            </div>
            {currentLesson.scenario && (
              <p className="mt-1.5 text-xs text-slate-500">
                🎭 {currentLesson.scenario.intro}{" "}
                <span className="text-slate-400">
                  (Goal: {currentLesson.scenario.goal})
                </span>
              </p>
            )}
            <div className="mt-2 flex gap-1.5">
              {currentLesson.vocab.map((v) => {
                const done = progress.doneSet.has(v.hanzi);
                const current = !progress.complete && progress.currentHanzi === v.hanzi;
                return (
                  <span
                    key={v.hanzi}
                    title={`${v.hanzi} (${v.pinyin})`}
                    className={`h-2 flex-1 rounded-full transition ${
                      done
                        ? "bg-emerald-500"
                        : current
                          ? "bg-rose-400"
                          : "bg-slate-200"
                    }`}
                  />
                );
              })}
            </div>
            {progress.complete && (
              <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                🎉 {currentLesson.kind === "scenario" ? "Scenario" : "Lesson"}{" "}
                complete! You practiced all {progress.total} phrases
                {progress.masteredCount > 0 &&
                  ` and nailed ${progress.masteredCount} on pronunciation`}
                . Pick another lesson above or open 📚 Review to keep them fresh.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat */}
      <div ref={scrollRef} className="mx-auto w-full max-w-3xl flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="mt-10 text-center text-slate-400">
            {mode === "lesson"
              ? "Pick a lesson above to begin 👆"
              : "Say hello to start practicing 👋"}
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto flex max-w-[85%] flex-col items-end gap-1">
              <div className="rounded-2xl bg-rose-600 px-4 py-2 text-white">
                {m.content}
              </div>
              {m.pron && <PronunciationCard pron={m.pron} />}
            </div>
          ) : (
            <TutorMessage
              key={i}
              reply={m.reply}
              kid={kid}
              autoPlay={Boolean(m.autoPlay)}
              expectingActive={i === messages.length - 1 && !loading && !transcribing}
              recording={recording}
              onMicDown={micDown}
              onMicUp={micUp}
            />
          ),
        )}
        {loading && (
          <div className="max-w-[85%] self-start rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-400">
            老师在想… (thinking)
          </div>
        )}
      </div>

      {offline && (
        <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-800">
          Offline practice mode — set an <code>OPENAI_API_KEY</code> for full AI conversations.
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200 bg-white p-3"
      >
        <div className="mx-auto w-full max-w-3xl">
          {micError && (
            <p className="mb-2 text-center text-xs text-rose-600">{micError}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onPointerDown={micDown}
              onPointerUp={micUp}
              onPointerLeave={micUp}
              onPointerCancel={micUp}
              onContextMenu={(e) => e.preventDefault()}
              disabled={transcribing || loading}
              aria-label={recording ? "Stop recording" : "Hold to talk"}
              title={recording ? "Release / tap to stop" : "Hold to talk, or tap to speak"}
              className={`shrink-0 touch-none select-none rounded-full px-4 py-2 text-lg font-medium transition disabled:opacity-40 ${
                recording
                  ? "animate-pulse bg-red-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {recording ? "⏹" : transcribing ? "…" : "🎤"}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                recording
                  ? "Listening… I'll stop when you pause"
                  : transcribing
                    ? "Transcribing…"
                    : kid
                      ? "Type, or hold 🎤 to talk! 你好"
                      : "Type, or hold 🎤 to talk (auto-stops)"
              }
              disabled={recording || transcribing}
              className="flex-1 rounded-full border border-slate-300 px-4 py-2 outline-none focus:border-rose-400 disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-full bg-rose-600 px-5 py-2 font-medium text-white disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      </form>

      {reviewOpen && <ReviewPanel onClose={() => setReviewOpen(false)} />}
    </div>
  );
}

function LessonGrid({
  label,
  lessons,
  lessonId,
  onPick,
}: {
  label: string;
  lessons: Lesson[];
  lessonId: string | undefined;
  onPick: (id: string) => void;
}) {
  if (lessons.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {lessons.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => onPick(l.id)}
            className={`rounded-xl border p-3 text-left transition hover:shadow ${
              lessonId === l.id
                ? "border-rose-400 bg-rose-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="text-xl">{l.emoji}</div>
            <div className="font-medium">{l.title}</div>
            <div className="text-xs text-slate-500">{l.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-full bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition ${
            value === o.value
              ? "bg-white text-slate-900 shadow"
              : "text-slate-500"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
