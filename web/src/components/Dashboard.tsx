"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { clearDecisions, loadDecisions, summarize } from "../game/stats";
import { useI18n } from "../i18n";

export function Dashboard({ onPractice, onReset }: { onPractice: () => void; onReset: () => void }) {
  const { t, spot } = useI18n();
  const [s, setS] = useState<ReturnType<typeof summarize> | null>(null);
  useEffect(() => {
    let active = true;
    void loadDecisions().then((decisions) => { if (active) setS(summarize(decisions)); });
    return () => { active = false; };
  }, []);
  if (!s) return null;
  const leaks = s.spots.filter((x) => x.status === "preliminary" || x.status === "likely");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="text-lg font-semibold">{t("dash.title", { n: s.total, p: s.total ? Math.round(s.aligned * 100) : "—" })}</div>
        <p className="text-sm text-muted-foreground">{t("dash.note")}</p>
      </div>
      {leaks.map((l) => (
        <div key={l.spot} className="rounded-lg border-l-4 border-orange-600 bg-card p-3 text-sm">
          <b>{t(`st.${l.status}`)}</b> · {t("leak.line", { s: spot(l.spot), d: t(`dev.${l.topDeviation}`), n: l.n })}{l.status === "preliminary" ? t("leak.small") : ""}
          <div className="mt-2"><Button size="sm" onClick={onPractice}>{t("practice")}</Button></div>
        </div>
      ))}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b"><th className="p-2">{t("th.spot")}</th><th className="p-2">n</th><th className="p-2">{t("th.on")}</th><th className="p-2">{t("th.dev")}</th><th className="p-2">{t("th.status")}</th></tr></thead>
          <tbody>
            {s.spots.map((x) => <tr key={x.spot} className="border-b last:border-0"><td className="p-2">{spot(x.spot)}</td><td className="p-2">{x.n}</td><td className="p-2">{Math.round(x.aligned * 100)}%</td><td className="p-2">{x.topDeviation ? t(`dev.${x.topDeviation}`) : "—"}</td><td className="p-2">{t(`st.${x.status}`)}</td></tr>)}
            {!s.spots.length && <tr><td className="p-3 text-muted-foreground" colSpan={5}>{t("empty")}</td></tr>}
          </tbody>
        </table>
      </div>
      <Button variant="outline" size="sm" onClick={() => { if (confirm(t("confirm"))) { void clearDecisions().then(() => setS(summarize([]))); onReset(); } }}>{t("reset")}</Button>
    </div>
  );
}
