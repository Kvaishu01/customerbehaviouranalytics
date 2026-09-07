import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Panel } from "@/components/charts";
import { analyze } from "@/lib/analytics/engine";
import { detectColumns, readFile } from "@/lib/analytics/parse";
import { setAnalysis, useAnalysis } from "@/lib/analytics/store";
import { num } from "@/lib/analytics/format";
import type { Row } from "@/lib/analytics/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Data Explorer · Northstar Insights" },
      {
        name: "description",
        content:
          "Upload a CSV or Excel sales dataset, review detected columns and data quality, then run the customer behaviour and business insight analysis.",
      },
      { property: "og:title", content: "Data Explorer · Northstar Insights" },
      {
        property: "og:description",
        content: "Upload sales data and generate an AI business feedback report with patterns, problems and recommendations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explorer,
});

const ROLE_LABELS: Record<string, string> = {
  customerId: "Customer ID",
  age: "Customer Age",
  gender: "Gender",
  location: "Location",
  product: "Product",
  category: "Product Category",
  quantity: "Quantity",
  price: "Unit Price",
  amount: "Sales Amount",
  date: "Order Date",
  time: "Order Time",
  season: "Season",
  payment: "Payment Method",
  discount: "Discount",
  rating: "Rating",
};

function Explorer() {
  const navigate = useNavigate();
  const analysis = useAnalysis();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; rows: Row[]; columns: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(f: File | undefined | null) {
    if (!f) return;
    setError(null);
    setBusy(true);
    try {
      const { rows, columns } = await readFile(f);
      if (!rows.length || !columns.length) {
        setError("That file has no readable rows. Please upload a CSV or Excel file with a header row.");
        setFile(null);
      } else {
        setFile({ name: f.name, rows, columns });
      }
    } catch {
      setError("The file could not be read. Supported formats are CSV, XLSX and XLS.");
    } finally {
      setBusy(false);
    }
  }

  function runAnalysis() {
    if (!file) return;
    setBusy(true);
    setTimeout(() => {
      try {
        setAnalysis(analyze(file.rows, file.columns, file.name));
        navigate({ to: "/dashboard" });
      } catch {
        setError("Something went wrong while analysing this dataset.");
      } finally {
        setBusy(false);
      }
    }, 30);
  }

  const detected = file ? detectColumns(file.columns) : {};
  const detectedEntries = Object.entries(detected) as [string, string][];
  const missing = file
    ? file.rows.reduce(
        (sum, r) => sum + file.columns.filter((c) => r[c] === null || r[c] === undefined || String(r[c]).trim() === "").length,
        0,
      )
    : 0;

  return (
    <AppShell
      action={
        analysis ? (
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="rounded-full glass px-4 py-2 text-[13px] text-mist transition-colors hover:text-foreground"
          >
            View current results
          </button>
        ) : null
      }
    >
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-3xl glass p-6">
            <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-mist">Data Explorer</p>
            <h1 className="mb-3 font-display text-2xl leading-snug text-gradient-frost">
              Upload sales data. Get a business feedback report.
            </h1>
            <p className="text-[13px] leading-relaxed text-mist">
              The system detects the columns your file actually contains, cleans the data, finds patterns in customer
              behaviour, sales performance, timing and seasonality, then writes a plain-language report with the
              problems it found and what to consider doing about them. Analyses that your data cannot support are
              clearly marked instead of guessed.
            </p>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void handleFile(e.dataTransfer.files?.[0]);
            }}
            className="rounded-3xl glass-a p-8 text-center"
          >
            <p className="font-display text-lg">Drop your dataset here</p>
            <p className="mt-1 text-[12px] text-mist">CSV, XLSX or XLS with a header row</p>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-5 rounded-full btn-primary px-5 py-2 text-[13px] font-semibold"
            >
              Choose file
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            {file ? <p className="mt-4 text-[12px] text-glow">Loaded: {file.name}</p> : null}
            {error ? <p className="mt-4 text-[12px] text-negative">{error}</p> : null}
          </div>

          {file ? (
            <Panel title="Data quality summary" subtitle="Before cleaning">
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <Stat label="Rows" value={num(file.rows.length)} />
                <Stat label="Columns" value={num(file.columns.length)} />
                <Stat label="Missing values" value={num(missing)} />
                <Stat label="Recognised fields" value={`${detectedEntries.length} of ${file.columns.length}`} />
              </div>
              <button
                onClick={runAnalysis}
                disabled={busy}
                className="mt-5 w-full rounded-full btn-primary px-5 py-2.5 text-[13px] font-semibold disabled:opacity-60"
              >
                {busy ? "Analysing…" : "Analyze Data"}
              </button>
            </Panel>
          ) : null}
        </div>

        <div className="space-y-5 lg:col-span-7">
          <Panel title="Detected columns" subtitle="Mapped automatically from your header row">
            {!file ? (
              <p className="text-[12px] text-mist">Upload a file to see which fields were recognised.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {detectedEntries.map(([role, col]) => (
                  <span key={role} className="rounded-full glass px-3 py-1.5 text-[11px]">
                    <span className="text-glow">{ROLE_LABELS[role] ?? role}</span>
                    <span className="text-mist"> · {col}</span>
                  </span>
                ))}
                {file.columns
                  .filter((c) => !Object.values(detected).includes(c))
                  .map((c) => (
                    <span key={c} className="rounded-full glass px-3 py-1.5 text-[11px] text-mist">
                      {c} · unused
                    </span>
                  ))}
              </div>
            )}
          </Panel>

          <Panel title="Data preview" subtitle={file ? `First 8 of ${num(file.rows.length)} rows` : "No file loaded"}>
            {!file ? (
              <p className="text-[12px] text-mist">Your uploaded rows will appear here.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-mist">
                      {file.columns.slice(0, 9).map((c) => (
                        <th key={c} className="whitespace-nowrap px-2 py-2 font-medium uppercase tracking-wider">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {file.rows.slice(0, 8).map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        {file.columns.slice(0, 9).map((c) => (
                          <td key={c} className="whitespace-nowrap px-2 py-2 text-foreground/80">
                            {String(r[c] ?? "—").slice(0, 22)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl glass px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-mist">{label}</p>
      <p className="mt-1 font-display text-lg">{value}</p>
    </div>
  );
}
