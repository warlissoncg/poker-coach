"use client";
import { potSize, type HandState } from "../engine/hand";
import { HERO, VILLAIN, bb } from "../game/drill";
import { useI18n } from "../i18n";
import { PlayingCard } from "./PlayingCard";

function Seat({ name, stack, bet, cards, hidden, active }: { name: string; stack: number; bet: number; cards: HandState["players"][0]["hole"]; hidden: boolean; active: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex gap-1">{cards.map((c, i) => <PlayingCard key={`${name}${i}${c.rank}${c.suit}`} card={c} hidden={hidden} />)}</div>
      <div className="text-right text-sm">
        <div className={`font-semibold ${active ? "text-amber-300" : ""}`}>{name}</div>
        <div className="opacity-80">{t("stack")} {bb(stack)}</div>
        {bet > 0 && <div className="mt-0.5 rounded-full bg-black/30 px-2 py-0.5 text-xs">{t("bet")} {bb(bet)}</div>}
      </div>
    </div>
  );
}

export function Table({ hand, reveal }: { hand: HandState; reveal: boolean }) {
  const { t } = useI18n();
  const hero = hand.players.find((p) => p.id === HERO)!;
  const vil = hand.players.find((p) => p.id === VILLAIN)!;
  const turn = hand.pending[0];
  return (
    <div className="rounded-2xl bg-emerald-700 p-4 text-white shadow-inner ring-1 ring-black/10 dark:bg-emerald-950 dark:ring-white/10">
      <style>{"@keyframes deal{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}"}</style>
      <Seat name={`${t("seat.villain")} (${vil.position})`} stack={vil.stack} bet={vil.committed} cards={vil.hole} hidden={!reveal} active={turn === VILLAIN} />
      <div className="my-4 flex flex-col items-center gap-2 rounded-xl bg-black/20 py-3">
        <div className="flex gap-1.5">{[0, 1, 2, 3, 4].map((i) => <PlayingCard key={`b${i}${hand.board[i]?.rank}${hand.board[i]?.suit}`} card={hand.board[i]} />)}</div>
        <div className="text-sm font-medium">{t("pot")} {bb(potSize(hand))}</div>
      </div>
      <Seat name={`${t("seat.you")} (${hero.position})`} stack={hero.stack} bet={hero.committed} cards={hero.hole} hidden={false} active={turn === HERO} />
    </div>
  );
}
