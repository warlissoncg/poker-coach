"use client";
import { useEffect, useMemo, useState } from "react";
import { loadDecisions, summarize, type Decision } from "../game/stats";
import { SCENARIOS } from "../game/drill";
import { useI18n } from "../i18n";
import { Button } from "@/components/ui/button";

const sel = "rounded-md border bg-background px-3 py-2 text-sm";
const textures = ["any", "dry", "wet", "paired", "mono"] as const;

export function StatsView() {
  const { t, spot } = useI18n();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [scenario, setScenario] = useState("any");
  const [stack, setStack] = useState("any");
  const [texture, setTexture] = useState("any");
  const [flipped, setFlipped] = useState(false);

  useEffect(() => { let active = true; void loadDecisions().then((d) => { if (active) setDecisions(d); }); return () => { active = false; }; }, []);
  const matching = useMemo(() => decisions.filter((d) =>
    (scenario === "any" || d.scenario === scenario || (!d.scenario && d.spot === `pre_${scenario}`)) &&
    (stack === "any" || d.stackBB === Number(stack)) &&
    (texture === "any" || d.texture === texture)
  ), [decisions, scenario, stack, texture]);
  const summary = summarize(matching);
  const aligned = summary.total ? Math.round(summary.aligned * 100) : 0;
  const byAction = useMemo(() => {
    const counts = new Map<string, { n: number; score: number }>();
    matching.forEach((d) => { const old = counts.get(d.action) ?? { n: 0, score: 0 }; counts.set(d.action, { n: old.n + 1, score: old.score + d.score }); });
    return [...counts.entries()].map(([action, v]) => ({ action, n: v.n, aligned: Math.round((v.score / v.n) * 100) })).sort((a, b) => b.n - a.n);
  }, [matching]);
  const label = scenario === "any" ? t("tex.any") : t(`sc.${scenario}`);
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="space-y-1"><h1 className="text-xl font-semibold">{t("stats.title")}</h1><p className="text-sm text-muted-foreground">{t("stats.note")}</p></div>
      <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">{t("stats.filter.spot")}<select className={sel} value={scenario} onChange={(e) => { setScenario(e.target.value); setFlipped(false); }}><option value="any">{t("tex.any")}</option>{SCENARIOS.map((s) => <option key={s} value={s}>{t(`sc.${s}`)}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">{t("stats.filter.stack")}<select className={sel} value={stack} onChange={(e) => { setStack(e.target.value); setFlipped(false); }}><option value="any">{t("tex.any")}</option>{[40,100,200].map((n) => <option key={n} value={n}>{n}bb</option>)}</select></label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">{t("stats.filter.texture")}<select className={sel} value={texture} onChange={(e) => { setTexture(e.target.value); setFlipped(false); }}><option value="any">{t("tex.any")}</option>{textures.filter((x) => x !== "any").map((x) => <option key={x} value={x}>{t(`tex.${x}`)}</option>)}</select></label>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-1 text-sm text-muted-foreground">{t("dash.title", { n: summary.total, p: summary.total ? aligned : "—" })}</div>
          <div className="mb-2 text-3xl font-bold tabular-nums">{summary.total ? `${aligned}%` : "—"}</div>
          <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${aligned}%` }} /></div>
          <p className="mt-2 text-xs text-muted-foreground">{t("stats.sample", { n: summary.total, p: aligned })}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 font-semibold">{label}{stack !== "any" ? ` · ${stack}bb` : ""}{texture !== "any" ? ` · ${t(`tex.${texture}`)}` : ""}</h2>
          {summary.total < 8 && <p className="mb-3 text-sm text-muted-foreground">{t("stats.threshold", { n: summary.total, goal: 8 })}</p>}
          {byAction.map((x) => <div key={x.action} className="mb-3 space-y-1"><div className="flex justify-between text-sm"><span className="capitalize">{x.action}</span><span>{x.aligned}% · {x.n}</span></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${x.aligned}%` }} /></div></div>)}
          {!summary.total && <p className="text-sm text-muted-foreground">{t("stats.empty")}</p>}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-2 border-b p-3"><h2 className="font-semibold">{t("stats.byspot")}</h2><span className="text-xs text-muted-foreground">{t("stats.count", { n: summary.spots.length })}</span></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-muted-foreground"><th className="p-3">{t("th.spot")}</th><th className="p-3">n</th><th className="p-3">{t("th.on")}</th><th className="p-3">{t("th.status")}</th></tr></thead><tbody>
          {summary.spots.map((s) => <tr key={s.spot} className="border-b last:border-0"><td className="p-3">{spot(s.spot)}</td><td className="p-3">{s.n}</td><td className="p-3">{Math.round(s.aligned * 100)}%</td><td className="p-3">{t(`st.${s.status}`)}</td></tr>)}
          {!summary.spots.length && <tr><td className="p-3 text-muted-foreground" colSpan={4}>{t("stats.empty")}</td></tr>}
        </tbody></table></div>
      </div>
      <Button variant="outline" onClick={() => setFlipped((v) => !v)}>{flipped ? t("stats.back") : t("stats.flip")}</Button>
      {flipped && <div className="rounded-xl border bg-card p-5"><div className="mx-auto max-w-xl rounded-2xl border-4 border-emerald-950 bg-emerald-900 p-6 text-center text-white shadow-inner"><div className="text-xs uppercase tracking-[0.3em] text-emerald-200">Poker Coach · {label}</div><div className="my-6 flex justify-center gap-2 text-3xl">♠ ♥ ♦ ♣</div><div className="text-lg font-semibold">{label}</div><div className="mt-2 text-sm text-emerald-100">{stack === "any" ? t("tex.any") : `${stack}bb`} · {texture === "any" ? t("tex.any") : t(`tex.${texture}`)}</div></div><div className="mt-4 text-center"><div className="text-3xl font-bold">{summary.total ? `${aligned}%` : "—"}</div><p className="text-sm text-muted-foreground">{t("stats.sample", { n: summary.total, p: aligned })}</p></div></div>}
    </div>
  );
}
