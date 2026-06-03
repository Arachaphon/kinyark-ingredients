// src/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🌟 ปรับปรุง Metadata เพิ่มตัวช่วยล็อกไอคอนเพื่อไม่ให้เบราว์เซอร์จำเอ๋อครับ
export const metadata: Metadata = {
  title: "KINYARK - Ingredients", 
  description: "ค้นหาสูตรอาหารและแนะนำเมนูเด็ดโดนใจคุณ", 
  icons: {
    icon: "/photo/logoweb.png",
    shortcut: "/photo/logoweb.png", // 🔥 เพิ่มตัวนี้เข้าไปเพื่อช่วยบังคับเบราว์เซอร์ให้โหลดรูปใหม่ครับ
    apple: "/photo/logoweb.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ส่วนนี้คือเนื้อหาของแต่ละหน้า (เช่น Login, Register, Home) จะมาแสดงตรงนี้ */}
        {children}
      </body>
    </html>
  );
}