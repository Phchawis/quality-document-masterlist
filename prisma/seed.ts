import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { DOC_TYPES, WORKS, CATEGORIES, ROLE_META, ROLE_ORDER } from "../src/lib/reference";
import type { Role, DocStatus, AttachmentKind } from "../src/generated/prisma/enums";
import {
  DOC_GROUPS,
  SAMPLE_NAMES,
  APPROVERS,
  attFor,
  descFor,
  makeRng,
  pick,
} from "./seed-docs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEED_DEMO = process.env.SEED_DEMO !== "0";

async function main() {
  console.log("→ Seeding reference data …");

  for (const [i, t] of DOC_TYPES.entries()) {
    await prisma.docType.upsert({
      where: { code: t.code },
      update: { nameTh: t.nameTh, nameEn: t.nameEn, requiresAck: t.requiresAck, controlled: t.controlled, order: i },
      create: { code: t.code, nameTh: t.nameTh, nameEn: t.nameEn, requiresAck: t.requiresAck, controlled: t.controlled, order: i },
    });
  }

  for (const [i, w] of WORKS.entries()) {
    await prisma.work.upsert({
      where: { id: w.id },
      update: { code: w.code, nameTh: w.nameTh, nameEn: w.nameEn, order: i },
      create: { id: w.id, code: w.code, nameTh: w.nameTh, nameEn: w.nameEn, order: i },
    });
  }

  for (const [i, c] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { code: c.code },
      update: { nameTh: c.nameTh, order: i },
      create: { code: c.code, nameTh: c.nameTh, order: i },
    });
    if (c.subs) {
      for (const [j, name] of c.subs.entries()) {
        await prisma.subCategory.upsert({
          where: { categoryCode_name: { categoryCode: c.code, name } },
          update: { order: j },
          create: { categoryCode: c.code, name, order: j },
        });
      }
    }
  }

  // ---------- Admin + demo users ----------
  console.log("→ Seeding users …");
  const adminPass = process.env.ADMIN_PASSWORD || "admin1234";
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: await bcrypt.hash(adminPass, 10),
      fullName: "ทนพ.อธิป จันทร์คุณภาพ",
      role: "SYSADMIN",
    },
  });

  // One demo account per role, all password "demo1234", so every permission
  // level can be exercised. Skip in a clean production seed if you prefer.
  const demoUsers: { username: string; role: Role; fullName: string; workId?: string }[] = [
    { username: "head.work", role: "HEAD_WORK", fullName: "ทนพญ.ศิริพร วงศ์สถิต", workId: "MEDTECH" },
    { username: "head.cat", role: "HEAD_CAT", fullName: "ทนพ.ธนกร ภูวดล", workId: "MEDTECH" },
    { username: "medtech", role: "MED_TECH", fullName: "ทนพ.กิตติพงษ์ แสงทอง", workId: "MEDTECH" },
    { username: "assistant", role: "ASSISTANT", fullName: "นางสาวรัตนา ใจดี", workId: "MEDTECH" },
    { username: "admin.staff", role: "ADMIN_STAFF", fullName: "นางสาวปาริชาต ดวงแก้ว", workId: "MEDTECH" },
  ];
  const demoHash = await bcrypt.hash("demo1234", 10);
  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { username: u.username, passwordHash: demoHash, fullName: u.fullName, role: u.role, workId: u.workId },
    });
  }

  if (!SEED_DEMO) {
    console.log("✓ Reference data + admin user seeded (SEED_DEMO=0, no demo documents).");
    return;
  }

  // ---------- Demo documents (ported deterministic generation) ----------
  console.log("→ Seeding demo documents …");
  await prisma.acknowledgement.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.revision.deleteMany({});
  await prisma.auditLog.deleteMany({ where: { documentId: { not: null } } });
  await prisma.document.deleteMany({});

  const subCats = await prisma.subCategory.findMany();
  const subId = (catCode: string, name: string) =>
    subCats.find((s) => s.categoryCode === catCode && s.name === name)?.id ?? null;

  const counters: Record<string, number> = {};
  const now = Date.now();

  for (const [gi, grp] of DOC_GROUPS.entries()) {
    const work = WORKS.find((w) => w.id === grp.work)!;
    const prefix = grp.cat ? (grp.work === "MEDTECH" ? grp.cat : work.code + "-" + grp.cat) : work.code;

    for (const [ii, it] of grp.items.entries()) {
      const [tp, title, sub] = it;
      const key = prefix + "-" + tp;
      counters[key] = (counters[key] || 0) + 1;
      const running = counters[key];
      const num = String(running).padStart(3, "0");
      const code = `${prefix}-${tp}-${num}`;

      const r = makeRng(gi * 997 + ii * 131 + 7);
      const rv = [r(), r(), r(), r(), r(), r(), r(), r()];
      let status: DocStatus = "ACTIVE";
      if (tp !== "QM") {
        const s = rv[0];
        status = s < 0.7 ? "ACTIVE" : s < 0.82 ? "REVIEW" : s < 0.92 ? "DRAFT" : "OBSOLETE";
      }
      const version = tp === "QM" ? 2 + Math.floor(rv[1] * 3) : status === "DRAFT" ? 1 : 1 + Math.floor(rv[1] * 4);
      const daysAgo = 40 + Math.floor(rv[2] * 1420);
      const eff = new Date(now - daysAgo * 86400000);
      const rev = new Date(eff.getTime() + Math.floor(rv[3] * Math.min(daysAgo, 300)) * 86400000);
      const next = new Date(eff.getTime() + (730 + Math.floor(rv[4] * 365)) * 86400000);
      const owner = pick(SAMPLE_NAMES, rv[7]);
      const attKinds = attFor(tp, rv[0]) as AttachmentKind[];
      const typeMeta = DOC_TYPES.find((t) => t.code === tp)!;

      const doc = await prisma.document.create({
        data: {
          code,
          running,
          title,
          typeCode: tp,
          workId: grp.work,
          categoryCode: grp.cat,
          subCategoryId: sub ? subId(grp.cat!, sub) : null,
          status,
          version,
          description: descFor(tp, title),
          controlled: typeMeta.controlled,
          effectiveAt: status === "DRAFT" ? null : eff,
          revisedAt: rev,
          nextReviewAt: next,
          ownerName: owner,
          approverName: APPROVERS[grp.work],
        },
      });

      // Attachments
      for (const kind of attKinds) {
        const ext = kind === "PDF" ? "pdf" : kind === "WORD" ? "docx" : kind === "EXCEL" ? "xlsx" : "";
        await prisma.attachment.create({
          data: {
            documentId: doc.id,
            kind,
            filename: kind === "URL" ? `${code} · ระบบสารสนเทศ` : `${code}${ext ? "." + ext : ""}`,
            url: kind === "URL" ? "https://e-doc.hospital.local/" + code : null,
            note:
              kind === "PDF"
                ? "ฉบับประกาศใช้ · เปิดดูในเว็บ ดาวน์โหลด หรือพิมพ์"
                : kind === "URL"
                  ? "ลิงก์ระบบ แอป และ E-Document"
                  : "ต้นฉบับสำหรับดาวน์โหลดไปแก้ไข แล้วอัปโหลดกลับ",
          },
        });
      }

      // Revision history
      for (let v = version; v >= 1; v--) {
        const rr = makeRng(code.length * 37 + v * 17);
        const dt = new Date(eff.getTime() - (version - v) * (120 + Math.floor(rr() * 260)) * 86400000);
        await prisma.revision.create({
          data: {
            documentId: doc.id,
            version: v,
            byName: v === 1 ? owner : pick(SAMPLE_NAMES, rr()),
            note:
              v === 1
                ? "จัดทำและประกาศใช้ครั้งแรก"
                : v === version
                  ? "ปรับปรุงตามข้อกำหนดและผลการทบทวน"
                  : "แก้ไขรายละเอียดวิธีปฏิบัติ",
            createdAt: dt,
          },
        });
      }
    }
  }

  const total = await prisma.document.count();
  console.log(`✓ Seeded ${total} demo documents.`);
  console.log(`\nLogins:\n  admin / ${adminPass}  (ผู้ดูแลระบบ)`);
  for (const u of demoUsers) console.log(`  ${u.username} / demo1234  (${ROLE_META[u.role].th})`);
  void ROLE_ORDER;
  void admin;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
