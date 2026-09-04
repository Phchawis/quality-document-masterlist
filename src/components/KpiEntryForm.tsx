"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { saveKpiValues } from "@/app/actions/kpi";
import { FISCAL_MONTHS, entryWarning, formatValue, isBlockingWarning, meetsTarget } from "@/lib/kpi";
import type { KpiKind } from "@/generated/prisma/enums";

type Row = {
  id: string;
  code: string;
  name: string;
  kind: KpiKind;
  targetRaw: string;
  targetValue: number | null;
  targetOp: string | null;
  groupCode: string;
  groupName: string;
  current: number | null;
  previous: number | null;
};

export default function KpiEntryForm({
  year, years, month, workId, works, indicators,
}: {
  year: number; years: number[]; month: number; workId: string;
  works: { id: string; name: string }[]; indicators: Row[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(indicators.map((r) => [r.id, r.current === null ? "" : String(r.current)])),
  );
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const warnings = useMemo(() => {
    const out: Record<string, string> = {};
    for (const r of indicators) {
      const w = entryWarning(r, draft[r.id] ?? "");
      if (w) out[r.id] = w;
    }
    return out;
  }, [draft, indicators]);

  const filled = indicators.filter((r) => (draft[r.id] ?? "").trim() !== "").length;
  const blocking = Object.values(warnings).some(isBlockingWarning);

  const go = (patch: Record<string, string | number>) => {
    const q = new URLSearchParams({ work: workId, month: String(month), year: String(year), ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, String(v)])) });
    router.push(`/kpi/entry?${q}`);
  };

  const submit = () => {
    setMsg(null);
    const entries = indicators.map((r) => {
      const raw = (draft[r.id] ?? "").trim();
      return { indicatorId: r.id, value: raw === "" ? null : Number(raw) };
    });
    start(async () => {
      const res = await saveKpiValues(workId, year, month, entries);
      setMsg(res.ok
        ? { ok: true, text: `บันทึกแล้ว ${res.saved} ค่า` }
        : { ok: false, text: res.error });
      if (res.ok) router.refresh();
    });
  };

  const groups = new Map<string, Row[]>();
  for (const r of indicators) {
    const k = `${r.groupCode}|${r.groupName}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <div style={{ paddingBottom: 20, borderBottom: "1px solid var(--line2)" }}>
        <Link href="/kpi" style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--muted)" }}>← กลับไปหน้าตัวชี้วัด</Link>
        <h1 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "clamp(1.5rem,3vw,2.1rem)", letterSpacing: "-.02em", margin: "12px 0 0" }}>
          กรอกผลตัวชี้วัดรายเดือน
        </h1>
        <p style={{ color: "var(--sub)", margin: "9px 0 0", fontSize: 15 }}>
          กรอกได้ทีละงาน ไม่ต้องกรอกครบทุกตัวก็บันทึกได้ · ค่าร้อยละกรอกเป็น 0–100 (เช่น 99.06 ไม่ใช่ 0.9906)
        </p>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end", margin: "20px 0 6px" }}>
        <Field label="งาน">
          <select value={workId} onChange={(e) => go({ work: e.target.value })} style={select}>
            {works.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </Field>
        <Field label="เดือน">
          <select value={month} onChange={(e) => go({ month: e.target.value })} style={select}>
            {FISCAL_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </Field>
        {years.length > 1 && (
          <Field label="ปีงบประมาณ">
            <select value={year} onChange={(e) => go({ year: e.target.value })} style={select}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
        )}
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--muted)" }}>
          กรอกแล้ว {filled}/{indicators.length}
        </span>
      </div>

      {[...groups.entries()].map(([key, rows]) => {
        const [gcode, gname] = key.split("|");
        return (
          <div key={key} style={{ marginTop: 22 }}>
            <div style={{ display: "flex", gap: 9, alignItems: "baseline", paddingBottom: 8, borderBottom: "1px solid var(--line2)" }}>
              {gcode && <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)" }}>{gcode}</span>}
              <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{gname}</span>
            </div>

            {rows.map((r) => {
              const raw = draft[r.id] ?? "";
              const warn = warnings[r.id];
              const v = raw.trim() === "" ? null : Number(raw);
              const ok = Number.isFinite(v) ? meetsTarget(v, { op: r.targetOp, value: r.targetValue }) : null;
              return (
                <div key={r.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 150px 110px", gap: 14, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                  <label htmlFor={r.id} style={{ display: "flex", gap: 8, minWidth: 0, alignItems: "baseline", cursor: "pointer" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)", flex: "0 0 auto" }}>{r.code}</span>
                    <span style={{ fontSize: 13.5, color: "var(--sub)", lineHeight: 1.5 }}>{r.name}</span>
                  </label>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        id={r.id}
                        inputMode="decimal"
                        value={raw}
                        onChange={(e) => setDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                        placeholder="—"
                        aria-invalid={!!warn}
                        style={{
                          width: "100%", fontFamily: "var(--mono)", fontSize: 14, textAlign: "right",
                          padding: "7px 9px", background: "var(--bg2)", color: "var(--text)",
                          border: `1px solid ${warn ? "var(--amber)" : ok === false ? "var(--red)" : "var(--line2)"}`,
                          borderRadius: 2,
                        }}
                      />
                      {r.kind === "PERCENT" && <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--muted)" }}>%</span>}
                    </div>
                    {/* ค่าเดือนก่อนไว้เทียบสายตา — ถ้าเดือนก่อน 96 แล้วเดือนนี้พิมพ์ 0.96 จะเห็นผิดสังเกตทันที */}
                    {r.previous !== null && (
                      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--faint)", textAlign: "right", marginTop: 3 }}>
                        เดือนก่อน {formatValue(r.previous, r.kind)}
                      </div>
                    )}
                  </div>

                  <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)", textAlign: "right" }}>
                    เป้า {r.targetRaw || "—"}
                    {ok !== null && (
                      <div style={{ color: ok ? "var(--accent)" : "var(--red)", marginTop: 3 }}>
                        {ok ? "ผ่าน" : "ไม่ผ่าน"}
                      </div>
                    )}
                  </div>

                  {warn && (
                    <p role="alert" style={{ gridColumn: "1 / -1", margin: 0, fontSize: 12.5, color: "var(--amber)" }}>
                      {warn}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      <div style={{ position: "sticky", bottom: 0, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", padding: "16px 0", marginTop: 8, background: "var(--bg)", borderTop: "1px solid var(--line2)" }}>
        <button type="button" onClick={submit} disabled={pending || blocking}
          style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 14.5, padding: "10px 20px", borderRadius: 2, border: "none", cursor: pending || blocking ? "not-allowed" : "pointer", background: blocking ? "var(--surface2)" : "var(--accent)", color: blocking ? "var(--muted)" : "var(--accent-ink)", opacity: pending ? 0.7 : 1 }}>
          {pending ? "กำลังบันทึก…" : `บันทึกเดือน ${FISCAL_MONTHS[month - 1]}`}
        </button>
        {blocking && <span style={{ fontSize: 13, color: "var(--red)" }}>แก้ค่าที่ผิดรูปแบบก่อนจึงจะบันทึกได้</span>}
        {msg && (
          <span role="status" style={{ fontSize: 13.5, color: msg.ok ? "var(--accent)" : "var(--red)" }}>{msg.text}</span>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--faint)" }}>{label}</span>
      {children}
    </label>
  );
}

const select: React.CSSProperties = {
  fontSize: 14, padding: "7px 10px", background: "var(--surface)", color: "var(--text)",
  border: "1px solid var(--line2)", borderRadius: 2, minWidth: 160,
};
