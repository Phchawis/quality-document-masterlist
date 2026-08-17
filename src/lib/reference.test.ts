/* ทดสอบตารางสิทธิ์และข้อมูลอ้างอิง — แกนความปลอดภัยของระบบ
   ถ้าใครแก้ตารางสิทธิ์แล้วเปิดช่องให้ผู้ใช้ระดับล่างทำสิ่งที่ไม่ควรทำ เทสต์ชุดนี้ต้องจับให้ได้

   รันด้วย: npm test */
import { describe, test, expect } from "vitest";
import {
  can, canUserEdit, ROLE_META, ROLE_ORDER, WORKS, CENTRAL_WORK_ID,
  ACK_TYPES, DOC_TYPES, CATEGORIES, beDate,
} from "./reference";
import type { Perm } from "./reference";
import type { Role } from "@/generated/prisma/enums";

describe("โครงสร้างข้อมูลอ้างอิง", () => {
  test("ทุกบทบาทใน ROLE_ORDER มีข้อมูลใน ROLE_META ครบ", () => {
    for (const r of ROLE_ORDER) {
      expect(ROLE_META[r], `ไม่พบข้อมูลบทบาท ${r}`).toBeTruthy();
      expect(ROLE_META[r].th).toBeTruthy();
    }
    expect(Object.keys(ROLE_META).sort()).toEqual([...ROLE_ORDER].sort());
  });

  test("รหัสงานและรหัสประเภทเอกสารไม่ซ้ำกัน", () => {
    const workIds = WORKS.map((w) => w.id);
    expect(new Set(workIds).size).toBe(workIds.length);
    const typeCodes = DOC_TYPES.map((t) => t.code);
    expect(new Set(typeCodes).size).toBe(typeCodes.length);
    const catCodes = CATEGORIES.map((c) => c.code);
    expect(new Set(catCodes).size).toBe(catCodes.length);
  });

  test("ประเภทเอกสารที่ต้องรับทราบ (ACK_TYPES) มีอยู่จริงใน DOC_TYPES", () => {
    for (const code of ACK_TYPES) {
      expect(DOC_TYPES.find((t) => t.code === code), `ไม่พบประเภท ${code}`).toBeTruthy();
    }
  });
});

describe("เอกสารกลางระดับฝ่าย", () => {
  test("มีงานระดับฝ่ายอยู่ในรายการ และอยู่บนสุด", () => {
    const central = WORKS.find((w) => w.id === CENTRAL_WORK_ID);
    expect(central, "ต้องมีงานระดับฝ่าย").toBeTruthy();
    expect(WORKS[0].id).toBe(CENTRAL_WORK_ID);
  });

  test("งานระดับฝ่ายไม่ใช่ระบบภายนอก จึงเลือกได้ในฟอร์มลงทะเบียน", () => {
    const central = WORKS.find((w) => w.id === CENTRAL_WORK_ID)!;
    expect(central.externalUrl).toBeUndefined();
  });

  test("งาน MEDTECH ชี้ไปโดเมนที่ทีมควบคุมเอง ไม่ใช่โฮสต์เดิมที่เลิกใช้แล้ว", () => {
    const medtech = WORKS.find((w) => w.id === "MEDTECH")!;
    expect(medtech.externalUrl).toBeTruthy();
    // ป้องกัน SSO token รั่วไปโดเมนที่ทีมอาจไม่ได้ควบคุมแล้ว
    expect(medtech.externalUrl).not.toContain("onrender.com");
    expect(medtech.externalUrl).toMatch(/^https:\/\//);
  });
});

describe("สิทธิ์ที่ต้องมี", () => {
  test("SYSADMIN เป็นบทบาทเดียวที่จัดการระบบได้", () => {
    const managers = ROLE_ORDER.filter((r) => can(r, "manage"));
    expect(managers).toEqual(["SYSADMIN"]);
  });

  test("HEAD_WORK อนุมัติและประกาศใช้ได้ แต่จัดการระบบไม่ได้", () => {
    expect(can("HEAD_WORK", "approve")).toBe(true);
    expect(can("HEAD_WORK", "publish")).toBe(true);
    expect(can("HEAD_WORK", "manage")).toBe(false);
  });

  test("ทุกบทบาทรับทราบเอกสารได้", () => {
    for (const r of ROLE_ORDER) {
      expect(can(r, "acknowledge"), `${r} ควรรับทราบได้`).toBe(true);
    }
  });
});

describe("สิทธิ์ที่ต้องไม่มี — ป้องกันการยกระดับสิทธิ์", () => {
  const READ_ONLY: Role[] = ["ASSISTANT", "ADMIN_STAFF"];
  const DANGEROUS: Perm[] = ["register", "publish", "revise", "approve", "manage", "upload"];

  test.each(READ_ONLY)("%s ทำได้แค่รับทราบ ห้ามแตะวงจรเอกสาร", (role) => {
    expect(can(role, "acknowledge")).toBe(true);
    for (const perm of DANGEROUS) {
      expect(can(role, perm), `${role} ต้องไม่มีสิทธิ์ ${perm}`).toBe(false);
    }
  });

  test("MED_TECH เสนอแก้ไขได้ แต่แก้เอกสารเองไม่ได้", () => {
    expect(can("MED_TECH", "propose")).toBe(true);
    expect(can("MED_TECH", "revise")).toBe(false);
    expect(can("MED_TECH", "publish")).toBe(false);
    expect(can("MED_TECH", "register")).toBe(false);
  });

  test("DOC_MANAGER ลงทะเบียนได้ แต่ประกาศใช้และอนุมัติไม่ได้", () => {
    expect(can("DOC_MANAGER", "register")).toBe(true);
    expect(can("DOC_MANAGER", "upload")).toBe(true);
    expect(can("DOC_MANAGER", "publish")).toBe(false);
    expect(can("DOC_MANAGER", "approve")).toBe(false);
  });

  test("can() เป็น fail-closed เมื่อไม่มีบทบาท", () => {
    expect(can(null, "register")).toBe(false);
    expect(can(undefined, "manage")).toBe(false);
    expect(can("ไม่มีบทบาทนี้" as unknown as Role, "register")).toBe(false);
  });

  test("canUserEdit() คืน false เมื่อไม่มีผู้ใช้ (ยังไม่ล็อกอิน)", () => {
    expect(canUserEdit(null, "register")).toBe(false);
    expect(canUserEdit(undefined, "publish")).toBe(false);
    expect(canUserEdit({ role: "ASSISTANT", username: "x" }, "register")).toBe(false);
    expect(canUserEdit({ role: "SYSADMIN", username: "x" }, "register")).toBe(true);
  });
});

describe("การแสดงวันที่แบบไทย", () => {
  test("แปลงเป็นปีพุทธศักราชถูกต้อง", () => {
    // 1 ม.ค. 2025 (ค.ศ.) = พ.ศ. 2568
    const d = new Date("2025-01-01T05:00:00.000Z"); // เที่ยงวันตามเวลาไทย
    const out = beDate(d);
    expect(out).toContain("2568");
  });

  test("ค่าว่างไม่ทำให้พัง", () => {
    expect(() => beDate(null)).not.toThrow();
    expect(() => beDate(undefined)).not.toThrow();
  });
});
