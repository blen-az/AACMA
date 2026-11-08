import { isAdmin } from "@/lib/admin/auth";
import { computeStats } from "@/lib/cases/stats";
import { allCases } from "@/lib/cases/store";

export async function GET(request: Request) {
  if (!(await isAdmin(request))) return Response.json({ error: "unauthorized" }, { status: 401 });
  const days = Math.min(90, Math.max(1, Number(new URL(request.url).searchParams.get("days")) || 30));
  return Response.json(computeStats(await allCases(), days));
}
