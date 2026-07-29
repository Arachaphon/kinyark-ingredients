# 🥗 Ingredients API Documentation (คู่มือการใช้งานสำหรับ Frontend)

เอกสารฉบับนี้จัดทำขึ้นเพื่อให้ทีม **Frontend** นำ API วัตถุดิบ (Ingredients) ไปพัฒนาต่อ ไม่ว่าจะเป็นการทำ Custom Dropdown, Autocomplete, หน้ารายการวัตถุดิบ หรือหน้ากรอกสูตรอาหาร

---

## 📁 ตำแหน่งไฟล์ซอร์สโค้ดใน Backend (Source Files)

* **ไฟล์หลัก (Get All / Filter / Search):** `src/app/api/ingredients/route.ts`
* **ไฟล์รายตัวตาม ID (Get By ID Path):** `src/app/api/ingredients/[id]/route.ts`

---

## 📡 รายละเอียด Endpoints & ตัวอย่างการใช้งาน

### 1. ดึงวัตถุดิบทั้งหมด (Get All Ingredients)
* **Endpoint:** `GET /api/ingredients`
* **รายละเอียด:** ดึงวัตถุดิบทั้งหมดในฐานข้อมูล เรียงตามชื่อ (A-Z, ก-ฮ) พร้อมข้อมูลหมวดหมู่ (`category`)

#### 💻 ตัวอย่างโค้ด Frontend (TypeScript / React):
```tsx
const res = await fetch('/api/ingredients', { cache: 'no-store' });
const { data } = await res.json();
console.log(data);
```

#### 📦 ตัวอย่าง Response:
```json
{
  "data": [
    {
      "id": 160,
      "name": "หมู",
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Meat"
      }
    },
    {
      "id": 228,
      "name": "มะเขือเทศ",
      "categoryId": 3,
      "category": {
        "id": 3,
        "name": "Vegetables"
      }
    }
  ]
}
```

---

### 2. ดึงวัตถุดิบตามหมวดหมู่ (Get Ingredients by Category)
สามารถระบุได้ทั้ง **Category ID** หรือ **Category Name**

#### 2.1 ระบุด้วย Category ID (`categoryId`)
* **Endpoint:** `GET /api/ingredients?categoryId={id}`
* **ตัวอย่าง URL:** `/api/ingredients?categoryId=3`

#### 2.2 ระบุด้วย Category Name (`category`)
* **Endpoint:** `GET /api/ingredients?category={name}`
* **ตัวอย่าง URL:** `/api/ingredients?category=Meat` หรือ `/api/ingredients?category=Vegetables`

#### 💻 ตัวอย่างโค้ด Frontend (Fetch by Category Name):
```tsx
const fetchVegetables = async () => {
  const res = await fetch('/api/ingredients?category=Vegetables');
  const { data } = await res.json();
  return data;
};
```

---

### 3. ดึงวัตถุดิบรายตัวตาม ID (Get Ingredient by ID)

#### 3.1 แบบ RESTful Path Parameter (แนะนำ)
* **Endpoint:** `GET /api/ingredients/{id}`
* **ไฟล์ Backend:** `src/app/api/ingredients/[id]/route.ts`
* **ตัวอย่าง URL:** `/api/ingredients/160`

#### 3.2 แบบ Query Parameter
* **Endpoint:** `GET /api/ingredients?id={id}`
* **ตัวอย่าง URL:** `/api/ingredients?id=160`

#### 📦 ตัวอย่าง Response (กรณีพบข้อมูล):
```json
{
  "data": {
    "id": 160,
    "name": "หมู",
    "categoryId": 1,
    "category": {
      "id": 1,
      "name": "Meat"
    }
  }
}
```

#### 📦 ตัวอย่าง Response (กรณีไม่พบข้อมูล - Status 404):
```json
{
  "error": "Ingredient not found"
}
```

---

### 4. ค้นหาวัตถุดิบตามคำค้นหา (Search Ingredients by Name)
* **Endpoint:** `GET /api/ingredients?search={keyword}`
* **ตัวอย่าง URL:** `/api/ingredients?search=หมู`

#### 💻 ตัวอย่างโค้ด Frontend (Autocomplete / Live Search):
```tsx
const searchIngredients = async (keyword: string) => {
  if (!keyword.trim()) return [];
  const res = await fetch(`/api/ingredients?search=${encodeURIComponent(keyword)}`);
  const { data } = await res.json();
  return data; // คืนค่า array ของวัตถุดิบที่ตรงกับคำค้นหา
};
```

---

## 💡 ตัวอย่าง React Hook สำหรับ Frontend นำไปใช้งานง่ายๆ

```tsx
import { useState, useEffect } from 'react';

export interface Ingredient {
  id: number;
  name: string;
  categoryId: number | null;
  category?: {
    id: number;
    name: string;
  } | null;
}

export function useIngredients(categoryName?: string) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = categoryName 
      ? `/api/ingredients?category=${encodeURIComponent(categoryName)}` 
      : '/api/ingredients';

    fetch(url, { cache: 'no-store' })
      .then((res) => res.json())
      .then((resData) => setIngredients(resData.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categoryName]);

  return { ingredients, loading };
}
```
