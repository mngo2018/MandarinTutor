"use client";

import { useEffect, useRef, useState } from "react";
import { LESSONS } from "@/lib/lessons";
import type {
  Audience,
  ChatMessage,
  Mode,
  TutorReply,
} from "@/lib/types";
import { TutorMessage } from "./TutorMessage";
import { ReviewPanel } from "./ReviewPanel";

type DisplayMsg =
  | { role: "user"; content: string }
  | { role: "assistant"; reply: TutorReply };

export function ChatTutor() {
  const [audience, setAudience] = useState<Audience>("adults");
  const [mode, setMode] = useState<Mode>("lesson");
  const [lessonId, setLessonId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<DisplayMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [offline, setOffline] = useState(false);

  const kid = audience === "kids";
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function send(
    history: DisplayMsg[],
    ctx?: { mode?: Mode; lessonId?: string | undefined },
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
          mode: ctx?.mode ?? mode,
          lessonId: ctx?.lessonId !== undefined ? ctx.lessonId : lessonId,
        }),
      });
      const data = await res.json();
      setOffline(Boolean(data.mock));
      setMessages((prev) => [...prev, { role: "assistant", reply: data.reply }]);
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
    void send(next);
  }

  function startLesson(id: string) {
    const lesson = LESSONS.find((l) => l.id === id);
    if (!lesson) return;
    setMode("lesson");
    setLessonId(id);
    const kickoff: DisplayMsg[] = [
      { role: "user", content: `Let's start the "${lesson.title}" lesson. Teach me the first word.` },
    ];
    setMessages(kickoff);
    void send(kickoff, { mode: "lesson", lessonId: id });
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
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LESSONS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => startLesson(l.id)}
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
            <div
              key={i}
              className="max-w-[85%] self-end rounded-2xl bg-rose-600 px-4 py-2 text-white"
              style={{ marginLeft: "auto" }}
            >
              {m.content}
            </div>
          ) : (
            <TutorMessage key={i} reply={m.reply} kid={kid} />
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
        <div className="mx-auto flex max-w-3xl gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={kid ? "Type or say hi! 你好" : "Type in English or 中文…"}
            className="flex-1 rounded-full border border-slate-300 px-4 py-2 outline-none focus:border-rose-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-full bg-rose-600 px-5 py-2 font-medium text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>

      {reviewOpen && <ReviewPanel onClose={() => setReviewOpen(false)} />}
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
