import { newDeck } from "../engine/cards";
import { applyAction, createHand, legalActions, netResults, potSize, type Action, type HandState } from "../engine/hand";
import { chenScore, handTier, preflopReference, requiredEquity, textureOf, type PreflopSpot, type Texture, type Tier } from "../engine/analysis";

export type Rng = () => number;
export type Scenario = PreflopSpot;
export const SCENARIOS: Scenario[] = ["btn_open", "sb_open", "bb_defend", "sb_vs_open", "facing_3bet"];
export interface DrillOptions { scenario: Scenario | "any"; stackBB: number | "any"; texture: Texture | "any" }
export const DEFAULT_OPTIONS: DrillOptions = { scenario: "any", stackBB: "any", texture: "any" };
export type Deviation = "" | "tight" | "loose" | "aggressive" | "passive";
export interface Why { kind: "pre" | "facing" | "bet"; chen?: number; tier?: Tier; tex?: Texture; need?: number }
export interface Feedback { spot: string; action: string; preferred: string[]; acceptable: string[]; verdict: "good" | "ok" | "miss" | "grave"; score: number; deviation: Deviation; why: Why; variant: number; bad?: "fold_free" | "fold_strong" }
export interface LogEntry { street: string; who: "you" | "opp"; type: string; amount?: number }
export interface Drill { hand: HandState; feedback: Feedback[]; log: LogEntry[]; scenario: Scenario; stackBB: number }

export const HERO = "hero";
export const VILLAIN = "villain";
export const bb = (chips: number) => `${Math.round(chips) / 100}bb`;
const isLive = (h: HandState) => h.street !== "complete" && h.street !== "showdown";
export const isOver = (d: Drill) => !isLive(d.hand);

interface Setup { heroPos: string; vilPos: string; posted: { hero?: number; villain?: number }; dead: number; pre: string[]; post: string[]; minHero: number; minVil: number; script: (h: HandState) => HandState }
const raise = (h: HandState, to: number) => applyAction(h, { type: "raise", to });
const SETUPS: Record<Scenario, Setup> = {
  btn_open: { heroPos: "BTN", vilPos: "BB", posted: { villain: 100 }, dead: 50, pre: [HERO, VILLAIN], post: [VILLAIN, HERO], minHero: -9, minVil: -9, script: (h) => h },
  sb_open: { heroPos: "SB", vilPos: "BB", posted: { hero: 50, villain: 100 }, dead: 0, pre: [HERO, VILLAIN], post: [HERO, VILLAIN], minHero: -9, minVil: -9, script: (h) => h },
  bb_defend: { heroPos: "BB", vilPos: "BTN", posted: { hero: 100 }, dead: 50, pre: [VILLAIN, HERO], post: [HERO, VILLAIN], minHero: -9, minVil: 5, script: (h) => raise(h, 250) },
  sb_vs_open: { heroPos: "SB", vilPos: "BTN", posted: { hero: 50 }, dead: 100, pre: [VILLAIN, HERO], post: [HERO, VILLAIN], minHero: -9, minVil: 5, script: (h) => raise(h, 250) },
  facing_3bet: { heroPos: "BTN", vilPos: "BB", posted: { villain: 100 }, dead: 50, pre: [HERO, VILLAIN], post: [VILLAIN, HERO], minHero: 5, minVil: 8, script: (h) => raise(raise(h, 250), 900) },
};

function entry(x: HandState["history"][number]): LogEntry {
  const a = x.action;
  return { street: x.street, who: x.playerId === HERO ? "you" : "opp", type: a.type, amount: a.type === "raise" ? a.to : a.type === "call" || a.type === "bet" ? x.added : undefined };
}

export function newDrill(rng: Rng = Math.random, o: Partial<DrillOptions> = {}, preferredScenario?: Scenario): Drill {
  const opts = { ...DEFAULT_OPTIONS, ...o };
  const scenario = opts.scenario === "any"
    ? preferredScenario && rng() < 0.7 ? preferredScenario : SCENARIOS[Math.floor(rng() * SCENARIOS.length)]
    : opts.scenario;
  const stackBB = opts.stackBB === "any" ? [40, 100, 200][Math.floor(rng() * 3)] : opts.stackBB;
  const s = SETUPS[scenario];
  let d = newDeck(rng);
  // Rejection sampling: redraw until the deal fits the spot (hand ranges and flop texture).
  for (let i = 0; i < 1500; i++) {
    const fits = chenScore([d[51], d[50]]) >= s.minHero && chenScore([d[49], d[48]]) >= s.minVil && (opts.texture === "any" || textureOf(d.slice(45, 48)) === opts.texture);
    if (fits) break;
    d = newDeck(rng);
  }
  const hero = [d.pop()!, d.pop()!];
  const vil = [d.pop()!, d.pop()!];
  const board = [d.pop()!, d.pop()!, d.pop()!, d.pop()!, d.pop()!];
  const stack = stackBB * 100;
  const hand = s.script(createHand({
    bb: 100, blindLevel: 100, deadMoney: s.dead,
    posted: { [HERO]: s.posted.hero ?? 0, [VILLAIN]: s.posted.villain ?? 0 },
    preflopOrder: s.pre, postflopOrder: s.post, boardRunout: board,
    players: [{ id: HERO, position: s.heroPos, stack, hole: hero }, { id: VILLAIN, position: s.vilPos, stack, hole: vil }],
  }));
  return { hand, feedback: [], log: hand.history.map(entry), scenario, stackBB };
}

const lastRaiser = (h: HandState) => [...h.history].reverse().find((x) => x.street === "preflop" && x.action.type === "raise")?.playerId;
const preRaises = (h: HandState) => h.history.filter((x) => x.street === "preflop" && x.action.type === "raise").length;

function actionName(h: HandState, a: Action): string {
  if (h.street === "preflop" && a.type === "raise") { const n = preRaises(h); return n === 0 ? "raise" : n === 1 ? "3bet" : "4bet"; }
  return a.type;
}

function betRoute(t: Tier, street: string, tx: Texture) {
  if (t === "strong" || (t === "draw" && street !== "river")) return { p: ["bet"], o: ["check"] };
  if (street === "flop" && t === "medium" && tx === "dry") return { p: ["bet"], o: ["check"] };
  if (street === "flop" && t === "air") return tx === "wet" || tx === "mono" ? { p: ["check"], o: ["bet"] } : { p: ["bet"], o: ["check"] };
  return { p: ["check"], o: ["bet"] };
}

/** The coach's read of the hero's decision: experience-based rules, not solver output. */
function coachRead(d: Drill, act: Action, rng: Rng): Feedback {
  const hand = d.hand;
  const legal = legalActions(hand)!;
  const hero = hand.players.find((p) => p.id === HERO)!;
  const name = actionName(hand, act);
  const facingBet = hand.street === "preflop" ? preRaises(hand) > 0 : legal.call !== null;
  let strong = false;
  let pref: string[], ok: string[], why: Why, spot: string;
  if (hand.street === "preflop") {
    const r = preflopReference(d.scenario, hero.hole);
    strong = chenScore(hero.hole) >= 11;
    pref = r.preferred; ok = r.acceptable; spot = `pre_${d.scenario}`;
    why = { kind: "pre", chen: chenScore(hero.hole) };
  } else {
    const tier = handTier(hero.hole, hand.board);
    strong = tier === "strong";
    const facing = legal.call !== null;
    const tex = textureOf(hand.board);
    const ip = hand.postflopOrder[hand.postflopOrder.length - 1] === HERO;
    const pot = preRaises(hand) >= 2 ? "3bp" : "srp";
    spot = `${hand.street}_${facing ? "facing" : "bet"}_${ip ? "ip" : "oop"}_${pot}${hand.street === "flop" && !facing ? `_${tex}` : ""}`;
    if (facing) {
      const r = tier === "strong" ? { p: ["call"], o: ["raise"] } : tier === "medium" || tier === "draw" ? { p: ["call"], o: ["fold"] } : { p: ["fold"], o: [] as string[] };
      pref = r.p; ok = r.o;
      why = { kind: "facing", tier, need: Math.round(requiredEquity(legal.call!, potSize(hand)) * 100) };
    } else {
      const caller = !ip && lastRaiser(hand) !== HERO && hand.street === "flop"; // out of position, not the aggressor: mostly check
      const r = caller ? { p: ["check"], o: tier === "strong" || tier === "draw" ? ["bet"] : [] } : betRoute(tier, hand.street, tex);
      pref = r.p; ok = r.o;
      why = { kind: "bet", tier, tex: hand.street === "flop" ? tex : undefined };
    }
  }
  const score = pref.includes(name) ? 1 : ok.includes(name) ? 0.5 : 0;
  const aggressive = ["bet", "raise", "3bet", "4bet"].includes(name);
  const deviation: Deviation = score > 0 ? "" : name === "fold" ? "tight" : pref.includes("fold") ? "loose" : aggressive ? "aggressive" : "passive";
  // Folding a hand that should continue is a serious error when nobody bet, or when the hand is strong.
  const grave = name === "fold" && !pref.includes("fold") && !ok.includes("fold") && (!facingBet || strong);
  return { spot, action: name, preferred: pref, acceptable: ok, verdict: grave ? "grave" : score === 1 ? "good" : score ? "ok" : "miss", score, deviation, why, variant: Math.floor(rng() * 3), bad: grave ? (facingBet ? "fold_strong" : "fold_free") : undefined };
}

function villainAct(hand: HandState, rng: Rng, sc: Scenario): Action {
  const l = legalActions(hand)!;
  const vil = hand.players.find((p) => p.id === VILLAIN)!;
  if (hand.street === "preflop") {
    if (l.check) return { type: "check" };
    const c = chenScore(vil.hole);
    const keep = sc === "bb_defend" || sc === "sb_vs_open" ? c >= 9 || rng() < 0.05 : sc === "facing_3bet" ? c >= 10 : sc === "sb_open" ? c >= 3 || rng() < 0.1 : c >= 4 || rng() < 0.1;
    return keep ? { type: "call" } : { type: "fold" };
  }
  const tier = handTier(vil.hole, hand.board);
  if (l.check) {
    const first = !hand.history.some((h) => h.street === hand.street);
    const aggr = lastRaiser(hand) === VILLAIN;
    const prev = hand.street === "turn" ? "flop" : "turn";
    const heroCheckedPrev = hand.history.some((h) => h.street === prev && h.playerId === HERO && h.action.type === "check");
    const A = { strong: 0.7, medium: 0.4, draw: 0.5, air: 0.35 }[tier];
    const B = { strong: 0.6, medium: 0.3, draw: 0.4, air: 0.25 }[tier];
    const p = aggr ? A : !first ? B : hand.street !== "flop" && heroCheckedPrev ? B : 0;
    if (l.bet && p > 0 && rng() < p) {
      const frac = aggr && hand.street === "flop" ? 0.5 : 0.66;
      return { type: "bet", to: Math.max(l.bet.min, Math.min(l.bet.max, Math.round((potSize(hand) * frac) / 50) * 50)) };
    }
    return { type: "check" };
  }
  const bet = hand.history[hand.history.length - 1].added;
  const potBefore = potSize(hand) - bet;
  const callP = tier === "strong" ? 1 : tier === "medium" ? (bet / potBefore <= 0.7 ? 0.8 : 0.5) : tier === "draw" ? (hand.board.length < 5 ? 0.7 : 0) : 0.12;
  return l.call !== null && rng() < callP ? { type: "call" } : { type: "fold" };
}

export function heroAct(d: Drill, a: Action, rng: Rng = Math.random): Drill {
  const l = legalActions(d.hand);
  if (!l || l.playerId !== HERO) throw new Error("It is not the hero's turn");
  const fb = coachRead(d, a, rng);
  const log = [...d.log];
  let h = applyAction(d.hand, a);
  log.push(entry(h.history[h.history.length - 1]));
  while (isLive(h) && legalActions(h)!.playerId === VILLAIN) {
    h = applyAction(h, villainAct(h, rng, d.scenario));
    log.push(entry(h.history[h.history.length - 1]));
  }
  return { hand: h, feedback: [...d.feedback, fb], log, scenario: d.scenario, stackBB: d.stackBB };
}

/** Net result for the hero, in big blinds. */
export const resultBB = (d: Drill) => netResults(d.hand)[HERO] / 100;
