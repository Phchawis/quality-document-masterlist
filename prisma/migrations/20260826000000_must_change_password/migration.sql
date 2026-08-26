-- บัญชีที่ผู้ดูแลตั้งรหัสชั่วคราวให้ ต้องตั้งรหัสของตัวเองก่อนใช้งานระบบ
-- (ใช้กับการสร้างบัญชีให้บุคลากรพร้อมกันจำนวนมากด้วยรหัสชุดเดียว)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
