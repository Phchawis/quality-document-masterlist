import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { STATUS_META, WORKS, can } from "@/lib/reference";
import type { DocStatus } from "@/generated/prisma/enums";
import { buildDocWhere, buildDocOrderBy } from "@/lib/documents";
import RegisterButton from "@/components/RegisterButton";
import ExportButton from "@/components/ExportButton";
import FiltersSlot from "@/components/MasterlistFilters";
import MasterlistTable from "@/components/MasterlistTable";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;
const STATUS_KEYS: DocStatus[] = ["ACTIVE", "REVIEW", "DRAFT", "OBSOLETE"];

type SP = { [k: string]: string | undefined };

export default async function MasterlistPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = (await getCurrentUser())!;
  const canAck = can(user.role, "acknowledge");

  const q = (sp.q ?? "").trim();
  const work = sp.work ?? "ALL";
  const type = sp.type ?? "ALL";
  const cat = sp.cat ?? "ALL";
  const sub = sp.sub ?? "ALL";
  const status = sp.status ?? "ALL";
  const ackOnly = sp.ack === "1";
  const sortKey = sp.sort ?? "code";
  const sortDir = (sp.dir ?? "asc") as "asc" | "desc";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where = buildDocWhere(sp, user.id);
  const orderBy = buildDocOrderBy(sortKey, sortDir);

  const [total, docs, stripRows] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      include: {
        type: true,
        attachments: true,
        acks: {
          where: { userId: user.id },
          select: { userId: true },
        },
      },
      orderBy,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.document.groupBy({ by: ["status"], where, _count: true }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const strip = STATUS_KEYS.map((k) => ({ k, n: stripRows.find((x) => x.status === k)?._count ?? 0 })).filter((x) => x.n > 0);

  // Preserve current filters when building sort/page links.
  const baseParams = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v && k !== "page" && k !== "sort" && k !== "dir") baseParams.set(k, v);
  const sortLink = (key: string) => {
    const p = new URLSearchParams(baseParams);
    p.set("sort", key);
    p.set("dir", sortKey === key && sortDir === "asc" ? "desc" : "asc");
    return `/masterlist?${p.toString()}`;
  };
  const pageLink = (n: number) => {
    const p = new URLSearchParams(baseParams);
    if (sortKey !== "code") p.set("sort", sortKey);
    if (sortDir !== "asc") p.set("dir", sortDir);
    p.set("page", String(n));
    return `/masterlist?${p.toString()}`;
  };
  const caret = (key: string) => (sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "");

  const activeChips: { label: string; clear: string }[] = [];
  const clearOne = (key: string) => {
    const p = new URLSearchParams(baseParams);
    p.delete(key);
    return `/masterlist?${p.toString()}`;
  };
  if (q) activeChips.push({ label: `ค้นหา “${q}”`, clear: clearOne("q") });
  if (work !== "ALL") activeChips.push({ label: `งาน · ${WORKS.find((w) => w.id === work)?.code ?? work}`, clear: clearOne("work") });
  if (type !== "ALL") activeChips.push({ label: `ประเภท · ${type}`, clear: clearOne("type") });
  if (cat !== "ALL") activeChips.push({ label: `หมวด · ${cat}`, clear: clearOne("cat") });
  if (sub !== "ALL") activeChips.push({ label: `ย่อย · ${sub}`, clear: clearOne("sub") });
  if (status !== "ALL") activeChips.push({ label: `สถานะ · ${STATUS_META[status as DocStatus].th}`, clear: clearOne("status") });
  if (ackOnly) activeChips.push({ label: "รอรับทราบของฉัน", clear: clearOne("ack") });

  const rangeText = total ? `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, total)} จาก ${total}` : "0";
  const cols = canAck
    ? "38px 132px minmax(230px,1fr) 60px 122px 56px 130px 118px 120px"
    : "132px minmax(230px,1fr) 60px 122px 56px 130px 118px 120px";

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20, paddingBottom: 22, borderBottom: "1px solid var(--line2)" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".24em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 10 }}>Masterlist</div>
          <h1 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "clamp(1.7rem,3.4vw,2.6rem)", letterSpacing: "-.02em", lineHeight: 1, margin: 0 }}>ทะเบียนเอกสารคุณภาพ</h1>
          <p style={{ color: "var(--muted)", margin: "12px 0 0", fontFamily: "var(--mono)", fontSize: 13, letterSpacing: ".04em" }}>แสดง {rangeText} ฉบับ</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <ExportButton />
          {can(user.role, "register") && <RegisterButton />}
        </div>
      </div>

      {/* Filters injected via client component */}
      <FiltersSlot />

      {activeChips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16, alignItems: "center" }}>
          {activeChips.map((c, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--mono)", fontSize: 12, color: "var(--sub)", background: "var(--surface2)", border: "1px solid var(--line2)", padding: "5px 6px 5px 11px", borderRadius: 2 }}>
              {c.label}
              <Link href={c.clear} aria-label="ลบตัวกรอง" style={{ color: "var(--muted)", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                ✕
              </Link>
            </span>
          ))}
          <Link href="/masterlist" style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", padding: "5px 8px" }}>
            ล้างทั้งหมด
          </Link>
        </div>
      )}

      {strip.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", height: 6, overflow: "hidden", background: "var(--hi)" }}>
            {strip.map((st) => (
              <span key={st.k} style={{ display: "block", height: "100%", width: `${(st.n / (total || 1)) * 100}%`, background: STATUS_META[st.k].color }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
            {strip.map((st) => (
              <span key={st.k} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)" }}>
                <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_META[st.k].color }} />
                {STATUS_META[st.k].th} · {st.n}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <MasterlistTable
          docs={docs as unknown as Parameters<typeof MasterlistTable>[0]["docs"]}
          cols={cols}
          canAck={canAck}
          userId={user.id}
          sortLink={sortLink}
          caret={caret}
        />
      </div>

      {total === 0 && (
        <div style={{ padding: "70px 20px", textAlign: "center", border: "1px solid var(--line2)", borderTop: "none", borderRadius: "0 0 3px 3px" }}>
          <div style={{ fontFamily: "var(--display)", fontSize: 18, color: "var(--sub)", marginBottom: 10 }}>ไม่พบเอกสารตามเงื่อนไข</div>
          <Link href="/masterlist" style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--accent)" }}>ล้างตัวกรองทั้งหมด</Link>
        </div>
      )}

      {pageCount > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, marginTop: 22 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>หน้า {page} / {pageCount}</span>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <Link href={pageLink(Math.max(1, page - 1))} aria-label="หน้าก่อนหน้า" style={pageBtn(false)}>←</Link>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .filter((n) => Math.abs(n - page) < 4 || n === 1 || n === pageCount)
              .map((n) => (
                <Link key={n} href={pageLink(n)} aria-current={n === page ? "page" : undefined} style={pageBtn(n === page)}>{n}</Link>
              ))}
            <Link href={pageLink(Math.min(pageCount, page + 1))} aria-label="หน้าถัดไป" style={pageBtn(false)}>→</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function pageBtn(on: boolean): React.CSSProperties {
  return {
    fontFamily: "var(--mono)",
    fontSize: 13,
    minWidth: 34,
    textAlign: "center",
    padding: "8px 10px",
    border: `1px solid ${on ? "var(--accent2)" : "var(--line2)"}`,
    background: on ? "var(--accent-dim)" : "transparent",
    color: on ? "var(--accent)" : "var(--sub)",
    borderRadius: 2,
  };
}
