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

  // ── Adults: survival roleplay scenarios ─────────────────────────────
  {
    id: "order-food",
    title: "Order Food",
    emoji: "🍜",
    description: "Roleplay: order a meal at a restaurant.",
    track: "adults",
    kind: "scenario",
    scenario: {
      role: "a friendly restaurant waiter",
      setting: "a small noodle restaurant in Beijing",
      goal: "order a bowl of noodles and pay for it",
      intro:
        "You walk into a noodle shop. The waiter greets you — order your meal and pay, all in Mandarin.",
    },
    vocab: [
      { hanzi: "我要这个", pinyin: "wǒ yào zhè ge", english: "I want this one" },
      { hanzi: "一碗面条", pinyin: "yì wǎn miàn tiáo", english: "a bowl of noodles" },
      { hanzi: "多少钱？", pinyin: "duō shao qián?", english: "how much?" },
      { hanzi: "买单", pinyin: "mǎi dān", english: "the bill, please" },
      { hanzi: "谢谢", pinyin: "xiè xie", english: "thank you" },
    ],
  },
  {
    id: "market-bargain",
    title: "Bargain at the Market",
    emoji: "🛍️",
    description: "Roleplay: haggle for a better price.",
    track: "adults",
    kind: "scenario",
    scenario: {
      role: "a lively souvenir street vendor who loves to haggle",
      setting: "a busy outdoor market stall",
      goal: "buy a souvenir for a lower price than first offered",
      intro:
        "You spot a souvenir you like. The vendor names a high price — bargain them down!",
    },
    vocab: [
      { hanzi: "这个多少钱？", pinyin: "zhè ge duō shao qián?", english: "how much is this?" },
      { hanzi: "太贵了", pinyin: "tài guì le", english: "too expensive" },
      { hanzi: "便宜一点", pinyin: "pián yi yì diǎn", english: "a bit cheaper" },
      { hanzi: "可以吗？", pinyin: "kě yǐ ma?", english: "is that okay?" },
      { hanzi: "我买了", pinyin: "wǒ mǎi le", english: "I'll buy it" },
    ],
  },
  {
    id: "restroom",
    title: "Find the Restroom",
    emoji: "🚻",
    description: "Roleplay: ask where the restroom is.",
    track: "adults",
    kind: "scenario",
    scenario: {
      role: "a helpful passerby on the street",
      setting: "a shopping street where you urgently need a restroom",
      goal: "politely ask for and understand directions to the restroom",
      intro:
        "You need a restroom, fast. Stop a passerby and ask politely in Mandarin.",
    },
    vocab: [
      { hanzi: "请问", pinyin: "qǐng wèn", english: "excuse me (may I ask)" },
      { hanzi: "洗手间在哪里？", pinyin: "xǐ shǒu jiān zài nǎ lǐ?", english: "where is the restroom?" },
      { hanzi: "在哪里？", pinyin: "zài nǎ lǐ?", english: "where is it?" },
      { hanzi: "我明白了", pinyin: "wǒ míng bai le", english: "I understand" },
      { hanzi: "谢谢你", pinyin: "xiè xie nǐ", english: "thank you" },
    ],
  },
  {
    id: "didi-taxi",
    title: "Take a Didi",
    emoji: "🚕",
    description: "Roleplay: tell a driver where to go.",
    track: "adults",
    kind: "scenario",
    scenario: {
      role: "a Didi (ride-hailing) driver",
      setting: "the back seat of a Didi car",
      goal: "tell the driver your destination and confirm the fare",
      intro:
        "Your Didi arrives. Greet the driver, give your destination, and confirm the fare.",
    },
    vocab: [
      { hanzi: "你好，师傅", pinyin: "nǐ hǎo, shī fu", english: "hello, driver" },
      { hanzi: "我要去机场", pinyin: "wǒ yào qù jī chǎng", english: "I want to go to the airport" },
      { hanzi: "多长时间？", pinyin: "duō cháng shí jiān?", english: "how long will it take?" },
      { hanzi: "到了", pinyin: "dào le", english: "we've arrived" },
      { hanzi: "多少钱？", pinyin: "duō shao qián?", english: "how much?" },
    ],
  },

  // ── Kids: story-quest roleplay scenarios ────────────────────────────
  {
    id: "panda-lost-ball",
    title: "Pim's Lost Ball",
    emoji: "🐼",
    description: "Quest: help Pim the Panda find his ball!",
    track: "kids",
    kind: "scenario",
    scenario: {
      role: "Pim, a cute baby panda who lost his red ball and needs the child's help",
      setting: "a sunny bamboo forest",
      goal: "help Pim find his red ball by talking to forest friends",
      intro:
        "Pim the Panda lost his favorite red ball! 🐼 Help him find it using your Mandarin.",
    },
    vocab: [
      { hanzi: "你好", pinyin: "nǐ hǎo", english: "hello" },
      { hanzi: "你看！", pinyin: "nǐ kàn!", english: "look!" },
      { hanzi: "球在哪里？", pinyin: "qiú zài nǎ lǐ?", english: "where is the ball?" },
      { hanzi: "我要球", pinyin: "wǒ yào qiú", english: "I want the ball" },
      { hanzi: "谢谢", pinyin: "xiè xie", english: "thank you" },
    ],
  },
  {
    id: "panda-snack",
    title: "Pim's Snack Time",
    emoji: "🍎",
    description: "Quest: share a snack with Pim!",
    track: "kids",
    kind: "scenario",
    scenario: {
      role: "Pim, a hungry baby panda who wants to share snacks with the child",
      setting: "a picnic blanket under a big tree",
      goal: "ask for snacks and share them with Pim",
      intro:
        "It's snack time with Pim! 🍎 Ask for snacks and share them, all in Mandarin.",
    },
    vocab: [
      { hanzi: "我要苹果", pinyin: "wǒ yào píng guǒ", english: "I want an apple" },
      { hanzi: "你要不要？", pinyin: "nǐ yào bu yào?", english: "do you want some?" },
      { hanzi: "给你", pinyin: "gěi nǐ", english: "here you go" },
      { hanzi: "好吃！", pinyin: "hǎo chī!", english: "delicious!" },
      { hanzi: "谢谢", pinyin: "xiè xie", english: "thank you" },
    ],
  },
];

export function getLesson(id: string | undefined): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}
