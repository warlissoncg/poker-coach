import { trainingStorage } from "../services/storage/trainingStorage";
import type { Scenario } from "./drill";

export interface Decision { spot: string; action: string; score: number; deviation: string; ts: number; scenario?: Scenario; stackBB?: number; texture?: string }
export interface SpotStat { spot: string; n: number; aligned: number; topDeviation: string | null; status: "ok" | "insufficient" | "preliminary" | "likely" }

export function summarize(ds: Decision[]) {
  const by = new Map<string, Decision[]>();
  ds.forEach((d) => by.set(d.spot, [...(by.get(d.spot) ?? []), d]));
  const spots: SpotStat[] = [...by.entries()].map(([spot, a]) => {
    const misses = a.filter((d) => d.score === 0);
    const dev = new Map<string, number>();
    misses.forEach((d) => dev.set(d.deviation, (dev.get(d.deviation) ?? 0) + 1));
    const top = [...dev.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;
    const rate = misses.length / a.length;
    const status = a.length < 8 ? "insufficient" : rate >= 0.3 ? (a.length < 20 ? "preliminary" : "likely") : "ok";
    return { spot, n: a.length, aligned: a.reduce((s, d) => s + d.score, 0) / a.length, topDeviation: top, status };
  });
  return { total: ds.length, aligned: ds.length ? ds.reduce((s, d) => s + d.score, 0) / ds.length : 0, spots };
}

export interface RecommendedFocus { spot: string; scenario: Scenario; aligned: number; n: number }

/** Pick the user's least-aligned spot with enough observations and map it to a drill scenario. */
export function recommendFocus(ds: Decision[]): RecommendedFocus | null {
  const candidates = summarize(ds).spots
    .filter((s) => s.n >= 4)
    .sort((a, b) => a.aligned - b.aligned || b.n - a.n);
  const weakest = candidates[0];
  if (!weakest) return null;

  let scenario: Scenario;
  if (weakest.spot.startsWith("pre_")) {
    const key = weakest.spot.slice(4);
    scenario = (["btn_open", "sb_open", "bb_defend", "sb_vs_open", "facing_3bet"] as string[]).includes(key)
      ? key as Scenario : "btn_open";
  } else if (weakest.spot.includes("3bp") || weakest.spot.includes("facing")) {
    scenario = "facing_3bet";
  } else if (weakest.spot.includes("_oop_")) {
    scenario = "sb_vs_open";
  } else {
    scenario = "btn_open";
  }
  return { spot: weakest.spot, scenario, aligned: weakest.aligned, n: weakest.n };
}

const TOUR = "pk_tour_seen";

/** Async API so local and future remote storage can share the same UI contract. */
export function loadDecisions(): Promise<Decision[]> {
  return trainingStorage.loadDecisions();
}
export function saveDecision(d: Decision): Promise<void> {
  return trainingStorage.saveDecision(d);
}
export function clearDecisions(): Promise<void> {
  return trainingStorage.clearDecisions();
}
export function tourSeen(): boolean {
  try { return localStorage.getItem(TOUR) === "1"; } catch { return true; }
}
export function markTourSeen() {
  try { localStorage.setItem(TOUR, "1"); } catch { /* ignore */ }
}
