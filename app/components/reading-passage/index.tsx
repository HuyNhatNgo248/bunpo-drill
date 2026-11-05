import { NotedText } from "~/components/noted-text";
import { cn } from "~/lib/utils";
import type { ReadingPassageView, ReadingRun } from "~/lib/views";

/** Runs of a reading text: underlined as the exam underlines them, and the evidence of an answer tinted green. */
export function ReadingRuns({ runs }: { runs: ReadingRun[] }) {
  return runs.map((run, i) => (
    <span
      key={i}
      className={cn(
        run.underline && "underline decoration-[1.5px] underline-offset-[0.35em]",
        run.evidence && "rounded-sm bg-success-soft shadow-[inset_0_-2px_0_var(--success)]",
      )}
    >
      <NotedText text={run.text} />
    </span>
  ));
}

/** The words of a run list, as one sentence, for a note taken on it. */
const sentenceOf = (runs: ReadingRun[]) => runs.map((run) => run.text).join("");

/**
 * A reading passage's text: the line that leads into it, its texts (A and B of 統合理解 under their labels) and tables,
 * then its （注）.
 */
export function ReadingBody({ passage }: { passage: ReadingPassageView }) {
  return (
    <div lang="ja" className="flex flex-col gap-3 font-jp">
      {passage.lead && <p className="text-sm text-subtle-foreground md:text-body-sm">{passage.lead}</p>}
      {passage.blocks.map((block, b) =>
        block.kind === "text" ? (
          <div key={b} className={cn("flex flex-col gap-2", block.label && "rounded-box border p-3 md:p-4")}>
            {block.label && <span className="font-sans text-caption font-bold text-secondary-foreground">{block.label}</span>}
            {block.paragraphs.map((paragraph, p) => (
              <p key={p} data-note-sentence={sentenceOf(paragraph)} className="text-base leading-passage md:text-prompt">
                <ReadingRuns runs={paragraph} />
              </p>
            ))}
          </div>
        ) : (
          // A wide table scrolls in its own box on a phone.
          <div key={b} className="overflow-x-auto rounded-box border">
            <table className="w-full border-collapse text-sm md:text-body-sm">
              <thead className="bg-muted text-left">
                <tr>
                  {block.head.map((cell, c) => (
                    <th key={c} scope="col" className="px-3 py-2 font-semibold whitespace-nowrap">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r} className="border-t">
                    {row.map((cell, c) => (
                      <td key={c} className="px-3 py-2 align-top leading-relaxed">
                        <ReadingRuns runs={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      )}
      {passage.notes.length > 0 && (
        <dl className="flex flex-col gap-0.5 border-t pt-2.5 text-caption text-subtle-foreground">
          {passage.notes.map(({ word, gloss }, n) => (
            <div key={word} className="flex gap-1">
              {/* Numbered only when there are several, as the exam does. */}
              <dt>
                （注{passage.notes.length > 1 ? n + 1 : ""}）{word}：
              </dt>
              <dd>{gloss}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
