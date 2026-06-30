const STT_MODEL = process.env.OPENAI_STT_MODEL ?? "whisper-1";

export function hasSTT(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Transcribe spoken Mandarin audio to text using OpenAI Whisper.
 * Server-side so recognition is accurate and consistent across devices,
 * rather than relying on the browser's SpeechRecognition API.
 */
export async function transcribeAudio(file: File): Promise<string> {
  const { default: OpenAI, toFile } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const buffer = Buffer.from(await file.arrayBuffer());
  const upload = await toFile(buffer, file.name || "speech.webm", {
    type: file.type || "audio/webm",
  });

  const result = await client.audio.transcriptions.create({
    file: upload,
    model: STT_MODEL,
    language: "zh",
    prompt: "请用简体中文转写以下普通话内容。",
  });

  return result.text.trim();
}
