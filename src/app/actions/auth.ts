"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSessionCookie, destroySessionCookie, readSession } from "@/lib/session";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/");

  if (!username || !password) return { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" };

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive) return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };

  await createSessionCookie({ uid: user.id, username: user.username, role: user.role });
  await prisma.auditLog.create({
    data: { userId: user.id, userName: user.fullName, action: "LOGIN", detail: `เข้าสู่ระบบ (${user.role})` },
  });

  redirect(next.startsWith("/") ? next : "/");
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
