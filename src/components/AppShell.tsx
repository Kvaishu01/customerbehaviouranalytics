import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Explorer" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/report", label: "Report" },
] as const;

export function AppShell({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden page-gradient text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-24 size-[520px] rounded-full opacity-50 blur-3xl drift-slow bg-[radial-gradient(circle,rgba(124,196,255,0.45),transparent_70%)]" />
        <div className="absolute top-1/3 -right-32 size-[560px] rounded-full opacity-40 blur-3xl drift-mid bg-[radial-gradient(circle,rgba(79,140,255,0.40),transparent_70%)]" />
        <div className="absolute bottom-0 left-1/3 size-[480px] rounded-full opacity-30 blur-3xl drift-lazy bg-[radial-gradient(circle,rgba(120,230,220,0.30),transparent_70%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-5 py-7 sm:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl glass-a font-display text-lg font-bold bg-[linear-gradient(135deg,rgba(124,196,255,0.35),rgba(79,140,255,0.15))]">
              N
            </div>
            <div>
              <p className="font-display text-lg leading-none tracking-tight">
                Northstar<span className="text-glow"> Insights</span>
              </p>
              <p className="text-[11px] tracking-wide text-mist">Customer Behavior &amp; Business Intelligence</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 rounded-full glass px-1.5 py-1.5 text-[13px]">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-full px-4 py-1.5 text-mist transition-colors hover:text-foreground"
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "rounded-full px-4 py-1.5 text-foreground bg-[rgba(124,196,255,0.16)]" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">{action}</div>
        </header>

        {children}
      </div>
    </div>
  );
}
