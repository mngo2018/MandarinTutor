import { NextResponse } from "next/server";
import { analyzePronunciation, hasPronunciation } from "@/lib/pronunciation";
import type { VocabItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasPronunciation()) {
    return NextResponse.json(
      { error: "Pronunciation analysis not configured" },
      { status: 503 },
    );
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
  const hanzi = String(form.get("hanzi") ?? "").trim();
  if (!(file instanceof File) || !hanzi) {
    return NextResponse.json(
      { error: "`audio` file and `hanzi` are required" },
      { status: 400 },
    );
  }

  const target: VocabItem = {
    hanzi,
    pinyin: String(form.get("pinyin") ?? "").trim(),
    english: String(form.get("english") ?? "").trim(),
  };

  try {
    const result = await analyzePronunciation(file, target);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Pronunciation analysis failed:", err);
    return NextResponse.json(
      { error: "Pronunciation analysis failed" },
      { status: 502 },
    );
  }
}
