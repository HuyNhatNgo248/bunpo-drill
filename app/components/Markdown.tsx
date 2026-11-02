import type { ReactNode } from "react";

/** The inline marks: `code`, **bold**, ~~struck~~, *italic*, [a link](https://…). */
const INLINE = /`([^`]+)`|\*\*(.+?)\*\*|~~(.+?)~~|\*([^*\s][^*]*?)\*|\[([^\]]+)\]\(([^)\s]+)\)/;

const LIST_ITEM = /^\s*(?:([-*+])|\d+[.)])\s+(.*)$/;
const HEADING = /^#{1,3}\s+(.*)$/;

type Block = { kind: "p" | "h"; lines: string[] } | { kind: "ul" | "ol"; lines: string[] };

/**
 * A memo written in Markdown, drawn as React elements, so whatever it holds is only ever text: paragraphs (a line break
 * is kept), `#` headings, `-` and `1.` lists, **bold**, *italic*, ~~strikethrough~~, `code`, and links to http(s) and
 * mailto addresses, which open in a new tab. Anything else shows as written.
 * shortcut: a small subset of Markdown (no tables, quotes, code blocks or nesting); use react-markdown if more is needed.
 */
export function Markdown({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {blocksOf(text).map((block, i) => {
        if (block.kind === "h") return <p key={i} className="font-semibold">{inline(block.lines[0])}</p>;
        if (block.kind === "p") {
          return <p key={i}>{block.lines.flatMap((line, j) => (j === 0 ? inline(line) : [<br key={`br${j}`} />, ...inline(line)]))}</p>;
        }
        const List = block.kind;
        return (
          <List key={i} className={List === "ul" ? "list-disc pl-5" : "list-decimal pl-5"}>
            {block.lines.map((line, j) => (
              <li key={j}>{inline(line)}</li>
            ))}
          </List>
        );
      })}
    </div>
  );
}

/** The lines grouped into paragraphs, headings and lists; a blank line ends a paragraph. */
function blocksOf(text: string): Block[] {
  const blocks: Block[] = [];
  for (const line of text.split(/\r?\n/)) {
    const last = blocks.at(-1);
    const item = LIST_ITEM.exec(line);
    const heading = HEADING.exec(line);
    if (!line.trim()) blocks.push({ kind: "p", lines: [] });
    else if (heading) blocks.push({ kind: "h", lines: [heading[1]] });
    else if (item) {
      const kind = item[1] ? "ul" : "ol";
      if (last?.kind === kind) last.lines.push(item[2]);
      else blocks.push({ kind, lines: [item[2]] });
    } else if (last?.kind === "p") last.lines.push(line);
    else blocks.push({ kind: "p", lines: [line] });
  }
  return blocks.filter((block) => block.lines.length > 0);
}

/** One line with its inline marks drawn; marks inside bold, struck, italic and link text are drawn too. */
function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let rest = text;
  while (rest) {
    const match = INLINE.exec(rest);
    if (!match) {
      nodes.push(rest);
      break;
    }
    if (match.index > 0) nodes.push(rest.slice(0, match.index));
    const [whole, code, bold, struck, italic, label, href] = match;
    const key = nodes.length;
    if (code !== undefined) {
      nodes.push(
        <code key={key} className="rounded-sm bg-muted px-1 font-mono">
          {code}
        </code>,
      );
    } else if (bold !== undefined) nodes.push(<strong key={key}>{inline(bold)}</strong>);
    else if (struck !== undefined) nodes.push(<s key={key}>{inline(struck)}</s>);
    else if (italic !== undefined) nodes.push(<em key={key}>{inline(italic)}</em>);
    else if (/^(https?:|mailto:)/i.test(href)) {
      nodes.push(
        <a key={key} href={href} target="_blank" rel="noreferrer" className="text-indigo underline underline-offset-4">
          {inline(label)}
        </a>,
      );
    } else nodes.push(whole);
    rest = rest.slice(match.index + whole.length);
  }
  return nodes;
}
