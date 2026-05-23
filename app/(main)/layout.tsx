import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

// 👇 อัปเดต: เพิ่ม icons สำหรับใส่โลโก้บนแท็บเบราว์เซอร์ 👇
export const metadata: Metadata = {
  title: "KIN YARK - Ingredients", 
  description: "ค้นหาสูตรอาหารและแนะนำเมนูเด็ดโดนใจคุณ", 
  icons: {
    icon: "/photo/logoweb.png", // ชี้ไปที่ไฟล์รูปโลโก้ในโฟลเดอร์ public
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}