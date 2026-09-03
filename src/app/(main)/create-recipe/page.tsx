"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar"; 
import Link from "next/link";
import type { Map, Marker, LeafletMouseEvent } from "leaflet";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { uploadRecipeMedia, isVideoFile, validateVideoFile, validateImageFile } from "@/lib/storage";

type LeafletModule = typeof import("leaflet");

// =========================================
// 🍱 แมปหมวดหมู่เพื่อการแสดงผลภาษาไทย และ Emoji
// =========================================
const CATEGORY_META: Record<string, { name: string; emoji: string }> = {
  'Meat':                   { name: 'เนื้อสัตว์',          emoji: '🥩' },
  'Seafood':                { name: 'อาหารทะเล',         emoji: '🦐' },
  'Vegetables':             { name: 'ผัก',                 emoji: '🥦' },
  'Fruits':                 { name: 'ผลไม้',               emoji: '🍎' },
  'Kitchen Tools':          { name: 'อุปกรณ์ทำครัว',      emoji: '🍳' },
  'Grains, Pasta & Baking': { name: 'ธัญพืช แป้ง และเบเกอรี่', emoji: '🌾' },
  'Dairy & Eggs':           { name: 'ไข่และผลิตภัณฑ์จากนม', emoji: '🥚' },
  'Condiments & Sauces':    { name: 'เครื่องปรุงและซอส',    emoji: '🧂' },
  'Spices & Herbs':         { name: 'เครื่องเทศและสมุนไพร',  emoji: '🌿' },
  'Nuts & Seeds':           { name: 'ถั่วและเมล็ดพืช',        emoji: '🥜' },
  'Fats & Oils':            { name: 'น้ำมันและไขมัน',       emoji: '🫒' },
  'Liquids & Beverages':    { name: 'เครื่องดื่มและของเหลว', emoji: '🍺' },
  'Others':                 { name: 'อื่นๆ',                  emoji: '📦' },
};





type SystemRecipe = {
  id: string;
  title: string;
  ownerName: string;
  matchTags: string[];
  ingredients: { category: string; name: string; quantity: string; unit: string }[];
  instructions: string;
};

type UploadedMedia = {
  file?: File;
  previewUrl: string;
  url?: string;
  uploading?: boolean;
  error?: string;
};

const SAMPLE_SYSTEM_RECIPES: SystemRecipe[] = [
  {
    id: "r1",
    title: "ต้มยำอกไก่มะนาว",
    ownerName: "user_นุช88",
    matchTags: ["อกไก่", "มะนาว", "พริก"],
    ingredients: [
      { category: "Meat", name: "อกไก่", quantity: "300", unit: "กรัม" },
      { category: "Fruits", name: "มะนาว", quantity: "2", unit: "ชิ้น/ตัว/ฟอง" },
      { category: "Vegetables", name: "พริกขี้หนู", quantity: "5", unit: "ชิ้น/ตัว/ฟอง" },
    ],
    instructions: "1. ต้มน้ำให้เดือด ใส่ตะไคร้ ข่า ใบมะกรูด\n2. ใส่อกไก่หั่นพอดีคำ ต้มจนสุก\n3. ปรุงรสด้วยน้ำปลา น้ำมะนาว พริกขี้หนูทุบ",
  },
  {
    id: "r2",
    title: "สลัดอกไก่ซอสงา",
    ownerName: "chef_ple",
    matchTags: ["อกไก่", "ผักกาด"],
    ingredients: [
      { category: "Meat", name: "อกไก่", quantity: "250", unit: "กรัม" },
      { category: "Vegetables", name: "ผักกาดแก้ว", quantity: "1", unit: "ชิ้น/ตัว/ฟอง" },
    ],
    instructions: "1. ย่างอกไก่จนสุก พักให้เย็นแล้วหั่นเป็นเส้น\n2. จัดผักกาดใส่จาน วางอกไก่ด้านบน\n3. ราดซอสงาก่อนเสิร์ฟ",
  },
  {
    id: "r3",
    title: "แกงเขียวหวานไก่",
    ownerName: "user_ต้น",
    matchTags: ["อกไก่", "พริก", "กะทิ"],
    ingredients: [
      { category: "Meat", name: "อกไก่", quantity: "300", unit: "กรัม" },
      { category: "Spices and Herbs", name: "พริกแกงเขียวหวาน", quantity: "3", unit: "ช้อนโต๊ะ" },
      { category: "Others", name: "กะทิ", quantity: "400", unit: "มิลลิลิตร" },
    ],
    instructions: "1. ผัดพริกแกงกับกะทิหัวจนแตกมัน\n2. ใส่อกไก่ ผัดให้สุก\n3. เติมกะทิที่เหลือ ปรุงรส ใส่ใบโหระพา",
  },
];

export default function CreateRecipePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  const uploadPromisesRef = useRef<Record<string, Promise<{ url: string | null; error?: string }>>>({});

  const uploadFile = (file: File, cacheKey?: string): Promise<{ url: string | null; error?: string }> => {
    const key = cacheKey ?? `${file.name}${file.size}`;
    const existing = uploadPromisesRef.current[key];
    if (existing) return existing;

    const promise = (async () => {
      if (!user) return { url: null, error: "ยังไม่ได้ล็อกอิน" };
      const result = await uploadRecipeMedia(createClient(), file, user.id);
      if (result.error) return { url: null, error: result.error };
      return { url: result.url };
    })();

    uploadPromisesRef.current[key] = promise;
    return promise;
  };

  const validateMediaFile = (file: File): string | null => {
    const validation = isVideoFile(file) ? validateVideoFile(file) : validateImageFile(file);
    return validation.valid ? null : validation.error;
  };

  const [postAs, setPostAs] = useState<"user" | "store">("user");
  const [userRole, setUserRole] = useState<string>("USER");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  
  const [videoFile, setVideoFile] = useState<UploadedMedia | null>(null);
  const [coverImages, setCoverImages] = useState<UploadedMedia[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const [visibility, setVisibility] = useState<"public" | "protected" | "private">("public");
  const [storeVisibility, setStoreVisibility] = useState<"public" | "protected" | "private">("public");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [ingredients, setIngredients] = useState([
    { id: 1, category: "", name: "", quantity: "", unit: "กรัม" }
  ]);

  const [setIngredientsList, setSetIngredientsList] = useState([
    { id: 1, category: "", name: "", quantity: "", unit: "กรัม" }
  ]);

  const [equipments, setEquipments] = useState([
    { id: 1, name: "" }
  ]);

  const [existingIngredients, setExistingIngredients] = useState<{id: number, name: string, category?: {id: number, name: string}}[]>([]);
  const [popupError, setPopupError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [focusedIngredientId, setFocusedIngredientId] = useState<number | null>(null);

  // 🌟 สร้างหมวดหมู่ที่ดึงข้อมูลวัตถุดิบสดๆ จาก Database 100%
  const dbCategoriesData = React.useMemo(() => {
    const map: Record<string, { id: string; name: string; emoji: string; ingredients: string[] }> = {};

    // 1. ลงทะเบียนหมวดหมู่หลักทั้งหมดจาก CATEGORY_META ก่อน
    Object.entries(CATEGORY_META).forEach(([catKey, meta]) => {
      map[catKey] = {
        id: catKey,
        name: meta.name,
        emoji: meta.emoji,
        ingredients: [],
      };
    });

    // 2. เติมวัตถุดิบที่ดึงจาก Database เข้าตามหมวดหมู่สดๆ
    for (const item of existingIngredients) {
      const catKey = item.category?.name ?? "Others";
      if (!map[catKey]) {
        map[catKey] = {
          id: catKey,
          name: CATEGORY_META[catKey]?.name ?? catKey,
          emoji: CATEGORY_META[catKey]?.emoji ?? "📦",
          ingredients: [],
        };
      }
      if (!map[catKey].ingredients.includes(item.name)) {
        map[catKey].ingredients.push(item.name);
      }
    }

    return Object.values(map);
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
  const [contactInfo, setContactInfo] = useState("");
  
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
  }, [postAs, isMounted, pinCoord]);

  useEffect(() => {
    if (recipeSourceMode === "system" && availableRecipes === SAMPLE_SYSTEM_RECIPES) {
      const fetchRealRecipes = async () => {
        setIsLoadingRecipes(true);
        try {
          const response = await fetch('/api/recipes?publicOnly=true'); 
          if (!response.ok) throw new Error("API endpoint not ready or not found");
          
          const body = await response.json();
          if (body && body.data && body.data.length > 0) {
            const mappedRecipes: SystemRecipe[] = body.data.map((r: {
              id: string;
              recipeName: string;
              user?: { username: string };
              recipeIngredients?: Array<{
                quantity?: number | string;
                unit?: string;
                ingredient?: { name: string; category?: { name: string } };
              }>;
            }) => {
              // Map categories to match the frontend selection if possible
              return {
                id: r.id,
                title: r.recipeName,
                ownerName: r.user?.username || "Unknown",
                matchTags: r.recipeIngredients?.map((ri) => ri.ingredient?.name || "") || [],
                ingredients: r.recipeIngredients?.map((ri) => {
                  let mappedCategory = "Others";
                  if (ri.ingredient?.category?.name) {
                    mappedCategory = ri.ingredient.category.name;
                  }
                  return {
                    category: mappedCategory,
                    name: ri.ingredient?.name || "",
                    quantity: String(ri.quantity || 1),
                    unit: ri.unit || "g"
                  };
                }) || [],
                instructions: (r as { instructions?: string }).instructions || "1. เตรียมวัตถุดิบทั้งหมด\n2. ปรุงตามสูตร\n3. จัดใส่จานพร้อมเสิร์ฟ"
              };
            });
            setAvailableRecipes(mappedRecipes);
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

    const newMedia = filesToAdd.map(file => {
      const fileError = validateMediaFile(file);
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        uploading: !fileError,
        error: fileError ?? undefined,
      } as UploadedMedia;
    });

    setShopIngredientImages(prev => {
      const updated = [...prev, ...newMedia];
      setShopImageIndex(updated.length - 1);
      return updated;
    });

    newMedia.forEach((media) => {
      if (media.error || !media.file) return;
      const { previewUrl } = media;
      uploadFile(media.file, previewUrl).then((res) => {
        setShopIngredientImages(prev =>
          prev.map(m =>
            m.previewUrl === previewUrl
              ? { ...m, url: res.url ?? undefined, uploading: false, error: res.error }
              : m
          )
        );
      });
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
    if (!file) return;

    const fileError = validateMediaFile(file);
    setShopIngredientVideo({
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: !fileError,
      error: fileError ?? undefined,
    });

    if (!fileError) {
      uploadFile(file).then((res) => {
        setShopIngredientVideo(prev =>
          prev ? { ...prev, url: res.url ?? undefined, uploading: false, error: res.error } : prev
        );
      });
    }

    if (shopVideoInputRef.current) shopVideoInputRef.current.value = "";
  };

  const filteredSystemRecipes = (() => {
    const terms = ingredientSearch.toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
    if (terms.length === 0) return availableRecipes;

    const isMatch = (text: string, term: string) => {
      let matched = text.includes(term);
      // Special case: Searching for "พริก" (Chili) should not match "พริกไทย" (Pepper)
      if (matched && term === "พริก") {
        const textWithoutPepper = text.replace(/พริกไทย/g, "");
        matched = textWithoutPepper.includes("พริก");
      }
      return matched;
    };

    return availableRecipes.filter(r => {
      return terms.some(term => {
        const foundInTags = r.matchTags && r.matchTags.some(tag => isMatch(tag.toLowerCase(), term));
        const foundInIngredients = r.ingredients && r.ingredients.some(ing => isMatch(ing.name.toLowerCase(), term));
        const foundInTitle = r.title && isMatch(r.title.toLowerCase(), term);
        return foundInTags || foundInIngredients || foundInTitle;
      });
    });
  })();

  const handlePickRecipe = async (recipe: SystemRecipe) => {
    setPickedRecipe(recipe);
    setIngredients(recipe.ingredients.map((ing, idx) => ({ id: idx + 100, ...ing })));
    setInstructions(recipe.instructions);
    setTitle(recipe.title);

    try {
      const res = await fetch(`/api/recipes/${recipe.id}`);
      if (res.ok) {
        const fullRecipe = (await res.json()).data;
        if (fullRecipe.description) setDescription(fullRecipe.description);
        if (fullRecipe.instructions) setInstructions(fullRecipe.instructions);
        if (fullRecipe.recipeIngredients && fullRecipe.recipeIngredients.length > 0) {
          setIngredients(fullRecipe.recipeIngredients.map((ri: { ingredient?: { name: string; category?: { name: string } }; quantity?: number | string | null; unit?: string | null }, idx: number) => ({
            id: idx + 100,
            category: ri.ingredient?.category?.name || "Others",
            name: ri.ingredient?.name || "",
            quantity: String(ri.quantity ?? ""),
            unit: ri.unit || "กรัม",
          })));
        }
        if (fullRecipe.images && fullRecipe.images.length > 0) {
          setCoverImages(fullRecipe.images.map((img: { imageUrl: string }) => ({ previewUrl: img.imageUrl })));
        }
        if (fullRecipe.videos && fullRecipe.videos.length > 0) {
          setVideoFile({ previewUrl: fullRecipe.videos[0].videoUrl });
        }
        if (fullRecipe.equipmentItems && fullRecipe.equipmentItems.length > 0) {
          setEquipments(fullRecipe.equipmentItems.map((eq: { name: string }, idx: number) => ({ id: idx + 200, name: eq.name })));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUndoPickRecipe = () => {
    setPickedRecipe(null);
    setIngredients([{ id: 1, category: "", name: "", quantity: "", unit: "กรัม" }]);
    setInstructions("");
    setTitle("");
    setDescription("");
    setCoverImages([]);
    setVideoFile(null);
    setEquipments([{ id: 1, name: "" }]);
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

    // 🌟 ค้นหาข้อมูลจาก Database ตรงๆ 100%
    const dbMatch = existingIngredients.find(
      (ing) => ing.name.toLowerCase() === typedName.toLowerCase().trim()
    );

    if (dbMatch && dbMatch.category) {
      const dbCatName = dbMatch.category.name;
      const dbCatMetaName = CATEGORY_META[dbCatName]?.name || dbCatName;

      if (dbCatName !== selectedCategory && dbCatMetaName !== selectedCategory) {
        setPopupError(`คุณกรอกวัตถุดิบผิดหมวดหมู่!\n\n"${typedName}" จัดอยู่ในหมวดหมู่ "${dbCatMetaName}" ใน Database\nกรุณาแก้ไขหมวดหมู่ให้ถูกต้องครับ`);
      }
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { id: Date.now(), category: "", name: "", quantity: "", unit: "กรัม" }]);
  };

  const removeIngredient = (idToRemove: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((item) => item.id !== idToRemove));
    }
  };

  const handleSetIngredientChange = (id: number, field: "category" | "name" | "quantity" | "unit", value: string) => {
    setSetIngredientsList(
      setIngredientsList.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addSetIngredient = () => {
    setSetIngredientsList([...setIngredientsList, { id: Date.now(), category: "", name: "", quantity: "", unit: "กรัม" }]);
  };

  const removeSetIngredient = (idToRemove: number) => {
    if (setIngredientsList.length > 1) {
      setSetIngredientsList(setIngredientsList.filter((item) => item.id !== idToRemove));
    }
  };

  const copyRecipeIngredientsToSet = () => {
    if (ingredients.length > 0 && ingredients.some(i => i.name.trim() !== "")) {
      const copied = ingredients.map(i => ({ ...i, id: Date.now() + Math.random() }));
      setSetIngredientsList(copied);
    } else if (pickedRecipe && pickedRecipe.ingredients.length > 0) {
      const copied = pickedRecipe.ingredients.map(i => ({
        id: Date.now() + Math.random(),
        category: i.category || "",
        name: i.name,
        quantity: i.quantity,
        unit: i.unit
      }));
      setSetIngredientsList(copied);
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

    const newMedia = filesToAdd.map(file => {
      const fileError = validateMediaFile(file);
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        uploading: !fileError,
        error: fileError ?? undefined,
      } as UploadedMedia;
    });

    setCoverImages(prev => {
      const updated = [...prev, ...newMedia];
      setCurrentImageIndex(updated.length - 1);
      return updated;
    });

    newMedia.forEach((media) => {
      if (media.error || !media.file) return;
      const { previewUrl } = media;
      uploadFile(media.file, previewUrl).then((res) => {
        setCoverImages(prev =>
          prev.map(m =>
            m.previewUrl === previewUrl
              ? { ...m, url: res.url ?? undefined, uploading: false, error: res.error }
              : m
          )
        );
      });
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
    if (!file) return;

    const fileError = validateMediaFile(file);
    setVideoFile({
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: !fileError,
      error: fileError ?? undefined,
    });

    if (!fileError) {
      uploadFile(file).then((res) => {
        setVideoFile(prev =>
          prev ? { ...prev, url: res.url ?? undefined, uploading: false, error: res.error } : prev
        );
      });
    }

    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const [missingFields, setMissingFields] = useState<string[]>([]);

  const validateForm = (isDraft: boolean): boolean => {
    setSubmitError(null);
    setMissingFields([]);

    const missing: string[] = [];

    if (!title.trim()) missing.push("title");
    if (!isDraft && !description.trim()) missing.push("description");
    if (!isDraft && !instructions.trim()) missing.push("instructions");
    if (!isDraft && coverImages.length === 0) missing.push("coverImages");

    const validIngredients = ingredients.filter(i => i.name.trim() !== "");
    if (validIngredients.length === 0 || validIngredients.some(i => !String(i.quantity).trim() || parseFloat(i.quantity) <= 0 || !i.unit.trim())) {
      missing.push("ingredients");
    }

    if (postAs === "store") {
      if (!shopName.trim()) missing.push("shopName");
      if (!sellingPrice || parseFloat(sellingPrice) <= 0) missing.push("sellingPrice");
      if (!isDraft && !shopDescription.trim()) missing.push("shopDescription");
      if (!isDraft && !shopLocation.trim()) missing.push("shopLocation");
      if (!isDraft && !contactInfo.trim()) missing.push("contactInfo");
      if (!isDraft && shopIngredientImages.length === 0) missing.push("shopIngredientImages");

      const validSetIngredients = setIngredientsList.filter(i => i.name.trim() !== "");
      if (!isDraft) {
        if (validSetIngredients.length === 0 || validSetIngredients.some(i => !String(i.quantity).trim() || parseFloat(i.quantity) <= 0 || !i.unit.trim())) {
          missing.push("setIngredients");
        }
      } else {
        if (validSetIngredients.length > 0 && validSetIngredients.some(i => !String(i.quantity).trim() || parseFloat(i.quantity) <= 0 || !i.unit.trim())) {
          missing.push("setIngredients");
        }
      }
    }

    if (missing.length > 0) {
      setMissingFields(missing);
      setSubmitError("กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง (รวมถึงรูปภาพอย่างน้อย 1 รูป)");
      
      const firstMissingId = missing[0];
      const element = document.getElementById(`form-field-${firstMissingId}`) || document.getElementById("publish-recipe-btn");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }

    return true;
  };

  const handleSaveDraft = async () => {
    submitForm(true);
  };

  const handleSubmitRecipe = async () => {
    submitForm(false);
  };

  const submitForm = async (isDraft: boolean = false) => {
    if (!validateForm(isDraft)) return;

    const validIngredients = ingredients.filter(i => i.name.trim() !== "");
    const validEquipments = equipments.filter(e => e.name.trim() !== "");

    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        recipeName: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        visibility: isDraft ? "draft" : visibility,
        postAs,
        ingredients: validIngredients.map(i => ({
          name: i.name.trim(),
          quantity: parseFloat(i.quantity) || 1,
          unit: i.unit.trim(),
          category: i.category || undefined
        })),
        equipmentItems: validEquipments.map(e => ({ name: e.name.trim() })),
      };

      if (pickedRecipe) {
        payload.systemRecipeId = pickedRecipe.id;
      }

      // ⚠️ Upload files (อัปโหลดพร้อมกัน; ไฟล์ที่อัปโหลดไว้แล้วใช้ URL เดิม)
      const uploadBatch = async (
        mediaList: UploadedMedia[],
        label: string
      ): Promise<string[] | null> => {
        const results = await Promise.all(
          mediaList.map(async (media) => {
            if (media.url) return { url: media.url, error: null };
            if (!media.file) return { url: media.previewUrl, error: null };
            if (media.error) return { url: null, error: media.error };
            const r = await uploadFile(media.file, media.previewUrl);
            return { url: r.url ?? null, error: r.error ?? null };
          })
        );
        const failed = results.find((r) => r.error);
        if (failed) {
          setSubmitError(`${label}ล้มเหลว: ${failed.error}`);
          setIsSubmitting(false);
          return null;
        }
        return results.map((r) => r.url).filter((u): u is string => !!u);
      };

      const uploadedRecipeImages = await uploadBatch(coverImages, "อัปโหลดรูปภาพสูตร");
      if (uploadedRecipeImages === null) return;

      if (uploadedRecipeImages.length > 0) {
        payload.featuredImageUrl = uploadedRecipeImages[0];
        payload.images = uploadedRecipeImages;
      }

      const uploadedRecipeVideos: string[] = [];
      if (videoFile) {
        if (videoFile.url) {
          uploadedRecipeVideos.push(videoFile.url);
        } else if (!videoFile.file) {
          uploadedRecipeVideos.push(videoFile.previewUrl);
        } else {
          const result = await uploadFile(videoFile.file, videoFile.previewUrl);
          if (result.error) {
            setSubmitError(`อัปโหลดวิดีโอสูตรล้มเหลว: ${result.error}`);
            setIsSubmitting(false);
            return;
          }
          if (result.url) uploadedRecipeVideos.push(result.url);
        }
      }

      if (uploadedRecipeVideos.length > 0) {
        payload.videos = uploadedRecipeVideos;
      }

      // ข้อมูลเฉพาะร้านค้า (Store)
      if (postAs === "store") {
        const storeImages = await uploadBatch(shopIngredientImages, "อัปโหลดรูปร้านค้า");
        if (storeImages === null) return;

        const storeVideos: string[] = [];
        if (shopIngredientVideo) {
          if (shopIngredientVideo.url) {
            storeVideos.push(shopIngredientVideo.url);
          } else if (!shopIngredientVideo.file) {
            storeVideos.push(shopIngredientVideo.previewUrl);
          } else {
            const result = await uploadFile(shopIngredientVideo.file, shopIngredientVideo.previewUrl);
            if (result.error) {
              setSubmitError(`อัปโหลดวิดีโอร้านค้าล้มเหลว: ${result.error}`);
              setIsSubmitting(false);
              return;
            }
            if (result.url) storeVideos.push(result.url);
          }
        }

        const validSetIngredients = setIngredientsList.filter(i => i.name.trim() !== "").map(i => ({
          name: i.name.trim(),
          quantity: parseFloat(i.quantity) || 1,
          unit: i.unit.trim(),
          category: i.category || undefined
        }));

        payload.store = {
          storeName: shopName.trim(),
          sellingPrice: parseFloat(sellingPrice) || 0,
          storeDescription: shopDescription.trim(),
          storeLocation: shopLocation.trim(),
          contactInfo: contactInfo.trim(),
          storeImages,
          storeVideos,
          setIngredients: validSetIngredients.length > 0 ? validSetIngredients : undefined,
          visibility: storeVisibility,
        };
      }

      // ยิง API ส่งข้อมูล
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), 
      });

      if (!response.ok) {
        const rawBody = await response.text();
        let data: Record<string, unknown> = {};
        try {
          data = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          data = { error: rawBody || `HTTP ${response.status}` };
        }
        console.error("API Error Response:", data, `Status: ${response.status}`);
        const apiError = data.error;
        const errorMessage =
          typeof apiError === "string"
            ? apiError
            : apiError
              ? JSON.stringify(apiError)
              : rawBody || `เกิดข้อผิดพลาด (HTTP ${response.status})`;
        setSubmitError(errorMessage || "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาตรวจสอบและลองใหม่อีกครั้ง");
        setIsSubmitting(false);
        return;
      }

      const result = await response.json();
      console.log("Success:", result);
      
      if (isDraft) {
        router.push("/my-recipe");
      } else if (result.data?.id) {
        router.push(`/recipe/${result.data.id}`);
      } else {
        router.push("/home");
      }
      
    } catch (error) {
      console.error("Error submitting recipe:", error);
      setSubmitError("เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่อีกครั้ง");
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
                  <div id="form-field-shopName">
                    <label htmlFor="shop-name-input" className="block text-gray-700 text-lg mb-2 font-semibold">
                      ชื่อร้านค้า <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="shop-name-input"
                      type="text"
                      placeholder="เช่น ครัวคุณยาย เชียงราย"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className={`w-full py-3 px-4 border rounded-md focus:outline-none focus:ring-1 text-gray-700 placeholder-gray-400 bg-white ${
                        missingFields.includes("shopName")
                          ? "border-red-500 bg-red-50/20"
                          : "border-[#71B254] focus:ring-[#71B254]"
                      }`}
                    />
                  </div>
                  <div id="form-field-sellingPrice">
                    <label htmlFor="shop-price-input" className="block text-gray-700 text-lg mb-2 font-semibold">
                      ราคาขาย (บาท) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="shop-price-input"
                      type="text"
                      placeholder="เช่น 65"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className={`w-full py-3 px-4 border rounded-md focus:outline-none focus:ring-1 text-gray-700 placeholder-gray-400 bg-white ${
                        missingFields.includes("sellingPrice")
                          ? "border-red-500 bg-red-50/20"
                          : "border-[#71B254] focus:ring-[#71B254]"
                      }`}
                    />
                  </div>
                </div>

                <div id="form-field-shopDescription">
                  <label htmlFor="shop-desc-textarea" className="block text-gray-700 text-lg mb-2 font-semibold">
                    คำอธิบาย (สำหรับเซ็ตขาย) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="shop-desc-textarea"
                    rows={3}
                    placeholder="อธิบายเซ็ตวัตถุดิบหรือจุดเด่นของร้านสั้นๆ..."
                    value={shopDescription}
                    onChange={(e) => setShopDescription(e.target.value)}
                    maxLength={300}
                    className={`w-full py-3 px-4 border rounded-md focus:outline-none focus:ring-1 text-gray-700 placeholder-gray-400 resize-none bg-white leading-relaxed ${
                      missingFields.includes("shopDescription")
                        ? "border-red-500 bg-red-50/20"
                        : "border-[#71B254] focus:ring-[#71B254]"
                    }`}
                  />
                </div>

<div className="pt-4" id="form-field-setIngredients">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-700">
                      วัตถุดิบในเซ็ทอาหาร <span className="text-red-500">*</span> <span className="text-gray-400 font-normal text-sm">(ที่รวมในราคาขายจริง)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={copyRecipeIngredientsToSet}
                      className="px-3 py-1.5 text-xs font-bold bg-[#F4FAF1] text-[#71B254] border border-[#71B254] rounded-md hover:bg-[#71B254] hover:text-white transition flex items-center gap-1"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      คัดลอกวัตถุดิบจากสูตร
                    </button>
                  </div>

                  <div className="hidden sm:flex gap-2 mb-2 text-sm font-bold text-gray-500 tracking-wider pl-1">
                    <div className="w-[150px]">หมวดหมู่</div>
                    <div className="w-[80px] text-center">ปริมาณ</div>
                    <div className="w-[160px]">หน่วย</div>
                    <div className="w-[190px]">ชื่อวัตถุดิบ</div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {setIngredientsList.map((ing) => {
                      const isSetIngMissing = missingFields.includes("setIngredients") && (!ing.name.trim() || !ing.quantity || !ing.unit.trim());

                      return (
                        <div key={ing.id} className="flex flex-wrap items-center gap-2">
                          <div className="relative w-full sm:w-[150px]">
                            <select
                              value={ing.category}
                              onChange={(e) => handleSetIngredientChange(ing.id, "category", e.target.value)}
                              className={`w-full py-2 pl-3 pr-8 border rounded-md appearance-none focus:outline-none focus:ring-1 text-gray-700 bg-white cursor-pointer shadow-inner text-sm ${
                                isSetIngMissing ? "border-red-500 bg-red-50/20" : "border-[#71B254] focus:ring-[#71B254]"
                              }`}
                            >
                              <option value="" disabled hidden>เลือกหมวดหมู่...</option>
                              {dbCategoriesData.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                              ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                            </div>
                          </div>

                          <input 
                            type="text" 
                            placeholder="เช่น 2, 0.5" 
                            value={ing.quantity} 
                            onChange={(e) => handleSetIngredientChange(ing.id, "quantity", e.target.value)}
                            className={`w-full sm:w-[80px] py-2 px-2 border rounded-md focus:outline-none focus:ring-1 text-gray-700 placeholder-gray-300 bg-white text-center shadow-inner text-sm ${
                              isSetIngMissing ? "border-red-500 bg-red-50/20" : "border-[#71B254] focus:ring-[#71B254]"
                            }`}
                          />

                          <div className="relative w-full sm:w-[160px]">
                            <select
                              value={ing.unit}
                              onChange={(e) => handleSetIngredientChange(ing.id, "unit", e.target.value)}
                              className={`w-full py-2 pl-3 pr-8 border rounded-md appearance-none focus:outline-none focus:ring-1 text-gray-700 bg-white cursor-pointer shadow-inner text-sm ${
                                isSetIngMissing ? "border-red-500 bg-red-50/20" : "border-[#71B254] focus:ring-[#71B254]"
                              }`}
                            >
                              <option value="" disabled hidden>เลือกหน่วย...</option>
                              <option value="กรัม">กรัม (g)</option>
                              <option value="กิโลกรัม">กิโลกรัม (kg)</option>
                              <option value="มิลลิลิตร">มิลลิลิตร (ml)</option>
                              <option value="ลิตร">ลิตร (l)</option>
                              <option value="ชิ้น/ตัว/ฟอง">ตัว / ชิ้น / ฟอง</option>
                              <option value="หัว/ลูก/ผล">หัว / ลูก / ผล</option>
                              <option value="แว่น">แว่น</option>
                              <option value="ช้อนโต๊ะ">ช้อนโต๊ะ</option>
                              <option value="ช้อนชา">ช้อนชา</option>
                              <option value="ถ้วยตวง">ถ้วยตวง</option>
                              <option value="หยิบมือ/เล็กน้อย">หยิบมือ / เล็กน้อย</option>
                              <option value="ใบ/กลีบ/ฝัก/ต้น">ใบ / กลีบ / ฝัก / ต้น</option>
                              <option value="เม็ด/เมล็ด">เม็ด / เมล็ด</option>
                              <option value="ห่อ/ถุง/ซอง">ห่อ / ถุง / ซอง</option>
                              <option value="กำ/มัด/พวง">กำ / มัด / พวง</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                            </div>
                          </div>

                          <input 
                            type="text"
                            placeholder="พิมพ์ชื่อวัตถุดิบ..."
                            value={ing.name}
                            onChange={(e) => handleSetIngredientChange(ing.id, "name", e.target.value)}
                            className={`flex-1 min-w-[120px] w-full sm:w-[190px] py-2 px-3 border rounded-md focus:outline-none focus:ring-1 text-gray-700 placeholder-gray-400 bg-white shadow-inner text-sm ${
                              isSetIngMissing ? "border-red-500 bg-red-50/20" : "border-[#71B254] focus:ring-[#71B254]"
                            }`}
                          />

                        <button 
                          type="button" 
                          onClick={() => removeSetIngredient(ing.id)}
                          disabled={setIngredientsList.length === 1}
                          className={`w-full sm:w-auto mt-2 sm:mt-0 p-2 rounded-md font-bold transition flex items-center justify-center shrink-0 ${
                            setIngredientsList.length === 1 ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600"
                          }`}
                        >
                          <span className="sm:hidden mr-1">ลบ</span>
                          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                      );
                    })}
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={addSetIngredient}
                    className="mt-3 w-full py-2 border border-dashed border-[#71B254] text-[#71B254] rounded-md text-xs font-bold hover:bg-[#F4FAF1] transition-colors flex items-center justify-center gap-1"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
                    เพิ่มวัตถุดิบในเซ็ทอาหาร
                  </button>
                </div>

                <div id="form-field-contactInfo">
                  <label htmlFor="contact-info-input" className="block text-gray-700 text-lg mb-2 font-semibold">
                    ช่องทางการติดต่อร้านค้า <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact-info-input"
                    type="text"
                    placeholder="เช่น โทร 081-234-5678, Line: @myshop, Facebook: ครัวคุณยาย"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className={`w-full py-3 px-4 border rounded-md focus:outline-none focus:ring-1 text-gray-700 placeholder-gray-400 bg-white ${
                      missingFields.includes("contactInfo")
                        ? "border-red-500 bg-red-50/20"
                        : "border-[#71B254] focus:ring-[#71B254]"
                    }`}
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex flex-col w-full md:w-[60%] gap-5">
                    <div id="form-field-shopIngredientImages">
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-gray-600 text-sm font-semibold">
                          รูปภาพวัตถุดิบ <span className="text-red-500">* (อย่างน้อย 1 รูป)</span>
                        </label>
                        <span className="text-xs font-bold text-gray-400">{shopIngredientImages.length}/4 รูป</span>
                      </div>

                      <input id="shop-image-file-input" type="file" accept="image/png, image/jpeg, image/webp" multiple className="hidden" ref={shopImageInputRef} onChange={handleShopImageUpload} />

                      {shopIngredientImages.length === 0 ? (
                        <div 
                          id="upload-shop-image-trigger" 
                          onClick={() => shopImageInputRef.current?.click()} 
                          className={`h-[235px] w-full border border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4FAF1] transition bg-white p-4 text-center ${
                            missingFields.includes("shopIngredientImages")
                              ? "border-red-500 bg-red-50/20"
                              : "border-[#71B254]"
                          }`}
                        >
                          <svg className={`mb-2 ${missingFields.includes("shopIngredientImages") ? "text-red-500" : "text-[#7FA9A0]"}`} width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <span className="font-bold text-gray-800 text-[12px]">อัปโหลดรูปวัตถุดิบ</span>
                          <span className="text-gray-400 text-[10px]">รองรับไฟล์ PNG, JPG (จำเป็นอย่างน้อย 1 รูป)</span>
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
                            {(() => {
                              const current = shopIngredientImages[shopImageIndex];
                              if (current.uploading) {
                                return (
                                  <div className="absolute inset-0 z-10 bg-black/40 flex flex-col items-center justify-center gap-2 text-white">
                                    <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs font-bold">กำลังอัปโหลด...</span>
                                  </div>
                                );
                              }
                              if (current.error) {
                                return (
                                  <div className="absolute bottom-0 inset-x-0 z-10 bg-red-500/90 text-white text-[11px] font-bold px-3 py-1.5 text-center">
                                    ⚠️ {current.error}
                                  </div>
                                );
                              }
                              return null;
                            })()}
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

                    <div id="form-field-shopIngredientVideo">
                      <label className="block text-gray-600 text-sm font-semibold mb-2">
                        วิดีโอวัตถุดิบ <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
                      </label>
                      <input id="shop-video-file-input" type="file" accept="video/mp4, video/quicktime, video/webm" className="hidden" ref={shopVideoInputRef} onChange={handleShopVideoUpload} />
                      {shopIngredientVideo ? (
                        <div className="h-[250px] w-full border border-[#71B254] rounded-md overflow-hidden relative group bg-black flex items-center justify-center shadow-sm">
                          <video src={shopIngredientVideo.previewUrl} controls preload="metadata" className="w-full h-full object-contain" />
                          {shopIngredientVideo.uploading && (
                            <div className="absolute inset-0 z-20 bg-black/40 flex flex-col items-center justify-center gap-2 text-white">
                              <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs font-bold">กำลังอัปโหลด...</span>
                            </div>
                          )}
                          {shopIngredientVideo.error && (
                            <div className="absolute bottom-0 inset-x-0 z-20 bg-red-500/90 text-white text-[11px] font-bold px-3 py-1.5 text-center">
                              ⚠️ {shopIngredientVideo.error}
                            </div>
                          )}
                          <div className="absolute top-2 right-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button type="button" id="remove-shop-video-btn" onClick={() => setShopIngredientVideo(null)} className="bg-red-500 text-white px-2.5 py-1.5 rounded-md font-bold shadow-sm text-xs hover:bg-red-600">
                              ลบวิดีโอ
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          id="upload-shop-video-trigger" 
                          onClick={() => shopVideoInputRef.current?.click()} 
                          className="h-[235px] w-full border border-dashed border-[#71B254] rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4FAF1] transition bg-white p-4 text-center"
                        >
                          <svg className="mb-2 text-[#7FA9A0]" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l4.55 1.45A2 2 0 0 0 23 17V7z"></path>
                          </svg>
                          <span className="font-bold text-gray-800 text-[12px]">อัปโหลดวิดีโอวัตถุดิบ</span>
                          <span className="text-gray-400 text-[10px]">MP4 ≤20MB · แนะนำบีบอัด 720p, 30-60 วินาที</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col w-full md:w-[40%] gap-5">
                    <div id="form-field-shopLocation">
                      <label htmlFor="shop-location-input" className="block text-gray-700 text-lg mb-2 font-semibold">
                        ที่ตั้งร้าน <span className="text-red-500">*</span>
                      </label>
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
                          className={`w-full py-3 px-4 border rounded-md focus:outline-none focus:ring-1 text-gray-700 placeholder-gray-400 bg-white ${
                            missingFields.includes("shopLocation")
                              ? "border-red-500 bg-red-50/20"
                              : "border-[#71B254] focus:ring-[#71B254]"
                          }`}
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

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-bold text-gray-800">การมองเห็นเซ็ทอาหาร</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label
                        className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          storeVisibility === 'public'
                            ? 'border-[#71B254] bg-[#F4FAF1]'
                            : 'border-gray-200 bg-white hover:border-[#71B254] hover:bg-gray-50'
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          <input id="store-visibility-public-radio" type="radio" name="store-visibility" value="public" checked={storeVisibility === 'public'} onChange={() => setStoreVisibility('public')} className="w-5 h-5 accent-[#71B254] cursor-pointer" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 text-base mb-1">สาธารณะ</div>
                          <div className="text-xs text-gray-500 leading-snug">ทุกคนเห็นเซ็ทอาหารนี้ได้ และสามารถสั่งซื้อได้</div>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          storeVisibility === 'protected'
                            ? 'border-[#71B254] bg-[#F4FAF1]'
                            : 'border-gray-200 bg-white hover:border-[#71B254] hover:bg-gray-50'
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          <input id="store-visibility-protected-radio" type="radio" name="store-visibility" value="protected" checked={storeVisibility === 'protected'} onChange={() => setStoreVisibility('protected')} className="w-5 h-5 accent-[#71B254] cursor-pointer" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 text-base mb-1 flex items-center gap-2">
                            สาธารณะ (จำกัดสิทธิ์)
                          </div>
                          <div className="text-xs text-gray-500 leading-snug">ร้านค้าไม่สามารถเห็นเซ็ทอาหารนี้ได้</div>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          storeVisibility === 'private'
                            ? 'border-[#71B254] bg-[#F4FAF1]'
                            : 'border-gray-200 bg-white hover:border-[#71B254] hover:bg-gray-50'
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          <input id="store-visibility-private-radio" type="radio" name="store-visibility" value="private" checked={storeVisibility === 'private'} onChange={() => setStoreVisibility('private')} className="w-5 h-5 accent-[#71B254] cursor-pointer" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 text-base mb-1 flex items-center gap-2">
                            ส่วนตัว
                          </div>
                          <div className="text-xs text-gray-500 leading-snug">มีเพียงคุณเท่านั้นที่เห็นเซ็ทอาหารนี้ เก็บไว้ดูและจัดการเองได้</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                
              </div>
          )}
          
          {/* --- Recipe Edit Form Wrapper --- */}
          <div className={`relative ${pickedRecipe ? 'pointer-events-none select-none bg-gray-50/30' : ''}`}>
            {pickedRecipe && (
              <div className="absolute top-[20%] left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
                <div className="bg-white/95 px-6 py-3 rounded-xl shadow-lg border-2 border-[#71B254] text-[#71B254] font-bold text-lg backdrop-blur-sm whitespace-nowrap flex items-center gap-2">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0110 0v4"></path></svg>
                  <span>ข้อมูลสูตรต้นฉบับ (ไม่สามารถแก้ไขได้)</span>
                  <button 
                    type="button"
                    onClick={handleUndoPickRecipe}
                    className="ml-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-full p-1.5 transition-colors border border-red-200"
                    title="ลบสูตรนี้และสร้างใหม่"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-8 relative z-20">
            
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">
                    {postAs === "store" ? "2" : "1"}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">ข้อมูลพื้นฐาน</h2>
                </div>

                <div className="flex flex-col gap-5 pl-11">
                  <div id="form-field-title">
                    <label htmlFor="recipe-title-input" className="block text-gray-700 text-lg mb-2 font-semibold">
                      ชื่อเมนูอาหาร <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        id="recipe-title-input"
                        type="text" 
                        placeholder="เช่น สเต็กเนื้อวากิว, สลัดอกไก่" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        maxLength={50}
                        className={`w-full py-3 px-4 pr-20 border rounded-md focus:outline-none focus:ring-1 text-gray-700 placeholder-gray-400 bg-white ${
                          missingFields.includes("title") 
                            ? "border-red-500 bg-red-50/20" 
                            : "border-[#71B254] focus:ring-[#71B254]"
                        }`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        {title.length}/50
                      </span>
                    </div>
                  </div>

                  <div id="form-field-description">
                    <label htmlFor="recipe-desc-textarea" className="block text-gray-700 text-lg mb-2 font-semibold">
                      คำอธิบาย <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <textarea 
                        id="recipe-desc-textarea"
                        rows={4} 
                        placeholder="เขียนคำอธิบายเมนูอาหารของคุณสั้นๆ (1-2 ประโยค) เพื่อบอกความโดดเด่นหรือรสชาติของเมนูนี้..." 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        maxLength={300}
                        className={`w-full py-3 px-4 pr-20 pb-8 border rounded-md focus:outline-none focus:ring-1 text-gray-700 placeholder-gray-400 resize-none bg-white leading-relaxed ${
                          missingFields.includes("description") 
                            ? "border-red-500 bg-red-50/20" 
                            : "border-[#71B254] focus:ring-[#71B254]"
                        }`}
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
                  <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">
                    {postAs === "store" ? "3" : "2"}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">วัตถุดิบ และ อุปกรณ์</h2>
                </div>

                <div className="pl-11 flex flex-col gap-8">

                  {postAs === "store" && (
                    <div>
                      <div className="flex gap-2 mb-4">
                        <button
                          type="button"
                          id="mode-manual-btn"
                          onClick={() => {
                            setRecipeSourceMode("manual");
                            if (pickedRecipe) handleUndoPickRecipe();
                          }}
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
                          เลือกจากสูตรอาหารต้นฉบับ
                        </button>
                      </div>

                      {recipeSourceMode === "system" && (
                        <div className="bg-[#FBFAF3] border border-[#71B254] rounded-md p-5 mb-2">
                          {!pickedRecipe ? (
                            <>
                              <label htmlFor="ingredient-search-input" className="block text-gray-700 text-sm font-semibold mb-2">
                                ค้นหาสูตรอาหารต้นฉบับด้วยวัตถุดิบ (คั่นด้วยจุลภาค)
                              </label>
                              <input
                                id="ingredient-search-input"
                                type="text"
                                placeholder="เช่น อกไก่, มะนาว, พริก"
                                value={ingredientSearch}
                                onChange={(e) => setIngredientSearch(e.target.value)}
                                className="w-full py-2.5 px-4 mb-4 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400 bg-white"
                              />

                              <div className="flex flex-col gap-2 min-h-[100px] max-h-[210px] overflow-y-auto pr-2">
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
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition-colors shrink-0"
                                  title="ลบสูตรนี้และเลือกใหม่"
                                >
                                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </button>
                              </div>
                              <div className="mt-3 pt-3 border-t border-[#d6e8cd] flex items-center gap-2 text-xs text-gray-500">
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                สูตรต้นฉบับโดย <span className="font-bold text-gray-700">{pickedRecipe.ownerName}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {(postAs === "user" || recipeSourceMode === "manual" || pickedRecipe) && (
                  <div id="form-field-ingredients">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">
                      วัตถุดิบ <span className="text-red-500">* (อย่างน้อย 1 รายการ กรอกครบทุกช่อง)</span>
                    </h3>
                    <div className="hidden sm:flex gap-2 mb-2 text-sm font-bold text-gray-500 tracking-wider pl-1">
                      <div className="w-[150px]">หมวดหมู่</div>
                      <div className="w-[80px] text-center">ปริมาณ</div>
                      <div className="w-[160px]">หน่วย</div>
                      <div className="w-[190px]">ชื่อวัตถุดิบ</div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {ingredients.map((ing) => {
                        const selectedCatData = dbCategoriesData.find(c => c.id === ing.category);
                        const suggestions = selectedCatData && ing.name.trim() !== ""
                          ? selectedCatData.ingredients.filter(i => i.toLowerCase().includes(ing.name.toLowerCase().trim()))
                          : [];

                        const isIngMissing = missingFields.includes("ingredients") && (!ing.name.trim() || !ing.quantity || !ing.unit.trim());

                        return (
                          <div key={ing.id} className="flex flex-wrap items-center gap-2">
                            <div className="relative w-full sm:w-[150px]">
                              <select
                                id={`ingredient-category-${ing.id}`}
                                value={ing.category}
                                onChange={(e) => handleIngredientChange(ing.id, "category", e.target.value)}
                                className={`w-full py-2 pl-3 pr-8 border rounded-md appearance-none focus:outline-none focus:ring-1 text-gray-700 bg-white cursor-pointer shadow-inner text-sm ${
                                  isIngMissing ? "border-red-500 bg-red-50/20" : "border-[#71B254] focus:ring-[#71B254]"
                                }`}
                              >
                                <option value="" disabled hidden>เลือกหมวดหมู่...</option>
                                {dbCategoriesData.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.emoji} {cat.name}
                                  </option>
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
                              className={`w-full sm:w-[80px] py-2 px-2 border rounded-md focus:outline-none focus:ring-1 text-gray-700 placeholder-gray-300 bg-white text-center shadow-inner text-sm ${
                                isIngMissing ? "border-red-500 bg-red-50/20" : "border-[#71B254] focus:ring-[#71B254]"
                              }`}
                            />

                          <div className="relative w-full sm:w-[160px]">
                            <select
                              id={`ingredient-unit-${ing.id}`}
                              value={ing.unit}
                              onChange={(e) => handleIngredientChange(ing.id, "unit", e.target.value)}
                              className={`w-full py-2 pl-3 pr-8 border rounded-md appearance-none focus:outline-none focus:ring-1 text-gray-700 bg-white cursor-pointer shadow-inner text-sm ${
                                isIngMissing && !ing.unit.trim()
                                  ? "border-red-500 bg-red-50/20"
                                  : "border-[#71B254] focus:ring-[#71B254]"
                              }`}
                            >
                              <option value="" disabled hidden>เลือกหน่วย...</option>
                              <option value="กรัม">กรัม (g)</option>
                              <option value="กิโลกรัม">กิโลกรัม (kg)</option>
                              <option value="มิลลิลิตร">มิลลิลิตร (ml)</option>
                              <option value="ลิตร">ลิตร (l)</option>
                              <option value="ชิ้น/ตัว/ฟอง">ตัว / ชิ้น / ฟอง</option>
                              <option value="หัว/ลูก/ผล">หัว / ลูก / ผล</option>
                              <option value="แว่น">แว่น</option>
                              <option value="ช้อนโต๊ะ">ช้อนโต๊ะ</option>
                              <option value="ช้อนชา">ช้อนชา</option>
                              <option value="ถ้วยตวง">ถ้วยตวง</option>
                              <option value="หยิบมือ/เล็กน้อย">หยิบมือ / เล็กน้อย</option>
                              <option value="ใบ/กลีบ/ฝัก/ต้น">ใบ / กลีบ / ฝัก / ต้น</option>
                              <option value="เม็ด/เมล็ด">เม็ด / เมล็ด</option>
                              <option value="ห่อ/ถุง/ซอง">ห่อ / ถุง / ซอง</option>
                              <option value="กำ/มัด/พวง">กำ / มัด / พวง</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                            </div>
                          </div>

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
                              className={`w-full py-2 px-3 border rounded-md focus:outline-none focus:ring-1 text-gray-700 placeholder-gray-300 bg-white shadow-inner text-sm ${
                                isIngMissing && !ing.name.trim()
                                  ? "border-red-500 bg-red-50/20"
                                  : "border-[#71B254] focus:ring-[#71B254]"
                              }`}
                            />
                            
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
                  <h2 className="text-2xl font-bold text-gray-800">รูปภาพและวิดีโอ</h2>
                </div>

                <div className="pl-11 flex flex-col gap-6">
                  <div id="form-field-coverImages">
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-gray-600 text-sm font-semibold">
                        รูปภาพหน้าปก <span className="text-red-500">* (อย่างน้อย 1 รูป)</span>
                      </label>
                      <span className="text-xs font-bold text-gray-400">{coverImages.length}/4 รูป</span>
                    </div>
                    
                    <input 
                      id="recipe-image-file-input"
                      type="file" 
                      accept="image/png, image/jpeg, image/webp" 
                      multiple 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                    />
                    
                    {coverImages.length === 0 ? (
                      <div 
                        id="upload-cover-image-trigger" 
                        onClick={() => fileInputRef.current?.click()} 
                        className={`h-[200px] w-full border border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4FAF1] transition bg-white p-4 text-center shadow-sm ${
                          missingFields.includes("coverImages") 
                            ? "border-red-500 bg-red-50/20" 
                            : "border-[#71B254]"
                        }`}
                      >
                        <svg className={`mb-2 ${missingFields.includes("coverImages") ? "text-red-500" : "text-[#7FA9A0]"}`} width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                          {(() => {
                            const current = coverImages[currentImageIndex];
                            if (current.uploading) {
                              return (
                                <div className="absolute inset-0 z-10 bg-black/40 flex flex-col items-center justify-center gap-2 text-white">
                                  <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs font-bold">กำลังอัปโหลด...</span>
                                </div>
                              );
                            }
                            if (current.error) {
                              return (
                                <div className="absolute bottom-0 inset-x-0 z-10 bg-red-500/90 text-white text-[11px] font-bold px-3 py-1.5 text-center">
                                  ⚠️ {current.error}
                                </div>
                              );
                            }
                            return null;
                          })()}
                          
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
                      <input id="recipe-video-file-input" type="file" accept="video/mp4, video/quicktime, video/webm" className="hidden" ref={videoInputRef} onChange={handleVideoUpload} />
                      {videoFile ? (
                        <div className="w-full h-full border border-[#71B254] rounded-md overflow-hidden relative group bg-black flex items-center justify-center shadow-sm">
                          <video src={videoFile.previewUrl} controls preload="metadata" className="w-full h-full object-contain" />
                          {videoFile.uploading && (
                            <div className="absolute inset-0 z-20 bg-black/40 flex flex-col items-center justify-center gap-2 text-white">
                              <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs font-bold">กำลังอัปโหลด...</span>
                            </div>
                          )}
                          {videoFile.error && (
                            <div className="absolute bottom-0 inset-x-0 z-20 bg-red-500/90 text-white text-[11px] font-bold px-3 py-1.5 text-center">
                              ⚠️ {videoFile.error}
                            </div>
                          )}
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
                          <span className="text-gray-400 text-[10px]">MP4 ≤20MB · แนะนำบีบอัด 720p, 30-60 วินาที</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

          <div className="mb-8 relative z-20" id="form-field-instructions">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">
                {postAs === "store" ? "4" : "3"}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                ขั้นตอนการทำ <span className="text-red-500">*</span>
              </h2>
            </div>

            <div className="pl-11">
              <textarea 
                id="recipe-instructions-textarea"
                rows={8} 
                placeholder="อธิบายขั้นตอนการทำอาหารของคุณ... (เช่น 1. หั่นผักเตรียมไว้ 2. ตั้งกระทะให้ร้อน...)" 
                value={instructions} 
                onChange={(e) => setInstructions(e.target.value)}
                className={`w-full py-4 px-4 border rounded-md focus:outline-none focus:ring-1 text-gray-700 placeholder-gray-400 resize-none leading-relaxed bg-white shadow-inner ${
                  missingFields.includes("instructions")
                    ? "border-red-500 bg-red-50/20"
                    : "border-[#71B254] focus:ring-[#71B254]"
                }`}
              />
            </div>
          </div>


          <div className="mb-10 relative z-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">
                {postAs === "store" ? "5" : "4"}
              </div>
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
          </div>
          {/* --- End Recipe Edit Form Wrapper --- */}

          <div className="flex flex-col gap-4 pt-8 border-t border-gray-100 relative z-20">
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm font-medium flex items-start gap-2 shadow-sm animate-fade-in w-full">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"></circle>
                  <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"></line>
                </svg>
                <span>{submitError}</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                type="button" 
                id="save-draft-btn" 
                onClick={handleSaveDraft}
                className="w-full py-3.5 border-2 border-[#71B254] text-[#71B254] rounded-md font-bold hover:bg-[#F4FAF1] hover:-translate-y-0.5 active:translate-y-0 transition-all text-center bg-white text-lg"
              >
                บันทึกฉบับร่าง
              </button>
              
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
                  postAs === "store" ? "เผยแพร่เซ็ทอาหาร" : "เผยแพร่เมนูอาหาร"
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