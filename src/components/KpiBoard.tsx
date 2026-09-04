"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { startFiscalYear } from "@/app/actions/kpi";

import {
  FISCAL_MONTHS,
  attentionList,
  formatValue,
  higherIsBetter,
  meetsTarget,
  statsFor,
  summarise,
  type Indicator,
} from "@/lib/kpi";

type WorkBlock = { workId: string; name: string; indicators: Indicator[] };

/* หน้าตัวชี้วัดคุณภาพ
   หัวใจของหน้านี้คือ "ตารางความร้อน" 12 เดือน — ตัวชี้วัด 105 ตัว × 12 เดือน
   คือ 1,260 ช่อง ถ้าแสดงเป็นตัวเลขล้วนจะอ่านไม่ไหว แต่ถ้าระบายสีตามผ่าน/ไม่ผ่าน
   จะเห็นได้ในแวบเดียวว่าเดือนไหนงานไหนมีปัญหา แล้วค่อยกดดูตัวเลขจริงเป็นราย ๆ */

const PASS = "var(--accent)";
const FAIL = "var(--red)";
const NODATA = "var(--line3)";

function cellColor(ok: boolean | null) {
  if (ok === null) return NODATA;
  return ok ? PASS : FAIL;
}

/* ช่องที่ไม่ผ่านมีลายทแยงทับสีแดงด้วย ไม่พึ่งสีอย่างเดียว
   คนตาบอดสีแดง-เขียวราว 8% ของผู้ชาย แยกเขียว/แดงไม่ออก ถ้าใช้สีล้วน
   จะต้องเอาเมาส์ชี้ทีละช่องเพื่ออ่านค่า ซึ่งใช้ไม่ได้จริงกับ 1,260 ช่อง */
function cellStyle(ok: boolean | null): React.CSSProperties {
  const base: React.CSSProperties = {
    height: 15,
    borderRadius: 2,
    background: cellColor(ok),
    opacity: ok === null ? 0.45 : 1,
  };
  if (ok === false) {
    base.backgroundImage =
      "repeating-linear-gradient(45deg, rgba(0,0,0,.42) 0 2px, transparent 2px 4px)";
  }
  return base;
}

/* แถบสัดส่วนผ่าน/ไม่ผ่านของแต่ละงาน — อ่านสัดส่วนได้ทันทีโดยไม่ต้องอ่านตัวเลข */
function ProportionBar({
  pass, partial, fail, nodata, animate,
}: { pass: number; partial: number; fail: number; nodata: number; animate: boolean }) {
  const total = Math.max(1, pass + partial + fail + nodata);
  const seg = [
    { n: pass, c: PASS, label: "ผ่านทุกเดือน" },
    { n: partial, c: "var(--amber)", label: "ผ่านบางเดือน" },
    { n: fail, c: FAIL, label: "ไม่ผ่าน" },
    { n: nodata, c: NODATA, label: "ยังไม่มีข้อมูล" },
  ].filter((s) => s.n > 0);

  return (
    <div
      style={{ display: "flex", height: 8, borderRadius: 2, overflow: "hidden", background: "var(--line)" }}
      role="img"
      aria-label={seg.map((s) => `${s.label} ${s.n}`).join(", ")}
    >
      {seg.map((s) => (
        <div
          key={s.label}
          title={`${s.label} ${s.n} ตัวชี้วัด`}
          style={{
            width: `${(s.n / total) * 100}%`,
            background: s.c,
            transformOrigin: "left",
            animation: animate ? "barGrow .5s cubic-bezier(.2,.8,.3,1) both" : undefined,
          }}
        />
      ))}
    </div>
  );
}

/* เส้นแนวโน้ม 12 เดือน พร้อมเส้นเป้าหมาย — วาดเองด้วย SVG ไม่ต้องพึ่งไลบรารีกราฟ
   ข้อมูลแค่ 12 จุดต่อเส้น การลงไลบรารีทั้งก้อนไม่คุ้มกับขนาดที่ผู้ใช้ต้องโหลด */
function Sparkline({ ind }: { ind: Indicator }) {
  const w = 620;
  const h = 96;
  const pad = 8;
  const pts = ind.values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v !== null);
  if (pts.length < 1) return null;

  const all = pts.map((p) => p.v);
  if (ind.targetValue !== null) all.push(ind.targetValue);
  let lo = Math.min(...all);
  let hi = Math.max(...all);
  if (hi === lo) { hi = lo + 1; lo -= 1; }
  const span = hi - lo;
  lo -= span * 0.12;
  hi += span * 0.12;

  const x = (i: number) => pad + (i / (FISCAL_MONTHS.length - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - ((v - lo) / (hi - lo)) * (h - pad * 2);

  const d = pts.map((p, k) => `${k === 0 ? "M" : "L"}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const ty = ind.targetValue !== null ? y(ind.targetValue) : null;
  const good = higherIsBetter(ind.targetOp);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img"
      aria-label={`แนวโน้ม ${ind.name} ตลอดปีงบประมาณ`} style={{ display: "block", overflow: "visible" }}>
      {ty !== null && (
        <>
          {/* แรเงาฝั่งที่ "ผ่านเป้า" ทำให้เห็นทันทีว่าเส้นควรอยู่ด้านไหน */}
          <rect x={pad} y={good ? pad : ty} width={w - pad * 2}
            height={Math.max(0, good ? ty - pad : h - pad - ty)}
            fill="var(--accent)" opacity="0.06" />
          <line x1={pad} y1={ty} x2={w - pad} y2={ty} stroke="var(--accent)"
            strokeWidth="1" strokeDasharray="4 4" opacity="0.75" />
        </>
      )}
      <path d={d} fill="none" stroke="var(--text)" strokeWidth="1.75"
        strokeLinejoin="round" strokeLinecap="round" className="kpi-spark" />
      {pts.map((p) => {
        const ok = meetsTarget(p.v, { op: ind.targetOp, value: ind.targetValue });
        return (
          <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r="3.2"
            fill={ok === null ? "var(--muted)" : ok ? PASS : FAIL}
            stroke="var(--bg)" strokeWidth="1.5" />
        );
      })}
    </svg>
  );
}

export default function KpiBoard({
  year, years, works, canEnter, canStartYear,
}: { year: number; years: number[]; works: WorkBlock[]; canEnter: boolean; canStartYear: boolean }) {
  const router = useRouter();
  const [focus, setFocus] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [onlyProblem, setOnlyProblem] = useState(false);
  const [pending, start] = useTransition();
  const [yearMsg, setYearMsg] = useState<string | null>(null);

  const latest = years.length ? Math.max(...years) : year;
  const nextYear = latest + 1;

  const openNextYear = () => {
    if (!confirm(`เปิดปีงบประมาณ ${nextYear} โดยคัดลอกรายการตัวชี้วัดจากปี ${latest} มาตั้งต้น (ไม่เอาตัวเลขมาด้วย) ?`)) return;
    setYearMsg(null);
    start(async () => {
      const res = await startFiscalYear(latest);
      if (res.ok) {
        setYearMsg(`เปิดปีงบประมาณ ${res.year} แล้ว — คัดลอกตัวชี้วัด ${res.created} ตัว`);
        router.push(`/kpi?year=${res.year}`);
      } else {
        setYearMsg(res.error);
      }
    });
  };

  const shown = focus ? works.filter((w) => w.workId === focus) : works;

  const overall = useMemo(() => summarise(works.flatMap((w) => w.indicators)), [works]);
  const attention = useMemo(() => attentionList(works), [works]);

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <style>{`
        .kpi-spark { stroke-dasharray: 1400; stroke-dashoffset: 1400; animation: kpiDraw .9s cubic-bezier(.2,.8,.3,1) forwards; }
        @keyframes kpiDraw { to { stroke-dashoffset: 0; } }
        .kpi-cell { transition: transform .12s ease, outline-color .12s ease; outline: 2px solid transparent; outline-offset: 1px; }
        .kpi-cell:hover { transform: scaleY(1.55); outline-color: var(--text); z-index: 1; }
        .kpi-row:hover { background: var(--surface2); }
        @media (prefers-reduced-motion: reduce) {
          .kpi-spark { stroke-dasharray: none; stroke-dashoffset: 0; animation: none; }
          .kpi-cell:hover { transform: none; }
        }
      `}</style>

      {/* ---- หัวเรื่อง + สรุปรวม ---- */}
      <div style={{ paddingBottom: 22, borderBottom: "1px solid var(--line2)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "clamp(1.7rem,3.2vw,2.4rem)", letterSpacing: "-.02em", lineHeight: 1.05, margin: 0 }}>
              ตัวชี้วัดคุณภาพ
            </h1>
            <p style={{ color: "var(--sub)", margin: "10px 0 0", fontSize: 15 }}>
              ผลการเก็บตัวชี้วัดของทั้ง 3 งาน ปีงบประมาณ {year} · {overall.total} ตัวชี้วัด
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {canEnter && (
            <a href="/kpi/entry" style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 14, padding: "9px 16px", borderRadius: 2, background: "var(--accent)", color: "var(--accent-ink)", whiteSpace: "nowrap" }}>
              กรอกผลรายเดือน
            </a>
          )}
          {/* ปีงบใหม่ต้องมีรายการตัวชี้วัดก่อนถึงจะกรอกได้ — ปุ่มนี้คัดลอกจากปีล่าสุดมาตั้งต้น */}
          {canStartYear && !years.includes(nextYear) && (
            <button type="button" onClick={openNextYear} disabled={pending}
              style={{ fontFamily: "var(--sans)", fontSize: 13.5, padding: "9px 14px", borderRadius: 2, border: "1px solid var(--line2)", background: "transparent", color: "var(--sub)", cursor: pending ? "wait" : "pointer", whiteSpace: "nowrap" }}>
              {pending ? "กำลังเปิด…" : `เปิดปีงบ ${nextYear}`}
            </button>
          )}
          {years.length > 1 && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--muted)" }}>
              ปีงบประมาณ
              <select
                value={year}
                onChange={(e) => router.push(`/kpi?year=${e.target.value}`)}
                style={{ fontFamily: "var(--mono)", fontSize: 13.5, padding: "6px 10px", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--line2)", borderRadius: 2 }}
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
          )}
          </div>
        </div>
        {yearMsg && (
          <p role="status" style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--sub)" }}>{yearMsg}</p>
        )}

        {/* ตัวเลขสรุประดับฝ่าย — วางเป็นแถวเดียว ไม่ทำเป็นการ์ดใหญ่ เพราะเป็นบริบท ไม่ใช่พระเอกของหน้า */}
        <div style={{ display: "flex", gap: "10px 26px", flexWrap: "wrap", marginTop: 18, alignItems: "center" }}>
          {[
            { n: overall.pass, label: "ผ่านทุกเดือน", c: PASS },
            { n: overall.partial, label: "ผ่านบางเดือน", c: "var(--amber)" },
            { n: overall.fail, label: "ไม่ผ่าน", c: FAIL },
            { n: overall.nodata, label: "ยังไม่มีข้อมูล", c: "var(--muted)" },
          ].map((s) => (
            <span key={s.label} style={{ display: "inline-flex", alignItems: "baseline", gap: 7, fontSize: 13.5, color: "var(--sub)" }}>
              <span aria-hidden style={{ width: 8, height: 8, borderRadius: 2, background: s.c, alignSelf: "center" }} />
              <b style={{ fontFamily: "var(--mono)", fontSize: 16, color: "var(--text)", fontWeight: 600 }}>{s.n}</b>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* ---- ต้องดูแลก่อน ----
           จาก 105 ตัวชี้วัด มีไม่ถึง 10% ที่ยังไม่ผ่านเป้า ถ้าไม่ดึงขึ้นมาไว้บนสุด
           ผู้ใช้ต้องเลื่อนผ่านแถวที่ผ่านแล้วเป็นร้อยแถวเพื่อหาสิ่งที่ต้องลงมือทำ
           ส่วนตารางด้านล่างยังเรียงตามเลขข้อเดิม เพื่อให้เทียบกับแบบฟอร์มจริงได้ */}
      {attention.length > 0 ? (
        <section style={{ marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
            <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 16, margin: 0 }}>ยังไม่ถึงเป้าในเดือนล่าสุด</h2>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>{attention.length} ตัวชี้วัด</span>
          </div>

          {/* บรรทัดเดียวต่อรายการ — ชื่อ · ค่าล่าสุด · เป้า · ห่างเท่าไหร่
              ตั้งใจให้อ่านจบในบรรทัดเดียว รายละเอียดที่เหลือกดเข้าไปดูในตารางด้านล่าง */}
          <div style={{ border: "1px solid var(--line2)", borderRadius: 3, overflow: "hidden" }}>
            {attention.map((a, i) => (
              <button
                key={a.ind.id}
                type="button"
                className="kpi-row"
                onClick={() => { setFocus(null); setOpen(a.ind.id); }}
                style={{
                  display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap",
                  width: "100%", textAlign: "left", padding: "8px 13px", border: "none",
                  borderTop: i === 0 ? "none" : "1px solid var(--line)",
                  background: "transparent", cursor: "pointer",
                }}
              >
                <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--accent)", flex: "0 0 auto" }}>{a.ind.code}</span>
                <span style={{ fontSize: 13.5, color: "var(--text)", flex: "1 1 220px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.ind.name}
                </span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--red)", flex: "0 0 auto" }}>
                  {a.stats.latest ? formatValue(a.stats.latest.value, a.ind.kind) : "—"}
                </span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)", flex: "0 0 auto" }}>
                  เป้า {a.ind.targetRaw || "—"}
                  {a.gap !== null && a.gap > 0 && <> · ห่าง {formatValue(a.gap, a.ind.kind)}</>}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <p style={{ marginTop: 22, fontSize: 14, color: "var(--sub)" }}>
          เดือนล่าสุดผ่านเป้าทุกตัวชี้วัดที่มีข้อมูล
        </p>
      )}

      {/* ---- เลือกงาน ---- */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "22px 0 6px" }}>
        <button type="button" onClick={() => setFocus(null)} style={chip(focus === null)}>
          ทุกงาน
        </button>
        {works.map((w) => (
          <button key={w.workId} type="button" onClick={() => setFocus(w.workId)} style={chip(focus === w.workId)}>
            {w.name}
          </button>
        ))}
        <label style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--sub)", cursor: "pointer" }}>
          <input type="checkbox" checked={onlyProblem} onChange={(e) => setOnlyProblem(e.target.checked)} />
          แสดงเฉพาะตัวที่ยังไม่ผ่านเป้า
        </label>
      </div>

      {shown.map((w) => {
        const s = summarise(w.indicators);
        const groups = new Map<string, Indicator[]>();
        for (const ind of w.indicators) {
          const key = `${ind.groupCode}|${ind.groupName}`;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(ind);
        }

        return (
          <section key={w.workId} style={{ marginTop: 34 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 19, margin: 0 }}>{w.name}</h2>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--muted)" }}>
                {s.pass}/{s.judged} ตัวชี้วัดผ่านทุกเดือน
              </span>
            </div>
            <div style={{ marginTop: 10 }}>
              <ProportionBar pass={s.pass} partial={s.partial} fail={s.fail} nodata={s.nodata} animate />
            </div>

            {/* ตารางความร้อนต้องการความกว้างขั้นต่ำให้ป้ายเดือนอ่านออก
                บนมือถือจึงให้เลื่อนแนวนอนในกรอบตัวเอง แทนที่จะบีบจนอ่านไม่ได้
                (วิธีเดียวกับตารางทะเบียนเอกสาร) */}
            <div style={{ overflowX: "auto", marginTop: 20 }}>
            <div style={{ minWidth: 680 }}>
            <div style={{ ...gridRow, paddingBottom: 6, borderBottom: "1px solid var(--line2)" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>ตัวชี้วัด</span>
              <div style={monthsRow}>
                {FISCAL_MONTHS.map((m) => (
                  <span key={m} style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--faint)", textAlign: "center" }}>{m}</span>
                ))}
              </div>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", textAlign: "right" }}>เป้าหมาย</span>
            </div>

            {[...groups.entries()].map(([key, items]) => {
              const [gcode, gname] = key.split("|");
              const visible = onlyProblem
                ? items.filter((i) => { const st = statsFor(i); return st.rate !== null && st.rate < 1; })
                : items;
              if (!visible.length) return null;

              return (
                <div key={key} style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", gap: 9, alignItems: "baseline", padding: "7px 0 5px" }}>
                    {gcode && <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)" }}>{gcode}</span>}
                    <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 600, lineHeight: 1.5 }}>{gname}</span>
                  </div>

                  {visible.map((ind) => {
                    const st = statsFor(ind);
                    const isOpen = open === ind.id;
                    return (
                      <div key={ind.id}>
                        <button
                          type="button"
                          className="kpi-row"
                          onClick={() => setOpen(isOpen ? null : ind.id)}
                          aria-expanded={isOpen}
                          style={{ ...gridRow, width: "100%", textAlign: "left", padding: "7px 0", border: "none", borderBottom: "1px solid var(--line)", background: isOpen ? "var(--surface2)" : "transparent", cursor: "pointer", alignItems: "center" }}
                        >
                          <span style={{ display: "flex", gap: 8, minWidth: 0, alignItems: "baseline" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)", flex: "0 0 auto" }}>{ind.code}</span>
                            <span style={{ fontSize: 13.5, color: "var(--sub)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ind.name}</span>
                          </span>

                          <span style={monthsRow}>
                            {ind.values.map((v, i) => {
                              const ok = meetsTarget(v, { op: ind.targetOp, value: ind.targetValue });
                              return (
                                <span
                                  key={i}
                                  className="kpi-cell"
                                  title={`${FISCAL_MONTHS[i]} · ${formatValue(v, ind.kind)}${ok === null ? "" : ok ? " · ผ่าน" : " · ไม่ผ่าน"}`}
                                  style={cellStyle(ok)}
                                />
                              );
                            })}
                          </span>

                          <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)", textAlign: "right", whiteSpace: "nowrap" }}>
                            {ind.targetRaw || "—"}
                          </span>
                        </button>

                        {isOpen && (
                          <div style={{ padding: "16px 0 22px", borderBottom: "1px solid var(--line)", animation: "fadeIn .18s ease both" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "14px 26px", marginBottom: 16 }}>
                              <Fact label="ค่าล่าสุด" value={st.latest ? `${formatValue(st.latest.value, ind.kind)} (${FISCAL_MONTHS[st.latest.month - 1]})` : "—"} />
                              <Fact label="ผ่านเป้า" value={st.rate === null ? "—" : `${st.passed}/${st.passed + st.failed} เดือน`} />
                              <Fact label="ต่ำสุด – สูงสุด" value={st.min === null ? "—" : `${formatValue(st.min, ind.kind)} – ${formatValue(st.max, ind.kind)}`} />
                              <Fact label="สรุปผลของหน่วยงาน" value={ind.summary ?? "—"} />
                            </div>

                            <Sparkline ind={ind} />

                            <div style={{ display: "flex", gap: "6px 18px", flexWrap: "wrap", marginTop: 12 }}>
                              {ind.values.map((v, i) => (
                                <span key={i} style={{ fontFamily: "var(--mono)", fontSize: 12, color: v === null ? "var(--faint)" : "var(--sub)" }}>
                                  <span style={{ color: "var(--faint)" }}>{FISCAL_MONTHS[i]}</span>{" "}
                                  {formatValue(v, ind.kind)}
                                </span>
                              ))}
                            </div>

                            {ind.owner && (
                              <p style={{ fontSize: 12.5, color: "var(--faint)", margin: "14px 0 0" }}>ผู้จัดทำข้อมูล: {ind.owner}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            </div>
            </div>
          </section>
        );
      })}

      {!works.length && (
        <p style={{ marginTop: 40, color: "var(--muted)", fontSize: 15 }}>
          ยังไม่มีข้อมูลตัวชี้วัดของปีงบประมาณ {year}
        </p>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--faint)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}

/* คอลัมน์เดือนต้องกว้างพอให้ป้าย "ต.ค. พ.ย. …" ทั้ง 12 อ่านออก
   เคยตั้งไว้ 230px แล้วป้ายเบียดกันจนอ่านไม่ได้ */
const gridRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.35fr) minmax(360px, 1fr) minmax(66px, auto)",
  gap: 18,
  alignItems: "center",
};

const monthsRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: `repeat(${FISCAL_MONTHS.length}, 1fr)`,
  gap: 3,
  alignItems: "center",
};

function chip(active: boolean): React.CSSProperties {
  return {
    fontSize: 13.5,
    fontFamily: "var(--sans)",
    padding: "7px 13px",
    borderRadius: 2,
    border: `1px solid ${active ? "var(--accent2)" : "var(--line2)"}`,
    background: active ? "var(--accent-dim)" : "transparent",
    color: active ? "var(--accent)" : "var(--sub)",
    cursor: "pointer",
  };
}
