import { allUnique, type Card } from "./cards";
import { evaluate } from "./evaluator";

export type Street = "preflop" | "flop" | "turn" | "river" | "showdown" | "complete";

export interface Player {
  id: string;
  position: string;
  stack: number; // chips behind
  hole: Card[];
  committed: number; // chips put in on the current street
  total: number; // chips put in over the whole hand
  folded: boolean;
  allIn: boolean;
  canRaise: boolean;
}

export type Action =
  | { type: "fold" }
  | { type: "check" }
  | { type: "call" }
  | { type: "bet"; to: number }
  | { type: "raise"; to: number };

export interface LoggedAction {
  street: Street;
  playerId: string;
  action: Action;
  added: number; // chips added to the pot by this action
}

export interface HandState {
  players: Player[];
  bb: number;
  deadMoney: number; // e.g. a folded small blind
  preflopOrder: string[];
  postflopOrder: string[];
  boardRunout: Card[]; // all 5 future cards; never shown until dealt
  board: Card[]; // visible community cards only
  street: Street;
  currentBet: number;
  lastRaiseSize: number;
  pending: string[]; // players still to act this round, in order
  history: LoggedAction[];
}

export interface LegalActions {
  playerId: string;
  fold: boolean;
  check: boolean;
  call: number | null; // chips needed (capped at stack)
  bet: { min: number; max: number } | null; // "to" amounts
  raise: { min: number; max: number } | null; // "to" amounts
}

export interface HandConfig {
  players: { id: string; position: string; stack: number; hole: Card[] }[];
  bb: number;
  posted?: Record<string, number>;
  blindLevel?: number; // price to call when a blind is dead money
  deadMoney?: number;
  preflopOrder: string[];
  postflopOrder: string[];
  boardRunout: Card[];
}

const NEXT: Partial<Record<Street, Street>> = { preflop: "flop", flop: "turn", turn: "river" };
const BOARD_SIZE: Partial<Record<Street, number>> = { flop: 3, turn: 4, river: 5 };

const find = (s: HandState, id: string) => {
  const p = s.players.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown player: ${id}`);
  return p;
};
const isActive = (p: Player) => !p.folded && !p.allIn;

export function createHand(cfg: HandConfig): HandState {
  if (cfg.boardRunout.length !== 5) throw new Error("boardRunout must have 5 cards");
  const all = [...cfg.players.flatMap((p) => p.hole), ...cfg.boardRunout];
  if (!allUnique(all)) throw new Error("Duplicate cards in hand setup");
  const ids = new Set(cfg.players.map((p) => p.id));
  for (const id of [...cfg.preflopOrder, ...cfg.postflopOrder])
    if (!ids.has(id)) throw new Error(`Unknown player in order: ${id}`);

  const players: Player[] = cfg.players.map((p) => {
    const posted = Math.min(cfg.posted?.[p.id] ?? 0, p.stack);
    return { ...p, stack: p.stack - posted, committed: posted, total: posted,
      folded: false, allIn: p.stack - posted === 0, canRaise: true };
  });
  const s: HandState = {
    players, bb: cfg.bb, deadMoney: cfg.deadMoney ?? 0,
    preflopOrder: cfg.preflopOrder, postflopOrder: cfg.postflopOrder,
    boardRunout: cfg.boardRunout, board: [], street: "preflop",
    currentBet: Math.max(cfg.blindLevel ?? 0, ...players.map((p) => p.committed)),
    lastRaiseSize: cfg.bb, pending: [], history: [],
  };
  s.pending = cfg.preflopOrder.filter((id) => isActive(find(s, id)));
  settle(s);
  return s;
}

export function potSize(s: HandState): number {
  return s.deadMoney + s.players.reduce((a, p) => a + p.total, 0);
}

export function legalActions(s: HandState): LegalActions | null {
  if (s.pending.length === 0) return null;
  const p = find(s, s.pending[0]);
  const toCall = s.currentBet - p.committed;
  const maxTo = p.committed + p.stack;
  return {
    playerId: p.id,
    fold: toCall > 0,
    check: toCall === 0,
    call: toCall > 0 ? Math.min(toCall, p.stack) : null,
    bet: s.currentBet === 0 && p.stack > 0 ? { min: Math.min(s.bb, maxTo), max: maxTo } : null,
    raise:
      s.currentBet > 0 && p.canRaise && p.stack > toCall
        ? { min: Math.min(s.currentBet + s.lastRaiseSize, maxTo), max: maxTo }
        : null,
  };
}

function commit(p: Player, amount: number) {
  p.stack -= amount;
  p.committed += amount;
  p.total += amount;
  if (p.stack === 0) p.allIn = true;
}

export function applyAction(state: HandState, action: Action): HandState {
  const legal = legalActions(state);
  if (!legal) throw new Error("No action is possible in this state");
  const s = structuredClone(state);
  const p = find(s, legal.playerId);
  const street = s.street;
  let added = 0;

  switch (action.type) {
    case "fold":
      if (!legal.fold) throw new Error("Illegal action: fold");
      p.folded = true;
      s.pending.shift();
      break;
    case "check":
      if (!legal.check) throw new Error("Illegal action: check");
      s.pending.shift();
      break;
    case "call":
      if (legal.call === null) throw new Error("Illegal action: call");
      added = legal.call;
      commit(p, added);
      s.pending.shift();
      break;
    case "bet":
    case "raise": {
      const range = action.type === "bet" ? legal.bet : legal.raise;
      if (!range) throw new Error(`Illegal action: ${action.type}`);
      if (!Number.isInteger(action.to) || action.to < range.min || action.to > range.max)
        throw new Error(`Illegal size: ${action.type} to ${action.to} (allowed ${range.min}-${range.max})`);
      added = action.to - p.committed;
      const raiseSize = action.to - s.currentBet;
      const full = raiseSize >= s.lastRaiseSize;
      const waiting = new Set(s.pending);
      commit(p, added);
      s.currentBet = Math.max(s.currentBet, action.to);
      if (full) {
        s.lastRaiseSize = raiseSize;
        s.players.forEach((q) => (q.canRaise = true));
      } else {
        // short all-in: players who already acted may call or fold, not re-raise
        s.players.forEach((q) => { if (q.id !== p.id && !waiting.has(q.id)) q.canRaise = false; });
      }
      const order = street === "preflop" ? s.preflopOrder : s.postflopOrder;
      const i = order.indexOf(p.id);
      s.pending = [...order.slice(i + 1), ...order.slice(0, i)].filter((id) => {
        const q = find(s, id);
        return isActive(q) && q.committed < s.currentBet;
      });
      break;
    }
  }
  s.history.push({ street, playerId: p.id, action, added });
  settle(s);
  return s;
}

/** Closes finished betting rounds, deals streets, and detects the end of the hand. */
function settle(s: HandState) {
  const live = s.players.filter((p) => !p.folded);
  if (live.length === 1) { s.street = "complete"; s.pending = []; return; }
  if (s.pending.length > 0) return;
  for (;;) {
    if (s.street === "river") { s.street = "showdown"; return; }
    s.street = NEXT[s.street]!;
    s.board = s.boardRunout.slice(0, BOARD_SIZE[s.street]!);
    s.players.forEach((p) => { p.committed = 0; p.canRaise = true; });
    s.currentBet = 0;
    s.lastRaiseSize = s.bb;
    if (live.filter((p) => !p.allIn).length <= 1) continue; // nobody can act: run it out
    s.pending = s.postflopOrder.filter((id) => isActive(find(s, id)));
    return;
  }
}

/** Chips returned to each player at the end of the hand, side pots included. */
export function payouts(s: HandState): Record<string, number> {
  if (s.street !== "showdown" && s.street !== "complete")
    throw new Error("Hand is not finished");
  const out: Record<string, number> = Object.fromEntries(s.players.map((p) => [p.id, 0]));
  const live = s.players.filter((p) => !p.folded);
  const score = new Map(
    live.map((p) => [p.id, live.length > 1 ? evaluate([...p.hole, ...s.boardRunout]) : 0]),
  );
  const levels = [...new Set(s.players.map((p) => p.total).filter((t) => t > 0))].sort((a, b) => a - b);
  let prev = 0;
  levels.forEach((lvl, idx) => {
    let amount = s.players.reduce((a, p) => a + Math.min(p.total, lvl) - Math.min(p.total, prev), 0);
    if (idx === 0) amount += s.deadMoney;
    let eligible = live.filter((p) => p.total >= lvl);
    if (eligible.length === 0) eligible = live;
    const top = Math.max(...eligible.map((p) => score.get(p.id)!));
    const winners = eligible.filter((p) => score.get(p.id) === top);
    const share = Math.floor(amount / winners.length);
    winners.forEach((w, i) => (out[w.id] += share + (i < amount - share * winners.length ? 1 : 0)));
    prev = lvl;
  });
  return out;
}

/** Net chips won or lost by each player (payout minus total invested). */
export function netResults(s: HandState): Record<string, number> {
  const pay = payouts(s);
  return Object.fromEntries(s.players.map((p) => [p.id, pay[p.id] - p.total]));
}
