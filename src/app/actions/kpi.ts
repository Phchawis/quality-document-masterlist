"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { FISCAL_MONTHS, canEditWork } from "@/lib/kpi";

type Result = { ok: true; saved: number } | { ok: false; error: string };

/* เริ่มปีงบประมาณใหม่ — คัดลอกรายการตัวชี้วัดจากปีก่อนมาตั้งต้น โดยไม่เอาค่ารายเดือนมา
   รายการตัวชี้วัดเปลี่ยนไม่มากในแต่ละปี การพิมพ์ใหม่ 105 ตัวทุกปีไม่สมเหตุสมผล
   คัดลอกมาแล้วค่อยแก้เฉพาะตัวที่เปลี่ยนจะเร็วกว่ามาก

   รันซ้ำได้ — ตัวชี้วัดที่มีอยู่แล้วในปีปลายทางจะถูกข้าม ไม่เขียนทับของที่แก้ไปแล้ว */
export async function startFiscalYear(fromYear: number): Promise<
  { ok: true; year: number; created: number; skipped: number } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user || !["SYSADMIN", "HEAD_WORK"].includes(user.role)) {
    return { ok: false, error: "เฉพาะหัวหน้างานและผู้ดูแลระบบเท่านั้นที่เปิดปีงบประมาณใหม่ได้" };
  }
  const toYear = fromYear + 1;

  const source = await prisma.kpiIndicator.findMany({
    where: { fiscalYear: fromYear },
    orderBy: { order: "asc" },
  });
  if (!source.length) return { ok: false, error: `ไม่พบตัวชี้วัดของปีงบประมาณ ${fromYear}` };

  const existing = new Set(
    (
      await prisma.kpiIndicator.findMany({
        where: { fiscalYear: toYear },
        select: { workId: true, code: true },
      })
    ).map((r) => `${r.workId}|${r.code}`),
  );

  let created = 0;
  let skipped = 0;
  for (const s of source) {
    if (existing.has(`${s.workId}|${s.code}`)) { skipped += 1; continue; }
    await prisma.kpiIndicator.create({
      data: {
        workId: s.workId,
        fiscalYear: toYear,
        code: s.code,
        name: s.name,
        kind: s.kind,
        targetOp: s.targetOp,
        targetValue: s.targetValue,
        targetRaw: s.targetRaw,
        groupCode: s.groupCode,
        groupName: s.groupName,
        order: s.order,
        owner: s.owner,
        // สรุปผลเป็นของปีเก่า ไม่คัดลอกมา
        summary: null,
      },
    });
    created += 1;
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userName: user.fullName,
      action: "KPI_NEW_YEAR",
      detail: `เปิดปีงบประมาณ ${toYear} · คัดลอกตัวชี้วัด ${created} ตัวจากปี ${fromYear}${skipped ? ` (ข้ามที่มีอยู่แล้ว ${skipped})` : ""}`,
    },
  });

  revalidatePath("/kpi");
  return { ok: true, year: toYear, created, skipped };
}

export async function saveKpiValues(
  workId: string,
  fiscalYear: number,
  month: number,
  entries: { indicatorId: string; value: number | null }[],
): Promise<Result> {
  const user = await getCurrentUser();
  if (!canEditWork(user, workId)) return { ok: false, error: "ไม่มีสิทธิ์แก้ไขตัวชี้วัดของงานนี้" };
  if (month < 1 || month > FISCAL_MONTHS.length) return { ok: false, error: "เดือนไม่ถูกต้อง" };

  // ตรวจว่าตัวชี้วัดทุกตัวที่ส่งมาเป็นของงานนี้จริง — กันการยิงคำขอตรงเพื่อแก้ข้ามงาน
  const ids = entries.map((e) => e.indicatorId);
  const owned = await prisma.kpiIndicator.findMany({
    where: { id: { in: ids }, workId, fiscalYear },
    select: { id: true, kind: true, name: true },
  });
  if (owned.length !== ids.length) return { ok: false, error: "พบตัวชี้วัดที่ไม่ได้อยู่ในงานนี้" };
  const kindOf = new Map(owned.map((o) => [o.id, o]));

  for (const e of entries) {
    if (e.value === null) continue;
    if (!Number.isFinite(e.value)) return { ok: false, error: "มีค่าที่ไม่ใช่ตัวเลข" };
    if (e.value < 0) return { ok: false, error: "ค่าติดลบไม่ได้" };
    const meta = kindOf.get(e.indicatorId)!;
    // ร้อยละต้องอยู่ 0-100 เสมอ — เคยมีการกรอกเป็นเศษส่วน (0.99 แทน 99) จนกราฟผิด 100 เท่า
    if (meta.kind === "PERCENT" && e.value > 100) {
      return { ok: false, error: `“${meta.name}” เป็นร้อยละ ใส่เกิน 100 ไม่ได้` };
    }
  }

  const stamp = `${user!.fullName} · ${new Date().toISOString().slice(0, 10)}`;
  let saved = 0;
  for (const e of entries) {
    if (e.value === null) {
      // ล้างค่าเดิมออกเมื่อผู้ใช้ลบตัวเลขในช่องทิ้ง
      await prisma.kpiValue.deleteMany({ where: { indicatorId: e.indicatorId, month } });
      continue;
    }
    await prisma.kpiValue.upsert({
      where: { indicatorId_month: { indicatorId: e.indicatorId, month } },
      create: { indicatorId: e.indicatorId, month, value: e.value, updatedBy: stamp },
      update: { value: e.value, updatedBy: stamp },
    });
    saved += 1;
  }

  await prisma.auditLog.create({
    data: {
      userId: user!.id,
      userName: user!.fullName,
      action: "KPI_ENTRY",
      detail: `บันทึกตัวชี้วัด ${saved} ค่า · เดือน ${FISCAL_MONTHS[month - 1]} ปีงบประมาณ ${fiscalYear}`,
    },
  });

  revalidatePath("/kpi");
  return { ok: true, saved };
}
