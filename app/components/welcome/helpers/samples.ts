import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";

/** A 問題1 question for the welcome page: the sentence around the blank, 4 choices, the answer, and why (in the page's language). */
export type Sample = {
  before: string;
  after: string;
  choices: [string, string, string, string];
  answer: number;
  pattern: string;
  why: MessageDescriptor;
};

/** Three real N2 patterns, in the format of the exam's 問題1. */
export const SAMPLES: Sample[] = [
  {
    before: "練習した",
    after: "、合格できた。",
    choices: ["かいもなく", "かいがなく", "かいがあって", "までして"],
    answer: 2,
    pattern: "〜かいがあって",
    why: msg`Used when effort led to a good result. 「練習したかいがあって」 = the practice was worth it.`,
  },
  {
    before: "雨が降っている",
    after: "、試合は予定どおり行われた。",
    choices: ["にもかかわらず", "によって", "に対して", "からといって"],
    answer: 0,
    pattern: "〜にもかかわらず",
    why: msg`Like 「〜のに」, a result that goes against what you would expect follows. It was raining, yet the match went ahead.`,
  },
  {
    before: "日本に住んでいる",
    after: "、日本語が上手だとは限らない。",
    choices: ["ばかりか", "からといって", "ものの", "どころか"],
    answer: 1,
    pattern: "〜からといって…とは限らない",
    why: msg`Used when a reason does not mean that the result must follow.`,
  },
];
