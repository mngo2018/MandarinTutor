import { NextResponse } from "next/server";
import { hasTTS, synthesizeSpeech } from "@/lib/tts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const text = new URL(request.url).searchParams.get("text")?.trim() ?? "";
  if (!text) {
    return NextResponse.json({ error: "`text` is required" }, { status: 400 });
  }
  if (!hasTTS()) {
    return NextResponse.json({ error: "TTS not configured" }, { status: 503 });
  }

  try {
    const audio = await synthesizeSpeech(text);
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("TTS failed:", err);
    return NextResponse.json({ error: "TTS failed" }, { status: 502 });
  }
}
