"use server";

import { getCurrentUser } from "@/lib/auth";
import { signMedtechHandoff, SSO_ENABLED } from "@/lib/sso";
import { WORKS } from "@/lib/reference";

// คืนลิงก์ไปยัง Wedapp LAB (งาน MEDTECH) พร้อม token เข้าสู่ระบบอายุสั้นต่อท้าย
// ถ้ายังไม่ได้ตั้งค่า SSO_SHARED_SECRET หรือหาผู้ใช้ปัจจุบันไม่เจอ จะคืนลิงก์เปล่า (ไม่มี token)
// ให้ผู้ใช้ไปกรอกชื่อผู้ใช้งาน/รหัสผ่านที่ Wedapp LAB เองตามปกติ
export async function getMedtechLink(): Promise<string> {
  const medtech = WORKS.find((w) => w.id === "MEDTECH");
  const baseUrl = medtech?.externalUrl;
  if (!baseUrl) return "";

  const user = await getCurrentUser();
  if (!user || !SSO_ENABLED) return baseUrl;

  try {
    const token = await signMedtechHandoff(user.username);
    return `${baseUrl}/?sso=${encodeURIComponent(token)}`;
  } catch {
    return baseUrl;
  }
}
