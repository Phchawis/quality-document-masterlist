/* ฟังก์ชันความปลอดภัยขนาดเล็กที่ใช้ร่วมกัน — แยกออกมาเพื่อให้ทดสอบอัตโนมัติได้
   (ของเดิมฝังอยู่ในไฟล์ route/server action ซึ่ง import มาทดสอบไม่ได้) */

/** ปลายทางหลังเข้าสู่ระบบต้องเป็น path ภายในเท่านั้น — กัน open redirect
 *  "//evil.com" และ "/\evil.com" ถูกเบราว์เซอร์ตีความเป็นโดเมนภายนอก จึงต้องปฏิเสธ */
export function safeNext(next: string): string {
  if (typeof next !== "string") return "/";
  if (!next.startsWith("/")) return "/";
  if (next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}

/** เตรียมข้อความหนึ่งเซลล์สำหรับไฟล์ CSV
 *  - กัน CSV formula injection: เซลล์ที่ขึ้นต้นด้วย = + - @ tab CR จะถูกใส่ ' นำหน้า
 *    (ไม่งั้นชื่อเอกสารอย่าง =HYPERLINK(...) จะทำงานเป็นสูตรเมื่อเปิดใน Excel)
 *  - ใส่ quote เมื่อมี comma / quote / ขึ้นบรรทัดใหม่ และ escape quote ด้วยการทำซ้ำ */
export function csvCell(v: string | number | null | undefined): string {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
