"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { STATUS_META, KIND_META, WORKS, ACK_TYPES, beDate } from "@/lib/reference";
import { acknowledgeDocuments } from "@/app/actions/documents";

type DocType = {
  id: string;
  code: string;
  title: string;
  typeCode: string;
  workId: string;
  categoryCode: string | null;
  version: number;
  status: "ACTIVE" | "REVIEW" | "DRAFT" | "OBSOLETE";
  effectiveAt: Date | null;
  type: {
    nameTh: string;
  };
  attachments: {
    id: string;
    kind: "PDF" | "WORD" | "EXCEL" | "URL";
  }[];
  acks: {
    userId: string;
  }[];
};

type Props = {
  docs: DocType[];
  cols: string;
  canAck: boolean;
  userId: string;
  sortLink: (key: string) => string;
  caret: (key: string) => string;
};

export default function MasterlistTable({
  docs,
  cols,
  canAck,
  userId,
  sortLink,
  caret,
}: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Filter documents that can be acknowledged (ACTIVE, requires ack, and user hasn't acked yet)
  const ackableDocs = docs.filter(
    (d) =>
      d.status === "ACTIVE" &&
      ACK_TYPES.includes(d.typeCode) &&
      !d.acks.some((a) => a.userId === userId)
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(ackableDocs.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const handleBulkAck = () => {
    if (selectedIds.length === 0) return;
    setError(null);
    startTransition(async () => {
      const res = await acknowledgeDocuments(selectedIds);
      if (res && res.ok) {
        setSelectedIds([]);
        router.refresh();
      } else {
        setError(res?.error ?? "เกิดข้อผิดพลาดในการบันทึก");
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {canAck && ackableDocs.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, background: "var(--surface)", border: "1px solid var(--line2)", padding: "12px 16px", borderRadius: 3 }}>
          <div style={{ fontSize: 14, color: "var(--sub)" }}>
            เลือกแล้ว <strong style={{ color: "var(--accent)", fontFamily: "var(--mono)" }}>{selectedIds.length}</strong> จาก <span style={{ fontFamily: "var(--mono)" }}>{ackableDocs.length}</span> ฉบับที่รอการรับทราบของคุณ
          </div>
          <button
            type="button"
            disabled={selectedIds.length === 0 || pending}
            onClick={handleBulkAck}
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: selectedIds.length > 0 ? "var(--accent)" : "var(--surface2)",
              color: selectedIds.length > 0 ? "var(--accent-ink)" : "var(--muted)",
              fontFamily: "var(--display)",
              fontWeight: 600,
              fontSize: 13.5,
              padding: "8px 14px",
              borderRadius: 2,
              cursor: selectedIds.length > 0 ? "pointer" : "not-allowed",
              opacity: pending ? 0.7 : 1,
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {pending ? "กำลังบันทึก…" : "บันทึกการอ่าน / รับทราบกลุ่ม"}
          </button>
          {error && <div style={{ fontSize: 13, color: "var(--red)" }}>{error}</div>}
        </div>
      )}

      <div style={{ border: "1px solid var(--line2)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 940 }}>
            <div style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", background: "var(--surface2)", borderBottom: "1px solid var(--line2)", fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>
              {canAck && (
                <span style={{ padding: "13px 12px", display: "flex", justifyContent: "center" }}>
                  <input
                    type="checkbox"
                    checked={ackableDocs.length > 0 && selectedIds.length === ackableDocs.length}
                    disabled={ackableDocs.length === 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="เลือกทั้งหมดที่รอรับทราบ"
                    style={{ cursor: ackableDocs.length > 0 ? "pointer" : "not-allowed" }}
                  />
                </span>
              )}
              <Link href={sortLink("code")} style={{ padding: "13px 12px", color: "inherit" }}>รหัส{caret("code")}</Link>
              <Link href={sortLink("title")} style={{ padding: "13px 12px", color: "inherit" }}>ชื่อเอกสาร{caret("title")}</Link>
              <span style={{ padding: "13px 8px" }}>ประเภท</span>
              <span style={{ padding: "13px 8px" }}>งาน/หมวด</span>
              <span style={{ padding: "13px 8px" }}>เวอร์ชัน</span>
              <Link href={sortLink("status")} style={{ padding: "13px 8px", color: "inherit" }}>สถานะ{caret("status")}</Link>
              <Link href={sortLink("date")} style={{ padding: "13px 8px", color: "inherit" }}>ประกาศใช้{caret("date")}</Link>
              <span style={{ padding: "13px 8px" }}>ไฟล์แนบ</span>
            </div>
            {docs.map((d) => {
              const isAckable = d.status === "ACTIVE" && ACK_TYPES.includes(d.typeCode) && !d.acks.some((a) => a.userId === userId);
              return (
                <div
                  key={d.id}
                  style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", width: "100%", borderBottom: "1px solid var(--line)", background: selectedIds.includes(d.id) ? "var(--accent-dim)" : "transparent", transition: "background 0.15s" }}
                >
                  {canAck && (
                    <span style={{ padding: "var(--rowpad) 12px", display: "flex", justifyContent: "center" }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(d.id)}
                        disabled={!isAckable}
                        onChange={(e) => handleSelectOne(d.id, e.target.checked)}
                        aria-label={`เลือกเอกสาร ${d.code}`}
                        style={{ cursor: isAckable ? "pointer" : "not-allowed" }}
                      />
                    </span>
                  )}
                  <Link href={`/documents/${d.id}`} style={{ display: "contents", color: "inherit" }}>
                    <span style={{ padding: "var(--rowpad) 12px", fontFamily: "var(--mono)", fontSize: 13, color: "var(--accent)", letterSpacing: ".02em", cursor: "pointer" }}>{d.code}</span>
                    <span style={{ padding: "var(--rowpad) 12px", minWidth: 0, cursor: "pointer" }}>
                      <span style={{ display: "block", fontSize: 15, color: "var(--text)", lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</span>
                    </span>
                    <span style={{ padding: "var(--rowpad) 8px", fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--sub)", cursor: "pointer" }} title={d.type.nameTh}>{d.typeCode}</span>
                    <span style={{ padding: "var(--rowpad) 8px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>
                      {WORKS.find((w) => w.id === d.workId)?.code}
                      {d.categoryCode ? ` · ${d.categoryCode}` : ""}
                    </span>
                    <span style={{ padding: "var(--rowpad) 8px", fontFamily: "var(--mono)", fontSize: 13, color: "var(--sub)", cursor: "pointer" }}>v.{String(d.version).padStart(2, "0")}</span>
                    <span style={{ padding: "var(--rowpad) 8px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} aria-label={`สถานะ: ${STATUS_META[d.status].th}`}>
                      <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", flex: "0 0 auto", background: STATUS_META[d.status].color }} />
                      <span style={{ fontSize: 13.5, color: "var(--sub)", whiteSpace: "nowrap" }}>{STATUS_META[d.status].th}</span>
                    </span>
                    <span style={{ padding: "var(--rowpad) 8px", fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap", cursor: "pointer" }}>{beDate(d.effectiveAt)}</span>
                    <span style={{ padding: "var(--rowpad) 8px", display: "flex", gap: 5, flexWrap: "wrap", cursor: "pointer" }}>
                      {d.attachments.map((a) => (
                        <span key={a.id} aria-label={`ประเภทไฟล์แนบ: ${KIND_META[a.kind].tag}`} style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, letterSpacing: ".05em", padding: "2px 5px", border: "1px solid var(--line2)", borderRadius: 2, color: KIND_META[a.kind].color }}>
                          {KIND_META[a.kind].tag}
                        </span>
                      ))}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
