import { generateJson } from "./provider";
import type { AiImage } from "./types";
import { ASSESS_SCHEMA, assessInstructions, type AssessResult } from "./vision";

/** AI preliminary assessment of a report (photo + citizen text). Never receives name or phone. */
export async function runAssessment(opts: {
  image: AiImage;
  description: string;
  location: string;
  lang: "en" | "am";
}): Promise<AssessResult> {
  const { data } = await generateJson<AssessResult>({
    instructions: assessInstructions(opts.lang),
    messages: [
      {
        role: "user",
        content: `Citizen description: ${opts.description.slice(0, 1500) || "(none)"}\nLocation: ${opts.location.slice(0, 300) || "(not given)"}`,
        images: [opts.image],
      },
    ],
    schema: ASSESS_SCHEMA,
    schemaName: "severity_assessment",
  });
  return data;
}
