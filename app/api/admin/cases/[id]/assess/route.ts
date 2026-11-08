/** Staff re-runs the AI assessment on a case's photo. */
import { isAdmin } from "@/lib/admin/auth";
import { runAssessment } from "@/lib/ai/assess";
import { aiConfigured } from "@/lib/ai/provider";
import { getCase, getPhoto, saveAssessment, toDetail } from "@/lib/cases/store";

export async function POST(request: Request, ctx: RouteContext<"/api/admin/cases/[id]/assess">) {
  if (!(await isAdmin(request))) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const c = await getCase(id);
  if (!c) return Response.json({ error: "not_found" }, { status: 404 });
  const photo = c.hasPhoto ? await getPhoto(id) : undefined;
  if (!photo) return Response.json({ error: "no_photo" }, { status: 400 });
  if (!aiConfigured()) return Response.json({ error: "ai_unavailable" }, { status: 503 });
  try {
    const result = await runAssessment({
      image: photo,
      description: c.description,
      location: c.location.text ?? `GPS ${c.location.lat?.toFixed(4)}, ${c.location.lng?.toFixed(4)}`,
      lang: "en",
    });
    const updated = await saveAssessment(id, result, "AI (re-run by admin)");
    return Response.json(toDetail(updated ?? c));
  } catch {
    return Response.json({ error: "ai_error" }, { status: 502 });
  }
}
