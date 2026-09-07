import { compactMoney, money, num, pct } from "./format";
import type { Analysis } from "./types";

export function buildReportText(a: Analysis): string {
  const L: string[] = [];
  const h = (t: string) => L.push("", t, "=".repeat(t.length));
  const b = (t: string) => L.push(`  - ${t}`);

  L.push("NORTHSTAR INSIGHTS — BUSINESS REPORT");
  L.push(`Dataset: ${a.fileName}`);
  L.push(`Generated: ${new Date(a.generatedAt).toLocaleString()}`);
  if (a.quality.dateRange) L.push(`Period covered: ${a.quality.dateRange.start} to ${a.quality.dateRange.end}`);

  h("1. EXECUTIVE SUMMARY");
  L.push(a.finalSummary);

  h("2. DATA QUALITY");
  L.push(`Rows: ${num(a.quality.rows)} | Columns: ${a.quality.columns}`);
  L.push(`Missing values: ${num(a.quality.missingCells)} | Duplicates removed: ${num(a.quality.duplicatesRemoved)}`);
  L.push(`Total sales: ${a.quality.totalSales !== null ? money(a.quality.totalSales) : "not available"}`);
  L.push(`Customers: ${a.quality.customers ?? "not available"} | Products: ${a.quality.products ?? "not available"}`);

  h("3. SALES PERFORMANCE");
  L.push(`Revenue ${money(a.overview.revenue)} from ${num(a.overview.orders)} transactions.`);
  L.push(`Average order value ${money(a.overview.avgOrderValue)}.`);
  L.push(`Period change: ${a.overview.growth !== null ? pct(a.overview.growth) : "not measurable without dates"}.`);
  a.categories.forEach((c) => b(`${c.label}: ${compactMoney(c.revenue)} · ${c.classification}${c.growth !== null ? ` (${pct(c.growth)})` : ""}`));

  h("4. CUSTOMER BEHAVIOUR");
  L.push(a.repeatRate !== null ? `Repeat purchase rate: ${a.repeatRate.toFixed(1)}%.` : "Repeat behaviour not measurable (no customer ID).");
  a.ageGroups.forEach((g) => b(`${g.label}: ${compactMoney(g.revenue)} across ${num(g.orders)} purchases`));
  a.genders.forEach((g) => b(`${g.label}: ${compactMoney(g.revenue)}`));

  h("5. PRODUCT PERFORMANCE");
  a.products.forEach((p) => b(`${p.label}: ${compactMoney(p.revenue)} · ${num(p.quantity)} units · ${p.classification}`));

  h("6. TIME ANALYSIS");
  a.timeOfDay.forEach((t) => b(`${t.label}: ${compactMoney(t.revenue)}`));
  a.weekdays.forEach((d) => b(`${d.label}: ${compactMoney(d.revenue)}`));
  a.months.forEach((m) => b(`${m.label}: ${compactMoney(m.revenue)}`));

  h("7. SEASONAL ANALYSIS");
  a.seasons.length ? a.seasons.forEach((s) => b(`${s.label}: ${compactMoney(s.revenue)}`)) : L.push("Insufficient data available for this analysis.");

  h("8. LOCATION ANALYSIS");
  a.locations.length ? a.locations.forEach((l) => b(`${l.label}: ${compactMoney(l.revenue)} · ${l.classification}`)) : L.push("Insufficient data available for this analysis.");

  h("9. CUSTOMER SEGMENTATION");
  a.segments.length
    ? a.segments.forEach((s) => b(`${s.name}: ${num(s.customers)} customers, ${compactMoney(s.revenue)}, avg ${money(s.avgSpend)} — ${s.action}`))
    : L.push("Insufficient data available for this analysis.");

  h("10. PROBLEMS DETECTED");
  a.problems.length
    ? a.problems.forEach((p) => L.push(`Priority ${p.priority} — ${p.title}`, `  ${p.detail}`, `  Recommended action: ${p.action}`))
    : L.push("No significant problems detected.");

  h("11. IMPROVEMENT AREAS");
  a.improvements.forEach((i) =>
    L.push(i.area, `  Current situation: ${i.situation}`, `  Problem: ${i.problem}`, `  Suggested improvement: ${i.improvement}`, `  Expected goal: ${i.goal}`),
  );

  h("12. RECOMMENDATIONS");
  a.problems.forEach((p) => b(p.action));

  h("13. GROWTH OPPORTUNITIES");
  a.opportunities.forEach((o) => b(o));

  h("14. FINAL CONCLUSION");
  L.push(a.finalSummary);
  L.push("", "All findings describe patterns observed in the uploaded dataset. Suggested causes and actions are indicative.");

  return L.join("\n");
}
