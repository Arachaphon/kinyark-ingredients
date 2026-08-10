# Manual Test Results - W1-9 Manage Ingredients (backend)

> ขอบเขต: backend เท่านั้น ห้ามแก้ไขหน้า frontend/UI และไม่เปลี่ยน logic ฝั่ง UI

## Positive Test Cases

### 1. สร้าง ingredient ใหม่ (POST /api/ingredients)
**ขั้นตอน (Steps):**
1. มีแล้ว
fetch('/api/ingredients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'ไข่ไก่', category: 'Dairy & Eggs' })
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
ไม่มี
fetch('/api/ingredients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'น้ำมันดอกทานตะวัน', category: 'Fats & Oils' })
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
2. ถ้า category "ไข่" ยังไม่มีในระบบ จะถูกสร้างขึ้นใหม่

**ผลลัพธ์ที่คาดหวัง (Expected Results):**
- [x] HTTP Status `200 OK` พร้อม `{ data: ingredient }`
- [x] Upsert: ถ้า ingredient ชื่อนี้มีอยู่แล้ว → อัปเดต category; ถ้ายังไม่มี → สร้างใหม่
- [x] category ถูก resolve (find หรือ create)

### 2. ใช้ categoryId ตรง ๆ
- **ขั้นตอน:** POST `/api/ingredients` body `{ "name": "พริก", "categoryId": 5 }`
1. มีแล้ว
fetch('/api/ingredients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'ไก่', categoryId: '1' })
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
ไม่มี
fetch('/api/ingredients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'ผงกะหรี่', categoryId: '13' })
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
- **ผลลัพธ์:** `200 OK`, ingredient ผูก categoryId=5 โดยไม่ query category name

### 3. GET รายการ ingredients (คงเดิม) / ค้นหา / filter category
- **ขั้นตอน:** 
// ทดสอบ filter ด้วย category
    fetch('/api/ingredients?category=Meat')                                                                    
      .then(res => res.json())                                                                                 
      .then(data => console.log(data))                                                                         
      .catch(err => console.error(err));                                                                        

// ทดสอบ search
    fetch('/api/ingredients?search=หมู')                                                                        
      .then(res => res.json())                                                                                 
      .then(data => console.log(data))                                                                         
      .catch(err => console.error(err));                                                                       
- **ผลลัพธ์:** `200 OK` ตามเดิม
---

## Negative Test Cases

### 6. POST ไม่มี name
- **ขั้นตอน:**
    fetch('/api/ingredients', {                                                                                
      method: 'POST',                                                                                          
      headers: { 'Content-Type': 'application/json' },                                                         
      body: JSON.stringify({})                                                                                 
    })                                                                                                         
      .then(async res => {                                                                                     
        const data = await res.json();                                                                         
        console.log(`%c[Result Case 6] Status: ${res.status}`, 'font-weight: bold; color: #E74C3C;', data);    
      })                                                                                                       
      .catch(err => console.error(err)); 
- **ผลลัพธ์:** `400 Bad Request`

### 7. POST ไม่มี category ไม่ตรง เช่น ไข่ อยุ่หมวด ผัก
- **ขั้นตอน:** 
    fetch('/api/ingredients', {                                                                                
      method: 'POST',                                                                                          
      headers: { 'Content-Type': 'application/json' },                                                         
      body: JSON.stringify({ name: "ไข่ไก่", categoryId: 3 })                                                    
    })                                                                                                         
      .then(async res => {                                                                                     
        const data = await res.json();                                                                         
        console.log(`Status: ${res.status}`, data);                                                            
      });        
- **ผลลัพธ์:** 
    Status: 400 {                                                                                              
      "error": "Ingredient \"ไข่ไก่\" already exists under category \"Dairy & Eggs\""                            
    }   
 ### 8. ทดสอบกรองข้อมูลด้วยชื่อหมวดหมู่ที่ไม่มีอยู่จริง (Empty Array)                                                       
                                                                                                               
  กรณีใส่ชื่อหมวดหมู่ที่ระบบไม่รู้จัก เช่น ?category=UnkownCategory ระบบจะต้องทำงานได้ตามปกติและส่งอาร์เรย์ว่างกลับมาโดยไม่ระเบิดเป็น   
  Error 500                                                                                                    
                                                                                                               
    fetch('/api/ingredients?category=McDonalds')                                                               
      .then(res => res.json())                                                                                 
      .then(data => console.log('%c[Test Unknown Category]', 'font-weight: bold; color: #2ECC71;', data));     
                                                                                                               
  • ผลลัพธ์ที่คาดหวัง: สถานะ 200 OK พร้อมข้อมูล { data: [] }     
---