/** A 問題1 question for the welcome page: the sentence around the blank, 4 choices, the answer, and why. */
export type Sample = {
  before: string;
  after: string;
  choices: [string, string, string, string];
  answer: number;
  pattern: string;
  why: string;
};

/** Three real N2 patterns, in the format of the exam's 問題1. */
export const SAMPLES: Sample[] = [
  {
    before: "練習した",
    after: "、合格できた。",
    choices: ["かいもなく", "かいがなく", "かいがあって", "までして"],
    answer: 2,
    pattern: "〜かいがあって",
    why: "努力した結果が、よい形で出たときに使います。「練習したかいがあって」＝練習した価値があった。",
  },
  {
    before: "雨が降っている",
    after: "、試合は予定どおり行われた。",
    choices: ["にもかかわらず", "によって", "に対して", "からといって"],
    answer: 0,
    pattern: "〜にもかかわらず",
    why: "「〜のに」と同じで、予想と違う結果が続きます。雨なのに、試合は行われた。",
  },
  {
    before: "日本に住んでいる",
    after: "、日本語が上手だとは限らない。",
    choices: ["ばかりか", "からといって", "ものの", "どころか"],
    answer: 1,
    pattern: "〜からといって…とは限らない",
    why: "理由があっても、その結果になるとは言えないときの形です。",
  },
];
