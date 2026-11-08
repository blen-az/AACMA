/**
 * OpenAI (Responses + Embeddings REST APIs) — server-side only.
 * Kept as an alternative provider: set AI_PROVIDER=openai.
 */
import type { AiMessage, JsonSchema } from "./types";
import { AiError } from "./types";

const API = "https://api.openai.com/v1";

export const openaiConfig = {
  get apiKey() {
    return process.env.OPENAI_API_KEY ?? "";
  },
  get model() {
    return process.env.OPENAI_MODEL || "gpt-5-mini";
  },
  get embeddingModel() {
    return process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-large";
  },
  get reasoningEffort() {
    return process.env.OPENAI_REASONING_EFFORT || "low";
  },
  get maxOutputTokens() {
    return Number(process.env.AI_MAX_OUTPUT_TOKENS || 2048);
  },
};

async function post<T>(path: string, body: unknown, timeoutMs: number): Promise<T> {
  if (!openaiConfig.apiKey) throw new AiError("OPENAI_API_KEY is not set", 503);
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiConfig.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new AiError(`OpenAI ${path} ${res.status}: ${detail.slice(0, 300)}`, res.status === 429 ? 429 : 502);
  }
  return res.json() as Promise<T>;
}

type ResponsesOutput = {
  output?: { type: string; content?: { type: string; text?: string; refusal?: string }[] }[];
  usage?: { input_tokens: number; output_tokens: number };
  status?: string;
  incomplete_details?: { reason?: string } | null;
};

export async function openaiJson<T>(opts: {
  instructions: string;
  messages: AiMessage[];
  schema: JsonSchema;
  schemaName: string;
}): Promise<{ data: T; usage: { input?: number; output?: number } }> {
  const model = openaiConfig.model;
  const isReasoning = /^(gpt-5|o\d)/.test(model);
  const input = opts.messages.map((m) =>
    m.images?.length && m.role === "user"
      ? {
          role: m.role,
          content: [
            ...m.images.map((i) => ({ type: "input_image", image_url: `data:${i.mimeType};base64,${i.base64}` })),
            { type: "input_text", text: m.content },
          ],
        }
      : { role: m.role, content: m.content },
  );
  const json = await post<ResponsesOutput>(
    "/responses",
    {
      model,
      instructions: opts.instructions,
      input,
      max_output_tokens: openaiConfig.maxOutputTokens,
      store: false,
      ...(isReasoning ? { reasoning: { effort: openaiConfig.reasoningEffort } } : { temperature: 0.3 }),
      text: { format: { type: "json_schema", name: opts.schemaName, strict: true, schema: opts.schema } },
    },
    45_000,
  );
  const parts = (json.output ?? []).filter((o) => o.type === "message").flatMap((o) => o.content ?? []);
  const refusal = parts.find((p) => p.type === "refusal");
  if (refusal) throw new AiError(`Model refused: ${refusal.refusal}`, 502);
  const text = parts.find((p) => p.type === "output_text")?.text;
  if (!text) throw new AiError(`No output text (status ${json.status}, ${json.incomplete_details?.reason ?? "-"})`, 502);
  return { data: JSON.parse(text) as T, usage: { input: json.usage?.input_tokens, output: json.usage?.output_tokens } };
}

export async function openaiEmbed(texts: string[]): Promise<number[][]> {
  const json = await post<{ data: { embedding: number[]; index: number }[] }>(
    "/embeddings",
    { model: openaiConfig.embeddingModel, input: texts },
    20_000,
  );
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}
