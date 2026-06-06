import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Footer from "@/components/footer"; 

const inter = Inter({ subsets: ["latin"] });

// 🌟 พอนำ "use client" ออกแล้ว metadata ชุดนี้จะทำงานได้ถูกต้อง 100% ครับ
export const metadata: Metadata = {
  title: "KINYARK - Ingredients", 
  description: "ค้นหาสูตรอาหารและแนะนำเมนูเด็ดโดนใจคุณ", 
  icons: {
    icon: "/photo/logoweb.png", 
  },
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${inter.className} flex flex-col min-h-screen`}>
      
      <main className="flex-grow">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}