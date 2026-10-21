"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dashboard } from "./Dashboard";
import { TrainView } from "./TrainView";

type View = "train" | "dashboard";
const NAV: { id: View; label: string; icon: string }[] = [
  { id: "train", label: "Training", icon: "🃏" },
  { id: "dashboard", label: "Dashboard", icon: "📊" },
];

export function AppShell() {
  const [view, setView] = useState<View>("train");
  const [dark, setDark] = useState(false);
  useEffect(() => {
    let s: string | null = null;
    try { s = localStorage.getItem("pk_theme"); } catch { /* ignore */ }
    setDark(s ? s === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("pk_theme", dark ? "dark" : "light"); } catch { /* ignore */ }
  }, [dark]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r p-4 md:flex">
        <div className="mb-4 text-lg font-bold">♠ Poker Coach</div>
        {NAV.map((n) => <Button key={n.id} variant={view === n.id ? "secondary" : "ghost"} className="justify-start" onClick={() => setView(n.id)}>{n.icon} {n.label}</Button>)}
        <div className="mt-auto"><Button variant="outline" size="sm" onClick={() => setDark(!dark)}>{dark ? "Light mode" : "Dark mode"}</Button></div>
      </aside>
      <main className="flex-1 p-4 pb-24 md:pb-4">
        <div className="mb-3 flex items-center justify-between md:hidden">
          <b>♠ Poker Coach</b>
          <Button variant="outline" size="sm" onClick={() => setDark(!dark)}>{dark ? "☀️" : "🌙"}</Button>
        </div>
        {view === "train" ? <TrainView /> : <Dashboard onPractice={() => setView("train")} />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t bg-background md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {NAV.map((n) => <button key={n.id} onClick={() => setView(n.id)} className={`flex-1 py-3 text-sm ${view === n.id ? "font-bold text-primary" : "text-muted-foreground"}`}>{n.icon}<br />{n.label}</button>)}
      </nav>
    </div>
  );
}
