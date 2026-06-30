import { pinyin } from "pinyin-pro";
import { getLesson } from "./lessons";
import type {
  Audience,
  ChatMessage,
  Lesson,
  Mode,
  TeachingStyle,
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
  style: TeachingStyle,
): string {
  const styleGuide =
    style === "bilingual"
      ? "TEACHING STYLE — BILINGUAL: Coach like a bilingual teacher. Give your instructions and explanations mainly in English, and weave in the Mandarin words/phrases you want the learner to hear and repeat. Set `speech` to a natural spoken line that mixes your English guidance with the Mandarin phrase, e.g. \"Let's learn 'hello'. In Chinese it's 你好. Now you try: 你好.\" Keep English generous so a beginner always follows along."
      : "TEACHING STYLE — IMMERSION: Teach mostly in Mandarin, using simple Chinese the learner can follow, with only a tiny English gloss when truly needed. Set `speech` to the Mandarin you want spoken aloud (mostly Chinese).";
  const tone =
    audience === "kids"
      ? "You are teaching a young child. Be warm, playful, and very encouraging. Use short, simple sentences and lots of praise. Keep new vocabulary to 1-2 words at a time."
      : "You are teaching an adult beginner. Be friendly, clear, and concise. You can explain grammar briefly when useful.";

  const focus =
    mode === "lesson" && lesson
      ? [
          `You are leading a guided lesson titled "${lesson.title}". Take charge and drive it step by step.`,
          `Lesson vocabulary (teach these in order): ${lesson.vocab
            .map((v) => `${v.hanzi} (${v.pinyin}) = ${v.english}`)
            .join("; ")}.`,
          "Teach ONE item per turn. For each item: briefly introduce it (meaning + when to use it), then ask the learner to say it out loud, and set the `expecting` field to exactly that item so the app can prompt them to speak.",
          "On the learner's next turn they will send a transcription of what they said. Evaluate it: if it matches the expected phrase, praise them and move on to the NEXT item (introduce it and set `expecting` to the new item). If it is wrong or missing, gently correct, model it again, and set `expecting` to the SAME item to retry.",
          "Keep each turn short — one item at a time. After all items have been practiced, give a short recap and a sentence of encouragement, and do not set `expecting`.",
        ].join(" ")
      : "This is free conversation. Keep Chinese at a beginner level and gently correct mistakes. Only set `expecting` if you explicitly invite the learner to repeat a specific phrase.";

  return [
    "You are a friendly, proactive Mandarin Chinese tutor who leads the session.",
    tone,
    styleGuide,
    focus,
    "Always reply with simplified Chinese plus pinyin and an English translation.",
    "Respond ONLY with a JSON object matching this TypeScript type:",
    "{ hanzi: string; pinyin: string; english: string; speech?: string; notes?: string; vocab: { hanzi: string; pinyin: string; english: string }[]; expecting?: { hanzi: string; pinyin: string; english: string } }",
    "`hanzi` is the Chinese sentence(s) of your reply. `pinyin` is its pinyin with tone marks. `english` is the translation.",
    "`speech` is the exact line to read aloud to the learner, following the TEACHING STYLE above (bilingual = mixed English+Mandarin; immersion = mostly Mandarin).",
    "`notes` is a short tip or encouragement in English. `vocab` lists the key words from your reply worth reviewing.",
    "`expecting` is the single phrase you are asking the learner to say aloud right now (omit it when you are not asking them to speak).",
    "Do not wrap the JSON in markdown code fences.",
  ].join("\n");
}

async function callLLM(
  messages: ChatMessage[],
  audience: Audience,
  mode: Mode,
  lesson: Lesson | undefined,
  style: TeachingStyle,
): Promise<TutorReply> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildSystemPrompt(audience, mode, lesson, style) },
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
    speech: parsed.speech?.trim() || undefined,
    notes: parsed.notes,
    vocab: (parsed.vocab ?? []).map(withPinyin),
    expecting:
      parsed.expecting && parsed.expecting.hanzi
        ? withPinyin(parsed.expecting)
        : undefined,
  };
}

/** Offline tutor used when no OPENAI_API_KEY is configured. */
function mockReply(
  messages: ChatMessage[],
  audience: Audience,
  mode: Mode,
  lesson: Lesson | undefined,
  style: TeachingStyle,
): TutorReply {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const turn = messages.filter((m) => m.role === "user").length;
  const kid = audience === "kids";
  const bilingual = style === "bilingual";

  if (mode === "lesson" && lesson) {
    const item = lesson.vocab[(turn - 1 + lesson.vocab.length) % lesson.vocab.length];
    const praise = kid ? "太棒了！" : "很好！";
    const praiseEn = kid ? "Awesome!" : "Very good!";
    return {
      hanzi: `${praise} 请跟我说：${item.hanzi}`,
      pinyin: `${toPinyin(praise)} qǐng gēn wǒ shuō: ${item.pinyin}`,
      english: `${praiseEn} Now say it after me: "${item.english}".`,
      speech: bilingual
        ? `${praiseEn} The word for "${item.english}" is ${item.hanzi}. Now you try: ${item.hanzi}.`
        : `${praise} 请跟我说：${item.hanzi}`,
      notes: kid
        ? `Tap 🎤 and say "${item.hanzi}" out loud!`
        : `"${item.hanzi}" means "${item.english}". Tap 🎤 and repeat it to practice.`,
      vocab: [item],
      expecting: item,
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
  style: TeachingStyle,
): Promise<{ reply: TutorReply; mock: boolean }> {
  const lesson = getLesson(lessonId);
  if (hasLLM()) {
    try {
      return {
        reply: await callLLM(messages, audience, mode, lesson, style),
        mock: false,
      };
    } catch (err) {
      console.error("LLM call failed, falling back to offline tutor:", err);
    }
  }
  return { reply: mockReply(messages, audience, mode, lesson, style), mock: true };
}
