/**
 * Labels for the photo-analysis features. DRAFTS — pending Meleph approval
 * (docs/strings-pending-approval.md §4).
 */
import type { Lang } from "./strings";

const V = {
  opt_identify: ["What waste is this? (photo)", "ይህ ምን ዓይነት ቆሻሻ ነው? (ፎቶ)"],
  identify_button: ["Ask about a photo", "ስለ ፎቶ ይጠይቁ"],
  analysing: ["Analysing the photo…", "ፎቶውን በመተንተን ላይ…"],
  assessment_title: ["AI preliminary assessment", "የAI የመጀመሪያ ግምገማ"],
  assessment_for_staff: ["For AACMA staff — shown here for demonstration", "ለAACMA ሠራተኞች — ለማሳያ እዚህ ቀርቧል"],
  assessment_failed: ["The photo assessment is not available right now.", "የፎቶ ግምገማው በአሁኑ ጊዜ አይገኝም።"],
  assessment_note: ["Staff review the report and decide the final priority.", "ሪፖርቱን ሠራተኞች ገምግመው የመጨረሻውን የቅድሚያ ደረጃ ይወስናሉ።"],
  label_priority: ["Priority", "የቅድሚያ ደረጃ"],
  label_visible: ["Visible waste", "የሚታይ ቆሻሻ"],
  label_volume: ["Estimated volume", "የተገመተ መጠን"],
  label_reasons: ["Why", "ምክንያት"],
  label_risks: ["Risks", "ስጋቶች"],
  label_action: ["Suggested action", "የሚመከር እርምጃ"],
  label_confidence: ["Confidence", "የእርግጠኝነት ደረጃ"],
  severity_low: ["Low", "ዝቅተኛ"],
  severity_medium: ["Medium", "መካከለኛ"],
  severity_high: ["High", "ከፍተኛ"],
  severity_urgent: ["Urgent", "አስቸኳይ"],
  volume_small: ["Small", "ትንሽ"],
  volume_medium: ["Medium", "መካከለኛ"],
  volume_large: ["Large", "ትልቅ"],
  volume_very_large: ["Very large", "በጣም ትልቅ"],
  conf_low: ["Low", "ዝቅተኛ"],
  conf_medium: ["Medium", "መካከለኛ"],
  conf_high: ["High", "ከፍተኛ"],
  recyclable_yes: ["Recyclable", "እንደገና ጥቅም ላይ ይውላል"],
  recyclable_no: ["Not recyclable", "እንደገና ጥቅም ላይ አይውልም"],
  recyclable_depends: ["Depends", "እንደ ሁኔታው"],
  cat_organic: ["Organic", "የሚበሰብስ (ኦርጋኒክ)"],
  cat_plastic: ["Plastic", "ፕላስቲክ"],
  cat_paper_cardboard: ["Paper & cardboard", "ወረቀትና ካርቶን"],
  cat_metal: ["Metal", "ብረት"],
  cat_glass: ["Glass", "ብርጭቆ"],
  cat_textile: ["Textile", "ጨርቃ ጨርቅ"],
  cat_electronic: ["Electronic", "ኤሌክትሮኒክስ"],
  cat_hazardous: ["Hazardous", "አደገኛ"],
  cat_construction_debris: ["Construction debris", "የግንባታ ፍርስራሽ"],
  cat_mixed_household: ["Mixed household", "የተቀላቀለ የቤት ቆሻሻ"],
  cat_other: ["Other", "ሌላ"],
} as const;

export type VisionKey = keyof typeof V;

export function tv(lang: Lang, key: VisionKey): string {
  return V[key][lang === "am" ? 1 : 0];
}

export function tvAny(lang: Lang, key: string): string {
  return key in V ? tv(lang, key as VisionKey) : key;
}

export const VISION_STRINGS = V;
