"use client";
import { useI18n } from "../i18n";

const TERMS = ["BTN", "SB", "BB", "UTG", "HJ", "CO", "IP", "OOP", "RFI", "3bet", "4bet", "potodds", "equity"];

export function Guide() {
  const { t } = useI18n();
  const box = "rounded-lg border bg-card p-4";
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className={box}>
        <h2 className="font-semibold">{t("g.use.t")}</h2>
        <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-muted-foreground">{[1, 2, 3, 4].map((n) => <li key={n}>{t(`g.use.${n}`)}</li>)}</ol>
      </section>
      <section className={box}>
        <h2 className="font-semibold">{t("g.exp.t")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("g.exp.b")}</p>
      </section>
      <section className={box}>
        <h2 className="font-semibold">{t("g.gl.t")}</h2>
        <dl className="mt-2 space-y-1.5 text-sm">
          {TERMS.map((k) => { const [term, ...rest] = t(`gl.${k}`).split(" — "); return <div key={k}><dt className="inline font-bold">{term}</dt> <dd className="inline text-muted-foreground">— {rest.join(" — ")}</dd></div>; })}
        </dl>
      </section>
      {["arch", "dep", "lim"].map((k) => (
        <section key={k} className={box}>
          <h2 className="font-semibold">{t(`g.${k}.t`)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t(`g.${k}.b`)}</p>
        </section>
      ))}
    </div>
  );
}
