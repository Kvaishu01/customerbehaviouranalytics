import Papa from "papaparse";
import type { ColumnMap, ColumnRole, Row } from "./types";

export async function readFile(file: File): Promise<{ rows: Row[]; columns: string[] }> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    const text = await file.text();
    const parsed = Papa.parse<Row>(text, {
      header: true,
      skipEmptyLines: "greedy",
      dynamicTyping: false,
    });
    const rows = (parsed.data || []).filter((r) => r && Object.keys(r).length > 0);
    return { rows, columns: (parsed.meta.fields || []).filter(Boolean) };
  }
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]!];
  if (!sheet) return { rows: [], columns: [] };
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "", raw: true });
  const columns = rows.length ? Object.keys(rows[0]!) : [];
  return { rows, columns };
}

const PATTERNS: { role: ColumnRole; tests: RegExp[] }[] = [
  { role: "customerId", tests: [/^customer[\s_-]?id$/i, /^cust[\s_-]?id$/i, /^user[\s_-]?id$/i, /customer.*id/i, /^client[\s_-]?id$/i] },
  { role: "age", tests: [/^age$/i, /customer.*age/i, /age.*customer/i] },
  { role: "gender", tests: [/^gender$/i, /^sex$/i] },
  { role: "location", tests: [/^location$/i, /^city$/i, /^region$/i, /^state$/i, /^country$/i, /^store$/i, /^branch$/i] },
  { role: "category", tests: [/category/i, /product.*type/i, /^dept/i, /department/i] },
  { role: "product", tests: [/^product$/i, /product.*name/i, /^item$/i, /item.*name/i, /^sku$/i, /^product[\s_-]?id$/i] },
  { role: "quantity", tests: [/^quantity$/i, /^qty$/i, /units/i, /^count$/i] },
  { role: "amount", tests: [/sales?[\s_-]?amount/i, /total.*(amount|price|sales|value)/i, /^revenue$/i, /^amount$/i, /^sales$/i, /line.*total/i] },
  { role: "price", tests: [/unit.*price/i, /^price$/i, /price.*per/i, /^rate$/i] },
  { role: "date", tests: [/date/i, /^order.*day$/i, /timestamp/i, /^day$/i] },
  { role: "time", tests: [/^time$/i, /order.*time/i, /^hour$/i, /purchase.*time/i] },
  { role: "season", tests: [/^season$/i] },
  { role: "payment", tests: [/payment/i, /^method$/i] },
  { role: "discount", tests: [/discount/i, /^promo/i] },
  { role: "rating", tests: [/rating/i, /^review.*score/i, /^score$/i] },
];

export function detectColumns(columns: string[]): ColumnMap {
  const map: ColumnMap = {};
  const used = new Set<string>();
  for (const { role, tests } of PATTERNS) {
    for (const test of tests) {
      const hit = columns.find((c) => !used.has(c) && test.test(String(c).trim()));
      if (hit) {
        map[role] = hit;
        used.add(hit);
        break;
      }
    }
  }
  return map;
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[^0-9.\-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function toText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s || /^(n\/?a|null|none|unknown|-)$/i.test(s)) return null;
  return s;
}

export function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const s = toText(value);
  if (!s) return null;
  // dd/mm/yyyy or dd-mm-yyyy handling when first part > 12
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (m) {
    let [, a, b, y] = m;
    let day = Number(a);
    let month = Number(b);
    if (day <= 12 && month <= 12) {
      // ambiguous: assume month/day (most common in datasets)
      month = Number(a);
      day = Number(b);
    }
    const year = Number(y!.length === 2 ? `20${y}` : y);
    const d = new Date(year, month - 1, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toHour(value: unknown, fallbackDate: Date | null): number | null {
  const s = toText(value);
  if (s) {
    const m = s.match(/(\d{1,2})\s*:\s*(\d{2})/);
    if (m) {
      let h = Number(m[1]);
      if (/pm/i.test(s) && h < 12) h += 12;
      if (/am/i.test(s) && h === 12) h = 0;
      if (h >= 0 && h <= 23) return h;
    }
    const n = Number(s);
    if (Number.isFinite(n) && n >= 0 && n <= 23 && /^\d{1,2}$/.test(s)) return n;
  }
  if (typeof value === "number" && value > 0 && value < 1) return Math.floor(value * 24);
  if (fallbackDate) {
    const h = fallbackDate.getHours();
    const hasTime = h !== 0 || fallbackDate.getMinutes() !== 0;
    if (hasTime) return h;
  }
  return null;
}
