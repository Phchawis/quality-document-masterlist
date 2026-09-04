import { describe, expect, it } from "vitest";

import {
  entryWarning,
  isBlockingWarning,
  meetsTarget,
  statsFor,
  summarise,
  type Indicator,
} from "./kpi";

const pct = (targetValue: number | null) => ({ kind: "PERCENT" as const, targetValue });

describe("entryWarning — กันกรอกร้อยละเป็นเศษส่วน", () => {
  it("ปล่อยผ่านเมื่อกรอกเป็นร้อยละตามที่ควร", () => {
    expect(entryWarning(pct(95), "99.06")).toBeNull();
    expect(entryWarning(pct(95), "100")).toBeNull();
    expect(entryWarning(pct(95), "0")).toBeNull();
  });

  it("เตือนเมื่อค่าน้อยกว่า 1 ทั้งที่เป้าอยู่หลักสิบ — เกือบแน่ว่ากรอกเป็นเศษส่วน", () => {
    const w = entryWarning(pct(95), "0.9906");
    expect(w).toContain("99.06%");
  });

  it("ไม่เตือนค่าน้อยกว่า 1 ถ้าเป้าก็เล็ก (อัตราความคลาดเคลื่อน < 0.5%)", () => {
    expect(entryWarning(pct(0.5), "0.44")).toBeNull();
  });

  it("ห้ามร้อยละเกิน 100", () => {
    expect(entryWarning(pct(95), "101")).toBe("ร้อยละเกิน 100 ไม่ได้");
  });

  it("ห้ามค่าติดลบและค่าที่ไม่ใช่ตัวเลข", () => {
    expect(entryWarning(pct(95), "-1")).toBe("ค่าติดลบไม่ได้");
    expect(entryWarning(pct(95), "abc")).toBe("ไม่ใช่ตัวเลข");
  });

  it("ตัวชี้วัดที่นับจำนวนไม่ติดกฎร้อยละ", () => {
    expect(entryWarning({ kind: "COUNT", targetValue: 5 }, "120")).toBeNull();
    expect(entryWarning({ kind: "COUNT", targetValue: 5 }, "0.5")).toBeNull();
  });

  it("แยกได้ว่าคำเตือนไหนห้ามบันทึก คำเตือนไหนแค่ให้ทบทวน", () => {
    expect(isBlockingWarning("ร้อยละเกิน 100 ไม่ได้")).toBe(true);
    expect(isBlockingWarning("ไม่ใช่ตัวเลข")).toBe(true);
    expect(isBlockingWarning(entryWarning(pct(95), "0.99"))).toBe(false);
    expect(isBlockingWarning(null)).toBe(false);
  });
});

describe("meetsTarget — ตัดสินผ่าน/ไม่ผ่านตามเครื่องหมายของเป้า", () => {
  it("ยิ่งมากยิ่งดี", () => {
    expect(meetsTarget(95, { op: ">=", value: 95 })).toBe(true);
    expect(meetsTarget(94.9, { op: ">=", value: 95 })).toBe(false);
    expect(meetsTarget(95, { op: ">", value: 95 })).toBe(false);
  });

  it("ยิ่งน้อยยิ่งดี", () => {
    expect(meetsTarget(4.9, { op: "<", value: 5 })).toBe(true);
    expect(meetsTarget(5, { op: "<", value: 5 })).toBe(false);
    expect(meetsTarget(5, { op: "<=", value: 5 })).toBe(true);
  });

  it("ไม่มีค่าหรือไม่มีเป้า = ตัดสินไม่ได้", () => {
    expect(meetsTarget(null, { op: ">=", value: 95 })).toBeNull();
    expect(meetsTarget(95, { op: ">=", value: null })).toBeNull();
  });
});

function ind(values: (number | null)[], targetOp: string, targetValue: number): Indicator {
  return {
    id: "x", code: "1.1.1", name: "ทดสอบ", kind: "PERCENT",
    targetOp, targetValue, targetRaw: "", groupCode: "1.1", groupName: "กลุ่ม",
    owner: null, summary: null, values,
  };
}

describe("statsFor / summarise", () => {
  it("นับเดือนที่ผ่านและไม่ผ่าน ข้ามเดือนที่ยังไม่มีข้อมูล", () => {
    const s = statsFor(ind([96, 94, null, 97], ">=", 95));
    expect(s.filled).toBe(3);
    expect(s.passed).toBe(2);
    expect(s.failed).toBe(1);
    expect(s.rate).toBeCloseTo(2 / 3);
    expect(s.latest).toEqual({ month: 4, value: 97 });
  });

  it("แนวโน้มคิดทิศทางของตัวชี้วัดแล้ว — ตัวที่ยิ่งน้อยยิ่งดี ค่าลดลง = ดีขึ้น", () => {
    expect(statsFor(ind([5, 3], "<", 10)).trend).toBe(2);
    expect(statsFor(ind([3, 5], ">=", 1)).trend).toBe(2);
  });

  it("สรุประดับงานแยกผ่านทุกเดือน / บางเดือน / ไม่ผ่าน / ไม่มีข้อมูล", () => {
    const s = summarise([
      ind([96, 97], ">=", 95),
      ind([96, 90], ">=", 95),
      ind([90, 91], ">=", 95),
      ind([null, null], ">=", 95),
    ]);
    expect(s).toMatchObject({ pass: 1, partial: 1, fail: 1, nodata: 1, judged: 3, total: 4 });
  });
});
