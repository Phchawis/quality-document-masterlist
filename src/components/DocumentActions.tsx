"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal, { fieldLabel, fieldInput, btnPrimary, btnGhostModal, btnDangerSolid } from "./Modal";
import { acknowledgeDocument, publishDocument, reviseDocument, cancelDocument } from "@/app/actions/documents";

type Props = {
  documentId: string;
  code: string;
  title: string;
  version: string;
  nextVer: string;
  ackRequired: boolean;
  ackByMe: boolean;
  canAck: boolean;
  showPublish: boolean;
  showRevise: boolean;
  showCancel: boolean;
};

const btnGhost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  fontFamily: "var(--display)",
  fontWeight: 600,
  fontSize: 14.5,
  padding: "11px 18px",
  border: "1px solid var(--line2)",
  color: "var(--text)",
  borderRadius: 2,
  background: "transparent",
};
const btnDanger: React.CSSProperties = { ...btnGhost, border: "1px solid rgba(210,105,95,.4)", color: "var(--red)" };

export default function DocumentActions(p: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [modal, setModal] = useState<null | "revise" | "cancel">(null);
  const [note, setNote] = useState("");

  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); setModal(null); router.refresh(); });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "22px 0 6px" }}>
      {p.ackRequired &&
        (p.ackByMe ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--display)", fontWeight: 600, fontSize: 14.5, padding: "11px 18px", border: "1px solid var(--accent2)", color: "var(--accent)", borderRadius: 2 }}>
            ✓ รับทราบแล้ว
          </span>
        ) : (
          p.canAck && (
            <button type="button" disabled={pending} onClick={() => run(() => acknowledgeDocument(p.documentId))} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--accent)", color: "var(--accent-ink)", fontFamily: "var(--display)", fontWeight: 600, fontSize: 14.5, padding: "11px 18px", borderRadius: 2, opacity: pending ? 0.7 : 1 }}>
              บันทึกการอ่าน / รับทราบ
            </button>
          )
        ))}

      {p.showPublish && (
        <button type="button" disabled={pending} onClick={() => run(() => publishDocument(p.documentId))} style={btnGhost}>
          บันทึกประกาศใช้
        </button>
      )}
      {p.showRevise && (
        <button type="button" onClick={() => setModal("revise")} style={btnGhost}>
          บันทึกแก้ไข
        </button>
      )}
      {p.showCancel && (
        <button type="button" onClick={() => setModal("cancel")} style={btnDanger}>
          ยกเลิกการใช้งาน
        </button>
      )}

      {modal === "revise" && (
        <Modal
          kicker="บันทึกการแก้ไข"
          title="แก้ไขและปรับปรุงเวอร์ชัน"
          onClose={() => !pending && setModal(null)}
          footer={
            <>
              <button type="button" onClick={() => setModal(null)} style={btnGhostModal}>ยกเลิก</button>
              <button type="button" disabled={pending} onClick={() => run(() => reviseDocument(p.documentId, note))} style={{ ...btnPrimary, opacity: pending ? 0.7 : 1 }}>
                บันทึกการแก้ไข
              </button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--muted)" }}>{p.code} · v.{p.version} → v.{p.nextVer}</div>
            <div style={{ fontSize: 15.5, color: "var(--text)" }}>{p.title}</div>
            <label style={fieldLabel}>
              บันทึกรายละเอียดการแก้ไข
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="ระบุสาระสำคัญของการแก้ไข…" style={{ ...fieldInput, resize: "vertical", minHeight: 82 }} />
            </label>
          </div>
        </Modal>
      )}

      {modal === "cancel" && (
        <Modal
          kicker="ยกเลิกการใช้งาน"
          title="ยกเลิกการใช้งานเอกสาร"
          onClose={() => !pending && setModal(null)}
          footer={
            <>
              <button type="button" onClick={() => setModal(null)} style={btnGhostModal}>ยกเลิก</button>
              <button type="button" disabled={pending} onClick={() => run(() => cancelDocument(p.documentId))} style={{ ...btnDangerSolid, opacity: pending ? 0.7 : 1 }}>
                ยืนยันยกเลิก
              </button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 15.5, color: "var(--sub)", margin: 0, lineHeight: 1.75 }}>
              ยืนยันการยกเลิกการใช้งานเอกสาร <span style={{ fontFamily: "var(--mono)", color: "var(--text)" }}>{p.code}</span> — เอกสารจะถูกเปลี่ยนสถานะเป็น “ยกเลิกใช้” และไม่นับเป็นฉบับที่ใช้งาน
            </p>
            <div style={{ fontSize: 14, color: "var(--muted)" }}>{p.title}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}
