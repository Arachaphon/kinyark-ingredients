# 🍳 Kin Yark (กินยาก) - Ingredients-Based Recipe Platform

โปรเจกต์รายวิชา **Back-End Software Development** และ **Software Development Operation** พัฒนาโดยกลุ่ม **The Nexus** สาขาวิศวกรรมซอฟต์แวร์ มหาวิทยาลัยพะเยา | ปีการศึกษา 2568

เว็บไซต์คอมมูนิตี้และเครื่องมือช่วยค้นหาสูตรอาหารอัจฉริยะ ที่ช่วยเปลี่ยนวัตถุดิบเหลือใช้ในตู้เย็นของคุณให้กลายเป็นเมนูจานโปรด ด้วยระบบจับคู่และคัดสรรส่วนผสม พร้อมพลังขับเคลื่อนการแนะนำเมนูจาก AI   และคอมมูนิตี้ผู้ใช้งาน

---

## 💡 ที่มา (Inspiration)
หลายครั้งที่ผู้คนเปิดตู้เย็นมาแล้วพบกับวัตถุดิบที่หลากหลายแต่ไม่รู้จะปรุงเป็นเมนูอะไรดี หรือบางครั้งข้อจำกัดด้านสุขภาพ เช่น อาการแพ้อาหาร หรือการเลือกทานอาหารเฉพาะกลุ่ม (เช่น มังสวิรัติ, ฮาลาล) ก็ทำให้การตัดสินใจเลือกเมนูในแต่ละวันกลายเป็นเรื่องยาก

กลุ่ม **The Nexus** จึงได้พัฒนาเว็บไซต์ **"Kin Yark"** ขึ้นมา เพื่อช่วยแก้ปัญหาเหล่านี้ด้วยเทคโนโลยีดิจิทัล เปลี่ยนขั้นตอนการคิดเมนูให้เป็นเรื่องง่าย สนุก  และลดการเหลือทิ้งของวัตถุดิบ (Zero Food Waste)

---

## 🎯 วัตถุประสงค์ (Objectives)
- **Smart Ingredient Matching:** ช่วยให้ผู้ใช้เลือกวัตถุดิบที่มีอยู่ (เนื้อสัตว์, ผัก, ผลไม้, อาหารทะเล) มาจับคู่ค้นหาสูตรอาหารที่ทำได้จริงทันที
- **AI & Community Synergy:** รวบรวมและแนะนำสูตรอาหารทั้งจากผู้ใช้งานในระบบ และสูตรแนะนำอัจฉริยะประจำวันจาก AI (Gemini & DeepSeek)
- **Hyper-Personalization:** คัดกรองและปรับแต่งสูตรอาหารให้ตรงกับรสนิยมและข้อจำกัดทางร่างกายของผู้ใช้ เช่น อาการแพ้อาหาร หรือประเภทของไดเอท
- **High Reliability (DevOps):** ตัวระบบมีการทำ Automated E2E Testing เพื่อตรวจสอบความถูกต้องของระบบยืนยันตัวตนและการทำงานก่อนส่งมอบงานจริง 

---  

## 🌐 Demo
🔗 [ทดลองใช้งานระบบ Kin Yark](https://thenexus-chi.vercel.app/)

---
## 🛠️ Frontend GitHub & GitLab
🔗 [GitHub Frontend Repo](https://github.com/Arachaphon/backend-nexus.git)
🔗 [GitLab Frontend Repo](https://gitlab.com/thenexus1/frontend-nexus.git)

## 🛠️ Backend GitHub & GitLab
🔗 [GitHub Backend Repo](https://github.com/Arachaphon/backend-nexus.git)
🔗 [GitLab Backend Repo](https://gitlab.com/thenexus1/backend-nexus.git)

---

## 🛠️ Tech Stack (Tools)
- **Next.js (App Router)** – Framework ตัวหลักในการพัฒนาฝั่ง Frontend และรองรับการทำ Full-stack API Routes
- **Tailwind CSS v4** – สำหรับการเขียน Utility-First CSS ยุคใหม่ ดีไซน์หน้าเว็บให้ยืดหยุ่น (Responsive Design) และโหลดสไตล์ได้รวดเร็ว
- **TypeScript** – เพื่อเพิ่มประสิทธิภาพในการจัดการโครงสร้างข้อมูล พัฒนาโค้ดได้แม่นยำและลดข้อผิดพลาด
- **Playwright** – เครื่องมือในการทำ Automated End-to-End (E2E) Testing เพื่อจำลองการกดทดสอบระบบสมัครสมาชิกและล็อกอินโดยอัตโนมัติ
- **Cloudflare D1** – Serverless SQLite database สำหรับการจัดการฐานข้อมูลส่วนหลังอย่างรวดเร็ว

---

## ✨ ฟีเจอร์หลัก (Key Features)

| Frontend | Backend / QA | Feature Name | Description |
| :---: | :---: | :--- | :--- |
| ✅ | ✅ | **Smart Ingredient Search** | ระบบเลือกวัตถุดิบคัดแยกตามหมวดหมู่ทั่วมุมโลก ล็อกขนาดความสูงเลื่อนหาได้ พร้อมช่องค้นหาและระบบจดจำประวัติ |
| ✅ | ✅ | **AI & Community Feed** | หน้ารวมโพสต์ฟีดเมนูอาหาร แสดงสูตร วิธีทำ และรองรับคาร์รูเซลเมนูแนะนำประจำวันจากบอท AI |
| ✅ | ✅ | **Dynamic Comment System** | ระบบเปิด-ปิดกล่องคอมเมนต์ย่อยใต้โพสต์ สามารถส่งคอมเมนต์ ให้คะแนนดาว และกดตอบกลับ (Reply) ได้ |
| ✅ | ✅ | **Popup Setting Modal** | หน้าต่างตั้งค่าส่วนกลาง ปรับแต่งข้อมูลโปรไฟล์ เลือกประเภทการกิน (Vegetarian/Halal) ระบุอาการแพ้ และเปิด-ปิดระบบ AI ประจำตัว |
| ❌ | ✅ | **E2E Automated Test** | สคริปต์สั่งบอทเปิดหน้าจอจำลองการกรอกฟอร์มเข้าใช้งานระบบหน้า Login & Register เพื่อความเสถียรของแอปพลิเคชัน |

---

## 📝 บทบาทผู้ใช้งาน (User Capabilities)

| บทบาท | คำอธิบาย |
| :--- | :--- |
| **Guest / User** | สามารถดูฟีดเมนูทั่วไป และเลือกกดค้นหาเมนูจากวัตถุดิบที่มีอยู่ในตู้เย็นได้ |
| **Member** | สามารถกดเพิ่มโพสต์สูตรอาหารของตัวเอง, แสดงความคิดเห็น, กดหัวใจบันทึกเมนูโปรด (Favorites) และตั้งค่า AI ส่วนบุคคลได้ |
| **AI Engine (Gemini / DeepSeek)** | ระบบจำลองการปรุงสูตรอาหารแนะนำแบบเรียลไทม์ส่งมานำเสนอให้ผู้ใช้ในทุกๆ วันตามประวัติความชอบของผู้ใช้นั้นๆ |

---

## 👨‍💻 ทีมผู้พัฒนา (The Team)

| รหัสนิสิต | ชื่อ-นามสกุล | บทบาทหน้าที่ในโปรเจกต์นี้ |
| :---: | :--- | :--- |
| **67022535** | Karunyaphat Kanthanate | UX/UI Design & Frontend Developer (Component & Theme Style Design) |
| **67022748** | Peerapat Sawaengram | Project Coordinator & Frontend Developer (State Management & Navigation Dynamic Link) |
| **67023031** | Arachaphon Klinchuen | Backend Developer & QA Automation (API Routes, Local Search Engine & Playwright Testing) |

---

## 📞 ติดต่อสอบถาม
หากมีคำถามหรือข้อเสนอแนะเกี่ยวกับโปรเจกต์ สามารถติดต่อได้ที่:
- **E-mail:** 67022748@up.ac.th
- **Phone:** 082-181-9636
