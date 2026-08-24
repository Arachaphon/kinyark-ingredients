// src/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

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

import { SWRProvider } from "@/components/SWRProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <SWRProvider>
          <AuthProvider>{children}</AuthProvider>
        </SWRProvider>
      </body>
    </html>
  );
}