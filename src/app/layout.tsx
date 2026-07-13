import type { Metadata } from "next";
import { Sarabun, Anuphan, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});
const anuphan = Anuphan({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-anuphan",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ทะเบียนเอกสารคุณภาพ · ฝ่ายสหเวชศาสตร์",
  description: "ระบบทะเบียนควบคุมเอกสารคุณภาพห้องปฏิบัติการ ตามมาตรฐาน ISO 15189:2022",
};

// Set the theme before paint to avoid a flash of the wrong palette.
const themeScript = `(function(){try{var t=localStorage.getItem('ml-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${sarabun.variable} ${anuphan.variable} ${plexMono.variable}`}>{children}</body>
    </html>
  );
}
