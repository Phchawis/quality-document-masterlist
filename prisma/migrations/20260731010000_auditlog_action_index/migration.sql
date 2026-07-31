-- เพิ่ม index บน (action, createdAt) ให้หน้า audit กรอง/จัดกลุ่มตาม action ได้เร็ว
-- (เดิม groupBy/where action ต้องสแกนทั้งตาราง — ช้าเมื่อ log หลักแสนแถว)
CREATE INDEX IF NOT EXISTS "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
