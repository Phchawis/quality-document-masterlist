import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { FISCAL_MONTHS, canEditWork } from "@/lib/kpi";

export const dynamic = "force-dynamic";

/* API ภายในสำหรับให้ระบบ Lab QMS อ่านและบันทึกตัวชี้วัดของงานเทคนิคการแพทย์
   ตัวชี้วัดเก็บอยู่ที่ระบบนี้ที่เดียว — Lab QMS เรียกผ่าน API ไม่คัดลอกข้อมูลไปเก็บเอง
   จึงแก้ที่ระบบไหนก็เห็นตรงกันทั้งสองฝั่งทันที และกติกาตรวจค่า (สเกลร้อยละ ฯลฯ)
   อยู่ที่เดียวไม่ต้องเขียนซ้ำสองที่

   ยืนยันตัวตนด้วยกุญแจที่สองระบบใช้ร่วมกันอยู่แล้ว (SSO_SHARED_SECRET)
   เรียกกันภายในเครือข่าย docker — ไม่ได้ตั้งใจให้เบราว์เซอร์เรียกตรง */

function authorised(req: NextRequest): boolean {
  const secret = process.env.SSO_SHARED_SECRET;
  if (!secret || secret.length < 32) return false;
  const given = req.headers.get("x-internal-key");
  if (!given || given.length !== secret.length) return false;
  // เทียบแบบเวลาคงที่ กัน timing attack
  let diff = 0;
  for (let i = 0; i < secret.length; i += 1) diff |= secret.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

export async function GET(req: NextRequest) {
  if (!authorised(req)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const workId = sp.get("work") || "MEDTECH";
  const year = Number(sp.get("year"));

  const years = (
    await prisma.kpiIndicator.findMany({
      where: { workId },
      distinct: ["fiscalYear"],
      select: { fiscalYear: true },
      orderBy: { fiscalYear: "desc" },
    })
  ).map((r) => r.fiscalYear);

  const fiscalYear = years.includes(year) ? year : years[0];
  if (!fiscalYear) return NextResponse.json({ years: [], fiscalYear: null, indicators: [] });

  const rows = await prisma.kpiIndicator.findMany({
    where: { workId, fiscalYear },
    orderBy: { order: "asc" },
    include: { values: { select: { month: true, value: true } } },
  });

  return NextResponse.json({
    years,
    fiscalYear,
    workId,
    months: FISCAL_MONTHS,
    indicators: rows.map((r) => {
      const slots: (number | null)[] = Array(FISCAL_MONTHS.length).fill(null);
      for (const v of r.values) {
        if (v.month >= 1 && v.month <= FISCAL_MONTHS.length) slots[v.month - 1] = v.value;
      }
      return {
        id: r.id, code: r.code, name: r.name, kind: r.kind,
        targetOp: r.targetOp, targetValue: r.targetValue, targetRaw: r.targetRaw,
        groupCode: r.groupCode, groupName: r.groupName,
        owner: r.owner, summary: r.summary, values: slots,
      };
    }),
  });
}

/* บันทึกค่ารายเดือน — ฝั่ง Lab QMS ตรวจสิทธิ์ผู้ใช้ของตัวเองมาแล้ว
   แต่ยังส่งบทบาทมาให้ตรวจซ้ำที่นี่ เพราะกติกาว่าใครแก้งานไหนได้อยู่ที่ระบบนี้ */
export async function POST(req: NextRequest) {
  if (!authorised(req)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const { workId, fiscalYear, month, entries, actor } = body as {
    workId: string; fiscalYear: number; month: number;
    entries: { indicatorId: string; value: number | null }[];
    actor: { name: string; role: string; workId: string | null };
  };

  if (!canEditWork(actor, workId)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไขตัวชี้วัดของงานนี้" }, { status: 403 });
  }
  if (!Array.isArray(entries)) return NextResponse.json({ error: "ไม่มีรายการที่จะบันทึก" }, { status: 400 });
  if (month < 1 || month > FISCAL_MONTHS.length) {
    return NextResponse.json({ error: "เดือนไม่ถูกต้อง" }, { status: 400 });
  }

  const owned = await prisma.kpiIndicator.findMany({
    where: { id: { in: entries.map((e) => e.indicatorId) }, workId, fiscalYear },
    select: { id: true, kind: true, name: true },
  });
  if (owned.length !== entries.length) {
    return NextResponse.json({ error: "พบตัวชี้วัดที่ไม่ได้อยู่ในงานนี้" }, { status: 400 });
  }
  const meta = new Map(owned.map((o) => [o.id, o]));

  for (const e of entries) {
    if (e.value === null) continue;
    if (!Number.isFinite(e.value) || e.value < 0) {
      return NextResponse.json({ error: "ค่าต้องเป็นตัวเลขไม่ติดลบ" }, { status: 400 });
    }
    if (meta.get(e.indicatorId)!.kind === "PERCENT" && e.value > 100) {
      return NextResponse.json(
        { error: `“${meta.get(e.indicatorId)!.name}” เป็นร้อยละ ใส่เกิน 100 ไม่ได้` }, { status: 400 },
      );
    }
  }

  const stamp = `${actor.name} · ผ่านระบบ Lab QMS · ${new Date().toISOString().slice(0, 10)}`;
  let saved = 0;
  for (const e of entries) {
    if (e.value === null) {
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
      userName: actor.name,
      action: "KPI_ENTRY",
      detail: `บันทึกตัวชี้วัด ${saved} ค่า · เดือน ${FISCAL_MONTHS[month - 1]} ปีงบประมาณ ${fiscalYear} (จากระบบ Lab QMS)`,
    },
  });

  return NextResponse.json({ ok: true, saved });
}
