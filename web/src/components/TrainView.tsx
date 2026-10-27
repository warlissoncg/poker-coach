"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Action } from "../engine/hand";
import { textureOf } from "../engine/analysis";
import { DEFAULT_OPTIONS, SCENARIOS, heroAct, isOver, newDrill, resultBB, type Drill, type DrillOptions, type Feedback } from "../game/drill";
import { loadDecisions, recommendFocus, saveDecision, summarize, type Decision } from "../game/stats";
import { useI18n } from "../i18n";
import { ActionBar } from "./ActionBar";
import { Table } from "./Table";

const sel = "rounded-md border bg-background px-2 py-1 text-sm";
const TEXES = ["any", "dry", "wet", "paired", "mono"] as const;
const TONE = { good: "border-green-600", ok: "border-yellow-500", miss: "border-orange-600", grave: "border-red-600" };

function FeedbackCard({ f }: { f: Feedback }) {
  const { t, spot, why } = useI18n();
  const v = f.variant % 3;
  const p = f.preferred.join(" / ");
  const also = f.acceptable.filter((a) => a !== f.action).join(" / ");
  const tier = f.why.tier ? t(`tier.${f.why.tier}`) : t("tier.premium");
  const head = f.verdict === "good" ? `${t(`c.good.${v}`)}${also ? ` ${t("c.also", { a: also })}` : ""}`
    : f.verdict === "ok" ? t("c.ok", { p, a: f.action })
    : f.verdict === "miss" ? t(`c.miss.${v}`, { p })
    : `${t(`c.grave.${v}`)} ${t(`bad.${f.bad}`, { tier })}`;
  return (
    <div className={`rounded-lg border-l-4 bg-card p-3 text-sm shadow-sm ${TONE[f.verdict]}`}>
      <div className="text-xs text-muted-foreground">{spot(f.spot)}</div>
      <div className="font-semibold">{head}</div>
      <div className="mt-1 text-muted-foreground">{why(f.why)}</div>
    </div>
  );
}

export function TrainView() {
  const { t, line, res, spot } = useI18n();
  const [drill, setDrill] = useState<Drill | null>(null);
  const [opts, setOpts] = useState<DrillOptions>(DEFAULT_OPTIONS);
  const [hands, setHands] = useState(0);
  const [score, setScore] = useState({ sum: 0, n: 0 });
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [focusEnabled, setFocusEnabled] = useState(false);
  const [showSpotStats, setShowSpotStats] = useState(false);
  const focus = recommendFocus(decisions);
  useEffect(() => {
    let active = true;
    void loadDecisions().then((loaded) => {
      if (!active) return;
      setDecisions(loaded);
      setDrill(newDrill(Math.random, DEFAULT_OPTIONS));
    });
    return () => { active = false; };
  }, []);
  const over = drill ? isOver(drill) : false;
  const next = () => { setDrill(newDrill(Math.random, opts, focusEnabled ? focus?.scenario : undefined)); setHands((h) => h + 1); };
  const change = (p: Partial<DrillOptions>) => { const o = { ...opts, ...p }; setOpts(o); setDrill(newDrill(Math.random, o, focusEnabled ? focus?.scenario : undefined)); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (over && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); next(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  if (!drill) return <div className="p-6 text-muted-foreground">{t("dealing")}</div>;
  const act = (a: Action) => {
    const nd = heroAct(drill, a);
    const f = nd.feedback[nd.feedback.length - 1];
    const decision: Decision = { spot: f.spot, action: f.action, score: f.score, deviation: f.deviation, ts: Date.now(), scenario: drill.scenario, stackBB: drill.stackBB, texture: textureOf(drill.hand.boardRunout.slice(0, 3)) };
    setDecisions((current) => [...current, decision].slice(-2000));
    void saveDecision(decision);
    setScore((s) => ({ sum: s.sum + f.score, n: s.n + 1 }));
    setDrill(nd);
  };
  const last = drill.feedback[drill.feedback.length - 1];
  const currentSpot = last?.spot ?? `pre_${drill.scenario}`;
  const currentSpotCount = decisions.filter((d) => d.spot === currentSpot).length;
  const statsProgress = Math.min(100, Math.round((currentSpotCount / 8) * 100));
  const currentSpotSummary = summarize(decisions.filter((d) => d.spot === currentSpot));
  return (
    <div className="mx-auto w-full max-w-6xl space-y-2">
      <section className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-2 sm:gap-3 sm:p-3">
        <label className="flex min-w-[150px] flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground">{t("ctl.scenario")}
          <select className={sel + " h-8 w-full"} value={opts.scenario} onChange={(e) => change({ scenario: e.target.value as DrillOptions["scenario"] })}>{(["any", ...SCENARIOS] as const).map((x) => <option key={x} value={x}>{x === "any" ? t("tex.any") : t(`sc.${x}`)}</option>)}</select>
        </label>
        <label className="flex min-w-[110px] flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground">{t("ctl.stack")}
          <select className={sel + " h-10 w-full"} value={opts.stackBB} onChange={(e) => change({ stackBB: e.target.value === "any" ? "any" : +e.target.value })}>{(["any", 40, 100, 200] as const).map((x) => <option key={x} value={x}>{x === "any" ? t("tex.any") : `${x}bb`}</option>)}</select>
        </label>
        <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground">{t("ctl.texture")}
          <select className={sel + " h-10 w-full"} value={opts.texture} onChange={(e) => change({ texture: e.target.value as DrillOptions["texture"] })}>{TEXES.map((x) => <option key={x} value={x}>{t(`tex.${x}`)}</option>)}</select>
        </label>
        <div className="flex min-h-8 flex-1 items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-1.5 text-xs sm:text-sm">
          <span>{t("progress.hands", { n: hands + 1 })}</span>
          <span className="text-right text-xs text-muted-foreground">{score.n ? t("session.some", { p: Math.round((score.sum / score.n) * 100), n: score.n }) : t("session.none")}</span>
        </div>
      </section>

      {focus && opts.scenario === "any" && (
        <section className="rounded-xl border bg-card px-3 py-2">
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input className="mt-1" type="checkbox" checked={focusEnabled} onChange={(e) => { setFocusEnabled(e.target.checked); setDrill(newDrill(Math.random, opts, e.target.checked ? focus?.scenario : undefined)); }} />
            <span><span className="font-medium">{t("focus.toggle")}</span><span className="block text-xs text-muted-foreground">{t("focus.recommend", { spot: spot(focus.spot), p: Math.round(focus.aligned * 100), n: focus.n })}</span></span>
          </label>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <header className="flex min-h-12 items-center justify-between gap-3 border-b px-3 py-2 pr-14 sm:px-4">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">The Grind Lab</div>
            <h2 className="truncate text-base font-bold sm:text-lg">{showSpotStats ? "Estatísticas do spot" : t("hand", { n: hands + 1, sc: t(`sc.${drill.scenario}`), st: drill.stackBB })}</h2>
          </div>
          <span className="shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{showSpotStats ? "Desempenho" : "Treino ativo"}</span>
        </header>

        <div className="relative p-2 sm:p-3">
          <button type="button" onClick={() => setShowSpotStats((v) => !v)} aria-label={showSpotStats ? "Voltar ao treino" : "Abrir estatísticas"} aria-pressed={showSpotStats} className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-amber-500 bg-emerald-950 text-amber-100 shadow-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:right-5 sm:top-4" title={showSpotStats ? "Voltar ao treino" : "Ver estatísticas"}>
            <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true"><path fill="currentColor" d="M13 53 19 43 17 34 22 26 22 18 29 10 38 12 43 19 53 22 48 29 42 29 39 37 34 42 34 53 27 53 27 44 23 44 20 53Z"/><path fill="currentColor" d="M30 14 25 20 31 22 36 19 34 14Z"/><path fill="none" stroke="#d6a84f" strokeWidth="2" d="M8 57H56"/></svg>
          </button>

          {showSpotStats ? (
            <div className="space-y-5 pt-1">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-muted/30 p-4 sm:col-span-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("stats.byspot")}</div>
                  <h3 className="mt-2 text-lg font-bold">{spot(currentSpot)}</h3>
                  <div className="mt-3 flex flex-wrap items-baseline gap-3">
                    <span className="text-4xl font-bold tabular-nums">{currentSpotSummary.total ? `${Math.round(currentSpotSummary.aligned * 100)}%` : "—"}</span>
                    <span className="text-sm text-muted-foreground">{t("stats.sample", { n: currentSpotSummary.total, p: currentSpotSummary.total ? Math.round(currentSpotSummary.aligned * 100) : 0 })}</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.min(100, currentSpotSummary.total / 8 * 100)}%` }} /></div>
                  <p className="mt-2 text-xs text-muted-foreground">{t("stats.threshold", { n: currentSpotSummary.total, goal: 8 })}</p>
                </div>
                <div className="flex flex-col justify-between gap-3 rounded-xl border p-4" aria-label={t("progress.spot.label")}>
                  <div><div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mãos nesta sessão</div><div className="mt-1 text-2xl font-bold tabular-nums">{hands}</div></div>
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-[width] ${currentSpotCount >= 8 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${statsProgress}%` }} /></div>
                    <span className="text-sm font-bold tabular-nums">{Math.min(currentSpotCount, 8)}/8</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs"><span className={currentSpotCount >= 8 ? "font-semibold text-emerald-600" : "text-muted-foreground"}>{currentSpotCount >= 8 ? "Amostra mínima atingida" : "Coletando dados"}</span><span className="text-muted-foreground">{statsProgress}%</span></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl bg-emerald-950/5 p-1 sm:p-2">
                <Table hand={drill.hand} reveal={drill.hand.street === "showdown"} />
              </div>
              {over ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
                  <b>{res(resultBB(drill))}</b>
                  <Button size="lg" onClick={next}>{t("next")} <kbd className="ml-1 text-xs opacity-60">Enter</kbd></Button>
                </div>
              ) : <div className="rounded-xl border bg-muted/20 p-2 sm:p-3"><ActionBar hand={drill.hand} onAct={act} /></div>}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        {last && <FeedbackCard f={last} />}
        <details className="rounded-xl border bg-card p-3 text-sm">
          <summary className="cursor-pointer font-semibold">{t("history")}</summary>
          <ul className="mt-3 space-y-1 text-muted-foreground">{drill.log.map((l, i) => <li key={i}>{line(l)}</li>)}</ul>
          {drill.feedback.length > 1 && <div className="mt-3 space-y-2">{drill.feedback.slice(0, -1).map((f, i) => <FeedbackCard key={i} f={f} />)}</div>}
        </details>
        <div className="space-y-1 rounded-xl border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">{t("coach.note")}</p>
          {drill.stackBB !== 100 && <p className="text-xs text-muted-foreground">{t("ctl.note")}</p>}
          <p className="text-xs text-muted-foreground">{t("keys")}</p>
        </div>
      </section>
    </div>
  );
}
