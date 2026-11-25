import type { ReactNode } from "react";
import { AlertOctagon, AlertTriangle, ArrowUp, CheckCircle2, Circle, CircleDot, Clock, Loader, type LucideIcon } from "lucide-react";
import { SEVERITY_LABEL, STATUS_LABEL, type CaseStatus, type Severity } from "@/lib/cases/types";

/** Status palette (dataviz reference): good / warning / serious / critical — always with icon + label. */
export const SEVERITY_COLOR: Record<Severity, string> = {
  low: "#0ca30c",
  medium: "#fab219",
  high: "#ec835a",
  urgent: "#d03b3b",
};

const SEVERITY_ICON: Record<Severity, LucideIcon> = {
  low: Circle,
  medium: CircleDot,
  high: ArrowUp,
  urgent: AlertOctagon,
};

export function SeverityBadge({ severity, source }: { severity: Severity | null; source?: "ai" | "staff" | null }) {
  if (!severity) {
    return <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs text-slate-400">Pending</span>;
  }
  const Icon = SEVERITY_ICON[severity];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-slate-100"
      style={{ borderColor: `${SEVERITY_COLOR[severity]}80`, background: `${SEVERITY_COLOR[severity]}26` }}
      title={source === "staff" ? "Set by staff" : source === "ai" ? "AI preliminary assessment" : undefined}
    >
      <Icon className="size-3" style={{ color: SEVERITY_COLOR[severity] }} aria-hidden />
      {SEVERITY_LABEL[severity]}
      {source === "ai" && <span className="text-[10px] text-slate-400">AI</span>}
    </span>
  );
}

const STATUS_STYLE: Record<CaseStatus, { icon: LucideIcon; cls: string }> = {
  new: { icon: CircleDot, cls: "text-brand-blue-text border-brand-blue-text/40" },
  assigned: { icon: Clock, cls: "text-slate-200 border-slate-500" },
  in_progress: { icon: Loader, cls: "text-amber-200 border-amber-300/40" },
  resolved: { icon: CheckCircle2, cls: "text-emerald-300 border-emerald-400/40" },
  closed: { icon: CheckCircle2, cls: "text-slate-400 border-line" },
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  const { icon: Icon, cls } = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs ${cls}`}>
      <Icon className="size-3" aria-hidden /> {STATUS_LABEL[status]}
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300">
      <AlertTriangle className="size-3" aria-hidden /> Overdue
    </span>
  );
}

export function Panel({ title, subtitle, action, children, className = "" }: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-white">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function KpiTile({ label, value, hint, icon: Icon, tone = "default" }: { label: string; value: ReactNode; hint?: ReactNode; icon: LucideIcon; tone?: "default" | "critical" | "good" }) {
  const iconCls = tone === "critical" ? "text-red-300 bg-red-500/15" : tone === "good" ? "text-emerald-300 bg-emerald-500/15" : "text-brand-blue-text bg-brand-blue/15";
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <span className={`grid size-8 place-items-center rounded-lg ${iconCls}`}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <div className="mt-3 text-3xl tabular-nums text-white">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

export function timeAgo(iso: string, now = Date.now()): string {
  const m = Math.round((now - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}

export function dueIn(iso: string | null, now = Date.now()): string {
  if (!iso) return "—";
  const m = Math.round((new Date(iso).getTime() - now) / 60000);
  const abs = Math.abs(m);
  const txt = abs < 60 ? `${abs} min` : abs < 48 * 60 ? `${Math.round(abs / 60)} h` : `${Math.round(abs / 1440)} days`;
  return m >= 0 ? `in ${txt}` : `${txt} late`;
}

export function hoursLabel(h: number | null): string {
  if (h === null) return "—";
  return h >= 48 ? `${(h / 24).toFixed(1)} days` : `${h.toFixed(1)} h`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
