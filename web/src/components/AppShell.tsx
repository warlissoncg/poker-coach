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
const sel = "w-full rounded-md border bg-background px-2 py-2 text-sm";

function Shell() {
  const { t, lang, setLang } = useI18n();
  const [view, setView] = useState<View>("train");
  const [theme, setTheme] = useState<Theme>("system");
  const [tour, setTour] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);

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
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">Tema
        <select className={sel} value={theme} onChange={(e) => setTheme(e.target.value as Theme)} aria-label="Theme">
          {(["system", "light", "dark"] as Theme[]).map((x) => <option key={x} value={x}>{t(`theme.${x}`)}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">Idioma
        <select className={sel} value={lang} onChange={(e) => setLang(e.target.value as "pt" | "en")} aria-label="Language">
          <option value="pt">Português</option><option value="en">English</option>
        </select>
      </label>
      <div className="border-t pt-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ferramentas</div>
        <Button variant={view === "dashboard" ? "secondary" : "outline"} className="mb-2 w-full justify-start" size="sm" onClick={() => setView("dashboard")}>{t("nav.dashboard")}</Button>
        <Button variant={view === "guide" ? "secondary" : "outline"} className="mb-2 w-full justify-start" size="sm" onClick={() => setView("guide")}>{t("nav.guide")}</Button>
        <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => setTour(true)}>{t("tour.open")}</Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {tour && <Tour onClose={closeTour} />}

      {/* Collapsed by default: a compact rail keeps the settings one click away. */}
      <aside className={`hidden shrink-0 border-r transition-[width] duration-200 md:flex md:flex-col ${sidebarOpen ? "w-64 p-4" : "w-12 items-center py-3"}`}>
        {sidebarOpen ? (
          <>
            <div className="mb-5 flex items-center gap-3 border-b border-border pb-5">
              <BrandAvatar size={44} className="shrink-0" />
              <div className="min-w-0"><div className="text-sm font-black uppercase tracking-[0.14em]">Poker Coach</div><div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-primary">The Grind Lab</div><div className="mt-1 text-[10px] text-muted-foreground">Treine. Analise. Evolua.</div></div>
            </div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">Configurações</span>
              <div className="flex gap-1">
                <Button variant={sidebarPinned ? "secondary" : "ghost"} size="icon" aria-label={sidebarPinned ? "Desafixar painel" : "Fixar painel"} title={sidebarPinned ? "Desafixar painel" : "Fixar painel"} onClick={() => setSidebarPinned((p) => !p)}>{sidebarPinned ? "📌" : "⌖"}</Button>
                <Button variant="ghost" size="icon" aria-label="Recolher painel" title="Recolher painel" onClick={() => { setSidebarOpen(false); setSidebarPinned(false); }}>‹</Button>
              </div>
            </div>
            {controls}
            <div className="mt-auto pt-4 text-[10px] text-muted-foreground">{sidebarPinned ? "Painel fixado" : "Painel temporário"}</div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Abrir configurações" title="Abrir configurações" onClick={() => setSidebarOpen(true)}>☰</Button>
            <div className="my-1 h-px w-6 bg-border" />
            <BrandAvatar size={30} />
            <div className="mt-auto"><Button variant="ghost" size="icon" aria-label="Abrir configurações" title="Configurações" onClick={() => setSidebarOpen(true)}>⚙</Button></div>
          </div>
        )}
      </aside>

      <main className="min-w-0 flex-1 p-3 pb-24 md:p-4 md:pb-4">
        <div className="mb-3 flex items-center justify-between gap-2 md:hidden">
          <div className="flex items-center gap-2"><BrandAvatar size={34} /><div><b className="block text-sm">Poker Coach</b><span className="text-[10px] uppercase tracking-[0.18em] text-primary">The Grind Lab</span></div></div>
          <Button variant="outline" size="sm" onClick={() => setSidebarOpen((v) => !v)}>{t("settings.title")}</Button>
        </div>
        {view === "train" && <TrainView />}
        {view === "dashboard" && <Dashboard onPractice={() => setView("train")} onReset={() => setTour(true)} />}
        {view === "stats" && <StatsView />}
        {view === "guide" && <Guide />}
      </main>

      {sidebarOpen && !sidebarPinned && <button className="fixed inset-0 z-20 hidden cursor-default bg-black/10 md:block" aria-label="Fechar painel de configurações" onClick={() => setSidebarOpen(false)} />}
      {sidebarOpen && !sidebarPinned && <div className="fixed left-12 top-0 z-30 hidden h-screen w-64 border-r bg-background p-4 shadow-xl md:flex md:flex-col">
        <div className="mb-5 flex items-center gap-3 border-b border-border pb-5"><BrandAvatar size={44} className="shrink-0" /><div><div className="text-sm font-black uppercase tracking-[0.14em]">Poker Coach</div><div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-primary">The Grind Lab</div></div></div>
        <div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold">Configurações</span><div className="flex gap-1"><Button variant="secondary" size="icon" aria-label="Fixar painel" onClick={() => setSidebarPinned(true)}>📌</Button><Button variant="ghost" size="icon" aria-label="Fechar painel" onClick={() => setSidebarOpen(false)}>×</Button></div></div>
        {controls}
      </div>}

      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t bg-background md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <button onClick={() => setView("train")} className={`flex-1 py-3 text-sm ${view === "train" ? "font-bold text-primary" : "text-muted-foreground"}`}>Treino</button>
        <button onClick={() => setView("stats")} className={`flex-1 py-3 text-sm ${view === "stats" ? "font-bold text-primary" : "text-muted-foreground"}`}>Estatísticas</button>
      </nav>
    </div>
  );
}

export function AppShell() {
  return <LangProvider><Shell /></LangProvider>;
}
