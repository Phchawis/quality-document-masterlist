// Static reference data for the Quality Document Masterlist.
// Ported from the design prototype so the DB seed and the UI share one source.

import type { Role } from "@/generated/prisma/enums";

export const DOC_TYPES = [
  { code: "QM", nameTh: "คู่มือคุณภาพ", nameEn: "Quality Manual", requiresAck: true, controlled: true },
  { code: "SOP", nameTh: "ระเบียบปฏิบัติ", nameEn: "Standard Procedure", requiresAck: true, controlled: true },
  { code: "WI", nameTh: "วิธีปฏิบัติ", nameEn: "Work Instruction", requiresAck: true, controlled: true },
  { code: "WS", nameTh: "แบบบันทึกการปฏิบัติงาน", nameEn: "Work Sheet", requiresAck: false, controlled: true },
  { code: "FM", nameTh: "แบบฟอร์มบันทึก", nameEn: "Form Sheet", requiresAck: false, controlled: true },
  { code: "EF", nameTh: "บันทึกอิเล็กทรอนิกส์", nameEn: "Electronic Form", requiresAck: false, controlled: true },
  { code: "ED", nameTh: "เอกสารอิเล็กทรอนิกส์", nameEn: "Electronic Document", requiresAck: false, controlled: true },
  { code: "SD", nameTh: "เอกสารสนับสนุน", nameEn: "Supporting Document", requiresAck: false, controlled: false },
  { code: "RF", nameTh: "เอกสารอ้างอิง", nameEn: "References", requiresAck: false, controlled: false },
] as const;

export const WORKS = [
  { id: "MEDTECH", code: "MT", nameTh: "งานห้องปฏิบัติการเทคนิคการแพทย์", nameEn: "Medical Technology Laboratory" },
  { id: "TRANSFUSION", code: "TRF", nameTh: "งานเวชศาสตร์การบริการโลหิต", nameEn: "Transfusion Medicine" },
  { id: "MICRO", code: "MCB", nameTh: "งานจุลชีววิทยา", nameEn: "Microbiology" },
] as const;

export const CATEGORIES: { code: string; nameTh: string; subs?: string[] }[] = [
  { code: "OUT", nameTh: "รับสิ่งส่งตรวจและห้องปฏิบัติการส่งต่อ" },
  { code: "HEM", nameTh: "โลหิตวิทยา" },
  { code: "MIC", nameTh: "จุลทรรศน์ศาสตร์และปรสิตวิทยา" },
  { code: "CHE", nameTh: "เคมีคลินิก" },
  {
    code: "IMM",
    nameTh: "ภูมิคุ้มกันวิทยา",
    subs: ["ภูมิคุ้มกันวิทยาและภูมิแพ้วิทยา", "ฮอร์โมนและระดับยา", "ชีวโมเลกุลทางการแพทย์", "เวชสารสนเทศห้องปฏิบัติการ"],
  },
  { code: "OPD", nameTh: "บริหารจัดการสิ่งส่งตรวจและบริการผู้ป่วยนอก" },
  { code: "THAMC", nameTh: "บริหารจัดการสิ่งส่งตรวจศูนย์การแพทย์ธรรมศาสตร์" },
  { code: "POCT", nameTh: "บริหารจัดการเครื่องมือ ณ จุดดูแลผู้ป่วย" },
  { code: "CMTL", nameTh: "ศูนย์ปฏิบัติการตรวจวินิจฉัยทางการแพทย์", subs: ["บริการศูนย์การแพทย์", "ตรวจวินิจฉัยขั้นสูง"] },
  { code: "ADS", nameTh: "ธุรการและคลังพัสดุห้องปฏิบัติการ" },
];

export const STATUS_META = {
  ACTIVE: { th: "ประกาศใช้", color: "var(--accent)", order: 0 },
  REVIEW: { th: "ระหว่างทบทวน", color: "var(--blue)", order: 1 },
  DRAFT: { th: "ฉบับร่าง", color: "var(--amber)", order: 2 },
  OBSOLETE: { th: "ยกเลิกใช้", color: "var(--red)", order: 3 },
} as const;

export const KIND_META = {
  PDF: { tag: "PDF", label: "เปิดดู", color: "var(--red)", ext: "pdf" },
  WORD: { tag: "DOC", label: "แก้ไข", color: "var(--blue)", ext: "docx" },
  EXCEL: { tag: "XLS", label: "แก้ไข", color: "var(--accent)", ext: "xlsx" },
  URL: { tag: "URL", label: "เปิดลิงก์", color: "var(--amber)", ext: "" },
} as const;

// Role permission matrix — mirrors the prototype's role.p table.
export type Perm =
  | "register"
  | "publish"
  | "revise"
  | "acknowledge"
  | "approve"
  | "upload"
  | "manage"
  | "propose"
  | "audit" // ดูบันทึกการตรวจสอบ
  | "viewUsers"; // ดูรายชื่อผู้ใช้ (อ่านอย่างเดียว — จัดการได้เฉพาะ manage)

export const ROLE_META: Record<
  Role,
  { th: string; en: string; perms: string; p: Partial<Record<Perm, boolean>> }
> = {
  SYSADMIN: {
    th: "ผู้ดูแลระบบ (Administrator)",
    en: "System Admin",
    perms: "สิทธิ์สูงสุด · จัดการระบบทั้งหมด",
    p: { register: true, publish: true, revise: true, acknowledge: true, approve: true, upload: true, manage: true, audit: true, viewUsers: true },
  },
  HEAD_WORK: {
    th: "หัวหน้างาน",
    en: "Division Head",
    perms: "อนุมัติ · ประกาศใช้ · แก้ไข",
    p: { register: true, publish: true, revise: true, acknowledge: true, approve: true, upload: true, audit: true, viewUsers: true },
  },
  HEAD_CAT: {
    th: "หัวหน้าหมวดงาน",
    en: "Section Head",
    perms: "ประกาศใช้ · แก้ไข · ลงทะเบียน",
    p: { register: true, publish: true, revise: true, acknowledge: true, upload: true, audit: true },
  },
  MED_TECH: {
    th: "นักเทคนิคการแพทย์",
    en: "Med Technologist",
    perms: "อ่าน · รับทราบ · เสนอแก้ไข",
    p: { acknowledge: true, propose: true },
  },
  ASSISTANT: {
    th: "ผู้ช่วยนักเทคนิคการแพทย์",
    en: "MT Assistant",
    perms: "อ่าน · รับทราบ",
    p: { acknowledge: true },
  },
  ADMIN_STAFF: {
    th: "เจ้าหน้าที่ธุรการ",
    en: "Office Clerk",
    perms: "อ่าน · รับทราบ",
    p: { acknowledge: true },
  },
  DOC_MANAGER: {
    th: "ผู้จัดการเอกสาร",
    en: "Document Manager",
    perms: "ลงทะเบียน · แนบไฟล์ · รับทราบ",
    p: { register: true, upload: true, acknowledge: true, audit: true },
  },
};

export const ROLE_ORDER: Role[] = ["SYSADMIN", "HEAD_WORK", "HEAD_CAT", "MED_TECH", "ASSISTANT", "ADMIN_STAFF", "DOC_MANAGER"];

export function can(role: Role | undefined | null, perm: Perm): boolean {
  if (!role) return false;
  return !!ROLE_META[role]?.p[perm];
}

export function canUserEdit(user: { role: Role; username: string } | null | undefined, perm: Perm): boolean {
  if (!user) return false;
  return can(user.role, perm);
}

export const ACK_TYPES = ["QM", "SOP", "WI"];

export function beDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok"
  }).format(date);
}

export function initials(name: string): string {
  if (!name) return "";
  const clean = name.replace(/^(ทนพญ\.|ทนพ\.|นางสาว|นาง|นาย)/, "").trim();
  const parts = clean.split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}
