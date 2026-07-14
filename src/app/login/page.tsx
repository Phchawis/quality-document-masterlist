import Image from "next/image";
import { prisma } from "@/lib/db";
import LoginForm from "./login-form";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  const total = await prisma.document.count().catch(() => 0);

  const meta = [
    { idx: "01", value: "3", label: "งานหลัก" },
    { idx: "02", value: "9", label: "ประเภทเอกสาร" },
    { idx: "03", value: String(total), label: "เอกสารควบคุม" },
    { idx: "04", value: "10", label: "หมวดงาน" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexWrap: "wrap", animation: "fadeIn .5s ease both", position: "relative" }}>
      <ThemeToggle style={{ position: "absolute", top: "clamp(16px,3vw,28px)", right: "clamp(16px,3vw,28px)", zIndex: 5 }} />
      {/* Left editorial panel */}
      <section
        style={{
          flex: "1 1 480px",
          minWidth: 0,
          background: "var(--bg2)",
          borderRight: "1px solid var(--line)",
          padding: "clamp(28px,5vw,72px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 48,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Image src="/assets/seal-tuh.png" alt="ตราโรงพยาบาลธรรมศาสตร์เฉลิมพระเกียรติ" width={52} height={52} style={{ borderRadius: "50%", background: "#fff", padding: 3, flex: "0 0 auto" }} />
          <div style={{ lineHeight: 1.35 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--sub)" }}>
              โรงพยาบาลธรรมศาสตร์เฉลิมพระเกียรติ
            </div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 16, color: "var(--text)" }}>
              ฝ่ายสหเวชศาสตร์ · Allied Health Sciences
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 640, animation: "fadeUp .6s ease .05s both" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 13, letterSpacing: ".28em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 12 }}>
            Quality Document Masterlist
          </div>
          <span aria-hidden style={{ display: "block", width: 52, height: 2, background: "var(--accent)", marginBottom: 22, animation: "barGrow .9s cubic-bezier(.2,.7,.3,1) .35s both", transformOrigin: "left" }} />
          <h1 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "clamp(2.6rem,6vw,4.6rem)", lineHeight: 0.98, letterSpacing: "-.02em", margin: "0 0 20px" }}>
            ทะเบียนเอกสาร
            <br />
            คุณภาพ
          </h1>
          <p style={{ fontSize: "clamp(15px,1.6vw,18px)", color: "var(--sub)", maxWidth: "44ch", margin: 0, fontWeight: 300 }}>
            ระบบทะเบียนควบคุมเอกสารคุณภาพห้องปฏิบัติการ ครอบคลุม 3 งาน 9 ประเภทเอกสาร ภายใต้ระบบบริหารคุณภาพตามมาตรฐาน ISO 15189
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", borderTop: "1px solid var(--line2)" }}>
          {meta.map((m) => (
            <div key={m.idx} style={{ padding: "20px 22px 20px 0", borderRight: "1px solid var(--line)", minWidth: 0 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, letterSpacing: ".14em", color: "var(--faint)", marginBottom: 8 }}>{m.idx}</div>
              <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 22, color: "var(--text)", lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Right sign-in */}
      <section
        style={{
          flex: "1 1 400px",
          minWidth: 0,
          padding: "clamp(28px,5vw,64px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <LoginForm next={next} />
      </section>
    </div>
  );
}
