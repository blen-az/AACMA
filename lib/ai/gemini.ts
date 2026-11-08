/**
 * Google Gemini (AI Studio / Generative Language API) — server-side only.
 * Text + image input, JSON output via responseSchema, and embeddings.
 */
import type { AiMessage, JsonSchema } from "./types";
import { AiError } from "./types";

const API = "https://generativelanguage.googleapis.com/v1beta";

export const geminiConfig = {
  get apiKey() {
    return process.env.GEMINI_API_KEY ?? "";
  },
  get model() {
    return process.env.GEMINI_MODEL || "gemini-3.5-flash";
  },
  /** Tried in order when the primary model is overloaded, rate-limited or times out. */
  get fallbackModels(): string[] {
    const v = process.env.GEMINI_FALLBACK_MODELS ?? "gemini-3.8-flash,gemini-flash-lite-latest";
    return v.split(",").map((m) => m.trim()).filter(Boolean);
  },
  get embeddingModel() {
    return process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
  },
  get embeddingDims() {
    return Number(process.env.GEMINI_EMBEDDING_DIMS || 768);
  },
  /** Optional thinking budget for 2.5 models (0 = off on Flash). Unset = model default. */
  get thinkingBudget(): number | null {
    const v = process.env.GEMINI_THINKING_BUDGET;
    return v === undefined || v === "" ? null : Number(v);
  },
  get maxOutputTokens() {
    return Number(process.env.AI_MAX_OUTPUT_TOKENS || 2048);
  },
};

/** Errors worth retrying on another model: overloaded, rate-limited, or timed out. */
class RetryableError extends AiError {}

async function call<T>(path: string, body: unknown, timeoutMs: number): Promise<T> {
  if (!geminiConfig.apiKey) throw new AiError("GEMINI_API_KEY is not set", 503);
  let res: Response;
  try {
    res = await fetch(`${API}/${path}`, {
      method: "POST",
      headers: { "x-goog-api-key": geminiConfig.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new RetryableError(`Gemini ${path} network/timeout: ${String(err).slice(0, 120)}`, 502);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const message = `Gemini ${path.split(":")[1] ?? path} ${res.status}: ${detail.slice(0, 300)}`;
    if (res.status === 429 || res.status >= 500) throw new RetryableError(message, res.status === 429 ? 429 : 502);
    throw new AiError(message, 502);
  }
  return res.json() as Promise<T>;
}

/** Converts the JSON-Schema subset used in this app to Gemini's OpenAPI-style schema. */
export function toGeminiSchema(s: JsonSchema): JsonSchema {
  if (Array.isArray(s.anyOf)) {
    const nonNull = (s.anyOf as JsonSchema[]).filter((x) => x.type !== "null");
    const nullable = nonNull.length < (s.anyOf as JsonSchema[]).length;
    return { ...toGeminiSchema(nonNull[0]), ...(nullable ? { nullable: true } : {}) };
  }
  const out: JsonSchema = { type: String(s.type).toUpperCase() };
  if (s.enum) out.enum = s.enum;
  if (s.description) out.description = s.description;
  if (s.properties) {
    const props = s.properties as Record<string, JsonSchema>;
    out.properties = Object.fromEntries(Object.entries(props).map(([k, v]) => [k, toGeminiSchema(v)]));
    out.propertyOrdering = Object.keys(props);
    if (s.required) out.required = s.required;
  }
  if (s.items) out.items = toGeminiSchema(s.items as JsonSchema);
  return out;
}

type GenerateResponse = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
};

/** Gemini wants user/model turns, starting with the user, without consecutive duplicates. */
function toContents(messages: AiMessage[]) {
  const contents: { role: "user" | "model"; parts: Record<string, unknown>[] }[] = [];
  for (const m of messages) {
    const role = m.role === "assistant" ? "model" : "user";
    if (contents.length === 0 && role === "model") continue;
    const parts: Record<string, unknown>[] = [];
    for (const img of m.images ?? []) parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
    if (m.content) parts.push({ text: m.content });
    const prev = contents[contents.length - 1];
    if (prev && prev.role === role) prev.parts.push(...parts);
    else contents.push({ role, parts });
  }
  return contents;
}

export async function geminiJson<T>(opts: {
  instructions: string;
  messages: AiMessage[];
  schema: JsonSchema;
}): Promise<{ data: T; usage: { input?: number; output?: number }; model: string }> {
  const thinking = geminiConfig.thinkingBudget;
  const body = {
    systemInstruction: { parts: [{ text: opts.instructions }] },
    contents: toContents(opts.messages),
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: toGeminiSchema(opts.schema),
      maxOutputTokens: geminiConfig.maxOutputTokens,
      temperature: 0.3,
      ...(thinking !== null ? { thinkingConfig: { thinkingBudget: thinking } } : {}),
    },
  };

  // Free-tier models are sometimes overloaded: fall through to the next model quickly.
  const models = [geminiConfig.model, ...geminiConfig.fallbackModels.filter((m) => m !== geminiConfig.model)];
  let json: GenerateResponse | null = null;
  let model = models[0];
  let lastError: unknown;
  for (const [i, m] of models.entries()) {
    try {
      json = await call<GenerateResponse>(`models/${m}:generateContent`, body, i < models.length - 1 ? 25_000 : 45_000);
      model = m;
      break;
    } catch (err) {
      lastError = err;
      if (!(err instanceof RetryableError)) throw err;
      console.warn(JSON.stringify({ event: "gemini_fallback", from: m, status: err.status }));
    }
  }
  if (!json) throw lastError instanceof AiError ? lastError : new AiError(String(lastError), 502);
  return { ...parseJson<T>(json), model };
}

function parseJson<T>(json: GenerateResponse): { data: T; usage: { input?: number; output?: number } } {
  if (json.promptFeedback?.blockReason) throw new AiError(`Gemini blocked: ${json.promptFeedback.blockReason}`, 502);
  const cand = json.candidates?.[0];
  const text = cand?.content?.parts?.filter((p) => !p.thought && p.text).map((p) => p.text).join("");
  if (!text) throw new AiError(`Gemini returned no text (${cand?.finishReason ?? "no candidate"})`, 502);
  try {
    return {
      data: JSON.parse(text) as T,
      usage: { input: json.usageMetadata?.promptTokenCount, output: json.usageMetadata?.candidatesTokenCount },
    };
  } catch {
    throw new AiError(`Gemini returned invalid JSON (${cand?.finishReason})`, 502);
  }
}

export async function geminiEmbed(texts: string[], kind: "document" | "query"): Promise<number[][]> {
  const model = `models/${geminiConfig.embeddingModel}`;
  const json = await call<{ embeddings: { values: number[] }[] }>(
    `${model}:batchEmbedContents`,
    {
      requests: texts.map((text) => ({
        model,
        content: { parts: [{ text }] },
        taskType: kind === "query" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT",
        outputDimensionality: geminiConfig.embeddingDims,
      })),
    },
    30_000,
  );
  return json.embeddings.map((e) => e.values);
}
