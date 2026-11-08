import { isAdmin } from "@/lib/admin/auth";
import { allCases, resetLiveCases, storeKind, toSummary } from "@/lib/cases/store";

export async function GET(request: Request) {
  if (!(await isAdmin(request))) return Response.json({ error: "unauthorized" }, { status: 401 });
  const now = Date.now();
  const cases = await allCases();
  return Response.json({ cases: cases.map((c) => toSummary(c, now)), now: new Date(now).toISOString(), store: await storeKind() });
}

/** Rehearsal helper: clears website reports and regenerates sample data. */
export async function DELETE(request: Request) {
  if (!(await isAdmin(request))) return Response.json({ error: "unauthorized" }, { status: 401 });
  await resetLiveCases();
  return Response.json({ ok: true });
}
