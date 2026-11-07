// ফোনের বড় ছবি (৪–১০ MB) সার্ভারে পাঠানোর আগে ছোট করা হয়।
// কারণ nginx/aaPanel এর ডিফল্ট আপলোড সীমা ১ MB — বড় ছবি হলে "সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না" দেখাত।
export async function shrinkImage(file: File, maxSide = 1280, quality = 0.82): Promise<File> {
  if (typeof document === "undefined" || !/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  if (file.size < 300 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch { return file; }
}

export async function shrinkForm(fd: FormData): Promise<FormData> {
  const out = new FormData();
  for (const [k, v] of fd.entries()) {
    out.append(k, v instanceof File ? await shrinkImage(v) : v);
  }
  return out;
}
