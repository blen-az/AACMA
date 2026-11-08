/**
 * Browser-only: downscale a local photo (object URL) to a JPEG for upload to the
 * vision endpoint. Keeps requests small on mobile data and within free-tier limits.
 */
export async function toJpegBase64(url: string, maxSide = 1280, quality = 0.85): Promise<{ mimeType: string; base64: string }> {
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  await img.decode();
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.fillStyle = "#fff"; // transparent PNGs → white, not black
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return { mimeType: "image/jpeg", base64: dataUrl.slice(dataUrl.indexOf(",") + 1) };
}
