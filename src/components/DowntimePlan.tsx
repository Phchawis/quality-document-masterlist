"use client";

/* แผนรับมือเมื่อระบบใช้งานไม่ได้ (Downtime Plan)
   ออกแบบตามข้อเท็จจริงของระบบจริง: ทุกระบบอยู่บนเซิร์ฟเวอร์เดียวกัน สำรองข้อมูลรายวัน
   และมีการเฝ้าระวังอัตโนมัติทุก 3 นาที

   ⚠️ หลักสำคัญ: คู่มือที่อยู่ในระบบจะอ่านไม่ได้ตอนระบบล่ม
   จึงมี "การ์ดฉุกเฉิน" หน้าเดียวให้พิมพ์ติดไว้หน้างาน แยกจากคู่มือฉบับเต็ม */

const CONTACT = {
  role: "ผู้ดูแลระบบสารสนเทศฝ่ายสหเวชศาสตร์",
  name: "ทนพ.ภาคย์ชวิศ พรประสิทธิ์แสง",
  phone: "(กรอกเบอร์ติดต่อ)",
};

const LEVELS = [
  {
    tone: "var(--amber)",
    title: "ระดับ 1 · เข้าใช้งานไม่ได้ชั่วคราว",
    when: "เปิดเว็บไม่ขึ้น / ช้าผิดปกติ ไม่เกิน 30 นาที",
    action: "รอสักครู่แล้วลองใหม่ · ระบบมีการเฝ้าระวังอัตโนมัติและกู้ตัวเองได้ในหลายกรณี · ถ้าเกิน 30 นาทีให้แจ้งผู้ดูแล",
  },
  {
    tone: "var(--red)",
    title: "ระดับ 2 · ใช้งานไม่ได้ต่อเนื่อง",
    when: "เกิน 30 นาที หรือแจ้งแล้วยังไม่กลับมา",
    action: "ใช้สำเนาเอกสารออฟไลน์ที่เตรียมไว้ปฏิบัติงานต่อ · หัวหน้างานแจ้งทีมทราบ · บันทึกงานลงกระดาษไว้ก่อน แล้วบันทึกย้อนหลังเมื่อระบบกลับมา",
  },
  {
    tone: "var(--red)",
    title: "ระดับ 3 · ข้อมูลเสียหาย",
    when: "เอกสารหาย ข้อมูลผิดเพี้ยน หรือเซิร์ฟเวอร์เสียหาย",
    action: "หยุดแก้ไขข้อมูลทั้งหมดทันที (กันข้อมูลเสียซ้ำ) · แจ้งผู้ดูแลทันที · ผู้ดูแลกู้คืนจากข้อมูลสำรองรายวัน",
  },
];

const ROLES = [
  {
    who: "เจ้าหน้าที่ผู้ใช้งานทั่วไป",
    steps: [
      "ตรวจก่อนว่าเป็นที่อินเทอร์เน็ตของตัวเองหรือไม่ — ลองเปิดเว็บอื่นดู",
      "ลองเปิดระบบด้วยอุปกรณ์อื่น (มือถือ/เครื่องอื่น) เพื่อยืนยันว่าระบบล่มจริง",
      "ถ้าระบบล่มจริง ใช้สำเนาเอกสารออฟไลน์ที่หมวดงานเก็บไว้ปฏิบัติงานต่อ",
      "แจ้งหัวหน้าหมวดงาน — ไม่ต้องแจ้งซ้ำหลายคน",
    ],
  },
  {
    who: "หัวหน้างาน / หัวหน้าหมวดงาน",
    steps: [
      "แจ้งทีมทราบว่าระบบใช้งานไม่ได้ และให้ใช้สำเนาออฟไลน์แทน",
      "แจ้งผู้ดูแลระบบพร้อมระบุ: เปิดไม่ได้ตั้งแต่เมื่อไหร่ · ขึ้นข้อความว่าอะไร · กี่คนที่เจอปัญหา",
      "กำกับให้บันทึกงานที่ทำระหว่างระบบล่มไว้ในกระดาษ เพื่อบันทึกย้อนหลังภายหลัง",
      "เมื่อระบบกลับมา ตรวจว่าเอกสารและการรับทราบครบถ้วน",
    ],
  },
  {
    who: "ผู้ดูแลระบบ",
    steps: [
      "ตรวจสถานะเซิร์ฟเวอร์และคอนเทนเนอร์ทั้งหมด",
      "ดูบันทึกการเฝ้าระวัง (เฝ้าอัตโนมัติทุก 3 นาที) เพื่อหาเวลาที่เริ่มขัดข้อง",
      "ถ้าเป็นที่แอปพลิเคชัน — รีสตาร์ทบริการนั้น โดยไม่กระทบระบบอื่น",
      "ถ้าข้อมูลเสียหาย — กู้คืนจากข้อมูลสำรองรายวัน (ดูขั้นตอนในหัวข้อสำหรับผู้ดูแลระบบ)",
      "แจ้งผลกลับหัวหน้างานทุกครั้งเมื่อระบบกลับมาใช้งานได้",
    ],
  },
];

const PREVENT = [
  { t: "สำรองข้อมูลอัตโนมัติทุกวัน", d: "ฐานข้อมูลและไฟล์แนบถูกสำรองขึ้นที่เก็บภายนอกทุกคืน เก็บย้อนหลัง 30 วัน และทดสอบกู้คืนแล้ว" },
  { t: "เฝ้าระวังอัตโนมัติทุก 3 นาที", d: "ระบบตรวจสถานะเว็บทุก 3 นาที และแจ้งเตือนผู้ดูแลทันทีเมื่อขัดข้อง" },
  { t: "แยกฐานข้อมูลรายระบบ", d: "แต่ละระบบใช้ฐานข้อมูลและพื้นที่ไฟล์ของตัวเอง ระบบหนึ่งขัดข้องจึงไม่ลามไปอีกระบบ" },
  { t: "สำเนาออฟไลน์ประจำเดือน", d: "ให้หัวหน้าหมวดงานส่งออกทะเบียนเอกสาร (Excel) และดาวน์โหลดเอกสารสำคัญเก็บไว้ในเครื่องทุกเดือน" },
];

const secTitle: React.CSSProperties = { fontFamily: "var(--display)", fontWeight: 600, fontSize: 19, margin: 0 };
const subTitle: React.CSSProperties = { fontFamily: "var(--display)", fontWeight: 600, fontSize: 15, color: "var(--text)", margin: "0 0 12px" };

export default function DowntimePlan() {
  // พิมพ์เฉพาะการ์ดฉุกเฉิน — ใส่คลาสที่ body ชั่วคราวเพื่อให้ CSS ซ่อนส่วนอื่นทั้งหมด
  const printCard = () => {
    document.body.classList.add("printing-card");
    const cleanup = () => {
      document.body.classList.remove("printing-card");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  };

  return (
    <section className="guide-section" style={{ marginTop: 44, borderTop: "1px solid var(--line2)", paddingTop: 36 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 6 }}>
        <h2 style={secTitle}>แผนรับมือเมื่อระบบใช้งานไม่ได้</h2>
        <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", letterSpacing: ".08em" }}>Downtime Plan</span>
      </div>
      <p style={{ fontSize: 14, color: "var(--sub)", margin: "0 0 22px", maxWidth: "72ch", lineHeight: 1.7 }}>
        ระบบสารสนเทศอาจใช้งานไม่ได้ชั่วคราวจากหลายสาเหตุ (ไฟฟ้า อินเทอร์เน็ต หรือเซิร์ฟเวอร์ขัดข้อง)
        งานห้องปฏิบัติการต้องดำเนินต่อได้เสมอ — หัวข้อนี้กำหนดว่าแต่ละบทบาททำอะไร เพื่อให้บริการไม่หยุดชะงัก
        และเอกสารที่ใช้อ้างอิงยังคงถูกต้อง
      </p>

      {/* คำเตือนสำคัญ + ปุ่มพิมพ์การ์ด */}
      <div className="no-print" style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "var(--surface)", border: "1px solid var(--amber)", borderRadius: 3, padding: "16px 18px", marginBottom: 26, flexWrap: "wrap" }}>
        <span aria-hidden style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, letterSpacing: ".08em", color: "var(--amber)", border: "1px solid var(--amber)", borderRadius: 2, padding: "3px 8px", flex: "0 0 auto", textTransform: "uppercase" }}>สำคัญ</span>
        <p style={{ fontSize: 14, color: "var(--sub)", margin: 0, lineHeight: 1.65, flex: "1 1 320px", minWidth: 0 }}>
          <b style={{ color: "var(--text)", fontWeight: 600 }}>คู่มือหน้านี้อ่านไม่ได้ตอนระบบล่ม</b> —
          กรุณาพิมพ์การ์ดฉุกเฉินหน้าเดียวด้านล่างติดไว้ที่จุดปฏิบัติงานทุกจุด และให้หัวหน้าหมวดงานเก็บสำเนาเอกสารออฟไลน์ไว้ล่วงหน้า
        </p>
        <button
          type="button"
          onClick={printCard}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8, flex: "0 0 auto",
            background: "var(--accent)", color: "var(--accent-ink)", border: "none", borderRadius: 3,
            padding: "10px 16px", fontFamily: "var(--display)", fontWeight: 600, fontSize: 13.5, cursor: "pointer",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" />
          </svg>
          พิมพ์การ์ดฉุกเฉิน
        </button>
      </div>

      {/* ระดับความรุนแรง */}
      <h3 style={subTitle}>ระดับความรุนแรงและการปฏิบัติ</h3>
      <div style={{ border: "1px solid var(--line2)", borderRadius: 3, overflow: "hidden", marginBottom: 30 }}>
        {LEVELS.map((l, i) => (
          <div key={l.title} style={{ padding: "16px 18px", borderBottom: i === LEVELS.length - 1 ? "none" : "1px solid var(--line)", background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7, flexWrap: "wrap" }}>
              <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: l.tone, flex: "0 0 auto" }} />
              <span style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 15, color: "var(--text)" }}>{l.title}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)" }}>{l.when}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--sub)", lineHeight: 1.7 }}>{l.action}</p>
          </div>
        ))}
      </div>

      {/* ใครทำอะไร */}
      <h3 style={subTitle}>ขั้นตอนปฏิบัติแยกตามบทบาท</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginBottom: 30 }}>
        {ROLES.map((r) => (
          <div key={r.who} style={{ background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 3, padding: "18px 18px 20px" }}>
            <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 15, color: "var(--text)", marginBottom: 12 }}>{r.who}</div>
            <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10, counterReset: "s" }}>
              {r.steps.map((s) => (
                <li key={s} style={{ display: "flex", gap: 10, fontSize: 13.5, color: "var(--sub)", lineHeight: 1.6 }}>
                  <span aria-hidden style={{ color: "var(--accent)", fontFamily: "var(--mono)", flex: "0 0 auto" }}>·</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {/* มาตรการป้องกันล่วงหน้า */}
      <h3 style={subTitle}>มาตรการป้องกันที่ใช้อยู่</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)", marginBottom: 30 }}>
        {PREVENT.map((p) => (
          <div key={p.t} style={{ background: "var(--bg)", padding: "16px 16px 18px" }}>
            <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 14.5, color: "var(--text)", marginBottom: 6 }}>{p.t}</div>
            <div style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.6 }}>{p.d}</div>
          </div>
        ))}
      </div>

      {/* ───────── การ์ดฉุกเฉิน A4 (พิมพ์แยกได้) ───────── */}
      <h3 style={subTitle}>การ์ดฉุกเฉินสำหรับติดหน้างาน</h3>
      <p style={{ fontSize: 13.5, color: "var(--sub)", margin: "0 0 14px", maxWidth: "70ch", lineHeight: 1.65 }}>
        พิมพ์หน้านี้ติดไว้ที่จุดปฏิบัติงาน ห้องเวร และข้างเครื่องตรวจวิเคราะห์ — อ่านได้ทันทีโดยไม่ต้องเปิดคอมพิวเตอร์
      </p>

      <div id="emergency-card" className="emg-card">
        <div className="emg-head">
          <div>
            <div className="emg-kicker">แผนรับมือเมื่อระบบสารสนเทศใช้งานไม่ได้</div>
            <div className="emg-title">ระบบเปิดไม่ได้ ทำอย่างไร?</div>
          </div>
          <div className="emg-org">
            ฝ่ายสหเวชศาสตร์<br />
            <span>โรงพยาบาลธรรมศาสตร์เฉลิมพระเกียรติ</span>
          </div>
        </div>

        <ol className="emg-steps">
          <li>
            <b>ตรวจก่อนว่าเป็นที่เราหรือระบบ</b>
            <span>ลองเปิดเว็บอื่นดู · ลองเปิดด้วยมือถือหรือเครื่องอื่น ถ้าเปิดได้แสดงว่าเป็นที่เครื่องของเรา</span>
          </li>
          <li>
            <b>ถ้าระบบล่มจริง — ใช้สำเนาออฟไลน์ทำงานต่อ</b>
            <span>ใช้เอกสารสำเนาที่หัวหน้าหมวดงานเก็บไว้ · งานห้องปฏิบัติการต้องดำเนินต่อตามปกติ</span>
          </li>
          <li>
            <b>บันทึกงานลงกระดาษไว้ก่อน</b>
            <span>สิ่งที่ทำระหว่างระบบล่ม ให้จดไว้แล้วบันทึกเข้าระบบย้อนหลังเมื่อกลับมาใช้งานได้</span>
          </li>
          <li>
            <b>แจ้งหัวหน้าหมวดงาน</b>
            <span>แจ้งจุดเดียวพอ ไม่ต้องแจ้งซ้ำหลายคน · ระบุเวลาที่เริ่มเปิดไม่ได้และข้อความที่ขึ้น</span>
          </li>
        </ol>

        <div className="emg-warn">
          <b>ห้ามทำ:</b> ถ้าสงสัยว่าข้อมูลผิดเพี้ยนหรือเอกสารหาย — หยุดแก้ไขข้อมูลทั้งหมดทันที แล้วแจ้งผู้ดูแลระบบ (การแก้ต่อจะทำให้กู้คืนยากขึ้น)
        </div>

        <div className="emg-contact">
          <div className="emg-contact-l">ติดต่อผู้ดูแลระบบ</div>
          <div className="emg-contact-r">
            <div>{CONTACT.name} — {CONTACT.role}</div>
            <div className="emg-phone">โทร. {CONTACT.phone}</div>
          </div>
        </div>

        <div className="emg-foot">
          <span>ระบบสำรองข้อมูลอัตโนมัติทุกวัน · เฝ้าระวังสถานะทุก 3 นาที</span>
          <span>ISO 15189:2022</span>
        </div>
      </div>
    </section>
  );
}
