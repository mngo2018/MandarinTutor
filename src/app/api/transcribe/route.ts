import { NextResponse } from "next/server";
import { hasSTT, transcribeAudio } from "@/lib/stt";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasSTT()) {
    return NextResponse.json({ error: "STT not configured" }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form-data" },
      { status: 400 },
    );
  }

  const file = form.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "`audio` file is required" },
      { status: 400 },
    );
  }

  try {
    const text = await transcribeAudio(file);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("Transcription failed:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
  }
}
