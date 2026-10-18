export type Card = { rank: number; suit: number }; // rank 0 = '2' ... 12 = 'A'; suit 0..3 = s h d c

export const RANKS = "23456789TJQKA";
export const SUITS = "shdc";

export function parseCard(text: string): Card {
  const s = text.trim();
  const rank = RANKS.indexOf(s[0]?.toUpperCase() ?? "");
  const suit = SUITS.indexOf(s[1]?.toLowerCase() ?? "");
  if (s.length !== 2 || rank < 0 || suit < 0) {
    throw new Error(`Invalid card: "${text}"`);
  }
  return { rank, suit };
}

export function parseCards(text: string): Card[] {
  const t = text.trim();
  if (!t) return [];
  return t.split(/[\s,]+/).map(parseCard);
}

export function cardToString(c: Card): string {
  return RANKS[c.rank] + SUITS[c.suit];
}

export function newDeck(rng: () => number = Math.random): Card[] {
  const deck: Card[] = [];
  for (let rank = 0; rank < 13; rank++)
    for (let suit = 0; suit < 4; suit++) deck.push({ rank, suit });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** True when no card appears twice (used to validate manual hand entry). */
export function allUnique(cards: Card[]): boolean {
  return new Set(cards.map(cardToString)).size === cards.length;
}
