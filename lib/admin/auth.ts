/**
 * Admin session: a signed, expiring cookie. Uses Web Crypto so it runs in both
 * proxy.ts and route handlers. The password comes from ADMIN_PASSWORD.
 */
export const ADMIN_COOKIE = "aacma_admin";
export const SESSION_HOURS = 12;

const enc = new TextEncoder();

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

async function hmac(message: string, key = secret()): Promise<string> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Constant-time-ish comparison of two equal-purpose strings. */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkPassword(candidate: string): Promise<boolean> {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  // Compare HMACs so timing does not depend on where the strings differ.
  return same(await hmac(candidate, "pw"), await hmac(real, "pw"));
}

export async function createSession(): Promise<string> {
  const expires = Date.now() + SESSION_HOURS * 3_600_000;
  return `${expires}.${await hmac(`admin:${expires}`)}`;
}

export async function verifySession(token: string | undefined | null): Promise<boolean> {
  if (!token || !secret()) return false;
  const [exp, sig] = token.split(".");
  const expires = Number(exp);
  if (!expires || expires < Date.now() || !sig) return false;
  return same(sig, await hmac(`admin:${expires}`));
}

export function readCookie(request: Request, name = ADMIN_COOKIE): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function isAdmin(request: Request): Promise<boolean> {
  return verifySession(readCookie(request));
}
