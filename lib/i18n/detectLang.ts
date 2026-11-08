import type { Lang } from "./strings";

const ETHIOPIC = /[ሀ-᎟ⶀ-⷟꬀-꬯]/g;
const LATIN = /[A-Za-z]/g;

/**
 * Detects the language of a typed message from its script.
 * Returns null when the text has too few letters to tell (numbers, "ok", emoji),
 * so the conversation keeps its current language.
 */
export function detectLang(text: string): Lang | null {
  const ethiopic = text.match(ETHIOPIC)?.length ?? 0;
  const latin = text.match(LATIN)?.length ?? 0;
  if (ethiopic >= 2 && ethiopic >= latin) return "am";
  if (latin >= 3 && latin > ethiopic) return "en";
  return null;
}
