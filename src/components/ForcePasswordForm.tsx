"use client";

import { useState, useTransition } from "react";

import { changeOwnPassword } from "@/app/actions/users";
import { logoutAction } from "@/app/actions/auth";
import { fieldLabel, btnPrimary } from "./Modal";
import PasswordField from "./PasswordField";

/* ฟอร์มตั้งรหัสผ่านใหม่สำหรับบัญชีที่ยังใช้รหัสชั่วคราว
   ใช้ changeOwnPassword ตัวเดียวกับหน้าบัญชีปกติ (ยืนยันรหัสเดิมก่อนเสมอ) */
export default function ForcePasswordForm() {

  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (fd: FormData) => {
    setError(null);
    start(async () => {
      const res = await changeOwnPassword(fd);
      if (res.ok) {
        // ธงถูกล้างแล้ว — โหลดหน้าใหม่ทั้งหน้าเพื่อให้สถานะผู้ใช้ฝั่งเซิร์ฟเวอร์ถูกอ่านใหม่แน่นอน
        window.location.assign("/");
      } else {
        setError(res.error ?? "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <form action={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <label style={fieldLabel}>
        รหัสผ่านชั่วคราว (ที่ได้รับ)
        <PasswordField name="current" autoComplete="current-password" autoFocus />
      </label>
      <label style={fieldLabel}>
        รหัสผ่านใหม่
        <PasswordField name="next" placeholder="อย่างน้อย 8 ตัวอักษร" />
      </label>
      <label style={fieldLabel}>
        ยืนยันรหัสผ่านใหม่
        <PasswordField name="confirm" />
      </label>

      {error && (
        <div role="alert" style={{ fontSize: 13.5, color: "var(--red)" }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={pending} style={{ ...btnPrimary, opacity: pending ? 0.7 : 1, width: "100%" }}>
        {pending ? "กำลังบันทึก…" : "บันทึกรหัสผ่านใหม่"}
      </button>

      <button
        type="button"
        onClick={() => start(async () => { await logoutAction(); })}
        style={{
          background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--muted)",
        }}
      >
        ออกจากระบบ
      </button>
    </form>
  );
}
