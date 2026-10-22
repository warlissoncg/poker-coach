"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "../i18n";

const STEPS = 5;

export function Tour({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [i, setI] = useState(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl border bg-background p-5 text-foreground shadow-xl">
        <div className="text-xs text-muted-foreground">{i + 1} / {STEPS}</div>
        <h2 className="mt-1 text-lg font-bold">{t(`tour.${i}.t`)}</h2>
        <p className="mt-2 text-sm">{t(`tour.${i}.b`)}</p>
        <div className="mt-5 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>{t("tour.skip")}</Button>
          <div className="flex gap-2">
            {i > 0 && <Button variant="outline" size="sm" onClick={() => setI(i - 1)}>{t("tour.back")}</Button>}
            <Button size="sm" onClick={() => (i < STEPS - 1 ? setI(i + 1) : onClose())}>{i < STEPS - 1 ? t("tour.next") : t("tour.done")}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
