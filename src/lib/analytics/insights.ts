import { compactMoney, pct } from "./format";
import type { Analysis, Bucket, FeedbackSection, ImprovementArea, Problem, ProductStat } from "./types";

type Partial_ = Omit<
  Analysis,
  "patterns" | "problems" | "improvements" | "feedback" | "opportunities" | "finalSummary"
>;

const top = (b: Bucket[]) => (b.length ? [...b].sort((x, y) => y.revenue - x.revenue)[0]! : null);
const bottom = (b: Bucket[]) => (b.length > 1 ? [...b].sort((x, y) => x.revenue - y.revenue)[0]! : null);
const share = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0);

export function buildInsights(a: Partial_, hasAmount: boolean) {
  const total = a.overview.revenue;
  const patterns: string[] = [];
  const problems: Problem[] = [];
  const improvements: ImprovementArea[] = [];
  const opportunities: string[] = [];
  const wins: string[] = [];
  const lags: string[] = [];

  const bestCategory = top(a.categories);
  const worstCategory = bottom(a.categories);
  const bestProduct = top(a.products);
  const worstProduct = bottom(a.products);
  const bestAge = top(a.ageGroups);
  const bestSeason = top(a.seasons);
  const worstSeason = bottom(a.seasons);
  const bestTime = top(a.timeOfDay);
  const bestDay = top(a.weekdays);
  const worstDay = bottom(a.weekdays);
  const bestMonth = top(a.months);
  const worstMonth = bottom(a.months);
  const bestLocation = top(a.locations);
  const worstLocation = bottom(a.locations);

  // ---------- patterns ----------
  if (a.overview.growth !== null) {
    const g = a.overview.growth;
    patterns.push(
      g > 5
        ? `Overall revenue grew ${pct(g)} in the second half of the period compared with the first half.`
        : g < -5
          ? `Overall revenue fell ${pct(g)} in the second half of the period compared with the first half.`
          : `Overall revenue is broadly flat (${pct(g)}) across the period.`,
    );
  }
  if (bestCategory && a.categories.length > 1)
    patterns.push(`${bestCategory.label} is the leading category with ${share(bestCategory.revenue, total).toFixed(1)}% of revenue.`);
  if (bestSeason && a.seasons.length > 1)
    patterns.push(`${bestSeason.label} is the strongest season, contributing ${share(bestSeason.revenue, total).toFixed(1)}% of revenue.`);
  if (bestTime) patterns.push(`Purchases peak during ${bestTime.label.toLowerCase()}.`);
  if (bestDay && worstDay && bestDay.label !== worstDay.label)
    patterns.push(`${bestDay.label} is the strongest day of the week; ${worstDay.label} is the weakest.`);
  if (bestAge) patterns.push(`Customers aged ${bestAge.label} generate the highest revenue.`);
  if (a.repeatRate !== null)
    patterns.push(`${a.repeatRate.toFixed(1)}% of customers purchased more than once in the dataset.`);
  for (const c of a.categories) {
    if (c.growth !== null && c.growth <= -15)
      patterns.push(`${c.label} sales declined by ${Math.abs(c.growth).toFixed(1)}% compared with the earlier period.`);
    if (c.growth !== null && c.growth >= 25)
      patterns.push(`${c.label} sales rose by ${c.growth.toFixed(1)}% compared with the earlier period.`);
  }

  // ---------- wins ----------
  if (bestProduct) wins.push(`${bestProduct.label} is the best-performing product with ${compactMoney(bestProduct.revenue)} in revenue.`);
  if (bestCategory) wins.push(`${bestCategory.label} leads categories at ${share(bestCategory.revenue, total).toFixed(1)}% of total revenue.`);
  if (bestSeason && a.seasons.length > 1) wins.push(`${bestSeason.label} is the strongest season (${compactMoney(bestSeason.revenue)}).`);
  if (bestLocation && a.locations.length > 1)
    wins.push(`${bestLocation.label} is the strongest market, generating ${share(bestLocation.revenue, total).toFixed(1)}% of revenue.`);
  if (bestAge) wins.push(`The ${bestAge.label} age group contributes the most revenue (${compactMoney(bestAge.revenue)}).`);
  if (bestTime) wins.push(`Demand concentrates in the ${bestTime.label.toLowerCase()} window.`);

  // ---------- lags + problems ----------
  const declining = a.categories.filter((c) => c.growth !== null && c.growth <= -10).sort((x, y) => (x.growth ?? 0) - (y.growth ?? 0));
  const decliningProducts = a.products.filter((p) => p.growth !== null && p.growth <= -15).sort((x, y) => (x.growth ?? 0) - (y.growth ?? 0));

  const pushProblem = (title: string, detail: string, action: string) =>
    problems.push({ priority: problems.length + 1, title, detail, action });

  for (const c of declining.slice(0, 2)) {
    lags.push(`${c.label} revenue declined ${Math.abs(c.growth!).toFixed(1)}% versus the earlier period.`);
    pushProblem(
      `Declining category: ${c.label}`,
      `${c.label} revenue declined ${Math.abs(c.growth!).toFixed(1)}% between the first and second half of the period. This is an observed pattern, not a confirmed cause.`,
      `Review pricing, promotion and demand for ${c.label}, and consider a targeted campaign to test recovery.`,
    );
  }
  for (const p of decliningProducts.slice(0, 2)) {
    lags.push(`${p.label} sales dropped ${Math.abs(p.growth!).toFixed(1)}%.`);
    pushProblem(
      `Declining product: ${p.label}`,
      `Sales for ${p.label} fell ${Math.abs(p.growth!).toFixed(1)}% in the later period.`,
      `Consider reviewing price positioning, stock availability and promotion for ${p.label}.`,
    );
  }
  if (worstCategory && bestCategory && worstCategory.label !== bestCategory.label && share(worstCategory.revenue, total) < 8) {
    lags.push(`${worstCategory.label} contributes only ${share(worstCategory.revenue, total).toFixed(1)}% of revenue.`);
    pushProblem(
      `Low-performing category: ${worstCategory.label}`,
      `${worstCategory.label} accounts for just ${share(worstCategory.revenue, total).toFixed(1)}% of total revenue across ${worstCategory.orders} transactions.`,
      `Consider whether to reposition, bundle or reduce investment in this category.`,
    );
  }
  if (worstLocation && bestLocation && worstLocation.label !== bestLocation.label && a.locations.length > 2) {
    lags.push(`${worstLocation.label} is the weakest market at ${share(worstLocation.revenue, total).toFixed(1)}% of revenue.`);
    pushProblem(
      `Underperforming location: ${worstLocation.label}`,
      `${worstLocation.label} generates ${compactMoney(worstLocation.revenue)} from ${worstLocation.customers || worstLocation.orders} buyers, well below ${bestLocation.label}.`,
      `Investigate local customer preferences and the effectiveness of promotions in ${worstLocation.label}.`,
    );
  }
  const weakAge = a.ageGroups.length > 2 ? [...a.ageGroups].sort((x, y) => x.revenue - y.revenue)[0]! : null;
  if (weakAge && bestAge && weakAge.label !== bestAge.label) {
    lags.push(`The ${weakAge.label} group has the lowest revenue contribution.`);
    pushProblem(
      `Weak customer segment: ${weakAge.label}`,
      `Customers aged ${weakAge.label} account for ${share(weakAge.revenue, total).toFixed(1)}% of revenue across ${weakAge.orders} transactions.`,
      `Consider testing messaging and product mix aimed at this age group before scaling spend.`,
    );
  }
  if (a.repeatRate !== null && a.repeatRate < 25) {
    lags.push(`Only ${a.repeatRate.toFixed(1)}% of customers purchased more than once.`);
    pushProblem(
      "Low repeat purchase rate",
      `Just ${a.repeatRate.toFixed(1)}% of customers made more than one purchase in this dataset.`,
      "Introduce retention or loyalty strategies such as follow-up offers after a first purchase.",
    );
  }
  const atRisk = a.segments.find((s) => s.name.startsWith("At Risk"));
  if (atRisk) {
    lags.push(`${atRisk.customers} customers fall into the At Risk segment.`);
    pushProblem(
      "At-risk customers",
      `${atRisk.customers} customers have not purchased recently despite prior spend of ${compactMoney(atRisk.revenue)}.`,
      "Use targeted re-engagement campaigns for this segment.",
    );
  }
  if (worstSeason && bestSeason && worstSeason.label !== bestSeason.label && a.seasons.length > 2) {
    lags.push(`${worstSeason.label} is the weakest season at ${share(worstSeason.revenue, total).toFixed(1)}% of revenue.`);
  }
  if (worstMonth && bestMonth && a.months.length > 3 && worstMonth.label !== bestMonth.label) {
    lags.push(`${worstMonth.label} is the weakest month of the year.`);
  }

  // ---------- improvement areas ----------
  if (declining.length || decliningProducts.length) {
    const name = declining[0]?.label ?? decliningProducts[0]?.label ?? "the affected lines";
    improvements.push({
      area: "Product strategy",
      situation: `${name} shows a clear downward revenue trend across the period.`,
      problem: "Declining lines pull down overall growth and tie up stock and shelf attention.",
      improvement: `Review price, promotion and assortment for ${name}; consider bundling with a strong performer.`,
      goal: "Stabilise revenue for the affected lines in the next comparable period.",
    });
  }
  if (bestTime) {
    improvements.push({
      area: "Sales timing",
      situation: `Transactions concentrate in the ${bestTime.label.toLowerCase()} window.`,
      problem: "Marketing spread evenly across the day may miss the highest-intent hours.",
      improvement: "Prioritise promotional activity and staffing around the peak window.",
      goal: "Raise conversion during peak hours without increasing total spend.",
    });
  }
  if (bestSeason && a.seasons.length > 1) {
    improvements.push({
      area: "Seasonal campaigns",
      situation: `${bestSeason.label} generates ${share(bestSeason.revenue, total).toFixed(1)}% of revenue.`,
      problem: "Late preparation risks stock-outs and missed demand in the strongest season.",
      improvement: `Prepare inventory and campaigns ahead of ${bestSeason.label}.`,
      goal: "Capture more of the recurring seasonal peak.",
    });
  }
  if (a.repeatRate !== null) {
    improvements.push({
      area: "Customer retention",
      situation: `Repeat purchase rate is ${a.repeatRate.toFixed(1)}%.`,
      problem: "Growth relies heavily on acquiring new customers, which is usually more costly.",
      improvement: "Introduce a loyalty or reactivation programme for recent one-time buyers.",
      goal: "Increase the share of customers with two or more purchases.",
    });
  }
  if (bestLocation && a.locations.length > 1) {
    improvements.push({
      area: "Location strategy",
      situation: `${bestLocation.label} leads at ${share(bestLocation.revenue, total).toFixed(1)}% of revenue${worstLocation ? `, while ${worstLocation.label} trails` : ""}.`,
      problem: "Uneven regional performance suggests untapped demand in weaker markets.",
      improvement: "Compare product mix and promotions between the strongest and weakest markets.",
      goal: "Narrow the revenue gap between markets.",
    });
  }
  if (bestAge) {
    improvements.push({
      area: "Target customer groups",
      situation: `The ${bestAge.label} group drives the largest share of revenue.`,
      problem: "Campaigns aimed at the whole base dilute the message for the highest-value group.",
      improvement: `Create targeted campaigns for the ${bestAge.label} group and test similar messaging on adjacent groups.`,
      goal: "Grow revenue per customer in the core age group.",
    });
  }

  // ---------- opportunities ----------
  if (bestSeason && a.seasons.length > 1)
    opportunities.push(`Recurring ${bestSeason.label} demand — potential to raise stock and campaign spend ahead of the peak.`);
  if (bestTime) opportunities.push(`Concentrated ${bestTime.label.toLowerCase()} demand — potential for timed offers and reminders.`);
  const growingCats = a.categories.filter((c) => c.classification === "Growing");
  if (growingCats.length) opportunities.push(`${growingCats.map((c) => c.label).join(", ")} ${growingCats.length > 1 ? "are" : "is"} growing — the data suggests widening the range here.`);
  const highValue = a.segments.find((s) => s.name.startsWith("High Value"));
  if (highValue)
    opportunities.push(`${highValue.customers} High Value customers average ${compactMoney(highValue.avgSpend)} — a natural audience for premium or loyalty offers.`);
  if (worstLocation && a.locations.length > 2)
    opportunities.push(`${worstLocation.label} has customers but low spend — potential upside from localised promotion.`);
  if (!opportunities.length) opportunities.push("No clear growth opportunity could be isolated from the columns available in this dataset.");

  // ---------- feedback report ----------
  const statusLine = !hasAmount
    ? "No sales amount or price column was detected, so revenue-based conclusions are unavailable."
    : a.overview.status === "Growing"
      ? `The business is growing: revenue is ${pct(a.overview.growth)} across the period, totalling ${compactMoney(total)}.`
      : a.overview.status === "Declining"
        ? `The business is declining: revenue changed by ${pct(a.overview.growth)} across the period, totalling ${compactMoney(total)}.`
        : a.overview.status === "Mixed"
          ? `Overall revenue of ${compactMoney(total)} is up ${pct(a.overview.growth)}, but performance is uneven — some categories are falling while others grow.`
          : `Revenue of ${compactMoney(total)} is broadly stable across the period.`;

  const feedback: FeedbackSection[] = [
    { icon: "📊", title: "Overall Business Status", body: statusLine },
    { icon: "✅", title: "What Is Performing Well", points: wins.length ? wins.slice(0, 4) : ["Insufficient data available for this analysis."] },
    { icon: "⚠️", title: "What Is Lagging", points: lags.length ? lags.slice(0, 4) : ["No clear lagging area was detected in the available columns."] },
    {
      icon: "👥",
      title: "Customer Behaviour",
      body:
        a.repeatRate !== null || a.ageGroups.length || a.genders.length
          ? [
              a.repeatRate !== null ? `${a.repeatRate.toFixed(1)}% of customers bought more than once.` : null,
              bestAge ? `The ${bestAge.label} group is the largest revenue contributor with an average order of ${compactMoney(bestAge.revenue / Math.max(1, bestAge.orders))}.` : null,
              a.genders.length > 1 ? `${a.genders[0]!.label} customers account for ${share(a.genders[0]!.revenue, total).toFixed(1)}% of revenue.` : null,
            ]
              .filter(Boolean)
              .join(" ")
          : "Insufficient data available for this analysis.",
    },
    {
      icon: "⏰",
      title: "Peak Buying Time",
      body: bestTime
        ? `Purchases are highest during ${bestTime.label.toLowerCase()}${bestDay ? `, and ${bestDay.label} is the strongest day of the week` : ""}.`
        : bestDay
          ? `${bestDay.label} is the strongest day of the week. No usable time-of-day column was detected.`
          : "Insufficient data available for this analysis.",
    },
    {
      icon: "📅",
      title: "Seasonal Performance",
      body:
        a.seasons.length > 1 && bestSeason
          ? `${bestSeason.label} generates the most revenue (${share(bestSeason.revenue, total).toFixed(1)}%)${worstSeason && worstSeason.label !== bestSeason.label ? `, while ${worstSeason.label} is weakest at ${share(worstSeason.revenue, total).toFixed(1)}%` : ""}.`
          : "Insufficient data available for this analysis.",
    },
    {
      icon: "🎯",
      title: "Customer Groups",
      body: a.segments.length
        ? `${a.segments.length} behavioural segments were found using RFM scoring and k-means clustering. ${a.segments[0]!.name} is the largest by revenue with ${a.segments[0]!.customers} customers averaging ${compactMoney(a.segments[0]!.avgSpend)}.`
        : "Insufficient data available for this analysis.",
    },
    {
      icon: "🚨",
      title: "Major Problems",
      points: problems.length ? problems.slice(0, 5).map((p) => `P${p.priority} · ${p.title} — ${p.detail}`) : ["No significant problems were detected in the available data."],
    },
    { icon: "💡", title: "Recommended Actions", points: problems.length ? problems.slice(0, 5).map((p) => p.action) : improvements.slice(0, 3).map((i) => i.improvement) },
    { icon: "🚀", title: "Growth Opportunities", points: opportunities.slice(0, 4) },
  ];

  const finalSummary = [
    statusLine,
    wins.length ? `Strengths centre on ${wins[0]!.replace(/\.$/, "")}.` : "",
    lags.length ? `The clearest weakness is ${lags[0]!.charAt(0).toLowerCase() + lags[0]!.slice(1).replace(/\.$/, "")}.` : "",
    problems.length
      ? `Addressing the top ${Math.min(3, problems.length)} ranked problem${problems.length > 1 ? "s" : ""} is the most direct next step.`
      : "No ranked problems were detected, so the focus can stay on scaling what already works.",
    "All statements above describe observed patterns in the uploaded data; suggested causes and actions are indicative, not guaranteed outcomes.",
  ]
    .filter(Boolean)
    .join(" ");

  return { patterns, problems, improvements, feedback, opportunities, finalSummary };
}

export type { ProductStat };
