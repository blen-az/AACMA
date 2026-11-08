/**
 * Verifies the AI provider key and model:  npm run ai:check
 * Lists available Gemini models (so you can pick GEMINI_MODEL) and runs one tiny JSON request.
 */
import { geminiConfig } from "../lib/ai/gemini";
import { embedTexts, generateJson, modelName, provider } from "../lib/ai/provider";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local
}

async function main() {
  console.log(`Provider: ${provider()}  Model: ${modelName()}`);
  if (provider() === "gemini") {
    if (!geminiConfig.apiKey) throw new Error("GEMINI_API_KEY is not set in .env.local");
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
      headers: { "x-goog-api-key": geminiConfig.apiKey },
    });
    if (!res.ok) throw new Error(`List models failed: ${res.status} ${await res.text()}`);
    const { models } = (await res.json()) as { models: { name: string; supportedGenerationMethods?: string[] }[] };
    const gen = models.filter((m) => m.supportedGenerationMethods?.includes("generateContent")).map((m) => m.name.replace("models/", ""));
    const emb = models.filter((m) => m.supportedGenerationMethods?.some((x) => x.includes("mbed"))).map((m) => m.name.replace("models/", ""));
    console.log(`\nGenerate models: ${gen.filter((n) => n.includes("gemini")).join(", ")}`);
    console.log(`Embedding models: ${emb.join(", ")}`);
    if (!gen.includes(geminiConfig.model)) console.warn(`\n⚠ GEMINI_MODEL "${geminiConfig.model}" is not in the list above.`);
  }

  const started = Date.now();
  const { data } = await generateJson<{ greeting: string }>({
    instructions: "Reply in Amharic.",
    messages: [{ role: "user", content: "Say hello in one short sentence." }],
    schema: { type: "object", additionalProperties: false, required: ["greeting"], properties: { greeting: { type: "string" } } },
    schemaName: "check",
  });
  console.log(`\nJSON generation OK (${Date.now() - started} ms): ${data.greeting}`);
  const [v] = await embedTexts(["ቆሻሻ መለየት"], "query");
  console.log(`Embeddings OK: ${v.length} dimensions`);
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
