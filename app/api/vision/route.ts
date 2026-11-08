/**
 * Photo analysis endpoint. The image is sent to the AI provider for this one
 * request and is not stored. Name and phone are never sent.
 */
import { checkLimit, clientIp } from "@/lib/ai/limits";
import { aiConfigured, generateJson, provider } from "@/lib/ai/provider";
import { AiError } from "@/lib/ai/types";
import { runAssessment } from "@/lib/ai/assess";
import { IDENTIFY_SCHEMA, identifyInstructions, type IdentifyResult } from "@/lib/ai/vision";
import { search } from "@/lib/rag/search";

const MAX_IMAGE_B64 = 6_000_000; // ~4.5 MB binary; the client sends ≤1600px JPEG
const MIME = ["image/jpeg", "image/png", "image/webp"];

type Body = {
  mode: "identify" | "assess";
  lang: "en" | "am";
  image: { mimeType: string; base64: string };
  question?: string;
  description?: string;
  location?: string;
};

export async function POST(request: Request) {
  const started = Date.now();
  if (!aiConfigured()) return Response.json({ error: "ai_unavailable" }, { status: 503 });
  const limit = checkLimit(clientIp(request));
  if (limit) return Response.json({ error: "rate_limited", scope: limit }, { status: 429 });

  const b = (await request.json().catch(() => null)) as Partial<Body> | null;
  const image = b?.image;
  if (
    !b ||
    (b.mode !== "identify" && b.mode !== "assess") ||
    !image ||
    !MIME.includes(image.mimeType) ||
    typeof image.base64 !== "string" ||
    image.base64.length > MAX_IMAGE_B64
  ) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const lang = b.lang === "am" ? "am" : "en";
  const clip = (s: unknown, n: number) => (typeof s === "string" ? s.slice(0, n) : "");

  try {
    if (b.mode === "identify") {
      const question = clip(b.question, 500);
      const excerpts = await search(`waste sorting separation recycling ${question}`);
      const { data, usage } = await generateJson<IdentifyResult>({
        instructions: identifyInstructions(lang, excerpts),
        messages: [{ role: "user", content: question || "What kind of waste is this and how should I separate it?", images: [image] }],
        schema: IDENTIFY_SCHEMA,
        schemaName: "waste_identification",
      });
      const sources = (data.used_sources ?? [])
        .map((id) => excerpts[Number(String(id).replace(/\D/g, "")) - 1])
        .filter(Boolean)
        .map((c) => ({ id: c.sourceId, title: c.title, page: c.page, url: c.url }));
      console.log(JSON.stringify({ event: "vision", mode: "identify", provider: provider(), ms: Date.now() - started, in: usage.input, out: usage.output }));
      return Response.json({ ...data, sources });
    }

    const data = await runAssessment({ image, description: clip(b.description, 1500), location: clip(b.location, 300), lang });
    console.log(JSON.stringify({ event: "vision", mode: "assess", provider: provider(), severity: data.severity, ms: Date.now() - started }));
    return Response.json(data);
  } catch (err) {
    const status = err instanceof AiError ? err.status : 500;
    console.error(JSON.stringify({ event: "vision_error", status, message: String(err).slice(0, 300) }));
    return Response.json({ error: status === 429 ? "rate_limited" : "ai_error" }, { status: status === 429 ? 429 : 502 });
  }
}
