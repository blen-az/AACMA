import { SUBCITY_NAMES } from "./geo";
import { isOpen, isOverdue, metSla } from "./sla";
import { SEVERITIES, STATUSES, type CaseRecord, type CaseStatus, type Severity } from "./types";

export type Stats = {
  generatedAt: string;
  windowDays: number;
  totals: {
    received: number;
    open: number;
    overdue: number;
    resolved: number;
    urgentOpen: number;
    avgResolutionHours: number | null;
    slaCompliance: number | null; // 0..1
  };
  perDay: { date: string; count: number }[];
  bySubcity: { name: string; total: number; open: number; overdue: number }[];
  bySeverity: { severity: Severity; total: number; open: number }[];
  byStatus: { status: CaseStatus; count: number }[];
};

export function computeStats(cases: CaseRecord[], days = 30, now = Date.now()): Stats {
  const perDay: Stats["perDay"] = [];
  for (let i = days - 1; i >= 0; i--) {
    perDay.push({ date: new Date(now - i * 86_400_000).toISOString().slice(0, 10), count: 0 });
  }
  // The window starts at the first charted day (UTC), so totals always match the daily bars.
  const since = Date.parse(`${perDay[0].date}T00:00:00Z`);
  const inWindow = cases.filter((c) => {
    const t = new Date(c.createdAt).getTime();
    return t >= since && t <= now;
  });

  const resolved = inWindow.filter((c) => c.resolvedAt);
  const hours = resolved.map((c) => (new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime()) / 3_600_000);
  const slaKnown = resolved.map(metSla).filter((x): x is boolean => x !== null);

  const dayIndex = new Map(perDay.map((p, i) => [p.date, i]));
  for (const c of inWindow) {
    const i = dayIndex.get(c.createdAt.slice(0, 10));
    if (i !== undefined) perDay[i].count++;
  }

  const bySubcity = [...SUBCITY_NAMES, "Unassigned"]
    .map((name) => {
      const xs = inWindow.filter((c) => (c.subcity ?? "Unassigned") === name);
      return { name, total: xs.length, open: xs.filter(isOpen).length, overdue: xs.filter((c) => isOverdue(c, now)).length };
    })
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total);

  return {
    generatedAt: new Date(now).toISOString(),
    windowDays: days,
    totals: {
      received: inWindow.length,
      open: inWindow.filter(isOpen).length,
      overdue: inWindow.filter((c) => isOverdue(c, now)).length,
      resolved: resolved.length,
      urgentOpen: inWindow.filter((c) => c.severity === "urgent" && isOpen(c)).length,
      avgResolutionHours: hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : null,
      slaCompliance: slaKnown.length ? slaKnown.filter(Boolean).length / slaKnown.length : null,
    },
    perDay,
    bySubcity,
    bySeverity: SEVERITIES.map((severity) => {
      const xs = inWindow.filter((c) => c.severity === severity);
      return { severity, total: xs.length, open: xs.filter(isOpen).length };
    }),
    byStatus: STATUSES.map((status) => ({ status, count: inWindow.filter((c) => c.status === status).length })),
  };
}
