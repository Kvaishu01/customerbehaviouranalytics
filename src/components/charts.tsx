import type { ReactNode } from "react";
import { compactMoney, NO_DATA } from "@/lib/analytics/format";
import type { Bucket } from "@/lib/analytics/types";

export function Panel({
  title,
  subtitle,
  badge,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl glass p-6 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-base">{title}</p>
          {subtitle ? <p className="text-[12px] text-mist">{subtitle}</p> : null}
        </div>
        {badge ? <span className="rounded-full glass px-3 py-1 text-[11px] text-mist">{badge}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function Empty({ note = NO_DATA }: { note?: string }) {
  return <p className="rounded-2xl glass px-4 py-6 text-center text-[12px] text-mist">{note}</p>;
}

export function ColumnChart({ data, labels }: { data: Bucket[]; labels?: (b: Bucket) => string }) {
  if (!data.length) return <Empty />;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const peak = Math.max(...data.map((d) => d.revenue));
  return (
    <div className="flex h-44 items-end gap-1.5">
      {data.map((d) => {
        const isPeak = d.revenue === peak;
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5" title={`${d.label}: ${compactMoney(d.revenue)}`}>
            <div
              className={`w-full rounded-t-md ${isPeak ? "bg-[var(--gradient-bar-peak)] shadow-[0_0_24px_rgba(124,196,255,0.5)]" : "bg-[var(--gradient-bar)]"}`}
              style={{ height: `${Math.max(3, (d.revenue / max) * 100)}%` }}
            />
            <span className={`truncate text-[10px] ${isPeak ? "text-foreground" : "text-mist"}`}>
              {(labels ? labels(d) : d.label).slice(0, 8)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function BarList({ data, limit = 6 }: { data: Bucket[]; limit?: number }) {
  if (!data.length) return <Empty />;
  const rows = data.slice(0, limit);
  const max = Math.max(...rows.map((r) => r.revenue), 1);
  return (
    <div className="space-y-3 text-[12px]">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex justify-between gap-3">
            <span className="truncate text-mist">{r.label}</span>
            <span className="shrink-0 text-foreground">{compactMoney(r.revenue)}</span>
          </div>
          <div className="h-2 rounded-full bg-[rgba(255,255,255,0.05)]">
            <div className="h-full rounded-full bg-[var(--gradient-bar-h)]" style={{ width: `${Math.max(2, (r.revenue / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
