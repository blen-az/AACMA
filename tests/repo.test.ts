import { describe, expect, it } from "vitest";
import { normalize } from "@/lib/cases/repo";

describe("normalize (Firebase drops nulls and turns arrays into objects)", () => {
  it("restores defaults and arrays", () => {
    const c = normalize({
      id: "abc",
      reference: "DEMO-AACMA-001",
      history: { 0: { at: "t", actor: "Citizen", action: "Report received" } } as never,
      assessment: {
        not_waste: false, scene_summary: "x", estimated_volume: "small", severity: "low",
        recommended_action: "y", confidence: "low",
        visible_waste: { 0: { item: "bag", category: "plastic" } },
      } as never,
    });
    expect(c.severity).toBeNull();
    expect(c.assignedTo).toBeNull();
    expect(c.hasPhoto).toBe(false);
    expect(c.history).toHaveLength(1);
    expect(c.assessment?.visible_waste).toEqual([{ item: "bag", category: "plastic" }]);
    expect(c.assessment?.risks).toEqual([]);
    expect(c.location.mode).toBe("manual");
  });
});
