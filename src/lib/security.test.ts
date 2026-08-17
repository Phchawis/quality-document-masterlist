/* ทดสอบฟังก์ชันความปลอดภัย — เป็น regression test ของช่องโหว่ที่เคยเจอจริง
   ถ้าใครแก้แล้วเปิดช่องกลับมา เทสต์ชุดนี้ต้องจับได้ */
import { describe, test, expect } from "vitest";
import { safeNext, csvCell } from "./security";

describe("safeNext — กัน open redirect หลังเข้าสู่ระบบ", () => {
  test("path ภายในปกติ ผ่านได้", () => {
    expect(safeNext("/masterlist")).toBe("/masterlist");
    expect(safeNext("/documents/abc123")).toBe("/documents/abc123");
    expect(safeNext("/masterlist?status=ACTIVE")).toBe("/masterlist?status=ACTIVE");
  });

  test("โดเมนภายนอกถูกปฏิเสธทุกรูปแบบ", () => {
    // "//evil.com" เบราว์เซอร์ตีความเป็น https://evil.com — ช่องโหว่ที่เคยมีจริง
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("http://evil.example")).toBe("/");
    expect(safeNext("javascript:alert(1)")).toBe("/");
    expect(safeNext("//evil.example/path?x=1")).toBe("/");
  });

  test("ค่าว่างหรือค่าผิดชนิด → กลับหน้าแรก", () => {
    expect(safeNext("")).toBe("/");
    expect(safeNext(undefined as unknown as string)).toBe("/");
    expect(safeNext(null as unknown as string)).toBe("/");
    expect(safeNext(123 as unknown as string)).toBe("/");
  });
});

describe("csvCell — กัน CSV formula injection ในไฟล์ส่งออก", () => {
  test("ข้อความปกติไม่ถูกเปลี่ยน", () => {
    expect(csvCell("คู่มือคุณภาพ")).toBe("คู่มือคุณภาพ");
    expect(csvCell("HEM-WI-007")).toBe("HEM-WI-007");
    expect(csvCell(42)).toBe("42");
  });

  test("สูตร Excel ถูกทำให้ไม่ทำงาน (ใส่ ' นำหน้าค่า)", () => {
    // ถ้าไม่กัน ชื่อเอกสารแบบนี้จะรันเป็นสูตรตอนเปิดใน Excel
    // ค่าที่ไม่มีอักขระพิเศษของ CSV จะขึ้นต้นด้วย ' ตรง ๆ
    expect(csvCell("+1+1")).toMatch(/^'\+/);
    expect(csvCell("-1+1")).toMatch(/^'-/);
    expect(csvCell("@SUM(A1)")).toMatch(/^'@/);
    expect(csvCell("\tcmd")).toMatch(/^'\t/);
    // ค่าที่มี quote จะถูกครอบด้วย " อีกชั้น — ' ต้องอยู่ถัดจาก quote เปิด
    expect(csvCell('=HYPERLINK("https://evil.example")')).toMatch(/^"'=/);
  });

  test("อักขระพิเศษของ CSV ถูก escape ถูกต้อง", () => {
    expect(csvCell("ก,ข")).toBe('"ก,ข"');
    expect(csvCell('เขา "พูด" ว่า')).toBe('"เขา ""พูด"" ว่า"');
    expect(csvCell("บรรทัด1\nบรรทัด2")).toBe('"บรรทัด1\nบรรทัด2"');
  });

  test("ค่าว่างกลายเป็นสตริงว่าง ไม่ใช่ null/undefined", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell("")).toBe("");
  });

  test("สูตรที่มี comma ด้วย ต้องทั้ง escape และกันสูตร", () => {
    const out = csvCell('=cmd|"/c calc"!A1,x');
    expect(out.startsWith('"')).toBe(true); // ถูก quote เพราะมี comma
    expect(out).toContain("'="); // และมี ' กันสูตร
  });
});
