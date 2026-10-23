"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { bb, type Feedback, type LogEntry } from "./game/drill";

export type Lang = "pt" | "en";
const PT: Record<string, string> = {
  "nav.train": "Treino", "nav.dashboard": "Painel", "nav.guide": "Guia", "tour.open": "Rever tour",
  "theme.system": "Tema: sistema", "theme.light": "Tema: claro", "theme.dark": "Tema: escuro",
  "seat.villain": "Vilão", "seat.you": "Você", "pot": "Pot", "stack": "Stack", "bet": "Aposta",
  "a.fold": "Fold", "a.check": "Check", "a.call": "Pagar {n}", "a.bet": "Apostar {n}", "a.raise": "Aumentar para {n}", "a.allin": "All-in", "size": "Tamanho da aposta",
  "hand": "Mão {n} · {sc} · {st}bb", "session.none": "Sessão: ainda sem decisões", "session.some": "Sessão: {p}% na rota em {n} decisões",
  "next": "Próxima mão", "history": "Histórico da mão e feedbacks anteriores", "dealing": "Distribuindo…",
  "keys": "Atalhos: F fold · C pagar/check · B apostar/aumentar · 1–4 tamanhos · Enter próxima mão.",
  "v.good": "Boa, é por aí", "v.ok": "Dá pra jogar assim", "v.miss": "Aqui você saiu da rota",
  "fb.line": "Você foi de {a}. A Bússola indicava {p}{alt}.", "fb.alt": " (ou {a}, se preferir)",
  "why.open": "Sua mão vale {n} no Chen. Pra essa situação a faixa da Bússola é simples: joga o que tem valor e folda o resto.",
  "why.facing": "Você tem {tier}. Pra pagar, precisa de uns {n}% de equity. A pergunta é se sua mão chega lá.",
  "why.bet": "Você tem {tier}{tex}. Mão forte aposta por valor, draw pode blefar, mão fraca prefere o check.",
  "why.tex": " num flop {x}",
  "tier.strong": "uma mão forte", "tier.medium": "uma mão de showdown", "tier.draw": "um projeto (draw)", "tier.air": "ar, sem valor de showdown",
  "tex.dry": "seco", "tex.wet": "molhado/conectado", "tex.paired": "pareado", "tex.mono": "monotone",
  "street.preflop": "Pré-flop", "street.flop": "Flop", "street.turn": "Turn", "street.river": "River",
  "spot.bet": "{s}: aposta", "spot.facing": "{s}: enfrentando aposta", "spot.board": "board {x}",
  "log.you": "Você", "log.opp": "Vilão", "log.fold": "dá fold", "log.check": "dá check", "log.call": "paga {n}", "log.bet": "aposta {n}", "log.raise": "aumenta para {n}",
  "res.win": "Boa! Você levou {n}bb", "res.lose": "Foram -{n}bb. Resultado não é decisão: olha a Bússola.", "res.split": "Pot dividido",
  "compass.note": "A Bússola mostra o caminho do coach com regras simples: força da mão, textura do board e pot odds. Não é solver.",
  "dash.title": "{n} decisões, {p}% na rota", "dash.note": "Eu comparo suas decisões com a Bússola. Ganhar ou perder a mão não entra na conta.",
  "th.spot": "Spot", "th.on": "Na rota", "th.dev": "Desvio principal", "th.status": "Situação",
  "st.ok": "OK", "st.insufficient": "Poucas mãos", "st.preliminary": "Possível leak", "st.likely": "Leak provável",
  "dev.tight": "foldando demais", "dev.loose": "jogando mão demais", "dev.aggressive": "agressivo demais", "dev.passive": "passivo demais",
  "leak.line": "{s}: seu desvio mais comum é {d} ({n} decisões).", "leak.small": " Ainda são poucas mãos, trata como hipótese.", "practice": "Praticar",
  "empty": "Sem dados ainda. Joga umas mãos.", "reset": "Reiniciar estatísticas", "confirm": "Apagar todas as decisões? O tour volta a aparecer.",
  "tour.skip": "Pular", "tour.back": "Voltar", "tour.next": "Próximo", "tour.done": "Começar",
  "tour.0.t": "Bora treinar", "tour.0.b": "O ciclo é simples: você joga, eu registro cada decisão, mostro onde você escapa e te levo de volta pro treino certo.",
  "tour.1.t": "Treino", "tour.1.b": "Escolhe o spot, o stack e a textura do flop. Do pré-flop ao river só aparecem ações legais. Atalhos: F, C, B, 1–4 e Enter.",
  "tour.2.t": "A Bússola", "tour.2.b": "Depois de cada decisão eu te digo se você está Na rota, numa Alternativa válida ou Fora da rota, e por quê. São regras simples de coach, não solver. Eu julgo a decisão, nunca o resultado da mão.",
  "tour.3.t": "Painel", "tour.3.b": "Aqui eu junto suas decisões por spot e mostro o desvio mais comum. Só aponto leak com pelo menos 8 decisões no mesmo spot. Antes disso, é pouca mão pra concluir qualquer coisa.",
  "tour.4.t": "Seus dados", "tour.4.b": "Tudo fica salvo só neste navegador. Se você reiniciar as estatísticas, esse tour volta. Dá pra rever quando quiser pelo menu.",
  "g.use.t": "Como usar", "g.use.b": "1) Joga umas mãos. 2) Lê a Bússola depois de cada decisão. 3) Abre o Painel pra ver seus desvios por spot. 4) Pratica os spots marcados. E repete.",
  "g.arch.t": "Como o código é organizado",
  "g.arch.b": "engine: regras do jogo (cartas, avaliador, estado da mão com pot, stacks, ações legais e side pots) e análise (textura, força da mão, pot odds). game: o treino (oponente simples, Bússola, estatísticas). components: a interface React. Cada camada só depende das anteriores e a lógica é testada sem tela.",
  "g.dep.t": "Dependências", "g.dep.b": "Next.js, React, Tailwind CSS e shadcn/ui (interface); TypeScript; Vitest (testes). Sem servidor, banco de dados ou serviços externos: os dados ficam no localStorage do navegador.",
  "g.lim.t": "Limites atuais", "g.lim.b": "Pots de dois jogadores com stack de 40, 100 ou 200bb. Spots: BTN abre, SB vs BB, BB defende vs BTN, SB vs open do BTN e BTN enfrentando 3-bet. O oponente é um bot de regras que não aumenta no pós-flop. Sem solver nem EV. Ainda não há multiway, check-raise, importação de mãos nem biblioteca de treino.",
  "spot.pre_btn_open": "Pré-flop: BTN abre", "spot.pre_sb_open": "Pré-flop: SB vs BB", "spot.pre_bb_defend": "Pré-flop: BB defende vs BTN", "spot.pre_sb_vs_open": "Pré-flop: SB vs open do BTN", "spot.pre_facing_3bet": "Pré-flop: enfrentando 3-bet",
  "pos.ip": "em posição", "pos.oop": "fora de posição", "pot.srp": "pot simples", "pot.3bp": "pot 3-bet",
  "sc.btn_open": "BTN abre (RFI)", "sc.sb_open": "SB vs BB (blind battle)", "sc.bb_defend": "BB defende vs BTN", "sc.sb_vs_open": "SB vs open do BTN", "sc.facing_3bet": "BTN enfrentando 3-bet",
  "ctl.scenario": "Spot", "ctl.stack": "Stack", "ctl.texture": "Flop", "tex.any": "Qualquer", "ctl.note": "A Bússola foi calibrada para 100bb. Em outros stacks use como referência aproximada.",
};
const EN: Record<string, string> = {
  "nav.train": "Training", "nav.dashboard": "Dashboard", "nav.guide": "Guide", "tour.open": "Replay tour",
  "theme.system": "Theme: system", "theme.light": "Theme: light", "theme.dark": "Theme: dark",
  "seat.villain": "Villain", "seat.you": "You", "pot": "Pot", "stack": "Stack", "bet": "Bet",
  "a.fold": "Fold", "a.check": "Check", "a.call": "Call {n}", "a.bet": "Bet {n}", "a.raise": "Raise to {n}", "a.allin": "All-in", "size": "Bet size",
  "hand": "Hand {n} · {sc} · {st}bb", "session.none": "Session: no decisions yet", "session.some": "Session: {p}% on route ({n})",
  "next": "Next hand", "history": "Hand history & earlier feedback", "dealing": "Dealing…",
  "keys": "Shortcuts: F fold · C call/check · B bet/raise · 1–4 sizes · Enter next hand.",
  "v.good": "On route", "v.ok": "Valid alternative", "v.miss": "Off route",
  "fb.line": "You chose {a}. Compass route: {p}{alt}.", "fb.alt": " (alternative: {a})",
  "why.open": "Chen {n}: the Compass uses simple coach ranges for this pre-flop situation (open, defend, face a 3-bet).",
  "why.facing": "You hold {tier}. Pot odds: you need about {n}% equity to call.",
  "why.bet": "You hold {tier}{tex}. Coach rule: value-bet strong hands, semi-bluff draws, check weak hands more often.",
  "why.tex": " on a {x} flop",
  "tier.strong": "a strong made hand", "tier.medium": "a medium-strength made hand", "tier.draw": "a drawing hand", "tier.air": "a weak hand with little showdown value",
  "tex.dry": "dry", "tex.wet": "wet / connected", "tex.paired": "paired", "tex.mono": "monotone",
  "street.preflop": "Pre-flop", "street.flop": "Flop", "street.turn": "Turn", "street.river": "River",
  "spot.bet": "{s}: bet", "spot.facing": "{s}: facing a bet", "spot.board": "{x} board",
  "log.you": "You", "log.opp": "Villain", "log.fold": "fold", "log.check": "check", "log.call": "call {n}", "log.bet": "bet {n}", "log.raise": "raise to {n}",
  "res.win": "You won {n}bb", "res.lose": "You lost {n}bb", "res.split": "Split pot",
  "compass.note": "The Compass shows the coach's route using simple rules (hand strength, board texture, pot odds). It is not a solver or GTO.",
  "dash.title": "{n} decisions · {p}% on route", "dash.note": "Compared with the Compass route. A hand's result (win or lose) is never used to judge the decision.",
  "th.spot": "Spot", "th.on": "On route", "th.dev": "Main deviation", "th.status": "Status",
  "st.ok": "OK", "st.insufficient": "Too few hands", "st.preliminary": "Possible leak (preliminary)", "st.likely": "Likely leak",
  "dev.tight": "folding too much", "dev.loose": "playing too many hands", "dev.aggressive": "too aggressive", "dev.passive": "too passive",
  "leak.line": "{s} — main deviation: {d}, over {n} decisions.", "leak.small": " Small sample: treat as a hypothesis.", "practice": "Practice",
  "empty": "No data yet. Play a few hands.", "reset": "Reset statistics", "confirm": "Delete all saved decisions? The tour will show again.",
  "tour.skip": "Skip", "tour.back": "Back", "tour.next": "Next", "tour.done": "Start",
  "tour.0.t": "Welcome to Poker Coach", "tour.0.b": "The idea is a loop: you practice decisions, the app records every choice, shows where you drift, and sends you back to the right practice.",
  "tour.1.t": "Training", "tour.1.b": "Pick the spot (open, blind battle, defend, face a 3-bet), the stack and the flop texture. From pre-flop to river only legal actions appear. Shortcuts: F, C, B, 1–4, Enter.",
  "tour.2.t": "The Compass", "tour.2.b": "After each decision the Compass says whether you are On route, on a Valid alternative or Off route, and why. It uses simple coach rules, not a solver. It judges the decision, never the hand's result.",
  "tour.3.t": "Dashboard", "tour.3.b": "The Dashboard groups your decisions by spot and shows the most common deviation. A leak is only flagged with at least 8 decisions in the same spot. Before that, the app says there are too few hands.",
  "tour.4.t": "Your data", "tour.4.b": "Everything is saved only in this browser. Resetting statistics shows this tour again. You can replay it anytime from the menu.",
  "g.use.t": "How to use it", "g.use.b": "1) Train hands. 2) Read the Compass after each decision. 3) Open the Dashboard to see deviations per spot. 4) Practice the flagged spots. Repeat.",
  "g.arch.t": "How the code is organized",
  "g.arch.b": "engine: game rules (cards, evaluator, hand state with pot, stacks, legal actions and side pots) and analysis (texture, hand strength, pot odds). game: the drill (simple opponent, Compass, statistics). components: the React interface. Each layer only depends on the ones before it, and the logic is tested without a screen.",
  "g.dep.t": "Dependencies", "g.dep.b": "Next.js, React, Tailwind CSS and shadcn/ui (interface); TypeScript; Vitest (tests). No server, database or external services: data lives in the browser's localStorage.",
  "g.lim.t": "Current limits", "g.lim.b": "Two-player pots at 40, 100 or 200bb. Spots: BTN open, SB vs BB, BB defends vs BTN, SB vs BTN open and BTN facing a 3-bet. The opponent is a rule-based bot that does not raise post-flop. No solver or EV. No multiway, check-raise, hand import or training library yet.",
  "spot.pre_btn_open": "Pre-flop: BTN open", "spot.pre_sb_open": "Pre-flop: SB vs BB", "spot.pre_bb_defend": "Pre-flop: BB defends vs BTN", "spot.pre_sb_vs_open": "Pre-flop: SB vs BTN open", "spot.pre_facing_3bet": "Pre-flop: facing a 3-bet",
  "pos.ip": "in position", "pos.oop": "out of position", "pot.srp": "single-raised pot", "pot.3bp": "3-bet pot",
  "sc.btn_open": "BTN open (RFI)", "sc.sb_open": "SB vs BB (blind battle)", "sc.bb_defend": "BB defends vs BTN", "sc.sb_vs_open": "SB vs BTN open", "sc.facing_3bet": "BTN facing a 3-bet",
  "ctl.scenario": "Spot", "ctl.stack": "Stack", "ctl.texture": "Flop", "tex.any": "Any", "ctl.note": "The Compass is calibrated for 100bb. At other stacks, treat it as a rough guide.",
};

type Vars = Record<string, string | number>;
interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: (k: string, v?: Vars) => string; spot: (k: string) => string; why: (f: Feedback["why"]) => string; line: (e: LogEntry) => string; res: (n: number) => string }
const I18n = createContext<Ctx | null>(null);
export const useI18n = () => { const c = useContext(I18n); if (!c) throw new Error("LangProvider missing"); return c; };

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");
  useEffect(() => {
    try { const s = localStorage.getItem("pk_lang"); setLangState(s === "en" || s === "pt" ? s : navigator.language.startsWith("pt") ? "pt" : "en"); } catch { /* ignore */ }
  }, []);
  const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem("pk_lang", l); } catch { /* ignore */ } };
  const t = (k: string, v: Vars = {}) => (lang === "pt" ? PT : EN)[k]?.replace(/\{(\w+)\}/g, (_, x) => String(v[x] ?? "")) ?? k;
  const spot = (k: string) => {
    if (k.startsWith("pre_")) return t(`spot.${k}`);
    const m = /^(flop|turn|river)_(bet|facing)_(ip|oop)_(srp|3bp)(?:_(\w+))?$/.exec(k);
    if (!m) return k;
    return `${t(`spot.${m[2]}`, { s: t(`street.${m[1]}`) })} · ${t(`pos.${m[3]}`)} · ${t(`pot.${m[4]}`)}${m[5] ? `, ${t("spot.board", { x: t(`tex.${m[5]}`) })}` : ""}`;
  };
  const why = (w: Feedback["why"]) => w.kind === "pre" ? t("why.open", { n: w.chen ?? 0 })
    : w.kind === "facing" ? t("why.facing", { tier: t(`tier.${w.tier}`), n: w.need ?? 0 })
    : t("why.bet", { tier: t(`tier.${w.tier}`), tex: w.tex ? t("why.tex", { x: t(`tex.${w.tex}`) }) : "" });
  const line = (e: LogEntry) => `${t(`street.${e.street}`)}: ${t(`log.${e.who}`)} ${t(`log.${e.type}`, { n: bb(e.amount ?? 0) })}`;
  const res = (n: number) => (n > 0 ? t("res.win", { n }) : n < 0 ? t("res.lose", { n: -n }) : t("res.split"));
  return <I18n.Provider value={{ lang, setLang, t, spot, why, line, res }}>{children}</I18n.Provider>;
}
