/** 카탈로그 품목 사진 등 클라이언트 전용 업로드 한도 (바이트) */
export const MAX_CATALOG_IMAGE_BYTES = 600 * 1024;

export type ReadImageResult =
  | { ok: true; dataUrl: string }
  | { ok: false; reason: string };

/**
 * 이미지 파일을 data URL로 읽습니다. 브라우저 전용.
 */
export async function readImageFileAsDataUrl(
  file: File,
  maxBytes: number,
): Promise<ReadImageResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, reason: "이미지 파일만 넣을 수 있습니다." };
  }
  if (file.size > maxBytes) {
    const kb = Math.round(maxBytes / 1024);
    return {
      ok: false,
      reason: `파일이 너무 큽니다. ${kb}KB 이하로 올려 주세요.`,
    };
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        resolve({ ok: false, reason: "파일을 읽지 못했습니다." });
        return;
      }
      resolve({ ok: true, dataUrl: result });
    };
    reader.onerror = () =>
      resolve({ ok: false, reason: "파일을 읽지 못했습니다." });
    reader.readAsDataURL(file);
  });
}
