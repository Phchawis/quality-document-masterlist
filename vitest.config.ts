import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // `output: "standalone"` คัดลอกซอร์สทั้งชุดไปไว้ใน .next/standalone ตอน build
    // ถ้าไม่กันไว้ vitest จะเก็บไฟล์เทสต์ที่ถูกคัดลอกไปด้วย แล้วรันซ้ำสองรอบ
    exclude: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
  },
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
});
