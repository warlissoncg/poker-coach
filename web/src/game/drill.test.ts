import { describe, expect, it } from "vitest";
import { legalActions, netResults, type Action } from "../engine/hand";
import { heroAct, isOver, newDrill } from "./drill";
import { summarize } from "./stats";

function mulberry(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("drill flow", () => {
  it("plays 300 random hands to the end and accounts for every chip", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = mulberry(seed);
      let d = newDrill(rng);
      let steps = 0;
      while (!isOver(d)) {
        const l = legalActions(d.hand)!;
        const opts: Action[] = [];
        if (l.fold) opts.push({ type: "fold" });
        if (l.check) opts.push({ type: "check" });
        if (l.call !== null) opts.push({ type: "call" });
        if (l.bet) opts.push({ type: "bet", to: l.bet.min + Math.floor(rng() * (l.bet.max - l.bet.min + 1)) });
        if (l.raise) opts.push({ type: "raise", to: l.raise.min + Math.floor(rng() * (l.raise.max - l.raise.min + 1)) });
        d = heroAct(d, opts[Math.floor(rng() * opts.length)], rng);
        steps++;
        if (steps > 40) throw new Error("hand did not finish");
      }
      expect(d.feedback.length).toBe(steps);
      const net = netResults(d.hand);
      expect(net.btn + net.bb).toBe(50); // the dead small blind goes to the winner
    }
  });

});

describe("stats", () => {
  it("flags leaks only with enough samples", () => {
    const mk = (n: number, miss: number) => Array.from({ length: n }, (_, i) => ({ spot: "s", action: "fold", score: i < miss ? 0 : 1, deviation: "too tight", ts: i }));
    expect(summarize(mk(5, 5)).spots[0].status).toBe("insufficient");
    expect(summarize(mk(10, 5)).spots[0].status).toBe("preliminary");
    expect(summarize(mk(25, 10)).spots[0].status).toBe("likely");
    expect(summarize(mk(25, 1)).spots[0].status).toBe("ok");
  });
});
