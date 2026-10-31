import { splitTarget, wordId, type ChapterWord, type KanjiChapter } from "./kanji-payload";
import type { LatestKanjiTest } from "./kanji.server";
import type { Level } from "./payload";
import type { ChapterSummary, FlashCard, FlashcardsView, KanjiHomeView } from "./views";

/**
 * What the kanji pages show, worked out from a chapter and its learned marks and quizzes, which kanji.server.ts reads.
 * Nothing here touches the database, so the views can be built anywhere, the test factories included.
 */

/** A word of a chapter, with its id and where the book has it: under which kanji, in which lesson. */
export type BookWord = ChapterWord & { id: string; headword: string; lesson: { title: string; page: number } };

/** Every word of a chapter, in the book's order. */
export function chapterWords(chapter: KanjiChapter): BookWord[] {
  return chapter.lessons.flatMap(({ title, page, kanji }) =>
    kanji.flatMap(({ char, words }) =>
      words.map((word) => ({ ...word, id: wordId(chapter.level, chapter.chapter, word.word), headword: char, lesson: { title, page } })),
    ),
  );
}

/** How many cards a session shows. */
export const SESSION_SIZE = 20;

/**
 * The cards of a flashcard session on a chapter: the words of `wordIds` (a quiz's misses) when given, else the first
 * words not learned yet, in the book's order. When every word is learned, a random handful, to review.
 */
export function toFlashcards(chapter: KanjiChapter, learned: Set<string>, latest: LatestKanjiTest | undefined, wordIds: string[] | null): FlashcardsView {
  const words = chapterWords(chapter);
  const unlearned = words.filter((word) => !learned.has(word.id));
  const picked = wordIds
    ? words.filter((word) => wordIds.includes(word.id))
    : unlearned.length
      ? unlearned.slice(0, SESSION_SIZE)
      : shuffled(words).slice(0, SESSION_SIZE);
  const readings = new Map<string, FlashCard["kanji"][number]>([
    ...chapter.otherKanji.map(({ char, kun, on }) => [char, { char, kun, on, strokes: null }] as const),
    ...chapter.lessons.flatMap((lesson) => lesson.kanji.map(({ char, kun, on, strokes }) => [char, { char, kun, on, strokes }] as const)),
  ]);
  const examples = new Map(chapter.lessons.flatMap((lesson) => lesson.kanji.map(({ char, examples = [] }) => [char, examples] as const)));
  return {
    level: chapter.level,
    chapter: chapter.chapter,
    title: chapter.title,
    words: words.length,
    learned: words.length - unlearned.length,
    quiz: latest ? { id: latest.id, result: latest.result } : null,
    cards: picked.map((word) => ({
      wordId: word.id,
      word: word.word,
      reading: word.reading,
      meaning: word.meaning,
      learned: learned.has(word.id),
      lesson: word.lesson,
      kanji: [...new Set(word.word.match(/\p{Script=Han}/gu) ?? [])].flatMap((char) => readings.get(char) ?? []),
      headword: word.headword,
      related: words
        .filter((other) => other.headword === word.headword && other.id !== word.id)
        .map(({ word: related, reading }) => ({ word: related, reading })),
      examples: (examples.get(word.headword) ?? []).map(({ sentence, meaning }) => ({ sentence: splitTarget(sentence), meaning })),
    })),
  };
}

/** A copy of `items` in random order (Fisher–Yates). */
function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** The kanji page of a level: each chapter's learned words and newest quiz, and the figures over them. */
export function toKanjiHome(
  level: Level,
  chapters: KanjiChapter[],
  learned: Set<string>,
  latest: Map<number, LatestKanjiTest>,
): KanjiHomeView {
  const summaries = chapters.map((chapter): ChapterSummary => {
    const words = chapterWords(chapter);
    const quiz = latest.get(chapter.chapter);
    return {
      chapter: chapter.chapter,
      title: chapter.title,
      words: words.length,
      learned: words.filter((word) => learned.has(word.id)).length,
      quiz: quiz ? { id: quiz.id, result: quiz.result } : null,
    };
  });
  const quizzes = chapters.flatMap((chapter) => latest.get(chapter.chapter) ?? []);
  const percents = quizzes.flatMap(({ result }) => (result && result.total > 0 ? [(100 * result.score) / result.total] : []));
  return {
    level,
    chapters: summaries,
    stats: {
      learned: summaries.reduce((sum, chapter) => sum + chapter.learned, 0),
      words: summaries.reduce((sum, chapter) => sum + chapter.words, 0),
      average: percents.length ? Math.round(percents.reduce((sum, percent) => sum + percent, 0) / percents.length) : null,
      missed: new Set(quizzes.flatMap((quiz) => quiz.wrongIds).filter((id) => !learned.has(id))).size,
    },
  };
}
