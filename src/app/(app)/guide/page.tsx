import { getCurrentUser } from "@/lib/auth";
import { ROLE_META, ROLE_ORDER } from "@/lib/reference";
import type { Perm } from "@/lib/reference";
import { RegisterTutorial, UploadTutorial, ArchitectureGuide } from "@/components/GuideTutorials";
import PrintGuideButton from "@/components/PrintGuideButton";

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
  { n: "04", t: "บันทึกการอ่าน / รับทราบ", d: "เอกสาร QM · SOP · WI ต้องลงนามรับทราบ — กดปุ่มรับทราบ ระบบจะบันทึกชื่อและวันที่ของคุณทันที" },
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
    <div id="guide-doc" style={{ animation: "fadeUp .4s ease both" }}>
      {/* ปกเฉพาะตอนพิมพ์ PDF */}
      <div className="print-only" style={{ marginBottom: 18, paddingBottom: 14, borderBottom: "2px solid var(--accent)" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>User Guide · คู่มือการใช้งาน</div>
        <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22 }}>ทะเบียนเอกสารคุณภาพ ฝ่ายสหเวชศาสตร์</div>
        <div style={{ fontSize: 13, color: "var(--sub)", marginTop: 4 }}>โรงพยาบาลธรรมศาสตร์เฉลิมพระเกียรติ · ISO 15189:2022</div>
      </div>

      <div style={{ paddingBottom: 26, borderBottom: "1px solid var(--line2)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".24em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 12 }}>User Guide</div>
            <h1 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "clamp(1.8rem,3.8vw,2.8rem)", letterSpacing: "-.02em", lineHeight: 1, margin: 0 }}>คู่มือการใช้งาน</h1>
            <p style={{ color: "var(--sub)", margin: "14px 0 0", fontSize: 16, maxWidth: "60ch" }}>ภาพรวมการใช้งาน วิธีลงทะเบียนเอกสารใหม่ วิธีอัปโหลดไฟล์แนบ สิทธิ์ของแต่ละบทบาท และความหมายของรูปแบบไฟล์แนบ</p>
          </div>
          <PrintGuideButton />
        </div>
      </div>

      <div style={{ marginTop: 28, display: "flex", gap: 14, alignItems: "flex-start", background: "var(--surface)", border: "1px solid var(--amber)", borderRadius: 3, padding: "16px 18px" }}>
        <span aria-hidden style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, letterSpacing: ".08em", color: "var(--amber)", border: "1px solid var(--amber)", borderRadius: 2, padding: "3px 8px", flex: "0 0 auto", textTransform: "uppercase" }}>ระบบแยก</span>
        <p style={{ fontSize: 14, color: "var(--sub)", margin: 0, lineHeight: 1.65 }}>
          <b style={{ color: "var(--text)", fontWeight: 600 }}>งานห้องปฏิบัติการเทคนิคการแพทย์ (MedTech)</b> มีทะเบียนเอกสารเป็นระบบของตัวเองแยกต่างหาก — เมื่อเลือกงานนี้จากแดชบอร์ดหรือหน้าทะเบียน ระบบจะเปิดแท็บใหม่พาไปยังระบบนั้นโดยตรง (เข้าสู่ระบบให้อัตโนมัติหากบัญชีตรงกัน) ส่วนทะเบียนใน Masterlist นี้ดูแลงานเวชศาสตร์การบริการโลหิตและงานจุลชีววิทยา
        </p>
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
          แถวที่แถบสีคือบทบาทที่คุณใช้งานอยู่ · Administrator เป็นสิทธิ์สูงสุดของระบบ · “ดูผู้ใช้งาน” เป็นการดูรายชื่อแบบอ่านอย่างเดียว การเพิ่ม/แก้ไข/ปิดบัญชี และออกรายงาน PDF อยู่ในสิทธิ์ “จัดการระบบ” (เฉพาะ Administrator)
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

      <ArchitectureGuide />

      {user.role === "SYSADMIN" && (
        <section style={{ marginTop: 44, borderTop: "1px solid var(--line2)", paddingTop: 36, marginBottom: 8 }}>
          <h2 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 19, margin: "0 0 12px", color: "var(--text)" }}>การดูแลระบบและการสำรองข้อมูล (สำหรับ Administrator)</h2>
          <p style={{ fontSize: 14.5, color: "var(--sub)", margin: "0 0 20px", lineHeight: 1.6 }}>
            คู่มือสำหรับผู้ดูแลระบบเกี่ยวกับการตั้งค่าเซิร์ฟเวอร์หลักและระบบสำรองข้อมูลอัตโนมัติไปยัง Google Drive
          </p>
          <div style={{ background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 3, padding: "20px 22px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 10px", color: "var(--text)" }}>🕒 ระบบสำรองข้อมูลอัตโนมัติ (Daily Backup Schedule)</h3>
            <p style={{ fontSize: 14, color: "var(--sub)", margin: "0 0 14px", lineHeight: 1.65 }}>
              เซิร์ฟเวอร์หลัก (VPS) ได้รับการติดตั้งสคริปต์ <b><code>/opt/masterlist/backup.sh</code></b> ร่วมกับ Cron Job ซึ่งจะทำงานอัตโนมัติทุกวันในเวลา <b>00:00 น.</b> เพื่อส่งไฟล์สำรองขึ้นไปยัง Google Drive ในโฟลเดอร์ <b><code>Masterlist_Backups</code></b> ของบัญชี <b><code>gpharkchawisp@gmail.com</code></b>:
            </p>
            <ul style={{ margin: "12px 0 0", paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              <li style={{ display: "flex", gap: 9, fontSize: 13.5, color: "var(--sub)", lineHeight: 1.6 }}>
                <span style={{ color: "var(--accent)", fontFamily: "var(--mono)", flex: "0 0 auto" }}>·</span>
                <span><b>ไฟล์ฐานข้อมูล:</b> บันทึกในชื่อ <code>db_backup_YYYYMMDD_HHMMSS.sql.gz</code> (เก็บย้อนหลัง 30 วันบนเซิร์ฟเวอร์)</span>
              </li>
              <li style={{ display: "flex", gap: 9, fontSize: 13.5, color: "var(--sub)", lineHeight: 1.6 }}>
                <span style={{ color: "var(--accent)", fontFamily: "var(--mono)", flex: "0 0 auto" }}>·</span>
                <span><b>ไฟล์เอกสารแนบจริง:</b> บันทึกในชื่อ <code>files_backup_YYYYMMDD_HHMMSS.tar.gz</code> (เก็บย้อนหลัง 30 วันบนเซิร์ฟเวอร์)</span>
              </li>
            </ul>

            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "22px 0 10px", color: "var(--text)" }}>🔄 ขั้นตอนการกู้คืนระบบกรณีฉุกเฉิน (Database & File Restore)</h3>
            <p style={{ fontSize: 14, color: "var(--sub)", margin: "0 0 12px", lineHeight: 1.65 }}>
              หากเกิดเหตุขัดข้องประการใดและต้องการดึงประวัติย้อนหลังหรือไฟล์เอกสารกลับคืนมา สามารถกู้คืนผ่านทาง SSH โดยพิมพ์คำสั่งตามลำดับดังนี้:
            </p>
            <div style={{ background: "var(--bg2)", padding: "14px 18px", borderRadius: 2, border: "1px solid var(--line)", fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.6, color: "var(--text)", overflowX: "auto", whiteSpace: "pre" }}>
{`# 1. กู้คืนฐานข้อมูล (Database Restore)
gunzip -c /var/backups/masterlist/db_backup_XXXXXXXX_XXXXXX.sql.gz > /tmp/restore.sql
docker exec -i masterlist-db-1 psql -U masterlist -d masterlist < /tmp/restore.sql
rm /tmp/restore.sql

# 2. กู้คืนไฟล์อัปโหลดทั้งหมด (Files Restore)
tar -xzf /var/backups/masterlist/files_backup_XXXXXXXX_XXXXXX.tar.gz -C /var/lib/docker/volumes/masterlist_uploads/_data/`}
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "22px 0 10px", color: "var(--text)" }}>⚡ แรมเสมือนป้องกันระบบล่ม (Swap Space)</h3>
            <p style={{ fontSize: 14, color: "var(--sub)", margin: "0", lineHeight: 1.65 }}>
              เซิร์ฟเวอร์ VPS ได้รับการเปิดใช้งานแรมเสมือน (Swap Space) ขนาด <b>4.0 GB</b> เพิ่มเติมจากแรมจริง 2.0 GB ทำให้ระบบมีทรัพยากรหน่วยความจำรวม 6.0 GB เพื่อความเสถียรสูงสุดขณะคอมไพล์โค้ดหรือรันโปรเจกต์อื่นๆ ร่วมด้วย
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
