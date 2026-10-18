import { describe, expect, it } from "vitest";
import { parseCards } from "./cards";
import { applyAction, createHand, legalActions, netResults, payouts, potSize } from "./hand";

const RUNOUT = "Ks 7d 2c 9h 3s";
const hu = () =>
  createHand({
    bb: 100, deadMoney: 50, posted: { bb: 100 },
    preflopOrder: ["btn", "bb"], postflopOrder: ["bb", "btn"],
    boardRunout: parseCards(RUNOUT),
    players: [
      { id: "btn", position: "BTN", stack: 10000, hole: parseCards("Ah Ad") },
      { id: "bb", position: "BB", stack: 10000, hole: parseCards("Qh Jh") },
    ],
  });

describe("heads-up pre-flop", () => {
  it("starts with correct pot and legal actions", () => {
    const s = hu();
    expect(potSize(s)).toBe(150);
    const l = legalActions(s)!;
    expect(l.playerId).toBe("btn");
    expect(l.check).toBe(false);
    expect(l.call).toBe(100);
    expect(l.raise).toEqual({ min: 200, max: 10000 });
    expect(l.bet).toBeNull();
  });

  it("reaches the flop after raise and call, hiding future cards", () => {
    let s = hu();
    s = applyAction(s, { type: "raise", to: 250 });
    s = applyAction(s, { type: "call" });
    expect(s.street).toBe("flop");
    expect(s.board.length).toBe(3);
    expect(potSize(s)).toBe(550);
    const l = legalActions(s)!;
    expect(l.playerId).toBe("bb");
    expect(l.check).toBe(true);
    expect(l.bet).toEqual({ min: 100, max: 9750 });
  });

  it("rejects illegal actions", () => {
    const s = hu();
    expect(() => applyAction(s, { type: "raise", to: 150 })).toThrow();
    expect(() => applyAction(s, { type: "check" })).toThrow();
    expect(() => applyAction(s, { type: "raise", to: 20000 })).toThrow();
    expect(() => applyAction(s, { type: "bet", to: 300 })).toThrow();
  });

  it("ends the hand on a fold and pays the pot", () => {
    let s = hu();
    s = applyAction(s, { type: "raise", to: 250 });
    s = applyAction(s, { type: "fold" });
    expect(s.street).toBe("complete");
    expect(payouts(s)).toEqual({ btn: 400, bb: 0 });
    expect(netResults(s)).toEqual({ btn: 150, bb: -100 });
  });

  it("tracks the minimum re-raise", () => {
    let s = hu();
    s = applyAction(s, { type: "raise", to: 250 });
    s = applyAction(s, { type: "raise", to: 700 });
    expect(legalActions(s)!.raise!.min).toBe(1150);
  });
});

describe("streets and showdown", () => {
  it("plays check-check to showdown", () => {
    let s = hu();
    s = applyAction(s, { type: "raise", to: 250 });
    s = applyAction(s, { type: "call" });
    for (let i = 0; i < 3; i++) {
      s = applyAction(s, { type: "check" });
      s = applyAction(s, { type: "check" });
    }
    expect(s.street).toBe("showdown");
    expect(s.board.length).toBe(5);
    expect(payouts(s)).toEqual({ btn: 550, bb: 0 });
  });

  it("runs out the board when both are all-in", () => {
    let s = hu();
    s = applyAction(s, { type: "raise", to: 10000 });
    s = applyAction(s, { type: "call" });
    expect(s.street).toBe("showdown");
    expect(s.board.length).toBe(5);
    expect(payouts(s).btn).toBe(20050);
  });
});

const three = (stacks: [number, number, number]) =>
  createHand({
    bb: 100, posted: { c: 100 },
    preflopOrder: ["a", "b", "c"], postflopOrder: ["c", "a", "b"],
    boardRunout: parseCards(RUNOUT),
    players: [
      { id: "a", position: "BTN", stack: stacks[0], hole: parseCards("Ah Ad") },
      { id: "b", position: "SB", stack: stacks[1], hole: parseCards("Kh Qd") },
      { id: "c", position: "BB", stack: stacks[2], hole: parseCards("Th 4d") },
    ],
  });

describe("multiway rules", () => {
  it("does not reopen raising after a short all-in", () => {
    let s = three([1000, 350, 1000]);
    s = applyAction(s, { type: "raise", to: 300 });
    s = applyAction(s, { type: "raise", to: 350 }); // short all-in (+50 < 200)
    s = applyAction(s, { type: "fold" }); // c folds
    const l = legalActions(s)!;
    expect(l.playerId).toBe("a");
    expect(l.raise).toBeNull();
    expect(l.call).toBe(50);
  });

  it("builds side pots correctly", () => {
    let s = three([200, 400, 1000]);
    s = applyAction(s, { type: "raise", to: 200 });
    s = applyAction(s, { type: "raise", to: 400 });
    s = applyAction(s, { type: "call" });
    expect(s.street).toBe("showdown");
    expect(payouts(s)).toEqual({ a: 600, b: 400, c: 0 });
  });
});
