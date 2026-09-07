import { detectColumns, toDate, toHour, toNumber, toText } from "./parse";
import type {
  Analysis,
  Bucket,
  ColumnMap,
  DataQuality,
  ProductStat,
  Row,
  Segment,
} from "./types";
import { buildInsights } from "./insights";

interface CleanRow {
  customer: string | null;
  age: number | null;
  gender: string | null;
  location: string | null;
  product: string | null;
  category: string | null;
  quantity: number;
  amount: number | null;
  date: Date | null;
  hour: number | null;
  season: string | null;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function seasonFromMonth(m: number): string {
  if (m === 11 || m <= 1) return "Winter";
  if (m <= 4) return "Spring";
  if (m <= 7) return "Summer";
  return "Autumn";
}

function timeBand(h: number): string {
  if (h < 6) return "Night (12–6 AM)";
  if (h < 12) return "Morning (6 AM–12 PM)";
  if (h < 17) return "Afternoon (12–5 PM)";
  if (h < 22) return "Evening (5–10 PM)";
  return "Night (10 PM–12 AM)";
}

function ageBand(a: number): string | null {
  if (!Number.isFinite(a) || a <= 0 || a > 110) return null;
  if (a < 18) return "Under 18";
  if (a < 25) return "18–24";
  if (a < 35) return "25–34";
  if (a < 45) return "35–44";
  if (a < 55) return "45–54";
  return "55+";
}

function emptyBucket(label: string): Bucket & { customerSet: Set<string> } {
  return { label, revenue: 0, orders: 0, quantity: 0, customers: 0, customerSet: new Set() };
}

function group(rows: CleanRow[], key: (r: CleanRow) => string | null): Bucket[] {
  const map = new Map<string, Bucket & { customerSet: Set<string> }>();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    let b = map.get(k);
    if (!b) {
      b = emptyBucket(k);
      map.set(k, b);
    }
    b.revenue += r.amount ?? 0;
    b.orders += 1;
    b.quantity += r.quantity;
    if (r.customer) b.customerSet.add(r.customer);
  }
  return [...map.values()].map(({ customerSet, ...b }) => ({ ...b, customers: customerSet.size }));
}

function sortByRevenue(b: Bucket[]) {
  return [...b].sort((x, y) => y.revenue - x.revenue);
}

function classify(growth: number | null, revenue: number, avgRevenue: number): ProductStat["classification"] {
  if (growth !== null && growth <= -15) return "Declining";
  if (growth !== null && growth >= 15 && revenue >= avgRevenue * 0.6) return "Growing";
  if (revenue >= avgRevenue * 1.5) return "High Performer";
  if (revenue < avgRevenue * 0.5) return "Underperforming";
  return "Stable";
}

function withGrowth(
  rows: CleanRow[],
  key: (r: CleanRow) => string | null,
  split: Date | null,
): ProductStat[] {
  const base = sortByRevenue(group(rows, key));
  const avg = base.length ? base.reduce((s, b) => s + b.revenue, 0) / base.length : 0;
  let prev = new Map<string, number>();
  let curr = new Map<string, number>();
  if (split) {
    for (const r of rows) {
      const k = key(r);
      if (!k || !r.date) continue;
      const target = r.date < split ? prev : curr;
      target.set(k, (target.get(k) ?? 0) + (r.amount ?? 0));
    }
  }
  return base.map((b) => {
    const p = prev.get(b.label) ?? 0;
    const c = curr.get(b.label) ?? 0;
    const growth = split && p > 0 ? ((c - p) / p) * 100 : null;
    return { ...b, growth, classification: classify(growth, b.revenue, avg) };
  });
}

/** Simple k-means over standardized RFM scores. */
function kmeans(points: number[][], k: number, iterations = 25): number[] {
  if (points.length <= k) return points.map((_, i) => i);
  const centroids = points
    .slice()
    .sort((a, b) => b.reduce((s, v) => s + v, 0) - a.reduce((s, v) => s + v, 0))
    .filter((_, i) => i % Math.max(1, Math.floor(points.length / k)) === 0)
    .slice(0, k)
    .map((p) => [...p]);
  let assign = new Array(points.length).fill(0);
  for (let it = 0; it < iterations; it++) {
    let changed = false;
    points.forEach((p, i) => {
      let best = 0;
      let bestD = Infinity;
      centroids.forEach((c, ci) => {
        const d = c.reduce((s, v, j) => s + (v - p[j]!) ** 2, 0);
        if (d < bestD) {
          bestD = d;
          best = ci;
        }
      });
      if (assign[i] !== best) changed = true;
      assign[i] = best;
    });
    centroids.forEach((c, ci) => {
      const members = points.filter((_, i) => assign[i] === ci);
      if (!members.length) return;
      for (let j = 0; j < c.length; j++) {
        c[j] = members.reduce((s, m) => s + m[j]!, 0) / members.length;
      }
    });
    if (!changed) break;
  }
  return assign;
}

function quintile(values: number[], v: number, reverse = false): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = sorted.findIndex((x) => x >= v);
  const pct = sorted.length > 1 ? (idx < 0 ? 1 : idx / (sorted.length - 1)) : 0.5;
  const score = Math.min(5, Math.max(1, Math.round(pct * 4) + 1));
  return reverse ? 6 - score : score;
}

function buildSegments(rows: CleanRow[], hasCustomer: boolean, hasAmount: boolean): Segment[] {
  if (!hasCustomer || !hasAmount) return [];
  const map = new Map<string, { last: Date | null; freq: number; monetary: number }>();
  for (const r of rows) {
    if (!r.customer) continue;
    const c = map.get(r.customer) ?? { last: null, freq: 0, monetary: 0 };
    c.freq += 1;
    c.monetary += r.amount ?? 0;
    if (r.date && (!c.last || r.date > c.last)) c.last = r.date;
    map.set(r.customer, c);
  }
  const entries = [...map.entries()];
  if (entries.length < 6) return [];
  const maxDate = entries.reduce<Date | null>(
    (acc, [, v]) => (v.last && (!acc || v.last > acc) ? v.last : acc),
    null,
  );
  const recency = entries.map(([, v]) =>
    maxDate && v.last ? Math.round((maxDate.getTime() - v.last.getTime()) / 86400000) : 0,
  );
  const freq = entries.map(([, v]) => v.freq);
  const money = entries.map(([, v]) => v.monetary);

  const scored = entries.map(([id, v], i) => ({
    id,
    r: maxDate ? quintile(recency, recency[i]!, true) : 3,
    f: quintile(freq, freq[i]!),
    m: quintile(money, money[i]!),
    freq: v.freq,
    monetary: v.monetary,
  }));

  const points = scored.map((s) => [s.r, s.f, s.m]);
  const clusters = kmeans(points, Math.min(6, Math.max(3, Math.floor(scored.length / 3))));
  const groups = new Map<number, typeof scored>();
  scored.forEach((s, i) => {
    const c = clusters[i]!;
    groups.set(c, [...(groups.get(c) ?? []), s]);
  });

  const raw = [...groups.values()].map((members) => {
    const avg = (sel: (s: (typeof members)[number]) => number) =>
      members.reduce((sum, m) => sum + sel(m), 0) / members.length;
    return {
      members,
      r: avg((s) => s.r),
      f: avg((s) => s.f),
      m: avg((s) => s.m),
      revenue: members.reduce((s, x) => s + x.monetary, 0),
    };
  });

  const naming = (g: (typeof raw)[number]): { name: string; action: string } => {
    const score = g.f + g.m;
    if (g.m >= 4 && g.f >= 3.5) return { name: "High Value", action: "Provide loyalty benefits and personalised offers to retain these customers." };
    if (g.f >= 3.5) return { name: "Loyal", action: "Reward consistency with early access and tiered perks." };
    if (g.r >= 4 && g.f <= 2) return { name: "New", action: "Nurture with onboarding offers to drive a second purchase." };
    if (g.r <= 2 && score >= 5) return { name: "At Risk", action: "Use targeted re-engagement campaigns before these customers lapse." };
    if (score >= 5) return { name: "Potential Loyal", action: "Encourage repeat buying with bundles and reminders." };
    return { name: "Low Value", action: "Keep acquisition cost low; test low-cost automated offers." };
  };

  const used = new Set<string>();
  return raw
    .sort((a, b) => b.revenue - a.revenue)
    .map((g) => {
      let { name, action } = naming(g);
      let suffix = 2;
      let unique = name;
      while (used.has(unique)) unique = `${name} ${suffix++}`;
      used.add(unique);
      return {
        name: unique,
        customers: g.members.length,
        revenue: g.revenue,
        avgSpend: g.revenue / g.members.length,
        avgFrequency: g.members.reduce((s, m) => s + m.freq, 0) / g.members.length,
        action,
      };
    });
}

export function analyze(rawRows: Row[], columns: string[], fileName: string): Analysis {
  const map: ColumnMap = detectColumns(columns);

  // de-duplicate
  const seen = new Set<string>();
  const deduped: Row[] = [];
  let duplicates = 0;
  for (const r of rawRows) {
    const key = JSON.stringify(columns.map((c) => r[c] ?? ""));
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    deduped.push(r);
  }

  let missingCells = 0;
  for (const r of deduped) {
    for (const c of columns) if (toText(r[c]) === null) missingCells++;
  }

  const clean: CleanRow[] = deduped.map((r) => {
    const date = map.date ? toDate(r[map.date]) : null;
    const qty = map.quantity ? (toNumber(r[map.quantity]) ?? 1) : 1;
    const price = map.price ? toNumber(r[map.price]) : null;
    const amountRaw = map.amount ? toNumber(r[map.amount]) : null;
    const amount = amountRaw ?? (price !== null ? price * qty : null);
    const seasonCol = map.season ? toText(r[map.season]) : null;
    return {
      customer: map.customerId ? toText(r[map.customerId]) : null,
      age: map.age ? toNumber(r[map.age]) : null,
      gender: map.gender ? toText(r[map.gender]) : null,
      location: map.location ? toText(r[map.location]) : null,
      product: map.product ? toText(r[map.product]) : null,
      category: map.category ? toText(r[map.category]) : null,
      quantity: qty > 0 ? qty : 1,
      amount: amount !== null && amount >= 0 ? amount : null,
      date,
      hour: toHour(map.time ? r[map.time] : null, date),
      season: seasonCol ?? (date ? seasonFromMonth(date.getMonth()) : null),
    };
  });

  const hasAmount = clean.some((r) => r.amount !== null);
  const hasDate = clean.some((r) => r.date !== null);
  const dates = clean.map((r) => r.date).filter((d): d is Date => !!d).sort((a, b) => a.getTime() - b.getTime());
  const split = dates.length > 3 ? new Date((dates[0]!.getTime() + dates[dates.length - 1]!.getTime()) / 2) : null;

  const revenue = clean.reduce((s, r) => s + (r.amount ?? 0), 0);
  const quantity = clean.reduce((s, r) => s + r.quantity, 0);
  const customerSet = new Set(clean.map((r) => r.customer).filter(Boolean) as string[]);
  const productSet = new Set(clean.map((r) => r.product ?? r.category).filter(Boolean) as string[]);

  let growth: number | null = null;
  if (split && hasAmount) {
    const prev = clean.filter((r) => r.date && r.date < split).reduce((s, r) => s + (r.amount ?? 0), 0);
    const curr = clean.filter((r) => r.date && r.date >= split).reduce((s, r) => s + (r.amount ?? 0), 0);
    if (prev > 0) growth = ((curr - prev) / prev) * 100;
  }

  const trend = hasDate
    ? group(clean, (r) => (r.date ? `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}` : null)).sort(
        (a, b) => a.label.localeCompare(b.label),
      )
    : [];

  const products = withGrowth(clean, (r) => r.product, split).slice(0, 12);
  const categories = withGrowth(clean, (r) => r.category, split);
  const locations = withGrowth(clean, (r) => r.location, split);

  const ageGroups = group(clean, (r) => (r.age !== null ? ageBand(r.age) : null)).sort(
    (a, b) => ["Under 18", "18–24", "25–34", "35–44", "45–54", "55+"].indexOf(a.label) -
      ["Under 18", "18–24", "25–34", "35–44", "45–54", "55+"].indexOf(b.label),
  );
  const genders = sortByRevenue(group(clean, (r) => r.gender));
  const timeOfDay = group(clean, (r) => (r.hour !== null ? timeBand(r.hour) : null));
  const weekdays = group(clean, (r) => (r.date ? DAYS[r.date.getDay()]! : null)).sort(
    (a, b) => DAYS.indexOf(a.label) - DAYS.indexOf(b.label),
  );
  const months = group(clean, (r) => (r.date ? MONTHS[r.date.getMonth()]! : null)).sort(
    (a, b) => MONTHS.indexOf(a.label) - MONTHS.indexOf(b.label),
  );
  const seasons = sortByRevenue(group(clean, (r) => r.season));

  const segments = buildSegments(clean, customerSet.size > 0, hasAmount);

  let repeatRate: number | null = null;
  if (customerSet.size > 0) {
    const counts = new Map<string, number>();
    for (const r of clean) if (r.customer) counts.set(r.customer, (counts.get(r.customer) ?? 0) + 1);
    const repeat = [...counts.values()].filter((v) => v > 1).length;
    repeatRate = (repeat / counts.size) * 100;
  }

  const quality: DataQuality = {
    rows: deduped.length,
    columns: columns.length,
    missingCells,
    duplicatesRemoved: duplicates,
    dateRange: dates.length
      ? { start: dates[0]!.toISOString().slice(0, 10), end: dates[dates.length - 1]!.toISOString().slice(0, 10) }
      : null,
    totalSales: hasAmount ? revenue : null,
    customers: customerSet.size || null,
    products: productSet.size || null,
    detected: (Object.entries(map) as [keyof ColumnMap, string][]).map(([role, column]) => ({ role, column })),
    unmapped: columns.filter((c) => !Object.values(map).includes(c)),
  };

  const overview: Analysis["overview"] = {
    revenue,
    orders: clean.length,
    quantity: map.quantity ? quantity : null,
    avgOrderValue: clean.length ? revenue / clean.length : 0,
    customers: customerSet.size || null,
    avgPerCustomer: customerSet.size ? revenue / customerSet.size : null,
    growth,
    status:
      growth === null
        ? "Stable"
        : growth > 5
          ? categories.some((c) => (c.growth ?? 0) < -10)
            ? "Mixed"
            : "Growing"
          : growth < -5
            ? "Declining"
            : "Stable",
  };

  const partial: Omit<Analysis, "patterns" | "problems" | "improvements" | "feedback" | "opportunities" | "finalSummary"> = {
    fileName,
    generatedAt: new Date().toISOString(),
    quality,
    overview,
    trend,
    products,
    categories,
    ageGroups,
    genders,
    locations,
    timeOfDay,
    weekdays,
    months,
    seasons,
    segments,
    repeatRate,
  };

  return { ...partial, ...buildInsights(partial, hasAmount) };
}
