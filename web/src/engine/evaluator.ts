import type { Card } from "./cards";

export enum HandCategory {
  HighCard,
  Pair,
  TwoPair,
  ThreeOfAKind,
  Straight,
  Flush,
  FullHouse,
  FourOfAKind,
  StraightFlush,
}

function score5(cards: Card[]): number {
  const counts = new Map<number, number>();
  for (const c of cards) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const ranks = groups.map(([r]) => r);
  const flush = cards.every((c) => c.suit === cards[0].suit);

  let straight = false;
  let high = ranks[0];
  if (groups.length === 5) {
    if (ranks[0] - ranks[4] === 4) straight = true;
    else if (ranks.join() === "12,3,2,1,0") {
      straight = true;
      high = 3; // wheel: A-2-3-4-5 plays as a 5-high straight
    }
  }

  const top = groups[0][1];
  const second = groups[1]?.[1] ?? 0;
  let cat: HandCategory;
  if (straight && flush) cat = HandCategory.StraightFlush;
  else if (top === 4) cat = HandCategory.FourOfAKind;
  else if (top === 3 && second === 2) cat = HandCategory.FullHouse;
  else if (flush) cat = HandCategory.Flush;
  else if (straight) cat = HandCategory.Straight;
  else if (top === 3) cat = HandCategory.ThreeOfAKind;
  else if (top === 2 && second === 2) cat = HandCategory.TwoPair;
  else if (top === 2) cat = HandCategory.Pair;
  else cat = HandCategory.HighCard;

  const tiebreak = straight ? [high] : ranks;
  // Base-13 encoding, padded to 5 slots, so scores compare as plain numbers.
  let t = 0;
  for (let i = 0; i < 5; i++) t = t * 13 + (tiebreak[i] ?? 0);
  return cat * 13 ** 5 + t;
}

/** Score of the best 5-card hand among 5 to 7 cards. Higher is better. */
export function evaluate(cards: Card[]): number {
  if (cards.length < 5 || cards.length > 7)
    throw new Error("evaluate() needs 5 to 7 cards");
  let best = -1;
  const pick: Card[] = [];
  const walk = (start: number) => {
    if (pick.length === 5) {
      best = Math.max(best, score5(pick));
      return;
    }
    for (let i = start; i <= cards.length - (5 - pick.length); i++) {
      pick.push(cards[i]);
      walk(i + 1);
      pick.pop();
    }
  };
  walk(0);
  return best;
}

export const categoryOf = (score: number): HandCategory =>
  Math.floor(score / 13 ** 5);

/** 1 if a wins, -1 if b wins, 0 for a split pot. */
export function compareHands(a: Card[], b: Card[]): 1 | -1 | 0 {
  const x = evaluate(a);
  const y = evaluate(b);
  return x > y ? 1 : x < y ? -1 : 0;
}
