import type { Pronunciation, VocabItem } from "./types";

const AUDIO_MODEL = process.env.OPENAI_AUDIO_MODEL ?? "gpt-audio-mini";

/** Parse a JSON object from model output, tolerating markdown code fences. */
function parseJsonObject(raw: string): Partial<Pronunciation> {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) return {};
  return JSON.parse(body.slice(start, end + 1)) as Partial<Pronunciation>;
}

export function hasPronunciation(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Listen to a learner's spoken attempt and assess pronunciation against a
 * target Mandarin phrase, with a per-syllable tone breakdown. Uses an audio
 * model so tones are judged from the actual recording, not a transcription.
 */
export async function analyzePronunciation(
  file: File,
  target: VocabItem,
): Promise<Pronunciation> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const system = [
    "You are a Mandarin pronunciation coach. You will hear a learner attempt to say a target phrase.",
    "Judge their pronunciation by LISTENING to the audio — especially the tones of each syllable.",
    "Be encouraging but honest. Compare what you hear to the target's expected tones.",
    "Always write Chinese in Simplified characters.",
    "Respond ONLY with a JSON object of this TypeScript type (no markdown fences):",
    '{ transcript: string; rating: "great" | "good" | "needs_work"; tones: { char: string; pinyin: string; ok: boolean; note?: string }[]; tip?: string }',
    "`transcript` is what you actually heard them say. `tones` must have one entry per syllable of the TARGET phrase, in order, with `ok` true when that syllable (including its tone) was acceptable. `note` is a brief reason only when ok is false. `tip` is one short, concrete improvement tip.",
  ].join("\n");

  const userText = `Target phrase: ${target.hanzi} (${target.pinyin}) = "${target.english}". Assess the learner's attempt in the audio.`;

  const completion = await client.chat.completions.create({
    model: AUDIO_MODEL,
    modalities: ["text"],
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "input_audio", input_audio: { data: base64, format: "wav" } },
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = parseJsonObject(raw);

  const rating: Pronunciation["rating"] =
    parsed.rating === "great" || parsed.rating === "needs_work"
      ? parsed.rating
      : "good";

  return {
    transcript: (parsed.transcript ?? "").trim(),
    rating,
    tones: Array.isArray(parsed.tones)
      ? parsed.tones.map((t) => ({
          char: t.char ?? "",
          pinyin: t.pinyin ?? "",
          ok: Boolean(t.ok),
          note: t.note,
        }))
      : [],
    tip: parsed.tip,
  };
}
