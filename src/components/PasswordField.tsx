"use client";

import { useState } from "react";
import { fieldInput } from "./Modal";

/* ช่องกรอกรหัสผ่านพร้อมปุ่มสลับ "แสดง / ซ่อน"
   ค่าเริ่มต้นคือซ่อนไว้เสมอ — กันคนข้าง ๆ เห็นรหัสตอนผู้ดูแลตั้งรหัสให้เจ้าหน้าที่
   แต่กดดูได้เมื่อต้องการตรวจว่าพิมพ์ถูก (ลดปัญหาตั้งรหัสผิดแล้วผู้ใช้เข้าไม่ได้) */
export default function PasswordField({
  name,
  value,
  onChange,
  placeholder,
  autoComplete = "new-password",
  autoFocus = false,
  ariaLabel,
  style,
}: {
  name?: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
  /** override สไตล์ช่องกรอก (หน้า login ใช้สไตล์ของตัวเอง) */
  style?: React.CSSProperties;
}) {
  const [shown, setShown] = useState(false);
  const base = style ?? fieldInput;

  return (
    <span style={{ position: "relative", display: "block" }}>
      <input
        name={name}
        type={shown ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        {...(onChange ? { value: value ?? "", onChange: (e) => onChange(e.target.value) } : {})}
        style={{ ...base, paddingRight: 44 }}
      />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        title={shown ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        aria-label={shown ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        aria-pressed={shown}
        style={{
          position: "absolute",
          right: 4,
          top: "50%",
          transform: "translateY(-50%)",
          height: 38,
          width: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
          borderRadius: 2,
          color: shown ? "var(--accent)" : "var(--muted)",
          transition: "color .18s ease",
        }}
      >
        {shown ? (
          /* ตาขีดทับ = กำลังแสดงอยู่ กดเพื่อซ่อน */
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c5.5 0 9 6 9 6a15.6 15.6 0 0 1-3.1 3.8" />
            <path d="M6.6 6.7A15.9 15.9 0 0 0 3 12s3.5 6 9 6a9.7 9.7 0 0 0 4.3-1" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            <path d="M3 3l18 18" />
          </svg>
        ) : (
          /* ตาเปิด = กำลังซ่อนอยู่ กดเพื่อแสดง */
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </span>
  );
}
