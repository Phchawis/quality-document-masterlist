import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { WORKS, CATEGORIES, DOC_TYPES, STATUS_META, ROLE_META, ACK_TYPES, beDate } from "@/lib/reference";
import { signMedtechHandoff, SSO_ENABLED } from "@/lib/sso";
import type { DocStatus, Role } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const SEG_COLOR: Record<DocStatus, string> = {
  ACTIVE: "var(--accent)",
  REVIEW: "var(--blue)",
  DRAFT: "var(--amber)",
  OBSOLETE: "var(--red)",
};

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  const now = Date.now();
  // ลิงก์ไปยัง Wedapp LAB (งาน MEDTECH) พร้อม token เข้าสู่ระบบอายุสั้น ถ้าตั้งค่า SSO ไว้แล้ว
  const medtechHandoffUrl = SSO_ENABLED
    ? await signMedtechHandoff(user.username).then(
        (t) => `${WORKS.find((w) => w.id === "MEDTECH")?.externalUrl}/?sso=${encodeURIComponent(t)}`,
        () => WORKS.find((w) => w.id === "MEDTECH")?.externalUrl
      )
    : WORKS.find((w) => w.id === "MEDTECH")?.externalUrl;

  const [total, byStatus, byType, byWork, byWorkStatus, ackPendingDocs, recent, yearRows] = await Promise.all([
    prisma.document.count(),
    prisma.document.groupBy({ by: ["status"], _count: true }),
    prisma.document.groupBy({ by: ["typeCode"], _count: true }),
    prisma.document.groupBy({ by: ["workId"], _count: true }),
    prisma.document.groupBy({ by: ["workId", "status"], _count: true }),
    prisma.document.findMany({
      where: { status: "ACTIVE", typeCode: { in: ACK_TYPES }, acks: { none: { userId: user.id } } },
      include: { type: true },
      orderBy: { effectiveAt: "desc" },
      take: 4,
    }),
    prisma.document.findMany({ where: { status: "ACTIVE" }, orderBy: { effectiveAt: "desc" }, take: 6 }),
    prisma.$queryRaw<{ yr: number; n: bigint }[]>`
      SELECT EXTRACT(YEAR FROM "effectiveAt")::int AS yr, COUNT(*) AS n
      FROM "Document" WHERE "effectiveAt" IS NOT NULL
      GROUP BY yr ORDER BY yr`,
  ]);

  const statusCount = (s: DocStatus) => byStatus.find((x) => x.status === s)?._count ?? 0;
  const active = statusCount("ACTIVE");
  const review = statusCount("REVIEW");
  const typeCount = (c: string) => byType.find((x) => x.typeCode === c)?._count ?? 0;
  const workCount = (id: string) => byWork.find((x) => x.workId === id)?._count ?? 0;
  const ackPendingTotal = await prisma.document.count({
    where: { status: "ACTIVE", typeCode: { in: ACK_TYPES }, acks: { none: { userId: user.id } } },
  });

  const dueSoon = await prisma.document.count({
    where: { nextReviewAt: { gt: new Date(now), lt: new Date(now + 120 * 86400000) } },
  });

  const stats = [
    { value: total, label: "เอกสารทั้งหมด", sub: "Total documents", color: "var(--text)" },
    { value: active, label: "ประกาศใช้", sub: "Active", color: "var(--accent)" },
    { value: review, label: "ระหว่างทบทวน", sub: "In review", color: "var(--blue)" },
    { value: ackPendingTotal, label: "รอรับทราบของฉัน", sub: "Awaiting my ack", color: "var(--amber)" },
    { value: dueSoon, label: "ครบกำหนดทบทวน", sub: "Due < 120 days", color: "var(--text)" },
  ];

  const maxType = Math.max(1, ...DOC_TYPES.map((t) => typeCount(t.code)));

  // Year columns (Buddhist era)
  const years = yearRows.map((r) => ({ year: r.yr + 543, n: Number(r.n) }));
  const maxYear = Math.max(1, ...years.map((y) => y.n));

  // Donut
  const statusSeg = (["ACTIVE", "REVIEW", "DRAFT", "OBSOLETE"] as DocStatus[])
    .map((k) => ({ k, n: statusCount(k) }))
    .filter((x) => x.n > 0);
  const CIRC = 2 * Math.PI * 54;
  let accOff = 0;
  const donutSegs = statusSeg.map((x) => {
    const frac = x.n / (total || 1);
    const len = Math.max(0, frac * CIRC - 3);
    const seg = { color: SEG_COLOR[x.k], dash: `${len.toFixed(1)} ${(CIRC - len).toFixed(1)}`, off: (-accOff).toFixed(1) };
    accOff += frac * CIRC;
    return seg;
  });

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      {/* intro */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24, paddingBottom: 26, borderBottom: "1px solid var(--line2)" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".24em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 12 }}>Overview</div>
          <h1 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "clamp(2rem,4.4vw,3.2rem)", letterSpacing: "-.02em", lineHeight: 1, margin: 0 }}>ภาพรวมระบบเอกสาร</h1>
          <p style={{ color: "var(--sub)", margin: "14px 0 0", fontSize: 16 }}>ยินดีต้อนรับ {user.fullName} · บทบาท {ROLE_META[user.role as Role].th}</p>
        </div>
        <div style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", letterSpacing: ".06em", lineHeight: 1.9 }}>
          <div>ณ วันที่ <span style={{ color: "var(--sub)" }}>{beDate(new Date())}</span></div>
          <div>มาตรฐาน <span style={{ color: "var(--sub)" }}>ISO 15189:2022</span></div>
        </div>
      </div>

      {/* stat ledger */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", borderBottom: "1px solid var(--line2)" }}>
        {stats.map((s) => (
          <div key={s.label} style={{ padding: "28px 24px 30px 0", borderRight: "1px solid var(--line)", minWidth: 0 }}>
            <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "clamp(2.2rem,3.6vw,3rem)", lineHeight: 1, color: s.color, letterSpacing: "-.02em" }}>{s.value}</div>
            <div style={{ fontSize: 14, color: "var(--sub)", marginTop: 12, fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, letterSpacing: ".1em", color: "var(--faint)", marginTop: 4, textTransform: "uppercase" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(28px,4vw,56px)", marginTop: 44 }}>
        {/* left column */}
        <div style={{ flex: "1 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: 48 }}>
          {/* works */}
          <section>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
              <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 19, margin: 0 }}>งานภายในฝ่าย</h2>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", letterSpacing: ".08em" }}>3 งาน</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--line2)" }}>
              {WORKS.map((w) => {
                const isExternal = !!w.externalUrl;
                const c = workCount(w.id) || 1;
                const segs = (["ACTIVE", "REVIEW", "DRAFT", "OBSOLETE"] as DocStatus[])
                  .map((k) => ({ k, n: byWorkStatus.find((x) => x.workId === w.id && x.status === k)?._count ?? 0 }))
                  .filter((x) => x.n > 0);
                const rowProps = isExternal
                  ? { href: medtechHandoffUrl as string, target: "_blank", rel: "noreferrer" }
                  : { href: `/masterlist?work=${w.id}` };
                return (
                  <a key={w.id} {...rowProps} style={{ display: "flex", alignItems: "center", gap: 20, padding: "20px 6px", borderBottom: "1px solid var(--line)", textAlign: "left", width: "100%" }}>
                    <span style={{ flex: "0 0 auto" }}>
                      {w.id === "MEDTECH" ? (
                        <Image src="/assets/logo-medtech.jpg" alt="" width={46} height={46} style={{ borderRadius: "50%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <Image src="/assets/seal-tuh.png" alt="" width={46} height={46} style={{ borderRadius: "50%", background: "#fff", padding: 3, display: "block" }} />
                      )}
                    </span>
                    <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ display: "block", fontFamily: "var(--display)", fontWeight: 600, fontSize: 16.5, color: "var(--text)" }}>{w.nameTh}</span>
                        {isExternal && (
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: ".08em", color: "var(--amber)", border: "1px solid var(--amber)", borderRadius: 2, padding: "1px 6px", textTransform: "uppercase" }}>
                            ระบบแยก
                          </span>
                        )}
                      </span>
                      <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", marginTop: 2, letterSpacing: ".04em" }}>{w.nameEn}</span>
                      {!isExternal && (
                        <span style={{ display: "flex", height: 4, marginTop: 11, background: "var(--hi)", overflow: "hidden", maxWidth: 340 }}>
                          {segs.map((sg) => (
                            <span key={sg.k} style={{ display: "block", height: "100%", width: `${(sg.n / c) * 100}%`, background: SEG_COLOR[sg.k] }} />
                          ))}
                        </span>
                      )}
                    </span>
                    <span style={{ flex: "0 0 auto", textAlign: "right" }}>
                      {isExternal ? (
                        <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 11, color: "var(--amber)", letterSpacing: ".05em" }}>เปิดระบบแยก ↗</span>
                      ) : (
                        <>
                          <span style={{ display: "block", fontFamily: "var(--display)", fontWeight: 700, fontSize: 24, color: "var(--text)", lineHeight: 1 }}>{workCount(w.id)}</span>
                          <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--faint)", letterSpacing: ".1em", marginTop: 3 }}>ฉบับ</span>
                          <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: ".05em", marginTop: 7 }}>ดูในทะเบียน →</span>
                        </>
                      )}
                    </span>
                  </a>
                );
              })}
            </div>
          </section>

          {/* types distribution */}
          <section>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
              <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 19, margin: 0 }}>ประเภทเอกสาร</h2>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", letterSpacing: ".08em" }}>9 ประเภท</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {DOC_TYPES.map((t) => {
                const n = typeCount(t.code);
                return (
                  <Link key={t.code} href={`/masterlist?type=${t.code}`} style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", alignItems: "center", gap: 16, padding: "9px 8px", textAlign: "left" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--accent)", letterSpacing: ".04em" }}>{t.code}</span>
                    <span style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontSize: 15, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: "0 1 auto" }}>{t.nameTh}</span>
                      <span style={{ flex: "1 1 40px", height: 3, background: "var(--hi)", minWidth: 24, position: "relative" }}>
                        <span style={{ position: "absolute", inset: "0 auto 0 0", width: `${(n / maxType) * 100}%`, background: "var(--accent2)" }} />
                      </span>
                    </span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--sub)", fontWeight: 500 }}>{n}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* year columns */}
          <section>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
              <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 19, margin: 0 }}>ประกาศใช้ตามปี</h2>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", letterSpacing: ".08em" }}>พ.ศ.</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 118, borderBottom: "2px solid var(--line2)", padding: "0 4px" }}>
              {years.map((y) => (
                <div key={y.year} style={{ flex: "1 1 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", minWidth: 0 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--sub)", marginBottom: 6 }}>{y.n}</span>
                  <span style={{ display: "block", width: "100%", maxWidth: 56, height: `${Math.max(6, Math.round((y.n / maxYear) * 100))}%`, background: "var(--accent-dim)", borderTop: "2px solid var(--accent)" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 14, padding: "8px 4px 0" }}>
              {years.map((y) => (
                <span key={y.year} style={{ flex: "1 1 0", textAlign: "center", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)" }}>{y.year}</span>
              ))}
            </div>
          </section>

          {/* categories */}
          <CategorySection byWorkStatus={byWorkStatus} />
        </div>

        {/* right rail */}
        <div style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column", gap: 40 }}>
          <section style={{ background: "var(--surface)", border: "1px solid var(--line2)", padding: "24px 24px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span aria-hidden style={{ width: 7, height: 7, background: "var(--accent)", borderRadius: "50%" }} />
              <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 16, margin: 0 }}>สัดส่วนสถานะเอกสาร</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
              <div style={{ position: "relative", width: 128, height: 128, flex: "0 0 auto", margin: "0 auto" }}>
                <svg width="128" height="128" viewBox="0 0 132 132" role="img" aria-label="แผนภูมิวงกลมสัดส่วนสถานะเอกสาร">
                  <circle cx="66" cy="66" r="54" fill="none" stroke="var(--hi)" strokeWidth="11" />
                  <g transform="rotate(-90 66 66)">
                    {donutSegs.map((dn, i) => (
                      <circle key={i} cx="66" cy="66" r="54" fill="none" stroke={dn.color} strokeWidth="11" strokeDasharray={dn.dash} strokeDashoffset={dn.off} />
                    ))}
                  </g>
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 26, color: "var(--text)", lineHeight: 1 }}>{total}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: ".12em", marginTop: 3 }}>ฉบับ</span>
                </div>
              </div>
              <div style={{ flex: "1 1 150px", minWidth: 0, display: "flex", flexDirection: "column" }}>
                {statusSeg.map((x) => (
                  <div key={x.k} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
                    <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: SEG_COLOR[x.k], flex: "0 0 auto" }} />
                    <span style={{ flex: "1 1 auto", fontSize: 13, color: "var(--sub)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{STATUS_META[x.k].th}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--text)" }}>{x.n}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--faint)", minWidth: 36, textAlign: "right" }}>{Math.round((x.n / (total || 1)) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section style={{ background: "var(--surface)", border: "1px solid var(--line2)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span aria-hidden style={{ width: 7, height: 7, background: "var(--amber)", borderRadius: "50%" }} />
              <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 16, margin: 0 }}>รอลงนามรับทราบ</h2>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "0 0 18px" }}>เอกสารที่คุณต้องอ่านและรับทราบ</p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {ackPendingDocs.length === 0 ? (
                <div style={{ padding: "20px 0", fontSize: 14, color: "var(--muted)", textAlign: "center", borderTop: "1px solid var(--line)" }}>รับทราบครบทุกฉบับแล้ว</div>
              ) : (
                ackPendingDocs.map((d) => (
                  <Link key={d.id} href={`/documents/${d.id}`} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderTop: "1px solid var(--line)", textAlign: "left" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", letterSpacing: ".02em", flex: "0 0 auto", paddingTop: 2 }}>{d.code}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 14, color: "var(--text)", lineHeight: 1.4 }}>{d.title}</span>
                      <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>v.{String(d.version).padStart(2, "0")} · {d.typeCode}</span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <span aria-hidden style={{ width: 7, height: 7, background: "var(--accent)", borderRadius: "50%" }} />
              <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 16, margin: 0 }}>ประกาศใช้ล่าสุด</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recent.map((d) => (
                <Link key={d.id} href={`/documents/${d.id}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 0", borderTop: "1px solid var(--line)", textAlign: "left" }}>
                  <span style={{ minWidth: 0, flex: "1 1 auto" }}>
                    <span style={{ display: "block", fontSize: 14, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.title}</span>
                    <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{d.code}</span>
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", flex: "0 0 auto", whiteSpace: "nowrap" }}>{beDate(d.effectiveAt)}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Category grid grouped by work — links into the masterlist.
function CategorySection({ byWorkStatus }: { byWorkStatus: { workId: string; status: DocStatus; _count: number }[] }) {
  // Aggregate per work+category is heavier; render a simple category legend linking to filters.
  void byWorkStatus;
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 19, margin: 0 }}>หมวดงาน</h2>
        <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", letterSpacing: ".08em", marginLeft: "auto" }}>{CATEGORIES.length} หมวด</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)" }}>
        {CATEGORIES.map((c) => (
          <Link key={c.code} href={`/masterlist?cat=${c.code}`} style={{ background: "var(--bg)", padding: "15px 14px", textAlign: "left" }}>
            <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--accent)", letterSpacing: ".03em" }}>{c.code}</span>
              {c.subs && <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--faint)" }}>{c.subs.length} ย่อย</span>}
            </span>
            <span style={{ display: "block", fontSize: 13.5, color: "var(--sub)", marginTop: 7, lineHeight: 1.4 }}>{c.nameTh}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
