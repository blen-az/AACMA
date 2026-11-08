/**
 * Field validation for the complaint intake (spec §7, C6, T08).
 * Values the citizen types are stored verbatim; only the phone number is
 * normalised, and only for display/validation.
 */

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/**
 * Accepts common Ethiopian mobile formats:
 * 09XXXXXXXX, 07XXXXXXXX, 9XXXXXXXX, +2519XXXXXXXX, 2519XXXXXXXX, 002519XXXXXXXX
 * (and the 7-prefixed equivalents). Spaces, dashes, dots and brackets are ignored.
 * Returns the number normalised to +251XXXXXXXXX, or null if invalid.
 */
export function normalizePhone(input: string): string | null {
  const raw = input.trim();
  if (!/^[+\d\s\-().]+$/.test(raw)) return null;
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^[79]\d{8}$/.test(digits)) return `+251${digits}`;
  if (/^0[79]\d{8}$/.test(digits)) return `+251${digits.slice(1)}`;
  if (/^251[79]\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}

/** +251911234567 → +251 91 123 4567 */
export function formatPhone(normalized: string): string {
  const m = normalized.match(/^\+251(\d{2})(\d{3})(\d{4})$/);
  return m ? `+251 ${m[1]} ${m[2]} ${m[3]}` : normalized;
}

/** True when the text looks like it is mostly a phone number attempt. */
export function looksLikePhoneAttempt(input: string): boolean {
  const digits = input.replace(/\D/g, "").length;
  return digits >= 5 && digits / input.replace(/\s/g, "").length > 0.6;
}

export function isValidName(input: string): boolean {
  const v = input.trim();
  return v.length >= 2 && v.length <= 80 && /\p{L}/u.test(v) && !/\d{3,}/.test(v);
}

/** A short answer that can be taken as a name without asking the model. */
export function isPlainNameAnswer(input: string): boolean {
  const v = input.trim();
  return isValidName(v) && v.split(/\s+/).length <= 5 && !/[?？፧]/.test(v);
}

export function isValidDescription(input: string): boolean {
  return input.trim().length >= 5;
}

export function isValidLocationText(input: string): boolean {
  return input.trim().length >= 3;
}

export type PhotoCheck = { ok: true } | { ok: false; reason: "type" | "size" };

export function checkPhoto(file: { type: string; size: number }): PhotoCheck {
  if (!file.type.startsWith("image/")) return { ok: false, reason: "type" };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, reason: "size" };
  return { ok: true };
}

/** Rough check used only when the AI is unavailable: is this a question? */
export function looksLikeQuestion(input: string): boolean {
  const v = input.trim().toLowerCase();
  return (
    /[?？፧]\s*$/.test(v) ||
    /^(what|when|where|why|how|who|which|can|could|do|does|is|are|should)\b/.test(v)
  );
}

/** Fallback complaint-intent heuristic, used only when the AI is unavailable. */
export function looksLikeComplaint(input: string): boolean {
  return /garbage|waste|trash|rubbish|litter|collect|dump|ቆሻሻ|ጽዳት|አልተሰበሰበ/i.test(input);
}
