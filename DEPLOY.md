# คู่มือ Deploy

รองรับ 2 แนวทาง เลือกตามนโยบายของโรงพยาบาล

---

## ตัวเลือก A · On-premise (แนะนำสำหรับข้อมูลที่ต้องอยู่ในองค์กร)

รันทั้งแอปและฐานข้อมูลบนเซิร์ฟเวอร์ของโรงพยาบาลด้วย Docker Compose ข้อมูลและไฟล์แนบทั้งหมดอยู่ในองค์กร

### ขั้นตอน

```bash
# 1. เตรียมค่า secret
cp .env.example .env
```

แก้ไฟล์ `.env` อย่างน้อย:

```env
SESSION_SECRET="<ใส่ค่าที่สุ่มมา: openssl rand -base64 32>"
DB_PASSWORD="<รหัสผ่านฐานข้อมูลที่ปลอดภัย>"
ADMIN_PASSWORD="<รหัสผ่าน admin ครั้งแรก>"
SEED_DEMO="0"          # 0 = ไม่ใส่เอกสารตัวอย่าง
SEED_ON_START="1"      # 1 = seed อัตโนมัติในรันครั้งแรก (สร้าง admin) — ตั้งกลับเป็น 0 หลังรันครั้งแรก
```

```bash
# 2. build + รัน (migrate ฐานข้อมูลอัตโนมัติผ่าน entrypoint)
docker compose up -d --build

# 3. ดู log
docker compose logs -f app

# เปิดใช้งานที่ http://<เซิร์ฟเวอร์>:3000
```

หลังรันครั้งแรกสำเร็จ ให้ตั้ง `SEED_ON_START=0` แล้ว `docker compose up -d` อีกครั้ง เพื่อไม่ให้ seed ซ้ำ

### สิ่งที่ต้องเตรียมสำหรับ production

- **HTTPS**: วาง reverse proxy (Nginx / Caddy / Traefik) หน้าแอป พอร์ต 3000 แล้วเปิด TLS — cookie session ตั้ง `secure` อัตโนมัติเมื่อ `NODE_ENV=production`
- **สำรองข้อมูล**: สำรอง volume `pgdata` (ฐานข้อมูล) และ `uploads` (ไฟล์แนบ) เป็นประจำ
  ```bash
  docker compose exec db pg_dump -U masterlist masterlist > backup_$(date +%F).sql
  docker run --rm -v masterlist_uploads:/u -v $(pwd):/b alpine tar czf /b/uploads_$(date +%F).tgz -C /u .
  ```
- **อัปเดตแอป**: `git pull && docker compose up -d --build` (migration รันอัตโนมัติ)

---

## ตัวเลือก B · Cloud (Vercel + Managed Postgres)

เหมาะเมื่อไม่ต้องการดูแลเซิร์ฟเวอร์เอง

### 1. ฐานข้อมูล
สร้าง PostgreSQL แบบ managed (เช่น **Neon** หรือ **Supabase**) แล้วคัดลอก connection string

### 2. Deploy แอปบน Vercel
- เชื่อม repository นี้เข้ากับ Vercel (root = โฟลเดอร์ `webapp`)
- ตั้ง Environment Variables:
  | ตัวแปร | ค่า |
  |--------|-----|
  | `DATABASE_URL` | connection string จากผู้ให้บริการ Postgres |
  | `SESSION_SECRET` | `openssl rand -base64 32` |
  | `UPLOAD_DIR` | ดูหมายเหตุไฟล์แนบด้านล่าง |
  | `SEED_DEMO` | `0` |

- รัน migration + seed ครั้งแรก (จากเครื่องที่ตั้ง `DATABASE_URL` ชี้ไป cloud):
  ```bash
  npx prisma migrate deploy
  SEED_DEMO=0 npm run db:seed      # สร้าง admin + ข้อมูลอ้างอิง
  ```

### ⚠️ หมายเหตุเรื่องไฟล์แนบบน Vercel
Vercel เป็น serverless — ระบบไฟล์ **ไม่คงอยู่** (ไฟล์ที่อัปโหลดจะหายเมื่อ redeploy) หากใช้ cloud ต้องเปลี่ยนที่เก็บไฟล์เป็น object storage:

- เพิ่ม S3-compatible storage (AWS S3 / Cloudflare R2 / Supabase Storage)
- แก้ `src/lib/storage.ts` ให้ `saveUpload/readStored/deleteStored` อ่าน-เขียนผ่าน SDK ของ storage แทน `fs`
- ส่วนอื่นของแอป (schema, actions, route เสิร์ฟไฟล์) ไม่ต้องแก้ เพราะแยก logic การเก็บไฟล์ไว้ที่ `storage.ts` ไฟล์เดียว

> On-premise (ตัวเลือก A) ไม่มีปัญหานี้ เพราะเก็บไฟล์ลง Docker volume ที่คงอยู่

---

## รองรับสเกล (2,000+ เอกสาร · 150+ ผู้ใช้)

ออกแบบมาให้รองรับได้สบายด้วย PostgreSQL:

- **Index**: มี index บนคอลัมน์ที่ใช้กรอง/เรียง (`workId + categoryCode + status`, `typeCode`, `status + effectiveAt`, `code` unique) — การค้นหาและกรองยังเร็วแม้มีหลายพันฉบับ
- **Pagination**: ทะเบียนโหลดทีละ 24 แถว (`skip/take`) ไม่ดึงทั้งหมด — เปิดหน้าเร็วคงที่
- **สถิติ dashboard**: ใช้ `groupBy`/`count` ที่ฐานข้อมูล ไม่โหลดเอกสารมานับใน memory
- **ไฟล์แนบ**: เสิร์ฟแบบ stream ผ่าน route ที่ตรวจสิทธิ์ เปิดดู/ดาวน์โหลด/พิมพ์ได้ทันที
- **การรับทราบ**: unique ต่อ (เอกสาร, ผู้ใช้) กันบันทึกซ้ำ

คำแนะนำเมื่อผู้ใช้พร้อมกันจำนวนมาก:
- ตั้ง PostgreSQL ให้มี connection pool เพียงพอ (เช่น PgBouncer) — Prisma ต่อผ่าน `DATABASE_URL`
- แอปเป็น stateless ขยายจำนวน instance ได้ (session อยู่ใน cookie ไม่ผูกกับเครื่อง) โดยแชร์ฐานข้อมูลและที่เก็บไฟล์ร่วมกัน

## ตัวแปรสภาพแวดล้อมทั้งหมด

| ตัวแปร | จำเป็น | คำอธิบาย |
|--------|--------|----------|
| `DATABASE_URL` | ✓ | connection string ของ PostgreSQL |
| `SESSION_SECRET` | ✓ | คีย์ลงนาม session (`openssl rand -base64 32`) |
| `UPLOAD_DIR` | ✓ | โฟลเดอร์เก็บไฟล์แนบ (ใน Docker = `/app/uploads` ผูก volume) |
| `ADMIN_PASSWORD` | – | รหัสผ่าน admin ตอน seed (ค่าเริ่มต้น `admin1234`) |
| `SEED_DEMO` | – | `1` ใส่เอกสารตัวอย่าง 105 ฉบับ, `0` เฉพาะข้อมูลอ้างอิง + admin |
| `SEED_ON_START` | – | (Docker) `1` seed อัตโนมัติในรันครั้งแรก |
