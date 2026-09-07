export type Row = Record<string, unknown>;

export type ColumnRole =
  | "customerId"
  | "age"
  | "gender"
  | "location"
  | "product"
  | "category"
  | "quantity"
  | "price"
  | "amount"
  | "date"
  | "time"
  | "season"
  | "payment"
  | "discount"
  | "rating";

export type ColumnMap = Partial<Record<ColumnRole, string>>;

export interface DataQuality {
  rows: number;
  columns: number;
  missingCells: number;
  duplicatesRemoved: number;
  dateRange: { start: string; end: string } | null;
  totalSales: number | null;
  customers: number | null;
  products: number | null;
  detected: { role: ColumnRole; column: string }[];
  unmapped: string[];
}

export interface Bucket {
  label: string;
  revenue: number;
  orders: number;
  quantity: number;
  customers: number;
}

export interface ProductStat extends Bucket {
  growth: number | null;
  classification: "High Performer" | "Growing" | "Stable" | "Underperforming" | "Declining";
}

export interface Segment {
  name: string;
  customers: number;
  revenue: number;
  avgSpend: number;
  avgFrequency: number;
  action: string;
}

export interface Problem {
  priority: number;
  title: string;
  detail: string;
  action: string;
}

export interface ImprovementArea {
  area: string;
  situation: string;
  problem: string;
  improvement: string;
  goal: string;
}

export interface FeedbackSection {
  icon: string;
  title: string;
  body?: string;
  points?: string[];
}

export interface Analysis {
  fileName: string;
  generatedAt: string;
  quality: DataQuality;
  overview: {
    revenue: number;
    orders: number;
    quantity: number | null;
    avgOrderValue: number;
    customers: number | null;
    avgPerCustomer: number | null;
    growth: number | null;
    status: "Growing" | "Declining" | "Stable" | "Mixed";
  };
  trend: Bucket[];
  products: ProductStat[];
  categories: ProductStat[];
  ageGroups: Bucket[];
  genders: Bucket[];
  locations: ProductStat[];
  timeOfDay: Bucket[];
  weekdays: Bucket[];
  months: Bucket[];
  seasons: Bucket[];
  segments: Segment[];
  repeatRate: number | null;
  patterns: string[];
  problems: Problem[];
  improvements: ImprovementArea[];
  feedback: FeedbackSection[];
  opportunities: string[];
  finalSummary: string;
}
