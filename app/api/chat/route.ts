/**
 * Text conversation: classify the citizen's message and answer questions from
 * retrieved AACMA sources (plan §3.2). No complaint data is stored anywhere.
 */
import { checkLimit, clientIp } from "@/lib/ai/limits";
import { buildInstructions, TURN_SCHEMA, type TurnResult, type TurnStep } from "@/lib/ai/prompt";
import { aiConfigured, generateJson, provider } from "@/lib/ai/provider";
import { AiError } from "@/lib/ai/types";
import { hasKnowledge, search } from "@/lib/rag/search";
import type { Chunk } from "@/lib/rag/types";

const STEPS: TurnStep[] = [
  "idle", "photo", "location_ask", "location_gps", "location_confirm", "location_manual",
  "description", "name", "phone", "review", "edit_menu", "confirmed",
];
const MAX_MESSAGES = 12;
const MAX_CHARS = 2000;

type Body = {
  messages: { role: "user" | "assistant"; content: string }[];
  step: TurnStep;
  filled: Record<string, boolean>;
  lang: "en" | "am";
};

function parseBody(raw: unknown): Body | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Partial<Body>;
  if (!Array.isArray(b.messages) || b.messages.length === 0) return null;
  const messages = b.messages
    .slice(-MAX_MESSAGES)
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") return null;
  const step = STEPS.includes(b.step as TurnStep) ? (b.step as TurnStep) : "idle";
  const lang = b.lang === "am" ? "am" : "en";
  const filled: Record<string, boolean> = {};
  for (const k of ["photo", "location", "description", "name", "phone"]) filled[k] = Boolean(b.filled?.[k]);
  return { messages, step, filled, lang };
}

export async function POST(request: Request) {
  const started = Date.now();
  if (!aiConfigured()) return Response.json({ error: "ai_unavailable" }, { status: 503 });

  const limit = checkLimit(clientIp(request));
  if (limit) return Response.json({ error: "rate_limited", scope: limit }, { status: 429 });

  const body = parseBody(await request.json().catch(() => null));
  if (!body) return Response.json({ error: "bad_request" }, { status: 400 });

  try {
    const query = body.messages.filter((m) => m.role === "user").slice(-2).map((m) => m.content).join("\n");
    const excerpts: Chunk[] = await search(query);

    const { data, usage } = await generateJson<TurnResult>({
      instructions: buildInstructions({
        lang: body.lang,
        step: body.step,
        filled: body.filled,
        excerpts,
        knowledgeLoaded: hasKnowledge(),
      }),
      messages: body.messages,
      schemaName: "assistant_turn",
      schema: TURN_SCHEMA,
    });

    const seen = new Set<string>();
    const sources = (data.used_sources ?? [])
      .map((id) => excerpts[Number(String(id).replace(/\D/g, "")) - 1])
      .filter((c): c is Chunk => Boolean(c))
      .filter((c) => {
        const key = `${c.sourceId}#${c.page ?? ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((c) => ({ id: c.sourceId, title: c.title, page: c.page, url: c.url }));

    // Operational log only: no message content, names or phone numbers (§6.2).
    console.log(
      JSON.stringify({
        event: "chat", provider: provider(), action: data.action, step: body.step, lang: body.lang,
        excerpts: excerpts.length, ms: Date.now() - started, in: usage.input, out: usage.output,
      }),
    );

    return Response.json({
      action: data.action,
      field: data.field,
      reply: data.reply,
      sources: data.action === "answer" || data.action === "unclear" ? sources : [],
    });
  } catch (err) {
    const status = err instanceof AiError ? err.status : 500;
    console.error(JSON.stringify({ event: "chat_error", status, message: String(err).slice(0, 300) }));
    return Response.json({ error: status === 429 ? "rate_limited" : "ai_error" }, { status: status === 429 ? 429 : 502 });
  }
}
