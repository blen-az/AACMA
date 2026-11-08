import { describe, expect, it } from "vitest";
import { toGeminiSchema } from "@/lib/ai/gemini";
import { TURN_SCHEMA } from "@/lib/ai/prompt";
import { ASSESS_SCHEMA, IDENTIFY_SCHEMA } from "@/lib/ai/vision";
import { initialState, reducer, type Action, type State } from "@/lib/complaint/machine";

describe("toGeminiSchema", () => {
  it("converts the turn schema, turning anyOf-with-null into nullable", () => {
    const g = toGeminiSchema(TURN_SCHEMA as unknown as Record<string, unknown>) as {
      type: string;
      properties: Record<string, { type: string; nullable?: boolean; enum?: string[] }>;
      required: string[];
      propertyOrdering: string[];
    };
    expect(g.type).toBe("OBJECT");
    expect(g.properties.field).toMatchObject({ type: "STRING", nullable: true });
    expect(g.properties.action.enum).toContain("start_complaint");
    expect(g.required).toEqual(["action", "field", "reply", "used_sources"]);
    expect(g.propertyOrdering).toEqual(["action", "field", "reply", "used_sources"]);
    expect(JSON.stringify(g)).not.toContain("additionalProperties");
  });

  it("converts nested arrays of objects", () => {
    const g = toGeminiSchema(IDENTIFY_SCHEMA as unknown as Record<string, unknown>) as {
      properties: { items: { type: string; items: { type: string; properties: Record<string, { type: string }> } } };
    };
    expect(g.properties.items.type).toBe("ARRAY");
    expect(g.properties.items.items.type).toBe("OBJECT");
    expect(g.properties.items.items.properties.category.type).toBe("STRING");
    expect(toGeminiSchema(ASSESS_SCHEMA as unknown as Record<string, unknown>).type).toBe("OBJECT");
  });
});

describe("staff assessment state", () => {
  const photo = { url: "blob:x", name: "x.jpg", size: 1, type: "image/jpeg" };
  const flow: Action[] = [
    { type: "start_complaint" },
    { type: "photo_set", photo },
    { type: "location_choice", choice: "elsewhere" },
    { type: "field_set", field: "location_text", value: "Bole, near the test landmark" },
    { type: "field_set", field: "description", value: "Garbage not collected for days." },
    { type: "field_set", field: "name", value: "Test Resident" },
    { type: "field_set", field: "phone", value: "+251911000000" },
  ];
  const run = (as: Action[], s: State = initialState("en")) => as.reduce(reducer, s);

  it("starts loading on confirm and attaches the result to that receipt", () => {
    let s = run([...flow, { type: "confirm" }]);
    const id = s.lastReceiptId!;
    expect(s.messages.find((m) => m.id === id)?.kind).toBe("receipt");
    expect(s.assessments[id].status).toBe("loading");
    s = reducer(s, {
      type: "assessment",
      status: "done",
      data: {
        not_waste: false, scene_summary: "Pile of bags.", visible_waste: [], estimated_volume: "medium",
        severity: "high", severity_reasons: [], risks: [], recommended_action: "Collect today.", confidence: "medium",
      },
    });
    expect(s.assessments[id].data?.severity).toBe("high");
  });

  it("is not shown in the citizen review before confirmation", () => {
    const s = run(flow);
    expect(s.step).toBe("review");
    expect(Object.keys(s.assessments)).toHaveLength(0);
  });
});
