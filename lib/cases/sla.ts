import type { CaseRecord, Severity } from "./types";

/** Demonstration SLA targets (hours to resolve). AACMA defines the real ones. */
export const SLA_HOURS: Record<Severity, number> = { urgent: 4, high: 24, medium: 48, low: 72 };

export function dueFrom(createdAt: string, severity: Severity | null): string | null {
  if (!severity) return null;
  return new Date(new Date(createdAt).getTime() + SLA_HOURS[severity] * 3_600_000).toISOString();
}

export function isOpen(c: Pick<CaseRecord, "status">): boolean {
  return c.status !== "resolved" && c.status !== "closed";
}

export function isOverdue(c: Pick<CaseRecord, "status" | "dueAt">, now = Date.now()): boolean {
  return isOpen(c) && c.dueAt !== null && new Date(c.dueAt).getTime() < now;
}

/** Resolved within the SLA target? null when not resolved or no target. */
export function metSla(c: Pick<CaseRecord, "resolvedAt" | "dueAt">): boolean | null {
  if (!c.resolvedAt || !c.dueAt) return null;
  return new Date(c.resolvedAt).getTime() <= new Date(c.dueAt).getTime();
}
