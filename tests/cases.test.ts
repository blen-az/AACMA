import { describe, expect, it } from "vitest";
import { nearestSubcity, subcityFromText } from "@/lib/cases/geo";
import { generateSampleCases } from "@/lib/cases/seed";
import { dueFrom, isOverdue } from "@/lib/cases/sla";
import { computeStats } from "@/lib/cases/stats";

describe("sample cases", () => {
  const now = Date.parse("2026-11-07T12:00:00Z");
  const cases = generateSampleCases(now);

  it("are clearly fictional and contain no personal data", () => {
    expect(cases.length).toBeGreaterThan(50);
    for (const c of cases) {
      expect(c.source).toBe("sample");
      expect(c.reference).toMatch(/^SAMPLE-\d{4}$/);
      expect(c.reporterPhone).toBe("");
      expect(c.subcity).toBeTruthy();
    }
  });

  it("produce a realistic mix for the dashboard", () => {
    const s = computeStats(cases, 30, now);
    expect(s.totals.received).toBeGreaterThan(70);
    expect(s.totals.open).toBeGreaterThan(0);
    expect(s.totals.resolved).toBeGreaterThan(0);
    expect(s.bySubcity.length).toBeGreaterThan(5);
    expect(s.perDay).toHaveLength(30);
    expect(s.perDay.reduce((a, d) => a + d.count, 0)).toBe(s.totals.received);
  });
});

describe("SLA", () => {
  it("sets targets by priority and flags overdue open cases", () => {
    const created = "2026-11-07T00:00:00.000Z";
    expect(dueFrom(created, "urgent")).toBe("2026-11-07T04:00:00.000Z");
    expect(dueFrom(created, null)).toBeNull();
    const due = dueFrom(created, "urgent");
    expect(isOverdue({ status: "assigned", dueAt: due }, Date.parse("2026-11-07T05:00:00Z"))).toBe(true);
    expect(isOverdue({ status: "resolved", dueAt: due }, Date.parse("2026-11-07T05:00:00Z"))).toBe(false);
  });
});

describe("sub-city detection", () => {
  it("finds sub-cities in English and Amharic text", () => {
    expect(subcityFromText("Bole sub-city, near the test landmark")).toBe("Bole");
    expect(subcityFromText("ቦሌ ክፍለ ከተማ፣ ከሙከራ ቦታ አጠገብ")).toBe("Bole");
    expect(subcityFromText("nifas silk lafto woreda 2")).toBe("Nifas Silk-Lafto");
    expect(subcityFromText("somewhere else")).toBeNull();
  });
  it("suggests the nearest sub-city for coordinates inside Addis Ababa only", () => {
    expect(nearestSubcity(8.996, 38.789)).toBe("Bole");
    expect(nearestSubcity(7.0, 39.0)).toBeNull();
  });
});
