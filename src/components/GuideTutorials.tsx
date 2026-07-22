// Illustrated step-by-step tutorials for the guide page.
// The "screenshots" are miniature mockups built from the app's own design
// tokens, so they follow the dark/cream theme automatically and never go
// stale the way real screenshots do. Server component — no client JS.

/* ---------- shared styles ---------- */

const stepRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "22px 36px",
  padding: "26px 0",
  borderTop: "1px solid var(--line)",
};
const stepText: React.CSSProperties = { flex: "1 1 300px", minWidth: 0, maxWidth: "62ch" };
const stepVisual: React.CSSProperties = { flex: "1 1 320px", minWidth: 0, alignSelf: "center" };
const stepNum: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--accent)",
  letterSpacing: ".08em",
  marginBottom: 8,
};
const stepTitle: React.CSSProperties = {
  fontFamily: "var(--display)",
  fontWeight: 600,
  fontSize: 17,
  color: "var(--text)",
  lineHeight: 1.4,
  margin: 0,
};
const stepDesc: React.CSSProperties = { fontSize: 14.5, color: "var(--sub)", lineHeight: 1.75, margin: "10px 0 0" };
const tipList: React.CSSProperties = { margin: "12px 0 0", paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 };
const tipItem: React.CSSProperties = { display: "flex", gap: 9, fontSize: 13.5, color: "var(--sub)", lineHeight: 1.6 };
const tipMark: React.CSSProperties = { color: "var(--accent)", fontFamily: "var(--mono)", flex: "0 0 auto" };

const panel: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line2)",
  borderRadius: 3,
  padding: "16px 16px 18px",
  position: "relative",
  overflow: "hidden",
};
const panelCaption: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: 10.5,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: "var(--faint)",
  marginBottom: 12,
};
const mockLabel: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--mono)",
  fontSize: 10,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: 4,
};
const mockInput: React.CSSProperties = {
  background: "var(--bg2)",
  border: "1px solid var(--line2)",
  borderRadius: 2,
  padding: "7px 10px",
  fontSize: 12.5,
  color: "var(--text)",
  lineHeight: 1.4,
};
const mockBtnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  background: "var(--accent)",
  color: "var(--accent-ink)",
  fontFamily: "var(--display)",
  fontWeight: 600,
  fontSize: 12.5,
  padding: "8px 13px",
  borderRadius: 2,
  whiteSpace: "nowrap",
};
const kindTag = (color: string): React.CSSProperties => ({
  fontFamily: "var(--mono)",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: ".05em",
  padding: "3px 6px",
  border: "1px solid var(--line2)",
  borderRadius: 2,
  color,
  flex: "0 0 auto",
});

function RequireChip({ perm, roles }: { perm: string; roles: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "baseline", gap: 9, flexWrap: "wrap", background: "var(--accent-dim)", border: "1px solid var(--accent2)", borderRadius: 2, padding: "8px 13px", marginTop: 14 }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--accent)" }}>ต้องมีสิทธิ์ · {perm}</span>
      <span style={{ fontSize: 12.5, color: "var(--sub)" }}>{roles}</span>
    </div>
  );
}

function MockCheck({ on, label }: { on: boolean; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: on ? "var(--text)" : "var(--muted)" }}>
      <span
        aria-hidden
        style={{
          width: 13,
          height: 13,
          borderRadius: 2,
          border: `1px solid ${on ? "var(--accent)" : "var(--line3)"}`,
          background: on ? "var(--accent)" : "transparent",
          color: "var(--accent-ink)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          lineHeight: 1,
          flex: "0 0 auto",
        }}
      >
        {on ? "✓" : ""}
      </span>
      {label}
    </span>
  );
}

// Small cursor-arrow used to show where to click.
function Cursor({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden style={{ position: "absolute", filter: "drop-shadow(0 1px 2px rgba(0,0,0,.4))", ...style }}>
      <path d="M5 3 L19 12 L12 13.5 L9.5 20 Z" fill="var(--text)" stroke="var(--bg)" strokeWidth="1.5" />
    </svg>
  );
}

/* ---------- section: ลงทะเบียนเอกสาร ---------- */

export function RegisterTutorial() {
  return (
    <section style={{ marginTop: 44 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 4 }}>
        <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 19, margin: 0 }}>วิธีลงทะเบียนเอกสารใหม่</h2>
        <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", letterSpacing: ".08em" }}>4 ขั้นตอน</span>
      </div>
      <RequireChip perm="ลงทะเบียน" roles="หัวหน้างาน · หัวหน้าหมวดงาน · ผู้จัดการเอกสาร · ผู้ดูแลระบบ" />

      <div style={{ marginTop: 18 }}>
        {/* ขั้นที่ 1 */}
        <div style={stepRow}>
          <div style={stepText}>
            <div style={stepNum}>ขั้นที่ 1</div>
            <h3 style={stepTitle}>เปิดหน้า “ทะเบียนเอกสาร” แล้วกดปุ่มลงทะเบียน</h3>
            <p style={stepDesc}>
              ไปที่เมนู <b style={{ color: "var(--text)", fontWeight: 600 }}>ทะเบียนเอกสาร</b> ด้านบน ปุ่มสีเขียว{" "}
              <b style={{ color: "var(--accent)", fontWeight: 600 }}>+ ลงทะเบียนเอกสาร</b> อยู่มุมขวาบนของหน้า
              (ถ้าไม่เห็นปุ่มนี้ แสดงว่าบทบาทของคุณไม่มีสิทธิ์ลงทะเบียน)
            </p>
          </div>
          <div style={stepVisual}>
            <div style={panel}>
              <div style={panelCaption}>หน้าทะเบียนเอกสาร</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ ...mockInput, flex: "1 1 130px", color: "var(--muted)", display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden style={{ flex: "0 0 auto" }}>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>ค้นหารหัสหรือชื่อเอกสาร…</span>
                </div>
                <div style={{ position: "relative", flex: "0 0 auto" }}>
                  <span style={{ ...mockBtnPrimary, animation: "clickPulse 2.6s cubic-bezier(.2,.7,.3,1) infinite" }}>
                    <span aria-hidden style={{ fontFamily: "var(--mono)", fontSize: 14, lineHeight: 1 }}>+</span> ลงทะเบียนเอกสาร
                  </span>
                  <Cursor style={{ right: -6, bottom: -12 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ขั้นที่ 2 */}
        <div style={stepRow}>
          <div style={stepText}>
            <div style={stepNum}>ขั้นที่ 2</div>
            <h3 style={stepTitle}>กรอกข้อมูลเอกสารในแบบฟอร์ม</h3>
            <p style={stepDesc}>หน้าต่างลงทะเบียนจะเปิดขึ้น กรอกให้ครบทุกช่อง:</p>
            <ul style={tipList}>
              <li style={tipItem}><span style={tipMark}>·</span><span><b style={{ color: "var(--text)", fontWeight: 600 }}>ชื่อเอกสาร</b> — ชื่อเต็มของเอกสารฉบับนั้น</span></li>
              <li style={tipItem}><span style={tipMark}>·</span><span><b style={{ color: "var(--text)", fontWeight: 600 }}>รหัสเอกสาร</b> — กำหนดเอง เช่น HEM-WI-007 ใช้ได้เฉพาะ A–Z, 0–9 และขีดกลาง ระบบตรวจไม่ให้ซ้ำกับรหัสที่มีอยู่</span></li>
              <li style={tipItem}><span style={tipMark}>·</span><span><b style={{ color: "var(--text)", fontWeight: 600 }}>งาน / หมวดงาน</b> — หมวดงานจะแสดงเมื่อเลือกงานเทคนิคการแพทย์ เอกสารกลางที่ไม่สังกัดหมวดให้เลือก “เอกสารกลางระดับงาน” และหมวดที่มีหมวดย่อย (IMM, CMTL) จะมีช่องหมวดย่อยให้เลือกเพิ่ม</span></li>
              <li style={tipItem}><span style={tipMark}>·</span><span><b style={{ color: "var(--text)", fontWeight: 600 }}>ระยะเวลาจัดเก็บ/ทบทวน</b> — 2 ปี, 5 ปี หรือ 10 ปี ระบบใช้คำนวณกำหนดทบทวนถัดไป</span></li>
              <li style={tipItem}><span style={tipMark}>·</span><span><b style={{ color: "var(--text)", fontWeight: 600 }}>รูปแบบไฟล์แนบ</b> — ติ๊กได้หลายแบบพร้อมกัน เช่น PDF คู่กับ Word</span></li>
            </ul>
          </div>
          <div style={stepVisual}>
            <div style={panel}>
              <div style={panelCaption}>แบบฟอร์มลงทะเบียน</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <div>
                  <span style={mockLabel}>ชื่อเอกสาร</span>
                  <div style={mockInput}>การตรวจนับเรติคูโลไซต์ด้วยเครื่องอัตโนมัติ</div>
                </div>
                <div>
                  <span style={mockLabel}>รหัสเอกสาร</span>
                  <div style={{ ...mockInput, fontFamily: "var(--mono)", border: "1px solid var(--accent2)", display: "flex", alignItems: "center" }}>
                    HEM-WI-007
                    <span aria-hidden style={{ display: "inline-block", width: 1.5, height: 13, background: "var(--accent)", marginLeft: 2, animation: "caretBlink 1.1s step-end infinite" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                    <span style={mockLabel}>งาน</span>
                    <div style={{ ...mockInput, display: "flex", justifyContent: "space-between", gap: 6 }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>เทคนิคการแพทย์</span><span aria-hidden style={{ color: "var(--muted)" }}>▾</span></div>
                  </div>
                  <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                    <span style={mockLabel}>ระยะเวลาจัดเก็บ</span>
                    <div style={{ ...mockInput, display: "flex", justifyContent: "space-between", gap: 6 }}><span>5 ปี</span><span aria-hidden style={{ color: "var(--muted)" }}>▾</span></div>
                  </div>
                </div>
                <div>
                  <span style={mockLabel}>รูปแบบไฟล์แนบ (เลือกได้หลายแบบ)</span>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 3 }}>
                    <MockCheck on label="PDF" />
                    <MockCheck on label="Word" />
                    <MockCheck on={false} label="Excel" />
                    <MockCheck on={false} label="URL" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ขั้นที่ 3 */}
        <div style={stepRow}>
          <div style={stepText}>
            <div style={stepNum}>ขั้นที่ 3</div>
            <h3 style={stepTitle}>กด “ลงทะเบียน” — เอกสารเริ่มต้นเป็นฉบับร่าง</h3>
            <p style={stepDesc}>
              ระบบพาไปหน้ารายละเอียดของเอกสารใหม่ทันที สถานะเริ่มต้นคือ{" "}
              <b style={{ color: "var(--amber)", fontWeight: 600 }}>ฉบับร่าง</b> เวอร์ชัน v.01 —
              ขั้นนี้เอกสารยังไม่นับเป็นฉบับใช้งาน แก้ไขหรือลบทิ้งได้ถ้าลงทะเบียนผิด
            </p>
          </div>
          <div style={stepVisual}>
            <div style={panel}>
              <div style={panelCaption}>หน้ารายละเอียดเอกสาร</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600, color: "var(--accent)", letterSpacing: ".03em" }}>HEM-WI-007</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 9px", border: "1px solid var(--amber)", borderRadius: 2, fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: ".06em", color: "var(--amber)", animation: "popIn 1.2s cubic-bezier(.2,.7,.3,1) both" }}>
                  <span aria-hidden style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--amber)" }} />
                  ฉบับร่าง
                </span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>v.01</span>
              </div>
              <div style={{ fontSize: 13.5, color: "var(--text)", marginTop: 9, fontWeight: 500 }}>การตรวจนับเรติคูโลไซต์ด้วยเครื่องอัตโนมัติ</div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 13 }}>
                <span style={{ ...mockBtnPrimary, background: "transparent", color: "var(--text)", border: "1px solid var(--line2)" }}>บันทึกประกาศใช้</span>
                <span style={{ ...mockBtnPrimary, background: "transparent", color: "var(--text)", border: "1px solid var(--line2)" }}>บันทึกแก้ไข</span>
                <span style={{ ...mockBtnPrimary, background: "transparent", color: "var(--red)", border: "1px solid rgba(210,105,95,.4)" }}>ลบเอกสาร</span>
              </div>
            </div>
          </div>
        </div>

        {/* ขั้นที่ 4 */}
        <div style={stepRow}>
          <div style={stepText}>
            <div style={stepNum}>ขั้นที่ 4</div>
            <h3 style={stepTitle}>แนบไฟล์จริง ตรวจทาน แล้วกด “บันทึกประกาศใช้”</h3>
            <p style={stepDesc}>
              อัปโหลดไฟล์เอกสารจริง (ดูวิธีในหัวข้อถัดไป) ตรวจความถูกต้อง แล้วกดปุ่ม{" "}
              <b style={{ color: "var(--text)", fontWeight: 600 }}>บันทึกประกาศใช้</b> — สถานะเปลี่ยนเป็น{" "}
              <b style={{ color: "var(--accent)", fontWeight: 600 }}>ประกาศใช้</b> พร้อมลงวันที่อัตโนมัติ
              เอกสารประเภท QM · SOP · WI จะเข้าคิว “รอรับทราบ” ของเจ้าหน้าที่ทุกคนทันที
            </p>
          </div>
          <div style={stepVisual}>
            <div style={panel}>
              <div style={panelCaption}>วงจรสถานะเอกสาร</div>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                {[
                  { label: "ฉบับร่าง", color: "var(--amber)", delay: "0s", dim: false },
                  { label: "ระหว่างทบทวน", color: "var(--blue)", delay: ".7s", dim: false },
                  { label: "ประกาศใช้", color: "var(--accent)", delay: "1.4s", dim: false },
                  { label: "ยกเลิกใช้", color: "var(--red)", delay: "0s", dim: true },
                ].map((s, i, arr) => (
                  <div key={s.label} style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                    {i < arr.length - 1 && (
                      <span aria-hidden style={{ position: "absolute", top: 5, left: "calc(50% + 8px)", right: "calc(-50% + 8px)", height: 1, background: arr[i + 1].dim ? "var(--line2)" : "var(--line3)", ...(arr[i + 1].dim ? { backgroundImage: "repeating-linear-gradient(90deg, var(--line3) 0 4px, transparent 4px 8px)", background: "none" } : {}) }} />
                    )}
                    <span aria-hidden style={{ width: 11, height: 11, borderRadius: "50%", background: s.dim ? "transparent" : s.color, border: `2px solid ${s.color}`, opacity: s.dim ? 0.6 : undefined, animation: s.dim ? undefined : `dotGlow 2.8s ease-in-out ${s.delay} infinite`, flex: "0 0 auto" }} />
                    <span style={{ fontSize: 11, color: s.dim ? "var(--muted)" : "var(--text)", marginTop: 8, textAlign: "center", lineHeight: 1.35 }}>{s.label}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "14px 0 0", lineHeight: 1.6 }}>
                “ยกเลิกใช้” สำหรับเอกสารที่เลิกใช้งานแล้ว — ประวัติยังเก็บครบเพื่อการตรวจประเมิน
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- section: สถาปัตยกรรมระบบ (สำหรับ Programmer / IT) ---------- */

const STACK: { layer: string; name: string; desc: string }[] = [
  { layer: "Frontend", name: "Next.js 16 · React 19", desc: "App Router — Server Components เรนเดอร์ฝั่งเซิร์ฟเวอร์ ลดโค้ดที่ส่งไปเบราว์เซอร์" },
  { layer: "Backend", name: "Server Actions", desc: "ลอจิกฝั่งเซิร์ฟเวอร์เรียกตรงจากฟอร์ม ไม่ต้องเขียน REST endpoint แยก" },
  { layer: "ORM", name: "Prisma 7", desc: "ชั้นเข้าถึงฐานข้อมูลแบบ type-safe ผูกกับ schema เดียวทั้งระบบ" },
  { layer: "Database", name: "PostgreSQL", desc: "เก็บเอกสาร เวอร์ชัน การรับทราบ ผู้ใช้ และ audit log" },
  { layer: "Auth", name: "jose (JWT) · bcrypt", desc: "เซสชันเป็น JWT ลงนาม/เข้ารหัสด้วย jose · รหัสผ่านแฮชด้วย bcrypt" },
  { layer: "Deploy", name: "Docker · Caddy · VPS", desc: "รันเป็นคอนเทนเนอร์หลัง Caddy (HTTPS อัตโนมัติ) สำรองข้อมูลขึ้น Google Drive ทุกวัน" },
];

const DATA_MODEL: { name: string; th: string }[] = [
  { name: "Document", th: "เอกสารควบคุมแต่ละฉบับ (รหัส สถานะ ประเภท งาน/หมวด)" },
  { name: "Revision", th: "ประวัติการแก้ไข/เวอร์ชันของเอกสาร" },
  { name: "Attachment", th: "ไฟล์แนบจริงและลิงก์ระบบภายนอก" },
  { name: "Acknowledgement", th: "บันทึกการอ่าน/รับทราบรายบุคคล" },
  { name: "User · Work · Category", th: "ผู้ใช้ บทบาท งาน และหมวดงาน" },
  { name: "AuditLog", th: "ร่องรอยการกระทำทุกครั้งเพื่อการตรวจประเมิน" },
];

const REQ_FLOW: { t: string; d: string }[] = [
  { t: "ผู้ใช้กดบันทึกฟอร์ม", d: "ฟอร์มเรียก Server Action โดยตรง (ไม่ผ่าน REST)" },
  { t: "ตรวจเซสชัน + สิทธิ์", d: "อ่าน JWT, เช็ก can(role, action) ก่อนทำงาน" },
  { t: "Prisma เขียนฐานข้อมูล", d: "สร้างแถวเอกสาร + เขียน AuditLog ในทรานแซกชัน" },
  { t: "revalidate + รีเฟรช", d: "Next.js รีเฟรชหน้าเซิร์ฟเวอร์ ผู้ใช้เห็นผลทันที" },
];

const archNodeBox: React.CSSProperties = {
  position: "relative",
  flex: "1 1 0",
  minWidth: 120,
  textAlign: "center",
  background: "var(--surface)",
  border: "1px solid var(--accent2)",
  borderRadius: 3,
  padding: "16px 12px",
};
const archLabel: React.CSSProperties = { fontFamily: "var(--display)", fontWeight: 600, fontSize: 14, color: "var(--text)" };
const archSub: React.CSSProperties = { fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)", letterSpacing: ".03em", marginTop: 3 };

function ArchNode({ title, sub, ripple = false }: { title: string; sub: string; ripple?: boolean }) {
  return (
    <div style={archNodeBox}>
      <div style={{ position: "relative", width: 34, height: 34, margin: "0 auto 9px" }}>
        {ripple && <span aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--accent)", animation: "ripple 2.4s ease-out infinite" }} />}
        <span aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--accent-dim)", border: "1px solid var(--accent2)" }} />
      </div>
      <div style={archLabel}>{title}</div>
      <div style={archSub}>{sub}</div>
    </div>
  );
}

function ArchArrow({ label }: { label?: string }) {
  return (
    <div className="no-print" style={{ flex: "0 0 46px", alignSelf: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 0 }}>
      {label && <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>{label}</span>}
      <div style={{ position: "relative", width: "100%", height: 2 }}>
        <span aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(90deg, var(--accent) 0 7px, transparent 7px 15px)", animation: "flowDash .9s linear infinite" }} />
        <span aria-hidden style={{ position: "absolute", right: -1, top: "50%", width: 0, height: 0, transform: "translateY(-50%)", borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: "6px solid var(--accent)" }} />
      </div>
    </div>
  );
}

export function ArchitectureGuide() {
  return (
    <section className="guide-section" style={{ marginTop: 44, borderTop: "1px solid var(--line2)", paddingTop: 36 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 6 }}>
        <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 19, margin: 0 }}>การทำงานของระบบ (สำหรับ Programmer / เจ้าหน้าที่ IT)</h2>
        <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", letterSpacing: ".08em" }}>Architecture</span>
      </div>
      <p style={{ fontSize: 14, color: "var(--sub)", margin: "0 0 24px", maxWidth: "72ch", lineHeight: 1.7 }}>
        ภาพรวมทางเทคนิคสำหรับผู้พัฒนาและเจ้าหน้าที่ไอที — ชุดเทคโนโลยี โครงสร้างข้อมูล เส้นทางการทำงานของหนึ่งคำขอ และการเชื่อมต่อกับระบบทะเบียนเอกสารงานเทคนิคการแพทย์ (MedTech) ผ่าน SSO
      </p>

      {/* stack */}
      <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 15, color: "var(--text)", margin: "0 0 12px" }}>ชุดเทคโนโลยี (Technology Stack)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(215px,1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)", marginBottom: 30 }}>
        {STACK.map((s) => (
          <div key={s.layer} style={{ background: "var(--bg)", padding: "16px 16px 18px" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 7 }}>{s.layer}</div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 14.5, color: "var(--text)", marginBottom: 5 }}>{s.name}</div>
            <div style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.6 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* architecture diagram */}
      <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 15, color: "var(--text)", margin: "0 0 12px" }}>แผนผังสถาปัตยกรรม</div>
      <div style={{ ...panel, padding: "20px 18px" }}>
        <div style={{ display: "flex", alignItems: "stretch", gap: 4, flexWrap: "wrap" }}>
          <ArchNode title="เบราว์เซอร์" sub="React 19" />
          <ArchArrow label="HTTPS" />
          <ArchNode title="Next.js Server" sub="Server Actions" ripple />
          <ArchArrow label="Prisma" />
          <ArchNode title="PostgreSQL" sub="database" ripple />
          <ArchArrow label="/api/files" />
          <ArchNode title="ไฟล์แนบ" sub="uploads volume" />
        </div>
        <p style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)", margin: "16px 0 0", lineHeight: 1.6 }}>
          เรนเดอร์ + ลอจิกอยู่ฝั่งเซิร์ฟเวอร์เดียว (SSR) ในคอนเทนเนอร์ Docker หลัง Caddy — ไฟล์แนบเสิร์ฟผ่าน route /api/files ที่ตรวจสิทธิ์ก่อนส่งทุกครั้ง
        </p>
      </div>

      {/* request lifecycle */}
      <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 15, color: "var(--text)", margin: "30px 0 12px" }}>เส้นทางการทำงานของหนึ่งคำขอ — “ลงทะเบียนเอกสาร”</div>
      <div className="no-print" style={{ position: "relative", height: 3, borderRadius: 2, background: "var(--hi)", margin: "0 0 18px", overflow: "hidden" }}>
        <span aria-hidden style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", width: 46, height: 3, borderRadius: 2, background: "linear-gradient(90deg, transparent, var(--accent))", animation: "travel 3s ease-in-out infinite" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(165px,1fr))", gap: 14, marginBottom: 30 }}>
        {REQ_FLOW.map((s, i) => (
          <div key={s.t} style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ display: "grid", placeItems: "center", flex: "0 0 auto", width: 22, height: 22, borderRadius: "50%", background: "var(--accent)", color: "var(--accent-ink)", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600 }}>{i + 1}</span>
              <span aria-hidden style={{ flex: 1, height: 2, borderRadius: 1, background: "var(--accent2)", transformOrigin: "left", animation: "barGrow .5s ease both", animationDelay: `${i * 0.12}s` }} />
            </div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 13.5, color: "var(--text)", marginBottom: 4 }}>{s.t}</div>
            <div style={{ fontSize: 12.5, color: "var(--sub)", lineHeight: 1.55 }}>{s.d}</div>
          </div>
        ))}
      </div>

      {/* data model */}
      <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 15, color: "var(--text)", margin: "0 0 12px" }}>โครงสร้างข้อมูลหลัก (Data Model)</div>
      <div style={{ border: "1px solid var(--line2)", borderRadius: 3, overflow: "hidden", marginBottom: 30 }}>
        {DATA_MODEL.map((m, i) => (
          <div key={m.name} style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "12px 16px", borderBottom: i === DATA_MODEL.length - 1 ? "none" : "1px solid var(--line)", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 600, color: "var(--accent)", flex: "0 0 auto", minWidth: 168 }}>{m.name}</span>
            <span style={{ fontSize: 13.5, color: "var(--sub)", lineHeight: 1.55 }}>{m.th}</span>
          </div>
        ))}
      </div>

      {/* security + SSO */}
      <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 15, color: "var(--text)", margin: "0 0 12px" }}>ความปลอดภัยและการเชื่อมต่อระบบ MedTech (SSO)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
        {[
          { t: "RBAC ตามบทบาท", d: "ทุก Server Action ตรวจ can(role, action) — 7 บทบาทมีสิทธิ์ต่างกันตามตารางด้านบน" },
          { t: "JWT + bcrypt", d: "เซสชันลงนามด้วย jose มีวันหมดอายุ · รหัสผ่านเก็บเป็น bcrypt hash เท่านั้น" },
          { t: "เชื่อม MedTech ผ่าน SSO", d: "เลือกงานเทคนิคการแพทย์ ระบบออก token ลงนามด้วย SSO_SHARED_SECRET พาเข้าระบบ Lab QMS อัตโนมัติ" },
          { t: "สำรองข้อมูลอัตโนมัติ", d: "Cron ทุกวันเวลา 00:00 น. ส่งฐานข้อมูลและไฟล์แนบขึ้น Google Drive (เก็บย้อนหลัง 30 วัน)" },
        ].map((x) => (
          <div key={x.t} style={{ background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 3, padding: "14px 16px" }}>
            <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 14, color: "var(--text)", marginBottom: 5 }}>{x.t}</div>
            <div style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.6 }}>{x.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- section: อัพโหลดไฟล์แนบ ---------- */

export function UploadTutorial() {
  return (
    <section style={{ marginTop: 44 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 4 }}>
        <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 19, margin: 0 }}>วิธีอัปโหลดไฟล์แนบ</h2>
        <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", letterSpacing: ".08em" }}>3 ขั้นตอน</span>
      </div>
      <RequireChip perm="แนบไฟล์" roles="หัวหน้างาน · หัวหน้าหมวดงาน · ผู้จัดการเอกสาร · ผู้ดูแลระบบ" />

      <div style={{ marginTop: 18 }}>
        {/* ขั้นที่ 1 */}
        <div style={stepRow}>
          <div style={stepText}>
            <div style={stepNum}>ขั้นที่ 1</div>
            <h3 style={stepTitle}>เปิดเอกสาร แล้วเลื่อนไปส่วน “ไฟล์แนบ”</h3>
            <p style={stepDesc}>
              คลิกเอกสารที่ต้องการจากหน้าทะเบียน ในหน้ารายละเอียดจะมีหัวข้อ{" "}
              <b style={{ color: "var(--text)", fontWeight: 600 }}>ไฟล์แนบ</b> แสดงรายการไฟล์ปัจจุบัน
              และกล่องเส้นประ “แนบไฟล์เพิ่ม” อยู่ท้ายรายการ
            </p>
          </div>
          <div style={stepVisual}>
            <div style={panel}>
              <div style={panelCaption}>ส่วนไฟล์แนบในหน้าเอกสาร</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={kindTag("var(--red)")}>PDF</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>HEM-WI-007.pdf</span>
              </div>
              <div style={{ border: "1px dashed var(--line3)", borderRadius: 2, padding: "12px 13px", marginTop: 12 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--accent)" }}>แนบไฟล์เพิ่ม</span>
              </div>
            </div>
          </div>
        </div>

        {/* ขั้นที่ 2 */}
        <div style={stepRow}>
          <div style={stepText}>
            <div style={stepNum}>ขั้นที่ 2</div>
            <h3 style={stepTitle}>กด “เลือกไฟล์จากเครื่อง” แล้วเลือกไฟล์</h3>
            <p style={stepDesc}>ไฟล์จะอัปโหลดและปรากฏในรายการด้านบนทันที</p>
            <ul style={tipList}>
              <li style={tipItem}><span style={tipMark}>·</span><span>รองรับ <b style={{ color: "var(--text)", fontWeight: 600 }}>.pdf .doc .docx .xls .xlsx</b> ขนาดไม่เกิน 50 MB ต่อไฟล์</span></li>
              <li style={tipItem}><span style={tipMark}>·</span><span>PDF เปิดดูในเว็บและดาวน์โหลดได้ · Word/Excel ดาวน์โหลดไปแก้ไขแล้วอัปโหลดกลับ</span></li>
              <li style={tipItem}><span style={tipMark}>·</span><span>แนบผิดไฟล์ กดปุ่ม <b style={{ color: "var(--red)", fontWeight: 600 }}>ลบ</b> ท้ายรายการนั้นได้ทันที</span></li>
            </ul>
          </div>
          <div style={stepVisual}>
            <div style={panel}>
              <div style={panelCaption}>กำลังอัปโหลด</div>
              <div style={{ border: "1px dashed var(--line3)", borderRadius: 2, padding: "13px 14px" }}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <span style={{ ...mockBtnPrimary, background: "var(--bg)", color: "var(--text)", border: "1px solid var(--line2)" }}>↑ เลือกไฟล์จากเครื่อง</span>
                  <Cursor style={{ right: -8, bottom: -11 }} />
                </div>
                <div style={{ height: 4, background: "var(--hi)", borderRadius: 2, marginTop: 13, overflow: "hidden" }}>
                  <span style={{ display: "block", height: "100%", background: "var(--accent)", animation: "fillBar 4s cubic-bezier(.2,.7,.3,1) infinite" }} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 2px 1px", animation: "popIn 4s ease infinite" }}>
                <span style={kindTag("var(--red)")}>PDF</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>HEM-WI-007.pdf</span>
                <span style={{ fontSize: 11, color: "var(--accent)", fontFamily: "var(--mono)", flex: "0 0 auto" }}>✓ แนบแล้ว</span>
              </div>
            </div>
          </div>
        </div>

        {/* ขั้นที่ 3 */}
        <div style={stepRow}>
          <div style={stepText}>
            <div style={stepNum}>ขั้นที่ 3</div>
            <h3 style={stepTitle}>แนบลิงก์ระบบภายนอก (ถ้ามี)</h3>
            <p style={stepDesc}>
              เอกสารที่อยู่ในระบบอื่น เช่น E-Document หรือระบบสารสนเทศของโรงพยาบาล
              ไม่ต้องอัปโหลดซ้ำ — วางลิงก์ในช่องแล้วกด <b style={{ color: "var(--text)", fontWeight: 600 }}>+ เพิ่มลิงก์</b>{" "}
              ระบบเติม https:// ให้อัตโนมัติ และแนบได้หลายลิงก์ต่อเอกสาร
            </p>
          </div>
          <div style={stepVisual}>
            <div style={panel}>
              <div style={panelCaption}>แนบลิงก์</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ ...mockInput, fontFamily: "var(--mono)", flex: "1 1 150px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>https://e-doc.hospital.go.th/…</div>
                <span style={{ ...mockBtnPrimary, background: "transparent", color: "var(--accent)", border: "1px solid var(--accent2)", fontFamily: "var(--mono)", fontSize: 11.5 }}>+ เพิ่มลิงก์</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 2px 1px" }}>
                <span style={kindTag("var(--amber)")}>URL</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>https://e-doc.hospital.go.th/…</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
