"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { FISCAL_MONTHS, canEditWork } from "@/lib/kpi";

type Result = { ok: true; saved: number } | { ok: false; error: string };

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
