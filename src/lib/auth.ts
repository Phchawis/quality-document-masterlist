import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { readSession } from "./session";
import { can, type Perm } from "./reference";
import type { UserModel } from "@/generated/prisma/models";

// Resolves the authenticated user for the current request (deduped per render).
export const getCurrentUser = cache(async (): Promise<UserModel | null> => {
  const session = await readSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user || !user.isActive) return null;
  return user;
});

export async function requireUser(): Promise<UserModel> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // บัญชีที่ยังใช้รหัสชั่วคราวที่ผู้ดูแลตั้งให้ ต้องตั้งรหัสของตัวเองก่อนใช้งานส่วนอื่น
  // (บังคับที่ layout ของทุกหน้าในระบบ ไม่ใช่แค่ซ่อนเมนู)
  // หน้านี้อยู่นอกกลุ่ม (app) โดยตั้งใจ ไม่งั้น layout จะเรียก requireUser แล้ว redirect วนซ้ำ
  if (user.mustChangePassword) redirect("/change-password");
  return user;
}

/** ใช้ในหน้า "ตั้งรหัสผ่านใหม่" เท่านั้น — ต้องเข้าถึงได้ทั้งที่ยังติดธงอยู่ ไม่งั้นจะวนซ้ำ */
export async function requireUserAllowPasswordChange(): Promise<UserModel> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePerm(perm: Perm): Promise<UserModel> {
  const user = await requireUser();
  if (!can(user.role, perm)) redirect("/");
  return user;
}
