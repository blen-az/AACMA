/**
 * Runs the AI preliminary assessment for a just-submitted case. Called once by the
 * citizen's browser with the one-time token returned at creation.
 */
import { runAssessment } from "@/lib/ai/assess";
import { aiConfigured } from "@/lib/ai/provider";
import { consumeToken, getPhoto, saveAssessment } from "@/lib/cases/store";

export async function POST(request: Request, ctx: RouteContext<"/api/cases/[id]/assess">) {
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const c = await consumeToken(id, body?.token);
  if (!c) return Response.json({ error: "not_found" }, { status: 404 });
  const photo = c.hasPhoto ? await getPhoto(id) : undefined;
  if (!photo) return Response.json({ error: "no_photo" }, { status: 400 });
  if (!aiConfigured()) {
    await saveAssessment(id, null);
    return Response.json({ error: "ai_unavailable" }, { status: 503 });
  }
  try {
    const result = await runAssessment({
      image: photo,
      description: c.description,
      location: c.location.text ?? `GPS ${c.location.lat?.toFixed(4)}, ${c.location.lng?.toFixed(4)} (Addis Ababa)`,
      lang: c.lang,
    });
    await saveAssessment(id, result);
    return Response.json(result);
  } catch (err) {
    console.error(JSON.stringify({ event: "case_assess_error", id, message: String(err).slice(0, 200) }));
    await saveAssessment(id, null);
    return Response.json({ error: "ai_error" }, { status: 502 });
  }
}
