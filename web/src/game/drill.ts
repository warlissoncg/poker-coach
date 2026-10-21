import { newDeck } from "../engine/cards";
import { applyAction, createHand, legalActions, netResults, potSize, type Action, type HandState } from "../engine/hand";
import { chenScore, handTier, preflopReference, requiredEquity, textureOf, type Texture, type Tier } from "../engine/analysis";

export type Rng = () => number;
export interface Feedback { spot: string; label: string; action: string; preferred: string[]; acceptable: string[]; verdict: "good" | "ok" | "miss"; score: number; deviation: string; why: string }
export interface LogEntry { street: string; text: string }
export interface Drill { hand: HandState; feedback: Feedback[]; log: LogEntry[] }

export const HERO = "btn";
export const VILLAIN = "bb";
const TEX: Record<Texture, string> = { dry: "dry", wet: "wet / connected", paired: "paired", mono: "monotone" };
const TIER_TEXT: Record<Tier, string> = { strong: "a strong made hand", medium: "a medium-strength made hand", draw: "a drawing hand", air: "a weak hand with little showdown value" };
export const bb = (chips: number) => `${Math.round(chips) / 100}bb`;
const isLive = (h: HandState) => h.street !== "complete" && h.street !== "showdown";
export const isOver = (d: Drill) => !isLive(d.hand);

export function spotLabel(key: string): string {
  if (key === "btn_open") return "BTN open";
  const m = /^(flop|turn|river)_(bet|facing)(?:_(\w+))?$/.exec(key);
  if (!m) return key;
  const [, st, kind, tx] = m;
  return `${st[0].toUpperCase()}${st.slice(1)} ${kind === "bet" ? "bet (BTN, IP)" : "facing a bet"}${tx ? `, ${TEX[tx as Texture] ?? tx} board` : ""}`;
}

export function newDrill(rng: Rng = Math.random): Drill {
  const d = newDeck(rng);
  const hero = [d.pop()!, d.pop()!];
  const vil = [d.pop()!, d.pop()!];
  const board = [d.pop()!, d.pop()!, d.pop()!, d.pop()!, d.pop()!];
  const hand = createHand({
    bb: 100, deadMoney: 50, posted: { bb: 100 },
    preflopOrder: [HERO, VILLAIN], postflopOrder: [VILLAIN, HERO], boardRunout: board,
    players: [
      { id: HERO, position: "BTN", stack: 10000, hole: hero },
      { id: VILLAIN, position: "BB", stack: 10000, hole: vil },
    ],
  });
  return { hand, feedback: [], log: [] };
}

function betRef(t: Tier, street: string, tx: Texture) {
  if (t === "strong" || (t === "draw" && street !== "river")) return { p: ["bet"], o: ["check"] };
  if (street === "flop" && t === "medium" && tx === "dry") return { p: ["bet"], o: ["check"] };
  if (street === "flop" && t === "air") return tx === "wet" || tx === "mono" ? { p: ["check"], o: ["bet"] } : { p: ["bet"], o: ["check"] };
  return { p: ["check"], o: ["bet"] };
}

function judge(hand: HandState, act: Action): Feedback {
  const legal = legalActions(hand)!;
  const hero = hand.players.find((p) => p.id === HERO)!;
  let pref: string[], ok: string[], why: string, spot: string;
  if (hand.street === "preflop") {
    const r = preflopReference("btn_open", hero.hole);
    pref = r.preferred; ok = r.acceptable; spot = "btn_open";
    why = `Chen score ${chenScore(hero.hole)}. Heuristic: the BTN opens roughly the top 45% of hands; limping is not in the reference.`;
  } else {
    const tier = handTier(hero.hole, hand.board);
    const facing = legal.call !== null;
    spot = hand.street === "flop" && !facing ? `flop_bet_${textureOf(hand.board)}` : `${hand.street}_${facing ? "facing" : "bet"}`;
    if (facing) {
      const r = tier === "strong" ? { p: ["call"], o: ["raise"] } : tier === "medium" || tier === "draw" ? { p: ["call"], o: ["fold"] } : { p: ["fold"], o: [] as string[] };
      pref = r.p; ok = r.o;
      why = `You hold ${TIER_TEXT[tier]}. Pot odds: you need about ${Math.round(requiredEquity(legal.call!, potSize(hand)) * 100)}% equity to call.`;
    } else {
      const tx = textureOf(hand.board);
      const r = betRef(tier, hand.street, tx);
      pref = r.p; ok = r.o;
      why = `You hold ${TIER_TEXT[tier]}${hand.street === "flop" ? ` on a ${TEX[tx]} flop` : ""}. Heuristic: value-bet strong hands, semi-bluff draws, check weak hands more often.`;
    }
  }
  const score = pref.includes(act.type) ? 1 : ok.includes(act.type) ? 0.5 : 0;
  const deviation = score > 0 ? "" : act.type === "fold" ? "too tight" : pref.includes("fold") ? "too loose" : act.type === "bet" || act.type === "raise" ? "over-aggressive" : "too passive";
  return { spot, label: spotLabel(spot), action: act.type, preferred: pref, acceptable: ok, verdict: score === 1 ? "good" : score ? "ok" : "miss", score, deviation, why };
}

function villainAct(hand: HandState, rng: Rng): Action {
  const l = legalActions(hand)!;
  const vil = hand.players.find((p) => p.id === VILLAIN)!;
  if (hand.street === "preflop") {
    if (l.check) return { type: "check" };
    return chenScore(vil.hole) >= 4 || rng() < 0.1 ? { type: "call" } : { type: "fold" };
  }
  const tier = handTier(vil.hole, hand.board);
  if (l.check) {
    const prev = hand.street === "turn" ? "flop" : "turn";
    const heroChecked = hand.history.some((h) => h.street === prev && h.playerId === HERO && h.action.type === "check");
    if (hand.street !== "flop" && heroChecked && l.bet && rng() < { strong: 0.6, medium: 0.3, draw: 0.4, air: 0.25 }[tier]) {
      const to = Math.max(l.bet.min, Math.min(l.bet.max, Math.round((potSize(hand) * 0.66) / 50) * 50));
      return { type: "bet", to };
    }
    return { type: "check" };
  }
  const bet = hand.history[hand.history.length - 1].added;
  const potBefore = potSize(hand) - bet;
  const callP = tier === "strong" ? 1 : tier === "medium" ? (bet / potBefore <= 0.7 ? 0.8 : 0.5) : tier === "draw" ? (hand.board.length < 5 ? 0.7 : 0) : 0.12;
  return l.call !== null && rng() < callP ? { type: "call" } : { type: "fold" };
}

function logLast(h: HandState, log: LogEntry[]) {
  const x = h.history[h.history.length - 1];
  const you = x.playerId === HERO;
  const a = x.action;
  const verb = a.type + (you ? "" : "s");
  const tail = a.type === "call" || a.type === "bet" ? ` ${bb(x.added)}` : a.type === "raise" ? ` to ${bb(a.to)}` : "";
  const st = x.street === "preflop" ? "Pre-flop" : x.street[0].toUpperCase() + x.street.slice(1);
  log.push({ street: st, text: `${you ? "You" : "BB"} ${verb}${tail}` });
}

export function heroAct(d: Drill, a: Action, rng: Rng = Math.random): Drill {
  const l = legalActions(d.hand);
  if (!l || l.playerId !== HERO) throw new Error("It is not the hero's turn");
  const fb = judge(d.hand, a);
  const log = [...d.log];
  let h = applyAction(d.hand, a);
  logLast(h, log);
  while (isLive(h) && legalActions(h)!.playerId === VILLAIN) {
    h = applyAction(h, villainAct(h, rng));
    logLast(h, log);
  }
  return { hand: h, feedback: [...d.feedback, fb], log };
}

export function resultText(d: Drill): string {
  const net = netResults(d.hand)[HERO] / 100;
  return net > 0 ? `You won ${net}bb` : net < 0 ? `You lost ${-net}bb` : "Split pot";
}
