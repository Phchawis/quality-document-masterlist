import { getCurrentUser } from "@/lib/auth";
import { ROLE_META, ROLE_ORDER } from "@/lib/reference";
import type { Perm } from "@/lib/reference";
import { RegisterTutorial, UploadTutorial } from "@/components/GuideTutorials";

export const dynamic = "force-dynamic";

const PERM_COLS: [Perm | "view", string][] = [
  ["view", "ดู / ค้นหา"],
  ["acknowledge", "อ่าน / รับทราบ"],
  ["upload", "แนบไฟล์"],
  ["register", "ลงทะเบียน / ยกเลิก"],
  ["revise", "บันทึกแก้ไข"],
  ["publish", "ประกาศใช้"],
  ["approve", "อนุมัติ"],
  ["audit", "ดูบันทึกตรวจสอบ"],
  ["viewUsers", "ดูผู้ใช้งาน"],
  ["manage", "จัดการระบบ"],
];

const STEPS = [
  { n: "01", t: "เข้าสู่ระบบด้วยบัญชีของคุณ", d: "เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่านที่ได้รับ ระบบจะแสดงเมนูและปุ่มดำเนินการตามสิทธิ์ของบทบาทโดยอัตโนมัติ" },
  { n: "02", t: "ค้นหาเอกสารจากทะเบียน", d: "ค้นหาด้วยรหัสหรือชื่อเอกสาร ร่วมกับตัวกรอง งาน · ประเภท · หมวดงาน · สถานะ และคลิกหัวตารางเพื่อเรียงลำดับ" },
  { n: "03", t: "เปิดดูรายละเอียดเอกสาร", d: "คลิกแถวเอกสารเพื่อดูข้อมูลควบคุม ไฟล์แนบ ประวัติการแก้ไข และความคืบหน้าการรับทราบของหมวดงาน" },
  { n: "04", t: "บันทึกการอ่าน / รับทราบ", d: "เอกสาร QM · SP · WI ต้องลงนามรับทราบ — กดปุ่มรับทราบ ระบบจะบันทึกชื่อและวันที่ของคุณทันที" },
  { n: "05", t: "ลงทะเบียน แก้ไข ประกาศใช้", d: "ผู้มีสิทธิ์ลงทะเบียนเอกสารใหม่ บันทึกแก้ไขเพื่อปรับเวอร์ชัน ประกาศใช้ฉบับร่าง หรือยกเลิกการใช้งานได้จากหน้ารายละเอียด" },
];

const FILE_GUIDE = [
  { tag: "PDF", color: "var(--red)", t: "เปิดดู", d: "ฉบับประกาศใช้สำหรับอ่าน ไม่ให้แก้ไข" },
  { tag: "DOC", color: "var(--blue)", t: "แก้ไข", d: "ต้นฉบับ Word สำหรับผู้มีสิทธิ์ปรับปรุงเอกสาร" },
  { tag: "XLS", color: "var(--accent)", t: "แก้ไข", d: "แบบบันทึก Excel สำหรับกรอกข้อมูลปฏิบัติงาน" },
  { tag: "URL", color: "var(--amber)", t: "เปิดลิงก์", d: "ลิงก์ระบบ แอปพลิเคชัน และ E-Document" },
];

export default async function GuidePage() {
  const user = (await getCurrentUser())!;

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <div style={{ paddingBottom: 26, borderBottom: "1px solid var(--line2)" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".24em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 12 }}>User Guide</div>
        <h1 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "clamp(1.8rem,3.8vw,2.8rem)", letterSpacing: "-.02em", lineHeight: 1, margin: 0 }}>คู่มือการใช้งาน</h1>
        <p style={{ color: "var(--sub)", margin: "14px 0 0", fontSize: 16, maxWidth: "60ch" }}>ภาพรวมการใช้งาน วิธีลงทะเบียนเอกสารใหม่ วิธีอัปโหลดไฟล์แนบ สิทธิ์ของแต่ละบทบาท และความหมายของรูปแบบไฟล์แนบ</p>
      </div>

      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 19, margin: "0 0 20px" }}>ขั้นตอนการใช้งาน</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", borderTop: "1px solid var(--line2)" }}>
          {STEPS.map((g) => (
            <div key={g.n} style={{ padding: "22px 22px 26px 0", borderRight: "1px solid var(--line)", minWidth: 0 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".14em", color: "var(--faint)", marginBottom: 12 }}>{g.n}</div>
              <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 16.5, color: "var(--text)", lineHeight: 1.4 }}>{g.t}</div>
              <p style={{ fontSize: 14, color: "var(--sub)", lineHeight: 1.7, margin: "9px 0 0" }}>{g.d}</p>
            </div>
          ))}
        </div>
      </section>

      <RegisterTutorial />
      <UploadTutorial />

      <section style={{ marginTop: 44 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 6 }}>
          <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 19, margin: 0 }}>สิทธิ์การใช้งานตามบทบาท</h2>
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", letterSpacing: ".08em" }}>{ROLE_ORDER.length} บทบาท · {PERM_COLS.length} สิทธิ์</span>
        </div>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 18px" }}>
          แถวที่แถบสีคือบทบาทที่คุณใช้งานอยู่ · Administrator เป็นสิทธิ์สูงสุดของระบบ · “ดูผู้ใช้งาน” เป็นการดูรายชื่อแบบอ่านอย่างเดียว การเพิ่ม/แก้ไข/ปิดบัญชีอยู่ในสิทธิ์ “จัดการระบบ”
        </p>
        <div style={{ border: "1px solid var(--line2)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 1220, ["--pcols" as string]: `minmax(200px,1.4fr) repeat(${PERM_COLS.length},minmax(96px,1fr))` }}>
              <div style={{ display: "grid", gridTemplateColumns: "var(--pcols)", alignItems: "center", background: "var(--surface2)", borderBottom: "1px solid var(--line2)" }}>
                <span style={{ padding: "13px 14px", fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>บทบาท</span>
                {PERM_COLS.map(([, label]) => (
                  <span key={label} style={{ padding: "13px 6px", textAlign: "center", fontFamily: "var(--mono)", fontSize: 11.5, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</span>
                ))}
              </div>
              {ROLE_ORDER.map((roleId) => {
                const r = ROLE_META[roleId];
                const isMe = user.role === roleId;
                return (
                  <div key={roleId} style={{ display: "grid", gridTemplateColumns: "var(--pcols)", alignItems: "center", borderBottom: "1px solid var(--line)", background: isMe ? "var(--accent-dim)" : "transparent" }}>
                    <span style={{ padding: "14px 14px", minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: "var(--display)", fontWeight: 600, fontSize: 15, color: "var(--text)" }}>{r.th}</span>
                      <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)", letterSpacing: ".06em", marginTop: 2 }}>{r.en}</span>
                    </span>
                    {PERM_COLS.map(([perm]) => {
                      const on = perm === "view" ? true : !!r.p[perm as Perm];
                      return (
                        <span key={perm} style={{ padding: "14px 8px", textAlign: "center", fontFamily: "var(--mono)", fontSize: 15, fontWeight: on ? 600 : 400, color: on ? "var(--accent)" : "var(--faint)" }}>
                          {on ? "✓" : "—"}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 44, marginBottom: 8 }}>
        <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 19, margin: "0 0 20px" }}>รูปแบบไฟล์แนบ 4 รูปแบบ</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)" }}>
          {FILE_GUIDE.map((f) => (
            <div key={f.tag} style={{ background: "var(--bg)", padding: "20px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, letterSpacing: ".05em", padding: "5px 9px", border: "1px solid var(--line2)", borderRadius: 2, color: f.color }}>{f.tag}</span>
                <span style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 15.5, color: "var(--text)" }}>{f.t}</span>
              </div>
              <p style={{ fontSize: 13.5, color: "var(--sub)", lineHeight: 1.65, margin: 0 }}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
