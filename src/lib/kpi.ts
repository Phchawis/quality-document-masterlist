/* ตรรกะการตัดสินผ่าน/ไม่ผ่านของตัวชี้วัด — ใช้ร่วมกันทั้งฝั่งเซิร์ฟเวอร์และหน้าจอ
   ห้าม import อะไรจาก Node ในไฟล์นี้ */

import type { KpiKind } from "@/generated/prisma/enums";

// ปีงบประมาณไทยเริ่ม ต.ค. — เดือนที่ 1 ของข้อมูลคือ ต.ค. ไม่ใช่ ม.ค.
export const FISCAL_MONTHS = [
  "ต.ค.", "พ.ย.", "ธ.ค.", "ม.ค.", "ก.พ.", "มี.ค.",
  "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.",
] as const;

export type Target = { op: string | null; value: number | null };

/** ตัวชี้วัดนี้ "ยิ่งมากยิ่งดี" หรือไม่ — ใช้เลือกสีและทิศทางของกราฟ */
export function higherIsBetter(op: string | null): boolean {
  return op === ">=" || op === ">" || op === "=" || op === null;
}

/** ค่าเดือนนี้ผ่านเป้าไหม — null = ตัดสินไม่ได้ (ไม่มีค่า หรือไม่มีเป้าที่เทียบได้) */
export function meetsTarget(value: number | null | undefined, t: Target): boolean | null {
  if (value === null || value === undefined || t.value === null) return null;
  switch (t.op) {
    case ">=": return value >= t.value;
    case ">": return value > t.value;
    case "<=": return value <= t.value;
    case "<": return value < t.value;
    case "=": return Math.abs(value - t.value) < 1e-9;
    default: return null;
  }
}

/** แสดงค่าให้อ่านง่ายตามชนิดตัวชี้วัด */
export function formatValue(value: number | null | undefined, kind: KpiKind): string {
  if (value === null || value === undefined) return "—";
  if (kind === "PERCENT") {
    // ทศนิยม 2 ตำแหน่งเฉพาะตอนที่มีนัย — 100.00% อ่านยากกว่า 100%
    const r = Math.round(value * 100) / 100;
    return Number.isInteger(r) ? `${r}%` : `${r.toFixed(2)}%`;
  }
  if (kind === "DURATION") return `${value} นาที`;
  const r = Math.round(value * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

export type Indicator = {
  id: string;
  code: string;
  name: string;
  kind: KpiKind;
  targetOp: string | null;
  targetValue: number | null;
  targetRaw: string;
  groupCode: string;
  groupName: string;
  owner: string | null;
  summary: string | null;
  values: (number | null)[]; // 12 ช่อง เรียงตามปีงบประมาณ
};

export type IndicatorStats = {
  filled: number;
  passed: number;
  failed: number;
  /** สัดส่วนเดือนที่ผ่านเป้า — null เมื่อยังไม่มีข้อมูลหรือไม่มีเป้าที่เทียบได้ */
  rate: number | null;
  latest: { month: number; value: number } | null;
  /** ทิศทางเทียบเดือนก่อนหน้า — บวก = ดีขึ้น (คิดทิศทางของตัวชี้วัดแล้ว) */
  trend: number | null;
  min: number | null;
  max: number | null;
};

export function statsFor(ind: Indicator): IndicatorStats {
  const t: Target = { op: ind.targetOp, value: ind.targetValue };
  const nums = ind.values
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v !== null && x.v !== undefined);

  let passed = 0;
  let failed = 0;
  for (const { v } of nums) {
    const ok = meetsTarget(v, t);
    if (ok === true) passed += 1;
    else if (ok === false) failed += 1;
  }

  const last = nums.length ? nums[nums.length - 1] : null;
  const prev = nums.length > 1 ? nums[nums.length - 2] : null;
  let trend: number | null = null;
  if (last && prev) {
    const raw = last.v - prev.v;
    trend = higherIsBetter(ind.targetOp) ? raw : -raw;
  }

  return {
    filled: nums.length,
    passed,
    failed,
    rate: passed + failed > 0 ? passed / (passed + failed) : null,
    latest: last ? { month: last.i + 1, value: last.v } : null,
    trend,
    min: nums.length ? Math.min(...nums.map((x) => x.v)) : null,
    max: nums.length ? Math.max(...nums.map((x) => x.v)) : null,
  };
}

/** ใครแก้ตัวเลขของงานไหนได้บ้าง
 *  หัวหน้างาน/ผู้ดูแลระบบ = ทุกงาน · หัวหน้าหมวดงาน = เฉพาะงานที่ตัวเองสังกัด
 *  จำกัดให้แคบไว้เพราะตัวเลขชุดนี้ใช้รายงานผู้บริหารและใช้ตอนตรวจประเมิน
 *  อยู่ที่นี่ไม่ใช่ในไฟล์ actions เพราะไฟล์ "use server" export ได้เฉพาะ async */
export function canEditWork(
  user: { role: string; workId: string | null } | null | undefined,
  workId: string,
): boolean {
  if (!user) return false;
  if (user.role === "SYSADMIN" || user.role === "HEAD_WORK") return true;
  if (user.role === "HEAD_CAT") return user.workId === workId;
  return false;
}

/* ตรวจค่าที่ผู้ใช้พิมพ์ในหน้ากรอก — คืนข้อความเตือน หรือ null ถ้าไม่มีปัญหา

   ปัญหาที่เคยเกิดจริง: ร้อยละถูกกรอกเป็นเศษส่วน (0.9906 แทน 99.06) ทำให้ตัวเลข
   ผิดไป 100 เท่าโดยไม่มีใครสังเกต กว่าจะรู้ก็ตอนเอาไปทำกราฟรวมข้ามงาน
   จึงดักตั้งแต่ตอนพิมพ์ แทนที่จะไปไล่แก้ทีหลัง */
export function entryWarning(
  ind: { kind: KpiKind; targetValue: number | null },
  raw: string,
): string | null {
  if (raw.trim() === "") return null;
  const v = Number(raw);
  if (!Number.isFinite(v)) return "ไม่ใช่ตัวเลข";
  if (v < 0) return "ค่าติดลบไม่ได้";
  if (ind.kind !== "PERCENT") return null;
  if (v > 100) return "ร้อยละเกิน 100 ไม่ได้";
  // เป้าหมายอยู่หลักสิบขึ้นไปแต่กรอกไม่ถึง 1 — เกือบแน่ว่ากรอกเป็นเศษส่วน
  if (v > 0 && v < 1 && (ind.targetValue ?? 0) >= 10) {
    return `หมายถึง ${(v * 100).toFixed(2)}% หรือเปล่า? ช่องนี้กรอกเป็นร้อยละ (0–100)`;
  }
  return null;
}

/** เตือนแบบนี้ห้ามบันทึก (ต่างจากเตือนให้ทบทวนซึ่งบันทึกได้) */
export function isBlockingWarning(w: string | null): boolean {
  return w === "ไม่ใช่ตัวเลข" || w === "ค่าติดลบไม่ได้" || w === "ร้อยละเกิน 100 ไม่ได้";
}

/* ระยะห่างจากเป้าของค่าล่าสุด — บวก = ยังไม่ถึงเป้า (คิดทิศทางของตัวชี้วัดแล้ว)
   ใช้จัดลำดับว่าตัวไหนควรแก้ก่อน */
export function gapFromTarget(ind: Indicator): number | null {
  const s = statsFor(ind);
  if (!s.latest || ind.targetValue === null) return null;
  const raw = higherIsBetter(ind.targetOp)
    ? ind.targetValue - s.latest.value
    : s.latest.value - ind.targetValue;
  return raw;
}

export type Attention = {
  ind: Indicator;
  workName: string;
  stats: IndicatorStats;
  gap: number | null;
  /** ความรุนแรงเทียบสัดส่วนกับเป้า — ใช้เรียงลำดับข้ามหน่วยที่ต่างกันได้ */
  severity: number;
};

/* รายการที่ควรดูแลก่อน — เอาเฉพาะตัวที่ยังไม่ผ่านครบทุกเดือน
   เรียงจากห่างเป้ามากที่สุด เพราะจากตัวชี้วัด 105 ตัว มีไม่ถึง 10% ที่ต้องลงมือทำ
   ถ้าไม่ดึงขึ้นมาไว้บนสุด ผู้ใช้ต้องเลื่อนผ่านแถวที่ผ่านเป้าเป็นร้อยแถวเพื่อหามัน */
export function attentionList(
  works: { name: string; indicators: Indicator[] }[],
): Attention[] {
  const out: Attention[] = [];
  for (const w of works) {
    for (const ind of w.indicators) {
      const stats = statsFor(ind);
      if (stats.rate === null || stats.rate === 1) continue;
      const gap = gapFromTarget(ind);
      const denom = Math.max(Math.abs(ind.targetValue ?? 0), 1);
      // ตัวที่ยังไม่ถึงเป้าเรียงตามสัดส่วนที่ขาด · ตัวที่ค่าล่าสุดผ่านแล้วแต่เคยตก
      // ให้ความสำคัญน้อยกว่า แต่ยังต้องอยู่ในรายการ
      const severity = gap !== null && gap > 0 ? gap / denom : (1 - stats.rate) * 0.5;
      out.push({ ind, workName: w.name, stats, gap, severity });
    }
  }
  return out.sort((a, b) => b.severity - a.severity);
}

/** สรุประดับงาน: ตัวชี้วัดกี่ตัวที่ "ผ่านทุกเดือนที่มีข้อมูล" */
export function summarise(indicators: Indicator[]) {
  let pass = 0;
  let partial = 0;
  let fail = 0;
  let nodata = 0;
  for (const ind of indicators) {
    const s = statsFor(ind);
    if (s.rate === null) nodata += 1;
    else if (s.rate === 1) pass += 1;
    else if (s.rate === 0) fail += 1;
    else partial += 1;
  }
  const judged = pass + partial + fail;
  return { pass, partial, fail, nodata, judged, total: indicators.length };
}
