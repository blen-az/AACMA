/**
 * Deterministic assistant + complaint state machine (plan §3.1, spec §7).
 *
 * The app owns the complaint: step order, field values, validation results,
 * confirmation and the DEMO reference all live here. The language model only
 * interprets free text and writes informational answers; it cannot move the
 * machine except through the same actions a button would dispatch.
 */
import type { AssessResult, IdentifyResult } from "../ai/vision";
import { DEMO_REFERENCE, t, type Lang, type StringKey } from "../i18n/strings";

export type Photo = { url: string; name: string; size: number; type: string };
export type GpsFix = { lat: number; lng: number; accuracy: number };
export type Location =
  | ({ mode: "gps" } & GpsFix)
  | { mode: "manual"; text: string };

export type ComplaintData = {
  photo: Photo | null;
  location: Location | null;
  pendingGps: GpsFix | null;
  description: string;
  name: string;
  phone: string; // normalised +251…
};

export type Field = "photo" | "location" | "description" | "name" | "phone";
export const FIELD_ORDER: Field[] = ["photo", "location", "description", "name", "phone"];

export type Step =
  | "idle"
  | "photo"
  | "location_ask"
  | "location_gps"
  | "location_confirm"
  | "location_manual"
  | "description"
  | "name"
  | "phone"
  | "review"
  | "edit_menu"
  | "confirmed";

export type Source = { id: string; title: string; page?: number | null; url?: string | null };

export type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
  lang: Lang;
  kind?: "text" | "photo" | "gps" | "receipt" | "identify";
  photoUrl?: string;
  gps?: GpsFix;
  sources?: Source[];
  /** Waste items found in a photo the resident asked about. */
  items?: IdentifyResult["items"];
  /** Personal data the client must not send to the model. */
  redact?: "name" | "phone";
  tone?: "error" | "info";
};

export type State = {
  lang: Lang;
  step: Step;
  data: ComplaintData;
  editing: boolean;
  restartPrompt: boolean;
  messages: Message[];
  seq: number;
  busy: boolean;
  aiDown: boolean;
  /** AI preliminary assessment per receipt message id (shown for staff, after confirmation). */
  assessments: Record<number, Assessment>;
  /** Case reference per receipt message id (from the server; DEMO-AACMA-001 if unavailable). */
  references: Record<number, string>;
  lastReceiptId: number | null;
};

export type Assessment = { status: "loading" | "done" | "error"; data?: AssessResult };

export type Action =
  | { type: "set_lang"; lang: Lang; reprompt?: boolean }
  | { type: "user_say"; text: string; redact?: "name" | "phone"; kind?: Message["kind"]; photoUrl?: string }
  | { type: "assistant_say"; text: string; sources?: Source[]; tone?: Message["tone"] }
  | { type: "assistant_identify"; text: string; items: IdentifyResult["items"]; sources?: Source[] }
  | { type: "assessment"; status: Assessment["status"]; data?: AssessResult }
  | { type: "set_reference"; reference: string }
  | { type: "say_key"; keys: StringKey[]; tone?: Message["tone"] }
  | { type: "start_complaint" }
  | { type: "ask_question" }
  | { type: "photo_set"; photo: Photo }
  | { type: "photo_remove" }
  | { type: "location_choice"; choice: "here" | "elsewhere" }
  | { type: "gps_success"; fix: GpsFix }
  | { type: "gps_failed" }
  | { type: "gps_confirm"; ok: boolean }
  | { type: "field_set"; field: "description" | "name" | "phone" | "location_text"; value: string }
  | { type: "review_edit" }
  | { type: "edit_pick"; field: Field }
  | { type: "confirm" }
  | { type: "restart_prompt"; open: boolean }
  | { type: "restart" }
  | { type: "resume" }
  | { type: "busy"; busy: boolean }
  | { type: "ai_down"; down: boolean };

export const emptyData = (): ComplaintData => ({
  photo: null,
  location: null,
  pendingGps: null,
  description: "",
  name: "",
  phone: "",
});

export function initialState(lang: Lang = "en"): State {
  const s: State = {
    lang,
    step: "idle",
    data: emptyData(),
    editing: false,
    restartPrompt: false,
    messages: [],
    seq: 0,
    busy: false,
    aiDown: false,
    assessments: {},
    references: {},
    lastReceiptId: null,
  };
  return say(s, ["greeting_hello", "greeting_body", "greeting_ask"]);
}

export function isComplaintActive(step: Step): boolean {
  return step !== "idle" && step !== "confirmed";
}

export function firstMissing(d: ComplaintData): Field | null {
  if (!d.photo) return "photo";
  if (!d.location) return "location";
  if (!d.description.trim()) return "description";
  if (!d.name.trim()) return "name";
  if (!d.phone) return "phone";
  return null;
}

export function isComplete(d: ComplaintData): boolean {
  return firstMissing(d) === null;
}

const FIELD_STEP: Record<Field, Step> = {
  photo: "photo",
  location: "location_ask",
  description: "description",
  name: "name",
  phone: "phone",
};

/** The prompt that asks for whatever the current step is waiting for. */
export function stepPromptKeys(step: Step): StringKey[] {
  switch (step) {
    case "photo":
      return ["ask_photo"];
    case "location_ask":
      return ["location_ask"];
    case "location_gps":
      return ["gps_permission"];
    case "location_confirm":
      return ["gps_found"];
    case "location_manual":
      return ["manual_location", "manual_location_example"];
    case "description":
      return ["ask_description"];
    case "name":
      return ["ask_name"];
    case "phone":
      return ["ask_phone"];
    case "review":
      return ["review_intro"];
    case "edit_menu":
      return ["edit_question"];
    default:
      return [];
  }
}

function push(s: State, m: Omit<Message, "id" | "lang"> & { lang?: Lang }): State {
  const seq = s.seq + 1;
  return { ...s, seq, messages: [...s.messages, { lang: s.lang, ...m, id: seq }] };
}

/** One assistant bubble built from fixed strings (sentences joined; examples on their own line). */
export function joinKeys(lang: Lang, keys: StringKey[]): string {
  return keys
    .map((k, i) => (i > 0 ? (k === "manual_location_example" ? "\n" : " ") : "") + t(lang, k))
    .join("");
}

function say(s: State, keys: StringKey[], extra: Partial<Message> = {}): State {
  if (keys.length === 0) return s;
  return push(s, { role: "assistant", text: joinKeys(s.lang, keys), ...extra });
}

/** Move to the next missing field (or review) and ask for it. */
function advance(s: State, from: Field): State {
  const missing = firstMissing(s.data);
  if (!missing) {
    return say({ ...s, step: "review", editing: false }, ["review_intro"]);
  }
  const step = FIELD_STEP[missing];
  const next = { ...s, step };
  switch (missing) {
    case "photo":
      return say(next, s.editing ? ["edit_photo"] : ["complaint_intro", "ask_photo"]);
    case "location":
      return say(next, from === "photo" && !s.editing ? ["photo_received", "location_ask"] : ["location_ask"]);
    case "description":
      return say(next, ["ask_description"]);
    case "name":
      return say(next, from === "description" ? ["thanks", "ask_name"] : ["ask_name"]);
    case "phone":
      return say(next, ["ask_phone"]);
  }
}

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "set_lang": {
      if (a.lang === s.lang) return s;
      const next = { ...s, lang: a.lang };
      return a.reprompt && isComplaintActive(s.step) ? say(next, stepPromptKeys(s.step)) : next;
    }
    case "user_say":
      return push(s, { role: "user", text: a.text, redact: a.redact, kind: a.kind, photoUrl: a.photoUrl });
    case "assistant_say":
      return push(s, { role: "assistant", text: a.text, sources: a.sources, tone: a.tone });
    case "assistant_identify":
      return push(s, { role: "assistant", kind: "identify", text: a.text, items: a.items, sources: a.sources });
    case "assessment": {
      if (s.lastReceiptId === null) return s;
      return { ...s, assessments: { ...s.assessments, [s.lastReceiptId]: { status: a.status, data: a.data } } };
    }
    case "set_reference":
      if (s.lastReceiptId === null) return s;
      return { ...s, references: { ...s.references, [s.lastReceiptId]: a.reference } };
    case "say_key":
      return say(s, a.keys, { tone: a.tone });

    case "start_complaint": {
      if (isComplaintActive(s.step)) return say(s, stepPromptKeys(s.step));
      const fresh = { ...s, data: emptyData(), editing: false, restartPrompt: false };
      return say({ ...fresh, step: "photo" }, ["complaint_intro", "ask_photo"]);
    }
    case "ask_question":
      return say(s, ["question_prompt"]);

    case "photo_set": {
      const replacing = s.data.photo !== null && s.step !== "photo";
      const withPhoto = push(
        { ...s, data: { ...s.data, photo: a.photo } },
        { role: "user", text: a.photo.name, kind: "photo", photoUrl: a.photo.url },
      );
      if (replacing || s.step === "confirmed") return withPhoto;
      return advance(withPhoto, "photo");
    }
    case "photo_remove": {
      if (s.step === "confirmed" || !s.data.photo) return s;
      return say({ ...s, data: { ...s.data, photo: null }, step: "photo", editing: true }, ["edit_photo"]);
    }

    case "location_choice": {
      if (a.choice === "here") return say({ ...s, step: "location_gps" }, ["gps_permission"]);
      return say({ ...s, step: "location_manual" }, ["manual_location", "manual_location_example"]);
    }
    case "gps_success":
      return say(
        { ...s, step: "location_confirm", data: { ...s.data, pendingGps: a.fix } },
        ["gps_found"],
        { kind: "gps", gps: a.fix },
      );
    case "gps_failed":
      return say({ ...s, step: "location_manual" }, ["gps_failed", "manual_location", "manual_location_example"]);
    case "gps_confirm": {
      const fix = s.data.pendingGps;
      if (!a.ok || !fix) {
        return say(
          { ...s, step: "location_manual", data: { ...s.data, pendingGps: null } },
          ["manual_location", "manual_location_example"],
        );
      }
      const data = { ...s.data, pendingGps: null, location: { mode: "gps" as const, ...fix } };
      return advance({ ...s, data }, "location");
    }

    case "field_set": {
      const v = a.value.trim();
      if (a.field === "location_text") {
        return advance({ ...s, data: { ...s.data, location: { mode: "manual", text: v } } }, "location");
      }
      return advance({ ...s, data: { ...s.data, [a.field]: v } }, a.field);
    }

    case "review_edit":
      if (s.step !== "review") return s;
      return say({ ...s, step: "edit_menu" }, ["edit_question"]);
    case "edit_pick": {
      if (s.step === "confirmed") return s;
      const next = { ...s, editing: true, step: FIELD_STEP[a.field] };
      return say(next, a.field === "photo" ? ["edit_photo"] : stepPromptKeys(next.step));
    }

    case "confirm": {
      // Only from review, only once, only when complete (no duplicate confirmations).
      if (s.step !== "review" || !isComplete(s.data)) return s;
      const done = { ...s, step: "confirmed" as const, editing: false };
      const id = s.seq + 1;
      return push({ ...done, lastReceiptId: id, assessments: { ...s.assessments, [id]: { status: "loading" } } }, {
        role: "assistant",
        kind: "receipt",
        text: `${t(s.lang, "receipt_thanks")}\n${t(s.lang, "receipt_reference")} ${DEMO_REFERENCE}\n${t(s.lang, "receipt_notice")}`,
      });
    }

    case "restart_prompt":
      return { ...s, restartPrompt: a.open };
    case "restart":
      return initialState(s.lang);
    case "resume":
      return isComplaintActive(s.step) ? say(s, stepPromptKeys(s.step)) : s;
    case "busy":
      return { ...s, busy: a.busy };
    case "ai_down":
      return { ...s, aiDown: a.down };
  }
}
