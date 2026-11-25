"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Inbox, Loader2, Sparkles, Timer, Users } from "lucide-react";
import { DailyBars, SeverityBars, SubcityBars } from "@/components/admin/charts";
import { adminFetch, useAdminData } from "@/components/admin/data";
import { KpiTile, OverdueBadge, Panel, SeverityBadge, StatusBadge, dueIn, hoursLabel, timeAgo } from "@/components/admin/ui";

import { isOpen } from "@/lib/cases/sla";

type Summary = { headline: string; insights: string[]; actions: string[]; lang: string; generatedAt: string };

function AiSummary({ hasReports }: { hasReports: boolean }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const generate = async (lang: "en" | "am") => {
    setBusy(true);
    setError(false);
    try {
      setSummary(await adminFetch<Summary>("/api/admin/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang }) }));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Panel
      title="Weekly briefing"
      subtitle="Generate an AI briefing using report totals from the last 30 days."
      action={
        <div className="flex gap-2">
          {(["en", "am"] as const).map((l) => (
            <button
              key={l}
              type="button"
              disabled={busy || !hasReports}
              onClick={() => void generate(l)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-blue-text/50 px-3 py-1.5 text-xs text-brand-blue-text transition-colors hover:bg-brand-blue-text/10 disabled:opacity-50"
            >
              <Sparkles className="size-3.5" aria-hidden /> {l === "en" ? "English" : "በአማርኛ"}
            </button>
          ))}
        </div>
      }
    >
      {busy && (
        <p className="flex items-center gap-2 text-sm text-slate-300"><Loader2 className="size-4 animate-spin" aria-hidden /> Analysing the figures…</p>
      )}
      {!busy && error && <p className="text-sm text-red-300">The AI summary is not available right now. Try again in a moment.</p>}
      {!busy && !summary && !error && <p className="text-sm text-slate-400">{hasReports ? "Use the briefing to review trends and plan the coming week." : "A briefing will be available when reports are received."}</p>}
      {!busy && summary && (
        <div lang={summary.lang} className="space-y-4">
          <p className="text-lg leading-snug text-white">{summary.headline}</p>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="text-xs uppercase tracking-wide text-slate-400">Insights</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-200">
                {summary.insights.map((x, i) => <li key={i} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-blue-text" />{x}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-slate-400">Recommended actions</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-200">
                {summary.actions.map((x, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-green-text" aria-hidden />{x}</li>)}
              </ul>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">Generated {new Date(summary.generatedAt).toLocaleString("en-GB")}</p>
        </div>
      )}
    </Panel>
  );
}

export default function Overview() {
  const { stats, cases, error } = useAdminData();
  const router = useRouter();

  if (!stats || !cases) {
    if (error) return null;
    return <p className="flex items-center gap-2 text-slate-400"><Loader2 className="size-4 animate-spin" aria-hidden /> Loading dashboard…</p>;
  }
  const t = stats.totals;
  const open = cases.filter(isOpen);
  const queues = [
    { label: "Overdue", count: open.filter((c) => c.overdue).length, hint: "Past the target time", href: "/admin/cases?status=overdue", icon: AlertTriangle },
    { label: "Urgent", count: open.filter((c) => c.severity === "urgent").length, hint: "Highest priority reports", href: "/admin/cases?severity=urgent", icon: Clock },
    { label: "New", count: open.filter((c) => c.status === "new").length, hint: "Reports awaiting review", href: "/admin/cases?status=new", icon: Inbox },
    { label: "Unassigned", count: open.filter((c) => !c.assignedTo).length, hint: "Reports that need a team", href: "/admin/cases?assignment=unassigned", icon: Users },
  ] as const;
  const attention = open
    .filter((c) => c.overdue || c.severity === "urgent" || c.status === "new" || !c.assignedTo)
    .sort((a, b) =>
      Number(b.overdue) - Number(a.overdue) ||
      Number(b.severity === "urgent") - Number(a.severity === "urgent") ||
      (a.dueAt ?? "9").localeCompare(b.dueAt ?? "9") ||
      b.createdAt.localeCompare(a.createdAt),
    )
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl text-white">Cleansing reports</h1>
          <p className="mt-1 text-sm text-slate-400">Review reports, assign teams, and track cleanups across Addis Ababa.</p>
        </div>
        <Link href="/admin/cases?status=" className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-hover">
          Browse all reports <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <section aria-labelledby="work-queue" className="space-y-3">
        <h2 id="work-queue" className="text-sm font-medium text-slate-200">Open reports across all dates</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {queues.map(({ label, count, hint, href, icon }) => (
            <Link key={href} href={href} className="rounded-xl transition hover:ring-1 hover:ring-brand-blue-text focus-visible:outline-2 focus-visible:outline-brand-blue-text">
              <KpiTile label={label} value={count} hint={hint} icon={icon} tone={label === "Overdue" && count > 0 ? "critical" : "default"} />
            </Link>
          ))}
        </div>
      </section>

      <Panel
        title="Needs attention"
        subtitle="Start with overdue and urgent reports, then review new or unassigned reports."
        action={<Link href="/admin/escalations" className="inline-flex items-center gap-1 text-xs text-brand-blue-text hover:underline">View deadlines <ArrowRight className="size-3" aria-hidden /></Link>}
      >
        {attention.length === 0 ? (
          <p className="text-sm text-slate-400">{cases.length ? "No open reports need immediate attention." : "Reports submitted through the website will appear here."}</p>
        ) : (
          <ul className="divide-y divide-line">
            {attention.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/cases/${c.id}`} className="flex items-start gap-3 py-3 transition-colors hover:bg-white/[0.02]">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-white">{c.reference}</span>
                      {c.overdue && <OverdueBadge />}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-300">{c.description}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{c.subcity ?? "Sub-city not set"} · {c.assignedTo ?? "Unassigned"} · {timeAgo(c.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <SeverityBadge severity={c.severity} source={c.severitySource} />
                    <StatusBadge status={c.status} />
                    {c.dueAt && <span className="text-xs text-slate-400">{dueIn(c.dueAt)}</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <section aria-labelledby="report-performance" className="space-y-3">
        <h2 id="report-performance" className="text-sm font-medium text-slate-200">Reports received in the last {stats.windowDays} days</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <KpiTile label="Received" value={t.received} icon={Inbox} />
          <KpiTile label="Resolved or closed" value={t.resolved} icon={CheckCircle2} hint={t.avgResolutionHours === null ? undefined : `Average time to resolve: ${hoursLabel(t.avgResolutionHours)}`} />
          <KpiTile label="Resolved on time" value={t.slaCompliance === null ? "—" : `${Math.round(t.slaCompliance * 100)}%`} icon={Timer} hint={t.slaCompliance === null ? "No completed reports with a deadline yet" : "Share of completed reports with a deadline"} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Reports per day">
          {t.received ? <DailyBars data={stats.perDay} /> : <p className="text-sm text-slate-400">No reports were received in this period.</p>}
        </Panel>
        <Panel title="Reports by priority" subtitle="Reports without a priority are excluded.">
          <SeverityBars data={stats.bySeverity} />
        </Panel>
      </div>

      <Panel title="Reports by sub-city" subtitle="Choose a sub-city to view its reports.">
        <SubcityBars data={stats.bySubcity} onSelect={(name) => router.push(`/admin/cases?status=&subcity=${encodeURIComponent(name)}`)} />
      </Panel>

      <AiSummary hasReports={t.received > 0} />
    </div>
  );
}
