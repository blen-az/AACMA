/**
 * Citizen report submission (from the assistant, after explicit confirmation).
 * Creates a case for the demo dashboard and returns its DEMO- reference.
 */
import { checkLimit, clientIp } from "@/lib/ai/limits";
import { nearestSubcity, subcityFromText } from "@/lib/cases/geo";
import { createLiveCase } from "@/lib/cases/store";
import { isValidDescription, isValidName, normalizePhone } from "@/lib/complaint/validators";

const MAX_IMAGE_B64 = 6_000_000;
const MIME = ["image/jpeg", "image/png", "image/webp"];

type Body = {
  lang?: string;
  description?: string;
  name?: string;
  phone?: string;
  location?: { mode?: string; text?: string; lat?: number; lng?: number; accuracy?: number };
  photo?: { mimeType?: string; base64?: string } | null;
};

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

export async function POST(request: Request) {
  if (checkLimit(clientIp(request))) return Response.json({ error: "rate_limited" }, { status: 429 });
  const b = (await request.json().catch(() => null)) as Body | null;
  if (!b) return Response.json({ error: "bad_request" }, { status: 400 });

  const description = str(b.description, 2000);
  const name = str(b.name, 100);
  const phone = normalizePhone(str(b.phone, 40));
  const loc = b.location ?? {};
  const mode = loc.mode === "gps" ? "gps" : "manual";
  const location = {
    mode,
    text: str(loc.text, 300) || undefined,
    lat: num(loc.lat),
    lng: num(loc.lng),
    accuracy: num(loc.accuracy),
  } as const;
  const photo =
    b.photo && typeof b.photo.base64 === "string" && MIME.includes(b.photo.mimeType ?? "") && b.photo.base64.length <= MAX_IMAGE_B64
      ? { mimeType: b.photo.mimeType!, base64: b.photo.base64 }
      : null;

  if (!isValidDescription(description) || !isValidName(name) || !phone) {
    return Response.json({ error: "invalid_fields" }, { status: 400 });
  }
  if (mode === "manual" ? !location.text : location.lat === undefined || location.lng === undefined) {
    return Response.json({ error: "invalid_location" }, { status: 400 });
  }

  const textSubcity = location.text ? subcityFromText(location.text) : null;
  const gpsSubcity = !textSubcity && location.lat !== undefined ? nearestSubcity(location.lat, location.lng!) : null;

  const c = await createLiveCase({
    lang: b.lang === "am" ? "am" : "en",
    description,
    reporterName: name,
    reporterPhone: phone,
    location,
    photo,
    subcity: textSubcity ?? gpsSubcity,
    subcityApprox: Boolean(gpsSubcity),
  });
  console.log(JSON.stringify({ event: "case_created", id: c.id, subcity: c.subcity, hasPhoto: c.hasPhoto }));
  return Response.json({ id: c.id, reference: c.reference, token: c.token });
}
