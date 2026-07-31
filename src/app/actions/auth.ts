"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSessionCookie, destroySessionCookie, readSession } from "@/lib/session";

export type LoginState = { error?: string };

// ปลายทางหลัง login ต้องเป็น path ภายในเท่านั้น — กัน open redirect
// "//evil.com" และ "/\evil.com" ถูกเบราว์เซอร์ตีความเป็นโดเมนนอก จึงต้องปฏิเสธ
function safeNext(next: string): string {
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}

// จำกัดจำนวนครั้งที่ล็อกอินผิด (in-memory ต่อ instance) — ชะลอ brute-force
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000; // 10 นาที
const attempts = new Map<string, { count: number; first: number }>();
function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) return false;
  return rec.count >= MAX_ATTEMPTS;
}
function recordFail(key: string) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) attempts.set(key, { count: 1, first: now });
  else rec.count += 1;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const next = safeNext(String(formData.get("next") || "/"));

  if (!username || !password) return { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" };

  const key = username.toLowerCase();
  if (tooManyAttempts(key)) {
    return { error: "พยายามเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่" };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  const ok = user && user.isActive && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) {
    recordFail(key);
    // บันทึกความพยายามที่ล้มเหลวลง audit trail (ข้อกำหนดการควบคุมการเข้าถึง ISO 15189)
    await prisma.auditLog.create({
      data: { userId: user?.id ?? null, userName: username, action: "LOGIN_FAILED", detail: "เข้าสู่ระบบล้มเหลว" },
    }).catch(() => {});
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  attempts.delete(key);
  await createSessionCookie({ uid: user.id, username: user.username, role: user.role });
  await prisma.auditLog.create({
    data: { userId: user.id, userName: user.fullName, action: "LOGIN", detail: `เข้าสู่ระบบ (${user.role})` },
  });

  redirect(safeNext(next));
}

export async function logoutAction(): Promise<void> {
  const session = await readSession();
  if (session) {
    await prisma.auditLog.create({
      data: { userId: session.uid, userName: session.username, action: "LOGOUT", detail: "ออกจากระบบ" },
    });
  }
  await destroySessionCookie();
  redirect("/login");
}
