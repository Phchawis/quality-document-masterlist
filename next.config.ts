import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle for the Docker image.
  output: "standalone",
  experimental: {
    /* คำขออัปโหลดต้องผ่าน 2 ด่านที่จำกัดขนาดคนละตัว ต้องตั้งให้ผ่านทั้งคู่
       ไม่งั้นไฟล์ถูกตัดกลางทางแล้วขึ้น "A server error occurred" ลอย ๆ

       1) serverActions.bodySizeLimit — ด่านของ Server Action (default 1MB)
       2) proxyClientMaxBodySize — ด่านของ proxy.ts (default 10MB)
          ตัวนี้เคยไม่ได้ตั้ง ไฟล์เกิน 10MB จึงแนบไม่ได้เลยมาตลอด
          ทั้งที่ด่านแรกตั้งไว้ 50MB แล้ว

       ตั้งไว้สูงกว่าขนาดไฟล์สูงสุด (50MB ใน src/lib/file-types.ts) เผื่อ
       ส่วนหัวของ multipart — เพื่อให้ไฟล์ที่ใหญ่เกินไปตกที่การตรวจของแอปเอง
       แล้วผู้ใช้ได้ข้อความไทยที่บอกสาเหตุ แทนที่จะเจอ error 500 เปล่า ๆ */
    serverActions: { bodySizeLimit: "55mb" },
    proxyClientMaxBodySize: "55mb",
  },
};

export default nextConfig;
