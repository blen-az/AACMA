import { ADMIN_COOKIE, adminConfigured, checkPassword, createSession, SESSION_HOURS } from "@/lib/admin/auth";
import { checkLimit, clientIp } from "@/lib/ai/limits";

export async function POST(request: Request) {
  if (!adminConfigured()) return Response.json({ error: "not_configured" }, { status: 503 });
  if (checkLimit(`login:${clientIp(request)}`)) return Response.json({ error: "rate_limited" }, { status: 429 });
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password || !(await checkPassword(body.password))) {
    return Response.json({ error: "invalid" }, { status: 401 });
  }
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": `${ADMIN_COOKIE}=${encodeURIComponent(await createSession())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_HOURS * 3600}${secure}`,
      },
    },
  );
}

export async function DELETE() {
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` } },
  );
}
