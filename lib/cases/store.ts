/**
 * Case store for the dashboard. Server-side only.
 *
 * Website reports are persisted in Firebase Realtime Database when configured,
 * otherwise in .data/cases.json.
 */
import { randomBytes, randomUUID } from "node:crypto";
import type { AssessResult } from "../ai/vision";
import { cloudinaryConfigured, fetchPhoto, uploadPhoto } from "./cloudinary";
import { repo, type Photo } from "./repo";
import { dueFrom, isOverdue } from "./sla";
import type { CaseDetail, CaseRecord, CaseStatus, CaseSummary, Severity } from "./types";

export async function storeKind(): Promise<"firebase" | "file"> {
  return (await repo()).kind;
}

export async function allCases(): Promise<CaseRecord[]> {
  const live = await (await repo()).list();
  return live.filter((c) => c.source === "web").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getCase(id: string): Promise<CaseRecord | undefined> {
  const found = await (await repo()).get(id);
  return found?.source === "web" ? found : undefined;
}

/** Photo bytes (for the AI): from Cloudinary when the case has a URL, else from the store. */
export async function getPhoto(id: string): Promise<Photo | undefined> {
  const c = await getCase(id);
  if (c?.photoUrl) return fetchPhoto(c.photoUrl);
  return (await repo()).getPhoto(id);
}

export function toSummary(c: CaseRecord, now = Date.now()): CaseSummary {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { token, history, assessment, ...rest } = c;
  return { ...rest, overdue: isOverdue(c, now) };
}

export function toDetail(c: CaseRecord, now = Date.now()): CaseDetail {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { token, ...rest } = c;
  return { ...rest, overdue: isOverdue(c, now) };
}

async function persist(c: CaseRecord) {
  if (c.source === "web") await (await repo()).put(c);
}

export type NewCase = Pick<
  CaseRecord,
  "lang" | "description" | "reporterName" | "reporterPhone" | "location" | "subcity" | "subcityApprox"
> & { photo: Photo | null };

export async function createLiveCase(input: NewCase): Promise<CaseRecord> {
  const r = await repo();
  const n = await r.nextNumber();
  const createdAt = new Date().toISOString();
  const { photo, ...fields } = input;
  const c: CaseRecord = {
    ...fields,
    id: randomUUID().slice(0, 8),
    reference: `DEMO-AACMA-${String(n).padStart(3, "0")}`,
    source: "web",
    createdAt,
    status: "new",
    severity: null,
    severitySource: null,
    assessment: null,
    assessmentStatus: photo ? "pending" : "none",
    hasPhoto: Boolean(photo),
    assignedTo: null,
    dueAt: dueFrom(createdAt, "medium"), // provisional until assessed
    firstActionAt: null,
    resolvedAt: null,
    history: [{ at: createdAt, actor: "Citizen", action: "Report received via AI assistant" }],
    token: randomBytes(16).toString("hex"),
  };
  if (photo) {
    let stored = false;
    if (cloudinaryConfigured()) {
      try {
        c.photoUrl = (await uploadPhoto(photo)).url;
        stored = true;
      } catch (err) {
        console.error(JSON.stringify({ event: "cloudinary_upload_failed", message: String(err).slice(0, 200) }));
      }
    }
    if (!stored) await r.putPhoto(c.id, photo); // fallback: keep it in the case store
  }
  await r.put(c);
  return c;
}

/** One-time token check for the citizen's own assessment request. Consumes the token. */
export async function consumeToken(id: string, token: string | undefined): Promise<CaseRecord | undefined> {
  const c = await getCase(id);
  if (!c || !c.token || !token || c.token !== token) return undefined;
  c.token = undefined;
  await persist(c);
  return c;
}

function log(c: CaseRecord, actor: string, action: string, note?: string) {
  c.history.push({ at: new Date().toISOString(), actor, action, ...(note ? { note } : {}) });
}

export async function saveAssessment(id: string, result: AssessResult | null, actor = "AI"): Promise<CaseRecord | undefined> {
  const c = await getCase(id);
  if (!c) return;
  if (!result) {
    c.assessmentStatus = "error";
    log(c, actor, "AI assessment failed");
  } else {
    c.assessment = result;
    c.assessmentStatus = "done";
    if (c.severitySource !== "staff") {
      c.severity = result.severity;
      c.severitySource = "ai";
      c.dueAt = dueFrom(c.createdAt, result.severity);
    }
    log(c, actor, `Preliminary assessment: ${result.severity}`, result.recommended_action);
  }
  await persist(c);
  return c;
}

export type CasePatch = {
  status?: CaseStatus;
  severity?: Severity;
  assignedTo?: string | null;
  subcity?: string | null;
  note?: string;
};

export async function updateCase(id: string, patch: CasePatch, actor = "Admin"): Promise<CaseRecord | undefined> {
  const c = await getCase(id);
  if (!c) return;
  const now = new Date().toISOString();
  if (patch.assignedTo !== undefined && patch.assignedTo !== c.assignedTo) {
    c.assignedTo = patch.assignedTo;
    if (patch.assignedTo && c.status === "new" && !patch.status) c.status = "assigned";
    c.firstActionAt ??= now;
    log(c, actor, patch.assignedTo ? `Assigned to ${patch.assignedTo}` : "Unassigned");
  }
  if (patch.subcity !== undefined && patch.subcity !== c.subcity) {
    c.subcity = patch.subcity;
    c.subcityApprox = false;
    log(c, actor, `Sub-city set to ${patch.subcity ?? "—"}`);
  }
  if (patch.severity && patch.severity !== c.severity) {
    c.severity = patch.severity;
    c.severitySource = "staff";
    c.dueAt = dueFrom(c.createdAt, patch.severity);
    log(c, actor, `Priority set to ${patch.severity}`);
  }
  if (patch.status && patch.status !== c.status) {
    c.status = patch.status;
    if (patch.status !== "new") c.firstActionAt ??= now;
    if (patch.status === "resolved" || patch.status === "closed") c.resolvedAt ??= now;
    else c.resolvedAt = null;
    log(c, actor, `Status changed to ${patch.status.replace("_", " ")}`);
  }
  if (patch.note?.trim()) log(c, actor, "Note", patch.note.trim().slice(0, 1000));
  await persist(c);
  return c;
}
