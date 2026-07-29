"use client";

import React, { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Anuphan } from "next/font/google";

// =========================================
// 🔤 ตั้งค่าฟอนต์ Anuphan
// =========================================
const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

// =========================================
// ⏱️ Custom Hook สำหรับ Debounce (หน่วงเวลา 300ms)
// =========================================
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// =========================================
// 🍱 ข้อมูลจำลองวัตถุดิบแบบครอบคลุมทั่วโลก (Global Expanded Mock Data)
// =========================================
const categoriesData = [
  {
    id: "Meat",
    name: "เนื้อสัตว์",
    emoji: "🥩",
    ingredients: [
      "ไก่", "หมู", "เนื้อวัว", "เนื้อแกะ", "เป็ด", "ไก่งวง", "เบคอน", "แฮม", "ไส้กรอก",
      "เนื้อกวาง", "เนื้อลูกวัว", "เนื้อแพะ", "เปปเปอโรนี", "ซาลามี", "พรอสชุตโต", "นกกระทา",
      "ห่าน", "วากิวบีฟ", "หมูสับ", "เนื้อสับ", "สามชั้น", "เนื้อจระเข้", "นกกระจอกเทศ",
      "หมูกรอบ", "หมูแดง", "แคบหมู", "ซี่โครงหมู", "ตับหมู", "เครื่องในไก่", "เลือดหมู", 
      "เลือดไก่", "กุนเชียง", "หมูยอ", "แหนม", "ไส้อั่ว", "นกพิราบ", "กบ", "คอหมูย่าง", "ไก่ย่าง",
      "โชริโซ่ (Chorizo)", "แฮมอิเบอริโก (Ibérico Ham)", "คอร์นบีฟ (Corned Beef)", 
      "สแปม (Spam)", "บราตววสท์ (Bratwurst)", "พาสตรามี (Pastrami)", "เนื้อนกกระจอกเทศ", 
      "กระต่าย", "ไก่งวงบด", "เนื้อจิงโจ้", "เนื้อแกะสับ", "ไส้กรอกเลือด (Blood Sausage)",
      "แฮมปาร์มา (Parma Ham)", "กึ๋นไก่", "หัวใจไก่", "เนื้อแก้มวัว", "หางวัว", "ลิ้นวัว"
    ]
  },
  {
    id: "Kitchen Tools",
    name: "อุปกรณ์ทำครัว",
    emoji: "🍳",
    ingredients: [
      "กระทะ", "หม้อ", "เตาอบ", "เครื่องปั่น", "แอร์ฟรายเออร์", "มีด", "ไมโครเวฟ", "เครื่องปิ้งขนมปัง",
      "ตะกร้อ", "กระต่ายขูด", "ที่ปอกเปลือก", "เขียงหั่น", "ถ้วยตวง", "พาย",
      "คีม", "ไม้นวดแป้ง", "หม้อหุงข้าว", "เครื่องประมวลผลอาหาร", "เครื่องผสม", "กระชอน",
      "ตะหลิว", "ทัพพี", "กระบวย", "ครก", "สาก", "ที่บดกระเทียม", "กรรไกรทำครัว", "ถาดอบ", 
      "กระดาษไข", "ฟอยล์ห่ออาหาร", "เครื่องทำพาสต้า", "กระทะปิ้งย่าง", "เครื่องชงกาแฟ", 
      "เครื่องคั้นน้ำผลไม้", "ตาชั่งอาหาร", "ที่เปิดขวด", "ที่เปิดกระป๋อง", "ปิ่นโต", "ถุงซีลสุญญากาศ",
      "ไม้เสียบลูกชิ้น", "พิมพ์อบขนม", "เครื่องนวดแป้ง", "เทอร์โมมิเตอร์อาหาร", "ที่คีบน้ำแข็ง",
      "กระทะเหล็กหล่อ (Cast Iron)", "กระทะวอค (Wok)", "หม้อดินเผา", "หม้อทาจีน (Tagine)",
      "ซึ้งนึ่งไม้ไผ่", "ที่กดตอร์ติญ่า (Tortilla Press)", "กระทะปาเอย่า (Paella Pan)", 
      "แมนโดลินสไลเดอร์", "ที่ปั่นฟองนม", "ถุงบีบครีม", "หัวบีบครีม", "ตะแกรงร่อนแป้ง",
      "เครื่องบดเมล็ดกาแฟ", "เครื่องปั่นแบบมือถือ (Hand Blender)", "หม้ออัดแรงดัน", "ซูวี (Sous-vide)"
    ]
  },
  {
    id: "Fruits",
    name: "ผลไม้",
    emoji: "🥗",
    ingredients: [
      "แอปเปิ้ล", "กล้วย", "ส้ม", "สตรอว์เบอร์รี", "องุ่น", "แตงโม", "มะม่วง",
      "สับปะรด", "กีวี", "บลูเบอร์รี", "ราสพ์เบอร์รี", "แบล็คเบอร์รี", "พีช", "สาลี่",
      "พลัม", "เชอร์รี", "มะนาวเหลือง", "มะนาวเขียว", "มะพร้าว", "อะโวคาโด", "ทับทิม",
      "มะเดื่อ", "มะละกอ", "แก้วมังกร", "ทุเรียน", "ลิ้นจี่", "เมลอน", "แคนตาลูป", "ส้มโอ",
      "มังคุด", "เงาะ", "ลองกอง", "ลางสาด", "มะขาม", "มะขามเปียก", "กระท้อน", "พุทรา",
      "มะยม", "ชมพู่", "สละ", "ระกำ", "ลูกพลับ", "อินทผลัม", "แครนเบอร์รี", "เสาวรส", "มัลเบอร์รี",
      "เกรปฟรุต", "ส้มแมนดาริน", "ส้มยูซุ", "กล้วยกล้าย (Plantain)", "ผลมะกอกสด", 
      "ขนุน", "ลูกท้อ", "เชอริโมยา (Cherimoya)", "สาเก (Breadfruit)", "มะเฟือง", 
      "กัววา", "แบล็กเคอแรนต์", "กูสเบอร์รี", "เอลเดอร์เบอร์รี", "อาซาอิเบอร์รี (Acai)"
    ]
  },
  {
    id: "Seafood",
    name: "อาหารทะเล",
    emoji: "🦞",
    ingredients: [
      "กุ้ง", "ปู", "แซลมอน", "ปลาหมึก", "หอยแมลงภู่", "กุ้งมังกร", "ปลาหมึกยักษ์", "หอยลาย",
      "หอยนางรม", "ปลาทูน่า", "ปลาคอด", "ปลาเทราต์", "ปลาแมคเคอเรล", "ปลากะพง", "ปลาซาร์ดีน",
      "หอยเชลล์", "เม่นทะเล (อูนิ)", "ปลาไหล (อูนางิ)", "คาเวียร์", "สาหร่าย", "แมงกะพรุน",
      "ปูม้า", "ปูทะเล", "ปูอัด", "กุ้งขาว", "กุ้งกุลาดำ", "กุ้งแม่น้ำ", "ปลาหมึกกล้วย", 
      "ปลาหมึกกระดอง", "หอยแครง", "หอยหลอด", "หอยหวาน", "ปลากะพงขาว", "ปลากะพงแดง", 
      "ปลาเก๋า", "ปลาอินทรี", "ปลาช่อนทะเล", "ไข่ปลาหมึก", "ปลิงทะเล", "หูฉลาม",
      "ปลาฮาลิบัต (Halibut)", "ปลามาฮิมาฮิ (Mahi-Mahi)", "ปลาแองโชวี่", "ปลาสเตอร์เจียน", 
      "หอยเป๋าฮื้อ (Abalone)", "ครอว์ฟิช (Crawfish)", "หอยสังข์ (Conch)", "ปลากระเบน",
      "ปลาหิมะ", "ปลาดอรี่", "ปลาทู", "ปลาดุกทะเล", "กั้ง", "ไข่หอยเม่น"
    ]
  },
  {
    id: "Vegetables",
    name: "ผัก",
    emoji: "🥦",
    ingredients: [
      "มะเขือเทศ", "หัวหอม", "กระเทียม", "แครอท", "มันฝรั่ง", "กะหล่ำปลี", "บรอกโคลี",
      "ผักโขม", "ผักกาดหอม", "แตงกวา", "พริกหยวก", "พริก", "เห็ด",
      "ขิง", "ตะไคร้", "หน่อไม้ฝรั่ง", "ซูกินี", "มะเขือยาว", "ข้าวโพด", "ถั่วลันเตา",
      "กะหล่ำดอก", "ขึ้นฉ่าย", "เคล", "ฟักทอง", "มันเทศ", "หัวไชเท้า", "ผักกวางตุ้ง", "บีทรูท",
      "กะเพรา", "โหระพา", "แมงลัก", "สะระแหน่", "ผักชีฝรั่ง", "ผักชีลาว", "ชะอม", "กะหล่ำปลีม่วง", 
      "ถั่วงอก", "บวบ", "ฟักเขียว", "แตงกวาญี่ปุ่น", "มะระ", "มะระขี้นก", "ตำลึง", "ผักบุ้ง", 
      "ผักกระเฉด", "ดอกแค", "หัวปลี", "กระชาย", "ขมิ้น", "ใบเตย", "ชะพลู", "ผักหวาน", "หน่อไม้", 
      "เห็ดเข็มทอง", "เห็ดหอม", "เห็ดฟาง", "เห็ดออรินจิ", "เผือก", "แห้ว", "รากบัว", "ถั่วฝักยาว",
      "อาร์ติโชค (Artichoke)", "เฟนเนล (Fennel)", "มันสำปะหลัง (Cassava)", "กระเจี๊ยบเขียว (Okra)", 
      "โทมาทิลโล (Tomatillo)", "เอนไดฟ์ (Endive)", "พาร์สนิป (Parsnip)", "เบบี้แครอท", 
      "หัวไชเท้าญี่ปุ่น (Daikon)", "บ็อกฉ่อย (Bok Choy)", "กระเทียมต้น (Leek)", "พริกฮาลาปินโญ",
      "เห็ดแชมปิญอง", "เห็ดทรัฟเฟิล", "เห็ดชิเมจิ", "เห็ดไมตาเกะ", "มะกอกดำ", "มะกอกเขียว"
    ]
  },
  {
    id: "Carbs",
    name: "ข้าวเส้นและแป้ง",
    emoji: "🍚",
    ingredients: [
      "ข้าวหอมมะลิ", "ข้าวกล้อง", "ข้าวบาสมาติ", "ข้าวไรซ์เบอร์รี", "เส้นสปาเกตตี", 
      "มักกะโรนี", "เส้นเพนเน", "เส้นหมี่", "เส้นใหญ่", "เส้นเล็ก", "วุ้นเส้น", 
      "แป้งสาลีเอนกประสงค์", "แป้งข้าวโพด", "แป้งมันสำปะหลัง", "ขนมปังแผ่น", 
      "ขนมปังฝรั่งเศส", "แป้งตอร์ติญ่า", "ข้าวโอ๊ต", "ควินัว", "บะหมี่กึ่งสำเร็จรูป", 
      "อุด้ง", "โซบะ", "ราเมน", "แป้งข้าวเจ้า", "แป้งอัลมอนด์", "แป้งเค้ก", "แป้งขนมปัง",
      "แป้งพาย", "ฟูซิลลี", "ฟาร์ฟาเล", "วุ้นเส้นญี่ปุ่น (ชิราตากิ)", "เส้นบุก", "ข้าวเหนียว",
      "ข้าวญี่ปุ่น", "ข้าว กข43", "เส้นขนมจีน", "แป้งพิซซ่า", "คอร์นเฟลก", "กราโนล่า", 
      "ขนมปังโฮลวีต", "แป้งแพนเค้ก", "เส้นก๋วยจั๊บ", "แผ่นเกี๊ยว", "แผ่นปอเปี๊ยะ",
      "คูสคูส (Couscous)", "โพเลนต้า (Polenta)", "ย็อกกี (Gnocchi)", "ออร์โซ (Orzo)", 
      "บูลกูร์ (Bulgur)", "ฟาร์โร (Farro)", "แป้งบัควีต", "แป้งไรย์", "ขนมปังพิต้า", 
      "แป้งนาน (Naan)", "แป้งโรตี", "ขนมปังเซียบัตต้า (Ciabatta)", "เบเกิล (Bagel)", 
      "ครัวซองต์", "แป้งเทมปุระ", "เส้นพาสต้าหมึกดำ", "ข้าวป่า (Wild Rice)", "ทาปิโอก้า (Tapioca)"
    ]
  },
  {
    id: "Dairy and Eggs",
    name: "ไข่และผลิตภัณฑ์จากนม",
    emoji: "🥚",
    ingredients: [
      "ไข่ไก่", "ไข่เป็ด", "ไข่นกกระทา", "ไข่เยี่ยวม้า", "ไข่เค็ม", "นมวัว", 
      "นมแพะ", "นมถั่วเหลือง", "นมอัลมอนด์", "นมข้าวโอ๊ต", "เนยจืด", "เนยเค็ม", 
      "วิปปิ้งครีม", "ครีมชีส", "เชดดาร์ชีส", "มอสซาเรลลาชีส", "พาร์เมซานชีส", 
      "โยเกิร์ต", "กรีกโยเกิร์ต", "นมข้นหวาน", "นมข้นจืด", "ซาวร์ครีม", "บลูชีส",
      "นมผง", "เวย์โปรตีน", "ชีสสวิส", "ชีสเกาดา", "บรีชีส", "คอตเทจชีส", "มาสคาร์โปนชีส",
      "ริคอตต้าชีส", "นมพิสตาชิโอ", "นมมะพร้าว", "กี (Ghee)", "นมพาสเจอร์ไรส์", "นม UHT",
      "ไอศกรีมวานิลลา", "คัสตาร์ด", "ไข่ปลา", "เฟต้าชีส (Feta)", "ฮาลูมีชีส (Halloumi)", 
      "คาม็องแบร์ (Camembert)", "มันเชโก้ชีส (Manchego)", "พรอโวโลน (Provolone)", 
      "บัตเตอร์มิลค์ (Buttermilk)", "คีเฟอร์ (Kefir)", "นกกระจอกเทศ (ไข่)", "นมแมคคาเดเมีย",
      "นมวอลนัท", "วิปครีมวีแกน (Plant-based)", "ครีมเทียม"
    ]
  },
  {
    id: "Condiments and Sauces",
    name: "เครื่องปรุงและซอส",
    emoji: "🧂",
    ingredients: [
      "น้ำปลา", "ซีอิ๊วขาว", "ซีอิ๊วดำ", "ซอสถั่วเหลือง", "ซอสหอยนางรม", 
      "ซอสมะเขือเทศ", "ซอสพริก", "มายองเนส", "มัสตาร์ด", "ซอสบาร์บีคิว", 
      "น้ำส้มสายชู", "น้ำส้มสายชูแอปเปิลไซเดอร์", "น้ำตาลทราย", "น้ำตาลปี๊บ", 
      "เกลือ", "ผงชูรส", "เต้าเจี้ยว", "มิโซะ", "โคชูจัง", "น้ำจิ้มสุกี้", 
      "ศรีราชา", "ซอสเทอริยากิ", "ฮอยซินซอส", "บัลซามิก", "ปลาร้า", "กะปิ",
      "น้ำปลาร้า", "ซอสหม่าล่า", "พริกเผา", "น้ำพริกนรก", "น้ำพริกตาแดง", "น้ำจิ้มซีฟู้ด",
      "น้ำจิ้มไก่", "น้ำจิ้มแจ่ว", "ซอสเห็ดหอม", "ซอสทงคัตสึ", "ซอสพอนสึ", "มิริน", "โชยุ",
      "ผงปรุงรสหมู", "ผงปรุงรสไก่", "ซุปก้อน", "แม็กกี้", "จิ๊กโฉ่ว", "น้ำเชื่อมข้าวโพด",
      "นูเทลล่า", "แยมผลไม้", "เนยถั่ว", "ซอสมะขาม", "ซีอิ๊วหวาน",
      "เวจจีไมต์ (Vegemite)", "มาร์ไมต์ (Marmite)", "ทาฮินี (Tahini)", "ทเวนจัง (Doenjang)",
      "ฮาริซา (Harissa)", "ชิมิชูรี (Chimichurri)", "เพสโต้ (Pesto)", "ซอสเอ็กซ์โอ (XO Sauce)",
      "ซัลซ่า (Salsa)", "กัวคาโมเล่ (Guacamole)", "มัสตาร์ดดิจอง", "ซอสทาบาสโก้",
      "ซอสวูสเตอร์ไชร์ (Worcestershire)", "น้ำเชื่อมอะกาเว่", "ไซรัปเมเปิ้ลแท้"
    ]
  },
  {
    id: "Spices and Herbs",
    name: "เครื่องเทศและสมุนไพร",
    emoji: "🌿",
    ingredients: [
      "พริกไทยดำ", "พริกไทยขาว", "พริกป่น", "ผงกะหรี่", "ยี่หร่า", "ออริกาโน", 
      "โรสแมรี่", "ไทม์", "บาซิล (โหระพาฝรั่ง)", "ใบกะเพรา", "ใบโหระพา", "ผักชี", 
      "รากผักชี", "ดอกจันทน์", "อบเชย", "โป๊ยกั๊ก", "กานพลู", "พาร์สลีย์", 
      "ปาปริก้า", "หญ้าฝรั่น (Saffron)", "ใบมะกรูด", "ข่า", "ผงกระเทียม", "ผงหัวหอม",
      "พริกไทยเสฉวน (หม่าล่า)", "เม็ดผักชี", "ลูกกระวาน", "ขมิ้นผง", "พริกแห้ง", 
      "พริกหยวกแห้ง", "ผงปาปริก้าสโมค", "ดอกงิ้ว", "สมุนไพรจีนตุ๋น", "ตังกุย", "เก๋ากี้",
      "เครื่องต้มยำ", "เครื่องแกงเขียวหวาน", "พริกแกงเผ็ด", "พริกแกงส้ม", "พริกแกงมัสมั่น", 
      "พริกแกงพะแนง", "แคปเปอร์ (Capers)", "ผงพะโล้", "ดีปลี",
      "ซูแมค (Sumac)", "ซาตาร์ (Za'atar)", "การัมมาซาลา (Garam Masala)", 
      "ราสเอลฮานุต (Ras el Hanout)", "ชิจิมิโทการาชิ (Shichimi)", "ฝักวานิลลาแท้",
      "ผงมัสตาร์ด", "เมล็ดยี่หร่าดำ (Nigella seeds)", "ใบกระวาน (Bay Leaf)", 
      "พริกคาเยน (Cayenne)", "ทารากอน (Tarragon)", "มาจอแรม (Marjoram)", "กุยช่าย", "เซจ (Sage)"
    ]
  },
  {
    id: "Nuts and Seeds",
    name: "ถั่วและเมล็ดพืช",
    emoji: "🥜",
    ingredients: [
      "อัลมอนด์", "เม็ดมะม่วงหิมพานต์", "วอลนัท", "ถั่วลิสง", "พีแคน", 
      "แมคคาเดเมีย", "พิสตาชิโอ", "ถั่วเหลือง", "ถั่วเขียว", "ถั่วแดง", 
      "ถั่วดำ", "ชิกพี (ถั่วลูกไก่)", "งาขาว", "งาดำ", "เมล็ดเจีย", 
      "เมล็ดแฟลกซ์", "เมล็ดฟักทอง", "เมล็ดทานตะวัน", "เฮเซลนัท", "เกาลัด",
      "ถั่วแปบ", "ถั่วดาวอินคา", "ถั่วปากอ้า", "เมล็ดแตงโม", "ไพน์นัท (Pine nuts)",
      "บราซิลนัท", "ถั่วขาว", "ถั่วเลนทิล", "ลูกเกด", "พุทราจีนแห้ง", "แมงลัก (เมล็ด)",
      "เมล็ดเฮมพ์ (Hemp seeds)", "งาขี้ม่อน", "เมล็ดป๊อปปี้ (Poppy seeds)", 
      "ถั่วแระญี่ปุ่น (Edamame)", "ถั่วพินโต (Pinto beans)", "ถั่วแบล็กอายพี", 
      "ถั่วเนวี (Navy beans)", "โกจิเบอร์รีแห้ง", "แอปริคอตแห้ง", "แครนเบอร์รีแห้ง"
    ]
  },
  {
    id: "Oils and Fats",
    name: "น้ำมันและไขมัน",
    emoji: "🧈",
    ingredients: [
      "น้ำมันพืช", "น้ำมันปาล์ม", "น้ำมันถั่วเหลือง", "น้ำมันมะกอก", "น้ำมันรำข้าว", 
      "น้ำมันดอกทานตะวัน", "น้ำมันงา", "น้ำมันมะพร้าว", "น้ำมันคาโนลา", 
      "น้ำมันอโวคาโด", "เนยขาว (Shortening)", "มันหมู", "เนยเทียม (มาร์การีน)", 
      "น้ำมันเห็ดทรัฟเฟิล", "น้ำมันพริก", "น้ำมันหมู", "ไขมันวัว", "น้ำมันเมล็ดชา",
      "น้ำมันกระเทียมเจียว", "น้ำมันเจียวหอม", "น้ำมันพริกเผา", "น้ำมันเนย", "สเปรดทาขนมปัง",
      "น้ำมันมัสตาร์ด", "น้ำมันถั่วลิสง", "น้ำมันเมล็ดองุ่น (Grapeseed Oil)", 
      "น้ำมันวอลนัท", "มันไก่ (Schmaltz)", "มันวัว (Tallow)", "น้ำมันแฟลกซ์ซีด", 
      "น้ำมันอาร์แกนปรุงอาหาร", "น้ำมันแมคคาเดเมีย"
    ]
  },
  {
    id: "Beverages",
    name: "ของเหลวและเครื่องดื่ม",
    emoji: "🥤",
    ingredients: [
      "น้ำเปล่า", "น้ำแร่", "น้ำโซดา", "กาแฟ", "ชาเขียว", "ชาดำ", "ชาอู่หลง", 
      "น้ำผลไม้", "โคล่า", "เบียร์", "ไวน์แดง", "ไวน์ขาว", "วอดก้า", "รัม", 
      "วิสกี้", "โซจู", "สาเก", "น้ำเชื่อม", "น้ำผึ้ง", "มัทฉะ", "น้ำเชื่อมเมเปิล",
      "สไปรท์", "แฟนต้า", "ชามะนาว", "ชานมไข่มุก", "น้ำเต้าหู้", "น้ำใบบัวบก", 
      "น้ำเก๊กฮวย", "น้ำกระเจี๊ยบ", "น้ำมะตูม", "น้ำลำไย", "นมชมพู", "ชาไทย", 
      "โกโก้ร้อน", "ไมโล", "โอวัลติน", "เอสเปรสโซ", "อเมริกาโน", "ลาเต้", "สมูทตี้",
      "คอมบูชา (Kombucha)", "ควาส (Kvass)", "ออร์ชาตา (Horchata)", "ชามาเต (Mate)", 
      "ชารอยบอส (Rooibos)", "เบียร์ดำ (Stout)", "ไซเดอร์ (Cider)", "ไวน์น้ำผึ้ง (Mead)", 
      "เตกีล่า (Tequila)", "เมสคาล (Mezcal)", "จิน (Gin)", "บรั่นดี", "คอนยัค", "แชมเปญ", 
      "ม็อกเทล", "ไซรัปผลไม้"
    ]
  },
  {
    id: "Others",
    name: "อื่นๆ",
    emoji: "📦",
    ingredients: [
      "ผงฟู", "เบกกิ้งโซดา", "ยีสต์", "เจลาติน", "ผงวุ้น", "สีผสมอาหาร", 
      "กลิ่นวานิลลา", "ช็อกโกแลตชิพ", "ผงโกโก้", "มาร์ชเมลโลว์", "กะทิ", 
      "เต้าหู้", "แผ่นแป้งปอเปี๊ยะ", "ขนมปังกรอบ", "แครกเกอร์", "สาคู",
      "ข้าวคั่ว", "หอมเจียว", "กระเทียมเจียว", "พริกทอด", "แคบหมูจิ๋ว", "ลูกชิ้นหมู", 
      "ลูกชิ้นเนื้อ", "ลูกชิ้นปลา", "ไส้กรอกอีสาน", "เต้าหู้ไข่", "เต้าหู้ปลา", "เส้นปลา", 
      "ฟองเต้าหู้", "สาหร่ายวากาเมะ", "ขนมปังป่น (Panko)", "ถ่านไม้ (สำหรับปิ้งย่าง)",
      "ผงวุ้นวุ้น (Agar-Agar)", "เนยโกโก้ (Cocoa Butter)", "คาเคานิบส์ (Cacao Nibs)", 
      "น้ำกุหลาบ (Rose Water)", "น้ำดอกส้ม (Orange Blossom Water)", "เทมเป้ (Tempeh)", 
      "เซตัน (Seitan)", "โปรตีนเกษตร", "กลิ่นผสมอาหารต่างๆ", "ดอกไม้กินได้ (Edible Flowers)",
      "แป้งมันฮ่องกง", "ท็อปปิ้งเบเกอรี่"
    ]
  }
];

function IngredientFilterPanel({
  currentCategoryData,
  selectedIngredients,
  onCheckboxChange,
}: {
  currentCategoryData: (typeof categoriesData)[0];
  selectedIngredients: string[];
  onCheckboxChange: (ingredient: string) => void;
}) {
  const [ingSearchTerm, setIngSearchTerm] = useState("");
  
  // ใช้ Debounce กับช่องค้นหาวัตถุดิบ
  const debouncedSearchTerm = useDebounce(ingSearchTerm, 300);

  const filteredIngredients = currentCategoryData.ingredients.filter((ing) =>
    ing.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
        <h2 className="text-xl font-black text-gray-900 pr-6">
          {currentCategoryData.name}
        </h2>

        <div className="relative w-full sm:w-[260px]">
          <input
            type="text"
            placeholder={`ค้นหาใน${currentCategoryData.name}...`}
            value={ingSearchTerm}
            onChange={(e) => setIngSearchTerm(e.target.value)}
            className="w-full py-2 pl-4 pr-10 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#71B254] focus:bg-white transition-all shadow-inner"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[280px] overflow-y-auto pr-2 border border-gray-50 rounded-xl p-4 bg-gray-50/30 scrollbar-thin">
        {filteredIngredients.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-8">
            {filteredIngredients.map((ingredient) => {
              const isChecked = selectedIngredients.includes(ingredient);
              return (
                <label
                  key={ingredient}
                  className="flex items-center gap-3 cursor-pointer select-none group w-fit"
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onCheckboxChange(ingredient)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border-2 border-gray-400 rounded-md bg-white peer-checked:bg-black peer-checked:border-black transition-all flex items-center justify-center">
                      {isChecked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-800 font-bold text-base group-hover:text-black transition-colors">
                    {ingredient}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 italic text-base">
            ไม่พบวัตถุดิบที่ตรงกับ &quot;{ingSearchTerm}&quot;
          </div>
        )}
      </div>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeCategory = searchParams.get("category") || "Meat";
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const handleCheckboxChange = (ingredient: string) => {
    if (selectedIngredients.includes(ingredient)) {
      setSelectedIngredients(selectedIngredients.filter((item) => item !== ingredient));
    } else {
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
  };

  const currentCategoryData =
    categoriesData.find((cat) => cat.id === activeCategory) || categoriesData[0];

  return (
    <div className="w-[95%] max-w-[1200px] mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8 items-stretch">

      {/* ฝั่งซ้าย: รายการหมวดหมู่ */}
      <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-4">
        <span className="text-gray-800 font-bold text-sm pl-4 mb-1 block">
          เลือกวัตถุดิบ
        </span>

        <div className="flex flex-col gap-5 w-full pb-10">
          {categoriesData.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <div key={cat.id} className="flex items-center gap-3 relative group">
                {isActive && (
                  <div className="absolute -left-5 text-[#71B254] font-black text-2xl hidden lg:block animate-pulse">
                    ➔
                  </div>
                )}
                <button
                  onClick={() => {
                    router.push(`/search?category=${cat.id}`);
                  }}
                  className={`w-full flex items-center gap-4 bg-white py-3 px-6 rounded-2xl transition-all duration-200 border-b-4 border-l-4 ${
                    isActive
                      ? "border-[#71B254] translate-x-1 translate-y-0.5 shadow-sm"
                      : "border-gray-300 hover:border-[#71B254]/50 shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  <div className="text-3xl shrink-0 select-none">{cat.emoji}</div>
                  <span className="font-bold text-gray-800 text-base">{cat.name}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ฝั่งขวา: Main Content Card */}
      <div className="flex-grow w-full bg-white border border-transparent rounded-[24px] p-8 md:p-12 shadow-sm flex flex-col">
        
        <div className="shrink-0">
          <h1 className="text-3xl md:text-4xl font-extrabold text-black mb-2 tracking-tight">
            คุณมีวัตถุดิบอะไรบ้าง?
          </h1>
          <p className="text-gray-500 text-base md:text-lg mb-6 font-medium">
            เลือกวัตถุดิบที่มีในตู้เย็น แล้วเราจะแนะนำสูตรอาหารให้คุณ
          </p>
        </div>

        <div className="flex-1 flex flex-col min-h-[300px]">
          <IngredientFilterPanel
            key={activeCategory}
            currentCategoryData={currentCategoryData}
            selectedIngredients={selectedIngredients}
            onCheckboxChange={handleCheckboxChange}
          />
        </div>

        <div className="shrink-0 border-t border-gray-100 pt-6 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center w-full mt-6">
          <div className="flex flex-wrap items-center gap-2 max-w-xl">
            <span className="text-gray-800 font-extrabold text-lg mr-2">
              ที่เลือก:
            </span>
            {selectedIngredients.length > 0 ? (
              selectedIngredients.map((item) => (
                <span
                  key={item}
                  className="bg-[#E5E5E5] text-gray-800 font-bold text-sm px-4 py-1.5 rounded-md shadow-inner animate-scale-up"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="text-gray-400 italic text-sm">ยังไม่ได้เลือก</span>
            )}
          </div>

          <Link
            href={`/search/results?ingredients=${selectedIngredients.join(",")}`}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#71B254] text-white font-extrabold text-base rounded-2xl hover:bg-[#5b9642] transition-all flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:translate-y-0 shrink-0 text-center block"
          >
            ค้นหาสูตรอาหาร <span>➔</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SearchIngredientsPage() {
  return (
    <div className={`${anuphan.className} min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden`}>
      <Navbar />
      <Suspense
        fallback={
          <div className="text-center py-20 font-bold text-[#71B254]">
            กำลังโหลดวัตถุดิบ...
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </div>
  );
}