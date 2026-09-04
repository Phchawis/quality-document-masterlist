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
