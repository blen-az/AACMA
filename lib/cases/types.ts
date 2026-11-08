import type { AssessResult } from "../ai/vision";

export type CaseStatus = "new" | "assigned" | "in_progress" | "resolved" | "closed";
export type Severity = "low" | "medium" | "high" | "urgent";

export const STATUSES: CaseStatus[] = ["new", "assigned", "in_progress", "resolved", "closed"];
export const SEVERITIES: Severity[] = ["urgent", "high", "medium", "low"];

export const STATUS_LABEL: Record<CaseStatus, string> = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export type CaseLocation = {
  mode: "gps" | "manual";
  text?: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
};

export type HistoryEntry = { at: string; actor: string; action: string; note?: string };

export type CaseRecord = {
  id: string;
  reference: string;
  source: "web" | "sample";
  createdAt: string;
  status: CaseStatus;
  severity: Severity | null;
  severitySource: "ai" | "staff" | null;
  assessment: AssessResult | null;
  assessmentStatus: "none" | "pending" | "done" | "error";
  subcity: string | null;
  subcityApprox: boolean;
  location: CaseLocation;
  description: string;
  reporterName: string;
  reporterPhone: string;
  lang: "en" | "am";
  /** The photo itself is stored separately (repo.getPhoto). */
  hasPhoto: boolean;
  /** Cloudinary URL when photos are stored there (otherwise the photo is in the case store). */
  photoUrl?: string | null;
  assignedTo: string | null;
  dueAt: string | null;
  firstActionAt: string | null;
  resolvedAt: string | null;
  history: HistoryEntry[];
  /** Lets the citizen's browser request the assessment for its own new case. Never sent to the dashboard. */
  token?: string;
};

/** What the dashboard list receives: no token, no history or assessment. */
export type CaseSummary = Omit<CaseRecord, "token" | "history" | "assessment"> & { overdue: boolean };

export type CaseDetail = Omit<CaseRecord, "token"> & { overdue: boolean };
