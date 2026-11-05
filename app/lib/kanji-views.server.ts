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
 * The cards of a flashcard session on a chapter, or on its `lesson` when given: the words of `wordIds` (a quiz's misses)
 * when given, else the first words not learned yet, in the book's order, those of the `seen` session last. With `review`,
 * a random handful of the learned words. When every word is learned and it isn't a review, there are no cards.
 */
export function toFlashcards(
  chapter: KanjiChapter,
  learned: Set<string>,
  latest: LatestKanjiTest | undefined,
  wordIds: string[] | null,
  lesson: FlashcardsView["lesson"] = null,
  { seen = [], review = false }: { seen?: string[]; review?: boolean } = {},
): FlashcardsView {
  const all = chapterWords(chapter);
  const words = lesson ? all.filter((word) => word.lesson.page === lesson.page) : all;
  const unlearned = words.filter((word) => !learned.has(word.id));
  const seenIds = new Set(seen);
  const picked = wordIds
    ? words.filter((word) => wordIds.includes(word.id))
    : review
      ? shuffled(words).slice(0, SESSION_SIZE)
      : // New words first; the ones just missed come back only once they run out.
        [...unlearned.filter((word) => !seenIds.has(word.id)), ...unlearned.filter((word) => seenIds.has(word.id))].slice(0, SESSION_SIZE);
  const readings = new Map<string, FlashCard["kanji"][number]>([
    ...chapter.otherKanji.map(({ char, kun, on }) => [char, { char, kun, on, strokes: null }] as const),
    ...chapter.lessons.flatMap((lesson) => lesson.kanji.map(({ char, kun, on, strokes }) => [char, { char, kun, on, strokes }] as const)),
  ]);
  const examples = new Map(chapter.lessons.flatMap((lesson) => lesson.kanji.map(({ char, examples = [] }) => [char, examples] as const)));
  return {
    level: chapter.level,
    chapter: chapter.chapter,
    title: chapter.title,
    lesson,
    source: wordIds ? "picked" : review ? "review" : "new",
    nextLesson: lesson ? nextLessonOf(chapter, lesson.page) : null,
    size: SESSION_SIZE,
    words: words.length,
    learned: words.length - unlearned.length,
    quiz: latest ? { id: latest.id, result: latest.result } : null,
    cards: picked.map((word) => ({
      wordId: word.id,
      word: word.word,
      reading: word.reading,
      meaning: word.meaning,
      learned: learned.has(word.id),
      repeat: seenIds.has(word.id),
      lesson: word.lesson,
      kanji: [...new Set(word.word.match(/\p{Script=Han}/gu) ?? [])].flatMap((char) => readings.get(char) ?? []),
      headword: word.headword,
      related: all
        .filter((other) => other.headword === word.headword && other.id !== word.id)
        .map(({ word: related, reading }) => ({ word: related, reading })),
      examples: (examples.get(word.headword) ?? []).map(({ sentence, meaning }) => ({ sentence: splitTarget(sentence), meaning })),
    })),
  };
}

/** The lesson after the one on `page`, in the book's order; null after the last. */
function nextLessonOf(chapter: KanjiChapter, page: number): FlashcardsView["nextLesson"] {
  const next = chapter.lessons.find((each) => each.page > page);
  return next ? { title: next.title, page: next.page } : null;
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

/** The kanji page of a level: each chapter's learned words, by lesson too, and its newest quiz. */
export function toKanjiHome(
  level: Level,
  chapters: KanjiChapter[],
  learned: Set<string>,
  latest: Map<number, LatestKanjiTest>,
): KanjiHomeView {
  const learnedOf = (words: BookWord[]) => words.filter((word) => learned.has(word.id)).length;
  return {
    level,
    chapters: chapters.map((chapter): ChapterSummary => {
      const words = chapterWords(chapter);
      const quiz = latest.get(chapter.chapter);
      return {
        chapter: chapter.chapter,
        title: chapter.title,
        words: words.length,
        learned: learnedOf(words),
        lessons: chapter.lessons.map(({ title, page }) => {
          const ofLesson = words.filter((word) => word.lesson.page === page);
          return { title, page, words: ofLesson.length, learned: learnedOf(ofLesson) };
        }),
        quiz: quiz ? { id: quiz.id, result: quiz.result } : null,
      };
    }),
  };
}
