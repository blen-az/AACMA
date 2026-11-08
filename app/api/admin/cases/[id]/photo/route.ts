import { isAdmin } from "@/lib/admin/auth";
import { displayUrl } from "@/lib/cases/cloudinary";
import { getCase, getPhoto } from "@/lib/cases/store";

export async function GET(request: Request, ctx: RouteContext<"/api/admin/cases/[id]/photo">) {
  if (!(await isAdmin(request))) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const c = await getCase(id);
  if (c?.photoUrl) return Response.redirect(displayUrl(c.photoUrl), 302);
  const photo = await getPhoto(id);
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(photo.base64, "base64"), {
    headers: { "Content-Type": photo.mimeType, "Cache-Control": "private, max-age=3600" },
  });
}
