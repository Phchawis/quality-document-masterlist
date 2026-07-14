"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { initials } from "@/lib/reference";

type Props = {
  userName: string;
  roleTh: string;
  showUsers: boolean;
  showAudit: boolean;
  ackPending: number;
};

export default function Header({ userName, roleTh, showUsers, showAudit, ackPending }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "cream">("dark");

  useEffect(() => {
    const t = (localStorage.getItem("ml-theme") as "dark" | "cream") || "dark";
    setTheme(t);
  }, []);

  const toggleTheme = () => {
    const t = theme === "dark" ? "cream" : "dark";
    setTheme(t);
    localStorage.setItem("ml-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  const nav = [
    { href: "/", label: "ภาพรวม", active: pathname === "/" },
    { href: "/masterlist", label: "ทะเบียนเอกสาร", active: pathname.startsWith("/masterlist") || pathname.startsWith("/documents") },
    { href: "/guide", label: "คู่มือ", active: pathname === "/guide" },
    ...(showUsers ? [{ href: "/admin/users", label: "ผู้ใช้งาน", active: pathname.startsWith("/admin/users") }] : []),
    ...(showAudit ? [{ href: "/admin/audit", label: "ตรวจสอบ", active: pathname.startsWith("/admin/audit") }] : []),
  ];

  const navStyle = (on: boolean): React.CSSProperties => ({
    fontFamily: "var(--display)",
    fontWeight: 600,
    fontSize: 14.5,
    padding: "8px 14px",
    borderRadius: 2,
    transition: "background .15s,color .15s",
    color: on ? "var(--text)" : "var(--muted)",
    background: on ? "var(--surface2)" : "transparent",
  });

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--headbg)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--line2)" }}>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "12px clamp(16px,3vw,32px)", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }} aria-label="หน้าหลัก">
          <Image src="/assets/seal-tuh.png" alt="" width={36} height={36} style={{ borderRadius: "50%", background: "#fff", padding: 2, flex: "0 0 auto" }} />
          <span style={{ textAlign: "left", lineHeight: 1.25, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: "var(--display)", fontWeight: 600, fontSize: 15.5, color: "var(--text)", whiteSpace: "nowrap" }}>ทะเบียนเอกสารคุณภาพ</span>
            <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 11.5, letterSpacing: ".12em", color: "var(--muted)", textTransform: "uppercase" }}>ฝ่ายสหเวชศาสตร์ · Masterlist</span>
          </span>
        </Link>

        <nav aria-label="เมนูหลัก" style={{ display: "flex", gap: 4, marginLeft: 8, flexWrap: "wrap" }}>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={n.active ? "page" : undefined} style={navStyle(n.active)}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div style={{ flex: "1 1 20px" }} />

        <Link
          href="/masterlist?ack=1"
          title="รอลงนามรับทราบ"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", border: "1px solid var(--line2)", borderRadius: 2 }}
        >
          <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, letterSpacing: ".1em", color: "var(--muted)", textTransform: "uppercase" }}>รอรับทราบ</span>
          <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 15, color: ackPending ? "var(--amber)" : "var(--muted)", animation: ackPending ? "softPulse 2.6s ease-in-out infinite" : undefined }}>
            {ackPending}
          </span>
        </Link>

        <button type="button" onClick={toggleTheme} title="สลับธีม" aria-label="สลับธีม" style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".08em", color: "var(--muted)", padding: "7px 10px", border: "1px solid var(--line2)", borderRadius: 2 }}>
          {theme === "dark" ? "☀ สว่าง" : "☾ มืด"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 11, paddingLeft: 16, borderLeft: "1px solid var(--line2)" }}>
          <Link href="/account" title="บัญชีของฉัน" style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
            <span aria-hidden style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--accent-dim)", border: "1px solid var(--accent2)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--display)", fontWeight: 600, fontSize: 14, flex: "0 0 auto" }}>
              {initials(userName)}
            </span>
            <span style={{ lineHeight: 1.2, minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 600, fontSize: 14, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>{userName}</span>
              <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)", letterSpacing: ".06em" }}>{roleTh}</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => {
              logoutAction();
              router.refresh();
            }}
            title="ออกจากระบบ"
            aria-label="ออกจากระบบ"
            style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".08em", color: "var(--muted)", padding: "6px 8px" }}
          >
            ออก
          </button>
        </div>
      </div>
    </header>
  );
}
