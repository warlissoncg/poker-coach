import { describe, expect, it } from "vitest";
import { parseCards } from "./cards";
import { HandCategory, categoryOf, compareHands, evaluate } from "./evaluator";

const cat = (s: string) => categoryOf(evaluate(parseCards(s)));

describe("evaluator categories", () => {
  it("detects each category", () => {
    expect(cat("As Kd 9c 7h 3s")).toBe(HandCategory.HighCard);
    expect(cat("As Ad 9c 7h 3s")).toBe(HandCategory.Pair);
    expect(cat("As Ad 9c 9h 3s")).toBe(HandCategory.TwoPair);
    expect(cat("As Ad Ac 7h 3s")).toBe(HandCategory.ThreeOfAKind);
    expect(cat("9s 8d 7c 6h 5s")).toBe(HandCategory.Straight);
    expect(cat("As Ks 9s 7s 3s")).toBe(HandCategory.Flush);
    expect(cat("As Ad Ac 7h 7s")).toBe(HandCategory.FullHouse);
    expect(cat("As Ad Ac Ah 3s")).toBe(HandCategory.FourOfAKind);
    expect(cat("9s 8s 7s 6s 5s")).toBe(HandCategory.StraightFlush);
  });

  it("treats A-2-3-4-5 as the lowest straight", () => {
    expect(cat("As 2d 3c 4h 5s")).toBe(HandCategory.Straight);
    expect(compareHands(parseCards("As 2d 3c 4h 5s"), parseCards("2s 3d 4c 5h 6s"))).toBe(-1);
  });

  it("picks the best 5 of 7 cards", () => {
    expect(cat("As Ad 2c 2h 2s Kd Kc")).toBe(HandCategory.FullHouse);
  });
});

describe("compareHands", () => {
  it("breaks ties with kickers", () => {
    expect(compareHands(parseCards("As Ad Kc 7h 3s"), parseCards("Ac Ah Qc 7d 3d"))).toBe(1);
  });
  it("splits identical hands", () => {
    expect(compareHands(parseCards("As Kd 9c 7h 3s"), parseCards("Ac Kh 9d 7s 3c"))).toBe(0);
  });
  it("lets the board play for both players", () => {
    const board = "As Ks Qs Js Ts";
    expect(compareHands(parseCards(`2c 3d ${board}`), parseCards(`4c 5d ${board}`))).toBe(0);
  });
});
