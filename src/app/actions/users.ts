"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_ORDER, WORKS } from "@/lib/reference";
import type { Role } from "@/generated/prisma/enums";

export type UserActionResult = { ok: boolean; error?: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SYSADMIN") return null;
  return user;
}

function validRole(v: string): v is Role {
  return (ROLE_ORDER as string[]).includes(v);
}

export async function createUser(formData: FormData): Promise<UserActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "เฉพาะผู้ดูแลระบบเท่านั้น" };

  const username = String(formData.get("username") || "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") || "").trim();
  const role = String(formData.get("role") || "");
  const workId = String(formData.get("workId") || "") || null;
  const password = String(formData.get("password") || "");

  if (!/^[a-z0-9._-]{3,32}$/.test(username)) return { ok: false, error: "ชื่อผู้ใช้ต้องเป็น a-z 0-9 . _ - ความยาว 3–32 ตัว" };
  if (!fullName) return { ok: false, error: "กรุณาระบุชื่อ-นามสกุล" };
  if (!validRole(role)) return { ok: false, error: "บทบาทไม่ถูกต้อง" };
  if (password.length < 8) return { ok: false, error: "รหัสผ่านอย่างน้อย 8 ตัวอักษร" };
  if (workId && !WORKS.some((w) => w.id === workId)) return { ok: false, error: "งานไม่ถูกต้อง" };

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return { ok: false, error: "มีชื่อผู้ใช้นี้อยู่แล้ว" };

  await prisma.user.create({
    data: { username, fullName, role, workId, passwordHash: await bcrypt.hash(password, 10) },
  });
  await prisma.auditLog.create({ data: { userId: admin.id, userName: admin.fullName, action: "CREATE_USER", detail: `สร้างผู้ใช้ ${username} (${role})` } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateUser(userId: string, formData: FormData): Promise<UserActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "เฉพาะผู้ดูแลระบบเท่านั้น" };

  const fullName = String(formData.get("fullName") || "").trim();
  const role = String(formData.get("role") || "");
  const workId = String(formData.get("workId") || "") || null;
  if (!fullName) return { ok: false, error: "กรุณาระบุชื่อ-นามสกุล" };
  if (!validRole(role)) return { ok: false, error: "บทบาทไม่ถูกต้อง" };

  await prisma.user.update({ where: { id: userId }, data: { fullName, role, workId } });
  await prisma.auditLog.create({ data: { userId: admin.id, userName: admin.fullName, action: "UPDATE_USER", detail: `แก้ไขผู้ใช้ ${userId}` } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function resetPassword(userId: string, password: string): Promise<UserActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "เฉพาะผู้ดูแลระบบเท่านั้น" };
  if (password.length < 8) return { ok: false, error: "รหัสผ่านอย่างน้อย 8 ตัวอักษร" };
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  await prisma.auditLog.create({ data: { userId: admin.id, userName: admin.fullName, action: "RESET_PASSWORD", detail: `รีเซ็ตรหัสผ่านผู้ใช้ ${userId}` } });
  revalidatePath("/admin/users");
  return { ok: true };
}

// Any logged-in user changes their own password (must verify the current one).
export async function changeOwnPassword(formData: FormData): Promise<UserActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };

  const current = String(formData.get("current") || "");
  const next = String(formData.get("next") || "");
  const confirm = String(formData.get("confirm") || "");

  if (next.length < 8) return { ok: false, error: "รหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร" };
  if (next !== confirm) return { ok: false, error: "รหัสผ่านใหม่และการยืนยันไม่ตรงกัน" };

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) return { ok: false, error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  await prisma.auditLog.create({ data: { userId: user.id, userName: user.fullName, action: "CHANGE_PASSWORD", detail: "เปลี่ยนรหัสผ่านตนเอง" } });
  return { ok: true };
}

export async function toggleActive(userId: string): Promise<UserActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "เฉพาะผู้ดูแลระบบเท่านั้น" };
  if (userId === admin.id) return { ok: false, error: "ปิดใช้งานบัญชีตนเองไม่ได้" };
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) return { ok: false, error: "ไม่พบผู้ใช้" };
  await prisma.user.update({ where: { id: userId }, data: { isActive: !u.isActive } });
  await prisma.auditLog.create({ data: { userId: admin.id, userName: admin.fullName, action: "TOGGLE_USER", detail: `${u.isActive ? "ปิด" : "เปิด"}ใช้งาน ${u.username}` } });
  revalidatePath("/admin/users");
  return { ok: true };
}
