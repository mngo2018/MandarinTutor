const TTS_MODEL = process.env.OPENAI_TTS_MODEL ?? "tts-1";
const TTS_VOICE = process.env.OPENAI_TTS_VOICE ?? "alloy";

export function hasTTS(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Generate spoken Mandarin audio (MP3) for the given text using OpenAI TTS.
 * Server-side so playback never depends on the device's installed voices.
 */
export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.audio.speech.create({
    model: TTS_MODEL,
    voice: TTS_VOICE,
    input: text,
    response_format: "mp3",
  });

  return response.arrayBuffer();
}
