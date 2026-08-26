import { redirect } from "next/navigation";
import { requireUserAllowPasswordChange } from "@/lib/auth";
import ForcePasswordForm from "@/components/ForcePasswordForm";

export const dynamic = "force-dynamic";

/* หน้าบังคับตั้งรหัสผ่านใหม่ — อยู่นอกกลุ่ม (app) โดยตั้งใจ
   เพราะ layout ของ (app) เรียก requireUser() ซึ่งจะ redirect กลับมาที่นี่วนไม่รู้จบ

   ใช้กับบัญชีที่ผู้ดูแลสร้าง/รีเซ็ตรหัสให้ด้วยรหัสชั่วคราวชุดเดียวกัน —
   ถ้าไม่บังคับเปลี่ยน ผู้อื่นที่รู้รหัสชั่วคราวจะสวมรอยลงนามรับทราบเอกสารแทนได้ */
export default async function ChangePasswordPage() {
  const user = await requireUserAllowPasswordChange();
  // ตั้งรหัสของตัวเองแล้ว ไม่ต้องอยู่หน้านี้อีก
  if (!user.mustChangePassword) redirect("/");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "clamp(20px,5vw,48px)",
        background: "var(--bg)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 460, animation: "fadeUp .4s ease both" }}>
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              letterSpacing: ".2em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 10,
            }}
          >
            ตั้งรหัสผ่านของคุณ
          </div>
          <h1
            style={{
              fontFamily: "var(--display)",
              fontWeight: 700,
              fontSize: "clamp(1.5rem,3vw,2rem)",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            สวัสดี {user.fullName}
          </h1>
          <p style={{ color: "var(--sub)", margin: "12px 0 0", fontSize: 15, lineHeight: 1.65 }}>
            บัญชีนี้ยังใช้<b style={{ color: "var(--text)", fontWeight: 600 }}>รหัสผ่านชั่วคราว</b>ที่ผู้ดูแลตั้งให้
            ซึ่งใช้ร่วมกันทั้งหน่วยงาน — กรุณาตั้งรหัสผ่านของคุณเองก่อนเริ่มใช้งาน
          </p>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--amber)",
            borderRadius: 3,
            padding: "14px 16px",
            marginBottom: 20,
            fontSize: 13.5,
            color: "var(--sub)",
            lineHeight: 1.65,
          }}
        >
          หากไม่เปลี่ยน ผู้อื่นที่ทราบรหัสชั่วคราวอาจเข้าใช้บัญชีของคุณและ
          <b style={{ color: "var(--text)", fontWeight: 600 }}>ลงนามรับทราบเอกสารแทนคุณได้</b>
        </div>

        <ForcePasswordForm />
      </div>
    </main>
  );
}
