import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { FISCAL_MONTHS, type Indicator } from "@/lib/kpi";
import KpiBoard from "@/components/KpiBoard";

export const dynamic = "force-dynamic";

/* ตัวชี้วัดคุณภาพรายปีงบประมาณของทั้ง 3 งาน
   ข้อมูลนำเข้าจากแบบฟอร์ม "รายงานการเก็บตัวชี้วัด" ที่แต่ละงานเก็บเป็น Excel */
export default async function KpiPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;

  const years = (
    await prisma.kpiIndicator.findMany({
      distinct: ["fiscalYear"],
      select: { fiscalYear: true },
      orderBy: { fiscalYear: "desc" },
    })
  ).map((r) => r.fiscalYear);

  const year = Number(sp.year) || years[0] || new Date().getFullYear() + 543;

  const rows = await prisma.kpiIndicator.findMany({
    where: { fiscalYear: year },
    orderBy: [{ workId: "asc" }, { order: "asc" }],
    include: {
      work: { select: { id: true, nameTh: true } },
      values: { select: { month: true, value: true } },
    },
  });

  // จัดค่ารายเดือนให้เป็นอาร์เรย์ 12 ช่องเรียงตามปีงบประมาณ เพื่อให้หน้าจอไม่ต้องคำนวณเอง
  const byWork = new Map<string, { workId: string; name: string; indicators: Indicator[] }>();
  for (const r of rows) {
    const slots: (number | null)[] = Array(FISCAL_MONTHS.length).fill(null);
    for (const v of r.values) {
      if (v.month >= 1 && v.month <= FISCAL_MONTHS.length) slots[v.month - 1] = v.value;
    }
    if (!byWork.has(r.workId)) {
      byWork.set(r.workId, { workId: r.workId, name: r.work.nameTh, indicators: [] });
    }
    byWork.get(r.workId)!.indicators.push({
      id: r.id,
      code: r.code,
      name: r.name,
      kind: r.kind,
      targetOp: r.targetOp,
      targetValue: r.targetValue,
      targetRaw: r.targetRaw,
      groupCode: r.groupCode,
      groupName: r.groupName,
      owner: r.owner,
      summary: r.summary,
      values: slots,
    });
  }

  return (
    <KpiBoard
      year={year}
      years={years}
      works={[...byWork.values()]}
    />
  );
}
