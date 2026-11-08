export type JsonSchema = Record<string, unknown>;

export type AiImage = { mimeType: string; base64: string };

export type AiMessage = { role: "user" | "assistant"; content: string; images?: AiImage[] };

export class AiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
