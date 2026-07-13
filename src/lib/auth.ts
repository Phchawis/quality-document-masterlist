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
  return user;
}

export async function requirePerm(perm: Perm): Promise<UserModel> {
  const user = await requireUser();
  if (!can(user.role, perm)) redirect("/");
  return user;
}
