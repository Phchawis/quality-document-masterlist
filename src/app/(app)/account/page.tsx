import { getCurrentUser } from "@/lib/auth";
import { ROLE_META, WORKS } from "@/lib/reference";
import type { Role } from "@/generated/prisma/enums";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = (await getCurrentUser())!;
  const work = WORKS.find((w) => w.id === user.workId);

  const info = [
    { k: "ชื่อ-นามสกุล", v: user.fullName },
    { k: "ชื่อผู้ใช้", v: `@${user.username}` },
    { k: "บทบาท", v: ROLE_META[user.role as Role].th },
    { k: "งานสังกัด", v: work?.nameTh ?? "—" },
  ];

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <div style={{ paddingBottom: 26, borderBottom: "1px solid var(--line2)" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".24em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 12 }}>Account</div>
        <h1 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "clamp(1.8rem,3.8vw,2.8rem)", letterSpacing: "-.02em", lineHeight: 1, margin: 0 }}>บัญชีของฉัน</h1>
        <p style={{ color: "var(--sub)", margin: "14px 0 0", fontSize: 16 }}>ข้อมูลบัญชีและการเปลี่ยนรหัสผ่าน</p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(28px,4vw,56px)", marginTop: 32 }}>
        <section style={{ flex: "1 1 300px", minWidth: 0 }}>
          <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 16, margin: "0 0 16px" }}>ข้อมูลบัญชี</h2>
          <dl style={{ margin: 0, border: "1px solid var(--line2)", borderRadius: 3, padding: "6px 18px 10px", background: "var(--surface)" }}>
            {info.map((m) => (
              <div key={m.k} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "11px 0", borderBottom: "1px solid var(--line)" }}>
                <dt style={{ fontSize: 13.5, color: "var(--muted)" }}>{m.k}</dt>
                <dd style={{ margin: 0, fontSize: 14, color: "var(--text)", textAlign: "right" }}>{m.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section style={{ flex: "1 1 360px", minWidth: 0 }}>
          <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 16, margin: "0 0 16px" }}>เปลี่ยนรหัสผ่าน</h2>
          <ChangePasswordForm />
        </section>
      </div>
    </div>
  );
}
