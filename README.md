# 🐼 Mandarin Tutor

An AI Mandarin Chinese tutor for **kids and adults**. Built with Next.js (App Router) + Tailwind.

## Features

- **AI chat tutor** with a kids/adults mode toggle that adapts tone, vocabulary, and UI.
- **Lessons** (greetings, numbers, family, food, colors) + **free conversation** mode.
- Every Chinese reply shows **Hanzi + Pinyin + English**, plus a teaching note.
- **Audio** for any phrase via the browser's speech synthesis (zh-CN) — no key needed.
- **Spaced-repetition review** (Leitner boxes) so learners revisit saved vocab.
- **Works with zero setup**: without an API key it runs an *offline practice mode* using
  built-in lessons. Add an `OPENAI_API_KEY` to unlock full conversational replies.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Enable full AI replies (optional)

```bash
cp .env.example .env.local
# then set OPENAI_API_KEY=sk-...
```

| Variable         | Default       | Purpose                                  |
| ---------------- | ------------- | ---------------------------------------- |
| `OPENAI_API_KEY` | _(unset)_     | Enables OpenAI-powered conversation      |
| `OPENAI_MODEL`   | `gpt-4o-mini` | Chat model used for replies              |

## Architecture

```
src/
  app/
    api/chat/route.ts   # POST: { messages, audience, mode, lessonId } -> structured TutorReply
    page.tsx            # renders <ChatTutor/>
  components/
    ChatTutor.tsx       # main UI: audience/mode toggles, lesson picker, chat
    TutorMessage.tsx    # Hanzi + Pinyin + English card, audio, save-to-review
    ReviewPanel.tsx     # spaced-repetition flashcards
  lib/
    tutor.ts            # LLM call + offline mock fallback + pinyin helpers
    lessons.ts          # lesson/vocab data
    srs.ts              # localStorage Leitner spaced-repetition store
    speak.ts            # browser TTS (swap for server TTS later)
    types.ts
```

### Roadmap / how to extend

- **Voice input + tone feedback** (the eventual killer feature): add a `/api/transcribe`
  route using Whisper, capture mic audio in the client, and have the tutor score pronunciation.
- **Accounts + progress**: replace the `localStorage` SRS store (`src/lib/srs.ts`) with a
  Postgres-backed API; the `SrsCard` shape is already defined.
- **Server-side TTS**: swap `src/lib/speak.ts` for OpenAI/Azure/ElevenLabs for higher-quality,
  consistent Mandarin audio.
- **Mobile app**: the API (`/api/chat`) is UI-agnostic and can back a React Native client.
