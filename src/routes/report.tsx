import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { compactMoney, money, num, pct } from "@/lib/analytics/format";
import { useAnalysis } from "@/lib/analytics/store";
import { buildReportText } from "@/lib/analytics/report";
import type { Analysis } from "@/lib/analytics/types";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Business Report · Northstar Insights" },
      {
        name: "description",
        content:
          "A management-ready business report: performance, customer behaviour, seasonality, detected problems, improvement areas and recommendations.",
      },
      { property: "og:title", content: "Business Report · Northstar Insights" },
      {
        property: "og:description",
        content: "Download a plain-language business report generated from your uploaded sales data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Report,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl glass p-6">
      <h2 className="mb-4 font-display text-lg">{title}</h2>
      <div className="space-y-3 text-[13px] leading-relaxed text-mist">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  if (!items.length) return <p>Insufficient data available for this analysis.</p>;
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-glow">·</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function download(a: Analysis) {
  const blob = new Blob([buildReportText(a)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `business-report-${a.fileName.replace(/\.[^.]+$/, "")}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function Report() {
  const a = useAnalysis();

  if (!a) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg rounded-3xl glass p-8 text-center">
          <h1 className="font-display text-xl">No report yet</h1>
          <p className="mt-2 text-[13px] text-mist">Upload and analyse a dataset first — the report is written from your data.</p>
          <Link to="/" className="mt-5 inline-block rounded-full btn-primary px-5 py-2 text-[13px] font-semibold">
            Go to Data Explorer
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      action={
        <button onClick={() => download(a)} className="rounded-full btn-primary px-5 py-2 text-[13px] font-semibold">
          Download Report
        </button>
      }
    >
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="rounded-3xl glass p-7">
          <p className="text-[11px] uppercase tracking-[0.18em] text-mist">Business Report</p>
          <h1 className="mt-2 font-display text-3xl text-gradient-frost">{a.fileName}</h1>
          <p className="mt-2 text-[13px] text-mist">
            Generated {new Date(a.generatedAt).toLocaleString()} · {num(a.quality.rows)} rows ·{" "}
            {a.quality.dateRange ? `${a.quality.dateRange.start} to ${a.quality.dateRange.end}` : "no date range detected"}
          </p>
        </div>

        <Section title="1. Executive Summary">
          <p>{a.finalSummary}</p>
        </Section>

        <Section title="2. Data Quality">
          <p>
            {num(a.quality.rows)} rows across {a.quality.columns} columns. {num(a.quality.missingCells)} missing values
            and {num(a.quality.duplicatesRemoved)} duplicate records were found and handled.{" "}
            {a.quality.totalSales !== null ? `Total sales ${money(a.quality.totalSales)}. ` : "No sales amount column detected. "}
            {a.quality.customers ? `${num(a.quality.customers)} customers. ` : ""}
            {a.quality.products ? `${num(a.quality.products)} products. ` : ""}
          </p>
          <p>Recognised fields: {a.quality.detected.map((d) => d.column).join(", ") || "none"}.</p>
        </Section>

        <Section title="3. Sales Performance">
          <p>
            Revenue {money(a.overview.revenue)} from {num(a.overview.orders)} transactions, average order value{" "}
            {money(a.overview.avgOrderValue)}
            {a.overview.avgPerCustomer !== null ? `, ${money(a.overview.avgPerCustomer)} per customer` : ""}.{" "}
            {a.overview.growth !== null ? `Period-on-period change: ${pct(a.overview.growth)}.` : "No date column, so growth could not be measured."}
          </p>
          <List
            items={a.categories.slice(0, 6).map(
              (c) => `${c.label}: ${compactMoney(c.revenue)} · ${c.classification}${c.growth !== null ? ` (${pct(c.growth)})` : ""}`,
            )}
          />
        </Section>

        <Section title="4. Customer Behaviour">
          <p>
            {a.repeatRate !== null
              ? `${a.repeatRate.toFixed(1)}% of customers purchased more than once.`
              : "No customer ID column, so repeat purchase behaviour could not be measured."}
          </p>
          <List items={a.ageGroups.map((g) => `${g.label}: ${compactMoney(g.revenue)} from ${num(g.orders)} purchases`)} />
        </Section>

        <Section title="5. Product Performance">
          <List
            items={a.products.slice(0, 8).map(
              (p) => `${p.label}: ${compactMoney(p.revenue)} · ${num(p.quantity)} units · ${p.classification}`,
            )}
          />
        </Section>

        <Section title="6. Time Analysis">
          <List items={a.timeOfDay.map((t) => `${t.label}: ${compactMoney(t.revenue)}`)} />
          <List items={a.weekdays.map((d) => `${d.label}: ${compactMoney(d.revenue)}`)} />
        </Section>

        <Section title="7. Seasonal Analysis">
          <List items={a.seasons.map((s) => `${s.label}: ${compactMoney(s.revenue)} from ${num(s.orders)} transactions`)} />
        </Section>

        <Section title="8. Location Analysis">
          <List items={a.locations.map((l) => `${l.label}: ${compactMoney(l.revenue)} · ${num(l.customers || l.orders)} buyers · ${l.classification}`)} />
        </Section>

        <Section title="9. Customer Segmentation">
          <List
            items={a.segments.map(
              (s) => `${s.name}: ${num(s.customers)} customers, ${compactMoney(s.revenue)} revenue, avg spend ${money(s.avgSpend)} — ${s.action}`,
            )}
          />
        </Section>

        <Section title="10. Problems Detected">
          {a.problems.length ? (
            <ol className="space-y-3">
              {a.problems.map((p) => (
                <li key={p.priority} className="rounded-2xl glass p-4">
                  <p className="font-semibold text-foreground">
                    Priority {p.priority} — {p.title}
                  </p>
                  <p className="mt-1">{p.detail}</p>
                  <p className="mt-1 text-glow">Recommended action: {p.action}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p>No significant problems were detected in the available data.</p>
          )}
        </Section>

        <Section title="11. Improvement Areas">
          <div className="space-y-3">
            {a.improvements.map((i) => (
              <div key={i.area} className="rounded-2xl glass p-4">
                <p className="font-semibold text-foreground">{i.area}</p>
                <p className="mt-1">Current situation: {i.situation}</p>
                <p>Problem: {i.problem}</p>
                <p>Suggested improvement: {i.improvement}</p>
                <p className="text-glow">Expected goal: {i.goal}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="12. Recommendations">
          <List items={a.problems.map((p) => p.action)} />
        </Section>

        <Section title="13. Growth Opportunities">
          <List items={a.opportunities} />
        </Section>

        <Section title="14. Final Conclusion">
          <p>{a.finalSummary}</p>
        </Section>
      </div>
    </AppShell>
  );
}
