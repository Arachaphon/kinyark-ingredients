"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar"; 
import Link from "next/link";
import type { Map, Marker, LeafletMouseEvent } from "leaflet";

type LeafletModule = typeof import("leaflet");

// =========================================
// 🍱 ฐานข้อมูลวัตถุดิบแบบครอบคลุมทั่วโลก (Global Expanded Mock Data)
// =========================================
const categoriesData = [
  {
    id: "Meat",
    name: "เนื้อสัตว์",
    emoji: "🥩",
    ingredients: [
      "เนื้อ", "ไก่", "หมู", "เนื้อวัว", "เนื้อแกะ", "เป็ด", "ไก่งวง", "เบคอน", "แฮม", "ไส้กรอก",
      "เนื้อกวาง", "เนื้อลูกวัว", "เนื้อแพะ", "เปปเปอโรนี", "ซาลามี", "พรอสชุตโต", "นกกระทา",
      "ห่าน", "วากิวบีฟ", "หมูสับ", "เนื้อสับ", "สามชั้น", "เนื้อจระเข้", "นกกระจอกเทศ",
      "หมูกรอบ", "หมูแดง", "แคบหมู", "ซี่โครงหมู", "ตับหมู", "เครื่องในไก่", "เลือดหมู", 
      "เลือดไก่", "กุนเชียง", "หมูยอ", "แหนม", "ไส้อั่ว", "นกพิราบ", "กบ", "คอหมูย่าง", "ไก่ย่าง",
      "โชริโซ่ (Chorizo)", "แฮมอิเบอริโก (Ibérico Ham)", "คอร์นบีฟ (Corned Beef)", 
      "สแปม (Spam)", "บราตววสท์ (Bratwurst)", "พาสตรามี (Pastrami)", "เนื้อนกกระจอกเทศ", 
      "กระต่าย", "ไก่งวงบด", "เนื้อจิงโจ้", "เนื้อแกะสับ", "ไส้กรอกเลือด (Blood Sausage)",
      "แฮมปาร์มา (Parma Ham)", "กึ๋นไก่", "หัวใจไก่", "เนื้อแก้มวัว", "หางวัว", "ลิ้นวัว", "อกไก่"
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
      "ไม้เสียบลูกชิ้น", "พิมพ์อบขนม", "เครื่องนวดแป้ง", "เทอร์โมมิเตอร์อาหาร", "ที่คีบน้ำแข็ง"
    ]
  },
  {
    id: "Fruits",
    name: "ผลไม้",
    emoji: "🥗",
    ingredients: [
      "ผลไม้", "แอปเปิ้ล", "กล้วย", "ส้ม", "สตรอว์เบอร์รี", "องุ่น", "แตงโม", "มะม่วง",
      "สับปะรด", "กีวี", "บลูเบอร์รี", "ราสพ์เบอร์รี", "แบล็คเบอร์รี", "พีช", "สาลี่",
      "พลัม", "เชอร์รี", "มะนาวเหลือง", "มะนาวเขียว", "มะนาว", "มะพร้าว", "อะโวคาโด", "ทับทิม",
      "มะเดื่อ", "มะละกอ", "แก้วมังกร", "ทุเรียน", "ลิ้นจี่", "เมลอน", "แคนตาลูป", "ส้มโอ",
      "มังคุด", "เงาะ", "ลองกอง", "ลางสาด", "มะขาม", "มะขามเปียก", "กระท้อน", "พุทรา",
      "มะยม", "ชมพู่", "สละ", "ระกำ", "ลูกพลับ", "อินทผลัม", "แครนเบอร์รี", "เสาวรส", "มัลเบอร์รี",
      "เกรปฟรุต", "ส้มแมนดาริน", "ส้มยูซุ", "กล้วยกล้าย (Plantain)", "ผลมะกอกสด", 
      "ขนุน", "ลูกท้อ", "เชอริโมยา (Cherimoya)", "สาเก (Breadfruit)", "มะเฟือง", 
      "กัววา", "แบล็กเคอแรนต์", "กูสเบอร์รี", "เอลเดอร์เบอร์รี"
    ]
  },
  {
    id: "Seafood",
    name: "อาหารทะเล",
    emoji: "🦞",
    ingredients: [
      "ปลา", "หอย", "กุ้ง", "ปู", "แซลมอน", "ปลาหมึก", "หอยแมลงภู่", "กุ้งมังกร", "ปลาหมึกยักษ์", "หอยลาย",
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
      "ผัก", "มะเขือเทศ", "หัวหอม", "หอมใหญ่", "กระเทียม", "แครอท", "มันฝรั่ง", "กะหล่ำปลี", "บรอกโคลี",
      "ผักโขม", "ผักกาดหอม", "ผักกาดแก้ว", "แตงกวา", "เห็ด",
      "ขิง", "ตะไคร้", "หน่อไม้ฝรั่ง", "ซูกินี", "มะเขือยาว", "ข้าวโพด", "ถั่วลันเตา",
      "กะหล่ำดอก", "ขึ้นฉ่าย", "เคล", "ฟักทอง", "มันเทศ", "หัวไชเท้า", "ผักกวางตุ้ง", "กวางตุ้ง", "คะน้า", "บีทรูท",
      "กะเพรา", "โหระพา", "แมงลัก", "สะระแหน่", "ผักชีฝรั่ง", "ผักชีลาว", "ชะอม", "กะหล่ำปลีม่วง", 
      "ถั่วงอก", "บวบ", "ฟักเขียว", "แตงกวาญี่ปุ่น", "มะระ", "มะระขี้นก", "ตำลึง", "ผักบุ้ง", 
      "ผักกระเฉด", "ดอกแค", "หัวปลี", "กระชาย", "ขมิ้น", "ใบเตย", "ชะพลู", "ผักหวาน", "หน่อไม้", 
      "เห็ดเข็มทอง", "เห็ดหอม", "เห็ดฟาง", "เห็ดออรินจิ", "เผือก", "แห้ว", "รากบัว", "ถั่วฝักยาว",
      "อาร์ติโชค (Artichoke)", "เฟนเนล (Fennel)", "มันสำปะหลัง (Cassava)", "กระเจี๊ยบเขียว (Okra)", 
      "เบบี้แครอท", "หัวไชเท้าญี่ปุ่น (Daikon)", "บ็อกฉ่อย (Bok Choy)", "กระเทียมต้น (Leek)", "พริกฮาลาปินโญ",
      "เห็ดแชมปิญอง", "เห็ดทรัฟเฟิล", "เห็ดชิเมจิ", "เห็ดไมตาเกะ", "มะกอกดำ", "มะกอกเขียว"
    ]
  },
  {
    id: "Carbs",
    name: "ข้าวเส้นและแป้ง",
    emoji: "🍚",
    ingredients: [
      "เส้น", "แป้ง", "ข้าวหอมมะลิ", "ข้าวกล้อง", "ข้าวบาสมาติ", "ข้าวไรซ์เบอร์รี", "เส้นสปาเกตตี", 
      "มักกะโรนี", "เส้นเพนเน", "เส้นหมี่", "เส้นใหญ่", "เส้นเล็ก", "วุ้นเส้น", 
      "แป้งสาลีเอนกประสงค์", "แป้งข้าวโพด", "แป้งมันสำปะหลัง", "แป้งมัน", "ขนมปังแผ่น", 
      "ขนมปังฝรั่งเศส", "แป้งตอร์ติญ่า", "ข้าวโอ๊ต", "ควินัว", "บะหมี่กึ่งสำเร็จรูป", "บะหมี่", 
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
      "วิปปิ้งครีม", "ครีมชีส", "เชดดาร์ชีส", "ชีส", "มอสซาเรลลาชีส", "พาร์เมซานชีส", 
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
      "น้ำปลาร้า", "ซอสหม่าล่า", "พริกเผา", "น้ำพริกเผา", "น้ำพริกนรก", "น้ำพริกตาแดง", "น้ำจิ้มซีฟู้ด",
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
      "พริก", "พริกขี้หนู", "พริกชี้ฟ้า", "พริกหยวก", "พริกไทยดำ", "พริกไทยขาว", "พริกป่น", "ผงกะหรี่", "ยี่หร่า", "ออริกาโน", 
      "โรสแมรี่", "ไทม์", "บาซิล (โหระพาฝรั่ง)", "ใบกะเพรา", "ใบโหระพา", "ผักชี", 
      "รากผักชี", "ดอกจันทน์", "อบเชย", "โป๊ยกั๊ก", "กานพลู", "พาร์สลีย์", 
      "ปาปริก้า", "หญ้าฝรั่น (Saffron)", "ใบมะกรูด", "ข่า", "ผงกระเทียม", "ผงหัวหอม",
      "พริกไทยเสฉวน (หม่าล่า)", "เม็ดผักชี", "ลูกกระวาน", "ขมิ้นผง", "พริกแห้ง", 
      "พริกหยวกแห้ง", "ผงปาปริก้าสโมค", "ดอกงิ้ว", "สมุนไพรจีนตุ๋น", "ตังกุย", "เก๋ากี้",
      "เครื่องต้มยำ", "เครื่องแกงเขียวหวาน", "พริกแกงเขียวหวาน", "พริกแกงเผ็ด", "พริกแกงส้ม", "พริกแกงมัสมั่น", 
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
      "น้ำมันกระเทียมเจียว", "น้ำมันเจียวหอม", "น้ำมันเนย", "สเปรดทาขนมปัง",
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
      "น้ำเปล่า", "น้ำแร่", "น้ำ", "น้ำโซดา", "โซดา", "กาแฟ", "ชาเขียว", "ชาดำ", "ชาอู่หลง", 
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

type SystemRecipe = {
  id: string;
  title: string;
  ownerName: string;
  matchTags: string[];
  ingredients: { category: string; name: string; quantity: string; unit: string }[];
  instructions: string;
};

type UploadedMedia = {
  file: File;
  previewUrl: string;
};

const SAMPLE_SYSTEM_RECIPES: SystemRecipe[] = [
  {
    id: "r1",
    title: "ต้มยำอกไก่มะนาว",
    ownerName: "user_นุช88",
    matchTags: ["อกไก่", "มะนาว", "พริก"],
    ingredients: [
      { category: "Meat", name: "อกไก่", quantity: "300", unit: "g" },
      { category: "Fruits", name: "มะนาว", quantity: "2", unit: "piece" },
      { category: "Vegetables", name: "พริกขี้หนู", quantity: "5", unit: "piece" },
    ],
    instructions: "1. ต้มน้ำให้เดือด ใส่ตะไคร้ ข่า ใบมะกรูด\n2. ใส่อกไก่หั่นพอดีคำ ต้มจนสุก\n3. ปรุงรสด้วยน้ำปลา น้ำมะนาว พริกขี้หนูทุบ",
  },
  {
    id: "r2",
    title: "สลัดอกไก่ซอสงา",
    ownerName: "chef_ple",
    matchTags: ["อกไก่", "ผักกาด"],
    ingredients: [
      { category: "Meat", name: "อกไก่", quantity: "250", unit: "g" },
      { category: "Vegetables", name: "ผักกาดแก้ว", quantity: "1", unit: "piece" },
    ],
    instructions: "1. ย่างอกไก่จนสุก พักให้เย็นแล้วหั่นเป็นเส้น\n2. จัดผักกาดใส่จาน วางอกไก่ด้านบน\n3. ราดซอสงาก่อนเสิร์ฟ",
  },
  {
    id: "r3",
    title: "แกงเขียวหวานไก่",
    ownerName: "user_ต้น",
    matchTags: ["อกไก่", "พริก", "กะทิ"],
    ingredients: [
      { category: "Meat", name: "อกไก่", quantity: "300", unit: "g" },
      { category: "Spices and Herbs", name: "พริกแกงเขียวหวาน", quantity: "3", unit: "tablespoon" },
      { category: "Others", name: "กะทิ", quantity: "400", unit: "ml" },
    ],
    instructions: "1. ผัดพริกแกงกับกะทิหัวจนแตกมัน\n2. ใส่อกไก่ ผัดให้สุก\n3. เติมกะทิที่เหลือ ปรุงรส ใส่ใบโหระพา",
  },
];

export default function CreateRecipePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [postAs, setPostAs] = useState<"user" | "store">("user");
  const [userRole, setUserRole] = useState<string>("USER");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  
  const [videoFile, setVideoFile] = useState<UploadedMedia | null>(null);
  const [coverImages, setCoverImages] = useState<UploadedMedia[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const [visibility, setVisibility] = useState<"public" | "protected" | "private">("public");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [ingredients, setIngredients] = useState([
    { id: 1, category: "", name: "", quantity: "", unit: "" }
  ]);

  const [equipments, setEquipments] = useState([
    { id: 1, name: "" }
  ]);

  const [existingIngredients, setExistingIngredients] = useState<{id: number, name: string, category?: {id: number, name: string}}[]>([]);
  const [popupError, setPopupError] = useState<string | null>(null);
  const [focusedIngredientId, setFocusedIngredientId] = useState<number | null>(null);

  // 🌟 สร้างหมวดหมู่ที่ดึงข้อมูลวัตถุดิบสดๆ จาก Database
  const dbCategoriesData = React.useMemo(() => {
    if (!existingIngredients || existingIngredients.length === 0) return categoriesData;

    const grouped: Record<string, string[]> = {};
    for (const item of existingIngredients) {
      const catName = item.category?.name ?? "Others";
      if (!grouped[catName]) grouped[catName] = [];
      if (!grouped[catName].includes(item.name)) grouped[catName].push(item.name);
    }

    return categoriesData.map(cat => {
      const dbList = grouped[cat.name] || grouped[cat.id] || [];
      const combined = Array.from(new Set([...dbList, ...cat.ingredients]));
      return {
        ...cat,
        ingredients: combined,
      };
    });
  }, [existingIngredients]);

  useEffect(() => {
    setIsMounted(true);
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user?.role) setUserRole(data.user.role);
      })
      .catch(console.error);
      
    fetch('/api/ingredients')
      .then(res => res.json())
      .then(res => {
        if (res.data) setExistingIngredients(res.data);
      })
      .catch(console.error);
  }, []);

  const [shopName, setShopName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [shopLocation, setShopLocation] = useState("");
  
  const [pinCoord, setPinCoord] = useState<{ lat: number; lng: number } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const leafletModuleRef = useRef<LeafletModule | null>(null);

  const [shopIngredientImages, setShopIngredientImages] = useState<UploadedMedia[]>([]);
  const [shopImageIndex, setShopImageIndex] = useState(0);
  const [shopIngredientVideo, setShopIngredientVideo] = useState<UploadedMedia | null>(null);
  const shopImageInputRef = useRef<HTMLInputElement>(null);
  const shopVideoInputRef = useRef<HTMLInputElement>(null);

  const [recipeSourceMode, setRecipeSourceMode] = useState<"manual" | "system">("manual");
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [pickedRecipe, setPickedRecipe] = useState<SystemRecipe | null>(null);
  
  const [availableRecipes, setAvailableRecipes] = useState<SystemRecipe[]>(SAMPLE_SYSTEM_RECIPES);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateMapMarker = (lat: number, lng: number, map: Map, L: LeafletModule) => {
    setPinCoord({ lat, lng });
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }
    map.setView([lat, lng], 15);
  };

  const handleSearchLocation = async () => {
    if (!shopLocation.trim()) return;
    try {
      // 📍 ข้อมูลจำลองสำหรับ Mockup บริเวณ ม.พะเยา และสถานที่ฮิต (เพื่อใช้ทดสอบโดยเฉพาะ)
      const mockupLocations: Record<string, { lat: number; lng: number; name: string }> = {
        "หน้ามอ": { lat: 19.0287, lng: 99.8973, name: "หน้า ม.พะเยา (หน้ามอ)" },
        "หน้าม.พะเยา": { lat: 19.0287, lng: 99.8973, name: "หน้า ม.พะเยา" },
        "หน้า ม.พะเยา": { lat: 19.0287, lng: 99.8973, name: "หน้า ม.พะเยา" },
        "ม.พะเยา": { lat: 19.0287, lng: 99.8973, name: "มหาวิทยาลัยพะเยา" },
        "เกท 1": { lat: 19.0305, lng: 99.8950, name: "เกท 1 ม.พะเยา (Gate 1)" },
        "เกท 2": { lat: 19.0315, lng: 99.8965, name: "เกท 2 ม.พะเยา (Gate 2)" },
        "เกท 3": { lat: 19.0330, lng: 99.8980, name: "เกท 3 ม.พะเยา (Gate 3)" },
        "เกท 4": { lat: 19.0350, lng: 99.9000, name: "เกท 4 ม.พะเยา (Gate 4)" },
        "หลังมอ": { lat: 19.0210, lng: 99.8800, name: "หลัง ม.พะเยา (หลังมอ)" },
        "หลัง ม.พะเยา": { lat: 19.0210, lng: 99.8800, name: "หลัง ม.พะเยา" },
        "สแควร์": { lat: 19.0295, lng: 99.8960, name: "UP Square (หน้ามอ)" },
        
        // 🎯 สถานที่เฉพาะเจาะจงตามที่ผู้ใช้ต้องการทดสอบ (Mockup Locations)
        "ไผ่แดง": { lat: 19.028306660390673, lng: 99.92671256826632, name: "ไผ่แดงหมูกระทะ หน้า ม.พะเยา" },
        "หมูกะทะไผ่แดง": { lat: 19.028306660390673, lng: 99.92671256826632, name: "ไผ่แดงหมูกระทะ หน้า ม.พะเยา" },
        "เจริญภัณฑ์": { lat: 19.1666, lng: 99.9022, name: "ห้างเจริญภัณฑ์ (เมืองพะเยา)" },
        "เจริญภัณฑ์ หน้ามอ": { lat: 19.029146375033267, lng: 99.92585925010889, name: "เจริญภัณฑ์เอ็กซ์เพรส สาขา หน้า ม.พะเยา" },
        "เจริญภัณฑ์ หน้า ม.พะเยา": { lat: 19.029146375033267, lng: 99.92585925010889, name: "เจริญภัณฑ์เอ็กซ์เพรส สาขา หน้า ม.พะเยา" },
        "กาดเขียว": { lat: 19.0307171, lng: 99.9265772, name: "กาดเขียว" },
        "ตลาดนัดวันศุกร์": { lat: 19.033944826420683, lng: 99.92846779759432, name: "ตลาดนัดวันศุกร์" },
        "ตลาด one market": { lat: 19.031077404419495, lng: 99.92686756739701, name: "ตลาด One market (กาดหลุม)" },
        "กาดหลุม": { lat: 19.031077404419495, lng: 99.92686756739701, name: "ตลาด One market (กาดหลุม)" },
        "lotus": { lat: 19.030682956480472, lng: 99.92654135078719, name: "Lotus's Go Fresh หน้ามหาวิทยาลัยพะเยา" },
        "โลตัส": { lat: 19.030682956480472, lng: 99.92654135078719, name: "Lotus's Go Fresh หน้ามหาวิทยาลัยพะเยา" },
        "ตลาดนำโชค": { lat: 19.029464573433987, lng: 99.92613204249007, name: "ตลาดนำโชค" },
        "หนานคำ": { lat: 19.027095830460155, lng: 99.92348777407973, name: "รถตู้หนานคำ สาขาม.พะเยา" },
        "รถตู้หนานคำ": { lat: 19.027095830460155, lng: 99.92348777407973, name: "รถตู้หนานคำ สาขาม.พะเยา" },
        "เซเว่น แม่กา": { lat: 19.027391835141692, lng: 99.92352086681264, name: "7-Eleven สาขา แม่กา ทล.1 (19498)" },
        "7-11 แม่กา": { lat: 19.027391835141692, lng: 99.92352086681264, name: "7-Eleven สาขา แม่กา ทล.1 (19498)" },
        "7-eleven แม่กา": { lat: 19.027391835141692, lng: 99.92352086681264, name: "7-Eleven สาขา แม่กา ทล.1 (19498)" },
        "เซเว่น หน้ามอ": { lat: 19.029974016982443, lng: 99.92626195332112, name: "7-Eleven สาขา หน้า ม.พะเยา (09175)" },
        "7-11 หน้ามอ": { lat: 19.029974016982443, lng: 99.92626195332112, name: "7-Eleven สาขา หน้า ม.พะเยา (09175)" },
        "7-eleven หน้ามอ": { lat: 19.029974016982443, lng: 99.92626195332112, name: "7-Eleven สาขา หน้า ม.พะเยา (09175)" },
      };

      const query = shopLocation.trim().toLowerCase();
      let matchedMockup = null;
      const sortedKeys = Object.keys(mockupLocations).sort((a, b) => b.length - a.length);
      for (const key of sortedKeys) {
        if (query.includes(key)) {
          matchedMockup = mockupLocations[key];
          break;
        }
      }

      if (matchedMockup) {
        setShopLocation(matchedMockup.name);
        if (mapInstanceRef.current && leafletModuleRef.current) {
          updateMapMarker(matchedMockup.lat, matchedMockup.lng, mapInstanceRef.current, leafletModuleRef.current);
          mapInstanceRef.current.setView([matchedMockup.lat, matchedMockup.lng], 16);
        }
        return; // สิ้นสุดการค้นหาจาก Mockup
      }

      // ถ้าไม่ตรงกับ Mockup เลย จะลองหาในแผนที่จริง
      let searchQuery = shopLocation.trim();
      if (!searchQuery.includes("พะเยา") && !searchQuery.includes("Thailand")) {
        searchQuery = `${searchQuery}, พะเยา`;
      }

      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        setShopLocation(display_name);
        
        if (mapInstanceRef.current && leafletModuleRef.current) {
          updateMapMarker(latitude, longitude, mapInstanceRef.current, leafletModuleRef.current);
        }
      } else {
        alert("ไม่พบชื่อร้านนี้ในระบบแผนที่สาธารณะ แนะนำให้พิมพ์ชื่อถนน/ตำบล หรือคลิกปักหมุดบนแผนที่ได้เลยครับ");
      }
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };

  useEffect(() => {
    if (postAs === "store" && isMounted && mapRef.current && !mapInstanceRef.current) {
      import("leaflet").then((L) => {
        leafletModuleRef.current = L;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- leaflet internal property
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        if (mapRef.current) {
          // ตั้งค่าเริ่มต้นของแผนที่ไปที่ หน้า ม.พะเยา แทนตัวเมือง เพื่อให้เข้ากับ Mockup
          const map = L.map(mapRef.current).setView([19.0287, 99.8973], 15);
          
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; OpenStreetMap contributors',
          }).addTo(map);

          if (navigator.geolocation && !pinCoord) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                map.setView([latitude, longitude], 13);
                updateMapMarker(latitude, longitude, map, L);
                setShopLocation(`พิกัดร้านปัจจุบัน (Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)})`);
              },
              (error) => {
                console.warn("Geolocation failed or denied:", error);
              }
            );
          }

          map.on("click", (e: LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            updateMapMarker(lat, lng, map, L);
            setShopLocation(`พิกัดร้าน (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`);
          });

          mapInstanceRef.current = map;

          setTimeout(() => {
            map.invalidateSize();
          }, 200);
        }
      });
    }

    return () => {
      if (postAs !== "store" && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [postAs, isMounted]);

  useEffect(() => {
    if (recipeSourceMode === "system" && availableRecipes === SAMPLE_SYSTEM_RECIPES) {
      const fetchRealRecipes = async () => {
        setIsLoadingRecipes(true);
        try {
          const response = await fetch('/api/recipes'); 
          if (!response.ok) throw new Error("API endpoint not ready or not found");
          
          const data = await response.json();
          if (data && data.length > 0) {
            setAvailableRecipes(data);
          }
        } catch (error) {
          console.warn("Failed to fetch real recipes, falling back to mock data.", error);
        } finally {
          setIsLoadingRecipes(false);
        }
      };

      fetchRealRecipes();
    }
  }, [recipeSourceMode, availableRecipes]);

  const handleShopImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const availableSlots = 4 - shopIngredientImages.length;
    const filesToAdd = files.slice(0, availableSlots);
    
    const newMedia = filesToAdd.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setShopIngredientImages(prev => {
      const updated = [...prev, ...newMedia];
      setShopImageIndex(updated.length - 1);
      return updated;
    });
    if (shopImageInputRef.current) shopImageInputRef.current.value = "";
  };

  const removeShopImage = (indexToRemove: number) => {
    setShopIngredientImages(prev => {
      const newImages = prev.filter((_, i) => i !== indexToRemove);
      if (shopImageIndex >= newImages.length && newImages.length > 0) {
        setShopImageIndex(newImages.length - 1);
      } else if (newImages.length === 0) {
        setShopImageIndex(0);
      }
      return newImages;
    });
  };

  const handleShopVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setShopIngredientVideo({ file, previewUrl: URL.createObjectURL(file) });
  };

  const filteredSystemRecipes = (() => {
    const terms = ingredientSearch.toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
    if (terms.length === 0) return availableRecipes;
    return availableRecipes.filter(r =>
      (r.matchTags && r.matchTags.some(tag => terms.some(t => tag.toLowerCase().includes(t)))) ||
      (r.ingredients && r.ingredients.some(ing => terms.some(t => ing.name.toLowerCase().includes(t))))
    );
  })();

  const handlePickRecipe = (recipe: SystemRecipe) => {
    setPickedRecipe(recipe);
    setIngredients(recipe.ingredients.map((ing, idx) => ({ id: idx + 100, ...ing })));
    setInstructions(recipe.instructions);
    if (!title) setTitle(recipe.title);
  };

  const handleUndoPickRecipe = () => {
    setPickedRecipe(null);
  };

  useEffect(() => {
    if (coverImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % coverImages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [coverImages.length, currentImageIndex]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % coverImages.length);
  };
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + coverImages.length) % coverImages.length);
  };

  const handleIngredientChange = (id: number, field: "category" | "name" | "quantity" | "unit", value: string) => {
    setIngredients(
      ingredients.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleIngredientNameBlur = (selectedCategory: string, typedName: string) => {
    if (!typedName.trim() || !selectedCategory) return;

    // 🌟 1. ค้นหาจากข้อมูลวัตถุดิบใน Database ก่อนเป็นหลัก
    const dbMatch = existingIngredients.find(
      (ing) => ing.name.toLowerCase() === typedName.toLowerCase().trim()
    );

    if (dbMatch && dbMatch.category) {
      const dbCatName = dbMatch.category.name;
      const matchCatObj = categoriesData.find(
        (c) => c.name === dbCatName || c.id === dbCatName
      );
      const matchCatId = matchCatObj?.id ?? dbCatName;

      if (matchCatId !== selectedCategory && dbCatName !== selectedCategory) {
        setPopupError(`คุณกรอกวัตถุดิบผิดหมวดหมู่!\n\n"${typedName}" จัดอยู่ในหมวดหมู่ "${matchCatObj?.name || dbCatName}"\nกรุณาแก้ไขหมวดหมู่ให้ถูกต้องครับ`);
        return;
      }
    }

    // 🌟 2. ค้นหาจาก dbCategoriesData
    const foundCategory = dbCategoriesData.find(cat =>
      cat.id !== "Kitchen Tools" &&
      cat.ingredients.some(ing => ing.toLowerCase() === typedName.toLowerCase().trim())
    );

    if (foundCategory && foundCategory.id !== selectedCategory) {
      setPopupError(`คุณกรอกวัตถุดิบผิดหมวดหมู่!\n\n"${typedName}" จัดอยู่ในหมวดหมู่ "${foundCategory.name}"\nกรุณาแก้ไขหมวดหมู่ให้ถูกต้องครับ`);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { id: Date.now(), category: "", name: "", quantity: "", unit: "" }]);
  };

  const removeIngredient = (idToRemove: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((item) => item.id !== idToRemove));
    }
  };

  const handleEquipmentChange = (id: number, value: string) => {
    setEquipments(
      equipments.map((item) => (item.id === id ? { ...item, name: value } : item))
    );
  };

  const addEquipment = () => {
    setEquipments([...equipments, { id: Date.now(), name: "" }]);
  };

  const removeEquipment = (idToRemove: number) => {
    if (equipments.length > 1) {
      setEquipments(equipments.filter((item) => item.id !== idToRemove));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const availableSlots = 4 - coverImages.length;
    const filesToAdd = files.slice(0, availableSlots);
    
    const newMedia = filesToAdd.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setCoverImages(prev => {
      const updated = [...prev, ...newMedia];
      setCurrentImageIndex(updated.length - 1); 
      return updated;
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (indexToRemove: number) => {
    setCoverImages(prev => {
      const newImages = prev.filter((_, index) => index !== indexToRemove);
      if (currentImageIndex >= newImages.length && newImages.length > 0) {
        setCurrentImageIndex(newImages.length - 1);
      } else if (newImages.length === 0) {
        setCurrentImageIndex(0);
      }
      return newImages;
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVideoFile({ file, previewUrl: URL.createObjectURL(file) });
  };

  const handleSubmitRecipe = async () => {
    if (!title.trim()) {
      alert("กรุณากรอกชื่อเมนูอาหาร");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        recipeName: title,
        description,
        instructions,
        visibility: visibility === "public" || visibility === "private" ? visibility : "public",
        postAs,
        ingredients: ingredients
          .filter(i => i.name.trim() !== "")
          .map(i => ({
            name: i.name.trim(),
            quantity: parseFloat(i.quantity) || 1,
            unit: i.unit || "กรัม",
            category: i.category || undefined
          })),
        equipmentItems: equipments
          .filter(e => e.name.trim() !== "")
          .map(e => ({ name: e.name })),
      };

      if (pickedRecipe) {
        payload.systemRecipeId = pickedRecipe.id;
      }

      // ⚠️ Upload files
      const uploadFile = async (file: File): Promise<string | null> => {
        const fd = new FormData();
        fd.append("file", file);
        try {
          const res = await fetch("/api/recipes/upload", { method: "POST", body: fd });
          if (!res.ok) return null;
          const data = await res.json();
          return data.url;
        } catch {
          return null;
        }
      };

      const uploadedImages: string[] = [];
      for (const media of coverImages) {
        const url = await uploadFile(media.file);
        if (url) uploadedImages.push(url);
      }

      if (uploadedImages.length > 0) {
        payload.featuredImageUrl = uploadedImages[0];
        payload.images = uploadedImages;
      }

      const uploadedVideos: string[] = [];
      if (videoFile) {
        const url = await uploadFile(videoFile.file);
        if (url) uploadedVideos.push(url);
      }
      
      if (postAs === "store" && shopIngredientVideo) {
        const url = await uploadFile(shopIngredientVideo.file);
        if (url) uploadedVideos.push(url);
      }

      if (uploadedVideos.length > 0) {
        payload.videos = uploadedVideos;
      }

      // ข้อมูลเฉพาะร้านค้า (Store)
      if (postAs === "store") {
        payload.shopName = shopName;
        payload.sellingPrice = parseFloat(sellingPrice) || 0;
        payload.shopDescription = shopDescription;
        payload.shopLocation = shopLocation;
        
        if (pinCoord) {
          payload.pinCoord = pinCoord;
        }
      }

      // ยิง API ส่งข้อมูล
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), 
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("API Error Response:", errText);
        alert("เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง");
        return;
      }

      const result = await response.json();
      console.log("Success:", result);
      alert("บันทึกและเผยแพร่สูตรอาหารสำเร็จ!");
      
      if (result.data?.id) {
        router.push(`/recipe/${result.data.id}`);
      } else {
        router.push("/home");
      }
      
    } catch (error) {
      console.error("Error submitting recipe:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5EFD7] font-sans pb-20 overflow-x-hidden relative z-0">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css" />
      
      <Navbar />

      <main className="w-[95%] max-w-[1200px] mx-auto px-4 relative z-10 mt-8">
        
        <div className="flex items-center justify-between mb-4 relative z-20">
          <Link href="/home" className="flex items-center gap-2 text-gray-700 hover:text-black w-fit transition">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span className="text-lg font-bold">หน้าหลัก</span>
          </Link>

          {(userRole === "STORE" || userRole === "ADMIN") && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full p-1 text-sm">
              <button
                type="button"
                id="role-user-btn"
                onClick={() => setPostAs("user")}
                className={`px-3 py-1 rounded-full font-bold transition-colors ${
                  postAs === "user" ? "bg-[#71B254] text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                คนทั่วไป
              </button>
              <button
                type="button"
                id="role-store-btn"
                onClick={() => setPostAs("store")}
                className={`px-3 py-1 rounded-full font-bold transition-colors ${
                  postAs === "store" ? "bg-[#71B254] text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                ร้านค้า
              </button>
            </div>
          )}
        </div>

        <div className="bg-white border border-[#71B254] rounded-sm p-8 md:p-10 shadow-sm relative z-10">

          {postAs === "store" && (
            <div className="mb-10 pb-10 border-b border-[#71B254] relative z-20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">1</div>
                <h2 className="text-2xl font-bold text-gray-800">ข้อมูลร้านค้า</h2>
              </div>

              <div className="pl-11 flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-5">
                  <div>
                    <label htmlFor="shop-name-input" className="block text-gray-700 text-lg mb-2 font-semibold">ชื่อร้านค้า</label>
                    <input
                      id="shop-name-input"
                      type="text"
                      placeholder="เช่น ครัวคุณยาย เชียงราย"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full py-3 px-4 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400 bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="shop-price-input" className="block text-gray-700 text-lg mb-2 font-semibold">ราคาขาย (บาท)</label>
                    <input
                      id="shop-price-input"
                      type="text"
                      placeholder="เช่น 65"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full py-3 px-4 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="shop-desc-textarea" className="block text-gray-700 text-lg mb-2 font-semibold">คำอธิบาย (สำหรับเซ็ตขาย)</label>
                  <textarea
                    id="shop-desc-textarea"
                    rows={3}
                    placeholder="อธิบายเซ็ตวัตถุดิบหรือจุดเด่นของร้านสั้นๆ..."
                    value={shopDescription}
                    onChange={(e) => setShopDescription(e.target.value)}
                    maxLength={300}
                    className="w-full py-3 px-4 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400 resize-none bg-white leading-relaxed"
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex flex-col w-full md:w-[60%] gap-5">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-gray-600 text-sm font-semibold">รูปภาพวัตถุดิบ</label>
                        <span className="text-xs font-bold text-gray-400">{shopIngredientImages.length}/4 รูป</span>
                      </div>

                      <input id="shop-image-file-input" type="file" accept="image/png, image/jpeg" multiple className="hidden" ref={shopImageInputRef} onChange={handleShopImageUpload} />

                      {shopIngredientImages.length === 0 ? (
                        <div id="upload-shop-image-trigger" onClick={() => shopImageInputRef.current?.click()} className="h-[235px] w-full border border-dashed border-[#71B254] rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4FAF1] transition bg-white p-4 text-center">
                          <svg className="mb-2 text-[#7FA9A0]" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <span className="font-bold text-gray-800 text-[12px]">อัปโหลดรูปวัตถุดิบ</span>
                          <span className="text-gray-400 text-[10px]">รองรับไฟล์ PNG, JPG (สูงสุด 4 รูป)</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="w-full h-[195px] border border-[#71B254] rounded-md overflow-hidden relative group shadow-sm bg-black flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element -- blob URL, next/image not supported */}
                            <img
                              src={shopIngredientImages[shopImageIndex].previewUrl}
                              alt={`วัตถุดิบ ${shopImageIndex + 1}`}
                              className="w-full h-full object-cover transition-opacity duration-300"
                            />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                              <button type="button" id="remove-shop-img-btn" onClick={() => removeShopImage(shopImageIndex)} className="bg-red-500 text-white px-2.5 py-1.5 rounded-md font-bold shadow-md text-[10px] hover:bg-red-600">
                                ลบรูปนี้
                              </button>
                            </div>
                            {shopIngredientImages.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  id="prev-shop-img-btn"
                                  onClick={(e) => { e.stopPropagation(); setShopImageIndex(i => (i - 1 + shopIngredientImages.length) % shopIngredientImages.length); }}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md text-gray-800 z-10 transition-all"
                                >
                                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>
                                <button
                                  type="button"
                                  id="next-shop-img-btn"
                                  onClick={(e) => { e.stopPropagation(); setShopImageIndex(i => (i + 1) % shopIngredientImages.length); }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md text-gray-800 z-10 transition-all"
                                >
                                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                                  {shopIngredientImages.map((_, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => setShopImageIndex(idx)}
                                      className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 shadow-sm ${shopImageIndex === idx ? 'w-4 bg-[#71B254]' : 'w-1.5 bg-white/70 hover:bg-white'}`}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                          {shopIngredientImages.length < 4 && (
                            <button
                              type="button"
                              id="add-more-shop-img-btn"
                              onClick={() => shopImageInputRef.current?.click()}
                              className="w-full py-2 border border-dashed border-[#71B254] text-[#71B254] rounded-md text-xs font-bold hover:bg-[#F4FAF1] transition-colors flex items-center justify-center gap-1"
                            >
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
                              เพิ่มรูปภาพอีก ({shopIngredientImages.length}/4)
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-2">วิดีโอวัตถุดิบ</label>
                      <input id="shop-video-file-input" type="file" accept="video/mp4, video/quicktime" className="hidden" ref={shopVideoInputRef} onChange={handleShopVideoUpload} />
                      {shopIngredientVideo ? (
                        <div className="h-[250px] w-full border border-[#71B254] rounded-md overflow-hidden relative group bg-black flex items-center justify-center shadow-sm">
                          <video src={shopIngredientVideo.previewUrl} controls className="w-full h-full object-contain" />
                          <div className="absolute top-2 right-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button type="button" id="remove-shop-video-btn" onClick={() => setShopIngredientVideo(null)} className="bg-red-500 text-white px-2.5 py-1.5 rounded-md font-bold shadow-sm text-xs hover:bg-red-600">
                              ลบวิดีโอ
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div id="upload-shop-video-trigger" onClick={() => shopVideoInputRef.current?.click()} className="h-[235px] w-full border border-dashed border-[#71B254] rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4FAF1] transition bg-white p-4 text-center">
                          <svg className="mb-2 text-[#7FA9A0]" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l4.55 1.45A2 2 0 0 0 23 17V7z"></path>
                          </svg>
                          <span className="font-bold text-gray-800 text-[12px]">อัปโหลดวิดีโอวัตถุดิบ</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col w-full md:w-[40%] gap-5">
                    <div>
                      <label htmlFor="shop-location-input" className="block text-gray-700 text-lg mb-2 font-semibold">ที่ตั้งร้าน</label>
                      <div className="flex gap-2">
                        <input
                          id="shop-location-input"
                          type="text"
                          placeholder="พิมพ์ชื่อสถานที่ หรือ ถนน (เช่น ถนนพหลโยธิน)"
                          value={shopLocation}
                          onChange={(e) => setShopLocation(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSearchLocation();
                            }
                          }}
                          className="w-full py-3 px-4 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400 bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleSearchLocation}
                          className="px-4 py-3 bg-[#71B254] text-white rounded-md font-bold text-sm hover:bg-[#5b9642] transition shrink-0"
                        >
                          ค้นหา
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-gray-600 text-xs font-semibold mb-1">คลิกปักหมุด หรือค้นหาชื่อสถานที่:</label>
                      <div 
                        ref={mapRef} 
                        className="h-[200px] w-full border border-[#71B254] rounded-md overflow-hidden relative shadow-inner z-10"
                      />
                      {pinCoord && (
                        <span className="text-[11px] text-green-700 font-bold mt-1">
                          📌 พิกัด: Lat {pinCoord.lat.toFixed(4)}, Lng {pinCoord.lng.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-8 relative z-20">
            
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">1</div>
                  <h2 className="text-2xl font-bold text-gray-800">ข้อมูลพื้นฐาน</h2>
                </div>

                <div className="flex flex-col gap-5 pl-11">
                  <div>
                    <label htmlFor="recipe-title-input" className="block text-gray-700 text-lg mb-2 font-semibold">ชื่อเมนูอาหาร</label>
                    <div className="relative">
                      <input 
                        id="recipe-title-input"
                        type="text" 
                        placeholder="เช่น สเต็กเนื้อวากิว, สลัดอกไก่" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        maxLength={100}
                        className="w-full py-3 px-4 pr-20 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400 bg-white"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        {title.length}/100
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="recipe-desc-textarea" className="block text-gray-700 text-lg mb-2 font-semibold">คำอธิบาย</label>
                    <div className="relative">
                      <textarea 
                        id="recipe-desc-textarea"
                        rows={4} 
                        placeholder="เขียนคำอธิบายเมนูอาหารของคุณสั้นๆ (1-2 ประโยค) เพื่อบอกความโดดเด่นหรือรสชาติของเมนูนี้..." 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        maxLength={300}
                        className="w-full py-3 px-4 pr-20 pb-8 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400 resize-none bg-white leading-relaxed"
                      />
                      <span className="absolute right-4 bottom-4 text-gray-400 text-sm">
                        {description.length}/300
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">3</div>
                  <h2 className="text-2xl font-bold text-gray-800">วัตถุดิบ และ อุปกรณ์</h2>
                </div>

                <div className="pl-11 flex flex-col gap-8">

                  {postAs === "store" && (
                    <div>
                      <div className="flex gap-2 mb-4">
                        <button
                          type="button"
                          id="mode-manual-btn"
                          onClick={() => setRecipeSourceMode("manual")}
                          className={`flex-1 py-2.5 rounded-md font-bold text-sm border transition-colors ${
                            recipeSourceMode === "manual"
                              ? "bg-[#71B254] text-white border-[#71B254]"
                              : "bg-white text-[#71B254] border-[#71B254] hover:bg-[#F4FAF1]"
                          }`}
                        >
                          พิมพ์สูตรเอง
                        </button>
                        <button
                          type="button"
                          id="mode-system-btn"
                          onClick={() => setRecipeSourceMode("system")}
                          className={`flex-1 py-2.5 rounded-md font-bold text-sm border transition-colors ${
                            recipeSourceMode === "system"
                              ? "bg-[#71B254] text-white border-[#71B254]"
                              : "bg-white text-[#71B254] border-[#71B254] hover:bg-[#F4FAF1]"
                          }`}
                        >
                          เลือกจากสูตรในระบบ
                        </button>
                      </div>

                      {recipeSourceMode === "system" && (
                        <div className="bg-[#FBFAF3] border border-[#71B254] rounded-md p-5 mb-2">
                          {!pickedRecipe ? (
                            <>
                              <label htmlFor="ingredient-search-input" className="block text-gray-700 text-sm font-semibold mb-2">
                                ใส่วัตถุดิบที่ร้านมี (คั่นด้วยจุลภาค) ระบบจะค้นหาสูตรที่ตรงกัน
                              </label>
                              <input
                                id="ingredient-search-input"
                                type="text"
                                placeholder="เช่น อกไก่, มะนาว, พริก"
                                value={ingredientSearch}
                                onChange={(e) => setIngredientSearch(e.target.value)}
                                className="w-full py-2.5 px-4 mb-4 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400 bg-white"
                              />

                              <div className="flex flex-col gap-2 min-h-[100px]">
                                {isLoadingRecipes ? (
                                  <div className="flex items-center justify-center py-4 text-sm text-[#71B254] font-semibold gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    กำลังโหลดข้อมูลสูตรอาหาร...
                                  </div>
                                ) : filteredSystemRecipes.length === 0 ? (
                                  <p className="text-sm text-gray-400 py-2">ไม่พบสูตรที่ตรงกัน ลองพิมพ์วัตถุดิบอื่น</p>
                                ) : (
                                  filteredSystemRecipes.map((r) => (
                                    <div
                                      key={r.id}
                                      className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white hover:border-[#71B254] transition-colors"
                                    >
                                      <div>
                                        <div className="font-bold text-gray-800 text-sm">{r.title}</div>
                                        <div className="text-xs text-gray-400">โดย {r.ownerName}</div>
                                      </div>
                                      <button
                                        type="button"
                                        id={`pick-recipe-${r.id}`}
                                        onClick={() => handlePickRecipe(r)}
                                        className="px-3 py-1.5 border border-[#71B254] text-[#71B254] rounded-md text-xs font-bold hover:bg-[#F4FAF1] transition-colors"
                                      >
                                        เลือก
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="bg-[#F4FAF1] border border-[#71B254] rounded-md p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-bold text-gray-800 text-sm">{pickedRecipe.title}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">ดึงส่วนผสมและขั้นตอนมาใส่ให้อัตโนมัติแล้ว — ปรับแก้ด้านล่างได้ตามต้องการ</div>
                                </div>
                                <button
                                  type="button"
                                  id="undo-pick-recipe-btn"
                                  onClick={handleUndoPickRecipe}
                                  className="text-red-500 hover:text-red-700 text-xs font-bold shrink-0"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                              <div className="mt-3 pt-3 border-t border-[#d6e8cd] flex items-center gap-2 text-xs text-gray-500">
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                สูตรต้นฉบับโดย <span className="font-bold text-gray-700">{pickedRecipe.ownerName}</span>
                                <span className="ml-auto text-gray-400">ID: {pickedRecipe.id}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {(postAs === "user" || recipeSourceMode === "manual" || pickedRecipe) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">วัตถุดิบ</h3>
                    <div className="hidden sm:flex gap-2 mb-2 text-sm font-bold text-gray-500 tracking-wider pl-1">
                      <div className="w-[150px]">หมวดหมู่</div>
                      <div className="w-[80px] text-center">ปริมาณ</div>
                      <div className="w-[160px]">หน่วย</div>
                      <div className="w-[190px]">ชื่อวัตถุดิบ</div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {ingredients.map((ing) => {
                        // 🌟 ระบบค้นหาสำหรับ Autocomplete โดยดึงข้อมูลจาก Database
                        const selectedCatData = dbCategoriesData.find(c => c.id === ing.category);
                        const suggestions = selectedCatData && ing.name.trim() !== ""
                          ? selectedCatData.ingredients.filter(i => i.toLowerCase().includes(ing.name.toLowerCase().trim()))
                          : [];

                        return (
                          <div key={ing.id} className="flex flex-wrap items-center gap-2">
                            <div className="relative w-full sm:w-[150px]">
                              <select
                                id={`ingredient-category-${ing.id}`}
                                value={ing.category}
                                onChange={(e) => handleIngredientChange(ing.id, "category", e.target.value)}
                                className="w-full py-2 pl-3 pr-8 border border-[#71B254] rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 bg-white cursor-pointer shadow-inner text-sm"
                              >
                                <option value="" disabled hidden>หมวดหมู่...</option>
                                {categoriesData.filter(c => c.id !== "Kitchen Tools").map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                                ))}
                              </select>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                              </div>
                            </div>

                            <input 
                              id={`ingredient-quantity-${ing.id}`}
                              type="text" 
                              placeholder="เช่น 2, 0.5" 
                              value={ing.quantity} 
                              onChange={(e) => handleIngredientChange(ing.id, "quantity", e.target.value)}
                              className="w-full sm:w-[80px] py-2 px-2 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-300 bg-white text-center shadow-inner text-sm"
                            />

                          <div className="relative w-full sm:w-[160px]">
                            <select
                              id={`ingredient-unit-${ing.id}`}
                              value={ing.unit}
                              onChange={(e) => handleIngredientChange(ing.id, "unit", e.target.value)}
                              className="w-full py-2 pl-3 pr-8 border border-[#71B254] rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 bg-white cursor-pointer shadow-inner text-sm"
                            >
                              <option value="" disabled hidden>เลือกหน่วย...</option>
                              <option value="g">กรัม (g)</option>
                              <option value="kg">กิโลกรัม (kg)</option>
                              <option value="ml">มิลลิลิตร (ml)</option>
                              <option value="l">ลิตร (l)</option>
                              <option value="piece">ตัว / ชิ้น / ฟอง</option>
                              <option value="head">หัว / ลูก / ผล</option>
                              <option value="slice">แว่น</option>
                              <option value="tablespoon">ช้อนโต๊ะ</option>
                              <option value="teaspoon">ช้อนชา</option>
                              <option value="cup">ถ้วยตวง</option>
                              <option value="pinch">หยิบมือ / เล็กน้อย</option>
                              <option value="leaf">ใบ / กลีบ / ฝัก / ต้น</option>
                              <option value="seed">เม็ด / เมล็ด</option>
                              <option value="pack">ห่อ / ถุง / ซอง</option>
                              <option value="bunch">กำ / มัด / พวง</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                            </div>
                          </div>

                          {/* 🌟 ช่องกรอกชื่อวัตถุดิบพร้อมระบบ Autocomplete (จาก PR #27) */}
                          <div className="relative w-full sm:w-[190px]">
                            <input 
                              id={`ingredient-name-${ing.id}`}
                              type="text" 
                              placeholder="เช่น อกไก่, แครอท" 
                              value={ing.name} 
                              onChange={(e) => handleIngredientChange(ing.id, "name", e.target.value)}
                              onFocus={() => setFocusedIngredientId(ing.id)}
                              onBlur={() => {
                                setFocusedIngredientId(null);
                                handleIngredientNameBlur(ing.category, ing.name);
                              }}
                              autoComplete="off"
                              className="w-full py-2 px-3 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-300 bg-white shadow-inner text-sm"
                            />
                            
                            {/* Dropdown แสดงผลการค้นหาวัตถุดิบ */}
                            {focusedIngredientId === ing.id && ing.category && ing.name.trim() !== "" && (
                              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#71B254] rounded-md shadow-lg max-h-48 overflow-y-auto z-50 scrollbar-thin">
                                {suggestions.length > 0 ? (
                                  suggestions.map((s, idx) => (
                                    <div
                                      key={idx}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleIngredientChange(ing.id, "name", s);
                                        setFocusedIngredientId(null);
                                        handleIngredientNameBlur(ing.category, s);
                                      }}
                                      className="px-3 py-2 text-sm text-gray-700 hover:bg-[#F4FAF1] hover:text-[#71B254] cursor-pointer transition-colors border-b border-gray-50 last:border-b-0"
                                    >
                                      {s}
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-3 py-3 text-sm text-gray-400 italic text-center">
                                    ไม่พบในหมวดหมู่นี้
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {ingredients.length > 1 && (
                            <button type="button" id={`remove-ingredient-btn-${ing.id}`} onClick={() => removeIngredient(ing.id)} className="text-red-400 hover:text-red-600 p-1 transition-colors shrink-0">
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })}
                      <button type="button" id="add-ingredient-btn" onClick={addIngredient} className="w-fit mt-2 px-4 py-2 border border-[#71B254] text-[#71B254] rounded-md font-bold hover:bg-[#F4FAF1] transition text-sm flex items-center gap-1 shrink-0 bg-white">
                        <span>+</span> เพิ่มวัตถุดิบ
                      </button>
                      <datalist id="existing-ingredients-list">
                        {existingIngredients.map(ingredient => (
                          <option key={ingredient.id} value={ingredient.name} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">อุปกรณ์พิเศษ <span className="text-sm font-normal text-gray-400">(ไม่บังคับ)</span></h3>
                    <div className="flex flex-col gap-3">
                      {equipments.map((eq) => (
                        <div key={eq.id} className="flex flex-wrap items-center gap-2">
                          <input 
                            id={`equipment-name-${eq.id}`}
                            type="text" 
                            placeholder="เช่น หม้อทอดไร้น้ำมัน, เครื่องปั่น" 
                            value={eq.name} 
                            onChange={(e) => handleEquipmentChange(eq.id, e.target.value)}
                            className="w-full sm:w-[350px] py-2 px-4 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-300 bg-white shadow-inner"
                          />
                          {equipments.length > 1 && (
                            <button type="button" id={`remove-equipment-btn-${eq.id}`} onClick={() => removeEquipment(eq.id)} className="text-red-400 hover:text-red-600 p-1 transition-colors shrink-0">
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" id="add-equipment-btn" onClick={addEquipment} className="w-fit mt-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-md font-bold hover:bg-gray-50 transition text-sm flex items-center gap-1 shrink-0 bg-white">
                        <span>+</span> เพิ่มอุปกรณ์
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div className="lg:col-span-1 flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">2</div>
                  <h2 className="text-2xl font-bold text-gray-800">รูปภาพและวิดีโอ</h2>
                </div>

                <div className="pl-11 flex flex-col gap-6">
                  
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-gray-600 text-sm font-semibold">รูปภาพหน้าปก</label>
                      <span className="text-xs font-bold text-gray-400">{coverImages.length}/4 รูป</span>
                    </div>
                    
                    <input 
                      id="cover-image-file-input"
                      type="file" 
                      accept="image/png, image/jpeg" 
                      multiple 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                    />
                    
                    {coverImages.length === 0 ? (
                      <div id="upload-cover-image-trigger" onClick={() => fileInputRef.current?.click()} className="h-[200px] w-full border border-[#71B254] rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4FAF1] transition bg-white p-4 text-center shadow-sm">
                        <svg className="mb-2 text-[#7FA9A0]" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <span className="font-bold text-gray-800 text-[12px] mb-1">อัปโหลดรูปภาพหน้าปก</span>
                        <span className="text-gray-400 text-[10px]">รองรับไฟล์ PNG, JPG (สูงสุด 4 รูป)</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="w-full h-[200px] border border-[#71B254] rounded-md overflow-hidden relative group shadow-sm bg-black flex items-center justify-center">
                          {/* รูปภาพที่กำลังแสดง */}
                          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL, next/image not supported */}
                          <img 
                            src={coverImages[currentImageIndex].previewUrl} 
                            alt={`Cover ${currentImageIndex + 1}`} 
                            className="w-full h-full object-cover transition-opacity duration-300" 
                          />
                          
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button type="button" id="remove-cover-img-btn" onClick={() => removeImage(currentImageIndex)} className="bg-red-500 text-white px-3 py-1.5 rounded-md font-bold shadow-md text-[10px] hover:bg-red-600">
                              ลบรูปนี้
                            </button>
                          </div>

                          {coverImages.length > 1 && (
                            <>
                              <button 
                                type="button" 
                                id="prev-cover-img-btn"
                                onClick={(e) => { e.stopPropagation(); prevImage(); }} 
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md text-gray-800 z-10 transition-all"
                              >
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
                              </button>
                              
                              <button 
                                type="button" 
                                id="next-cover-img-btn"
                                onClick={(e) => { e.stopPropagation(); nextImage(); }} 
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md text-gray-800 z-10 transition-all"
                              >
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                              </button>
                            </>
                          )}

                          {coverImages.length > 1 && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                              {coverImages.map((_, idx) => (
                                <div 
                                  key={idx} 
                                  onClick={() => setCurrentImageIndex(idx)} 
                                  className={`h-2 rounded-full cursor-pointer transition-all duration-300 shadow-sm ${
                                    currentImageIndex === idx ? 'w-5 bg-[#71B254]' : 'w-2 bg-white/70 hover:bg-white'
                                  }`} 
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {coverImages.length < 4 && (
                          <button 
                            type="button" 
                            id="add-more-cover-img-btn"
                            onClick={() => fileInputRef.current?.click()} 
                            className="w-full py-2.5 border border-dashed border-[#71B254] text-[#71B254] rounded-md text-sm font-bold hover:bg-[#F4FAF1] transition-colors flex items-center justify-center gap-2"
                          >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
                            เพิ่มรูปภาพอีก ({coverImages.length}/4)
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-2">
                    <label className="block text-gray-600 text-sm font-semibold mb-2">วิดีโอสอนทำอาหาร</label>
                    <div className="h-[140px] relative">
                      <input id="recipe-video-file-input" type="file" accept="video/mp4, video/quicktime" className="hidden" ref={videoInputRef} onChange={handleVideoUpload} />
                      {videoFile ? (
                        <div className="w-full h-full border border-[#71B254] rounded-md overflow-hidden relative group bg-black flex items-center justify-center shadow-sm">
                          <video src={videoFile.previewUrl} controls className="w-full h-full object-contain" />
                          <div className="absolute top-2 right-2 opacity-80 group-hover:opacity-100 transition-opacity z-10">
                            <button type="button" id="remove-recipe-video-btn" onClick={() => setVideoFile(null)} className="bg-red-500 text-white px-2.5 py-1.5 rounded-md font-bold shadow-sm text-xs hover:bg-red-600">
                              ลบวิดีโอ
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div id="upload-recipe-video-trigger" onClick={() => videoInputRef.current?.click()} className="w-full h-full border border-[#71B254] rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4FAF1] transition bg-white p-4 text-center">
                          <svg className="mb-2 text-[#7FA9A0]" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l4.55 1.45A2 2 0 0 0 23 17V7z"></path>
                          </svg>
                          <span className="font-bold text-gray-800 text-[12px] mb-1">อัปโหลดวิดีโอ</span>
                          <span className="text-gray-400 text-[10px]">รองรับไฟล์ MP4, MOV</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

          <div className="mb-8 relative z-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">4</div>
              <h2 className="text-2xl font-bold text-gray-800">ขั้นตอนการทำ</h2>
            </div>

            <div className="pl-11">
              <textarea 
                id="recipe-instructions-textarea"
                rows={8} 
                placeholder="อธิบายขั้นตอนการทำอาหารของคุณ... (เช่น 1. หั่นผักเตรียมไว้ 2. ตั้งกระทะให้ร้อน...)" 
                value={instructions} 
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full py-4 px-4 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400 resize-none leading-relaxed bg-white shadow-inner"
              />
            </div>
          </div>

          <div className="mb-10 relative z-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">5</div>
              <h2 className="text-2xl font-bold text-gray-800">การมองเห็นโพสต์</h2>
            </div>
            
            <div className="pl-11 grid grid-cols-1 md:grid-cols-3 gap-4">
              <label 
                className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  visibility === 'public' 
                    ? 'border-[#71B254] bg-[#F4FAF1]' 
                    : 'border-gray-200 bg-white hover:border-[#71B254] hover:bg-gray-50'
                }`}
              >
                <div className="pt-0.5 shrink-0">
                  <input id="visibility-public-radio" type="radio" name="visibility" value="public" checked={visibility === 'public'} onChange={() => setVisibility('public')} className="w-5 h-5 accent-[#71B254] cursor-pointer" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-base mb-1">สาธารณะ</div>
                  <div className="text-xs text-gray-500 leading-snug">ทุกคนเห็นได้ และร้านค้าสามารถนำไปจัดเซ็ตวัตถุดิบได้</div>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  visibility === 'protected'
                    ? 'border-[#71B254] bg-[#F4FAF1]'
                    : 'border-gray-200 bg-white hover:border-[#71B254] hover:bg-gray-50'
                }`}
              >
                <div className="pt-0.5 shrink-0">
                  <input id="visibility-protected-radio" type="radio" name="visibility" value="protected" checked={visibility === 'protected'} onChange={() => setVisibility('protected')} className="w-5 h-5 accent-[#71B254] cursor-pointer" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-base mb-1 flex items-center gap-2">
                    สาธารณะ (จำกัดสิทธิ์)
                  </div>
                  <div className="text-xs text-gray-500 leading-snug">ร้านค้าไม่สามารถเห็นสูตรอาหารนี้ได้</div>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  visibility === 'private'
                    ? 'border-[#71B254] bg-[#F4FAF1]'
                    : 'border-gray-200 bg-white hover:border-[#71B254] hover:bg-gray-50'
                }`}
              >
                <div className="pt-0.5 shrink-0">
                  <input id="visibility-private-radio" type="radio" name="visibility" value="private" checked={visibility === 'private'} onChange={() => setVisibility('private')} className="w-5 h-5 accent-[#71B254] cursor-pointer" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-base mb-1 flex items-center gap-2">
                    ส่วนตัว
                  </div>
                  <div className="text-xs text-gray-500 leading-snug">มีเพียงคุณเท่านั้นที่เห็นเมนูนี้ เก็บไว้ดูและจัดการเองได้</div>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8 border-t border-gray-100 relative z-20">
            <div className="lg:col-span-2">
              <button type="button" id="save-draft-btn" className="w-full py-3.5 border-2 border-[#71B254] text-[#71B254] rounded-md font-bold hover:bg-[#F4FAF1] hover:-translate-y-0.5 active:translate-y-0 transition-all text-center bg-white text-lg">
                บันทึกฉบับร่าง
              </button>
            </div>
            <div className="lg:col-span-1">
              <button 
                type="button" 
                id="publish-recipe-btn" 
                onClick={handleSubmitRecipe} 
                disabled={isSubmitting}
                className={`w-full py-3.5 rounded-md font-bold transition-all text-center text-lg shadow-md ${
                  isSubmitting 
                    ? "bg-gray-400 text-gray-100 cursor-not-allowed" 
                    : "bg-[#71B254] text-white hover:bg-[#5b9642] hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังอัปโหลดข้อมูล...
                  </span>
                ) : (
                  "เผยแพร่เมนูอาหาร"
                )}
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* 🌟 Popup แจ้งเตือนเมื่อกรอกวัตถุดิบผิดหมวดหมู่ */}
      {popupError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-sm w-[90%] flex flex-col items-center text-center transform scale-100 animate-scale-up">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">แจ้งเตือนหมวดหมู่</h3>
            <p className="text-gray-600 text-sm whitespace-pre-line mb-6 font-medium">
              {popupError}
            </p>
            <button
              onClick={() => setPopupError(null)}
              className="w-full py-3 bg-[#71B254] text-white rounded-xl font-bold hover:bg-[#5b9642] transition-colors shadow-md"
            >
              รับทราบ
            </button>
          </div>
        </div>
      )}
      {/* 🌟 Modal แจ้งเตือนเมื่อกรอกหมวดหมู่ผิด (จาก PR #27) */}
      {popupError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-sm w-[90%] flex flex-col items-center text-center transform scale-100 animate-scale-up">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">แจ้งเตือน</h3>
            <p className="text-gray-600 text-sm whitespace-pre-line mb-6 font-medium">
              {popupError}
            </p>
            <button
              onClick={() => setPopupError(null)}
              className="w-full py-3 bg-[#71B254] text-white rounded-xl font-bold hover:bg-[#5b9642] transition-colors shadow-md"
            >
              รับทราบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}