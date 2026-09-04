/* นำเข้าตัวชี้วัดจากไฟล์ JSON ที่สกัดมาจากแบบฟอร์ม Excel ของแต่ละงาน
 *
 *   npx tsx prisma/import-kpi.ts <path/to/kpi.json>
 *
 * รันซ้ำได้ — ใช้ upsert ตาม (workId, fiscalYear, code) จึงอัปเดตทับของเดิม
 * ไม่สร้างซ้ำ และไม่ลบตัวชี้วัดที่ไม่ได้อยู่ในไฟล์ (กันลบของที่คนกรอกเพิ่มเองในระบบ)
 */
import "dotenv/config";
import { readFileSync } from "node:fs";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const MONTHS = ["ต.ค.", "พ.ย.", "ธ.ค.", "ม.ค.", "ก.พ.", "มี.ค.",
  "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย."] as const;

type Kind = "PERCENT" | "COUNT" | "DURATION" | "OTHER";

type Item = {
  code: string;
  name: string;
  kind?: Kind;
  target?: { op: string | null; value: number | null; raw: string } | null;
  values: Record<string, number | null>;
  owner?: string | null;
  summary?: string | null;
};

type Group = { code: string; name: string; items: Item[] };
type Work = { workId: string; name: string; kpis: Group[] };

async function main() {
  const src = process.argv[2];
  if (!src) throw new Error("ต้องระบุไฟล์ JSON ที่จะนำเข้า");
  const data = JSON.parse(readFileSync(src, "utf8")) as {
    fiscalYear: number;
    works: Work[];
  };

  const known = new Set((await prisma.work.findMany({ select: { id: true } })).map((w) => w.id));

  let indicators = 0;
  let values = 0;
  for (const w of data.works) {
    if (!known.has(w.workId)) {
      console.warn(`  ข้าม ${w.name} — ไม่พบงานรหัส ${w.workId} ในระบบ`);
      continue;
    }
    let order = 0;
    for (const g of w.kpis) {
      for (const it of g.items) {
        if (!it.code) continue;
        order += 1;
        const rec = {
          workId: w.workId,
          fiscalYear: data.fiscalYear,
          code: it.code,
          name: it.name,
          kind: (it.kind ?? "OTHER") as Kind,
          targetOp: it.target?.op ?? null,
          targetValue: it.target?.value ?? null,
          targetRaw: it.target?.raw ?? "",
          groupCode: g.code,
          groupName: g.name,
          order,
          owner: it.owner ?? null,
          summary: it.summary ?? null,
        };
        const ind = await prisma.kpiIndicator.upsert({
          where: {
            workId_fiscalYear_code: {
              workId: w.workId, fiscalYear: data.fiscalYear, code: it.code,
            },
          },
          create: rec,
          update: rec,
        });
        indicators += 1;

        for (let m = 0; m < MONTHS.length; m += 1) {
          const v = it.values[MONTHS[m]];
          if (v === null || v === undefined) continue;
          await prisma.kpiValue.upsert({
            where: { indicatorId_month: { indicatorId: ind.id, month: m + 1 } },
            create: { indicatorId: ind.id, month: m + 1, value: v, updatedBy: "นำเข้าจากไฟล์ Excel" },
            update: { value: v, updatedBy: "นำเข้าจากไฟล์ Excel" },
          });
          values += 1;
        }
      }
    }
    console.log(`  ${w.name} — เสร็จ`);
  }
  console.log(`\n✓ นำเข้าตัวชี้วัด ${indicators} ตัว · ค่ารายเดือน ${values} ค่า (ปีงบประมาณ ${data.fiscalYear})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
