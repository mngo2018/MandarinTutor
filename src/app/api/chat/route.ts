import { NextResponse } from "next/server";
import { generateReply } from "@/lib/tutor";
import type { ChatRequest } from "@/lib/types";

export async function POST(request: Request) {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, audience, mode, lessonId } = body;
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "`messages` is required" }, { status: 400 });
  }

  const { reply, mock } = await generateReply(
    messages,
    audience === "kids" ? "kids" : "adults",
    mode === "lesson" ? "lesson" : "free",
    lessonId,
  );

  return NextResponse.json({ reply, mock });
}
