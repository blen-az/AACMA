import { describe, expect, it } from "vitest";
import { initialState, reducer, type Action, type State } from "@/lib/complaint/machine";
import { AM_APPROVED, DEMO_REFERENCE } from "@/lib/i18n/strings";

const photo = { url: "blob:test", name: "garbage.jpg", size: 1000, type: "image/jpeg" };

function run(actions: Action[], s: State = initialState("en")): State {
  return actions.reduce(reducer, s);
}
const last = (s: State) => s.messages[s.messages.length - 1];

/** The Appendix A path: photo → elsewhere → address → description → name → phone → review. */
const happyPath: Action[] = [
  { type: "start_complaint" },
  { type: "photo_set", photo },
  { type: "location_choice", choice: "elsewhere" },
  { type: "field_set", field: "location_text", value: "Bole, near the test landmark" },
  { type: "field_set", field: "description", value: "Household garbage not collected for several days." },
  { type: "field_set", field: "name", value: "Test Resident" },
  { type: "field_set", field: "phone", value: "+251911000000" },
];

describe("complaint flow (spec §7)", () => {
  it("asks for fields in the approved order and reaches review", () => {
    const steps: string[] = [];
    let s = initialState("en");
    for (const a of happyPath) {
      s = reducer(s, a);
      steps.push(s.step);
    }
    expect(steps).toEqual(["photo", "location_ask", "location_manual", "description", "name", "phone", "review"]);
    expect(s.data.location).toEqual({ mode: "manual", text: "Bole, near the test landmark" });
  });

  it("stores the citizen's words verbatim (US-04)", () => {
    const s = run(happyPath);
    expect(s.data.description).toBe("Household garbage not collected for several days.");
    expect(s.data.name).toBe("Test Resident");
  });

  it("issues the DEMO reference only after explicit confirmation, once (C8, T11)", () => {
    const review = run(happyPath);
    expect(review.messages.some((m) => m.kind === "receipt")).toBe(false);
    const done = reducer(review, { type: "confirm" });
    expect(done.step).toBe("confirmed");
    expect(last(done).kind).toBe("receipt");
    expect(last(done).text).toContain(DEMO_REFERENCE);
    expect(last(done).text).toContain("no complaint has been submitted to AACMA");
    const again = reducer(done, { type: "confirm" });
    expect(again.messages.filter((m) => m.kind === "receipt")).toHaveLength(1);
  });

  it("cannot confirm before review", () => {
    const s = run(happyPath.slice(0, 4));
    expect(reducer(s, { type: "confirm" })).toBe(s);
  });

  it("edits one field and returns to review with the others intact (T11)", () => {
    let s = run([...happyPath, { type: "review_edit" }]);
    expect(s.step).toBe("edit_menu");
    s = reducer(s, { type: "edit_pick", field: "phone" });
    expect(s.step).toBe("phone");
    s = reducer(s, { type: "field_set", field: "phone", value: "+251922000000" });
    expect(s.step).toBe("review");
    expect(s.data.phone).toBe("+251922000000");
    expect(s.data.name).toBe("Test Resident");
    expect(s.data.photo).toEqual(photo);
  });

  it("re-asks for location when it is edited", () => {
    let s = run([...happyPath, { type: "review_edit" }, { type: "edit_pick", field: "location" }]);
    expect(s.step).toBe("location_ask");
    s = run([{ type: "location_choice", choice: "elsewhere" }, { type: "field_set", field: "location_text", value: "Yeka, near the park" }], s);
    expect(s.step).toBe("review");
    expect(s.data.location).toEqual({ mode: "manual", text: "Yeka, near the park" });
  });

  it("keeps fields when the language changes mid-report (T10)", () => {
    let s = run(happyPath.slice(0, 5));
    expect(s.step).toBe("name");
    s = reducer(s, { type: "set_lang", lang: "am", reprompt: true });
    expect(s.lang).toBe("am");
    expect(s.step).toBe("name");
    expect(s.data.description).toBe("Household garbage not collected for several days.");
    expect(last(s).text).toBe(AM_APPROVED.ask_name);
  });

  it("resumes the pending step after an informational answer (T09)", () => {
    let s = run(happyPath.slice(0, 4));
    expect(s.step).toBe("description");
    s = run([{ type: "assistant_say", text: "Some answer." }, { type: "resume" }], s);
    expect(s.step).toBe("description");
    expect(last(s).text).toBe("Briefly describe the problem.");
  });

  it("falls back to manual location when GPS fails (T06)", () => {
    const s = run([
      { type: "start_complaint" },
      { type: "photo_set", photo },
      { type: "location_choice", choice: "here" },
      { type: "gps_failed" },
    ]);
    expect(s.step).toBe("location_manual");
  });

  it("uses GPS only after the citizen confirms it", () => {
    const fix = { lat: 9.0, lng: 38.75, accuracy: 20 };
    let s = run([
      { type: "start_complaint" },
      { type: "photo_set", photo },
      { type: "location_choice", choice: "here" },
      { type: "gps_success", fix },
    ]);
    expect(s.step).toBe("location_confirm");
    expect(s.data.location).toBeNull();
    s = reducer(s, { type: "gps_confirm", ok: true });
    expect(s.data.location).toEqual({ mode: "gps", ...fix });
    expect(s.step).toBe("description");
  });

  it("asks for a new photo after removal and then continues (C2)", () => {
    let s = run([...happyPath.slice(0, 3)]);
    expect(s.step).toBe("location_manual");
    s = reducer(s, { type: "photo_remove" });
    expect(s.step).toBe("photo");
    s = reducer(s, { type: "photo_set", photo: { ...photo, url: "blob:new" } });
    expect(s.step).toBe("location_ask");
  });

  it("replacing a photo mid-flow does not change the step", () => {
    const s = run([...happyPath.slice(0, 3), { type: "photo_set", photo: { ...photo, url: "blob:new" } }]);
    expect(s.step).toBe("location_manual");
    expect(s.data.photo?.url).toBe("blob:new");
  });

  it("uses the approved Amharic prompts (Appendix B)", () => {
    const s = run([{ type: "start_complaint" }, { type: "photo_set", photo }], initialState("am"));
    expect(last(s).text).toBe(`${AM_APPROVED.photo_received} ${AM_APPROVED.location_ask}`);
  });

  it("restart clears everything (rehearsals)", () => {
    const s = run([...happyPath, { type: "confirm" }, { type: "restart" }]);
    expect(s.step).toBe("idle");
    expect(s.data.photo).toBeNull();
    expect(s.messages).toHaveLength(1);
  });
});
