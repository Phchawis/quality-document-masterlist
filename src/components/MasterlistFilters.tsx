"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { WORKS, CATEGORIES, DOC_TYPES, STATUS_META } from "@/lib/reference";

const STATUS_KEYS = ["ACTIVE", "REVIEW", "DRAFT", "OBSOLETE"] as const;

function chipStyle(on: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontFamily: "var(--mono)",
    fontSize: 13,
    letterSpacing: ".02em",
    padding: "7px 13px",
    border: `1px solid ${on ? "var(--accent2)" : "var(--line2)"}`,
    background: on ? "var(--accent-dim)" : "transparent",
    color: on ? "var(--accent)" : "var(--sub)",
    borderRadius: 2,
    whiteSpace: "nowrap",
    cursor: "pointer",
  };
}

const selectStyle: React.CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  background: "var(--surface)",
  border: "1px solid var(--line2)",
  color: "var(--sub)",
  padding: "12px 16px",
  fontFamily: "var(--mono)",
  fontSize: 13,
  borderRadius: 2,
  cursor: "pointer",
  maxWidth: 220,
};

export default function MasterlistFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  const cur = {
    q: params.get("q") ?? "",
    work: params.get("work") ?? "ALL",
    type: params.get("type") ?? "ALL",
    cat: params.get("cat") ?? "ALL",
    sub: params.get("sub") ?? "ALL",
    status: params.get("status") ?? "ALL",
  };

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "ALL" || v === "") sp.delete(k);
        else sp.set(k, v);
      }
      sp.delete("page"); // reset pagination on filter change
      // Changing work clears cat/sub; changing cat clears sub.
      if ("work" in patch) {
        sp.delete("cat");
        sp.delete("sub");
      }
      if ("cat" in patch) sp.delete("sub");
      router.push(`/masterlist?${sp.toString()}`);
    },
    [params, router],
  );

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== cur.q) update({ q });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const curCat = CATEGORIES.find((c) => c.code === cur.cat);
  const hasSubs = !!curCat?.subs?.length;

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22, alignItems: "center" }}>
        <div style={{ flex: "1 1 260px", minWidth: 0, display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", border: "1px solid var(--line2)", padding: "0 13px", borderRadius: 2 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden style={{ color: "var(--muted)", flex: "0 0 auto" }}>
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหารหัสหรือชื่อเอกสาร…"
            aria-label="ค้นหาเอกสาร"
            style={{ flex: "1 1 auto", minWidth: 0, background: "none", border: "none", color: "var(--text)", padding: "12px 0", fontSize: 15, outline: "none" }}
          />
        </div>
        <select value={cur.type} onChange={(e) => update({ type: e.target.value })} aria-label="กรองตามประเภท" style={selectStyle}>
          <option value="ALL">ทุกประเภท</option>
          {DOC_TYPES.map((t) => (
            <option key={t.code} value={t.code}>
              {t.code} · {t.nameTh}
            </option>
          ))}
        </select>
        {cur.work === "MEDTECH" && (
          <select value={cur.cat} onChange={(e) => update({ cat: e.target.value })} aria-label="กรองตามหมวดงาน" style={selectStyle}>
            <option value="ALL">ทุกหมวดงาน</option>
            {CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.nameTh}
                {c.subs ? " ▸" : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "22px 32px", marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, letterSpacing: ".14em", color: "var(--faint)", textTransform: "uppercase", marginRight: 2 }}>งาน</span>
          <button type="button" onClick={() => update({ work: "ALL" })} aria-pressed={cur.work === "ALL"} style={chipStyle(cur.work === "ALL")}>
            ทั้งหมด
          </button>
          {WORKS.map((w) => (
            <button key={w.id} type="button" onClick={() => update({ work: w.id })} aria-pressed={cur.work === w.id} title={w.nameTh} style={chipStyle(cur.work === w.id)}>
              {w.code}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, letterSpacing: ".14em", color: "var(--faint)", textTransform: "uppercase", marginRight: 2 }}>สถานะ</span>
          <button type="button" onClick={() => update({ status: "ALL" })} aria-pressed={cur.status === "ALL"} style={chipStyle(cur.status === "ALL")}>
            <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--muted)" }} />
            ทั้งหมด
          </button>
          {STATUS_KEYS.map((k) => (
            <button key={k} type="button" onClick={() => update({ status: k })} aria-pressed={cur.status === k} style={chipStyle(cur.status === k)}>
              <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_META[k].color }} />
              {STATUS_META[k].th}
            </button>
          ))}
        </div>

        {hasSubs && (
          <div style={{ flex: "1 1 100%", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "12px 14px", background: "var(--accent-dim)", border: "1px solid var(--accent2)", borderRadius: 2, animation: "fadeUp .25s ease both" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, letterSpacing: ".14em", color: "var(--accent)", textTransform: "uppercase", marginRight: 4 }}>
              หมวดย่อย · {curCat!.code}
            </span>
            <button type="button" onClick={() => update({ sub: "ALL" })} aria-pressed={cur.sub === "ALL"} style={chipStyle(cur.sub === "ALL")}>
              ทั้งหมด
            </button>
            {curCat!.subs!.map((sb) => (
              <button key={sb} type="button" onClick={() => update({ sub: sb })} aria-pressed={cur.sub === sb} style={chipStyle(cur.sub === sb)}>
                {sb}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
