"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ImageIcon, Loader2, Search } from "lucide-react";
import { useAdminData } from "@/components/admin/data";
import { OverdueBadge, Panel, SeverityBadge, SourceBadge, StatusBadge, dueIn, timeAgo } from "@/components/admin/ui";
import { SUBCITY_NAMES } from "@/lib/cases/geo";
import { SEVERITIES, SEVERITY_LABEL, STATUSES, STATUS_LABEL } from "@/lib/cases/types";

const SEV_RANK = { urgent: 0, high: 1, medium: 2, low: 3 } as const;
const select = "rounded-lg border border-line bg-base px-3 py-2 text-sm text-slate-200 focus:border-brand-blue-text focus:outline-none";

function CasesTable() {
  const { cases } = useAdminData();
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(params.get("status") ?? "open");
  const [severity, setSeverity] = useState(params.get("severity") ?? "");
  const [subcity, setSubcity] = useState(params.get("subcity") ?? "");
  const [sort, setSort] = useState<"newest" | "priority" | "due">("newest");

  const rows = useMemo(() => {
    if (!cases) return [];
    const term = q.trim().toLowerCase();
    return cases
      .filter((c) =>
        status === "open" ? c.status !== "resolved" && c.status !== "closed" : status === "overdue" ? c.overdue : !status || c.status === status,
      )
      .filter((c) => !severity || c.severity === severity)
      .filter((c) => !subcity || (c.subcity ?? "Unassigned") === subcity)
      .filter((c) => !term || [c.reference, c.description, c.location.text, c.subcity, c.assignedTo].some((v) => v?.toLowerCase().includes(term)))
      .sort((a, b) =>
        sort === "priority"
          ? (SEV_RANK[a.severity ?? "low"] ?? 4) - (SEV_RANK[b.severity ?? "low"] ?? 4) || b.createdAt.localeCompare(a.createdAt)
          : sort === "due"
            ? (a.dueAt ?? "9").localeCompare(b.dueAt ?? "9")
            : b.createdAt.localeCompare(a.createdAt),
      );
  }, [cases, q, status, severity, subcity, sort]);

  if (!cases) return <p className="flex items-center gap-2 text-slate-400"><Loader2 className="size-4 animate-spin" aria-hidden /> Loading cases…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-white">Cases</h1>
        <p className="mt-1 text-sm text-slate-400">{rows.length} of {cases.length} cases</p>
      </div>

      {/* Filters: one row above the table */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Search</span>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference, place, description…" className={`${select} w-full pl-9`} />
        </label>
        <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className={select}>
          <option value="open">All open</option>
          <option value="overdue">Overdue</option>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select aria-label="Priority" value={severity} onChange={(e) => setSeverity(e.target.value)} className={select}>
          <option value="">All priorities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>)}
        </select>
        <select aria-label="Sub-city" value={subcity} onChange={(e) => setSubcity(e.target.value)} className={select}>
          <option value="">All sub-cities</option>
          {[...SUBCITY_NAMES, "Unassigned"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={select}>
          <option value="newest">Newest first</option>
          <option value="priority">Priority</option>
          <option value="due">Due soonest</option>
        </select>
      </div>

      <Panel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-line bg-deep/50 text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3 font-normal">Reference</th>
                <th className="px-4 py-3 font-normal">Problem</th>
                <th className="px-4 py-3 font-normal">Sub-city</th>
                <th className="px-4 py-3 font-normal">Priority</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal">Target</th>
                <th className="px-4 py-3 font-normal">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/admin/cases/${c.id}`)}
                  className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${c.source === "web" ? "bg-brand-blue/[0.04]" : ""}`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/admin/cases/${c.id}`} className="font-mono text-white hover:text-brand-blue-text" onClick={(e) => e.stopPropagation()}>
                      {c.reference}
                    </Link>
                    <div className="mt-1 flex items-center gap-1.5">
                      <SourceBadge source={c.source} />
                      {c.hasPhoto && <ImageIcon className="size-3.5 text-slate-500" aria-label="Has photo" />}
                    </div>
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="truncate text-slate-200">{c.description}</p>
                    <p className="truncate text-xs text-slate-500">{c.location.text ?? (c.location.lat ? "GPS location" : "")}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {c.subcity ?? <span className="text-slate-500">—</span>}
                    {c.subcityApprox && <span className="ml-1 text-[10px] text-slate-500">approx.</span>}
                  </td>
                  <td className="px-4 py-3"><SeverityBadge severity={c.severity} source={c.severitySource} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={c.status} />
                      {c.overdue && <OverdueBadge />}
                    </div>
                  </td>
                  <td className={`whitespace-nowrap px-4 py-3 text-xs tabular-nums ${c.overdue ? "text-red-300" : "text-slate-400"}`}>
                    {c.status === "resolved" || c.status === "closed" ? "Done" : dueIn(c.dueAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">{timeAgo(c.createdAt)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No cases match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={null}>
      <CasesTable />
    </Suspense>
  );
}
