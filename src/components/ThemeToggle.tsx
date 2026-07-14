"use client";

import { useEffect, useState } from "react";

// Standalone dark/cream toggle. Reads and writes the same `ml-theme` key and
// `data-theme` attribute the app-wide toggle in Header uses, so the choice
// carries over after login.
export default function ThemeToggle({ style }: { style?: React.CSSProperties }) {
  const [theme, setTheme] = useState<"dark" | "cream">("dark");

  useEffect(() => {
    const t = (localStorage.getItem("ml-theme") as "dark" | "cream") || "dark";
    setTheme(t);
  }, []);

  const toggle = () => {
    const t = theme === "dark" ? "cream" : "dark";
    setTheme(t);
    localStorage.setItem("ml-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title="สลับธีมมืด / สว่าง"
      aria-label="สลับธีมมืด / สว่าง"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontFamily: "var(--mono)",
        fontSize: 12,
        letterSpacing: ".08em",
        color: "var(--muted)",
        padding: "8px 12px",
        border: "1px solid var(--line2)",
        borderRadius: 2,
        background: "var(--surface)",
        ...style,
      }}
    >
      {theme === "dark" ? "☀ สว่าง" : "☾ มืด"}
    </button>
  );
}
