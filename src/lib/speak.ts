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

function utterance(text: string, voices: SpeechSynthesisVoice[]) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "zh-CN";
  utter.rate = 0.85;
  const zh = pickZhVoice(voices);
  if (zh) utter.voice = zh;
  return utter;
}

export function speak(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;

  const play = (voices: SpeechSynthesisVoice[]) => {
    const utter = utterance(text, voices);
    const start = () => {
      // Chrome can leave the engine paused after a prior utterance.
      synth.resume();
      synth.speak(utter);
    };
    // If something is already playing, cancel it and wait a tick before
    // speaking again — Chrome drops an utterance queued in the same frame
    // as cancel(), which is why a rapid second press goes silent.
    if (synth.speaking || synth.pending) {
      synth.cancel();
      window.setTimeout(start, 120);
    } else {
      start();
    }
  };

  const voices = synth.getVoices();
  if (voices.length) {
    play(voices);
    return;
  }

  // Voices load asynchronously; on the first call getVoices() is often empty
  // until the `voiceschanged` event fires. Wait for it, with a timeout fallback.
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    synth.removeEventListener("voiceschanged", run);
    play(synth.getVoices());
  };
  synth.addEventListener("voiceschanged", run);
  window.setTimeout(run, 1000);
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
