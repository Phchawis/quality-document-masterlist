"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Modal({
  kicker,
  title,
  children,
  footer,
  onClose,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    // Lock background scroll while the modal is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!mounted) return null;

  // Portal to <body> so no ancestor's transform/filter traps the fixed overlay.
  return createPortal(
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(4,7,6,.72)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn .2s ease" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ width: "100%", maxWidth: 540, maxHeight: "90vh", overflow: "auto", background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 4, boxShadow: "0 30px 80px rgba(0,0,0,.6)", animation: "fadeUp .25s ease" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "20px 22px", borderBottom: "1px solid var(--line2)" }}>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--accent)" }}>{kicker}</div>
            <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 18, margin: "5px 0 0" }}>{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด" style={{ color: "var(--muted)", fontSize: 16, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--line2)", borderRadius: 2, flex: "0 0 auto" }}>
            ✕
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "16px 22px", borderTop: "1px solid var(--line2)" }}>{footer}</div>
      </div>
    </div>,
    document.body,
  );
}

export const fieldLabel: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--mono)",
  fontSize: 12,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "var(--sub)",
};
export const fieldInput: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 8,
  background: "var(--bg2)",
  border: "1px solid var(--line2)",
  color: "var(--text)",
  padding: "11px 13px",
  fontSize: 15,
  borderRadius: 2,
  outline: "none",
  fontFamily: "var(--sans)",
};
export const fieldSelect: React.CSSProperties = { ...fieldInput, fontSize: 14, appearance: "none", WebkitAppearance: "none" };
export const btnPrimary: React.CSSProperties = {
  fontFamily: "var(--display)",
  fontWeight: 600,
  fontSize: 14.5,
  padding: "11px 20px",
  background: "var(--accent)",
  color: "var(--accent-ink)",
  borderRadius: 2,
};
export const btnGhostModal: React.CSSProperties = {
  fontFamily: "var(--display)",
  fontWeight: 600,
  fontSize: 14.5,
  padding: "11px 16px",
  border: "1px solid var(--line2)",
  color: "var(--sub)",
  borderRadius: 2,
};
export const btnDangerSolid: React.CSSProperties = {
  fontFamily: "var(--display)",
  fontWeight: 600,
  fontSize: 14.5,
  padding: "11px 20px",
  background: "var(--red)",
  color: "#180a09",
  borderRadius: 2,
};
