"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can, canUserEdit, WORKS, KIND_META } from "@/lib/reference";
import { saveUpload, deleteStored } from "@/lib/storage";
import type { AttachmentKind } from "@/generated/prisma/enums";

const RETENTION_YEARS = [2, 5, 10];

async function log(userId: string, userName: string, action: string, documentId: string | null, detail: string) {
  await prisma.auditLog.create({ data: { userId, userName, action, documentId, detail } });
}

export type ActionResult = { ok: boolean; error?: string; documentId?: string };

// ---------- Register ----------
export async function registerDocument(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !canUserEdit(user, "register")) return { ok: false, error: "ไม่มีสิทธิ์ลงทะเบียนเอกสาร" };

  const title = String(formData.get("title") || "").trim();
  const workId = String(formData.get("work") || "");
  const typeCode = String(formData.get("type") || "");
  const catRaw = String(formData.get("cat") || "");
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const kinds = formData.getAll("kinds").map((k) => String(k).toUpperCase()) as AttachmentKind[];
  const retentionYears = parseInt(String(formData.get("retentionYears") || "2"), 10);

  if (!title) return { ok: false, error: "กรุณาระบุชื่อเอกสาร" };
  if (!code) return { ok: false, error: "กรุณาระบุรหัสเอกสาร" };
  if (!/^[A-Z0-9-]+$/.test(code)) return { ok: false, error: "รหัสเอกสารใช้ได้เฉพาะตัวอักษร A-Z, 0-9 และ -" };
  const work = WORKS.find((w) => w.id === workId);
  if (!work) return { ok: false, error: "งานไม่ถูกต้อง" };
  if (kinds.length === 0) return { ok: false, error: "กรุณาเลือกรูปแบบไฟล์แนบอย่างน้อย 1 แบบ" };
  if (!RETENTION_YEARS.includes(retentionYears)) return { ok: false, error: "ระยะเวลาจัดเก็บไม่ถูกต้อง" };
  const categoryCode = workId === "MEDTECH" ? catRaw || null : null;

  // Optional subcategory (only valid under a MEDTECH category that has one).
  const subName = String(formData.get("sub") || "").trim();
  let subCategoryId: string | null = null;
  if (categoryCode && subName) {
    const subRec = await prisma.subCategory.findUnique({
      where: { categoryCode_name: { categoryCode, name: subName } },
    });
    subCategoryId = subRec?.id ?? null;
  }

  const codeExists = await prisma.document.findUnique({ where: { code } });
  if (codeExists) return { ok: false, error: `รหัสเอกสาร ${code} มีอยู่แล้ว` };

  const typeMeta = await prisma.docType.findUnique({ where: { code: typeCode } });
  const now = new Date();

  const doc = await prisma.document.create({
    data: {
      code,
      running: 1,
      title,
      typeCode,
      workId,
      categoryCode,
      subCategoryId,
      status: "DRAFT",
      version: 1,
      description: "เอกสารลงทะเบียนใหม่ · รอตรวจสอบและประกาศใช้",
      controlled: typeMeta?.controlled ?? true,
      nextReviewAt: new Date(now.getTime() + retentionYears * 360 * 86400000),
      ownerId: user.id,
      ownerName: user.fullName,
      approverName: "",
      revisions: { create: { version: 1, byId: user.id, byName: user.fullName, note: "ลงทะเบียนเอกสารครั้งแรก" } },
      attachments: {
        create: kinds.map((kind) => ({
          kind,
          filename: kind === "URL" ? `${code} · ระบบสารสนเทศ` : `${code}.${KIND_META[kind].ext}`,
          note: "รายการเริ่มต้น · แนบไฟล์จริงได้ในหน้ารายละเอียด",
        })),
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
  if (!user || !canUserEdit(user, "revise")) return { ok: false, error: "ไม่มีสิทธิ์แก้ไขเอกสาร" };
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
  if (!user || !canUserEdit(user, "publish")) return { ok: false, error: "ไม่มีสิทธิ์ประกาศใช้" };
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

// ---------- Delete (draft only, never acknowledged — fixes registration mistakes) ----------
export async function deleteDocument(documentId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !canUserEdit(user, "register")) return { ok: false, error: "ไม่มีสิทธิ์ลบเอกสาร" };
  const doc = await prisma.document.findUnique({ where: { id: documentId }, include: { attachments: true, acks: true } });
  if (!doc) return { ok: false, error: "ไม่พบเอกสาร" };
  if (doc.status !== "DRAFT") return { ok: false, error: "ลบได้เฉพาะเอกสารสถานะฉบับร่างเท่านั้น (เอกสารที่เคยประกาศใช้ให้ใช้ปุ่มยกเลิกการใช้งานแทน)" };
  if (doc.acks.length > 0) return { ok: false, error: "มีผู้รับทราบเอกสารนี้แล้ว ไม่สามารถลบได้" };

  for (const att of doc.attachments) {
    if (att.storedName) await deleteStored(att.storedName);
  }
  await prisma.document.delete({ where: { id: documentId } });
  await log(user.id, user.fullName, "DELETE_DOC", null, `ลบเอกสาร ${doc.code} · ${doc.title}`);
  revalidatePath("/masterlist");
  revalidatePath("/");
  redirect("/masterlist");
}

// ---------- Cancel ----------
export async function cancelDocument(documentId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !canUserEdit(user, "register")) return { ok: false, error: "ไม่มีสิทธิ์ยกเลิกเอกสาร" };
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

export async function acknowledgeDocuments(documentIds: string[]): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "acknowledge")) return { ok: false, error: "ไม่มีสิทธิ์รับทราบ" };
  if (!documentIds.length) return { ok: false, error: "กรุณาเลือกเอกสารที่ต้องการรับทราบ" };

  const docs = await prisma.document.findMany({
    where: { id: { in: documentIds }, status: "ACTIVE" }
  });

  await prisma.$transaction(
    docs.map((doc) =>
      prisma.acknowledgement.upsert({
        where: { documentId_userId: { documentId: doc.id, userId: user.id } },
        update: { version: doc.version },
        create: { documentId: doc.id, userId: user.id, version: doc.version },
      })
    )
  );

  for (const doc of docs) {
    await log(user.id, user.fullName, "ACK", doc.id, `รับทราบ ${doc.code} v.${doc.version}`);
  }

  revalidatePath("/masterlist");
  revalidatePath("/");
  return { ok: true };
}

// ---------- Attachments ----------
export async function uploadAttachment(documentId: string, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !canUserEdit(user, "upload")) return { ok: false, error: "ไม่มีสิทธิ์แนบไฟล์" };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "ไม่พบไฟล์" };
  if (file.size > 50 * 1024 * 1024) return { ok: false, error: "ไฟล์ใหญ่เกิน 50MB" };

  const saved = await saveUpload(file);
  if (!saved) return { ok: false, error: "รองรับเฉพาะไฟล์ PDF, Word, Excel" };

  try {
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
  } catch {
    // Prevent orphaned files on disk if db entry creation fails
    await deleteStored(saved.storedName);
    return { ok: false, error: "เกิดข้อผิดพลาดในการบันทึกข้อมูลแนบลงฐานข้อมูล" };
  }

  revalidatePath(`/documents/${documentId}`);
  return { ok: true, documentId };
}

export async function addUrlAttachment(documentId: string, url: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !canUserEdit(user, "upload")) return { ok: false, error: "ไม่มีสิทธิ์แนบลิงก์" };
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
  if (!user || !canUserEdit(user, "upload")) return { ok: false, error: "ไม่มีสิทธิ์" };
  const att = await prisma.attachment.findUnique({ where: { id: attachmentId } });
  if (!att) return { ok: false, error: "ไม่พบไฟล์แนบ" };
  if (att.storedName) await deleteStored(att.storedName);
  await prisma.attachment.delete({ where: { id: attachmentId } });
  await log(user.id, user.fullName, "REMOVE_ATT", att.documentId, `ลบไฟล์แนบ ${att.filename}`);
  revalidatePath(`/documents/${att.documentId}`);
  return { ok: true, documentId: att.documentId };
}
