---
name: run-mandarin-tutor
description: Install, run, lint, build, and smoke-test the Mandarin Tutor Next.js app. Use whenever working on this repo to start the dev server or verify changes before a PR.
---

## Setup & run

1. `npm install`
2. Start the dev server: `npm run dev` (serves http://localhost:3000)

## Optional: enable live AI replies

Without a key the app runs an offline practice mode. To enable OpenAI-backed replies:

```bash
cp .env.example .env.local   # set OPENAI_API_KEY=sk-...
```

The key is read by `src/lib/tutor.ts`. If the key is missing or the OpenAI call
fails (e.g. quota), the app automatically falls back to the offline tutor — so
`mock: true` in `/api/chat` responses means the offline path was used.

## Verify before a PR

1. Typecheck: `npx tsc --noEmit`
2. Lint: `npm run lint`
3. Production build: `npm run build`
4. Smoke-test the API (offline path returns `"mock": true`):
   ```bash
   curl -s -X POST http://localhost:3000/api/chat \
     -H 'Content-Type: application/json' \
     -d '{"messages":[{"role":"user","content":"hi"}],"audience":"adults","mode":"free"}'
   ```
5. In the browser: pick a lesson, confirm the reply shows Hanzi + Pinyin + English,
   click 🔊 for audio, "Save vocab to review", then open Review to see the flashcard.

## Gotchas

- This is Next.js 16 (App Router, Turbopack). Read `node_modules/next/dist/docs/`
  before using unfamiliar APIs — there are breaking changes vs. older versions.
- ESLint forbids calling `setState` synchronously inside `useEffect`; use a lazy
  `useState(() => ...)` initializer for client-only data (see `ReviewPanel.tsx`).
- When kicking off a lesson, pass `mode`/`lessonId` explicitly to the send call —
  React state updates are async, so relying on just-set state causes a stale-read
  bug (the lesson falls back to free chat).
