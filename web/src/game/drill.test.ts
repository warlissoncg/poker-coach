import { describe, expect, it } from "vitest";
import { textureOf } from "../engine/analysis";
import { legalActions, netResults, type Action } from "../engine/hand";
import { chenScore } from "../engine/analysis";
import { HERO, SCENARIOS, heroAct, isOver, newDrill } from "./drill";
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
  it("plays every scenario, stack depth and texture to the end, accounting for every chip", () => {
    for (const scenario of SCENARIOS)
      for (const stackBB of [40, 100, 200])
        for (const texture of ["any", "wet"] as const)
          for (let seed = 1; seed <= 25; seed++) {
            const rng = mulberry(seed * 7 + stackBB);
            let d = newDrill(rng, { scenario, stackBB, texture });
            expect(legalActions(d.hand)!.playerId).toBe(HERO);
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
              if (++steps > 40) throw new Error("hand did not finish");
            }
            expect(d.feedback.length).toBe(steps);
            const net = netResults(d.hand);
            expect(net.hero + net.villain).toBe(d.hand.deadMoney);
          }
  });

  it("sets the right price in each scripted spot", () => {
    const vs = newDrill(mulberry(1), { scenario: "sb_vs_open" });
    expect(legalActions(vs.hand)!.call).toBe(200);
    expect(legalActions(vs.hand)!.raise!.min).toBe(400);
    const f3 = newDrill(mulberry(2), { scenario: "facing_3bet" });
    expect(legalActions(f3.hand)!.call).toBe(650);
    expect(legalActions(f3.hand)!.raise!.min).toBe(1550);
  });

  it("honors the texture filter", () => {
    for (const texture of ["dry", "paired", "mono"] as const) {
      const d = newDrill(mulberry(3), { texture });
      expect(textureOf(d.hand.boardRunout)).toBe(texture);
    }
  });
});

describe("coach feedback", () => {
  const heroChen = (seed: number, scenario: "btn_open" | "sb_open") => { const d = newDrill(mulberry(seed), { scenario }); return { d, c: chenScore(d.hand.players.find((p) => p.id === HERO)!.hole) }; };
  it("treats folding a playable hand as a grave error when nobody bet", () => {
    for (let seed = 1; seed < 400; seed++) {
      const { d, c } = heroChen(seed, "sb_open");
      if (c < 6) continue;
      expect(heroAct(d, { type: "fold" }, mulberry(1)).feedback[0].verdict).toBe("grave");
      return;
    }
  });
  it("accepts folding trash on the button and praises the exact play", () => {
    for (let seed = 1; seed < 400; seed++) {
      const { d, c } = heroChen(seed, "btn_open");
      if (c > 2) continue;
      expect(heroAct(d, { type: "fold" }, mulberry(1)).feedback[0].verdict).toBe("good");
      return;
    }
  });
  it("resolves the Any option for spot and stack", () => {
    const seen = new Set<string>();
    for (let seed = 1; seed < 60; seed++) { const d = newDrill(mulberry(seed), { scenario: "any", stackBB: "any" }); seen.add(d.scenario); expect([40, 100, 200].includes(d.stackBB)).toBe(true); }
    expect(seen.size > 1).toBe(true);
  });
});

describe("stats", () => {
  it("flags leaks only with enough samples", () => {
    const mk = (n: number, miss: number) => Array.from({ length: n }, (_, i) => ({ spot: "s", action: "fold", score: i < miss ? 0 : 1, deviation: "tight", ts: i }));
    expect(summarize(mk(5, 5)).spots[0].status).toBe("insufficient");
    expect(summarize(mk(10, 5)).spots[0].status).toBe("preliminary");
    expect(summarize(mk(25, 10)).spots[0].status).toBe("likely");
    expect(summarize(mk(25, 1)).spots[0].status).toBe("ok");
  });
});
