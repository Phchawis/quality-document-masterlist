import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { beDate, can, canUserEdit } from "@/lib/reference";
import UserManager, { type UserRow } from "@/components/UserManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await getCurrentUser();
  if (!me || !can(me.role, "viewUsers")) redirect("/");
  const readOnly = !canUserEdit(me, "manage");

  const users = await prisma.user.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "asc" }] });
  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    role: u.role,
    workId: u.workId,
    isActive: u.isActive,
    createdAt: beDate(u.createdAt),
    self: u.id === me.id,
  }));

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <div style={{ paddingBottom: 26, borderBottom: "1px solid var(--line2)" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".24em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 12 }}>Administration</div>
        <h1 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "clamp(1.8rem,3.8vw,2.8rem)", letterSpacing: "-.02em", lineHeight: 1, margin: 0 }}>จัดการผู้ใช้งาน</h1>
        <p style={{ color: "var(--sub)", margin: "14px 0 0", fontSize: 16, maxWidth: "60ch" }}>
          {readOnly
            ? `รายชื่อผู้ใช้งานและบทบาทในระบบ (ดูอย่างเดียว — จัดการบัญชีได้เฉพาะผู้ดูแลระบบ) · ${users.length} บัญชี`
            : `เพิ่มบัญชี กำหนดบทบาทและงานสังกัด ตั้งรหัสผ่าน และเปิด/ปิดการใช้งาน · ${users.length} บัญชี`}
        </p>
      </div>
      <div style={{ marginTop: 28 }}>
        <UserManager users={rows} readOnly={readOnly} isAdmin={me.role === "SYSADMIN"} />
      </div>
    </div>
  );
}
