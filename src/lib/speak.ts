"use client";

/**
 * Speak Mandarin text using the browser's SpeechSynthesis API (zh-CN).
 * No API key required. Designed to be swapped for server-side TTS
 * (e.g. OpenAI / Azure) later by replacing this implementation.
 */

function pickZhVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  return (
    voices.find((v) => v.lang.toLowerCase() === "zh-cn") ??
    voices.find((v) => v.lang.toLowerCase().startsWith("zh"))
  );
}

/**
 * Resolve the list of voices, which many browsers populate asynchronously.
 * On the first call after page load `getVoices()` is often empty until the
 * `voiceschanged` event fires, so we wait for it (with a timeout fallback).
 */
function loadVoices(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
  const existing = synth.getVoices();
  if (existing.length) return Promise.resolve(existing);

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synth.removeEventListener("voiceschanged", finish);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", finish);
    setTimeout(finish, 1500);
  });
}

export function speak(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;

  // Clear anything queued/stuck before starting a new utterance.
  synth.cancel();
  // Chrome can leave the engine in a paused state, silently dropping speech.
  synth.resume();

  void loadVoices(synth).then((voices) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    utter.rate = 0.85;

    const zh = pickZhVoice(voices);
    if (zh) utter.voice = zh;

    synth.cancel();
    synth.resume();
    synth.speak(utter);
  });
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
