import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PER_PAGE = 50;

// Thai labels for audit actions.
const ACTION_LABEL: Record<string, string> = {
  LOGIN: "เข้าสู่ระบบ",
  LOGOUT: "ออกจากระบบ",
  REGISTER_DOC: "ลงทะเบียนเอกสาร",
  PUBLISH: "ประกาศใช้",
  REVISE: "บันทึกแก้ไข",
  CANCEL: "ยกเลิกใช้",
  ACK: "รับทราบ",
  UPLOAD: "แนบไฟล์",
  UPLOAD_URL: "แนบลิงก์",
  REMOVE_ATT: "ลบไฟล์แนบ",
  CREATE_USER: "สร้างผู้ใช้",
  UPDATE_USER: "แก้ไขผู้ใช้",
  RESET_PASSWORD: "รีเซ็ตรหัสผ่าน",
  CHANGE_PASSWORD: "เปลี่ยนรหัสผ่าน",
  TOGGLE_USER: "เปิด/ปิดผู้ใช้",
};

const ACTION_COLOR: Record<string, string> = {
  PUBLISH: "var(--accent)",
  CANCEL: "var(--red)",
  REVISE: "var(--blue)",
  ACK: "var(--accent)",
  REGISTER_DOC: "var(--amber)",
  RESET_PASSWORD: "var(--red)",
  TOGGLE_USER: "var(--amber)",
};

function fmt(d: Date): string {
  const t = new Intl.DateTimeFormat("th-TH", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(d);
  return t;
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; action?: string }> }) {
  const me = await getCurrentUser();
  if (!me || me.role !== "SYSADMIN") redirect("/");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const action = sp.action && sp.action !== "ALL" ? sp.action : undefined;
  const where = action ? { action } : {};

  const [total, logs, actionGroups] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE, include: { document: { select: { code: true, id: true } } } }),
    prisma.auditLog.groupBy({ by: ["action"], _count: true, orderBy: { _count: { action: "desc" } } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  const cols = "170px 150px minmax(180px,1fr) 110px";

  const chip = (label: string, value: string, active: boolean) => (
    <Link
      key={value}
      href={value === "ALL" ? "/admin/audit" : `/admin/audit?action=${value}`}
      style={{
        fontFamily: "var(--mono)", fontSize: 12.5, padding: "6px 12px",
        border: `1px solid ${active ? "var(--accent2)" : "var(--line2)"}`,
        background: active ? "var(--accent-dim)" : "transparent",
        color: active ? "var(--accent)" : "var(--sub)", borderRadius: 2, whiteSpace: "nowrap",
      }}
    >
      {label}
    </Link>
  );

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <div style={{ paddingBottom: 26, borderBottom: "1px solid var(--line2)" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".24em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 12 }}>Audit Trail</div>
        <h1 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "clamp(1.8rem,3.8vw,2.8rem)", letterSpacing: "-.02em", lineHeight: 1, margin: 0 }}>บันทึกการตรวจสอบ</h1>
        <p style={{ color: "var(--sub)", margin: "14px 0 0", fontSize: 16, maxWidth: "60ch" }}>ประวัติการดำเนินการทั้งหมดในระบบ เพื่อการตรวจสอบย้อนกลับตามข้อกำหนด ISO 15189 · {total} รายการ</p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "22px 0 16px" }}>
        {chip("ทั้งหมด", "ALL", !action)}
        {actionGroups.map((g) => chip(`${ACTION_LABEL[g.action] ?? g.action} · ${g._count}`, g.action, action === g.action))}
      </div>

      <div style={{ border: "1px solid var(--line2)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 720 }}>
            <div style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", background: "var(--surface2)", borderBottom: "1px solid var(--line2)", fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>
              <span style={{ padding: "13px 14px" }}>เวลา</span>
              <span style={{ padding: "13px 8px" }}>การกระทำ</span>
              <span style={{ padding: "13px 8px" }}>รายละเอียด</span>
              <span style={{ padding: "13px 8px" }}>ผู้ทำ</span>
            </div>
            {logs.map((l) => (
              <div key={l.id} style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", borderBottom: "1px solid var(--line)" }}>
                <span style={{ padding: "11px 14px", fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap" }}>{fmt(l.createdAt)}</span>
                <span style={{ padding: "11px 8px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: ACTION_COLOR[l.action] ?? "var(--sub)" }}>{ACTION_LABEL[l.action] ?? l.action}</span>
                </span>
                <span style={{ padding: "11px 8px", fontSize: 13.5, color: "var(--text)", minWidth: 0 }}>
                  {l.document ? (
                    <Link href={`/documents/${l.document.id}`} style={{ color: "var(--accent)" }}>{l.document.code}</Link>
                  ) : null}
                  {l.document ? " · " : ""}
                  {l.detail}
                </span>
                <span style={{ padding: "11px 8px", fontSize: 13, color: "var(--sub)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.userName || "—"}</span>
              </div>
            ))}
            {logs.length === 0 && <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)" }}>ยังไม่มีบันทึก</div>}
          </div>
        </div>
      </div>

      {pageCount > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginTop: 22 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>หน้า {page} / {pageCount}</span>
          <div style={{ display: "flex", gap: 5 }}>
            <PageLink page={Math.max(1, page - 1)} action={action} label="←" disabled={page === 1} />
            <PageLink page={Math.min(pageCount, page + 1)} action={action} label="→" disabled={page === pageCount} />
          </div>
        </div>
      )}
    </div>
  );
}

function PageLink({ page, action, label, disabled }: { page: number; action?: string; label: string; disabled: boolean }) {
  const href = `/admin/audit?${action ? `action=${action}&` : ""}page=${page}`;
  const style: React.CSSProperties = {
    fontFamily: "var(--mono)", fontSize: 14, padding: "8px 12px",
    border: "1px solid var(--line2)", color: disabled ? "var(--faint)" : "var(--sub)",
    borderRadius: 2, pointerEvents: disabled ? "none" : "auto",
  };
  return <Link href={href} style={style} aria-disabled={disabled}>{label}</Link>;
}
