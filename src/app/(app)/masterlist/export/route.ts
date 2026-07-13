import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildDocWhere, buildDocOrderBy } from "@/lib/documents";
import { STATUS_META, WORKS, CATEGORIES, KIND_META, beDate } from "@/lib/reference";

export const dynamic = "force-dynamic";

function csvCell(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  // Quote if it contains comma, quote, or newline; escape quotes by doubling.
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Exports the current (filtered) masterlist as an Excel-openable CSV.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const where = buildDocWhere(sp, user.id);
  const orderBy = buildDocOrderBy(sp.sort, sp.dir);

  const docs = await prisma.document.findMany({
    where,
    orderBy,
    include: { type: true, work: true, category: true, subCategory: true, attachments: true, _count: { select: { acks: true } } },
  });

  const headers = [
    "รหัสเอกสาร", "ชื่อเอกสาร", "ประเภท", "ชื่อประเภท", "งาน", "หมวดงาน", "หมวดย่อย",
    "เวอร์ชัน", "สถานะ", "วันที่ประกาศใช้", "แก้ไขล่าสุด", "กำหนดทบทวนถัดไป",
    "ผู้จัดทำ", "ผู้อนุมัติ", "เอกสารควบคุม", "จำนวนผู้รับทราบ", "ไฟล์แนบ",
  ];

  const rows = docs.map((d) => {
    const work = WORKS.find((w) => w.id === d.workId);
    const cat = CATEGORIES.find((c) => c.code === d.categoryCode);
    const atts = d.attachments.map((a) => KIND_META[a.kind].tag).join(" ");
    return [
      d.code,
      d.title,
      d.typeCode,
      d.type.nameTh,
      work?.nameTh ?? "",
      cat ? `${cat.code} · ${cat.nameTh}` : "",
      d.subCategory?.name ?? "",
      `v.${String(d.version).padStart(2, "0")}`,
      STATUS_META[d.status].th,
      d.effectiveAt ? beDate(d.effectiveAt) : "",
      d.revisedAt ? beDate(d.revisedAt) : "",
      d.nextReviewAt ? beDate(d.nextReviewAt) : "",
      d.ownerName,
      d.approverName,
      d.controlled ? "ควบคุม" : "ไม่ควบคุม",
      d._count.acks,
      atts,
    ]
      .map(csvCell)
      .join(",");
  });

  const meta = `ทะเบียนเอกสารคุณภาพ · ฝ่ายสหเวชศาสตร์,ส่งออกเมื่อ ${beDate(new Date())},รวม ${docs.length} ฉบับ`;
  // UTF-8 BOM so Excel renders Thai correctly.
  const BOM = "\uFEFF";
  const body = BOM + [meta, "", headers.map(csvCell).join(","), ...rows].join("\r\n");

  const filename = `masterlist-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
