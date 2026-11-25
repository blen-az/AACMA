"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Inbox, Loader2, Sparkles, Timer } from "lucide-react";
import { DailyBars, SeverityBars, SubcityBars } from "@/components/admin/charts";
import { adminFetch, useAdminData } from "@/components/admin/data";
import { KpiTile, OverdueBadge, Panel, SeverityBadge, SourceBadge, StatusBadge, hoursLabel, timeAgo } from "@/components/admin/ui";

type Summary = { headline: string; insights: string[]; actions: string[]; lang: string; generatedAt: string };

function AiSummary() {
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
      title="AI management summary"
      subtitle="Written by AI from the last 30 days of figures — no personal data is used."
      action={
        <div className="flex gap-2">
          {(["en", "am"] as const).map((l) => (
            <button
              key={l}
              type="button"
              disabled={busy}
              onClick={() => void generate(l)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-blue-text/50 px-3 py-1.5 text-xs text-brand-blue-text transition-colors hover:bg-brand-blue-text/10 disabled:opacity-50"
            >
              <Sparkles className="size-3.5" aria-hidden /> {l === "en" ? "Generate" : "በአማርኛ"}
            </button>
          ))}
        </div>
      }
    >
      {busy && (
        <p className="flex items-center gap-2 text-sm text-slate-300"><Loader2 className="size-4 animate-spin" aria-hidden /> Analysing the figures…</p>
      )}
      {!busy && error && <p className="text-sm text-red-300">The AI summary is not available right now. Try again in a moment.</p>}
      {!busy && !summary && !error && <p className="text-sm text-slate-400">Generate a short briefing on the current situation and recommended actions for this week.</p>}
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
  const { stats, cases } = useAdminData();
  const router = useRouter();

  if (!stats || !cases) {
    return <p className="flex items-center gap-2 text-slate-400"><Loader2 className="size-4 animate-spin" aria-hidden /> Loading dashboard…</p>;
  }
  const t = stats.totals;
  const attention = cases
    .filter((c) => c.status !== "resolved" && c.status !== "closed" && (c.severity === "urgent" || c.overdue || c.source === "web"))
    .sort((a, b) => Number(b.source === "web") - Number(a.source === "web") || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-white">Overview</h1>
        <p className="mt-1 text-sm text-slate-400">Cleansing reports across Addis Ababa · last {stats.windowDays} days</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Reports received" value={t.received} icon={Inbox} />
        <KpiTile label="Open cases" value={t.open} hint={`${t.urgentOpen} urgent`} icon={Clock} />
        <KpiTile label="Overdue" value={t.overdue} hint="Past the target time" icon={AlertTriangle} tone={t.overdue ? "critical" : "default"} />
        <KpiTile
          label="Resolved on time"
          value={t.slaCompliance === null ? "—" : `${Math.round(t.slaCompliance * 100)}%`}
          hint={<span className="inline-flex items-center gap-1"><Timer className="size-3" aria-hidden /> avg. {hoursLabel(t.avgResolutionHours)} to resolve</span>}
          icon={CheckCircle2}
          tone="good"
        />
      </div>

      <AiSummary />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Reports per day" subtitle="All sources, last 30 days">
          <DailyBars data={stats.perDay} />
        </Panel>
        <Panel title="By priority" subtitle="AI preliminary assessment, adjusted by staff">
          <SeverityBars data={stats.bySeverity} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Panel title="By sub-city" subtitle="Click a sub-city to see its cases">
          <SubcityBars data={stats.bySubcity} onSelect={(name) => router.push(`/admin/cases?subcity=${encodeURIComponent(name)}`)} />
        </Panel>
        <Panel
          title="Needs attention"
          subtitle="New website reports, urgent and overdue cases"
          action={<Link href="/admin/escalations" className="inline-flex items-center gap-1 text-xs text-brand-blue-text hover:underline">Escalations <ArrowRight className="size-3" aria-hidden /></Link>}
        >
          {attention.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing needs attention right now.</p>
          ) : (
            <ul className="divide-y divide-line">
              {attention.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/cases/${c.id}`} className="flex items-start gap-3 py-3 transition-colors hover:bg-white/[0.02]">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm text-white">{c.reference}</span>
                        <SourceBadge source={c.source} />
                        {c.overdue && <OverdueBadge />}
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-300">{c.description}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{c.subcity ?? "Sub-city not set"} · {timeAgo(c.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <SeverityBadge severity={c.severity} source={c.severitySource} />
                      <StatusBadge status={c.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
