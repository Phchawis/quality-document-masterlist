-- กันเวอร์ชันซ้ำต่อเอกสาร: เปลี่ยน index ธรรมดาเป็น UNIQUE constraint
-- (คู่กับ optimistic lock ในโค้ด reviseDocument เพื่อกัน race ตอนแก้เอกสารพร้อมกัน)
DROP INDEX IF EXISTS "Revision_documentId_version_idx";
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_documentId_version_key" UNIQUE ("documentId", "version");
