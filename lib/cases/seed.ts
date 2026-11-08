/**
 * Clearly fictional sample cases so the dashboard has realistic volume for demos
 * (spec §9.2: "computed from clearly fictional statistics"). Every sample case has
 * source="sample", a SAMPLE- reference, and no personal data.
 */
import type { AssessResult, WasteCategory } from "../ai/vision";
import { SUBCITIES, TEAMS } from "./geo";
import { dueFrom } from "./sla";
import type { CaseRecord, CaseStatus, Severity } from "./types";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const TEMPLATES: Record<
  Severity,
  { text: string; items: [string, WasteCategory][]; risks: string[]; volume: AssessResult["estimated_volume"]; action: string }[]
> = {
  low: [
    { text: "A few bags of litter left at the roadside.", items: [["plastic bags", "plastic"], ["paper", "paper_cardboard"]], risks: [], volume: "small", action: "Collect on the next scheduled round." },
    { text: "Street bin overflowing near the bus stop.", items: [["mixed litter", "mixed_household"], ["plastic bottles", "plastic"]], risks: [], volume: "small", action: "Empty the bin and check collection frequency." },
  ],
  medium: [
    { text: "Household garbage has not been collected for several days.", items: [["household bags", "mixed_household"], ["food waste", "organic"]], risks: ["Odour starting"], volume: "medium", action: "Schedule collection within 48 hours." },
    { text: "Waste pile growing next to the residential block.", items: [["mixed household waste", "mixed_household"], ["cardboard", "paper_cardboard"]], risks: [], volume: "medium", action: "Collect and remind residents of collection times." },
  ],
  high: [
    { text: "Large pile of mixed waste attracting flies and stray dogs.", items: [["food waste", "organic"], ["plastic", "plastic"], ["textiles", "textile"]], risks: ["Pests", "Health risk to residents"], volume: "large", action: "Send a truck within 24 hours and disinfect the site." },
    { text: "Garbage uncollected for over a week, strong smell in the street.", items: [["household bags", "mixed_household"], ["food waste", "organic"]], risks: ["Odour", "Pests"], volume: "large", action: "Prioritise collection today; check the route schedule." },
  ],
  urgent: [
    { text: "Garbage is blocking the drainage channel and water is backing up onto the road.", items: [["mixed waste", "mixed_household"], ["plastic bottles", "plastic"]], risks: ["Blocked drainage", "Flooding of the road"], volume: "large", action: "Dispatch a crew immediately to clear the drain." },
    { text: "Waste is being burned at an open dumping spot next to houses.", items: [["burning mixed waste", "mixed_household"], ["tyres", "other"]], risks: ["Smoke and toxic fumes", "Fire spreading"], volume: "very_large", action: "Alert the field supervisor; extinguish and clear the site today." },
    { text: "Dumped medical-looking waste near the school gate.", items: [["syringes and packaging", "hazardous"]], risks: ["Hazardous waste near children"], volume: "small", action: "Send a trained crew with protective equipment immediately." },
  ],
};

const LANDMARKS = [
  "near the main market", "behind the health centre", "next to the primary school", "along the river bank",
  "at the minibus terminal", "near the church", "close to the condominium blocks", "by the football field",
  "opposite the youth centre", "at the junction near the bakery",
];

const SUBCITY_WEIGHT: Record<string, number> = {
  Bole: 14, Yeka: 12, "Kolfe Keranio": 11, "Nifas Silk-Lafto": 10, Kirkos: 9, "Addis Ketema": 9,
  Arada: 7, Lideta: 7, "Akaky Kaliti": 6, Gullele: 6, "Lemi Kura": 5,
};

function pick<T>(r: () => number, xs: readonly T[]): T {
  return xs[Math.floor(r() * xs.length)];
}

function weighted<T extends string>(r: () => number, w: Record<T, number>): T {
  const total = Object.values<number>(w).reduce((a, b) => a + b, 0);
  let x = r() * total;
  for (const [k, v] of Object.entries<number>(w)) {
    x -= v;
    if (x <= 0) return k as T;
  }
  return Object.keys(w)[0] as T;
}

export function generateSampleCases(now = Date.now(), count = 84): CaseRecord[] {
  const r = rng(20261107);
  const cases: CaseRecord[] = [];
  for (let i = 0; i < count; i++) {
    // More recent days get slightly more reports (adoption growing).
    const ageHours = Math.floor(Math.pow(r(), 1.25) * 30 * 24) + 1;
    const created = now - ageHours * 3_600_000;
    const severity = weighted<Severity>(r, { low: 24, medium: 40, high: 26, urgent: 10 });
    const tpl = pick(r, TEMPLATES[severity]);
    const scName = weighted(r, SUBCITY_WEIGHT);
    const sc = SUBCITIES.find((s) => s.name === scName)!;
    const createdAt = new Date(created).toISOString();
    const dueAt = dueFrom(createdAt, severity)!;
    const due = new Date(dueAt).getTime();

    // Status follows age: most old cases are done; some slip past their target.
    let status: CaseStatus;
    let resolvedAt: string | null = null;
    let firstActionAt: string | null = null;
    const late = r() < 0.18;
    const span = due - created;
    const doneAt = created + span * (late ? 1.2 + r() * 1.5 : 0.25 + r() * 0.7);
    if (doneAt < now && (r() < 0.92 || now - created > 7 * 86_400_000)) {
      status = r() < 0.35 ? "closed" : "resolved";
      resolvedAt = new Date(doneAt).toISOString();
      firstActionAt = new Date(created + (doneAt - created) * 0.3).toISOString();
    } else {
      const progress = (now - created) / span;
      status = progress < 0.15 ? "new" : progress < 0.5 ? "assigned" : "in_progress";
      if (status !== "new") firstActionAt = new Date(created + span * 0.12).toISOString();
    }

    const team = r() < 0.2 ? TEAMS[0] : `${sc.name} cleansing team`;
    const landmark = pick(r, LANDMARKS);
    const lat = sc.lat + (r() - 0.5) * 0.03;
    const lng = sc.lng + (r() - 0.5) * 0.03;
    const at = (t: number) => new Date(t).toISOString();

    const history: CaseRecord["history"] = [{ at: createdAt, actor: "Citizen", action: "Report received via AI assistant" }];
    history.push({ at: at(created + 60_000), actor: "AI", action: `Preliminary assessment: ${severity}` });
    if (firstActionAt) history.push({ at: firstActionAt, actor: "Dispatcher", action: `Assigned to ${team}` });
    if (status === "in_progress" || resolvedAt) history.push({ at: firstActionAt ?? createdAt, actor: team, action: "Crew on the way" });
    if (resolvedAt) history.push({ at: resolvedAt, actor: team, action: "Marked resolved", note: "Site cleared." });
    if (status === "closed") history.push({ at: at(new Date(resolvedAt!).getTime() + 3_600_000 * 6), actor: "Supervisor", action: "Closed after verification" });

    cases.push({
      id: `s${String(i + 1).padStart(4, "0")}`,
      reference: `SAMPLE-${String(i + 1).padStart(4, "0")}`,
      source: "sample",
      createdAt,
      status,
      severity,
      severitySource: "ai",
      assessment: {
        not_waste: false,
        scene_summary: `${tpl.text.replace(/\.$/, "")} (${landmark}).`,
        visible_waste: tpl.items.map(([item, category]) => ({ item, category })),
        estimated_volume: tpl.volume,
        severity,
        severity_reasons: tpl.risks.length ? tpl.risks : ["Contained amount of waste"],
        risks: tpl.risks,
        recommended_action: tpl.action,
        confidence: pick(r, ["medium", "high", "high"] as const),
      },
      assessmentStatus: "done",
      subcity: sc.name,
      subcityApprox: false,
      location: { mode: r() < 0.55 ? "gps" : "manual", text: `${sc.name} sub-city, ${landmark}`, lat, lng },
      description: tpl.text,
      reporterName: "Sample resident",
      reporterPhone: "",
      lang: r() < 0.6 ? "am" : "en",
      hasPhoto: false,
      assignedTo: status === "new" ? null : team,
      dueAt,
      firstActionAt,
      resolvedAt,
      history,
    });
  }
  return cases.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
