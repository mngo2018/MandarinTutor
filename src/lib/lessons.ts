import type { Lesson } from "./types";

export const LESSONS: Lesson[] = [
  {
    id: "greetings",
    title: "Greetings",
    emoji: "👋",
    description: "Say hello, goodbye, and how are you.",
    vocab: [
      { hanzi: "你好", pinyin: "nǐ hǎo", english: "hello" },
      { hanzi: "再见", pinyin: "zài jiàn", english: "goodbye" },
      { hanzi: "谢谢", pinyin: "xiè xie", english: "thank you" },
      { hanzi: "你好吗？", pinyin: "nǐ hǎo ma?", english: "how are you?" },
      { hanzi: "我很好", pinyin: "wǒ hěn hǎo", english: "I'm very good" },
    ],
  },
  {
    id: "numbers",
    title: "Numbers 1–10",
    emoji: "🔢",
    description: "Count from one to ten.",
    vocab: [
      { hanzi: "一", pinyin: "yī", english: "one" },
      { hanzi: "二", pinyin: "èr", english: "two" },
      { hanzi: "三", pinyin: "sān", english: "three" },
      { hanzi: "四", pinyin: "sì", english: "four" },
      { hanzi: "五", pinyin: "wǔ", english: "five" },
      { hanzi: "六", pinyin: "liù", english: "six" },
      { hanzi: "七", pinyin: "qī", english: "seven" },
      { hanzi: "八", pinyin: "bā", english: "eight" },
      { hanzi: "九", pinyin: "jiǔ", english: "nine" },
      { hanzi: "十", pinyin: "shí", english: "ten" },
    ],
  },
  {
    id: "family",
    title: "Family",
    emoji: "👨‍👩‍👧",
    description: "Talk about your family members.",
    vocab: [
      { hanzi: "妈妈", pinyin: "mā ma", english: "mom" },
      { hanzi: "爸爸", pinyin: "bà ba", english: "dad" },
      { hanzi: "哥哥", pinyin: "gē ge", english: "older brother" },
      { hanzi: "姐姐", pinyin: "jiě jie", english: "older sister" },
      { hanzi: "我爱你", pinyin: "wǒ ài nǐ", english: "I love you" },
    ],
  },
  {
    id: "food",
    title: "Food & Drink",
    emoji: "🍜",
    description: "Order food and say what you like.",
    vocab: [
      { hanzi: "水", pinyin: "shuǐ", english: "water" },
      { hanzi: "米饭", pinyin: "mǐ fàn", english: "rice" },
      { hanzi: "面条", pinyin: "miàn tiáo", english: "noodles" },
      { hanzi: "我饿了", pinyin: "wǒ è le", english: "I'm hungry" },
      { hanzi: "好吃", pinyin: "hǎo chī", english: "delicious" },
    ],
  },
  {
    id: "colors",
    title: "Colors",
    emoji: "🌈",
    description: "Name the colors you see.",
    vocab: [
      { hanzi: "红色", pinyin: "hóng sè", english: "red" },
      { hanzi: "蓝色", pinyin: "lán sè", english: "blue" },
      { hanzi: "黄色", pinyin: "huáng sè", english: "yellow" },
      { hanzi: "绿色", pinyin: "lǜ sè", english: "green" },
      { hanzi: "黑色", pinyin: "hēi sè", english: "black" },
    ],
  },
];

export function getLesson(id: string | undefined): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}
