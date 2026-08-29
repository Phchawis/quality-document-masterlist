/* ตารางชนิดไฟล์แนบที่ระบบอนุญาต — โมดูลนี้ต้องไม่ import อะไรจาก Node
   เพราะถูกใช้ทั้งฝั่งเซิร์ฟเวอร์ (storage.ts) และฝั่งเบราว์เซอร์ (ปุ่มเลือกไฟล์)
   ถ้าปล่อยให้สองฝั่งมีรายการคนละชุด จะเกิดอาการ "เลือกไฟล์ไม่ได้" หรือ
   "เลือกได้แต่อัปโหลดแล้วถูกปฏิเสธ" ซึ่งเคยเกิดขึ้นจริง

   ต้องตรงกับ ALLOWED_EXT ของระบบ Lab QMS (server/index.js) ด้วย
   ไม่งั้นไฟล์เดียวกันแนบได้ระบบหนึ่งแต่อีกระบบปฏิเสธ

   จงใจไม่รับ .svg/.htm/.html/.zip — พาสคริปต์หรือไฟล์อื่นแฝงเข้ามาได้ */

export type UploadKind = "PDF" | "WORD" | "EXCEL" | "IMAGE" | "SLIDE" | "OTHER";

export const ALLOWED_FILE_TYPES: Record<string, { kind: UploadKind; mime: string }> = {
  pdf: { kind: "PDF", mime: "application/pdf" },

  doc: { kind: "WORD", mime: "application/msword" },
  docx: { kind: "WORD", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  docm: { kind: "WORD", mime: "application/vnd.ms-word.document.macroEnabled.12" },
  dot: { kind: "WORD", mime: "application/msword" },
  dotx: { kind: "WORD", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.template" },
  odt: { kind: "WORD", mime: "application/vnd.oasis.opendocument.text" },
  rtf: { kind: "WORD", mime: "application/rtf" },

  xls: { kind: "EXCEL", mime: "application/vnd.ms-excel" },
  xlsx: { kind: "EXCEL", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  xlsm: { kind: "EXCEL", mime: "application/vnd.ms-excel.sheet.macroEnabled.12" },
  xlt: { kind: "EXCEL", mime: "application/vnd.ms-excel" },
  xltx: { kind: "EXCEL", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.template" },
  ods: { kind: "EXCEL", mime: "application/vnd.oasis.opendocument.spreadsheet" },
  csv: { kind: "EXCEL", mime: "text/csv" },

  ppt: { kind: "SLIDE", mime: "application/vnd.ms-powerpoint" },
  pptx: { kind: "SLIDE", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  ppsx: { kind: "SLIDE", mime: "application/vnd.openxmlformats-officedocument.presentationml.slideshow" },
  odp: { kind: "SLIDE", mime: "application/vnd.oasis.opendocument.presentation" },

  png: { kind: "IMAGE", mime: "image/png" },
  jpg: { kind: "IMAGE", mime: "image/jpeg" },
  jpeg: { kind: "IMAGE", mime: "image/jpeg" },
  gif: { kind: "IMAGE", mime: "image/gif" },
  webp: { kind: "IMAGE", mime: "image/webp" },
  bmp: { kind: "IMAGE", mime: "image/bmp" },
  tif: { kind: "IMAGE", mime: "image/tiff" },
  tiff: { kind: "IMAGE", mime: "image/tiff" },
  heic: { kind: "IMAGE", mime: "image/heic" },
  heif: { kind: "IMAGE", mime: "image/heif" },

  txt: { kind: "OTHER", mime: "text/plain" },
};

// ใช้เป็น accept ของ <input type="file"> ให้ตรงกับที่เซิร์ฟเวอร์รับจริงเสมอ
export const ACCEPT_ATTR = Object.keys(ALLOWED_FILE_TYPES)
  .map((e) => `.${e}`)
  .join(",");

// ขนาดสูงสุดต่อไฟล์ — ต้องไม่เกิน serverActions.bodySizeLimit ใน next.config.ts
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export function kindForExt(ext: string) {
  return ALLOWED_FILE_TYPES[ext.toLowerCase().replace(/^\./, "")] ?? null;
}
