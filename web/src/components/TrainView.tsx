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
    <div className="mx-auto max-w-5xl space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-1">{t("ctl.scenario")}
          <select className={sel} value={opts.scenario} onChange={(e) => change({ scenario: e.target.value as DrillOptions["scenario"] })}>{(["any", ...SCENARIOS] as const).map((x) => <option key={x} value={x}>{x === "any" ? t("tex.any") : t(`sc.${x}`)}</option>)}</select></label>
        <label className="flex items-center gap-1">{t("ctl.stack")}
          <select className={sel} value={opts.stackBB} onChange={(e) => change({ stackBB: e.target.value === "any" ? "any" : +e.target.value })}>{(["any", 40, 100, 200] as const).map((x) => <option key={x} value={x}>{x === "any" ? t("tex.any") : `${x}bb`}</option>)}</select></label>
        <label className="flex items-center gap-1">{t("ctl.texture")}
          <select className={sel} value={opts.texture} onChange={(e) => change({ texture: e.target.value as DrillOptions["texture"] })}>{TEXES.map((x) => <option key={x} value={x}>{t(`tex.${x}`)}</option>)}</select></label>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 text-sm">
        <span>{t("progress.hands", { n: hands + 1 })}</span>
        <span className="text-muted-foreground">{score.n ? t("session.some", { p: Math.round((score.sum / score.n) * 100), n: score.n }) : t("session.none")}</span>
      </div>
      {focus && opts.scenario === "any" && <div className="rounded-lg border bg-card p-3">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={focusEnabled} onChange={(e) => { setFocusEnabled(e.target.checked); setDrill(newDrill(Math.random, opts, e.target.checked ? focus?.scenario : undefined)); }} />
          <span><span className="font-medium">{t("focus.toggle")}</span><span className="block text-xs text-muted-foreground">{t("focus.recommend", { spot: spot(focus.spot), p: Math.round(focus.aligned * 100), n: focus.n })}</span></span>
        </label>
      </div>}
      <div className="grid items-stretch gap-4 lg:grid-cols-[76px_minmax(0,1fr)_300px]">
        <aside className="flex flex-row items-center justify-center gap-3 rounded-xl border bg-card p-3 lg:min-h-[360px] lg:flex-col lg:justify-between" aria-label={t("progress.spot.label")}>
          <div className="text-center lg:order-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mãos</div>
            <div className="mt-1 text-lg font-bold tabular-nums">{hands}</div>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-3 lg:order-2 lg:flex-none lg:flex-col">
            <div className="relative flex h-40 w-8 items-end justify-center rounded-full border-2 border-muted-foreground/50 bg-muted/60 p-1 lg:h-64">
              <div className="absolute -top-2 left-1/2 z-10 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-amber-500 bg-card shadow-sm" title={currentSpotCount >= 8 ? "Amostra mínima atingida" : "Amostra mínima: 8 decisões"} />
              <div className="relative flex h-full w-full items-end overflow-hidden rounded-full">
                <div className={`w-full rounded-full transition-[height] duration-700 ease-out ${currentSpotCount >= 8 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ height: `${statsProgress}%` }} />
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold tabular-nums">{Math.min(currentSpotCount, 8)}/8</div>
              <div className="text-[10px] leading-tight text-muted-foreground">decisões</div>
            </div>
          </div>
          <div className="text-center lg:order-3">
            <div className={`text-[10px] font-semibold uppercase tracking-wider ${currentSpotCount >= 8 ? "text-emerald-600" : "text-muted-foreground"}`}>{currentSpotCount >= 8 ? "Amostra mínima" : "Coletando dados"}</div>
            <div className="text-[10px] text-muted-foreground">{statsProgress}%</div>
          </div>
        </aside>
        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{t("hand", { n: hands + 1, sc: t(`sc.${drill.scenario}`), st: drill.stackBB })}</span>
            <span className="hidden sm:inline">{showSpotStats ? "ESTATÍSTICA" : "TREINO"}</span>
          </div>
          <div className="flex justify-center">
            <button type="button" onClick={() => setShowSpotStats((v) => !v)} aria-label={showSpotStats ? "Flip Card: voltar para Treino" : "Flip Card: abrir Estatística"} aria-pressed={showSpotStats} className="group relative flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full border-[5px] border-amber-500 bg-emerald-950 text-center text-[10px] font-black uppercase leading-tight tracking-wider text-amber-100 shadow-[0_5px_0_rgba(0,0,0,0.25)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 active:translate-y-0 active:shadow-sm" title="Flip Card">
            <span className="pointer-events-none absolute inset-[4px] rounded-full border border-amber-300/70" />
            <span className="relative max-w-[54px]">FLIP<br />CARD</span>
          </button>
          </div>
          <div className="h-[560px] overflow-y-auto space-y-2 rounded-xl border bg-card p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2 border-b pb-3">
              <h2 className="text-sm font-bold uppercase tracking-widest">{showSpotStats ? "Estatística" : "Treino"}</h2>
              <span className="text-xs text-muted-foreground">{showSpotStats ? "Visão de desempenho" : "Mesa ativa"}</span>
            </div>
            {showSpotStats ? (
              <div className="min-h-64 p-1">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{t("stats.byspot")}</div>
                <h3 className="mt-2 text-lg font-semibold">{spot(currentSpot)}</h3>
                <div className="my-4 text-4xl font-bold tabular-nums">{currentSpotSummary.total ? `${Math.round(currentSpotSummary.aligned * 100)}%` : "—"}</div>
                <p className="text-sm text-muted-foreground">{t("stats.sample", { n: currentSpotSummary.total, p: currentSpotSummary.total ? Math.round(currentSpotSummary.aligned * 100) : 0 })}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, currentSpotSummary.total / 8 * 100)}%` }} /></div>
                <p className="mt-3 text-xs text-muted-foreground">{t("stats.threshold", { n: currentSpotSummary.total, goal: 8 })}</p>
              </div>
            ) : (
              <>
                <Table hand={drill.hand} reveal={drill.hand.street === "showdown"} />
                {over ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
                    <b>{res(resultBB(drill))}</b>
                    <Button size="lg" onClick={next}>{t("next")} <kbd className="ml-1 text-xs opacity-60">Enter</kbd></Button>
                  </div>
                ) : <div className="mt-4"><ActionBar hand={drill.hand} onAct={act} /></div>}
              </>
            )}
          </div>
        </div>
        <div className="space-y-3">
          {last && <FeedbackCard f={last} />}
          <details className="rounded-lg border bg-card p-3 text-sm">
            <summary className="cursor-pointer font-medium">{t("history")}</summary>
            <ul className="mt-2 space-y-0.5 text-muted-foreground">{drill.log.map((l, i) => <li key={i}>{line(l)}</li>)}</ul>
            <div className="mt-3 space-y-2">{drill.feedback.slice(0, -1).map((f, i) => <FeedbackCard key={i} f={f} />)}</div>
          </details>
          <p className="text-xs text-muted-foreground">{t("coach.note")}</p>
          {drill.stackBB !== 100 && <p className="text-xs text-muted-foreground">{t("ctl.note")}</p>}
          <p className="text-xs text-muted-foreground">{t("keys")}</p>
        </div>
      </div>
    </div>
  );
}
