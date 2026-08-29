-- เพิ่มชนิดไฟล์แนบที่หน่วยงานใช้จริงแต่ระบบเดิมปฏิเสธ
-- (ภาพสแกนเอกสาร · สไลด์อบรม · ไฟล์ข้อความ) — เดิมรับแค่ PDF/WORD/EXCEL
-- ALTER TYPE ... ADD VALUE เพิ่มค่าใหม่ท้าย enum โดยไม่แตะแถวเดิม
ALTER TYPE "AttachmentKind" ADD VALUE IF NOT EXISTS 'IMAGE';
ALTER TYPE "AttachmentKind" ADD VALUE IF NOT EXISTS 'SLIDE';
ALTER TYPE "AttachmentKind" ADD VALUE IF NOT EXISTS 'OTHER';
