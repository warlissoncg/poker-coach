"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { loadDecisions, markTourSeen, tourSeen } from "../game/stats";
import { LangProvider, useI18n } from "../i18n";
import { Dashboard } from "./Dashboard";
import { Guide } from "./Guide";
import { Tour } from "./Tour";
import { TrainView } from "./TrainView";
import { StatsView } from "./StatsView";
import { BrandAvatar } from "./BrandAvatar";

type View = "train" | "dashboard" | "stats" | "guide";
type Theme = "system" | "light" | "dark";
const NAV: { id: View }[] = [{ id: "train" }, { id: "stats" }];
const sel = "rounded-md border bg-background px-2 py-1 text-sm";

function Shell() {
  const { t, lang, setLang } = useI18n();
  const [view, setView] = useState<View>("train");
  const [theme, setTheme] = useState<Theme>("system");
  const [tour, setTour] = useState(false);
  useEffect(() => {
    let active = true;
    try { const s = localStorage.getItem("pk_theme"); if (s === "light" || s === "dark" || s === "system") setTheme(s); } catch { /* ignore */ }
    void loadDecisions().then((decisions) => {
      if (active && !tourSeen() && decisions.length === 0) setTour(true);
    });
    return () => { active = false; };
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
      <select className={sel} value={theme} onChange={(e) => { setTheme(e.target.value as Theme); e.currentTarget.closest("details")?.removeAttribute("open"); }} aria-label="Theme">
        {(["system", "light", "dark"] as Theme[]).map((x) => <option key={x} value={x}>{t(`theme.${x}`)}</option>)}
      </select>
      <select className={sel} value={lang} onChange={(e) => { setLang(e.target.value as "pt" | "en"); e.currentTarget.closest("details")?.removeAttribute("open"); }} aria-label="Language">
        <option value="pt">Português</option><option value="en">English</option>
      </select>
    </>
  );
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {tour && <Tour onClose={closeTour} />}
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r p-4 md:flex">
        <div className="mb-5 flex items-center gap-3 border-b border-border pb-5"><BrandAvatar size={52} className="shrink-0" /><div><div className="text-sm font-black uppercase tracking-[0.18em]">Poker Coach</div><div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-primary">The Grind Lab</div><div className="mt-1 text-[10px] text-muted-foreground">Treine. Analise. Evolua.</div></div></div>
        {NAV.map((n) => <Button key={n.id} variant={view === n.id ? "secondary" : "ghost"} className="justify-start" onClick={() => setView(n.id)}>{t(`nav.${n.id}`)}</Button>)}
        <div className="mt-auto"><details className="rounded-lg border p-3"><summary className="cursor-pointer text-sm font-medium">{t("settings.title")}</summary><div className="mt-3 flex flex-col gap-2">{controls}<Button variant={view === "dashboard" ? "secondary" : "outline"} size="sm" onClick={(e) => { setView("dashboard"); e.currentTarget.closest("details")?.removeAttribute("open"); }}>{t("nav.dashboard")}</Button><Button variant={view === "guide" ? "secondary" : "outline"} size="sm" onClick={(e) => { setView("guide"); e.currentTarget.closest("details")?.removeAttribute("open"); }}>{t("nav.guide")}</Button><Button variant="outline" size="sm" onClick={(e) => { setTour(true); e.currentTarget.closest("details")?.removeAttribute("open"); }}>{t("tour.open")}</Button></div></details></div>
      </aside>
      <main className="flex-1 p-4 pb-24 md:pb-4">
        <div className="mb-3 flex items-center justify-between gap-2 md:hidden"><div className="flex items-center gap-2"><BrandAvatar size={34} /><div><b className="block text-sm">Poker Coach</b><span className="text-[10px] uppercase tracking-[0.18em] text-primary">The Grind Lab</span></div></div><details className="relative"><summary className="cursor-pointer rounded-md border px-3 py-2 text-sm">{t("settings.title")}</summary><div className="absolute right-0 z-20 mt-2 flex min-w-44 flex-col gap-2 rounded-lg border bg-card p-3 shadow-lg">{controls}<Button variant="outline" size="sm" onClick={() => setView("dashboard")}>{t("nav.dashboard")}</Button><Button variant="outline" size="sm" onClick={() => setView("guide")}>{t("nav.guide")}</Button><Button variant="outline" size="sm" onClick={() => setTour(true)}>{t("tour.open")}</Button></div></details></div>
        {view === "train" && <TrainView />}
        {view === "dashboard" && <Dashboard onPractice={() => setView("train")} onReset={() => setTour(true)} />}
        {view === "stats" && <StatsView />}
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
