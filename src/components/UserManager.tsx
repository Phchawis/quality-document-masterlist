"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal, { fieldLabel, fieldInput, fieldSelect, btnPrimary, btnGhostModal } from "./Modal";
import { createUser, updateUser, resetPassword, toggleActive } from "@/app/actions/users";
import { ROLE_ORDER, ROLE_META, WORKS, initials } from "@/lib/reference";
import type { Role } from "@/generated/prisma/enums";

export type UserRow = {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  workId: string | null;
  isActive: boolean;
  createdAt: string;
  self: boolean;
};

export default function UserManager({ users, readOnly = false, isAdmin = false }: { users: UserRow[]; readOnly?: boolean; isAdmin?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [modal, setModal] = useState<null | "create" | { edit: UserRow } | { pw: UserRow }>(null);
  const [error, setError] = useState<string | null>(null);
  const [pw, setPw] = useState("");

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = users
      .map((u, i) => {
        const roleName = ROLE_META[u.role].th.replace(/\s*\(.*\)/, "");
        const workName = WORKS.find((w) => w.id === u.workId)?.nameTh ?? "—";
        const statusText = u.isActive ? "ใช้งาน" : "ปิดใช้งาน";
        return `
          <tr>
            <td style="text-align: center;">${i + 1}</td>
            <td>${u.fullName}</td>
            <td>@${u.username}</td>
            <td>${roleName}</td>
            <td>${workName}</td>
            <td style="text-align: center;">${statusText}</td>
          </tr>
        `;
      })
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>รายงานรายชื่อผู้ใช้งานระบบ</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Sarabun', 'Helvetica Neue', Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: 20px;
              margin: 0 0 8px;
            }
            .header p {
              font-size: 13px;
              margin: 0;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              font-size: 13px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px 10px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .footer {
              margin-top: 40px;
              text-align: right;
              font-size: 11px;
              color: #999;
            }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>รายงานรายชื่อผู้ใช้งานและบทบาทหน้าที่ในระบบ</h1>
            <p>ทะเบียนเอกสารควบคุมคุณภาพ สหเวชศาสตร์ · วันที่พิมพ์: ${new Intl.DateTimeFormat('th-TH', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(new Date())}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">ลำดับ</th>
                <th>ชื่อ-นามสกุล</th>
                <th>ชื่อผู้ใช้ (Username)</th>
                <th>บทบาท (สิทธิ์)</th>
                <th>งานสังกัด (หน่วยงาน)</th>
                <th style="width: 80px; text-align: center;">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="footer">
            พิมพ์โดยผู้ดูแลระบบ · หน้า 1/1
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const refresh = () => router.refresh();
  const close = () => { setModal(null); setError(null); setPw(""); };

  const submitCreate = (fd: FormData) =>
    start(async () => {
      const res = await createUser(fd);
      if (!res.ok) setError(res.error ?? "ผิดพลาด");
      else { close(); refresh(); }
    });
  const submitEdit = (u: UserRow, fd: FormData) =>
    start(async () => {
      const res = await updateUser(u.id, fd);
      if (!res.ok) setError(res.error ?? "ผิดพลาด");
      else { close(); refresh(); }
    });
  const submitPw = (u: UserRow) =>
    start(async () => {
      const res = await resetPassword(u.id, pw);
      if (!res.ok) setError(res.error ?? "ผิดพลาด");
      else { close(); refresh(); }
    });

  const cols = readOnly
    ? "minmax(160px,1.4fr) 150px minmax(150px,1fr) 120px 110px"
    : "minmax(160px,1.4fr) 150px minmax(150px,1fr) 120px 110px 150px";

  return (
    <div>
      {(isAdmin || !readOnly) && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 18 }}>
          {isAdmin && (
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                background: "var(--surface)",
                border: "1px solid var(--line2)",
                color: "var(--sub)",
                fontFamily: "var(--display)",
                fontWeight: 600,
                fontSize: 14.5,
                padding: "11px 18px",
                borderRadius: 2,
                cursor: "pointer"
              }}
            >
              ออกรายงาน PDF
            </button>
          )}
          {!readOnly && (
            <button type="button" onClick={() => setModal("create")} style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--accent)", color: "var(--accent-ink)", fontFamily: "var(--display)", fontWeight: 600, fontSize: 14.5, padding: "11px 18px", borderRadius: 2 }}>
              <span aria-hidden style={{ fontFamily: "var(--mono)", fontSize: 17, lineHeight: 1 }}>+</span> เพิ่มผู้ใช้งาน
            </button>
          )}
        </div>
      )}

      <div style={{ border: "1px solid var(--line2)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 840 }}>
            <div style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", background: "var(--surface2)", borderBottom: "1px solid var(--line2)", fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>
              <span style={{ padding: "13px 14px" }}>ชื่อ / บัญชี</span>
              <span style={{ padding: "13px 8px" }}>บทบาท</span>
              <span style={{ padding: "13px 8px" }}>งานสังกัด</span>
              <span style={{ padding: "13px 8px" }}>สถานะ</span>
              <span style={{ padding: "13px 8px" }}>สร้างเมื่อ</span>
              {!readOnly && <span style={{ padding: "13px 8px" }}>จัดการ</span>}
            </div>
            {users.map((u) => (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", borderBottom: "1px solid var(--line)" }}>
                <span style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                  <span aria-hidden style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-dim)", border: "1px solid var(--accent2)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--display)", fontWeight: 600, fontSize: 13, flex: "0 0 auto" }}>{initials(u.fullName)}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.fullName}{u.self ? " · คุณ" : ""}</span>
                    <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>@{u.username}</span>
                  </span>
                </span>
                <span style={{ padding: "12px 8px", fontSize: 13, color: "var(--sub)" }}>{ROLE_META[u.role].th.replace(/\s*\(.*\)/, "")}</span>
                <span style={{ padding: "12px 8px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>{WORKS.find((w) => w.id === u.workId)?.code ?? "—"}</span>
                <span style={{ padding: "12px 8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--mono)", fontSize: 12, color: u.isActive ? "var(--accent)" : "var(--faint)" }}>
                    <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: u.isActive ? "var(--accent)" : "var(--faint)" }} />
                    {u.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </span>
                <span style={{ padding: "12px 8px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>{u.createdAt}</span>
                {!readOnly && (
                  <span style={{ padding: "12px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {!(u.username === "gpharkp" && !u.self) ? (
                      <>
                        <button type="button" onClick={() => setModal({ edit: u })} style={miniBtn}>แก้ไข</button>
                        <button type="button" onClick={() => setModal({ pw: u })} style={miniBtn}>รหัสผ่าน</button>
                        {!u.self && (
                          <button type="button" disabled={pending} onClick={() => start(async () => { await toggleActive(u.id); refresh(); })} style={{ ...miniBtn, color: u.isActive ? "var(--red)" : "var(--accent)" }}>
                            {u.isActive ? "ปิด" : "เปิด"}
                          </button>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: 12.5, color: "var(--muted)", fontStyle: "italic" }}>บัญชีถูกล็อก</span>
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal === "create" && (
        <Modal kicker="เพิ่มผู้ใช้งาน" title="สร้างบัญชีผู้ใช้ใหม่" onClose={close}
          footer={<>
            <button type="button" onClick={close} style={btnGhostModal}>ยกเลิก</button>
            <button type="submit" form="user-create" disabled={pending} style={{ ...btnPrimary, opacity: pending ? 0.7 : 1 }}>สร้างผู้ใช้</button>
          </>}>
          <form id="user-create" action={submitCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={fieldLabel}>ชื่อ-นามสกุล<input name="fullName" placeholder="เช่น ทนพ.สมชาย ใจดี" style={fieldInput} /></label>
            <label style={fieldLabel}>ชื่อผู้ใช้ (username)<input name="username" placeholder="somchai.j" style={fieldInput} /></label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <label style={{ ...fieldLabel, flex: "1 1 180px" }}>บทบาท
                <select name="role" defaultValue="MED_TECH" style={fieldSelect}>
                  {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_META[r].th}</option>)}
                </select>
              </label>
              <label style={{ ...fieldLabel, flex: "1 1 180px" }}>งานสังกัด
                <select name="workId" defaultValue="" style={fieldSelect}>
                  <option value="">— ไม่ระบุ —</option>
                  {WORKS.map((w) => <option key={w.id} value={w.id}>{w.nameTh}</option>)}
                </select>
              </label>
            </div>
            <label style={fieldLabel}>รหัสผ่านเริ่มต้น<input name="password" type="text" placeholder="อย่างน้อย 8 ตัวอักษร" style={fieldInput} /></label>
            {error && <div role="alert" style={{ fontSize: 13.5, color: "var(--red)" }}>{error}</div>}
          </form>
        </Modal>
      )}

      {modal && typeof modal === "object" && "edit" in modal && (
        <Modal kicker="แก้ไขผู้ใช้งาน" title={modal.edit.fullName} onClose={close}
          footer={<>
            <button type="button" onClick={close} style={btnGhostModal}>ยกเลิก</button>
            <button type="submit" form="user-edit" disabled={pending} style={{ ...btnPrimary, opacity: pending ? 0.7 : 1 }}>บันทึก</button>
          </>}>
          <form id="user-edit" action={(fd) => submitEdit(modal.edit, fd)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={fieldLabel}>ชื่อ-นามสกุล<input name="fullName" defaultValue={modal.edit.fullName} style={fieldInput} /></label>
            <label style={fieldLabel}>ชื่อผู้ใช้ (username)<input name="username" defaultValue={modal.edit.username} style={fieldInput} /></label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <label style={{ ...fieldLabel, flex: "1 1 180px" }}>บทบาท
                <select name="role" defaultValue={modal.edit.role} style={fieldSelect}>
                  {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_META[r].th}</option>)}
                </select>
              </label>
              <label style={{ ...fieldLabel, flex: "1 1 180px" }}>งานสังกัด
                <select name="workId" defaultValue={modal.edit.workId ?? ""} style={fieldSelect}>
                  <option value="">— ไม่ระบุ —</option>
                  {WORKS.map((w) => <option key={w.id} value={w.id}>{w.nameTh}</option>)}
                </select>
              </label>
            </div>
            {error && <div role="alert" style={{ fontSize: 13.5, color: "var(--red)" }}>{error}</div>}
          </form>
        </Modal>
      )}

      {modal && typeof modal === "object" && "pw" in modal && (
        <Modal kicker="ตั้งรหัสผ่านใหม่" title={modal.pw.fullName} onClose={close}
          footer={<>
            <button type="button" onClick={close} style={btnGhostModal}>ยกเลิก</button>
            <button type="button" disabled={pending} onClick={() => submitPw(modal.pw)} style={{ ...btnPrimary, opacity: pending ? 0.7 : 1 }}>ตั้งรหัสผ่าน</button>
          </>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>ตั้งรหัสผ่านใหม่ให้ @{modal.pw.username} — แจ้งรหัสให้ผู้ใช้และให้เปลี่ยนภายหลัง</p>
            <label style={fieldLabel}>รหัสผ่านใหม่<input value={pw} onChange={(e) => setPw(e.target.value)} type="text" placeholder="อย่างน้อย 8 ตัวอักษร" style={fieldInput} /></label>
            {error && <div role="alert" style={{ fontSize: 13.5, color: "var(--red)" }}>{error}</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}

const miniBtn: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: 12,
  color: "var(--sub)",
  padding: "5px 10px",
  border: "1px solid var(--line2)",
  borderRadius: 2,
  background: "transparent",
  whiteSpace: "nowrap",
};
