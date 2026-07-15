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
        const badgeClass = u.isActive ? "badge badge-active" : "badge badge-inactive";
        const statusText = u.isActive ? "ใช้งาน" : "ปิดใช้งาน";
        return `
          <tr>
            <td style="text-align: center; color: #718096; font-family: monospace;">${i + 1}</td>
            <td style="font-weight: 600;">${u.fullName}</td>
            <td style="font-family: monospace; color: #4a5568;">@${u.username}</td>
            <td>${roleName}</td>
            <td>${workName}</td>
            <td style="text-align: center;"><span class="${badgeClass}">${statusText}</span></td>
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
              padding: 40px;
              color: #1a202c;
              background-color: #fff;
              line-height: 1.5;
            }
            .header-container {
              border-bottom: 2px solid #2d3748;
              padding-bottom: 15px;
              margin-bottom: 25px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .title-section h1 {
              font-size: 20px;
              margin: 0 0 6px;
              color: #1a365d;
              font-weight: 700;
            }
            .title-section p {
              font-size: 13px;
              margin: 0;
              color: #4a5568;
            }
            .meta-section {
              text-align: right;
              font-size: 12px;
              color: #718096;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 13px;
            }
            th {
              background-color: #f7fafc;
              color: #2d3748;
              font-weight: 700;
              border-top: 2px solid #2d3748;
              border-bottom: 2px solid #2d3748;
              padding: 10px 12px;
              text-align: left;
            }
            td {
              border-bottom: 1px solid #e2e8f0;
              padding: 10px 12px;
              color: #2d3748;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
            }
            .badge-active {
              background-color: #def7ec;
              color: #03543f;
              border: 1px solid #bdf2d5;
            }
            .badge-inactive {
              background-color: #fde8e8;
              color: #9b1c1c;
              border: 1px solid #fbd5d5;
            }
            .footer {
              position: fixed;
              bottom: 30px;
              left: 40px;
              right: 40px;
              border-top: 1px solid #e2e8f0;
              padding-top: 12px;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #a0aec0;
            }
            @media print {
              body { padding: 0; }
              .footer { left: 0; right: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="title-section">
              <h1>รายงานรายชื่อผู้ใช้งานและบทบาทหน้าที่ในระบบ</h1>
              <p>ทะเบียนเอกสารควบคุมคุณภาพ งานเทคนิคการแพทย์ สหเวชศาสตร์</p>
            </div>
            <div class="meta-section">
              <div>วันที่พิมพ์: ${new Intl.DateTimeFormat('th-TH', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(new Date())}</div>
              <div>จำนวนผู้ใช้ทั้งหมด: ${users.length} รายการ</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">ลำดับ</th>
                <th>ชื่อ-นามสกุล</th>
                <th>ชื่อผู้ใช้ (Username)</th>
                <th>บทบาท (สิทธิ์)</th>
                <th>งานสังกัด (หน่วยงาน)</th>
                <th style="width: 100px; text-align: center;">สถานะการใช้งาน</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="footer">
            <div>ระบบทะเบียนเอกสารควบคุมคุณภาพ (Quality Document Control)</div>
            <div>พิมพ์โดยผู้ดูแลระบบ · หน้า 1 / 1</div>
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
                gap: 8,
                background: "var(--surface)",
                border: "1px solid var(--line2)",
                color: "var(--sub)",
                fontFamily: "var(--display)",
                fontWeight: 600,
                fontSize: 14.5,
                padding: "11px 18px",
                borderRadius: 2,
                cursor: "pointer",
                transition: "all .15s ease"
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--red)", flexShrink: 0 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
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
