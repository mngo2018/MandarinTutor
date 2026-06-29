"use client";

/**
 * Speak Mandarin text using the browser's SpeechSynthesis API (zh-CN).
 * No API key required. Designed to be swapped for server-side TTS
 * (e.g. OpenAI / Azure) later by replacing this implementation.
 */
export function speak(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "zh-CN";
  utter.rate = 0.85;

  const voices = window.speechSynthesis.getVoices();
  const zh = voices.find((v) => v.lang.toLowerCase().startsWith("zh"));
  if (zh) utter.voice = zh;

  window.speechSynthesis.speak(utter);
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
