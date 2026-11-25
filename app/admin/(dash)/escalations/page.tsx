"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useAdminData } from "@/components/admin/data";
import { Panel, SeverityBadge, StatusBadge, dueIn } from "@/components/admin/ui";
import { isOpen, SLA_HOURS } from "@/lib/cases/sla";
import { SEVERITIES, SEVERITY_LABEL, type CaseSummary } from "@/lib/cases/types";

function List({ items, empty }: { items: CaseSummary[]; empty: string }) {
  if (items.length === 0) return <p className="flex items-center gap-2 text-sm text-slate-400"><CheckCircle2 className="size-4 text-emerald-300" aria-hidden />{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {items.map((c) => (
        <li key={c.id}>
          <Link href={`/admin/cases/${c.id}`} className="grid gap-2 py-3 transition-colors hover:bg-white/[0.02] sm:grid-cols-[9rem_1fr_auto] sm:items-center">
            <div>
              <div className="font-mono text-sm text-white">{c.reference}</div>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm text-slate-200">{c.description}</p>
              <p className="text-xs text-slate-500">{c.subcity ?? "Sub-city not set"} · {c.assignedTo ?? "Not assigned"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <SeverityBadge severity={c.severity} source={c.severitySource} />
              <StatusBadge status={c.status} />
              <span className={`w-24 text-right text-xs tabular-nums ${c.overdue ? "text-red-300" : "text-amber-200"}`}>{dueIn(c.dueAt)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Escalations() {
  const { cases, stats, error } = useAdminData();
  if (!cases && error) return null;
  if (!cases) return <p className="flex items-center gap-2 text-slate-400"><Loader2 className="size-4 animate-spin" aria-hidden /> Loading…</p>;
  const now = stats ? new Date(stats.generatedAt).getTime() : 0;
  const open = cases.filter(isOpen);
  const overdue = open.filter((c) => c.overdue).sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""));
  const soon = open
    .filter((c) => !c.overdue && c.dueAt && new Date(c.dueAt).getTime() - now < 6 * 3_600_000)
    .sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""));
  const unassigned = open.filter((c) => !c.assignedTo);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-white">Deadlines and assignments</h1>
        <p className="mt-1 text-sm text-slate-400">Review overdue reports first, then check upcoming deadlines and assign reports that still need a team.</p>
      </div>

      <Panel title="Resolution targets by priority" subtitle="These are the dashboard’s working targets, measured from when a report is received.">
        <div className="grid gap-3 sm:grid-cols-4">
          {SEVERITIES.map((s) => (
            <div key={s} className="rounded-lg border border-line bg-base p-3">
              <SeverityBadge severity={s} />
              <div className="mt-2 text-lg tabular-nums text-white">{SLA_HOURS[s]} h</div>
              <div className="text-xs text-slate-500">{SEVERITY_LABEL[s]} priority target</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title={`Overdue (${overdue.length})`} subtitle="Open a report to check the assigned team and record the next action." action={<AlertTriangle className="size-5 text-red-300" aria-hidden />}>
        <List items={overdue} empty="No overdue cases." />
      </Panel>
      <Panel title={`Due within 6 hours (${soon.length})`} subtitle="Check whether the assigned team can finish before the deadline." action={<Clock className="size-5 text-amber-200" aria-hidden />}>
        <List items={soon} empty="Nothing due in the next 6 hours." />
      </Panel>
      <Panel title={`Not yet assigned (${unassigned.length})`} subtitle="Open a report and choose its responsible team.">
        <List items={unassigned} empty="Every open case is assigned." />
      </Panel>
    </div>
  );
}
