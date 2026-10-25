/** Decode on the editor's device, keeping oversized pixel buffers off the shared server. */
export async function prepareImage(file: File): Promise<File> {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) throw new Error("Выберите PNG, JPEG, WebP или GIF.");
  if (file.size > 32 * 1024 * 1024) throw new Error("Исходный файл должен быть не больше 32 МБ.");
  if (file.type === "image/gif") {
    if (file.size > 8 * 1024 * 1024) throw new Error("GIF должен быть не больше 8 МБ.");
    return file;
  }
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch { throw new Error("Браузер не смог прочитать изображение. Сохраните его как JPG или PNG."); }
  try {
    // A long case screenshot remains long: cap the total pixels, not just its width.
    const ratio = Math.min(1, 2560 / bitmap.width, 16000 / bitmap.height, Math.sqrt(5_000_000 / (bitmap.width * bitmap.height)));
    if (ratio === 1 && file.size <= 4 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.floor(bitmap.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Не удалось подготовить изображение.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Не удалось сжать изображение.")), "image/webp", 0.9));
    if (blob.size > 8 * 1024 * 1024) throw new Error("Изображение осталось слишком большим. Уменьшите его перед загрузкой.");
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: blob.type });
  } finally { bitmap.close(); }
}
