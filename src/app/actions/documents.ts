"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can, WORKS } from "@/lib/reference";
import { nextCode } from "@/lib/documents";
import { saveUpload, deleteStored } from "@/lib/storage";
import type { AttachmentKind } from "@/generated/prisma/enums";

async function log(userId: string, userName: string, action: string, documentId: string | null, detail: string) {
  await prisma.auditLog.create({ data: { userId, userName, action, documentId, detail } });
}

export type ActionResult = { ok: boolean; error?: string; documentId?: string };

// ---------- Register ----------
export async function registerDocument(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "register")) return { ok: false, error: "ไม่มีสิทธิ์ลงทะเบียนเอกสาร" };

  const title = String(formData.get("title") || "").trim();
  const workId = String(formData.get("work") || "");
  const typeCode = String(formData.get("type") || "");
  const catRaw = String(formData.get("cat") || "");
  const kind = String(formData.get("kind") || "pdf").toUpperCase() as AttachmentKind;

  if (!title) return { ok: false, error: "กรุณาระบุชื่อเอกสาร" };
  const work = WORKS.find((w) => w.id === workId);
  if (!work) return { ok: false, error: "งานไม่ถูกต้อง" };
  const categoryCode = workId === "MEDTECH" ? catRaw || null : null;

  const prefix = workId === "MEDTECH" ? categoryCode ?? work.code : work.code;
  const { code, running } = await nextCode(prefix, typeCode);

  const typeMeta = await prisma.docType.findUnique({ where: { code: typeCode } });
  const now = new Date();

  const doc = await prisma.document.create({
    data: {
      code,
      running,
      title,
      typeCode,
      workId,
      categoryCode,
      status: "DRAFT",
      version: 1,
      description: "เอกสารลงทะเบียนใหม่ · รอตรวจสอบและประกาศใช้",
      controlled: typeMeta?.controlled ?? true,
      nextReviewAt: new Date(now.getTime() + 730 * 86400000),
      ownerId: user.id,
      ownerName: user.fullName,
      approverName: "",
      revisions: { create: { version: 1, byId: user.id, byName: user.fullName, note: "ลงทะเบียนเอกสารครั้งแรก" } },
      attachments: {
        create: {
          kind,
          filename: kind === "URL" ? `${code} · ระบบสารสนเทศ` : `${code}`,
          note: "รายการเริ่มต้น · แนบไฟล์จริงได้ในหน้ารายละเอียด",
        },
      },
    },
  });

  await log(user.id, user.fullName, "REGISTER_DOC", doc.id, `ลงทะเบียน ${code}`);
  revalidatePath("/masterlist");
  revalidatePath("/");
  redirect(`/documents/${doc.id}`);
}

// ---------- Revise ----------
export async function reviseDocument(documentId: string, note: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "revise")) return { ok: false, error: "ไม่มีสิทธิ์แก้ไขเอกสาร" };
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return { ok: false, error: "ไม่พบเอกสาร" };
  if (doc.status === "OBSOLETE") return { ok: false, error: "เอกสารถูกยกเลิกแล้ว" };

  const nv = doc.version + 1;
  await prisma.document.update({
    where: { id: documentId },
    data: {
      version: nv,
      revisedAt: new Date(),
      status: doc.status === "DRAFT" ? "DRAFT" : "ACTIVE",
      revisions: { create: { version: nv, byId: user.id, byName: user.fullName, note: note || "ปรับปรุงแก้ไขเอกสาร" } },
    },
  });
  await log(user.id, user.fullName, "REVISE", documentId, `แก้ไขเป็น v.${String(nv).padStart(2, "0")}`);
  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/masterlist");
  return { ok: true, documentId };
}

// ---------- Publish ----------
export async function publishDocument(documentId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "publish")) return { ok: false, error: "ไม่มีสิทธิ์ประกาศใช้" };
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return { ok: false, error: "ไม่พบเอกสาร" };

  const work = WORKS.find((w) => w.id === doc.workId);
  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: "ACTIVE",
      effectiveAt: doc.effectiveAt ?? new Date(),
      approverName: doc.approverName || user.fullName,
    },
  });
  await log(user.id, user.fullName, "PUBLISH", documentId, `ประกาศใช้ ${doc.code} (${work?.code})`);
  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/masterlist");
  revalidatePath("/");
  return { ok: true, documentId };
}

// ---------- Cancel ----------
export async function cancelDocument(documentId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "register")) return { ok: false, error: "ไม่มีสิทธิ์ยกเลิกเอกสาร" };
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return { ok: false, error: "ไม่พบเอกสาร" };
  await prisma.document.update({ where: { id: documentId }, data: { status: "OBSOLETE" } });
  await log(user.id, user.fullName, "CANCEL", documentId, `ยกเลิกใช้ ${doc.code}`);
  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/masterlist");
  return { ok: true, documentId };
}

// ---------- Acknowledge ----------
export async function acknowledgeDocument(documentId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "acknowledge")) return { ok: false, error: "ไม่มีสิทธิ์รับทราบ" };
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return { ok: false, error: "ไม่พบเอกสาร" };

  await prisma.acknowledgement.upsert({
    where: { documentId_userId: { documentId, userId: user.id } },
    update: { version: doc.version },
    create: { documentId, userId: user.id, version: doc.version },
  });
  await log(user.id, user.fullName, "ACK", documentId, `รับทราบ ${doc.code} v.${doc.version}`);
  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/");
  return { ok: true, documentId };
}

// ---------- Attachments ----------
export async function uploadAttachment(documentId: string, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "upload")) return { ok: false, error: "ไม่มีสิทธิ์แนบไฟล์" };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "ไม่พบไฟล์" };
  if (file.size > 50 * 1024 * 1024) return { ok: false, error: "ไฟล์ใหญ่เกิน 50MB" };

  const saved = await saveUpload(file);
  if (!saved) return { ok: false, error: "รองรับเฉพาะไฟล์ PDF, Word, Excel" };

  await prisma.attachment.create({
    data: {
      documentId,
      kind: saved.kind,
      filename: file.name,
      storedName: saved.storedName,
      size: saved.size,
      mime: saved.mime,
      note: `แนบโดย ${user.fullName}`,
      uploadedById: user.id,
    },
  });
  await log(user.id, user.fullName, "UPLOAD", documentId, `แนบไฟล์ ${file.name}`);
  revalidatePath(`/documents/${documentId}`);
  return { ok: true, documentId };
}

export async function addUrlAttachment(documentId: string, url: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "upload")) return { ok: false, error: "ไม่มีสิทธิ์แนบลิงก์" };
  let u = url.trim();
  if (!u) return { ok: false, error: "กรุณาวางลิงก์" };
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;

  await prisma.attachment.create({
    data: { documentId, kind: "URL" as AttachmentKind, filename: u, url: u, note: `แนบลิงก์โดย ${user.fullName}`, uploadedById: user.id },
  });
  await log(user.id, user.fullName, "UPLOAD_URL", documentId, `แนบลิงก์ ${u}`);
  revalidatePath(`/documents/${documentId}`);
  return { ok: true, documentId };
}

export async function removeAttachment(attachmentId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "upload")) return { ok: false, error: "ไม่มีสิทธิ์" };
  const att = await prisma.attachment.findUnique({ where: { id: attachmentId } });
  if (!att) return { ok: false, error: "ไม่พบไฟล์แนบ" };
  if (att.storedName) await deleteStored(att.storedName);
  await prisma.attachment.delete({ where: { id: attachmentId } });
  await log(user.id, user.fullName, "REMOVE_ATT", att.documentId, `ลบไฟล์แนบ ${att.filename}`);
  revalidatePath(`/documents/${att.documentId}`);
  return { ok: true, documentId: att.documentId };
}
