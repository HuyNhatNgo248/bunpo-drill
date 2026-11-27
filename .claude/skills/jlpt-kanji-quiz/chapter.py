#!/usr/bin/env python3
"""Turn a chapter's notes (第N章.md / 第N課.md, the format in jlpt-kanji-quiz-terminal step 3) into the app's chapter JSON.

    python3 chapter.py N2 "<notes folder>/第1章.md" > "$TMPDIR/kanji-chapter-N2-1.json"

Words marked ⚠要確認 are left out. Exits 1 on a line it can't parse, so nothing half-built is sent.
"""
import json, re, sys

HEAD = re.compile(r"^- \*\*(.)\*\*（(\d+)）([^／]*)／(.*?) — (.*)$")
OTHER = re.compile(r"^- \*\*(.)\*\* ([^／]*)／(.*)$")
WORD = re.compile(r"(△?)([^、（]+)（([^｜）]+)｜([^）]*)）")


def readings(s):
    return [r for r in s.strip().split("・") if r]


def parse(level, text):
    m = re.search(r"^# 第(\d+)([章課])\s*(.*)$", text, re.M)
    if not m:
        sys.exit("chapter.py: no '# 第N章 …' heading")
    chapter, unit, title = int(m[1]), m[2], re.sub(r"（.*$", "", m[3]).strip()
    out = {"version": 1, "level": level, "chapter": chapter, "title": title or f"第{chapter}{unit}", "lessons": [], "otherKanji": []}
    lesson = kanji = None
    other = False
    for n, line in enumerate(text.splitlines(), 1):
        if line.startswith("## "):
            other = line.strip() == "## 他の漢字"
            if not other:
                h = re.match(r"^## (.+?)（p\.(\d+)）", line)
                if not h:
                    sys.exit(f"chapter.py: line {n}: lesson heading without （p.N）: {line}")
                lesson = {"title": h[1].strip(), "page": int(h[2]), "kanji": []}
                out["lessons"].append(lesson)
        elif line.startswith("  - 例："):
            sentence, _, meaning = line[len("  - 例："):].partition("｜")
            kanji.setdefault("examples", []).append({"sentence": sentence.strip(), "meaning": meaning.strip()})
        elif line.startswith("- **"):
            if other:
                o = OTHER.match(line)
                if not o:
                    sys.exit(f"chapter.py: line {n}: can't read 他の漢字 line: {line}")
                out["otherKanji"].append({"char": o[1], "kun": readings(o[2]), "on": readings(o[3])})
                continue
            h = HEAD.match(line)
            if not h or lesson is None:
                sys.exit(f"chapter.py: line {n}: can't read headword line: {line}")
            found = WORD.findall(h[5])
            if len(found) != h[5].count("｜"):  # a word the regex skipped would vanish from the cards
                sys.exit(f"chapter.py: line {n}: read {len(found)} of {h[5].count('｜')} words: {line}")
            words = []
            for rare, word, reading, meaning in found:
                if "⚠" in word + reading + meaning:
                    continue
                w = {"word": word.strip(), "reading": reading.split("／")[0].strip(), "meaning": meaning.strip()}
                if rare:
                    w["rare"] = True
                words.append(w)
            kanji = {"char": h[1], "strokes": int(h[2]), "kun": readings(h[3]), "on": readings(h[4]), "words": words}
            lesson["kanji"].append(kanji)
    return out


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in {"N5", "N4", "N3", "N2", "N1"}:
        sys.exit("usage: chapter.py <N5..N1> <第N章.md>")
    with open(sys.argv[2], encoding="utf-8") as f:
        print(json.dumps(parse(sys.argv[1], f.read()), ensure_ascii=False))
