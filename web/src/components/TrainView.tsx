"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Action } from "../engine/hand";
import { DEFAULT_OPTIONS, SCENARIOS, heroAct, isOver, newDrill, resultBB, type Drill, type DrillOptions, type Feedback } from "../game/drill";
import { saveDecision } from "../game/stats";
import { useI18n } from "../i18n";
import { ActionBar } from "./ActionBar";
import { Table } from "./Table";

const sel = "rounded-md border bg-background px-2 py-1 text-sm";
const TEXES = ["any", "dry", "wet", "paired", "mono"] as const;
const TONE = { good: "border-green-600", ok: "border-yellow-500", miss: "border-orange-600" };

function FeedbackCard({ f }: { f: Feedback }) {
  const { t, spot, why } = useI18n();
  const alt = f.acceptable.length ? t("fb.alt", { a: f.acceptable.join(", ") }) : "";
  return (
    <div className={`rounded-lg border-l-4 bg-card p-3 text-sm shadow-sm ${TONE[f.verdict]}`}>
      <div className="font-semibold">{t(`v.${f.verdict}`)} · {spot(f.spot)}</div>
      <div>{t("fb.line", { a: f.action, p: f.preferred.join(" / "), alt })}</div>
      <div className="mt-1 text-muted-foreground">{why(f.why)}</div>
    </div>
  );
}

export function TrainView() {
  const { t, line, res } = useI18n();
  const [drill, setDrill] = useState<Drill | null>(null);
  const [opts, setOpts] = useState<DrillOptions>(DEFAULT_OPTIONS);
  const [hands, setHands] = useState(0);
  const [score, setScore] = useState({ sum: 0, n: 0 });
  useEffect(() => setDrill(newDrill()), []);
  const over = drill ? isOver(drill) : false;
  const next = () => { setDrill(newDrill(undefined, opts)); setHands((h) => h + 1); };
  const change = (p: Partial<DrillOptions>) => { const o = { ...opts, ...p }; setOpts(o); setDrill(newDrill(undefined, o)); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (over && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); next(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  if (!drill) return <div className="p-6 text-muted-foreground">{t("dealing")}</div>;
  const act = (a: Action) => {
    const nd = heroAct(drill, a);
    const f = nd.feedback[nd.feedback.length - 1];
    saveDecision({ spot: f.spot, action: f.action, score: f.score, deviation: f.deviation, ts: Date.now() });
    setScore((s) => ({ sum: s.sum + f.score, n: s.n + 1 }));
    setDrill(nd);
  };
  const last = drill.feedback[drill.feedback.length - 1];
  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-1">{t("ctl.scenario")}
          <select className={sel} value={opts.scenario} onChange={(e) => change({ scenario: e.target.value as DrillOptions["scenario"] })}>{SCENARIOS.map((x) => <option key={x} value={x}>{t(`sc.${x}`)}</option>)}</select></label>
        <label className="flex items-center gap-1">{t("ctl.stack")}
          <select className={sel} value={opts.stackBB} onChange={(e) => change({ stackBB: +e.target.value })}>{[40, 100, 200].map((x) => <option key={x} value={x}>{x}bb</option>)}</select></label>
        <label className="flex items-center gap-1">{t("ctl.texture")}
          <select className={sel} value={opts.texture} onChange={(e) => change({ texture: e.target.value as DrillOptions["texture"] })}>{TEXES.map((x) => <option key={x} value={x}>{t(`tex.${x}`)}</option>)}</select></label>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{t("hand", { n: hands + 1, sc: t(`sc.${opts.scenario}`), st: opts.stackBB })}</span>
        <span>{score.n ? t("session.some", { p: Math.round((score.sum / score.n) * 100), n: score.n }) : t("session.none")}</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Table hand={drill.hand} reveal={drill.hand.street === "showdown"} />
          {over ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
              <b>{res(resultBB(drill))}</b>
              <Button size="lg" onClick={next}>{t("next")} <kbd className="ml-1 text-xs opacity-60">Enter</kbd></Button>
            </div>
          ) : <ActionBar hand={drill.hand} onAct={act} />}
        </div>
        <div className="space-y-3">
          {last && <FeedbackCard f={last} />}
          <details className="rounded-lg border bg-card p-3 text-sm">
            <summary className="cursor-pointer font-medium">{t("history")}</summary>
            <ul className="mt-2 space-y-0.5 text-muted-foreground">{drill.log.map((l, i) => <li key={i}>{line(l)}</li>)}</ul>
            <div className="mt-3 space-y-2">{drill.feedback.slice(0, -1).map((f, i) => <FeedbackCard key={i} f={f} />)}</div>
          </details>
          <p className="text-xs text-muted-foreground">{t("compass.note")}</p>
          {opts.stackBB !== 100 && <p className="text-xs text-muted-foreground">{t("ctl.note")}</p>}
          <p className="text-xs text-muted-foreground">{t("keys")}</p>
        </div>
      </div>
    </div>
  );
}
