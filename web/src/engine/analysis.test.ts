import { describe, expect, it } from "vitest";
import { parseCards } from "./cards";
import { chenScore, handTier, preflopReference, requiredEquity, textureOf } from "./analysis";

const h = parseCards;

describe("textureOf", () => {
  it("classifies flops", () => {
    expect(textureOf(h("Ks 7d 2c"))).toBe("dry");
    expect(textureOf(h("Ks 7s 2c"))).toBe("wet");
    expect(textureOf(h("9s 8d 7c"))).toBe("wet");
    expect(textureOf(h("Ks Kd 2c"))).toBe("paired");
    expect(textureOf(h("Ks 7s 2s"))).toBe("mono");
  });
});

describe("handTier", () => {
  it("rates made hands", () => {
    expect(handTier(h("Ah Ad"), h("7c 2d 3s"))).toBe("strong");
    expect(handTier(h("9h 9d"), h("Ks 7c 2d"))).toBe("medium");
    expect(handTier(h("Ah Kd"), h("Ks 7c 2d"))).toBe("strong");
    expect(handTier(h("7h 7d"), h("7c Ks 2d"))).toBe("strong");
  });
  it("rates draws and air", () => {
    expect(handTier(h("Ah Kh"), h("7h 2h 9c"))).toBe("draw");
    expect(handTier(h("9h 8d"), h("7c 6s 2d"))).toBe("draw");
    expect(handTier(h("Ah 5d"), h("Ks 7c 2d"))).toBe("air");
    expect(handTier(h("Ah Qd"), h("Ks Kd 2c"))).toBe("air");
    expect(handTier(h("Ah 5s"), h("Kd 7c 2d 3h 9s"))).toBe("air");
  });
});

describe("chenScore", () => {
  it("matches known values", () => {
    expect(chenScore(h("Ah Ad"))).toBe(20);
    expect(chenScore(h("Ks Kd"))).toBe(16);
    expect(chenScore(h("As Ks"))).toBe(12);
    expect(chenScore(h("Jh Th"))).toBe(9);
    expect(chenScore(h("7h 2d"))).toBe(-1);
  });
});

describe("references", () => {
  it("is labeled heuristic and sensible", () => {
    expect(preflopReference("btn_open", h("Ah Ad")).preferred).toEqual(["raise"]);
    expect(preflopReference("btn_open", h("7h 2d")).preferred).toEqual(["fold"]);
    expect(preflopReference("bb_defend", h("Ah Ad")).preferred).toEqual(["3bet"]);
    expect(preflopReference("bb_defend", h("7h 2d")).source).toBe("heuristic");
  });
  it("computes required equity from pot odds", () => {
    expect(Math.round(requiredEquity(33, 133) * 1000)).toBe(199);
    expect(requiredEquity(100, 200)).toBeGreaterThan(0.33);
  });
});
