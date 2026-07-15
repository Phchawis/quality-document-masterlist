import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentById } from "@/lib/documents";
import { STATUS_META, WORKS, CATEGORIES, DOC_TYPES, ACK_TYPES, can, canUserEdit, beDate } from "@/lib/reference";
import DocumentActions from "@/components/DocumentActions";
import AttachmentManager, { type AttView } from "@/components/AttachmentManager";

export const dynamic = "force-dynamic";

const secLabel: React.CSSProperties = { fontFamily: "var(--display)", fontWeight: 600, fontSize: 16, margin: "0 0 18px" };

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  const doc = await getDocumentById(id);
  if (!doc) notFound();

  const type = DOC_TYPES.find((t) => t.code === doc.typeCode);
  const work = WORKS.find((w) => w.id === doc.workId);
  const category = CATEGORIES.find((c) => c.code === doc.categoryCode);
  const st = STATUS_META[doc.status];
  const ackByMe = doc.acks.some((a) => a.userId === user.id);
  const isMedTech = doc.workId === "MEDTECH";

  // Ack scope = active users in the same work (fallback to all active users).
  const [ackScope, ackDoneCount] = await Promise.all([
    prisma.user.count({ where: { isActive: true, ...(doc.workId ? { workId: doc.workId } : {}) } }),
    prisma.acknowledgement.count({ where: { documentId: doc.id } }),
  ]);
  const scope = Math.max(ackScope, ackDoneCount, 1);
  const ackPct = Math.round((ackDoneCount / scope) * 100);

  const ackRequired = ACK_TYPES.includes(doc.typeCode);
  const version = String(doc.version).padStart(2, "0");
  const nextVer = String(doc.version + 1).padStart(2, "0");

  const meta = [
    { k: "รหัสเอกสาร", v: doc.code, mono: true },
    { k: "ประเภทเอกสาร", v: `${doc.typeCode} · ${type?.nameTh}` },
    { k: "งาน", v: work?.nameTh ?? "" },
    { k: "หมวดงาน", v: isMedTech && category ? `${category.code} · ${category.nameTh}` : "—" },
    { k: "หมวดย่อย", v: doc.subCategory?.name ?? "—" },
    { k: "เวอร์ชันปัจจุบัน", v: `v.${version}`, mono: true },
    { k: "วันที่ประกาศใช้", v: beDate(doc.effectiveAt), mono: true },
    { k: "แก้ไขล่าสุด", v: beDate(doc.revisedAt), mono: true },
    { k: "กำหนดทบทวนถัดไป", v: beDate(doc.nextReviewAt), mono: true },
    { k: "ผู้จัดทำ / เจ้าของ", v: doc.ownerName },
    { k: "ผู้อนุมัติ", v: doc.approverName },
    { k: "สถานะการควบคุม", v: doc.controlled ? "เอกสารควบคุม" : "ไม่ควบคุม" },
    { k: "ข้อกำหนดอ้างอิง", v: "ISO 15189:2022", mono: true },
  ].filter((m) => m.v && m.v !== "—");

  const daysToNext = doc.nextReviewAt ? Math.max(0, Math.ceil((doc.nextReviewAt.getTime() - Date.now()) / 86400000)) : 0;
  const firstDate = doc.revisions.length ? beDate(doc.revisions[doc.revisions.length - 1].createdAt) : beDate(doc.effectiveAt);
  const mkDot = (c: string, fill: boolean): React.CSSProperties => ({ width: 11, height: 11, borderRadius: "50%", border: `2px solid ${c}`, background: fill ? c : "var(--bg)" });
  const timeline = [
    { label: "จัดทำครั้งแรก", date: firstDate, dotStyle: mkDot("var(--line3)", true), topStyle: "2px solid var(--line2)" },
    { label: "ประกาศใช้", date: beDate(doc.effectiveAt), dotStyle: mkDot("var(--accent)", true), topStyle: "2px solid var(--line2)" },
    { label: `แก้ไขล่าสุด · v.${version}`, date: beDate(doc.revisedAt), dotStyle: mkDot("var(--blue)", true), topStyle: "2px solid var(--line2)" },
    { label: `ทบทวนถัดไป · อีก ${daysToNext} วัน`, date: beDate(doc.nextReviewAt), dotStyle: mkDot("var(--amber)", false), topStyle: "2px dashed var(--line3)" },
  ];

  const attViews: AttView[] = doc.attachments.map((a) => ({
    id: a.id,
    kind: a.kind,
    filename: a.filename,
    note: a.note,
    hasFile: !!a.storedName,
    url: a.url,
  }));

  // Ack list (recent 6, current user pinned).
  const ackList = doc.acks.slice(0, 6).map((a) => ({ name: a.user.fullName, date: beDate(a.createdAt), me: a.userId === user.id }));

  return (
    <div style={{ animation: "fadeUp .35s ease both" }}>
      <Link href="/masterlist" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "var(--mono)", fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
        <span aria-hidden>←</span> กลับสู่ทะเบียนเอกสาร
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        {isMedTech && <Image src="/assets/logo-medtech.jpg" alt="" width={22} height={22} style={{ borderRadius: "50%", objectFit: "cover", flex: "0 0 auto" }} />}
        <span style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".1em", color: "var(--muted)" }}>{work?.nameTh}{category ? ` · ${category.nameTh}` : ""}</span>
      </div>

      <div style={{ paddingBottom: 26, borderBottom: "1px solid var(--line2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 600, color: "var(--accent)", letterSpacing: ".03em" }}>{doc.code}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", border: `1px solid ${st.color}`, borderRadius: 2, fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".06em", color: st.color }}>
            <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: st.color }} />
            {st.th}
          </span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>v.{version}</span>
        </div>
        <h1 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "clamp(1.5rem,3vw,2.3rem)", lineHeight: 1.14, letterSpacing: "-.01em", margin: 0, maxWidth: "24ch" }}>{doc.title}</h1>
        <div style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--muted)", marginTop: 14, letterSpacing: ".03em" }}>{doc.typeCode} · {type?.nameTh}</div>
      </div>

      <DocumentActions
        documentId={doc.id}
        code={doc.code}
        title={doc.title}
        version={version}
        nextVer={nextVer}
        ackRequired={ackRequired}
        ackByMe={ackByMe}
        canAck={can(user.role, "acknowledge")}
        showPublish={(doc.status === "DRAFT" || doc.status === "REVIEW") && canUserEdit(user, "publish")}
        showRevise={canUserEdit(user, "revise") && doc.status !== "OBSOLETE"}
        showCancel={canUserEdit(user, "register") && doc.status !== "OBSOLETE"}
        showDelete={canUserEdit(user, "register") && doc.status === "DRAFT" && ackDoneCount === 0}
      />

      {/* timeline */}
      <div style={{ marginTop: 28, border: "1px solid var(--line2)", background: "var(--surface)" }}>
        <div style={{ padding: "13px 18px", borderBottom: "1px solid var(--line)", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted)" }}>วงจรเอกสาร · Document Lifecycle</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "22px 20px", padding: "22px 18px 20px" }}>
          {timeline.map((tl, i) => (
            <div key={i} style={{ position: "relative", borderTop: tl.topStyle, padding: "14px 12px 0 0" }}>
              <span aria-hidden style={{ position: "absolute", top: -7, left: 0, ...tl.dotStyle }} />
              <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", letterSpacing: ".04em" }}>{tl.date}</span>
              <span style={{ display: "block", fontSize: 13.5, color: "var(--text)", marginTop: 4, fontWeight: 500 }}>{tl.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(28px,4vw,48px)", marginTop: 32 }}>
        <div style={{ flex: "1 1 440px", minWidth: 0, display: "flex", flexDirection: "column", gap: 40 }}>
          <section>
            <h2 style={secLabel}>ขอบเขตและวัตถุประสงค์</h2>
            <p style={{ fontSize: 16.5, color: "var(--sub)", lineHeight: 1.75, margin: 0, maxWidth: "64ch" }}>{doc.description}</p>
          </section>

          <section>
            <h2 style={secLabel}>ไฟล์แนบ</h2>
            <AttachmentManager documentId={doc.id} atts={attViews} canUpload={canUserEdit(user, "upload")} canView={true} />
          </section>

          <section>
            <h2 style={secLabel}>ประวัติการแก้ไข</h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {doc.revisions.map((rv) => (
                <div key={rv.id} style={{ display: "flex", gap: 18, padding: "16px 0", borderTop: "1px solid var(--line)" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600, color: "var(--accent)", flex: "0 0 auto", width: 46 }}>v.{String(rv.version).padStart(2, "0")}</span>
                  <span style={{ minWidth: 0, flex: "1 1 auto" }}>
                    <span style={{ display: "block", fontSize: 15, color: "var(--text)", lineHeight: 1.45 }}>{rv.note}</span>
                    <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{beDate(rv.createdAt)} · {rv.byName}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column", gap: 26 }}>
          <section style={{ background: "var(--surface)", border: "1px solid var(--line2)" }}>
            <div style={{ padding: "15px 18px", borderBottom: "1px solid var(--line2)", fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)" }}>ข้อมูลควบคุมเอกสาร</div>
            <dl style={{ margin: 0, padding: "6px 18px 14px" }}>
              {meta.map((m) => (
                <div key={m.k} style={{ display: "flex", gap: 14, justifyContent: "space-between", alignItems: "baseline", padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
                  <dt style={{ fontSize: 13.5, color: "var(--muted)", flex: "0 0 auto" }}>{m.k}</dt>
                  <dd style={{ margin: 0, fontSize: 14, color: "var(--text)", textAlign: "right", fontFamily: m.mono ? "var(--mono)" : undefined, letterSpacing: m.mono ? ".02em" : undefined }}>{m.v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section style={{ background: "var(--surface)", border: "1px solid var(--line2)", padding: 18 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 14 }}>การรับทราบเอกสาร</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 30, color: "var(--text)", lineHeight: 1 }}>{ackDoneCount}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--muted)", paddingBottom: 5 }}>/ {scope} คนในหมวด</span>
            </div>
            <div style={{ height: 5, background: "var(--hi)", marginBottom: 6 }}>
              <span style={{ display: "block", height: "100%", width: `${ackPct}%`, background: "var(--accent)" }} />
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>{ackPct}% รับทราบแล้ว</div>
            <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--line)" }}>
              {ackList.length === 0 && <div style={{ padding: "12px 0", fontSize: 13, color: "var(--muted)" }}>ยังไม่มีผู้รับทราบ</div>}
              {ackList.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
                  <span style={{ fontSize: 13.5, color: p.me ? "var(--accent)" : "var(--text)" }}>{p.name}{p.me ? " · คุณ" : ""}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>{p.date}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
