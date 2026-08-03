"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Anuphan } from "next/font/google";
import type { RecipeDetail } from "@/types/recipes";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

type IngredientRow = { id: number; name: string; quantity: string; unit: string };

function EditRecipeForm({ recipeId }: { recipeId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { id: 1, name: "", quantity: "", unit: "" },
  ]);
  
  const [coverImages, setCoverImages] = useState<{file?: File, previewUrl: string}[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [videoFile, setVideoFile] = useState<{file?: File, previewUrl: string} | null>(null);
  
  const [visibility, setVisibility] = useState<"public" | "protected" | "private" | "draft">("public");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const fetchRecipe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recipes/${recipeId}`);
      if (!res.ok) {
        setError("ไม่พบสูตรอาหารนี้");
        return;
      }
      const body = (await res.json()) as { data: RecipeDetail & { visibility?: "public" | "protected" | "private" | "draft" } };
      const r = body.data;

      setTitle(r.recipeName ?? "");
      setDescription(r.description ?? "");
      setInstructions(r.instructions ?? "");
      setIngredients(
        r.recipeIngredients && r.recipeIngredients.length > 0
          ? r.recipeIngredients.map((ri, idx) => ({
              id: idx + 1,
              name: ri.ingredient.name,
              quantity: ri.quantity?.toString() ?? "",
              unit: ri.unit ?? "",
            }))
          : [{ id: 1, name: "", quantity: "", unit: "" }]
      );
      
      if (r.images && r.images.length > 0) {
        setCoverImages(r.images.map((img) => ({ previewUrl: img.imageUrl })));
      }
      if (r.videos && r.videos.length > 0) {
        setVideoFile({ previewUrl: r.videos[0].videoUrl });
      }
      
      if (r.visibility) setVisibility(r.visibility);
    } catch {
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  const handleIngredientChange = (
    id: number,
    field: keyof IngredientRow,
    value: string
  ) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  };

  const addIngredient = () =>
    setIngredients((prev) => [
      ...prev,
      { id: Date.now(), name: "", quantity: "", unit: "" },
    ]);

  const removeIngredient = (id: number) => {
    if (ingredients.length > 1) {
      setIngredients((prev) => prev.filter((ing) => ing.id !== id));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const maxFiles = 4 - coverImages.length;
    const filesToProcess = files.slice(0, maxFiles);
    
    const newImages = filesToProcess.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    
    setCoverImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setCoverImages(prev => prev.filter((_, i) => i !== index));
    if (currentImageIndex >= coverImages.length - 1 && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % coverImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + coverImages.length) % coverImages.length);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile({
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#F5EFD7] pb-20 ${anuphan.className}`}>
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <div className="w-12 h-12 border-4 border-[#71B254] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">กำลังโหลดข้อมูลสูตรอาหาร...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-[#F5EFD7] pb-20 ${anuphan.className}`}>
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <p className="text-red-500 font-bold text-lg">{error}</p>
          <Link href="/my-recipe" className="text-[#71B254] underline">
            กลับไปหน้าสูตรอาหารของฉัน
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden ${anuphan.className}`}
    >
      <Navbar />

      <main className="w-[95%] max-w-[1200px] mx-auto px-4">
        <Link
          href="/my-recipe"
          className="flex items-center gap-2 text-gray-700 hover:text-black mb-4 w-fit transition"
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span className="text-lg">แก้ไขโพสต์</span>
        </Link>

        <div className="bg-white border border-[#71B254] rounded-sm p-8 md:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-8 relative z-20">
            <div className="lg:col-span-2 flex flex-col gap-8">

              {/* [1] Basic Information */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">ข้อมูลพื้นฐาน</h2>
                </div>
                <div className="flex flex-col gap-5 pl-11">
                  <div>
                    <label className="block text-gray-700 text-lg mb-2 font-semibold">ชื่อเมนูอาหาร <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="เช่น สเต๊ก"
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
                    <label className="block text-gray-700 text-lg mb-2 font-semibold">คำอธิบาย <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <textarea
                        rows={4}
                        placeholder="เขียนคำอธิบายสั้น ๆ..."
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

              {/* [3] Ingredients */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">วัตถุดิบ และ อุปกรณ์</h2>
                </div>
                
                <div className="pl-11 flex flex-col gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">
                      วัตถุดิบ <span className="text-red-500">* (อย่างน้อย 1 รายการ กรอกครบทุกช่อง)</span>
                    </h3>
                    <div className="hidden sm:flex gap-2 mb-1 text-sm font-bold text-gray-500 tracking-wider pl-1">
                      <div className="w-[80px] text-center">ปริมาณ</div>
                      <div className="w-[160px]">หน่วย</div>
                      <div className="flex-1">ชื่อวัตถุดิบ</div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {ingredients.map((ing) => (
                        <div key={ing.id} className="flex flex-wrap items-center gap-2">
                          {/* ปริมาณ */}
                          <input
                            type="text"
                            placeholder="เช่น 2"
                            value={ing.quantity}
                            onChange={(e) =>
                              handleIngredientChange(ing.id, "quantity", e.target.value)
                            }
                            className="w-full sm:w-[80px] py-2 px-2 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-300 bg-white text-center text-sm shadow-inner"
                          />

                          {/* หน่วย */}
                          <div className="relative w-full sm:w-[160px]">
                            <select
                              value={ing.unit}
                              onChange={(e) =>
                                handleIngredientChange(ing.id, "unit", e.target.value)
                              }
                              className="w-full py-2 pl-3 pr-8 border border-[#71B254] rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 bg-white cursor-pointer text-sm shadow-inner"
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
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path d="M6 9l6 6 6-6" />
                              </svg>
                            </div>
                          </div>

                          {/* ชื่อวัตถุดิบ */}
                          <input
                            type="text"
                            placeholder="เช่น อกไก่, แครอท"
                            value={ing.name}
                            onChange={(e) =>
                              handleIngredientChange(ing.id, "name", e.target.value)
                            }
                            className="flex-1 min-w-[160px] py-2 px-3 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-300 bg-white text-sm shadow-inner"
                          />

                          {/* ลบแถว */}
                          {ingredients.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeIngredient(ing.id)}
                              className="text-red-500 hover:text-red-700 p-1 transition-colors"
                            >
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addIngredient}
                        className="w-fit px-4 py-2 border border-[#71B254] text-[#71B254] rounded-md font-medium hover:bg-[#F4FAF1] transition text-sm flex items-center gap-1 bg-white mt-1"
                      >
                        <span>+</span> เพิ่มส่วนผสม
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* [2] Recipe Images and Video */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">รูปภาพและวิดีโอ</h2>
                </div>

                <div className="pl-11 flex flex-col gap-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-gray-600 text-sm font-semibold">
                        รูปภาพหน้าปก <span className="text-red-500">* (อย่างน้อย 1 รูป)</span>
                      </label>
                      <span className="text-xs font-bold text-gray-400">{coverImages.length}/4 รูป</span>
                    </div>
                    
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      multiple 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                    />
                    
                    {coverImages.length === 0 ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()} 
                        className="h-[200px] w-full border border-dashed border-[#71B254] rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4FAF1] transition bg-white p-4 text-center shadow-sm"
                      >
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
                            src={coverImages[currentImageIndex].previewUrl} 
                            alt={`Cover ${currentImageIndex + 1}`} 
                            className="w-full h-full object-cover transition-opacity duration-300" 
                          />
                          
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button type="button" onClick={() => removeImage(currentImageIndex)} className="bg-red-500 text-white px-3 py-1.5 rounded-md font-bold shadow-md text-[10px] hover:bg-red-600">
                              ลบรูปนี้
                            </button>
                          </div>

                          {coverImages.length > 1 && (
                            <>
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); prevImage(); }} 
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md text-gray-800 z-10 transition-all"
                              >
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
                              </button>
                              
                              <button 
                                type="button" 
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
                            onClick={() => fileInputRef.current?.click()} 
                            className="w-full py-2.5 border border-dashed border-[#71B254] text-[#71B254] rounded-md text-sm font-bold hover:bg-[#F4FAF1] transition-colors flex items-center justify-center gap-2"
                          >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
                            เพิ่มรูปภาพอีก ({coverImages.length}/4)
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-2">
                    <label className="block text-gray-600 text-sm font-semibold mb-2">วิดีโอสอนทำอาหาร</label>
                    <div className="h-[140px] relative">
                      <input type="file" accept="video/mp4, video/quicktime" className="hidden" ref={videoInputRef} onChange={handleVideoUpload} />
                      {videoFile ? (
                        <div className="w-full h-full border border-[#71B254] rounded-md overflow-hidden relative group bg-black flex items-center justify-center shadow-sm">
                          <video src={videoFile.previewUrl} controls className="w-full h-full object-contain" />
                          <div className="absolute top-2 right-2 opacity-80 group-hover:opacity-100 transition-opacity z-10">
                            <button type="button" onClick={() => setVideoFile(null)} className="bg-red-500 text-white px-2.5 py-1.5 rounded-md font-bold shadow-sm text-xs hover:bg-red-600">
                              ลบวิดีโอ
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div onClick={() => videoInputRef.current?.click()} className="w-full h-full border border-[#71B254] rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4FAF1] transition bg-white p-4 text-center">
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

          {/* [4] Instructions */}
          <div className="mb-8 relative z-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h2 className="text-2xl font-bold text-gray-800">ขั้นตอนการทำ <span className="text-red-500">*</span></h2>
            </div>
            <div className="pl-11">
              <textarea
                rows={8}
                placeholder="อธิบายขั้นตอนการทำอาหารของคุณ... (เช่น 1. หั่นผักเตรียมไว้ 2. ตั้งกระทะให้ร้อน...)"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full py-4 px-4 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400 resize-none leading-relaxed bg-white shadow-inner"
              />
            </div>
          </div>

          {/* [5] Visibility */}
          <div className="mb-10 relative z-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">4</div>
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
                  <input type="radio" name="visibility" value="public" checked={visibility === 'public'} onChange={() => setVisibility('public')} className="w-5 h-5 accent-[#71B254] cursor-pointer" />
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
                  <input type="radio" name="visibility" value="protected" checked={visibility === 'protected'} onChange={() => setVisibility('protected')} className="w-5 h-5 accent-[#71B254] cursor-pointer" />
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
                  <input type="radio" name="visibility" value="private" checked={visibility === 'private'} onChange={() => setVisibility('private')} className="w-5 h-5 accent-[#71B254] cursor-pointer" />
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

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8 border-t border-gray-100 relative z-20">
            <div>
              <Link
                href="/my-recipe"
                className="w-full py-3.5 border-2 border-[#71B254] text-[#71B254] rounded-md font-bold hover:bg-[#F4FAF1] hover:-translate-y-0.5 active:translate-y-0 transition-all text-center bg-white text-lg block"
              >
                ยกเลิก
              </Link>
            </div>
            <div>
              <button
                type="button"
                className="w-full py-3.5 bg-[#71B254] text-white rounded-md font-bold hover:bg-[#5b9642] hover:-translate-y-0.5 active:translate-y-0 transition-all text-center text-lg shadow-md"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EditRecipePage() {
  const params = useParams();
  const recipeId = params.id as string;
  return <EditRecipeForm key={recipeId} recipeId={recipeId} />;
}