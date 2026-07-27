"use client";

import React, { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar"; 
import Link from "next/link";

type SystemRecipe = {
  id: string;
  title: string;
  ownerName: string;
  matchTags: string[];
  ingredients: { category: string; name: string; quantity: string; unit: string }[];
  instructions: string;
};

const SAMPLE_SYSTEM_RECIPES: SystemRecipe[] = [
  {
    id: "r1",
    title: "ต้มยำอกไก่มะนาว",
    ownerName: "user_นุช88",
    matchTags: ["อกไก่", "มะนาว", "พริก"],
    ingredients: [
      { category: "meat", name: "อกไก่", quantity: "300", unit: "g" },
      { category: "fruit", name: "มะนาว", quantity: "2", unit: "piece" },
      { category: "seasoning", name: "พริกขี้หนู", quantity: "5", unit: "piece" },
    ],
    instructions: "1. ต้มน้ำให้เดือด ใส่ตะไคร้ ข่า ใบมะกรูด\n2. ใส่อกไก่หั่นพอดีคำ ต้มจนสุก\n3. ปรุงรสด้วยน้ำปลา น้ำมะนาว พริกขี้หนูทุบ",
  },
  {
    id: "r2",
    title: "สลัดอกไก่ซอสงา",
    ownerName: "chef_ple",
    matchTags: ["อกไก่", "ผักกาด"],
    ingredients: [
      { category: "meat", name: "อกไก่", quantity: "250", unit: "g" },
      { category: "vegetable", name: "ผักกาดแก้ว", quantity: "1", unit: "piece" },
    ],
    instructions: "1. ย่างอกไก่จนสุก พักให้เย็นแล้วหั่นเป็นเส้น\n2. จัดผักกาดใส่จาน วางอกไก่ด้านบน\n3. ราดซอสงาก่อนเสิร์ฟ",
  },
  {
    id: "r3",
    title: "แกงเขียวหวานไก่",
    ownerName: "user_ต้น",
    matchTags: ["อกไก่", "พริก", "กะทิ"],
    ingredients: [
      { category: "meat", name: "อกไก่", quantity: "300", unit: "g" },
      { category: "seasoning", name: "พริกแกงเขียวหวาน", quantity: "3", unit: "tablespoon" },
      { category: "seasoning", name: "กะทิ", quantity: "400", unit: "ml" },
    ],
    instructions: "1. ผัดพริกแกงกับกะทิหัวจนแตกมัน\n2. ใส่อกไก่ ผัดให้สุก\n3. เติมกะทิที่เหลือ ปรุงรส ใส่ใบโหระพา",
  },
];

export default function CreateRecipePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [postAs, setPostAs] = useState<"user" | "shop">("user");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [videoFile, setVideoFile] = useState<string | null>(null);
  
  const [coverImages, setCoverImages] = useState<string[]>([]);
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [shopName, setShopName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [shopLocation, setShopLocation] = useState("");
  
  const [pinCoord, setPinCoord] = useState<{ lat: number; lng: number } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [shopIngredientImages, setShopIngredientImages] = useState<string[]>([]);
  const [shopImageIndex, setShopImageIndex] = useState(0);
  const [shopIngredientVideo, setShopIngredientVideo] = useState<string | null>(null);
  const shopImageInputRef = useRef<HTMLInputElement>(null);
  const shopVideoInputRef = useRef<HTMLInputElement>(null);

  const [recipeSourceMode, setRecipeSourceMode] = useState<"manual" | "system">("manual");
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [pickedRecipe, setPickedRecipe] = useState<SystemRecipe | null>(null);

  // 🌟 ฟังก์ชันอัปเดตตำแหน่งหมุดบนแผนที่
  const updateMapMarker = (lat: number, lng: number, map: any, L: any) => {
    setPinCoord({ lat, lng });
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }
    map.setView([lat, lng], 15);
  };

  // 🌟 ค้นหาพิกัดจากชื่อสถานที่
  const handleSearchLocation = async () => {
    if (!shopLocation.trim()) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(shopLocation)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        setShopLocation(display_name);
        
        if (mapInstanceRef.current && (window as any).L) {
          updateMapMarker(latitude, longitude, mapInstanceRef.current, (window as any).L);
        }
      } else {
        alert("ไม่พบสถานที่ที่คุณค้นหา ลองระบุชื่อให้ละเอียดขึ้น");
      }
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };

  useEffect(() => {
    if (postAs === "shop" && isMounted && mapRef.current && !mapInstanceRef.current) {
      import("leaflet").then((L) => {
        // เก็บ L ไว้ใน window ชั่วคราวเพื่อให้เรียกใช้ง่ายขึ้น
        (window as any).L = L;

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        const map = L.map(mapRef.current).setView([19.1645, 99.9094], 13); // ตั้งต้นที่พะเยา/โซนใกล้เคียง
        
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          updateMapMarker(lat, lng, map, L);
          setShopLocation(`พิกัดร้าน (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`);
        });

        mapInstanceRef.current = map;

        // บังคับรีเฟรชขนาดแผนที่แก้ปัญหาจอเทา/หมุดหายตอนโหลดครั้งแรก
        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      });
    }

    return () => {
      if (postAs !== "shop" && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [postAs, isMounted]);

  const handleShopImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const availableSlots = 4 - shopIngredientImages.length;
    const filesToAdd = files.slice(0, availableSlots);
    const newUrls = filesToAdd.map(file => URL.createObjectURL(file));
    setShopIngredientImages(prev => {
      const updated = [...prev, ...newUrls];
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
    if (file) setShopIngredientVideo(URL.createObjectURL(file));
  };

  const filteredSystemRecipes = (() => {
    const terms = ingredientSearch.toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
    if (terms.length === 0) return SAMPLE_SYSTEM_RECIPES;
    return SAMPLE_SYSTEM_RECIPES.filter(r =>
      r.matchTags.some(tag => terms.some(t => tag.toLowerCase().includes(t)))
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
    const newImagesUrls = filesToAdd.map(file => URL.createObjectURL(file));

    setCoverImages(prev => {
      const updated = [...prev, ...newImagesUrls];
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
    if (file) setVideoFile(URL.createObjectURL(file));
  };

  const handleSubmitRecipe = () => {
    const payload = {
      recipeName: title,
      description,
      instructions,
      visibility,
      ingredients: ingredients.map(i => ({
        name: i.name,
        category: i.category,
        quantity: parseFloat(i.quantity) || 0,
        unit: i.unit
      })),
      equipmentItems: equipments.filter(e => e.name.trim() !== ""),
      coverImages,
      videoFile,
      postAs,
      ...(postAs === "shop" ? { shopName, sellingPrice, shopDescription, shopLocation, pinCoord } : {})
    };
    console.log("Submitting Recipe Payload:", payload);
    alert("บันทึกและเผยแพร่สูตรอาหารสำเร็จ!");
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
              id="role-shop-btn"
              onClick={() => setPostAs("shop")}
              className={`px-3 py-1 rounded-full font-bold transition-colors ${
                postAs === "shop" ? "bg-[#71B254] text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              ร้านค้า
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#71B254] rounded-sm p-8 md:p-10 shadow-sm relative z-10">

          {postAs === "shop" && (
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
                              src={shopIngredientImages[shopImageIndex]}
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
                          <video src={shopIngredientVideo} controls className="w-full h-full object-contain" />
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
                          placeholder="พิมพ์ชื่อสถานที่ แล้วกดค้นหา..."
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

                    {/* 🌟 แผนที่จริงพร้อมแสดงผล */}
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

                  {postAs === "shop" && (
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

                              <div className="flex flex-col gap-2">
                                {filteredSystemRecipes.length === 0 ? (
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
                                <span className="ml-auto text-gray-400">จะแสดงชื่อนี้บนโพสต์เมื่อเผยแพร่</span>
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
                      <div className="w-[140px]">หมวดหมู่</div>
                      <div className="w-[80px] text-center">ปริมาณ</div>
                      <div className="w-[120px]">หน่วย</div>
                      <div className="w-[190px]">ชื่อวัตถุดิบ</div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {ingredients.map((ing) => (
                        <div key={ing.id} className="flex flex-wrap items-center gap-2">
                          <div className="relative w-full sm:w-[150px]">
                            <select
                              id={`ingredient-category-${ing.id}`}
                              value={ing.category}
                              onChange={(e) => handleIngredientChange(ing.id, "category", e.target.value)}
                              className="w-full py-2 pl-3 pr-8 border border-[#71B254] rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 bg-white cursor-pointer shadow-inner text-sm"
                            >
                              <option value="" disabled hidden>หมวดหมู่...</option>
                              <option value="meat">🥩 เนื้อสัตว์</option>
                              <option value="seafood">🦞 อาหารทะเล</option>
                              <option value="vegetable">🥦 ผัก</option>
                              <option value="fruit">🥗 ผลไม้</option>
                              <option value="seasoning">🧂 เครื่องปรุง / อื่นๆ</option>
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
                              <option value="piece">ชิ้น/ฟอง/หัว</option>
                              <option value="tablespoon">ช้อนโต๊ะ</option>
                              <option value="teaspoon">ช้อนชา</option>
                              <option value="cup">ถ้วยตวง</option>
                              <option value="pinch">หยิบมือ/เล็กน้อย</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                            </div>
                          </div>

                          <input 
                            id={`ingredient-name-${ing.id}`}
                            type="text" 
                            placeholder="เช่น อกไก่, แครอท" 
                            value={ing.name} 
                            onChange={(e) => handleIngredientChange(ing.id, "name", e.target.value)}
                            className="w-full sm:w-[190px] py-2 px-3 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-300 bg-white shadow-inner text-sm"
                          />

                          {ingredients.length > 1 && (
                            <button type="button" id={`remove-ingredient-btn-${ing.id}`} onClick={() => removeIngredient(ing.id)} className="text-red-400 hover:text-red-600 p-1 transition-colors shrink-0">
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
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
                          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL, next/image not supported */}
                          <img 
                            src={coverImages[currentImageIndex]} 
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
                          <video src={videoFile} controls className="w-full h-full object-contain" />
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
              <button type="button" id="publish-recipe-btn" onClick={handleSubmitRecipe} className="w-full py-3.5 bg-[#71B254] text-white rounded-md font-bold hover:bg-[#5b9642] hover:-translate-y-0.5 active:translate-y-0 transition-all text-center text-lg shadow-md">
                เผยแพร่เมนูอาหาร
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}