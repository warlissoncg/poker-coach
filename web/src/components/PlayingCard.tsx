import { RANKS, type Card } from "../engine/cards";

const SYM = ["♠", "♥", "♦", "♣"];

export function PlayingCard({ card, hidden }: { card?: Card; hidden?: boolean }) {
  if (!card || hidden)
    return <div className={`h-14 w-10 rounded-md border-2 ${card ? "border-white/60 bg-sky-900" : "border-dashed border-white/30"}`} />;
  const red = card.suit === 1 || card.suit === 2;
  return (
    <div
      style={{ animation: "deal .25s ease-out" }}
      className={`flex h-14 w-10 flex-col items-center justify-center rounded-md border bg-white text-base font-bold leading-tight shadow ${red ? "text-red-600" : "text-slate-900"}`}
    >
      <span>{RANKS[card.rank]}</span>
      <span>{SYM[card.suit]}</span>
    </div>
  );
}
