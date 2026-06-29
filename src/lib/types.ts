export type Audience = "kids" | "adults";
export type Mode = "lesson" | "free";

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
  /** Short teaching note / encouragement in English. */
  notes?: string;
  /** Key vocabulary worth saving for review. */
  vocab: VocabItem[];
}

export interface ChatRequest {
  messages: ChatMessage[];
  audience: Audience;
  mode: Mode;
  lessonId?: string;
}

export interface ChatResponse {
  reply: TutorReply;
  /** True when the response came from the offline/canned tutor (no API key). */
  mock: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  emoji: string;
  description: string;
  vocab: VocabItem[];
}
