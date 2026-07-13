"use client";

import { useSearchParams } from "next/navigation";

export default function ExportButton() {
  const params = useSearchParams();
  const qs = params.toString();
  const href = `/masterlist/export${qs ? `?${qs}` : ""}`;

  return (
    <a
      href={href}
      title="ส่งออกทะเบียนตามตัวกรองปัจจุบันเป็นไฟล์ Excel (CSV)"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        fontFamily: "var(--display)",
        fontWeight: 600,
        fontSize: 14.5,
        padding: "11px 18px",
        border: "1px solid var(--line2)",
        color: "var(--text)",
        borderRadius: 2,
        background: "transparent",
      }}
    >
      <span aria-hidden style={{ fontFamily: "var(--mono)", fontSize: 15, lineHeight: 1 }}>↧</span> ส่งออก Excel
    </a>
  );
}
