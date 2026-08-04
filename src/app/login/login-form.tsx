"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import PasswordField from "@/components/PasswordField";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--surface)",
    border: "1px solid var(--line2)",
    color: "var(--text)",
    padding: "13px 15px",
    fontSize: 16,
    borderRadius: 2,
    outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--mono)",
    fontSize: 11.5,
    letterSpacing: ".14em",
    color: "var(--sub)",
    textTransform: "uppercase",
    marginBottom: 8,
  };

  return (
    <form action={action} style={{ width: "100%", maxWidth: 420, margin: "0 auto", animation: "fadeUp .6s ease .12s both" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".22em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 10 }}>
        เข้าสู่ระบบ / Sign in
      </div>
      <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 26, margin: "0 0 4px" }}>ยินดีต้อนรับกลับ</h2>
      <p style={{ fontSize: 14.5, color: "var(--muted)", margin: "0 0 26px" }}>เข้าสู่ระบบด้วยบัญชีผู้ใช้ของฝ่ายสหเวชศาสตร์</p>

      <input type="hidden" name="next" value={next} />

      <label style={labelStyle}>ชื่อผู้ใช้งาน</label>
      <input name="username" autoComplete="username" autoFocus aria-label="ชื่อผู้ใช้งาน" style={{ ...inputStyle, marginBottom: 20 }} />

      <label style={labelStyle}>รหัสผ่าน</label>
      <div style={{ marginBottom: 10 }}>
        <PasswordField
          name="password"
          autoComplete="current-password"
          ariaLabel="รหัสผ่าน"
          style={inputStyle}
        />
      </div>

      {state.error && (
        <div role="alert" style={{ fontSize: 13.5, color: "var(--red)", margin: "6px 0 14px", fontFamily: "var(--sans)" }}>
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{
          width: "100%",
          background: "var(--accent)",
          color: "var(--accent-ink)",
          fontFamily: "var(--display)",
          fontWeight: 600,
          fontSize: 16.5,
          padding: 14,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginTop: 12,
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
        {!pending && <span aria-hidden style={{ fontFamily: "var(--mono)" }}>→</span>}
      </button>

      <p style={{ fontSize: 12.5, color: "var(--faint)", margin: "18px 0 0", textAlign: "center", fontFamily: "var(--mono)", letterSpacing: ".04em" }}>
        หากลืมรหัสผ่าน ติดต่อผู้ดูแลระบบของฝ่าย
      </p>
    </form>
  );
}
