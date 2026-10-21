"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Action } from "../engine/hand";
import { heroAct, isOver, newDrill, resultText, type Drill, type Feedback } from "../game/drill";
import { saveDecision } from "../game/stats";
import { ActionBar } from "./ActionBar";
import { Table } from "./Table";

const TONE = { good: "border-green-600", ok: "border-yellow-500", miss: "border-orange-600" };
const WORD = { good: "On reference", ok: "Acceptable", miss: "Off reference" };

function FeedbackCard({ f }: { f: Feedback }) {
  return (
    <div className={`rounded-lg border-l-4 bg-card p-3 text-sm shadow-sm ${TONE[f.verdict]}`}>
      <div className="font-semibold">{WORD[f.verdict]} · {f.label}</div>
      <div>You chose <b>{f.action}</b>. Heuristic preferred: <b>{f.preferred.join(" / ")}</b>{f.acceptable.length ? ` (acceptable: ${f.acceptable.join(", ")})` : ""}.</div>
      <div className="mt-1 text-muted-foreground">{f.why}</div>
    </div>
  );
}

export function TrainView() {
  const [drill, setDrill] = useState<Drill | null>(null);
  const [hands, setHands] = useState(0);
  const [score, setScore] = useState({ sum: 0, n: 0 });
  useEffect(() => setDrill(newDrill()), []);
  const over = drill ? isOver(drill) : false;

  const next = () => { setDrill(newDrill()); setHands((h) => h + 1); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (over && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); next(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!drill) return <div className="p-6 text-muted-foreground">Dealing…</div>;
  const act = (a: Action) => {
    const nd = heroAct(drill, a);
    const f = nd.feedback[nd.feedback.length - 1];
    saveDecision({ spot: f.spot, action: f.action, score: f.score, deviation: f.deviation, ts: Date.now() });
    setScore((s) => ({ sum: s.sum + f.score, n: s.n + 1 }));
    setDrill(nd);
  };
  const last = drill.feedback[drill.feedback.length - 1];
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Hand {hands + 1} · BTN vs BB · 100bb</span>
        <span>Session: {score.n ? `${Math.round((score.sum / score.n) * 100)}% on reference (${score.n})` : "no decisions yet"}</span>
      </div>
      <Table hand={drill.hand} reveal={drill.hand.street === "showdown"} />
      {over ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
          <b>{resultText(drill)}</b>
          <Button size="lg" onClick={next}>Next hand <kbd className="ml-1 text-xs opacity-60">Enter</kbd></Button>
        </div>
      ) : <ActionBar hand={drill.hand} onAct={act} />}
      {last && <FeedbackCard f={last} />}
      <details className="rounded-lg border bg-card p-3 text-sm">
        <summary className="cursor-pointer font-medium">Action history &amp; earlier feedback</summary>
        <ul className="mt-2 space-y-0.5 text-muted-foreground">{drill.log.map((l, i) => <li key={i}><b>{l.street}:</b> {l.text}</li>)}</ul>
        <div className="mt-3 space-y-2">{drill.feedback.slice(0, -1).map((f, i) => <FeedbackCard key={i} f={f} />)}</div>
      </details>
      <p className="text-xs text-muted-foreground">Feedback is heuristic, not solver output. Shortcuts: F fold · C call/check · B bet/raise · 1–4 size presets · Enter next hand.</p>
    </div>
  );
}
