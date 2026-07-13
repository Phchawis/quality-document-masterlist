import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ROLE_META, ACK_TYPES } from "@/lib/reference";
import type { Role } from "@/generated/prisma/enums";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // Count documents this user must still acknowledge (active QM/SP/WI not yet acked).
  const ackPending = await prisma.document.count({
    where: {
      status: "ACTIVE",
      typeCode: { in: ACK_TYPES },
      acks: { none: { userId: user.id } },
    },
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header
        userName={user.fullName}
        roleTh={ROLE_META[user.role as Role].th}
        isAdmin={user.role === "SYSADMIN"}
        ackPending={ackPending}
      />
      <main style={{ flex: "1 1 auto", width: "100%", maxWidth: 1360, margin: "0 auto", padding: "clamp(24px,4vw,48px) clamp(16px,3vw,32px)" }}>
        {children}
      </main>
      <footer style={{ borderTop: "1px solid var(--line2)", marginTop: 40 }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "22px clamp(16px,3vw,32px)", display: "flex", flexWrap: "wrap", gap: "12px 24px", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".06em", color: "var(--faint)" }}>
          <span>ฝ่ายสหเวชศาสตร์ · โรงพยาบาลธรรมศาสตร์เฉลิมพระเกียรติ</span>
          <span>QUALITY DOCUMENT MASTERLIST · ISO 15189:2022</span>
        </div>
      </footer>
    </div>
  );
}
