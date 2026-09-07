import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { BarList, ColumnChart, Empty, Panel } from "@/components/charts";
import { compactMoney, money, num, pct } from "@/lib/analytics/format";
import { useAnalysis } from "@/lib/analytics/store";
import type { Analysis } from "@/lib/analytics/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Analytics Dashboard · Northstar Insights" },
      {
        name: "description",
        content:
          "KPIs, sales trend, category, age, timing, seasonal and location charts alongside the AI business feedback generated from your dataset.",
      },
      { property: "og:title", content: "Analytics Dashboard · Northstar Insights" },
      {
        property: "og:description",
        content: "Sales performance, customer behaviour and AI business feedback from your uploaded dataset.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Kpi({ label, value, note, tone = "glow" }: { label: string; value: string; note?: string; tone?: "glow" | "negative" | "mist" }) {
  const toneClass = tone === "negative" ? "text-negative" : tone === "mist" ? "text-mist" : "text-glow";
  return (
    <div className="rounded-2xl glass p-5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-mist">{label}</p>
      <p className="mt-1 truncate font-display text-2xl" title={value}>
        {value}
      </p>
      {note ? <p className={`mt-1 text-[12px] ${toneClass}`}>{note}</p> : null}
    </div>
  );
}

function Feedback({ a }: { a: Analysis }) {
  return (
    <div className="rounded-3xl glass p-6">
      <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-mist">AI Business Feedback</p>
      <h1 className="mb-4 font-display text-2xl leading-snug text-gradient-frost">
        Overall: <span className="text-glow">{a.overview.status}</span> — generated from {num(a.quality.rows)} rows of{" "}
        {a.fileName}
      </h1>
      <div className="space-y-4 text-[13px]">
        {a.feedback.map((s) => (
          <div key={s.title} className="rounded-2xl glass p-4">
            <p className="mb-1.5 flex items-center gap-2 font-semibold">
              <span aria-hidden>{s.icon}</span> {s.title}
            </p>
            {s.body ? <p className="leading-relaxed text-mist">{s.body}</p> : null}
            {s.points ? (
              <ul className="space-y-1 leading-relaxed text-mist">
                {s.points.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-glow">·</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
        <div className="rounded-2xl glass-a p-4 bg-[linear-gradient(135deg,rgba(124,196,255,0.12),rgba(79,140,255,0.06))]">
          <p className="mb-1.5 flex items-center gap-2 font-semibold">
            <span aria-hidden>📝</span> Final Business Summary
          </p>
          <p className="leading-relaxed text-mist">{a.finalSummary}</p>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const a = useAnalysis();

  if (!a) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg rounded-3xl glass p-8 text-center">
          <h1 className="font-display text-xl">No dataset analysed yet</h1>
          <p className="mt-2 text-[13px] text-mist">Upload a sales or customer file in the Data Explorer to see the dashboard.</p>
          <Link to="/" className="mt-5 inline-block rounded-full btn-primary px-5 py-2 text-[13px] font-semibold">
            Go to Data Explorer
          </Link>
        </div>
      </AppShell>
    );
  }

  const bestProduct = a.products[0];
  const bestSeason = a.seasons[0];

  return (
    <AppShell
      action={
        <Link to="/report" className="rounded-full btn-primary px-5 py-2 text-[13px] font-semibold">
          Full Report
        </Link>
      }
    >
      <div className="grid grid-cols-12 gap-5">
        <aside className="col-span-12 space-y-5 lg:col-span-4">
          <Feedback a={a} />
        </aside>

        <main className="col-span-12 space-y-5 lg:col-span-8">
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
            <Kpi
              label="Total Revenue"
              value={money(a.overview.revenue)}
              note={a.overview.growth !== null ? `${pct(a.overview.growth)} vs earlier period` : "No date column detected"}
              tone={a.overview.growth !== null && a.overview.growth < 0 ? "negative" : a.overview.growth === null ? "mist" : "glow"}
            />
            <Kpi label="Total Customers" value={num(a.overview.customers)} note={a.repeatRate !== null ? `${a.repeatRate.toFixed(1)}% repeat buyers` : undefined} />
            <Kpi label="Transactions" value={num(a.overview.orders)} note={a.overview.quantity !== null ? `${num(a.overview.quantity)} units sold` : undefined} tone="mist" />
            <Kpi label="Avg Order Value" value={money(a.overview.avgOrderValue)} note={a.overview.avgPerCustomer !== null ? `${money(a.overview.avgPerCustomer)} per customer` : undefined} tone="mist" />
            <Kpi label="Best Product" value={bestProduct ? bestProduct.label : "—"} note={bestProduct ? `${compactMoney(bestProduct.revenue)} revenue` : "No product column"} tone="mist" />
            <Kpi label="Best Season" value={bestSeason ? bestSeason.label : "—"} note={bestSeason ? `${compactMoney(bestSeason.revenue)} revenue` : "No season or date column"} tone="mist" />
          </div>

          <Panel
            title="Sales Trend"
            subtitle="Revenue by month"
            badge={a.trend.length ? `${a.trend.length} periods` : "No dates"}
          >
            <ColumnChart data={a.trend} labels={(b) => b.label.slice(2)} />
          </Panel>

          <div className="grid gap-5 md:grid-cols-2">
            <Panel title="Sales by Category">
              <BarList data={a.categories} />
            </Panel>
            <Panel title="Sales by Product">
              <BarList data={a.products} />
            </Panel>
            <Panel title="Sales by Age Group">
              <BarList data={a.ageGroups} limit={6} />
            </Panel>
            <Panel title="Sales by Gender">
              <BarList data={a.genders} limit={4} />
            </Panel>
            <Panel title="Sales by Location">
              <BarList data={a.locations} />
            </Panel>
            <Panel title="Sales by Time of Day">
              <BarList data={a.timeOfDay} limit={5} />
            </Panel>
            <Panel title="Sales by Month">
              <BarList data={a.months} limit={12} />
            </Panel>
            <Panel title="Sales by Season">
              <BarList data={a.seasons} limit={4} />
            </Panel>
          </div>

          <Panel title="Customer Segments" subtitle="RFM scoring with k-means clustering">
            {a.segments.length ? (
              <div className="space-y-2.5 text-[12px]">
                {a.segments.map((s) => (
                  <div key={s.name} className="rounded-xl glass px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-mist">
                        {num(s.customers)} customers · {compactMoney(s.revenue)}
                      </span>
                    </div>
                    <p className="mt-1 text-mist">
                      Avg spend {money(s.avgSpend)} · {s.avgFrequency.toFixed(1)} purchases each — {s.action}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty note="Insufficient data available for this analysis. Customer ID and sales amount columns are required for segmentation." />
            )}
          </Panel>

          <Panel title="Product Performance Classification">
            {a.products.length || a.categories.length ? (
              <div className="flex flex-wrap gap-2 text-[11px]">
                {[...a.categories, ...a.products].map((p, i) => (
                  <span key={`${p.label}-${i}`} className="rounded-full glass px-3 py-1.5">
                    <span className="text-foreground">{p.label}</span>
                    <span className="text-mist"> · {p.classification}</span>
                    {p.growth !== null ? (
                      <span className={p.growth < 0 ? "text-negative" : "text-glow"}> {pct(p.growth, 0)}</span>
                    ) : null}
                  </span>
                ))}
              </div>
            ) : (
              <Empty />
            )}
          </Panel>

          <Panel title="Detected Patterns" subtitle="Observed in your data">
            {a.patterns.length ? (
              <ul className="space-y-2 text-[13px] text-mist">
                {a.patterns.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-glow">·</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty />
            )}
          </Panel>
        </main>
      </div>
    </AppShell>
  );
}
