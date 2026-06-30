"use client";

/**
 * Speak Mandarin text. Primary path is server-side TTS (OpenAI) played as an
 * MP3, so audio is identical across devices and does not depend on the
 * browser's installed voices. Falls back to the browser SpeechSynthesis API
 * when the TTS endpoint is unavailable (e.g. offline / no API key).
 */

let currentAudio: HTMLAudioElement | null = null;

function speakBrowser(text: string): void {
  if (!("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "zh-CN";
  utter.rate = 0.85;
  const zh = synth
    .getVoices()
    .find((v) => v.lang.toLowerCase().startsWith("zh"));
  if (zh) utter.voice = zh;
  if (synth.speaking || synth.pending) synth.cancel();
  synth.speak(utter);
}

export function speak(text: string): void {
  if (typeof window === "undefined") return;

  // Stop whatever is currently playing so repeated presses always restart.
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();

  // Kick off play() synchronously inside the click handler so the browser
  // treats it as user-initiated (avoids autoplay blocking). The src points at
  // the server TTS endpoint, which streams an MP3.
  const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}`);
  currentAudio = audio;
  audio.play().catch(() => {
    // TTS endpoint failed or returned a non-audio response (offline mode).
    if (currentAudio === audio) currentAudio = null;
    speakBrowser(text);
  });
}

/**
 * Warm the TTS cache for a phrase so a later press of 🔊 plays instantly.
 * Safe to call on render; failures (offline / no key) are ignored.
 */
export function prefetchSpeech(text: string): void {
  if (typeof window === "undefined" || !text) return;
  void fetch(`/api/tts?text=${encodeURIComponent(text)}`).catch(() => {});
}

export function canSpeak(): boolean {
  return typeof window !== "undefined";
}
