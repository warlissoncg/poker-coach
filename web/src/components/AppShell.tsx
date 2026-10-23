"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { loadDecisions, markTourSeen, tourSeen } from "../game/stats";
import { LangProvider, useI18n } from "../i18n";
import { Dashboard } from "./Dashboard";
import { Guide } from "./Guide";
import { Tour } from "./Tour";
import { TrainView } from "./TrainView";

type View = "train" | "dashboard" | "guide";
type Theme = "system" | "light" | "dark";
const NAV: { id: View }[] = [{ id: "train" }, { id: "dashboard" }, { id: "guide" }];
const sel = "rounded-md border bg-background px-2 py-1 text-sm";

function Shell() {
  const { t, lang, setLang } = useI18n();
  const [view, setView] = useState<View>("train");
  const [theme, setTheme] = useState<Theme>("system");
  const [tour, setTour] = useState(false);
  useEffect(() => {
    try { const s = localStorage.getItem("pk_theme"); if (s === "light" || s === "dark" || s === "system") setTheme(s); } catch { /* ignore */ }
    if (!tourSeen() && loadDecisions().length === 0) setTour(true);
  }, []);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && mq.matches));
    apply();
    mq.addEventListener("change", apply);
    try { localStorage.setItem("pk_theme", theme); } catch { /* ignore */ }
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
  const closeTour = () => { markTourSeen(); setTour(false); };
  const controls = (
    <>
      <select className={sel} value={theme} onChange={(e) => setTheme(e.target.value as Theme)} aria-label="Theme">
        {(["system", "light", "dark"] as Theme[]).map((x) => <option key={x} value={x}>{t(`theme.${x}`)}</option>)}
      </select>
      <select className={sel} value={lang} onChange={(e) => setLang(e.target.value as "pt" | "en")} aria-label="Language">
        <option value="pt">Português</option><option value="en">English</option>
      </select>
    </>
  );
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {tour && <Tour onClose={closeTour} />}
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r p-4 md:flex">
        <div className="mb-4 text-lg font-bold">♠ Poker Coach</div>
        {NAV.map((n) => <Button key={n.id} variant={view === n.id ? "secondary" : "ghost"} className="justify-start" onClick={() => setView(n.id)}>{t(`nav.${n.id}`)}</Button>)}
        <div className="mt-auto flex flex-col gap-2">{controls}<Button variant="outline" size="sm" onClick={() => setTour(true)}>{t("tour.open")}</Button></div>
      </aside>
      <main className="flex-1 p-4 pb-24 md:pb-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 md:hidden"><b>♠ Poker Coach</b><div className="flex gap-2">{controls}</div></div>
        {view === "train" && <TrainView />}
        {view === "dashboard" && <Dashboard onPractice={() => setView("train")} onReset={() => setTour(true)} />}
        {view === "guide" && <Guide />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t bg-background md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {NAV.map((n) => <button key={n.id} onClick={() => setView(n.id)} className={`flex-1 py-3 text-sm ${view === n.id ? "font-bold text-primary" : "text-muted-foreground"}`}>{t(`nav.${n.id}`)}</button>)}
      </nav>
    </div>
  );
}

export function AppShell() {
  return <LangProvider><Shell /></LangProvider>;
}
