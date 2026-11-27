#!/usr/bin/env bash
# Print only the quiz-relevant part of lesson blocks: heading, gloss, meaning, Structure,
# Traps, Similar patterns. Skips 例文, Where you'll use it, 語彙 and 読み物 (about 75% of
# a block, and the quiz may not reuse them anyway).
#
#   bash .claude/skills/jlpt-grammar-quiz/digest.sh N2 w5            # a whole week
#   bash .claude/skills/jlpt-grammar-quiz/digest.sh N2 w5-d1 w5-d2   # days
#   bash .claude/skills/jlpt-grammar-quiz/digest.sh N3 w2-d3-g1      # one point
#   bash .claude/skills/jlpt-grammar-quiz/digest.sh N2 all           # every studied point
set -euo pipefail

level="${1:?usage: digest.sh <N1..N5> <w5 | w5-d1 | w5-d1-g2 | all>...}"
shift
[[ $# -gt 0 ]] || { echo "digest.sh: give at least one week, day or point" >&2; exit 1; }
dir="$HOME/Documents/JLPT 🇯🇵/$level/$level 文法 ノート"
[[ -d "$dir" ]] || { echo "digest.sh: no notes at $dir" >&2; exit 1; }

for sel in "$@"; do
  if [[ "$sel" == all ]]; then files=("$dir"/第*週.md); prefix=""
  else
    week="${sel#w}"; week="${week%%-*}"
    files=("$dir/第${week}週.md"); prefix="$sel"
    [[ -f "${files[0]}" ]] || { echo "digest.sh: no 第${week}週.md for $sel" >&2; exit 1; }
  fi
  # A block id matches when it equals the selector or starts with "<selector>-" (w5-d1 ≠ w5-d10).
  awk -v p="$prefix" '
    /<!-- lesson:.* start -->/ {
      id = $0; sub(/.*lesson:/, "", id); sub(/ start.*/, "", id)
      on = (p == "" || id == p || index(id, p "-") == 1); keep = on
      if (on) print "<!-- " id " -->"
      next
    }
    /<!-- lesson:.* end -->/ { on = 0; next }
    on && /^### (Where you.ll use it|例文|N[1-5] 語彙|読み物)/ { keep = 0 }
    on && /^### / && !/^### (Where you.ll use it|例文|N[1-5] 語彙|読み物)/ { keep = 1 }
    keep && !/^<a id=/ && NF { print }
  ' "${files[@]}"
done
