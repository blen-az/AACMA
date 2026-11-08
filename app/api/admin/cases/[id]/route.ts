import { isAdmin } from "@/lib/admin/auth";
import { SUBCITY_NAMES, TEAMS } from "@/lib/cases/geo";
import { getCase, toDetail, updateCase, type CasePatch } from "@/lib/cases/store";
import { SEVERITIES, STATUSES, type CaseStatus, type Severity } from "@/lib/cases/types";

export async function GET(request: Request, ctx: RouteContext<"/api/admin/cases/[id]">) {
  if (!(await isAdmin(request))) return Response.json({ error: "unauthorized" }, { status: 401 });
  const c = await getCase((await ctx.params).id);
  if (!c) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(toDetail(c));
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/cases/[id]">) {
  if (!(await isAdmin(request))) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return Response.json({ error: "bad_request" }, { status: 400 });

  const patch: CasePatch = {};
  if (typeof b.status === "string" && STATUSES.includes(b.status as CaseStatus)) patch.status = b.status as CaseStatus;
  if (typeof b.severity === "string" && SEVERITIES.includes(b.severity as Severity)) patch.severity = b.severity as Severity;
  if (b.assignedTo === null || (typeof b.assignedTo === "string" && TEAMS.includes(b.assignedTo))) patch.assignedTo = b.assignedTo as string | null;
  if (b.subcity === null || (typeof b.subcity === "string" && SUBCITY_NAMES.includes(b.subcity))) patch.subcity = b.subcity as string | null;
  if (typeof b.note === "string") patch.note = b.note;

  const c = await updateCase(id, patch);
  if (!c) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(toDetail(c));
}
