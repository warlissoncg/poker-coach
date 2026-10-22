export interface Decision { spot: string; action: string; score: number; deviation: string; ts: number }
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

const KEY = "pk_decisions_v3";
const TOUR = "pk_tour_seen";
export function loadDecisions(): Decision[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
export function saveDecision(d: Decision) {
  try { localStorage.setItem(KEY, JSON.stringify([...loadDecisions(), d].slice(-2000))); } catch { /* storage unavailable */ }
}
export function clearDecisions() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(TOUR); } catch { /* ignore */ }
}
export function tourSeen(): boolean {
  try { return localStorage.getItem(TOUR) === "1"; } catch { return true; }
}
export function markTourSeen() {
  try { localStorage.setItem(TOUR, "1"); } catch { /* ignore */ }
}
