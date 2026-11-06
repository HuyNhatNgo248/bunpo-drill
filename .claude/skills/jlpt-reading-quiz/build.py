#!/usr/bin/env python3
"""Turn reading sets written in the short text format (see SKILL.md) into the app's JSON, check them, and send them.

    python3 build.py sets.txt [more.txt …]          # build, check, then POST each set with post.sh
    python3 build.py --dry sets.txt                 # build and check only

Each set is written to $TMPDIR/reading-<title>.json. A set with a problem is reported and not sent.
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.realpath(__file__))
TYPES = {"short": "reading-short", "mid": "reading-mid", "long": "reading-long", "int": "reading-integrated", "claim": "reading-claim", "info": "reading-info"}
LEVELS = {"N5", "N4", "N3", "N2", "N1"}
ORDER = list(TYPES.values())
TRAPS = {"cd": "changed-detail", "op": "opposite", "ni": "not-in-text", "tn": "true-not-answer", "og": "over-general", "mc": "missed-condition"}
KINDS = {"理由", "指示語", "主張", "詳細", "比較", "条件"}


def parse(text):
    sets, s, p, q = [], None, None, None
    for n, raw in enumerate(text.splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#!") or line.startswith("//"):
            continue
        where = f"line {n}"
        if line.startswith("### "):
            s = {"title": line[4:].strip(), "level": "N2", "passages": []}
            sets.append(s)
            p = q = None
            continue
        if line.startswith("@"):
            kind = line[1:].strip()
            if kind not in TYPES:
                sys.exit(f"{where}: unknown type @{kind}")
            p = {"type": TYPES[kind], "P": [], "A": [], "B": [], "TH": None, "TR": [], "F": [], "notes": [], "questions": [], "lead": None, "tip": None}
            s["passages"].append(p)
            q = None
            continue
        key, _, value = line.partition(":")
        key, value = key.strip(), value.strip()
        if key == "LEVEL" and s is not None:
            if value not in LEVELS:
                sys.exit(f"{where}: LEVEL must be one of {' '.join(sorted(LEVELS))}")
            s["level"] = value
            continue
        if p is None:
            sys.exit(f"{where}: write @type before the passage")
        if key in ("P", "A", "B", "F"):
            p[key].append(value)
        elif key == "L":
            p["lead"] = value
        elif key == "T":
            p["tip"] = value
        elif key == "N":
            word, _, gloss = value.partition("=")
            p["notes"].append({"word": word.strip(), "gloss": gloss.strip()})
        elif key == "TH":
            p["TH"] = [c.strip() for c in value.split("|")]
        elif key == "TR":
            p["TR"].append([c.strip() for c in value.split("|")])
        elif key == "Q":
            q = {"prompt": value, "choices": [], "traps": [], "answer": None, "kind": None, "evidence": None, "explanation": None}
            p["questions"].append(q)
        elif re.fullmatch(r"[1-4]\*?", key):
            if q is None:
                sys.exit(f"{where}: a choice before its Q")
            choice, _, trap = value.partition("~")
            if key.endswith("*"):
                q["answer"] = len(q["choices"])
                q["traps"].append(None)
            else:
                code = trap.strip()
                if code not in TRAPS:
                    sys.exit(f"{where}: wrong choice needs a trap ~ {'/'.join(TRAPS)}")
                q["traps"].append(TRAPS[code])
            q["choices"].append(choice.strip())
        elif key in ("K", "E", "X"):
            if q is None:
                sys.exit(f"{where}: {key} before its Q")
            q[{"K": "kind", "E": "evidence", "X": "explanation"}[key]] = value
        else:
            sys.exit(f"{where}: unknown line {key}:")
    return sets


def blocks_of(p):
    if p["A"] or p["B"]:
        return [{"kind": "text", "label": "A", "text": "\n".join(p["A"])}, {"kind": "text", "label": "B", "text": "\n".join(p["B"])}]
    blocks = []
    if p["P"]:
        blocks.append({"kind": "text", "text": "\n".join(p["P"])})
    if p["TH"]:
        blocks.append({"kind": "table", "head": p["TH"], "rows": p["TR"]})
    if p["F"]:
        blocks.append({"kind": "text", "text": "\n".join(p["F"])})
    return blocks


def build(s):
    problems, sections, num = [], {}, 0
    for i, p in enumerate(s["passages"], 1):
        blocks = blocks_of(p)
        texts = [re.sub(r"</?u>", "", b["text"]) for b in blocks if b["kind"] == "text"] + [c for b in blocks if b["kind"] == "table" for r in b["rows"] for c in r]
        for note in p["notes"]:
            if not any(note["word"] in t for t in texts):
                problems.append(f"{s['title']} passage {i}: （注）「{note['word']}」 is not in the passage")
        questions = []
        for q in p["questions"]:
            num += 1
            where = f"{s['title']} passage {i} q{num}"
            if len(q["choices"]) != 4 or q["answer"] is None:
                problems.append(f"{where}: needs 4 choices, one marked *")
            if q["kind"] not in KINDS:
                problems.append(f"{where}: K must be one of {' '.join(sorted(KINDS))}")
            found = sum(t.count(q["evidence"] or "\0") for t in texts)
            if found != 1:
                problems.append(f"{where}: evidence found {found} times: {q['evidence']}")
            for word in re.findall(r"<u>(.*?)</u>", q["prompt"]):
                if not any(word in t for t in texts):
                    problems.append(f"{where}: underlined 「{word}」 is not in the passage")
            questions.append({"id": f"q{num}", "prompt": q["prompt"], "choices": q["choices"], "answerIndex": q["answer"], "kind": q["kind"],
                              "traps": q["traps"], "evidence": q["evidence"], "explanation": q["explanation"] or "See the evidence."})
        passage = {"blocks": blocks, "notes": p["notes"], "questions": questions}
        if p["lead"]:
            passage["lead"] = p["lead"]
        if p["tip"]:
            passage["tip"] = p["tip"]
        sections.setdefault(p["type"], []).append(passage)
    # Sections in the exam's order; ids follow that order.
    ordered = [{"type": t, "passages": sections[t]} for t in ORDER if t in sections]
    num = 0
    for section in ordered:
        for passage in section["passages"]:
            for question in passage["questions"]:
                num += 1
                question["id"] = f"q{num}"
    answers = [q["answerIndex"] for sec in ordered for p in sec["passages"] for q in p["questions"]]
    return {"version": 1, "kind": "reading", "title": s["title"], "level": s["level"], "sections": ordered}, problems, answers


def main():
    args = sys.argv[1:]
    dry = "--dry" in args
    files = [a for a in args if a != "--dry"]
    if not files:
        sys.exit(__doc__)
    tmp = os.environ.get("TMPDIR", "/tmp")
    failed = False
    for name in files:
        for s in parse(open(name, encoding="utf-8").read()):
            payload, problems, answers = build(s)
            spread = " ".join(str(a + 1) for a in answers)
            if problems:
                failed = True
                print(f"✗ {s['title']}\n  " + "\n  ".join(problems))
                continue
            path = os.path.join(tmp, f"reading-{s['title'].replace(' ', '-')}.json")
            with open(path, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=1)
            if dry:
                print(f"✓ {s['title']} ({len(answers)} questions, answers {spread}) → {path}")
                continue
            result = subprocess.run(["bash", os.path.join(HERE, "post.sh"), path], capture_output=True, text=True)
            if result.returncode:
                failed = True
                print(f"✗ {s['title']}\n{result.stdout}{result.stderr}")
            else:
                print(f"✓ {s['title']} ({len(answers)} questions) {result.stdout.strip().splitlines()[-1]}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
