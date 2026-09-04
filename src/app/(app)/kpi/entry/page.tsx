import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEditWork, FISCAL_MONTHS } from "@/lib/kpi";
import KpiEntryForm from "@/components/KpiEntryForm";

export const dynamic = "force-dynamic";

/* หน้ากรอกตัวชี้วัดรายเดือน — เลือกงาน + เดือน แล้วกรอกทั้งงานในตารางเดียว
   จงใจไม่ทำเป็นกรอกทีละตัวแล้วกดบันทึกทีละครั้ง เพราะบางงานมี 48 ตัวชี้วัด
   ถ้าต้องกด 48 รอบต่อเดือน คนกรอกจะเลิกใช้ภายในสองเดือน */
export default async function KpiEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ work?: string; month?: string; year?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const works = await prisma.work.findMany({ orderBy: { order: "asc" } });
  const editable = works.filter((w) => canEditWork(user, w.id));
  if (!editable.length) redirect("/kpi");

  const years = (
    await prisma.kpiIndicator.findMany({
      distinct: ["fiscalYear"],
      select: { fiscalYear: true },
      orderBy: { fiscalYear: "desc" },
    })
  ).map((r) => r.fiscalYear);

  const year = Number(sp.year) || years[0] || new Date().getFullYear() + 543;

  /* งานที่มีตัวชี้วัดของปีนี้จริง — ฝ่ายสหเวชศาสตร์ (CENTRAL) ไม่ได้เก็บตัวชี้วัด
     ถ้าเปิดหน้ามาที่งานนั้นผู้ใช้จะเห็นหน้าว่างเปล่าแล้วนึกว่าระบบเสีย */
  const withData = new Set(
    (
      await prisma.kpiIndicator.findMany({
        where: { fiscalYear: year },
        distinct: ["workId"],
        select: { workId: true },
      })
    ).map((r) => r.workId),
  );
  const selectable = editable.filter((w) => withData.has(w.id));
  const pool = selectable.length ? selectable : editable;
  const workId = pool.some((w) => w.id === sp.work) ? sp.work! : pool[0].id;
  const month = Math.min(Math.max(Number(sp.month) || 1, 1), FISCAL_MONTHS.length);

  const rows = await prisma.kpiIndicator.findMany({
    where: { workId, fiscalYear: year },
    orderBy: { order: "asc" },
    include: { values: { where: { month: { in: [month, month - 1] } }, select: { month: true, value: true } } },
  });

  const indicators = rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    kind: r.kind,
    targetRaw: r.targetRaw,
    targetValue: r.targetValue,
    targetOp: r.targetOp,
    groupCode: r.groupCode,
    groupName: r.groupName,
    current: r.values.find((v) => v.month === month)?.value ?? null,
    previous: month > 1 ? r.values.find((v) => v.month === month - 1)?.value ?? null : null,
  }));

  return (
    <KpiEntryForm
      year={year}
      years={years}
      month={month}
      workId={workId}
      works={pool.map((w) => ({ id: w.id, name: w.nameTh }))}
      indicators={indicators}
    />
  );
}
