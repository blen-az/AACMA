/**
 * Report photos on Cloudinary (unsigned upload preset — no API secret needed).
 * Uploads happen from our server, so the browser flow is unchanged.
 * Cloudinary generates a random public id, so URLs are unguessable but public:
 * fine for photos of waste; never upload anything containing personal data.
 */
export type CloudPhoto = { url: string; publicId: string; width?: number; height?: number };

export function cloudinaryConfigured(): boolean {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET);
}

export async function uploadPhoto(photo: { mimeType: string; base64: string }): Promise<CloudPhoto> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const form = new FormData();
  form.append("file", `data:${photo.mimeType};base64,${photo.base64}`);
  form.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET!);
  const folder = process.env.CLOUDINARY_FOLDER;
  if (folder) form.append("folder", folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(30_000),
  });
  const json = (await res.json().catch(() => ({}))) as { secure_url?: string; public_id?: string; width?: number; height?: number; error?: { message?: string } };
  if (!res.ok || !json.secure_url) throw new Error(`Cloudinary upload failed (${res.status}): ${json.error?.message ?? "no URL"}`);
  return { url: json.secure_url, publicId: json.public_id ?? "", width: json.width, height: json.height };
}

/** A resized delivery URL (smaller, auto format) for display in the dashboard. */
export function displayUrl(url: string, width = 1200): string {
  return url.replace("/image/upload/", `/image/upload/c_limit,w_${width},q_auto,f_auto/`);
}

/** Downloads the image back as base64 (for the AI assessment). */
export async function fetchPhoto(url: string): Promise<{ mimeType: string; base64: string }> {
  const res = await fetch(displayUrl(url, 1280).replace(",f_auto", ",f_jpg"), { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Cloudinary fetch failed (${res.status})`);
  return { mimeType: "image/jpeg", base64: Buffer.from(await res.arrayBuffer()).toString("base64") };
}
