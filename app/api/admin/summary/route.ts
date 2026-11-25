/** AI-written management summary for the director, from aggregate figures only (no personal data). */
import { isAdmin } from "@/lib/admin/auth";
import { aiConfigured, generateJson } from "@/lib/ai/provider";
import { computeStats } from "@/lib/cases/stats";
import { allCases } from "@/lib/cases/store";

type Summary = { headline: string; insights: string[]; actions: string[] };

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "insights", "actions"],
  properties: {
    headline: { type: "string" },
    insights: { type: "array", items: { type: "string" } },
    actions: { type: "array", items: { type: "string" } },
  },
};

export async function POST(request: Request) {
  if (!(await isAdmin(request))) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!aiConfigured()) return Response.json({ error: "ai_unavailable" }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { lang?: string };
  const lang = body.lang === "am" ? "am" : "en";
  const stats = computeStats(await allCases(), 30);
  try {
    const { data } = await generateJson<Summary>({
      instructions: `You write a short management summary for the director of AACMA (Addis Ababa city cleansing agency) from complaint statistics.
Write in ${lang === "am" ? "Amharic (አማርኛ)" : "English"}. Be concrete and use the numbers given; do not invent any figure.
headline: one sentence on the overall situation.
insights: 3–5 bullets (sub-cities with most open or overdue cases, priority mix, SLA compliance, resolution time, trend over the period).
actions: 2–4 practical recommendations for the coming week.
The figures cover reports submitted through the website.
Hours: convert to days when over 48.`,
      messages: [{ role: "user", content: JSON.stringify({ ...stats, perDay: stats.perDay.map((d) => d.count) }) }],
      schema: SCHEMA,
      schemaName: "management_summary",
    });
    return Response.json({ ...data, lang, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error(JSON.stringify({ event: "summary_error", message: String(err).slice(0, 200) }));
    return Response.json({ error: "ai_error" }, { status: 502 });
  }
}
