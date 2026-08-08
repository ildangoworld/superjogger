const AVATAR_MAX_BYTES = 100 * 1024;
const AVATAR_MAX_EDGE = 512;

export async function compressAvatarFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 올릴 수 있어요.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    AVATAR_MAX_EDGE / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("이미지를 처리하지 못했어요.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.85;
  let blob: Blob | null = null;
  while (quality >= 0.4) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });
    if (blob && blob.size <= AVATAR_MAX_BYTES) {
      break;
    }
    quality -= 0.1;
  }

  if (!blob || blob.size > AVATAR_MAX_BYTES) {
    throw new Error("이미지를 100KB 이하로 줄이지 못했어요. 다른 사진을 골라 주세요.");
  }

  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}
