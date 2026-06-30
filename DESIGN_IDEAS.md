# Mandarin Tutor — Design & Roadmap Ideas

A living doc capturing UX, character, and content ideas to make the tutor more fun
and effective. Organized by area, with rough effort/impact notes.

---

## 1. The Teacher Character

Lean into the existing panda mascot 🐼 — make it a *character*, not just an emoji.

- **Name & identity:** e.g. **Pim the Panda** / **熊猫老师 (Xióngmāo Lǎoshī)**.
- **Reactive avatar:** a small panda next to each tutor message that changes
  expression based on what happens:
  - 😊 normal
  - 🤩 when you nail the tones
  - 🤔 when you're close
  - 👏 on lesson complete
  - Cheap with a few SVG/emoji states; big personality boost.
- **Voice & catchphrases:** warm, encouraging, a little playful
  ("再来一次! one more time, you've got this 🐼"). Pure prompt tuning.
- **Anime option:** an illustrated anime-style sensei is possible but needs real
  art assets (commissioned or AI-generated, ~5–8 poses). More polish, more
  effort/cost.
- **Character picker:** Panda / Anime sensei / Cat — build the "avatar with mood
  states" framework once, then swap art behind it.

**Recommendation:** start with the panda (on-brand, fast, kid-friendly); add
anime art later behind the same mood-state system.

---

## 2. Fun / Game Feel

Mechanics that make language apps addictive, in rough priority:

- **XP + levels** — points per phrase and per correct tone; a level bar. Pairs
  with the lesson progress bar we already have.
- **Daily streak 🔥** — "3-day streak!" The single biggest retention driver in
  Duolingo-style apps.
- **Badges / stickers** — "First Words", "Tone Master", "Foodie" (finish the Food
  lesson). Kids love collecting.
- **Celebration moments** — confetti + happy panda + a sound on lesson complete or
  a perfect tone score. We already detect completion and pronunciation rating.
- **Sound design** — gentle "ding" for correct, soft "boop" for retry. Small
  touch, big delight.
- **Real-time mascot reactions** — the panda bounces / claps when you speak well.

---

## 3. Lesson Content

Current 5 lessons (Greetings, Numbers, Family, Food, Colors) are a solid *vocab*
base but flat. Improvements, most impactful first:

### a) Add structure beyond word lists
Each lesson item can optionally carry:
- an **example sentence** ("你好，我叫小明" not just "你好"),
- a **mini-dialogue** to role-play with the panda
  ("Panda: 你好! → You: 你好! → Panda: 你叫什么名字?"),
- a tiny **culture note** ("Chinese people often ask 你吃了吗 — 'have you eaten?' —
  as a greeting").

### b) Build a real difficulty ladder
Right now lessons are parallel. Make a *path*:
Greetings → Numbers → Family → Food → Colors → **Combining them**
("I have two older brothers", "I want three bowls of noodles") so learners reuse
earlier words. Recombination makes it feel like progress, not flashcards.

### c) Lesson *types*, not just "intro + repeat"
- **Listen & choose** (panda says a word, you pick the picture/meaning)
- **Say it** (what we have, with tone feedback)
- **Build a sentence** (drag/say words in order)
- **Role-play** (free conversation constrained to the lesson's words)
Variety per lesson kills monotony.

### d) More lessons + themes kids love
Animals 🐶, Colors+objects, Numbers→age/phone, "At school", "My day", plus a
**Songs** mode (numbers song, 两只老虎). Singing is gold for kids and tones.

### e) Pictures
Pair each vocab item with a simple image/emoji so meaning is visual, not just
English text. Big for kids and for immersion mode.

---

## Suggested First Build — "Juicy Panda" pass

Most fun for the least work; all client-side, no backend needed. Sets up the rest.

1. Panda avatar with **mood states** next to tutor messages (reacts to tone score).
2. **XP + a level bar + confetti & sound** on correct answers / lesson complete
   (ties into the progress + pronunciation we already have).
3. Tune the tutor's **personality** (playful, encouraging, named panda).
4. Enrich the existing 5 lessons with **example sentence + one culture note + an
   emoji/image per item** (visible, immediate content upgrade).

Pairs naturally with **Step A (local memory)** later — XP/streak data lives in the
same store.

---

## Memory / Persistence (separate track)

- **Today:** mostly stateless. Only saved vocab persists (localStorage SRS,
  per-device). Conversation, lesson progress, and "what you've learned" reset each
  session. No accounts/DB.
- **Step A (planned, ~2h):** persist lesson completion + per-phrase mastery to
  localStorage; tutor can greet "welcome back, you've mastered 12 phrases" and
  resume/skip. Per-device, no login. Structure the data like the future DB schema.
- **Step B / Option 3 (~2.5–4 days):** accounts (Auth.js) + Postgres
  (Neon / Vercel Postgres / Supabase) for real cross-device memory and a learner
  profile injected into the tutor prompt ("knows greetings+numbers; weak on q/x
  initials and 3rd tone; 14 cards due"). Needs a provisioned `DATABASE_URL`.

---

## 4. Content Engine — Two Tracks (Adults vs Kids)

Split content into two tracks tuned to how each audience learns. Driven by the
existing Kids/Adults toggle.

### Adults — immediate high-utility
- **Survival micro-lessons** (5-min): order food, ask for the restroom, take a
  Didi, bargain at a market. *(SHIPPED — see "Real-life scenarios" below.)*
- **Professional branching:** specialized vocab paths (tech sourcing, finance
  negotiation, medical intake).
- **Cultural nuance engine:** "hidden" rules — how to accept a business card, why
  never to give a clock as a gift.
- **Custom prompting:** paste your own email/meeting agenda → personalized vocab
  list for that day.

### Kids — immersion & play
- **Story-driven progress:** an ongoing narrative where the child uses Mandarin to
  help a character (Pim the Panda) solve mysteries / complete quests. *(SHIPPED —
  two starter quests.)*
- **Total Physical Response (TPR):** use camera/audio to detect actions
  ("跳 tiào / jump", "摸鼻子 mō bízi / touch your nose").
- **High-frequency spoken language:** prioritize functional words like
  我要 (I want), 你看 (look) over static noun lists. *(Applied in the quests.)*

---

## 5. Engagement Mechanics — the "exciting" layer

1. **Interactive roleplay & branching scenarios** *(SHIPPED — first version)*
   - The AI plays a character (vendor, waiter, driver) with a goal to reach.
   - **Consequence-based learning:** wrong word → the character reacts naturally
     (brings water instead of fruit), making mistakes memorable + funny.
2. **AI-driven dynamic content**
   - Current events / Mandopop lyrics / viral clips → daily reading & listening.
   - **Image-to-lesson:** snap a photo of a menu/object → instant mini-lesson
     (needs a vision model, e.g. gpt-4o vision).
3. **Gamified speech & tone**
   - **Tone visualizer:** real-time pitch-tracking graphic comparing the learner's
     contour to a native one (Web Audio pitch detection).
   - **Voice-controlled "spells":** for kids, correct pronunciation casts spells /
     defeats monsters / unlocks chests.

---

## Shipped so far (content)
- **Two-track lesson picker** (Basics + track-specific) keyed off Kids/Adults.
- **Adults — Real-life scenarios:** Order Food 🍜, Bargain at the Market 🛍️,
  Find the Restroom 🚻, Take a Didi 🚕.
- **Kids — Story quests:** Pim's Lost Ball 🐼, Pim's Snack Time 🍎.
- **Roleplay engine** in `tutor.ts`: in-character, goal-driven, consequence-based
  feedback, reuses voice-in + tone feedback + progress bar.

---

## Status / Decisions
- Step A (local memory): do "a little later" (per user).
- "Juicy panda" character/game-feel pass: deferred (still in section 1–2 above).
- Current focus: **lesson content** — roleplay scenarios + two tracks (shipped).
- Next content slices (pick order): tone pitch visualizer · image-to-lesson ·
  custom-prompt vocab · camera TPR for kids · dynamic current-events content ·
  cultural nuance engine · more scenarios + a difficulty ladder.
