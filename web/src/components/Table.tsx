"use client";
import { potSize, type HandState } from "../engine/hand";
import { HERO, VILLAIN, bb } from "../game/drill";
import { useI18n } from "../i18n";
import { PlayingCard } from "./PlayingCard";
import { ChipStack } from "./ChipStack";

const ORDER = ["SB", "BB", "UTG", "HJ", "CO", "BTN"]; // clockwise around a 6-max table

export function Table({ hand, reveal }: { hand: HandState; reveal: boolean }) {
  const { t } = useI18n();
  const hero = hand.players.find((p) => p.id === HERO)!;
  const vil = hand.players.find((p) => p.id === VILLAIN)!;
  const turn = hand.pending[0];
  const h = ORDER.indexOf(hero.position);
  // The hero always sits at the bottom; other seats follow clockwise.
  const at = (pos: string) => {
    const a = (((ORDER.indexOf(pos) - h + 6) % 6) * Math.PI) / 3;
    return { x: 50 - 44 * Math.sin(a), y: 50 + 40 * Math.cos(a) };
  };
  const toward = (pt: { x: number; y: number }, k: number) => ({ left: `${50 + (pt.x - 50) * k}%`, top: `${50 + (pt.y - 50) * k}%` });
  const btn = at("BTN");
  return (
    <div className="pb-6">
      <div className="relative mx-auto aspect-[16/11] w-full max-w-3xl select-none">
        <style>{"@keyframes deal{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}"}</style>
        <div className="absolute inset-x-[7%] inset-y-[13%] rounded-[50%] border-[6px] border-amber-900/70 bg-emerald-700 shadow-inner ring-1 ring-black/20 dark:border-amber-950 dark:bg-emerald-950" />
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 text-white">
          <div key={potSize(hand)} className="pot-readout rounded-full bg-black/50 px-3 py-1 text-xs font-semibold shadow-lg ring-1 ring-white/15">{t("pot")} {bb(potSize(hand))}</div>
          {potSize(hand) > 0 && <div key={`pot-chips-${potSize(hand)}`} className="flex h-3 items-end justify-center gap-0.5 opacity-90" aria-hidden="true">{Array.from({ length: Math.min(7, Math.max(2, Math.ceil(potSize(hand) / 500))) }, (_, i) => <span key={i} className={`h-2 w-3 rounded-full border border-white/70 shadow ${["bg-red-600","bg-sky-600","bg-amber-500"][i % 3]}`} style={{ transform: `translateY(${i % 2 ? 1 : 0}px)` }} />)}</div>}
          <div className="flex gap-1">{[0, 1, 2, 3, 4].map((i) => <PlayingCard key={`b${i}${hand.board[i]?.rank}${hand.board[i]?.suit}`} card={hand.board[i]} small />)}</div>
        </div>
        {ORDER.map((pos) => {
          const p = pos === hero.position ? hero : pos === vil.position ? vil : null;
          const pt = at(pos);
          return (
            <div key={pos}>
              <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1" style={{ left: `${pt.x}%`, top: `${pt.y}%` }}>
                {p && <div className="flex gap-0.5">{p.hole.map((c, i) => <PlayingCard key={`${pos}${i}${c.rank}${c.suit}`} card={c} hidden={p === vil && !reveal} small={p !== hero} />)}</div>}
                <div title={t(`gl.${pos}`)} className={`rounded-lg px-2 py-1 text-center text-xs leading-tight text-white ${p ? `bg-black/70 ring-1 ${turn === p.id ? "ring-amber-400" : "ring-white/20"}` : "bg-black/35 text-white/70"}`}>
                  <div className="font-bold">{pos}{p ? ` · ${p === hero ? t("seat.you") : t("seat.villain")}` : ""}</div>
                  {p && <div key={p.stack} className="mt-0.5 flex items-center justify-center gap-1"><ChipStack amount={p.stack} compact />{bb(p.stack)}</div>}
                </div>
              </div>
              {p && p.committed > 0 && <div key={`${pos}-${p.committed}`} className="commit-chip absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70 px-2 py-1 text-xs text-white ring-1 ring-white/15" style={toward(pt, 0.6)}><ChipStack amount={p.committed} compact label={bb(p.committed)} /></div>}
            </div>
          );
        })}
        <div className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black shadow" style={toward(btn, 0.8)} title={t("gl.BTN")}>D</div>
      </div>
    </div>
  );
}
