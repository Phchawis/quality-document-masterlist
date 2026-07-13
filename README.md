# ทะเบียนเอกสารคุณภาพ · Quality Document Masterlist

ระบบทะเบียนควบคุมเอกสารคุณภาพห้องปฏิบัติการ ฝ่ายสหเวชศาสตร์ โรงพยาบาลธรรมศาสตร์เฉลิมพระเกียรติ
ตามมาตรฐาน ISO 15189:2022

สร้างจาก prototype (Claude Design) → ระบบจริงพร้อมต่อ Database และ hosting

## สถาปัตยกรรม (Tech stack)

| ส่วน | เทคโนโลยี |
|------|-----------|
| Framework | Next.js 16 (App Router, React 19, Server Actions) |
| Database | PostgreSQL 17 + Prisma ORM 7 |
| Auth | Username + รหัสผ่าน (bcrypt) · session JWT (jose) ใน httpOnly cookie |
| ไฟล์แนบ | เก็บในระบบเอง (ดิสก์/volume) + เสิร์ฟผ่าน API ที่ตรวจสิทธิ์ |
| UI | ธีมมืด/ครีม, ฟอนต์ Sarabun/Anuphan, responsive |

## ความสามารถ

- เข้าสู่ระบบด้วยบัญชีจริง · 6 บทบาท พร้อม permission matrix (ดู/รับทราบ/แนบไฟล์/ลงทะเบียน/แก้ไข/ประกาศใช้/อนุมัติ/จัดการระบบ)
- ภาพรวม (dashboard): สถิติ, สัดส่วนสถานะ, ประกาศใช้ตามปี, รอรับทราบ, ประกาศใช้ล่าสุด
- ทะเบียนเอกสาร: ค้นหา, กรอง (งาน/ประเภท/หมวด/หมวดย่อย/สถานะ), เรียงลำดับ, แบ่งหน้า
- รายละเอียดเอกสาร: วงจรเอกสาร, ไฟล์แนบ (PDF/Word/Excel/URL), ประวัติการแก้ไข, ความคืบหน้าการรับทราบ
- การดำเนินการ: ลงทะเบียน · บันทึกแก้ไข (เพิ่มเวอร์ชัน) · ประกาศใช้ · ยกเลิกใช้ · รับทราบ · แนบไฟล์/ลิงก์
- จัดการผู้ใช้ (เฉพาะผู้ดูแลระบบ): เพิ่มบัญชี, กำหนดบทบาท/งานสังกัด, ตั้งรหัสผ่าน, เปิด/ปิดใช้งาน
- บันทึกการตรวจสอบ (audit log): หน้า `/admin/audit` ดูประวัติการกระทำทั้งหมด กรองตามชนิดได้ (ISO 15189 traceability)
- ส่งออกทะเบียนเป็น Excel (CSV UTF-8): ปุ่ม "ส่งออก Excel" ในหน้าทะเบียน ส่งออกตามตัวกรองปัจจุบัน
- บัญชีของฉัน (`/account`): ผู้ใช้เปลี่ยนรหัสผ่านตนเองได้ (ยืนยันรหัสผ่านเดิม)

## รันบนเครื่อง (Local development)

```bash
# 1. ฐานข้อมูล PostgreSQL (ตัวอย่างใช้ Docker)
docker run -d --name masterlist-db \
  -e POSTGRES_USER=masterlist -e POSTGRES_PASSWORD=masterlist_dev \
  -e POSTGRES_DB=masterlist -p 5433:5432 postgres:17-alpine

# 2. ตั้งค่า env
cp .env.example .env      # แล้วแก้ DATABASE_URL, SESSION_SECRET

# 3. ติดตั้ง + สร้างตาราง + seed
npm install
npx prisma migrate deploy
npm run db:seed           # SEED_DEMO=1 จะใส่เอกสารตัวอย่าง 105 ฉบับ

# 4. รัน
npm run dev               # http://localhost:3000
```

บัญชีเริ่มต้นหลัง seed:

| บัญชี | รหัสผ่าน | บทบาท |
|-------|----------|-------|
| `admin` | `admin1234` | ผู้ดูแลระบบ |
| `head.work` | `demo1234` | หัวหน้างาน |
| `head.cat` | `demo1234` | หัวหน้าหมวดงาน |
| `medtech` | `demo1234` | นักเทคนิคการแพทย์ |
| `assistant` | `demo1234` | ผู้ช่วยนักเทคนิคการแพทย์ |
| `admin.staff` | `demo1234` | เจ้าหน้าที่ธุรการ |

> ⚠️ เปลี่ยนรหัสผ่านทั้งหมดก่อนใช้งานจริง และตั้ง `SEED_DEMO=0` สำหรับฐานข้อมูลจริง

## Deploy — ดูรายละเอียดที่ [DEPLOY.md](./DEPLOY.md)

- **On-premise (เซิร์ฟเวอร์ รพ.)**: `docker compose up -d --build`
- **Cloud**: Vercel + Postgres แบบ managed (Neon/Supabase) + object storage

## โครงสร้างโค้ด

```
prisma/
  schema.prisma         # โครงสร้างฐานข้อมูล
  seed.ts, seed-docs.ts # ข้อมูลอ้างอิง + เอกสารตัวอย่าง
src/
  app/
    login/              # หน้าเข้าสู่ระบบ
    (app)/              # ส่วนที่ต้องเข้าสู่ระบบ (dashboard, masterlist, documents, guide, admin)
    actions/            # Server Actions (auth, documents, users)
    api/files/[id]/     # เสิร์ฟไฟล์แนบแบบตรวจสิทธิ์
  components/           # Header, Modal, filters, ตัวจัดการเอกสาร/ผู้ใช้
  lib/                  # db, auth, session, reference (ข้อมูลอ้างอิง), storage, documents
  proxy.ts             # ป้องกันเส้นทาง (redirect ไป /login ถ้ายังไม่เข้าสู่ระบบ)
```
