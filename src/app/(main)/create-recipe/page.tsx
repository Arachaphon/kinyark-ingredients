"use client";

import React, { useState, useRef } from "react";
import Navbar from "@/components/Navbar"; 
import Link from "next/link";

export default function CreateRecipePage() {
  // 1. State สำหรับนับตัวอักษร Real-time
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");

  // 2. State จัดการส่วนผสม
  const [ingredients, setIngredients] = useState([""]);

  // 3. State และ Ref สำหรับจัดการอัปโหลดรูปภาพ 🌟
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, ""]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      setIngredients(newIngredients);
    }
  };

  // ฟังก์ชันจัดการเมื่อผู้ใช้เลือกไฟล์รูปภาพ 🌟
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // สร้าง URL จำลองเพื่อแสดงรูปภาพตัวอย่าง (Preview)
      const imageUrl = URL.createObjectURL(file);
      setCoverImage(imageUrl);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EFD7] font-sans pb-20 overflow-x-hidden">
      
      <Navbar />

      <main className="w-[95%] max-w-[1200px] mx-auto px-4">
        
        <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-black mb-4 w-fit transition">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span className="text-lg">Create New Post</span>
        </Link>

        <div className="bg-white border border-[#71B254] rounded-sm p-8 md:p-10 shadow-sm">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* =========================================
                คอลัมน์ซ้าย (Basic Info, Ingredients, Instructions)
                ========================================= */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* 1. Basic Information */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">1</div>
                  <h2 className="text-2xl font-bold text-gray-800">Basic Information</h2>
                </div>

                <div className="flex flex-col gap-5 pl-11">
                  <div>
                    <label className="block text-gray-700 text-lg mb-2">Recipe Name</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="e.g. steak"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                        className="w-full py-3 px-4 pr-16 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        {title.length}/100
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-lg mb-2">Description</label>
                    <div className="relative">
                      <textarea 
                        rows={3}
                        placeholder="Write a short description of your recipe (1-2 sentences), highlighting what makes it unique or special."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={300}
                        className="w-full py-3 px-4 pr-16 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400 resize-none"
                      />
                      <span className="absolute right-4 top-4 text-gray-400 text-sm">
                        {description.length}/300
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Ingredients */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">3</div>
                  <h2 className="text-2xl font-bold text-gray-800">Ingredients</h2>
                </div>

                <div className="flex flex-col gap-3 pl-11">
                  {ingredients.map((ing, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input 
                        type="text" 
                        placeholder="e.g. 200g Beef Steak"
                        value={ing}
                        onChange={(e) => handleIngredientChange(index, e.target.value)}
                        className="w-[200px] py-2 px-4 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400"
                      />
                      
                      {index === ingredients.length - 1 && (
                        <button 
                          onClick={addIngredient}
                          className="px-4 py-2 border border-[#71B254] text-[#71B254] rounded-md font-medium hover:bg-[#F4FAF1] transition text-sm flex items-center gap-1 shrink-0"
                        >
                          <span>+</span> Add Ingredient
                        </button>
                      )}
                      
                      {ingredients.length > 1 && (
                        <button 
                          onClick={() => removeIngredient(index)}
                          className="text-red-400 hover:text-red-600 transition p-2 shrink-0"
                          title="Remove ingredient"
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Instructions */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">4</div>
                  <h2 className="text-2xl font-bold text-gray-800">Instructions</h2>
                </div>

                <div className="pl-11">
                  <textarea 
                    rows={12}
                    placeholder="Describe this step... (e.g. Chop the vegetables)"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full py-4 px-4 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400 resize-none leading-relaxed"
                  />
                </div>
              </div>

            </div>

            {/* =========================================
                คอลัมน์ขวา (Recipe Images) 🌟 อัปเดตระบบอัปโหลดแล้ว
                ========================================= */}
            <div className="lg:col-span-1">
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">2</div>
                <h2 className="text-2xl font-bold text-gray-800">Recipe Images</h2>
              </div>

              <div className="pl-11 h-[250px] relative">
                
                {/* Input แบบซ่อน (Hidden) สำหรับเลือกไฟล์ */}
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />

                {/* แสดงรูปภาพถ้ามีการเลือกแล้ว / ถ้ายังไม่เลือกแสดงปุ่มอัปโหลด */}
                {coverImage ? (
                  // โชว์รูปภาพ Preview
                  <div className="w-full h-full border border-[#71B254] rounded-md overflow-hidden relative group">
                    <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                    
                    {/* ปุ่มลบรูป (จะโผล่มาตอนเอาเมาส์ชี้) */}
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setCoverImage(null)}
                        className="bg-white text-red-500 px-4 py-2 rounded-md font-bold hover:bg-red-50 transition shadow-sm"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  // โชว์ปุ่มอัปโหลด (ถ้ายังไม่มีรูป)
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-full border border-[#71B254] rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4FAF1] transition"
                  >
                    <svg className="mb-3 text-[#7FA9A0]" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span className="font-bold text-gray-800 text-sm mb-1 text-center px-4">Click to upload cover image</span>
                    <span className="text-gray-400 text-xs">PNG, JPG</span>
                  </div>
                )}
                
              </div>

            </div>
          </div>

          {/* =========================================
              ปุ่ม Save Draft & Publish
              ========================================= */}
          <div className="mt-10 pt-6 border-t border-transparent flex flex-col md:flex-row gap-4 w-full">
            <button className="flex-1 py-4 border border-[#71B254] text-[#71B254] rounded-md font-bold hover:bg-[#F4FAF1] transition text-center">
              Save Draft
            </button>
            <button className="flex-1 py-4 bg-[#71B254] text-white rounded-md font-bold hover:bg-[#5b9642] transition text-center">
              Publish Recipe
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}