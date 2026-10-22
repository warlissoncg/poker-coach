"use client";
import { useI18n } from "../i18n";

export function Guide() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {["use", "arch", "dep", "lim"].map((k) => (
        <section key={k} className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold">{t(`g.${k}.t`)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t(`g.${k}.b`)}</p>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">{t("compass.note")}</p>
    </div>
  );
}
