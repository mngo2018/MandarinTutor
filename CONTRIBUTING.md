# Contributing to Mandarin Tutor

Welcome! This guide gets a new contributor productive whether they work in a
**Devin session** or a **local editor**.

## 0. Get access first
- **GitHub:** the repo owner adds you as a collaborator with **Write** access
  (GitHub → repo **Settings → Collaborators → Add people**). Without this you can
  read but can't push branches.
- **OpenAI key:** you need an `OPENAI_API_KEY` for live AI (chat, TTS, Whisper,
  pronunciation). Either use your own key or ask the owner for one. Without a key
  the app still runs in offline practice mode.

## 1a. Working in Devin (recommended)
Each person uses **their own** Devin session — sessions are per-user and don't
share a machine, filesystem, or env vars.

1. Start a Devin session pointed at this repo (`mngo2018/MandarinTutor`).
2. Add your `OPENAI_API_KEY` as a Devin secret so the app and tests can call OpenAI.
3. Devin auto-detects the repo's setup:
   - `AGENTS.md` — **important:** this is a non-standard Next.js; read the docs in
     `node_modules/next/dist/docs/` before writing code.
   - `.agents/skills/run-mandarin-tutor/SKILL.md` — install / run / lint / build /
     smoke-test steps Devin will follow.
4. Ask Devin to set up the repo; it will install deps and start the dev server.

## 1b. Working locally
```bash
git clone https://github.com/mngo2018/MandarinTutor.git
cd MandarinTutor
npm install
echo "OPENAI_API_KEY=sk-...your-key..." > .env.local
npm run dev          # http://localhost:3000
```
Requires Node 18+ (`node -v`).

## 2. Make changes
- Branch off `main`: `git checkout -b your-name/short-description`
- Keep changes focused. Follow existing conventions (TypeScript, Tailwind).
- Before pushing, always run:
  ```bash
  npm run lint
  npm run build
  ```
  Both must pass (the build enforces types and the React Compiler lint rules).

## 3. Open a PR
- Push your branch and open a Pull Request into `main`.
- Describe what changed and why; attach a screenshot/recording for UI changes.
- Get a review, then merge.

## 4. Deploys are automatic
- The repo is connected to **Vercel** (native Git integration).
- Every push to `main` auto-deploys to production:
  **https://mandarin-tutor-snowy.vercel.app**
- Each PR also gets its own Vercel **preview URL** (check the PR's checks/comments)
  so you can test before merging.

## Project map (where things live)
- `src/components/ChatTutor.tsx` — main UI: chat, lessons, mic, progress bar.
- `src/components/TutorMessage.tsx` — a tutor reply card (Hanzi/pinyin/English,
  audio, "your turn" target, pronunciation feedback).
- `src/lib/lessons.ts` — lesson + vocab content (edit here to add lessons).
- `src/lib/tutor.ts` — tutor prompt + reply shaping (teaching style, etc.).
- `src/lib/srs.ts` — spaced-repetition flashcards (localStorage).
- `src/app/api/chat` — tutor chat (gpt-4o-mini).
- `src/app/api/tts` — server-side TTS (OpenAI), `api/transcribe` — Whisper STT,
  `api/pronunciation` — per-syllable tone feedback (audio model).
- `DESIGN_IDEAS.md` — roadmap / UX ideas.

## Secrets & safety
- Never commit `.env.local` or any key.
- New dependencies: prefer versions published 7+ days ago; avoid floating ranges.
