"use client";

const CHIP_COLORS = ["border-red-300 bg-red-600", "border-sky-200 bg-sky-600", "border-amber-200 bg-amber-500"];

export function ChipStack({ amount, label, compact = false }: { amount: number; label?: string; compact?: boolean }) {
  const visible = amount > 0;
  const count = amount >= 10000 ? 4 : amount >= 3000 ? 3 : amount >= 500 ? 2 : 1;
  return (
    <span className={`inline-flex items-center gap-1.5 ${compact ? "gap-1" : ""}`} aria-label={label ? `${label}: ${amount}` : String(amount)}>
      {visible && (
        <span className={`chip-stack relative inline-block shrink-0 ${compact ? "h-4 w-5" : "h-5 w-6"}`} aria-hidden="true">
          {Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className={`absolute left-0 h-2.5 w-4 rounded-full border-2 shadow-sm ${CHIP_COLORS[i % CHIP_COLORS.length]}`}
              style={{ bottom: `${i * 3}px`, zIndex: i + 1 }}
            />
          ))}
        </span>
      )}
      {label && <span>{label}</span>}
    </span>
  );
}
