"use client";

// ปุ่มพิมพ์/บันทึกคู่มือเป็น PDF — CSS @media print ใน globals.css จะพิมพ์เฉพาะ #guide-doc
export default function PrintGuideButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "transparent",
        color: "var(--text)",
        border: "1px solid var(--line2)",
        borderRadius: 3,
        padding: "9px 15px",
        fontFamily: "var(--display)",
        fontWeight: 600,
        fontSize: 13.5,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "border-color .18s ease, background .18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.background = "var(--accent-dim)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--line2)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 9V2h12v7" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 14h12v8H6z" />
      </svg>
      ดาวน์โหลด PDF
    </button>
  );
}
