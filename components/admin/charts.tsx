"use client";

/**
 * Small, dependency-free charts following the dataviz method: thin marks, 4px
 * rounded data ends on the baseline, recessive axes, hover tooltips, a data table
 * behind every chart, and status colours only with icon + label.
 */
import { useState } from "react";
import { SEVERITY_LABEL, type Severity } from "@/lib/cases/types";
import { SEVERITY_COLOR, SeverityBadge } from "./ui";

const SERIES = "#3987e5"; // single-series blue (dark-mode categorical slot 1)

function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-3 text-xs text-slate-400">
      <summary className="cursor-pointer select-none hover:text-slate-200">Show data table</summary>
      <table className="mt-2 w-full text-left">
        <thead>
          <tr>{head.map((h) => <th key={h} className="py-1 pr-3 font-normal text-slate-500">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line/60">
              {r.map((c, j) => <td key={j} className="py-1 pr-3 tabular-nums text-slate-300">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** Reports per day — one series, so no legend; the title names it. */
export function DailyBars({ data }: { data: { date: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(4, ...data.map((d) => d.count));
  const ticks = [0, Math.round(max / 2), max];
  const label = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return (
    <div>
      <div className="relative flex h-48 gap-3">
        <div className="flex w-6 flex-col justify-between text-right text-[10px] tabular-nums text-slate-500" aria-hidden>
          {[...ticks].reverse().map((t) => <span key={t}>{t}</span>)}
        </div>
        <div className="relative flex-1">
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-line/50" style={{ bottom: `${(t / max) * 100}%` }} aria-hidden />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]" role="img" aria-label="Reports received per day">
            {data.map((d, i) => (
              <div
                key={d.date}
                className="relative flex h-full flex-1 items-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  className="w-full rounded-t-[4px] transition-opacity"
                  style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 2 : 0, background: SERIES, opacity: hover === null || hover === i ? 1 : 0.45 }}
                />
                {hover === i && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-deep px-2.5 py-1.5 text-xs shadow-lg">
                    <div className="text-slate-400">{label(d.date)}</div>
                    <div className="tabular-nums text-white">{d.count} reports</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="ml-9 mt-2 flex justify-between text-[10px] text-slate-500" aria-hidden>
        <span>{label(data[0].date)}</span>
        <span>{label(data[Math.floor(data.length / 2)].date)}</span>
        <span>Today</span>
      </div>
      <DataTable head={["Date", "Reports"]} rows={data.map((d) => [d.date, d.count])} />
    </div>
  );
}

/** Cases by sub-city: total bar, open/overdue as text (values in ink, not series colour). */
export function SubcityBars({ data, onSelect }: { data: { name: string; total: number; open: number; overdue: number }[]; onSelect?: (name: string) => void }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div>
      <ul className="space-y-2">
        {data.map((d) => (
          <li key={d.name}>
            <button
              type="button"
              onClick={() => onSelect?.(d.name)}
              className="group grid w-full grid-cols-[8.5rem_1fr_auto] items-center gap-3 text-left text-sm"
              title={`${d.name}: ${d.total} total, ${d.open} open, ${d.overdue} overdue`}
            >
              <span className="truncate text-slate-300 group-hover:text-white">{d.name}</span>
              <span className="h-3 rounded-r-[4px] transition-opacity group-hover:opacity-80" style={{ width: `${(d.total / max) * 100}%`, background: SERIES, minWidth: 4 }} />
              <span className="w-28 text-right text-xs tabular-nums text-slate-400">
                <span className="text-slate-200">{d.total}</span> · {d.open} open
                {d.overdue > 0 && <span className="text-red-300"> · {d.overdue} late</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <DataTable head={["Sub-city", "Total", "Open", "Overdue"]} rows={data.map((d) => [d.name, d.total, d.open, d.overdue])} />
    </div>
  );
}

/** Priority mix: status colours, each bar labelled with icon + name (never colour alone). */
export function SeverityBars({ data }: { data: { severity: Severity; total: number; open: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div>
      <ul className="space-y-3">
        {data.map((d) => (
          <li key={d.severity} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 text-sm" title={`${SEVERITY_LABEL[d.severity]}: ${d.total} total, ${d.open} open`}>
            <SeverityBadge severity={d.severity} />
            <span className="h-3 rounded-r-[4px]" style={{ width: `${(d.total / max) * 100}%`, minWidth: 4, background: SEVERITY_COLOR[d.severity] }} />
            <span className="w-20 text-right text-xs tabular-nums text-slate-400">
              <span className="text-slate-200">{d.total}</span> · {d.open} open
            </span>
          </li>
        ))}
      </ul>
      <DataTable head={["Priority", "Total", "Open"]} rows={data.map((d) => [SEVERITY_LABEL[d.severity], d.total, d.open])} />
    </div>
  );
}
