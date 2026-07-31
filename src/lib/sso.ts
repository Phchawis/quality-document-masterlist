import { SignJWT } from "jose";

// เซ็น token อายุสั้นให้ MedTech (ระบบ Wedapp LAB แยกต่างหาก) รับรองว่าเป็นผู้ใช้คนเดียวกัน
// โดยไม่ส่งรหัสผ่านหรือสิทธิ์ข้ามระบบ — Wedapp LAB เป็นผู้ตัดสินสิทธิ์เองจากทะเบียนผู้ใช้ของตัวเอง
// คนละ secret กับ SESSION_SECRET ที่เซ็น session cookie ภายในของ Masterlist
const ALG = "HS256";
const TTL_SECONDS = 60; // อายุสั้นมาก — ลิงก์นี้ถูกแลกเป็นเซสชันจริงทันทีที่คลิก ไม่ควรอยู่ได้นาน

function secret(): Uint8Array {
  const s = process.env.SSO_SHARED_SECRET;
  if (!s) throw new Error("SSO_SHARED_SECRET is not set");
  // กุญแจ HS256 ที่สั้นเกินไปถูก brute-force ได้ — บังคับอย่างน้อย 32 ตัวอักษร
  if (s.length < 32) throw new Error("SSO_SHARED_SECRET must be at least 32 characters");
  return new TextEncoder().encode(s);
}

export const SSO_ENABLED = !!process.env.SSO_SHARED_SECRET;

export async function signMedtechHandoff(username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setIssuer("masterlist")
    .setAudience("tuh-lab-qms")
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secret());
}
