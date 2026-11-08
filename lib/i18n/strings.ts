/**
 * Assistant copy.
 *
 * AM_APPROVED is Appendix B of the engineering handoff (project-lead approved),
 * reproduced verbatim and split only at sentence boundaries. Do not edit these
 * strings without Meleph approval: tests/strings.test.ts locks them with a hash.
 *
 * AM_PENDING / EN_PENDING are strings the UI needs that Appendix A/B do not
 * cover. They are drafts, listed in docs/strings-pending-approval.md.
 */

export type Lang = "en" | "am";

export const AM_APPROVED = {
  // 1. Greeting
  greeting_hello: "ሰላም! እንኳን ደህና መጡ።",
  greeting_body:
    "ስለ ከተማው የጽዳት አገልግሎቶች መረጃ ልሰጥዎ ወይም የጽዳት ችግር ለማሳወቅ ልረዳዎ እችላለሁ።",
  greeting_ask: "እንዴት ልርዳዎ?",
  opt_question: "ጥያቄ አለኝ",
  opt_report: "የጽዳት ችግር ማሳወቅ እፈልጋለሁ",
  // 2. Complaint
  complaint_intro: "ይህን ችግር ለማሳወቅ እረዳዎታለሁ።",
  ask_photo: "በመጀመሪያ እባክዎ የችግሩን ፎቶ ያያይዙ።",
  opt_take_photo: "ፎቶ አንሳ",
  opt_choose_photo: "ከስልኬ ፎቶ ምረጥ",
  // 3. After photo
  photo_received: "ፎቶውን ተቀብያለሁ። አሁን ችግሩ ያለበትን ቦታ እንለይ።",
  location_ask: "ችግሩ ያለበት ቦታ አሁን ያሉበት ቦታ ነው?",
  opt_here: "አዎ፣ አሁን ያለሁበት ቦታ ነው",
  opt_elsewhere: "አይ፣ ሌላ ቦታ ነው",
  // 4. Current location
  gps_permission: "ቦታዎን ለመለየት የመሣሪያዎን የቦታ መረጃ ለመጠቀም ፈቃድ ይስጡ።",
  opt_share_location: "ያለሁበትን ቦታ አጋራ",
  gps_found: "ቦታዎ ተገኝቷል። ይህ ችግሩ ያለበት ትክክለኛ ቦታ ነው?",
  opt_gps_yes: "አዎ፣ ትክክል ነው",
  opt_gps_change: "አይ፣ ቦታውን ልቀይር",
  // 5. Other location
  manual_location:
    "እባክዎ ችግሩ ያለበትን አድራሻ ይጻፉ። ክፍለ ከተማውን፣ ወረዳውን ወይም አቅራቢያው ያለ የሚታወቅ ቦታ መጥቀስ ይችላሉ።",
  manual_location_example: "ለምሳሌ፦ ቦሌ ክፍለ ከተማ፣ ከ[የቦታ ምልክት] አጠገብ።",
  // 6. Description
  ask_description: "እባክዎ ችግሩን በአጭሩ ይግለጹልኝ።",
  thanks: "አመሰግናለሁ።",
  // 7. Name
  ask_name: "እባክዎ ሙሉ ስምዎን ይጻፉ።",
  // 8. Phone
  ask_phone: "አመሰግናለሁ። እባክዎ ለግንኙነት የሚያገለግል የስልክ ቁጥርዎን ያስገቡ።",
  // 9. Review
  review_intro: "እናመሰግናለን። እባክዎ ያስገቡትን መረጃ ያረጋግጡ።",
  label_name: "ስም፦",
  label_phone: "ስልክ ቁጥር፦",
  label_location: "የችግሩ ቦታ፦",
  label_description: "የችግሩ መግለጫ፦",
  label_photo: "የተያያዘ ፎቶ፦",
  review_question: "መረጃው ትክክል ነው?",
  opt_confirm: "አዎ፣ አረጋግጥ",
  opt_edit: "መረጃውን ልቀይር",
  // 10. Demo reference
  receipt_thanks: "አመሰግናለሁ።",
  receipt_reference: "የሙከራ ማጣቀሻ ቁጥርዎ፦",
  receipt_notice: "ይህ የሙከራ ማሳያ ብቻ ነው። ቅሬታው ለኤጀንሲው አልተላከም።",
  // 11–18. Additional messages
  gps_failed:
    "የቦታ መረጃዎን ማግኘት አልተቻለም። ምንም አይደለም፤ ችግሩ ያለበትን ቦታ በጽሑፍ መግለጽ ይችላሉ።",
  photo_failed: "ፎቶውን ማያያዝ አልተሳካም። እባክዎ እንደገና ይሞክሩ።",
  phone_invalid:
    "ያስገቡት የስልክ ቁጥር ትክክለኛ አይመስልም። እባክዎ ቁጥሩን ያረጋግጡና እንደገና ያስገቡ።",
  missing_info:
    "ሪፖርቱን ለማጠናቀቅ አንዳንድ መረጃዎች ይቀሩናል። እባክዎ [የጎደለውን መረጃ] ያስገቡ።",
  no_info: "ይህን ጥያቄ በትክክል ለመመለስ በአሁኑ ጊዜ በቂ የተረጋገጠ መረጃ አላገኘሁም።",
  no_info_rephrase: "ጥያቄዎን በሌላ መንገድ ማብራራት ይፈልጋሉ?",
  tech_error:
    "ይቅርታ፣ በአሁኑ ጊዜ ጥያቄዎን ማስተናገድ አልቻልኩም። እባክዎ ከጥቂት ጊዜ በኋላ እንደገና ይሞክሩ።",
  edit_question: "እሺ፣ የትኛውን መረጃ መቀየር ይፈልጋሉ?",
  field_name: "ስም",
  field_phone: "ስልክ ቁጥር",
  field_location: "የችግሩ ቦታ",
  field_description: "የችግሩ መግለጫ",
  field_photo: "ፎቶ",
  restart_question: "ውይይቱን ከመጀመሪያው መጀመር ይፈልጋሉ?",
  opt_restart_yes: "አዎ፣ እንደገና ጀምር",
  opt_restart_no: "አይ፣ ቀጥል",
} as const;

export type StringKey = keyof typeof AM_APPROVED | keyof typeof AM_PENDING;

/** Drafts — NOT approved. See docs/strings-pending-approval.md. */
export const AM_PENDING = {
  question_prompt: "እሺ፣ ጥያቄዎን ይጻፉ።",
  edit_photo: "እባክዎ አዲሱን ፎቶ ያያይዙ።",
  photo_replace: "ፎቶ ቀይር",
  photo_remove: "ፎቶ አስወግድ",
  gps_locating: "ቦታዎን በመፈለግ ላይ…",
  gps_accuracy: "ትክክለኛነት",
  gps_map_link: "በካርታ ይመልከቱ",
  location_current: "አሁን ያለሁበት ቦታ",
  input_placeholder: "መልዕክትዎን ይጻፉ…",
  send: "ላክ",
  restart: "እንደገና ጀምር",
  close: "ዝጋ",
  assistant_title: "የAACMA AI ረዳት",
  assistant_subtitle: "በአማርኛ ወይም በእንግሊዝኛ ይጠይቁ",
  ai_down_banner: "AI ረዳቱ ለጊዜው አይገኝም። የሪፖርት ሂደቱ ግን ይቀጥላል።",
  sources: "ምንጮች",
  demo_badge: "የሙከራ ማሳያ",
  thinking: "በማሰብ ላይ…",
  attach_photo: "ፎቶ አያይዝ",
} as const;

export const EN = {
  // Appendix A reference wording where it exists; the rest are drafts (EN_PENDING_KEYS).
  greeting_hello: "Hello.",
  greeting_body:
    "I can help with AACMA information or guide you through reporting a cleaning problem.",
  greeting_ask: "How can I help?",
  opt_question: "I have a question",
  opt_report: "Report a cleaning problem",
  complaint_intro: "I can help you report that.",
  ask_photo: "Could you attach a photo of the location?",
  opt_take_photo: "Take photo",
  opt_choose_photo: "Choose from phone",
  photo_received: "Photo received. Now let's identify the location.",
  location_ask: "Is the problem at your current location?",
  opt_here: "Use my current location",
  opt_elsewhere: "Enter another location",
  gps_permission:
    "To find your location, please allow access to your device's location.",
  opt_share_location: "Share my location",
  gps_found: "Location found. Is this where the problem is?",
  opt_gps_yes: "Yes, that's right",
  opt_gps_change: "No, change location",
  manual_location: "Please tell me the sub-city and a nearby landmark or address.",
  manual_location_example: "For example: Bole sub-city, near [landmark].",
  ask_description: "Briefly describe the problem.",
  thanks: "Thank you.",
  ask_name: "What name should I put on the report?",
  ask_phone: "What phone number should the agency use to contact you?",
  review_intro:
    "Please review your name, phone number, location, description and attached photograph.",
  label_name: "Name",
  label_phone: "Phone",
  label_location: "Location",
  label_description: "Description",
  label_photo: "Attached photo",
  review_question: "Is this information correct?",
  opt_confirm: "Confirm",
  opt_edit: "Edit details",
  receipt_thanks: "Thank you.",
  receipt_reference: "Your demonstration reference is",
  receipt_notice: "Demonstration only — no complaint has been submitted to AACMA.",
  gps_failed:
    "We couldn't get your location. That's fine — you can describe where the problem is instead.",
  photo_failed: "The photo couldn't be attached. Please try again.",
  phone_invalid:
    "That phone number doesn't look right. Please check it and enter it again.",
  missing_info:
    "A few details are still needed to complete the report. Please provide: [missing].",
  no_info:
    "I couldn't find enough verified information to answer that accurately right now.",
  no_info_rephrase: "Would you like to rephrase your question?",
  tech_error:
    "Sorry, I can't process your request right now. Please try again in a little while.",
  edit_question: "Sure — which detail would you like to change?",
  field_name: "Name",
  field_phone: "Phone number",
  field_location: "Location",
  field_description: "Description",
  field_photo: "Photo",
  restart_question: "Would you like to start the conversation again?",
  opt_restart_yes: "Yes, start again",
  opt_restart_no: "No, continue",
  question_prompt: "Sure — what would you like to know?",
  edit_photo: "Please attach the new photo.",
  photo_replace: "Replace photo",
  photo_remove: "Remove photo",
  gps_locating: "Finding your location…",
  gps_accuracy: "accuracy",
  gps_map_link: "View on map",
  location_current: "Current location",
  input_placeholder: "Type your message…",
  send: "Send",
  restart: "Start again",
  close: "Close",
  assistant_title: "AACMA AI Assistant",
  assistant_subtitle: "English or Amharic",
  ai_down_banner:
    "The AI assistant is temporarily unavailable. Report intake still works.",
  sources: "Sources",
  demo_badge: "Demo",
  thinking: "Thinking…",
  attach_photo: "Attach photo",
} as const satisfies Record<StringKey, string>;

/** English keys taken from Appendix A; everything else in EN is a draft. */
export const EN_APPENDIX_A_KEYS: readonly StringKey[] = [
  "greeting_hello",
  "greeting_body",
  "greeting_ask",
  "complaint_intro",
  "ask_photo",
  "location_ask",
  "opt_here",
  "opt_elsewhere",
  "manual_location",
  "ask_description",
  "ask_name",
  "ask_phone",
  "review_intro",
  "opt_confirm",
  "opt_edit",
  "receipt_notice",
];

const AM: Record<StringKey, string> = { ...AM_APPROVED, ...AM_PENDING };

export function t(lang: Lang, key: StringKey): string {
  return lang === "am" ? AM[key] : EN[key];
}

/** Fills the bracketed placeholder in the "missing information" message. */
export function missingInfo(lang: Lang, fields: string[]): string {
  const list = fields.join(lang === "am" ? "፣ " : ", ");
  return lang === "am"
    ? AM.missing_info.replace("[የጎደለውን መረጃ]", list)
    : EN.missing_info.replace("[missing]", list);
}

export const DEMO_REFERENCE = "DEMO-AACMA-001";
