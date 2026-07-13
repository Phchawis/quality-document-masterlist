"use client";

import { useState, useTransition } from "react";
import { changeOwnPassword } from "@/app/actions/users";
import { fieldLabel, fieldInput, btnPrimary } from "./Modal";

export default function ChangePasswordForm() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = (fd: FormData) => {
    setMsg(null);
    start(async () => {
      const res = await changeOwnPassword(fd);
      if (res.ok) {
        setMsg({ ok: true, text: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
        (document.getElementById("pw-form") as HTMLFormElement | null)?.reset();
      } else {
        setMsg({ ok: false, text: res.error ?? "เกิดข้อผิดพลาด" });
      }
    });
  };

  return (
    <form id="pw-form" action={submit} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 420 }}>
      <label style={fieldLabel}>
        รหัสผ่านปัจจุบัน
        <input name="current" type="password" autoComplete="current-password" style={fieldInput} />
      </label>
      <label style={fieldLabel}>
        รหัสผ่านใหม่
        <input name="next" type="password" autoComplete="new-password" style={fieldInput} />
      </label>
      <label style={fieldLabel}>
        ยืนยันรหัสผ่านใหม่
        <input name="confirm" type="password" autoComplete="new-password" style={fieldInput} />
      </label>
      {msg && (
        <div role="alert" style={{ fontSize: 13.5, color: msg.ok ? "var(--accent)" : "var(--red)" }}>
          {msg.text}
        </div>
      )}
      <div>
        <button type="submit" disabled={pending} style={{ ...btnPrimary, opacity: pending ? 0.7 : 1 }}>
          {pending ? "กำลังบันทึก…" : "เปลี่ยนรหัสผ่าน"}
        </button>
      </div>
    </form>
  );
}
