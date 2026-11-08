/**
 * Chooses the AI provider from AI_PROVIDER (default: gemini). Server-side only;
 * API keys never reach the browser.
 */
import { geminiConfig, geminiEmbed, geminiJson } from "./gemini";
import { openaiConfig, openaiEmbed, openaiJson } from "./openai";
import type { AiMessage, JsonSchema } from "./types";

export type Provider = "gemini" | "openai";

export function provider(): Provider {
  return process.env.AI_PROVIDER === "openai" ? "openai" : "gemini";
}

export function aiConfigured(): boolean {
  return provider() === "openai" ? Boolean(openaiConfig.apiKey) : Boolean(geminiConfig.apiKey);
}

export function modelName(): string {
  return provider() === "openai" ? openaiConfig.model : geminiConfig.model;
}

/** Identifies the embedding space, so an index built with another model is not mixed in. */
export function embeddingModelId(): string {
  return provider() === "openai"
    ? `openai:${openaiConfig.embeddingModel}`
    : `gemini:${geminiConfig.embeddingModel}@${geminiConfig.embeddingDims}`;
}

export function generateJson<T>(opts: {
  instructions: string;
  messages: AiMessage[];
  schema: JsonSchema;
  schemaName: string;
}) {
  return provider() === "openai" ? openaiJson<T>(opts) : geminiJson<T>(opts);
}

export function embedTexts(texts: string[], kind: "document" | "query"): Promise<number[][]> {
  return provider() === "openai" ? openaiEmbed(texts) : geminiEmbed(texts, kind);
}
