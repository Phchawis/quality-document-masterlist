"use client";

import { useState, useTransition } from "react";
import Modal, { fieldLabel, fieldInput, fieldSelect, btnPrimary, btnGhostModal } from "./Modal";
import { registerDocument } from "@/app/actions/documents";
import { WORKS, CATEGORIES, DOC_TYPES } from "@/lib/reference";

export default function RegisterButton() {
  const [open, setOpen] = useState(false);
  const [work, setWork] = useState<string>(WORKS.find((w) => !w.externalUrl)?.id ?? WORKS[0].id);
  const [cat, setCat] = useState("HEM");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const curCat = CATEGORIES.find((c) => c.code === cat);
  const subs = work === "MEDTECH" ? curCat?.subs : undefined;

  const validateTitle = (val: string) => {
    if (!val.trim()) {
      setTitleError("กรุณาระบุชื่อเอกสาร");
      return false;
    }
    setTitleError(null);
    return true;
  };

  const validateCode = (val: string) => {
    const clean = val.trim().toUpperCase();
    if (!clean) {
      setCodeError("กรุณาระบุรหัสเอกสาร");
      return false;
    }
    if (!/^[A-Z0-9-]+$/.test(clean)) {
      setCodeError("รหัสเอกสารใช้ได้เฉพาะตัวอักษร A-Z, 0-9 และ -");
      return false;
    }
    setCodeError(null);
    return true;
  };

  const handleOpen = () => {
    setTitle("");
    setCode("");
    setTitleError(null);
    setCodeError(null);
    setError(null);
    setOpen(true);
  };

  const submit = (formData: FormData) => {
    const tValid = validateTitle(title);
    const cValid = validateCode(code);
    if (!tValid || !cValid) return;

    setError(null);
    start(async () => {
      const res = await registerDocument(formData);
      if (res && !res.ok) setError(res.error ?? "เกิดข้อผิดพลาด");
      // On success the action redirects, so nothing more to do here.
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--accent)", color: "var(--accent-ink)", fontFamily: "var(--display)", fontWeight: 600, fontSize: 14.5, padding: "11px 18px", borderRadius: 2 }}
      >
        <span aria-hidden style={{ fontFamily: "var(--mono)", fontSize: 17, lineHeight: 1 }}>+</span> ลงทะเบียนเอกสาร
      </button>

      {open && (
        <Modal
          kicker="ลงทะเบียนเอกสารใหม่"
          title="ลงทะเบียนเอกสารคุณภาพ"
          onClose={() => !pending && setOpen(false)}
          footer={
            <>
              <button type="button" onClick={() => setOpen(false)} style={btnGhostModal}>ยกเลิก</button>
              <button type="submit" form="register-form" disabled={pending} style={{ ...btnPrimary, opacity: pending ? 0.7 : 1 }}>
                {pending ? "กำลังบันทึก…" : "ลงทะเบียน"}
              </button>
            </>
          }
        >
          <form id="register-form" action={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={fieldLabel}>
              ชื่อเอกสาร
              <input
                name="title"
                placeholder="เช่น การตรวจ…"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) validateTitle(e.target.value);
                }}
                onBlur={(e) => validateTitle(e.target.value)}
                style={{ ...fieldInput, borderColor: titleError ? "var(--red)" : "var(--line2)" }}
              />
              {titleError && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 5, fontFamily: "var(--sans)", textTransform: "none" }}>{titleError}</div>}
            </label>
            <label style={fieldLabel}>
              รหัสเอกสาร
              <input
                name="code"
                placeholder="เช่น HEM-WI-006"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (codeError) validateCode(e.target.value);
                }}
                onBlur={(e) => validateCode(e.target.value)}
                style={{ ...fieldInput, fontFamily: "var(--mono)", textTransform: "uppercase", borderColor: codeError ? "var(--red)" : "var(--line2)" }}
              />
              {codeError && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 5, fontFamily: "var(--sans)", textTransform: "none" }}>{codeError}</div>}
            </label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <label style={{ ...fieldLabel, flex: "1 1 200px" }}>
                งาน
                <select name="work" value={work} onChange={(e) => setWork(e.target.value)} style={fieldSelect}>
                  {WORKS.filter((w) => !w.externalUrl).map((w) => (
                    <option key={w.id} value={w.id}>{w.nameTh}</option>
                  ))}
                </select>
              </label>
              {work === "MEDTECH" && (
                <label style={{ ...fieldLabel, flex: "1 1 200px" }}>
                  หมวดงาน
                  <select name="cat" value={cat} onChange={(e) => setCat(e.target.value)} style={fieldSelect}>
                    <option value="">— เอกสารกลางระดับงาน (ไม่สังกัดหมวด) —</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} · {c.nameTh}{c.subs ? " ▸" : ""}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {subs && subs.length > 0 && (
              <label style={{ ...fieldLabel, background: "var(--accent-dim)", border: "1px solid var(--accent2)", borderRadius: 2, padding: "10px 12px 12px" }}>
                หมวดย่อยของ {curCat!.code} · {curCat!.nameTh}
                <select name="sub" key={cat} defaultValue="" style={fieldSelect}>
                  <option value="">— ไม่ระบุหมวดย่อย —</option>
                  {subs.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            )}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <label style={{ ...fieldLabel, flex: "1 1 200px" }}>
                ประเภทเอกสาร
                <select name="type" defaultValue="WI" style={fieldSelect}>
                  {DOC_TYPES.map((t) => (
                    <option key={t.code} value={t.code}>{t.code} · {t.nameTh}</option>
                  ))}
                </select>
              </label>
              <label style={{ ...fieldLabel, flex: "1 1 200px" }}>
                ระยะเวลาจัดเก็บ/ทบทวน
                <select name="retentionYears" defaultValue="2" style={fieldSelect}>
                  <option value="2">2 ปี</option>
                  <option value="5">5 ปี</option>
                  <option value="10">10 ปี</option>
                </select>
              </label>
            </div>
            <div>
              <span style={fieldLabel}>รูปแบบไฟล์แนบ (เลือกได้หลายแบบ)</span>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
                {[
                  { v: "pdf", label: "PDF · เปิดดู" },
                  { v: "word", label: "Word · แก้ไข" },
                  { v: "excel", label: "Excel · แก้ไข" },
                  { v: "url", label: "URL · แนบลิงก์" },
                ].map((k) => (
                  <label key={k.v} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, color: "var(--text)" }}>
                    <input type="checkbox" name="kinds" value={k.v} defaultChecked={k.v === "pdf"} />
                    {k.label}
                  </label>
                ))}
              </div>
            </div>
            {error && <div role="alert" style={{ fontSize: 13.5, color: "var(--red)" }}>{error}</div>}
          </form>
        </Modal>
      )}
    </>
  );
}
