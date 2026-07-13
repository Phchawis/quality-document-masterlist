"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadAttachment, addUrlAttachment, removeAttachment } from "@/app/actions/documents";
import { KIND_META } from "@/lib/reference";
import type { AttachmentKind } from "@/generated/prisma/enums";

export type AttView = {
  id: string;
  kind: AttachmentKind;
  filename: string;
  note: string;
  hasFile: boolean;
  url: string | null;
};

const btnMini: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: 12.5,
  color: "var(--accent)",
  padding: "6px 12px",
  border: "1px solid var(--accent2)",
  borderRadius: 2,
  background: "transparent",
  whiteSpace: "nowrap",
  cursor: "pointer",
};
const btnMiniGhost: React.CSSProperties = { ...btnMini, color: "var(--sub)", border: "1px solid var(--line2)" };

export default function AttachmentManager({ documentId, atts, canUpload, canView }: { documentId: string; atts: AttView[]; canUpload: boolean; canView: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () => router.refresh();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    e.target.value = "";
    setMsg(null);
    start(async () => {
      const res = await uploadAttachment(documentId, fd);
      if (!res.ok) setMsg(res.error ?? "อัปโหลดไม่สำเร็จ");
      refresh();
    });
  };

  const onAddUrl = () => {
    if (!url.trim()) return;
    setMsg(null);
    start(async () => {
      const res = await addUrlAttachment(documentId, url);
      if (!res.ok) setMsg(res.error ?? "เพิ่มลิงก์ไม่สำเร็จ");
      else setUrl("");
      refresh();
    });
  };

  const onRemove = (id: string) => start(async () => { await removeAttachment(id); refresh(); });

  return (
    <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--line2)" }}>
      {atts.map((a) => {
        const meta = KIND_META[a.kind];
        const fileHref = a.hasFile ? `/api/files/${a.id}` : null;
        return (
          <div key={a.id} style={{ padding: "15px 4px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, letterSpacing: ".05em", padding: "6px 9px", border: "1px solid var(--line2)", borderRadius: 2, color: meta.color, flex: "0 0 auto" }}>{meta.tag}</span>
              <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 14, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.filename}</span>
                <span style={{ display: "block", fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{a.note}</span>
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 11 }}>
              {a.kind === "PDF" && fileHref && canView && (
                <>
                  <a href={fileHref} target="_blank" rel="noreferrer" style={btnMini}>เปิดดูในเว็บ</a>
                  <a href={`${fileHref}?download=1`} style={btnMiniGhost}>ดาวน์โหลด</a>
                </>
              )}
              {(a.kind === "WORD" || a.kind === "EXCEL") && fileHref && (
                <a href={`${fileHref}?download=1`} style={btnMini}>ดาวน์โหลดไปแก้ไข</a>
              )}
              {a.kind === "URL" && a.url && (
                <a href={a.url} target="_blank" rel="noreferrer" style={btnMini}>เปิดลิงก์ ↗</a>
              )}
              {!a.hasFile && a.kind !== "URL" && (
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--faint)", padding: "6px 0" }}>ยังไม่มีไฟล์จริง · อัปโหลดด้านล่าง</span>
              )}
              {canUpload && (
                <button type="button" onClick={() => onRemove(a.id)} disabled={pending} style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--red)", padding: "6px 12px", border: "1px solid transparent", background: "transparent", whiteSpace: "nowrap" }}>
                  ลบ
                </button>
              )}
            </div>
          </div>
        );
      })}

      {canUpload && (
        <div style={{ marginTop: 16, border: "1px dashed var(--line3)", background: "var(--surface)", padding: "17px 18px" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, letterSpacing: ".14em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 13 }}>แนบไฟล์เพิ่ม</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={pending} style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "var(--display)", fontWeight: 600, fontSize: 14, padding: "10px 16px", border: "1px solid var(--line2)", color: "var(--text)", borderRadius: 2, background: "var(--bg)" }}>
              ↑ เลือกไฟล์จากเครื่อง
            </button>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>รองรับ .pdf .docx .xlsx</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https:// วางลิงก์ระบบ, E-Doc, แอปพลิเคชัน…"
              aria-label="แนบลิงก์"
              style={{ flex: "1 1 240px", minWidth: 0, background: "var(--bg)", border: "1px solid var(--line2)", color: "var(--text)", padding: "10px 13px", fontFamily: "var(--mono)", fontSize: 13, borderRadius: 2, outline: "none" }}
            />
            <button type="button" onClick={onAddUrl} disabled={pending} style={btnMini}>+ เพิ่มลิงก์</button>
          </div>
          {msg && <p style={{ fontSize: 12.5, color: "var(--red)", margin: "11px 0 0" }}>{msg}</p>}
          {!msg && <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "11px 0 0" }}>ไฟล์และลิงก์ที่แนบใหม่จะแสดงในรายการด้านบนทันที</p>}
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={onFile} aria-hidden tabIndex={-1} style={{ display: "none" }} />
        </div>
      )}
    </div>
  );
}
