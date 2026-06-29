import { pinyin } from "pinyin-pro";
import { getLesson } from "./lessons";
import type {
  Audience,
  ChatMessage,
  Lesson,
  Mode,
  TutorReply,
  VocabItem,
} from "./types";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export function hasLLM(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Ensure a vocab item has pinyin; derive it from hanzi when missing. */
function withPinyin(item: Partial<VocabItem> & { hanzi: string }): VocabItem {
  return {
    hanzi: item.hanzi,
    pinyin: item.pinyin?.trim() || toPinyin(item.hanzi),
    english: item.english ?? "",
  };
}

export function toPinyin(hanzi: string): string {
  return pinyin(hanzi, { toneType: "symbol", type: "string" });
}

function buildSystemPrompt(
  audience: Audience,
  mode: Mode,
  lesson: Lesson | undefined,
): string {
  const tone =
    audience === "kids"
      ? "You are teaching a young child. Be warm, playful, and very encouraging. Use short, simple sentences and lots of praise. Keep new vocabulary to 1-2 words at a time."
      : "You are teaching an adult beginner. Be friendly, clear, and concise. You can explain grammar briefly when useful.";

  const focus =
    mode === "lesson" && lesson
      ? `The current lesson is "${lesson.title}". Focus on this vocabulary: ${lesson.vocab
          .map((v) => `${v.hanzi} (${v.pinyin}) = ${v.english}`)
          .join("; ")}. Introduce items gradually and quiz the learner.`
      : "This is free conversation. Keep Chinese at a beginner level and gently correct mistakes.";

  return [
    "You are a friendly Mandarin Chinese tutor.",
    tone,
    focus,
    "Always reply with simplified Chinese plus pinyin and an English translation.",
    "Respond ONLY with a JSON object matching this TypeScript type:",
    "{ hanzi: string; pinyin: string; english: string; notes?: string; vocab: { hanzi: string; pinyin: string; english: string }[] }",
    "`hanzi` is your spoken reply in Chinese. `pinyin` is its pinyin with tone marks. `english` is the translation.",
    "`notes` is a short tip or encouragement in English. `vocab` lists the key words from your reply worth reviewing.",
    "Do not wrap the JSON in markdown code fences.",
  ].join("\n");
}

async function callLLM(
  messages: ChatMessage[],
  audience: Audience,
  mode: Mode,
  lesson: Lesson | undefined,
): Promise<TutorReply> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildSystemPrompt(audience, mode, lesson) },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Partial<TutorReply>;

  const hanzi = parsed.hanzi ?? "";
  return {
    hanzi,
    pinyin: parsed.pinyin?.trim() || toPinyin(hanzi),
    english: parsed.english ?? "",
    notes: parsed.notes,
    vocab: (parsed.vocab ?? []).map(withPinyin),
  };
}

/** Offline tutor used when no OPENAI_API_KEY is configured. */
function mockReply(
  messages: ChatMessage[],
  audience: Audience,
  mode: Mode,
  lesson: Lesson | undefined,
): TutorReply {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const turn = messages.filter((m) => m.role === "user").length;
  const kid = audience === "kids";

  if (mode === "lesson" && lesson) {
    const item = lesson.vocab[(turn - 1 + lesson.vocab.length) % lesson.vocab.length];
    const praise = kid ? "太棒了！" : "很好！";
    const praiseEn = kid ? "Awesome!" : "Very good!";
    return {
      hanzi: `${praise} ${item.hanzi}`,
      pinyin: `${toPinyin(praise)} ${item.pinyin}`,
      english: `${praiseEn} Let's learn "${item.english}".`,
      notes: kid
        ? `Try saying it out loud! Tap the 🔊 to hear "${item.english}".`
        : `"${item.hanzi}" means "${item.english}". Listen with 🔊 and repeat to practice the tones.`,
      vocab: [item],
    };
  }

  // Free conversation fallback.
  if (turn <= 1) {
    return {
      hanzi: "你好！我们一起学中文吧。",
      pinyin: "nǐ hǎo! wǒ men yì qǐ xué zhōng wén ba.",
      english: "Hello! Let's learn Chinese together.",
      notes: kid
        ? "Say 你好 (nǐ hǎo) back to me!"
        : "Type anything — even in English — and I'll help you say it in Chinese.",
      vocab: [
        { hanzi: "你好", pinyin: "nǐ hǎo", english: "hello" },
        { hanzi: "中文", pinyin: "zhōng wén", english: "Chinese (language)" },
      ],
    };
  }

  return {
    hanzi: "很好！再说一次。",
    pinyin: "hěn hǎo! zài shuō yí cì.",
    english: `Nice! You said: "${lastUser?.content ?? ""}". Say it once more.`,
    notes:
      "(Offline practice mode — add an OPENAI_API_KEY for full conversational replies.)",
    vocab: [{ hanzi: "再说一次", pinyin: "zài shuō yí cì", english: "say it again" }],
  };
}

export async function generateReply(
  messages: ChatMessage[],
  audience: Audience,
  mode: Mode,
  lessonId: string | undefined,
): Promise<{ reply: TutorReply; mock: boolean }> {
  const lesson = getLesson(lessonId);
  if (hasLLM()) {
    try {
      return { reply: await callLLM(messages, audience, mode, lesson), mock: false };
    } catch (err) {
      console.error("LLM call failed, falling back to offline tutor:", err);
    }
  }
  return { reply: mockReply(messages, audience, mode, lesson), mock: true };
}
