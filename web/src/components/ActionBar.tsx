"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { legalActions, potSize, type Action, type HandState } from "../engine/hand";
import { HERO, bb } from "../game/drill";
import { useI18n } from "../i18n";

export function ActionBar({ hand, onAct }: { hand: HandState; onAct: (a: Action) => void }) {
  const { t } = useI18n();
  const legal = legalActions(hand);
  const range = legal?.bet ?? legal?.raise ?? null;
  const kind: "bet" | "raise" = legal?.bet ? "bet" : "raise";
  const pot = potSize(hand);
  const [size, setSize] = useState(0);
  useEffect(() => setSize(0), [hand.history.length]);

  const clamp = (x: number) => (range ? Math.max(range.min, Math.min(range.max, Math.round(x / 10) * 10)) : 0);
  const presets = !range ? [] : [
    ...(hand.street === "preflop"
      ? hand.currentBet > hand.bb ? [2.2, 3, 4].map((m) => ({ label: `${m}x`, to: hand.currentBet * m })) : [{ label: "2.5bb", to: 250 }, { label: "3bb", to: 300 }]
      : [33, 66, 100].map((p) => ({ label: `${p}%`, to: kind === "bet" ? (pot * p) / 100 : hand.currentBet + ((pot + (legal?.call ?? 0)) * p) / 100 }))
    ).map((x) => ({ label: x.label, to: clamp(x.to) })),
    { label: t("a.allin"), to: range.max },
  ];
  const to = range ? (size >= range.min && size <= range.max ? size : presets[Math.min(1, presets.length - 1)].to) : 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!legal || legal.playerId !== HERO || e.ctrlKey || e.metaKey) return;
      const k = e.key.toLowerCase();
      if (k === "f" && legal.fold) onAct({ type: "fold" });
      else if (k === "c") { if (legal.check) onAct({ type: "check" }); else if (legal.call !== null) onAct({ type: "call" }); }
      else if ((k === "b" || k === "r") && range) onAct({ type: kind, to });
      else if (/^[1-4]$/.test(k) && presets[+k - 1]) setSize(presets[+k - 1].to);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!legal || legal.playerId !== HERO) return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {legal.fold && <Button size="lg" variant="outline" onClick={() => onAct({ type: "fold" })}>{t("a.fold")} <kbd className="ml-1 text-xs opacity-60">F</kbd></Button>}
        {legal.check && <Button size="lg" variant="secondary" onClick={() => onAct({ type: "check" })}>{t("a.check")} <kbd className="ml-1 text-xs opacity-60">C</kbd></Button>}
        {legal.call !== null && <Button size="lg" variant="secondary" onClick={() => onAct({ type: "call" })}>{t("a.call", { n: bb(legal.call) })} <kbd className="ml-1 text-xs opacity-60">C</kbd></Button>}
        {range && <Button size="lg" onClick={() => onAct({ type: kind, to })}>{t(kind === "bet" ? "a.bet" : "a.raise", { n: bb(to) })} <kbd className="ml-1 text-xs opacity-60">B</kbd></Button>}
      </div>
      {range && range.max > range.min && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {presets.map((p, i) => <Button key={p.label} size="sm" variant={p.to === to ? "default" : "outline"} onClick={() => setSize(p.to)}>{p.label} <span className="ml-1 text-xs opacity-60">{i + 1}</span></Button>)}
          </div>
          <input type="range" className="w-full" min={range.min} max={range.max} step={10} value={to} onChange={(e) => setSize(+e.target.value)} aria-label={t("size")} />
        </div>
      )}
    </div>
  );
}
