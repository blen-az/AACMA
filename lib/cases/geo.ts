/**
 * Addis Ababa's 11 sub-cities with APPROXIMATE centre points, used only to
 * place sample cases and to suggest a sub-city for GPS reports (marked "approx.").
 * Routing rules (central dispatch vs sub-city) remain "to be confirmed" with AACMA.
 */
export const SUBCITIES = [
  { name: "Addis Ketema", am: "አዲስ ከተማ", lat: 9.035, lng: 38.728 },
  { name: "Akaky Kaliti", am: "አቃቂ ቃሊቲ", lat: 8.89, lng: 38.785 },
  { name: "Arada", am: "አራዳ", lat: 9.038, lng: 38.752 },
  { name: "Bole", am: "ቦሌ", lat: 8.995, lng: 38.79 },
  { name: "Gullele", am: "ጉለሌ", lat: 9.07, lng: 38.735 },
  { name: "Kirkos", am: "ቂርቆስ", lat: 9.008, lng: 38.762 },
  { name: "Kolfe Keranio", am: "ኮልፌ ቀራኒዮ", lat: 9.01, lng: 38.695 },
  { name: "Lemi Kura", am: "ለሚ ኩራ", lat: 9.025, lng: 38.87 },
  { name: "Lideta", am: "ልደታ", lat: 9.012, lng: 38.737 },
  { name: "Nifas Silk-Lafto", am: "ንፋስ ስልክ ላፍቶ", lat: 8.958, lng: 38.742 },
  { name: "Yeka", am: "የካ", lat: 9.045, lng: 38.82 },
] as const;

export const SUBCITY_NAMES: string[] = SUBCITIES.map((s) => s.name);

export const TEAMS = ["Central dispatch", ...SUBCITY_NAMES.map((n) => `${n} cleansing team`)];

/** Finds a sub-city named in free text (English or Amharic). */
export function subcityFromText(text: string): string | null {
  const t = text.toLowerCase();
  for (const s of SUBCITIES) {
    const variants = [s.name.toLowerCase(), s.name.toLowerCase().replace(/[-\s]/g, ""), s.am];
    if (variants.some((v) => t.includes(v) || t.replace(/[-\s]/g, "").includes(v))) return s.name;
  }
  if (/nifas\s*silk|lafto/.test(t)) return "Nifas Silk-Lafto";
  if (/kolfe/.test(t)) return "Kolfe Keranio";
  if (/akaki|akaky|kaliti/.test(t)) return "Akaky Kaliti";
  return null;
}

/** Nearest sub-city centre to a coordinate — an approximation, not a boundary lookup. */
export function nearestSubcity(lat: number, lng: number): string | null {
  // Only inside a rough Addis Ababa bounding box.
  if (lat < 8.8 || lat > 9.15 || lng < 38.6 || lng > 38.95) return null;
  let best: string | null = null;
  let bestD = Infinity;
  for (const s of SUBCITIES) {
    const d = (s.lat - lat) ** 2 + ((s.lng - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bestD) {
      bestD = d;
      best = s.name;
    }
  }
  return best;
}
