"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { spotLabel } from "../game/drill";
import { clearDecisions, loadDecisions, summarize } from "../game/stats";

const STATUS = { ok: "OK", insufficient: "Too few hands", preliminary: "Preliminary leak", likely: "Likely leak" };

export function Dashboard({ onPractice }: { onPractice: () => void }) {
  const [s, setS] = useState<ReturnType<typeof summarize> | null>(null);
  useEffect(() => setS(summarize(loadDecisions())), []);
  if (!s) return null;
  const leaks = s.spots.filter((x) => x.status === "preliminary" || x.status === "likely");
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="text-lg font-semibold">{s.total} decisions · {s.total ? Math.round(s.aligned * 100) : "—"}% on reference</div>
        <p className="text-sm text-muted-foreground">Compared with a heuristic reference, not a solver. Hand results are never used to judge decisions.</p>
      </div>
      {leaks.map((l) => (
        <div key={l.spot} className="rounded-lg border-l-4 border-orange-600 bg-card p-3 text-sm">
          <b>{STATUS[l.status]}: {spotLabel(l.spot)}</b> — mostly <b>{l.topDeviation}</b> over {l.n} decisions.{l.status === "preliminary" ? " Small sample: treat as a hypothesis." : ""}
          <div className="mt-2"><Button size="sm" onClick={onPractice}>Practice</Button></div>
        </div>
      ))}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b"><th className="p-2">Spot</th><th className="p-2">n</th><th className="p-2">On ref.</th><th className="p-2">Main deviation</th><th className="p-2">Status</th></tr></thead>
          <tbody>
            {s.spots.map((x) => <tr key={x.spot} className="border-b last:border-0"><td className="p-2">{spotLabel(x.spot)}</td><td className="p-2">{x.n}</td><td className="p-2">{Math.round(x.aligned * 100)}%</td><td className="p-2">{x.topDeviation ?? "—"}</td><td className="p-2">{STATUS[x.status]}</td></tr>)}
            {!s.spots.length && <tr><td className="p-3 text-muted-foreground" colSpan={5}>No data yet. Play a few hands first.</td></tr>}
          </tbody>
        </table>
      </div>
      <Button variant="outline" size="sm" onClick={() => { if (confirm("Delete all saved decisions?")) { clearDecisions(); setS(summarize([])); } }}>Reset data</Button>
    </div>
  );
}
