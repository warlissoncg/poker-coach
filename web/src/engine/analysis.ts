import type { Card } from "./cards";
import { categoryOf, evaluate } from "./evaluator";

export type Texture = "dry" | "wet" | "paired" | "mono";
export type Tier = "strong" | "medium" | "draw" | "air";

/** Flop texture: monotone, paired, wet (two-tone or connected) or dry. */
export function textureOf(board: Card[]): Texture {
  if (board.length < 3) throw new Error("Need at least a flop");
  const flop = board.slice(0, 3);
  const suitCounts = [0, 1, 2, 3].map((s) => flop.filter((c) => c.suit === s).length);
  const ranks = flop.map((c) => c.rank).sort((a, b) => a - b);
  const maxSuit = Math.max(...suitCounts);
  if (maxSuit === 3) return "mono";
  if (new Set(ranks).size < 3) return "paired";
  return maxSuit === 2 || ranks[2] - ranks[0] <= 4 ? "wet" : "dry";
}

function boardCategory(board: Card[]): number {
  if (board.length >= 5) return categoryOf(evaluate(board));
  const counts = new Map<number, number>();
  board.forEach((c) => counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1));
  const v = [...counts.values()];
  if (v.some((n) => n >= 3)) return 3;
  const pairs = v.filter((n) => n === 2).length;
  return pairs >= 2 ? 2 : pairs === 1 ? 1 : 0;
}

/** Rough hand-strength bucket for a 2-card hand on a 3-5 card board (coach-rules, not solver). */
export function handTier(hole: Card[], board: Card[]): Tier {
  const heroCat = categoryOf(evaluate([...hole, ...board]));
  if (heroCat >= 2 && heroCat > boardCategory(board)) return "strong";

  const topRank = Math.max(...board.map((c) => c.rank));
  const matches = hole.filter((h) => board.some((b) => b.rank === h.rank));
  if (hole[0].rank === hole[1].rank && matches.length === 0)
    return hole[0].rank > topRank ? "strong" : "medium";
  if (matches.length > 0) return matches.some((h) => h.rank === topRank) ? "strong" : "medium";

  if (board.length < 5) {
    const all = [...hole, ...board];
    for (let s = 0; s < 4; s++)
      if (all.filter((c) => c.suit === s).length >= 4 && hole.some((h) => h.suit === s)) return "draw";
    const ranks = new Set(all.map((c) => c.rank));
    if (ranks.has(12)) ranks.add(-1); // ace plays low
    for (let lo = -1; lo <= 8; lo++) {
      let present = 0;
      let usesHole = false;
      for (let r = lo; r < lo + 5; r++) {
        if (ranks.has(r)) {
          present++;
          if (hole.some((h) => h.rank === r || (r === -1 && h.rank === 12))) usesHole = true;
        }
      }
      if (present >= 4 && usesHole) return "draw";
    }
  }
  return "air";
}

/** Chen formula score for a starting hand (a rough strength ranking, not a solver range). */
export function chenScore(hole: Card[]): number {
  const [a, b] = [...hole].sort((x, y) => y.rank - x.rank);
  const pts = (r: number) => (r === 12 ? 10 : r === 11 ? 8 : r === 10 ? 7 : r === 9 ? 6 : (r + 2) / 2);
  let s = pts(a.rank);
  if (a.rank === b.rank) return Math.ceil(Math.max(5, s * 2));
  if (a.suit === b.suit) s += 2;
  const gap = a.rank - b.rank - 1;
  s -= [0, 1, 2, 4][gap] ?? 5;
  if (gap <= 1 && a.rank < 10) s += 1;
  return Math.ceil(s);
}

/** Equity needed to call: toCall / (pot after the opponent's bet + toCall). */
export function requiredEquity(toCall: number, potBeforeCall: number): number {
  return toCall / (potBeforeCall + toCall);
}

export interface Reference {
  preferred: string[];
  acceptable: string[];
  source: "coach-rules"; // never presented as solver output
}

export function preflopReference(spot: "btn_open" | "bb_defend", hole: Card[]): Reference {
  const c = chenScore(hole);
  if (spot === "btn_open") {
    if (c >= 6) return { preferred: ["raise"], acceptable: [], source: "coach-rules" };
    if (c === 5) return { preferred: ["raise"], acceptable: ["fold"], source: "coach-rules" };
    return { preferred: ["fold"], acceptable: [], source: "coach-rules" };
  }
  if (c >= 11) return { preferred: ["3bet"], acceptable: ["call"], source: "coach-rules" };
  if (c >= 6) return { preferred: ["call"], acceptable: [], source: "coach-rules" };
  if (c === 5) return { preferred: ["call"], acceptable: ["fold"], source: "coach-rules" };
  if (c === 4) return { preferred: ["fold"], acceptable: ["call"], source: "coach-rules" };
  return { preferred: ["fold"], acceptable: [], source: "coach-rules" };
}
