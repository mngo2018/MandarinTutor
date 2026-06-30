export type Audience = "kids" | "adults";
export type Mode = "lesson" | "free";
/** How much English the tutor uses while teaching. */
export type TeachingStyle = "immersion" | "bilingual";

export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

/** A single vocabulary item the learner encounters. */
export interface VocabItem {
  hanzi: string;
  pinyin: string;
  english: string;
}

/** Structured tutor reply rendered in the chat. */
export interface TutorReply {
  /** Conversational Chinese sentence(s). */
  hanzi: string;
  /** Pinyin for `hanzi`. */
  pinyin: string;
  /** English translation of `hanzi`. */
  english: string;
  /**
   * The line the tutor should say aloud. In bilingual mode this mixes English
   * guidance with the Mandarin phrase; defaults to `hanzi` when omitted.
   */
  speech?: string;
  /** Short teaching note / encouragement in English. */
  notes?: string;
  /** Key vocabulary worth saving for review. */
  vocab: VocabItem[];
  /**
   * In guided lessons, the phrase the learner is now asked to say aloud.
   * When set, the UI shows a "your turn to speak" cue.
   */
  expecting?: VocabItem;
}

/** Tone/pronunciation assessment for a single syllable. */
export interface ToneCheck {
  /** The Chinese character. */
  char: string;
  /** Expected pinyin with tone mark. */
  pinyin: string;
  /** Whether the learner pronounced it acceptably. */
  ok: boolean;
  /** Short note when it needs work (e.g. tone slipped). */
  note?: string;
}

/** Result of listening to a learner's spoken attempt at a target phrase. */
export interface Pronunciation {
  /** What the learner actually said (as heard). */
  transcript: string;
  /** Overall assessment. */
  rating: "great" | "good" | "needs_work";
  /** Per-syllable tone breakdown for the target phrase. */
  tones: ToneCheck[];
  /** One concrete tip for improvement. */
  tip?: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  audience: Audience;
  mode: Mode;
  style?: TeachingStyle;
  lessonId?: string;
}

export interface ChatResponse {
  reply: TutorReply;
  /** True when the response came from the offline/canned tutor (no API key). */
  mock: boolean;
}

/** Which learner track a lesson belongs to. */
export type Track = "adults" | "kids";

/** Kind of lesson experience. */
export type LessonKind = "vocab" | "scenario";

/** Roleplay setup for scenario lessons. */
export interface Scenario {
  /** The character the tutor plays, e.g. "a street food vendor". */
  role: string;
  /** Where it happens, shown to the learner to set the scene. */
  setting: string;
  /** What the learner is trying to accomplish. */
  goal: string;
  /** One-line setup shown in the UI before the roleplay begins. */
  intro: string;
}

export interface Lesson {
  id: string;
  title: string;
  emoji: string;
  description: string;
  /** Track this lesson is designed for. Defaults to both if omitted. */
  track?: Track;
  /** Experience type; defaults to "vocab". */
  kind?: LessonKind;
  /** Roleplay config when `kind === "scenario"`. */
  scenario?: Scenario;
  /** Target phrases. For scenarios these are the lines to practice/use. */
  vocab: VocabItem[];
}
