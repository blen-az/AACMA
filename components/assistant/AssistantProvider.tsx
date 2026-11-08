"use client";

/**
 * Owns the assistant conversation for the whole site. Mounted in the root layout,
 * so the conversation survives navigation between the homepage and the Training
 * Centre (WEB-04). Nothing is persisted: closing the tab clears everything (§6.2).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  initialState,
  isComplaintActive,
  reducer,
  type Field,
  type Message,
  type Source,
  type State,
  type Step,
} from "@/lib/complaint/machine";
import {
  checkPhoto,
  isPlainNameAnswer,
  isValidDescription,
  isValidLocationText,
  isValidName,
  looksLikeComplaint,
  looksLikePhoneAttempt,
  normalizePhone,
} from "@/lib/complaint/validators";
import type { AssessResult, IdentifyResult } from "@/lib/ai/vision";
import { toJpegBase64 } from "@/lib/image";
import { detectLang } from "@/lib/i18n/detectLang";
import { missingInfo, t, type Lang } from "@/lib/i18n/strings";

type TurnResponse = {
  action: "answer" | "start_complaint" | "provide_field" | "edit_field" | "restart" | "unclear";
  field: string | null;
  reply: string;
  sources: Source[];
};

type Ctx = {
  state: State;
  open: boolean;
  setOpen: (open: boolean) => void;
  openAssistant: (mode?: "question" | "complaint") => void;
  focusToken: number;
  gpsBusy: boolean;
  sendText: (text: string) => void;
  chooseQuestion: () => void;
  startComplaint: () => void;
  attachPhoto: (file: File | undefined) => void;
  askAboutPhoto: (file: File | undefined) => void;
  removePhoto: () => void;
  chooseLocation: (choice: "here" | "elsewhere") => void;
  shareLocation: () => void;
  confirmGps: (ok: boolean) => void;
  editDetails: () => void;
  editField: (field: Field) => void;
  confirm: () => void;
  askRestart: () => void;
  answerRestart: (yes: boolean) => void;
  setLang: (lang: Lang) => void;
};

const AssistantContext = createContext<Ctx | null>(null);

export function useAssistant(): Ctx {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be used inside <AssistantProvider>");
  return ctx;
}

const FIELD_LABEL_KEY = {
  photo: "field_photo",
  location: "field_location",
  description: "field_description",
  name: "field_name",
  phone: "field_phone",
} as const;

const LOCATION_STEPS: Step[] = ["location_ask", "location_gps", "location_confirm", "location_manual"];

/** Conversation history for the model, with personal data redacted (§3.4). */
function toHistory(messages: Message[]) {
  return messages.slice(-12).map((m) => ({
    role: m.role,
    content:
      m.redact === "name"
        ? "[name provided]"
        : m.redact === "phone"
          ? "[phone provided]"
          : m.kind === "photo"
            ? "[photo attached]"
            : m.kind === "gps"
              ? "[device location shared]"
              : m.text,
  }));
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState("en"));
  const [open, setOpen] = useState(false);
  const [focusToken, setFocusToken] = useState(0);
  const [gpsBusy, setGpsBusy] = useState(false);

  // The latest state for async handlers (fetch / geolocation callbacks).
  const ref = useRef(state);
  useEffect(() => {
    ref.current = state;
  }, [state]);

  // Object URLs for attached photos, revoked on restart / unmount.
  const photoUrls = useRef<string[]>([]);
  useEffect(() => {
    const urls = photoUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const callModel = useCallback(
    async (history: ReturnType<typeof toHistory>, step: Step, lang: Lang): Promise<TurnResponse | null> => {
      const d = ref.current.data;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            step,
            lang,
            filled: {
              photo: !!d.photo,
              location: !!d.location,
              description: !!d.description,
              name: !!d.name,
              phone: !!d.phone,
            },
          }),
          signal: AbortSignal.timeout(40_000),
        });
        if (!res.ok) return null;
        return (await res.json()) as TurnResponse;
      } catch {
        return null;
      }
    },
    [],
  );

  /** Store a typed value for the field the current step is waiting for. */
  const storeTypedField = useCallback((step: Step, text: string): boolean => {
    if (step === "description") {
      if (!isValidDescription(text)) return false;
      dispatch({ type: "field_set", field: "description", value: text });
      return true;
    }
    if (LOCATION_STEPS.includes(step)) {
      if (!isValidLocationText(text)) return false;
      dispatch({ type: "field_set", field: "location_text", value: text });
      return true;
    }
    if (step === "name") {
      if (!isValidName(text)) return false;
      dispatch({ type: "field_set", field: "name", value: text });
      return true;
    }
    if (step === "phone") {
      const phone = normalizePhone(text);
      if (!phone) {
        dispatch({ type: "say_key", keys: ["phone_invalid"] });
        return true;
      }
      dispatch({ type: "field_set", field: "phone", value: phone });
      return true;
    }
    return false;
  }, []);

  const sendText = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      const s = ref.current;
      if (!text || s.busy) return;
      const step = s.step;
      const isPersonalField = step === "name" || step === "phone";

      // Language follows the citizen's latest message, except while they type a name or number.
      let lang = s.lang;
      if (!isPersonalField) {
        const detected = detectLang(text);
        if (detected && detected !== lang) {
          lang = detected;
          dispatch({ type: "set_lang", lang });
        }
      }

      const redact = step === "name" ? "name" : step === "phone" ? "phone" : undefined;
      dispatch({ type: "user_say", text, redact });

      // Deterministic fast paths: no model call, no personal data leaves the browser.
      if (step === "phone") {
        const phone = normalizePhone(text);
        if (phone) return dispatch({ type: "field_set", field: "phone", value: phone });
        if (looksLikePhoneAttempt(text)) return dispatch({ type: "say_key", keys: ["phone_invalid"] });
      }
      if (step === "name" && isPlainNameAnswer(text)) {
        return dispatch({ type: "field_set", field: "name", value: text });
      }

      const history = toHistory([
        ...s.messages,
        { id: -1, role: "user", text, lang, redact },
      ]);
      dispatch({ type: "busy", busy: true });
      const result = await callModel(history, step, lang);
      dispatch({ type: "busy", busy: false });
      const active = isComplaintActive(step);

      if (!result) {
        // AI unavailable (AI-08): the report flow keeps working on local rules.
        dispatch({ type: "ai_down", down: true });
        if (storeTypedField(step, text)) return;
        if (step === "idle" && looksLikeComplaint(text)) return dispatch({ type: "start_complaint" });
        if (step === "photo") {
          return dispatch({ type: "assistant_say", text: missingInfo(lang, [t(lang, "field_photo")]) });
        }
        dispatch({ type: "say_key", keys: ["tech_error"], tone: "error" });
        if (active) dispatch({ type: "resume" });
        return;
      }
      if (ref.current.aiDown) dispatch({ type: "ai_down", down: false });

      switch (result.action) {
        case "start_complaint":
          dispatch({ type: "start_complaint" });
          return;
        case "provide_field": {
          if (step === "photo") {
            dispatch({ type: "assistant_say", text: missingInfo(lang, [t(lang, "field_photo")]) });
            return;
          }
          // The app decides which field this is (current step), and stores the citizen's own words.
          if (storeTypedField(step, text)) return;
          dispatch({ type: "resume" });
          return;
        }
        case "edit_field": {
          const f = (result.field === "location_text" ? "location" : result.field) as Field | null;
          if ((step === "review" || step === "edit_menu") && f && f in FIELD_LABEL_KEY) {
            dispatch({ type: "edit_pick", field: f });
          } else if (active) {
            dispatch({ type: "resume" });
          }
          return;
        }
        case "restart":
          dispatch({ type: "restart_prompt", open: true });
          dispatch({ type: "say_key", keys: ["restart_question"] });
          return;
        case "answer":
        case "unclear":
        default: {
          const reply = result.reply?.trim();
          if (reply) {
            dispatch({ type: "assistant_say", text: reply, sources: result.sources });
          } else {
            dispatch({ type: "say_key", keys: ["no_info", "no_info_rephrase"] });
          }
          if (active) dispatch({ type: "resume" });
        }
      }
    },
    [callModel, storeTypedField],
  );

  const startComplaint = useCallback(() => {
    const s = ref.current;
    if (isComplaintActive(s.step)) return dispatch({ type: "resume" });
    dispatch({ type: "user_say", text: t(s.lang, "opt_report") });
    dispatch({ type: "start_complaint" });
  }, []);

  const chooseQuestion = useCallback(() => {
    dispatch({ type: "user_say", text: t(ref.current.lang, "opt_question") });
    dispatch({ type: "ask_question" });
    setFocusToken((n) => n + 1);
  }, []);

  const openAssistant = useCallback(
    (mode?: "question" | "complaint") => {
      setOpen(true);
      if (mode === "complaint") startComplaint();
      else setFocusToken((n) => n + 1);
    },
    [startComplaint],
  );

  const attachPhoto = useCallback((file: File | undefined) => {
    if (!file) return;
    if (!checkPhoto(file).ok) return dispatch({ type: "say_key", keys: ["photo_failed"], tone: "error" });
    try {
      const url = URL.createObjectURL(file);
      photoUrls.current.push(url);
      dispatch({ type: "photo_set", photo: { url, name: file.name, size: file.size, type: file.type } });
    } catch {
      dispatch({ type: "say_key", keys: ["photo_failed"], tone: "error" });
    }
  }, []);

  const chooseLocation = useCallback((choice: "here" | "elsewhere") => {
    dispatch({ type: "user_say", text: t(ref.current.lang, choice === "here" ? "opt_here" : "opt_elsewhere") });
    dispatch({ type: "location_choice", choice });
  }, []);

  // Location permission is requested only from this explicit click (C3, T06).
  const shareLocation = useCallback(() => {
    dispatch({ type: "user_say", text: t(ref.current.lang, "opt_share_location") });
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return dispatch({ type: "gps_failed" });
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsBusy(false);
        dispatch({
          type: "gps_success",
          fix: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) },
        });
      },
      () => {
        setGpsBusy(false);
        dispatch({ type: "gps_failed" });
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
    );
  }, []);

  const confirmGps = useCallback((ok: boolean) => {
    dispatch({ type: "user_say", text: t(ref.current.lang, ok ? "opt_gps_yes" : "opt_gps_change") });
    dispatch({ type: "gps_confirm", ok });
  }, []);

  const editDetails = useCallback(() => {
    dispatch({ type: "user_say", text: t(ref.current.lang, "opt_edit") });
    dispatch({ type: "review_edit" });
  }, []);

  const editField = useCallback((field: Field) => {
    dispatch({ type: "user_say", text: t(ref.current.lang, FIELD_LABEL_KEY[field]) });
    dispatch({ type: "edit_pick", field });
  }, []);

  /** Resident asks what waste is in a photo (pitch §2C). The photo goes to the AI provider for this one request. */
  const askAboutPhoto = useCallback(async (file: File | undefined) => {
    if (!file || ref.current.busy) return;
    if (!checkPhoto(file).ok) return dispatch({ type: "say_key", keys: ["photo_failed"], tone: "error" });
    const url = URL.createObjectURL(file);
    photoUrls.current.push(url);
    const lang = ref.current.lang;
    dispatch({ type: "user_say", text: file.name, kind: "photo", photoUrl: url });
    dispatch({ type: "busy", busy: true });
    try {
      const image = await toJpegBase64(url);
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "identify", lang, image }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(String(res.status));
      const r = (await res.json()) as IdentifyResult & { sources: Source[] };
      if (ref.current.aiDown) dispatch({ type: "ai_down", down: false });
      dispatch({ type: "assistant_identify", text: r.reply, items: r.is_waste_photo ? r.items : [], sources: r.sources });
    } catch {
      dispatch({ type: "ai_down", down: true });
      dispatch({ type: "say_key", keys: ["tech_error"], tone: "error" });
    } finally {
      dispatch({ type: "busy", busy: false });
    }
  }, []);

  const confirm = useCallback(async () => {
    const s = ref.current;
    if (s.step !== "review") return;
    dispatch({ type: "user_say", text: t(s.lang, "opt_confirm") });
    dispatch({ type: "confirm" });

    const d = s.data;
    const location =
      d.location?.mode === "manual"
        ? d.location.text
        : d.location
          ? `GPS ${d.location.lat.toFixed(4)}, ${d.location.lng.toFixed(4)} (Addis Ababa)`
          : "";
    let image: { mimeType: string; base64: string } | null = null;
    try {
      if (d.photo) image = await toJpegBase64(d.photo.url);
    } catch {
      image = null;
    }

    // 1. Send the report to the (demo) case dashboard and show its reference.
    let created: { id: string; reference: string; token: string } | null = null;
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang: s.lang,
          description: d.description,
          name: d.name,
          phone: d.phone,
          location:
            d.location?.mode === "gps"
              ? { mode: "gps", lat: d.location.lat, lng: d.location.lng, accuracy: d.location.accuracy }
              : { mode: "manual", text: d.location?.text },
          photo: image,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) {
        created = await res.json();
        dispatch({ type: "set_reference", reference: created!.reference });
      }
    } catch {
      created = null; // the receipt keeps DEMO-AACMA-001
    }

    // 2. AI preliminary assessment for staff. Photo + description + location only — never name or phone.
    if (!image) {
      dispatch({ type: "assessment", status: "error" });
      return;
    }
    try {
      const res = created
        ? await fetch(`/api/cases/${created.id}/assess`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: created.token }),
            signal: AbortSignal.timeout(90_000),
          })
        : await fetch("/api/vision", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "assess", lang: s.lang, image, description: d.description, location }),
            signal: AbortSignal.timeout(60_000),
          });
      if (!res.ok) throw new Error(String(res.status));
      dispatch({ type: "assessment", status: "done", data: (await res.json()) as AssessResult });
    } catch {
      dispatch({ type: "assessment", status: "error" });
    }
  }, []);

  const askRestart = useCallback(() => {
    if (ref.current.restartPrompt) return;
    dispatch({ type: "restart_prompt", open: true });
    dispatch({ type: "say_key", keys: ["restart_question"] });
  }, []);

  const answerRestart = useCallback((yes: boolean) => {
    if (yes) {
      photoUrls.current.forEach((u) => URL.revokeObjectURL(u));
      photoUrls.current = [];
      dispatch({ type: "restart" });
      return;
    }
    dispatch({ type: "user_say", text: t(ref.current.lang, "opt_restart_no") });
    dispatch({ type: "restart_prompt", open: false });
    dispatch({ type: "resume" });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      open,
      setOpen,
      openAssistant,
      focusToken,
      gpsBusy,
      sendText: (text) => void sendText(text),
      chooseQuestion,
      startComplaint,
      attachPhoto,
      askAboutPhoto: (file) => void askAboutPhoto(file),
      removePhoto: () => dispatch({ type: "photo_remove" }),
      chooseLocation,
      shareLocation,
      confirmGps,
      editDetails,
      editField,
      confirm: () => void confirm(),
      askRestart,
      answerRestart,
      setLang: (lang) => dispatch({ type: "set_lang", lang, reprompt: true }),
    }),
    [
      state, open, openAssistant, focusToken, gpsBusy, sendText, chooseQuestion, startComplaint,
      attachPhoto, askAboutPhoto, chooseLocation, shareLocation, confirmGps, editDetails, editField, confirm,
      askRestart, answerRestart,
    ],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}
