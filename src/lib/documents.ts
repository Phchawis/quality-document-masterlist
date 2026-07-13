import { prisma } from "./db";
import { STATUS_META, KIND_META, ACK_TYPES, beDate } from "./reference";
import type { DocStatus } from "@/generated/prisma/enums";
import type { Prisma as PrismaNS } from "@/generated/prisma/client";

export type DocumentWithRelations = Awaited<ReturnType<typeof getDocumentById>>;

export const DOC_INCLUDE = {
  type: true,
  work: true,
  category: true,
  subCategory: true,
  attachments: { orderBy: { createdAt: "asc" } },
  revisions: { orderBy: { version: "desc" } },
  acks: { include: { user: true }, orderBy: { createdAt: "desc" } },
} as const;

export async function getDocumentById(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: DOC_INCLUDE,
  });
}

export async function getDocumentByCode(code: string) {
  return prisma.document.findUnique({ where: { code }, include: DOC_INCLUDE });
}

export type MasterlistParams = { [k: string]: string | undefined };

// Shared filter → Prisma where builder, used by both the masterlist page and
// the CSV export route so they always agree.
export function buildDocWhere(sp: MasterlistParams, userId?: string): PrismaNS.DocumentWhereInput {
  const q = (sp.q ?? "").trim();
  const where: PrismaNS.DocumentWhereInput = {};
  if (sp.work && sp.work !== "ALL") where.workId = sp.work;
  if (sp.type && sp.type !== "ALL") where.typeCode = sp.type;
  if (sp.cat && sp.cat !== "ALL") where.categoryCode = sp.cat;
  if (sp.sub && sp.sub !== "ALL") where.subCategory = { name: sp.sub };
  if (sp.status && sp.status !== "ALL") where.status = sp.status as DocStatus;
  if (q) where.OR = [{ code: { contains: q, mode: "insensitive" } }, { title: { contains: q, mode: "insensitive" } }];
  if (sp.ack === "1" && userId) {
    where.status = "ACTIVE";
    where.typeCode = { in: ACK_TYPES };
    where.acks = { none: { userId } };
  }
  return where;
}

export function buildDocOrderBy(sortKey?: string, sortDir?: string): PrismaNS.DocumentOrderByWithRelationInput[] {
  const dir = (sortDir === "desc" ? "desc" : "asc") as "asc" | "desc";
  if (sortKey === "title") return [{ title: dir }];
  if (sortKey === "date") return [{ effectiveAt: dir }];
  if (sortKey === "status") return [{ status: dir }, { code: "asc" }];
  return [{ code: dir }];
}

export function statusLabel(status: DocStatus) {
  return STATUS_META[status];
}

export function attTag(kind: keyof typeof KIND_META) {
  return KIND_META[kind];
}

export { beDate };
