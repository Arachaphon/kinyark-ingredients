"use client";

import React, { useState, useRef } from "react";
import Navbar from "@/components/Navbar"; 
import Link from "next/link";

export default function CreateRecipePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // สเตตสำหรับวัตถุดิบ
  const [ingredients, setIngredients] = useState([
    { name: "", quantity: "", unit: "" }
  ]);

  const handleIngredientChange = (index: number, field: "name" | "quantity" | "unit", value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "" }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      setIngredients(newIngredients);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(URL.createObjectURL(file));
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(URL.createObjectURL(file));
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EFD7] font-sans pb-20 overflow-x-hidden relative z-0">
      <Navbar />

      <main className="w-[95%] max-w-[1200px] mx-auto px-4 relative z-10">
        
        <Link href="/home" className="flex items-center gap-2 text-gray-700 hover:text-black mb-4 w-fit transition relative z-20">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span className="text-lg">Create New Post</span>
        </Link>

        <div className="bg-white border border-[#71B254] rounded-sm p-8 md:p-10 shadow-sm relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-8 relative z-20">
            
            {/* คอลัมน์ซ้าย */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* [1] Basic Information */}
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
                        className="w-full py-3 px-4 pr-20 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400 bg-white"
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
                        rows={4} 
                        placeholder="Write a short description of your recipe (1-2 sentences), highlighting what makes it unique or special." 
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

              {/* ==========================================================
                  🛠️ [3] Ingredients (ล้างสีเหลืองออก คืนค่า Focus ธีมเขียวเดิมของแอป)
                  ========================================================== */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">3</div>
                  <h2 className="text-2xl font-bold text-gray-800">Ingredients</h2>
                </div>

                <div className="pl-11">
                  {/* หัวตารางเพื่อความเคลียร์แจ่มแจ้ง */}
                  <div className="hidden sm:flex gap-2 mb-2 text-sm font-bold text-gray-500 uppercase tracking-wider pl-1">
                    <div className="w-[85px] text-center">Quantity</div>
                    <div className="w-[140px]">Unit</div>
                    <div className="w-[220px]">Ingredient Name</div>
                  </div>

                  {/* ตารางรับข้อมูล */}
                  <div className="flex flex-col gap-3">
                    {ingredients.map((ing, index) => (
                      <div key={index} className="flex flex-wrap items-center gap-2">
                        
                        {/* 1. ช่องระบุจำนวน (Quantity) */}
                        <input 
                          type="text" 
                          placeholder="e.g. 2" 
                          value={ing.quantity} 
                          onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)}
                          className="w-full sm:w-[85px] py-2 px-3 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-300 bg-white text-center shadow-inner"
                        />

                        {/* 2. ช่อง Dropdown เลือกหน่วยปริมาตร (Unit) สวยหรูสไตล์พรีเมียม แต่คงโฟกัสสีเขียวแบรนด์ */}
                        <div className="relative w-full sm:w-[140px]">
                          <select
                            value={ing.unit}
                            onChange={(e) => handleIngredientChange(index, "unit", e.target.value)}
                            className="w-full py-2 pl-4 pr-10 border border-[#71B254] rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 bg-white cursor-pointer shadow-inner"
                          >
                            <option value="" disabled hidden>Select Unit</option>
                            <option value="g">g (grams)</option>
                            <option value="kg">kg (kilograms)</option>
                            <option value="ml">ml (milliliters)</option>
                            <option value="l">l (liters)</option>
                            <option value="piece">piece(s)</option>
                            <option value="tablespoon">tablespoon(s)</option>
                            <option value="teaspoon">teaspoon(s)</option>
                            <option value="cup">cup(s)</option>
                            <option value="dash">dash(es)</option>
                            <option value="pinch">pinch(es)</option>
                          </select>
                          
                          {/* ไอคอนลูกศร SVG Chevron-down มินิมอล */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </div>
                        </div>

                        {/* 3. ช่องระบุชื่อวัตถุดิบ (Ingredient Name) */}
                        <input 
                          type="text" 
                          placeholder="e.g. Chicken Breast" 
                          value={ing.name} 
                          onChange={(e) => handleIngredientChange(index, "name", e.target.value)}
                          className="w-full sm:w-[220px] py-2 px-4 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-300 bg-white shadow-inner"
                        />

                        {/* ปุ่มลบกากบาท */}
                        {ingredients.length > 1 && (
                          <button type="button" onClick={() => removeIngredient(index)} className="text-red-400 hover:text-red-600 p-1 transition-colors shrink-0">
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {/* ปุ่มกดเพิ่มแถววัตถุดิบ */}
                    <button 
                      type="button"
                      onClick={addIngredient} 
                      className="w-fit mt-2 px-4 py-2 border border-[#71B254] text-[#71B254] rounded-md font-medium hover:bg-[#F4FAF1] transition text-sm flex items-center gap-1 shrink-0 bg-white"
                    >
                      <span>+</span> Add Ingredient
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* คอลัมน์ขวา (Media Upload) */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">2</div>
                  <h2 className="text-2xl font-bold text-gray-800">Recipe Media</h2>
                </div>

                <div className="pl-11 flex flex-col gap-6">
                  {/* Cover Image */}
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-2">Cover Image</label>
                    <div className="h-[180px] relative">
                      <input type="file" accept="image/png, image/jpeg" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                      {coverImage ? (
                        <div className="w-full h-full border border-[#71B254] rounded-md overflow-hidden relative group shadow-sm">
                          <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => setCoverImage(null)} className="bg-white text-red-500 px-4 py-2 rounded-md font-bold shadow-sm text-sm">Remove Image</button>
                          </div>
                        </div>
                      ) : (
                        <div onClick={() => fileInputRef.current?.click()} className="w-full h-full border border-[#71B254] rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4FAF1] transition bg-white p-4">
                          <svg className="mb-2 text-[#7FA9A0]" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <span className="font-bold text-gray-800 text-[11px] text-center">Upload cover image</span>
                          <span className="text-gray-400 text-[10px]">PNG, JPG</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Video Tutorial */}
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-2">Video Tutorial</label>
                    <div className="h-[180px] relative">
                      <input type="file" accept="video/mp4, video/quicktime" className="hidden" ref={videoInputRef} onChange={handleVideoUpload} />
                      {videoFile ? (
                        <div className="w-full h-full border border-[#71B254] rounded-md overflow-hidden relative group bg-black flex items-center justify-center shadow-sm">
                          <video src={videoFile} controls className="w-full h-full object-contain" />
                          <div className="absolute top-2 right-2 opacity-80 group-hover:opacity-100 transition-opacity z-10">
                            <button type="button" onClick={() => setVideoFile(null)} className="bg-red-500 text-white px-2.5 py-1.5 rounded-md font-bold shadow-sm text-xs hover:bg-red-600">
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div onClick={() => videoInputRef.current?.click()} className="w-full h-full border border-[#71B254] rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4FAF1] transition bg-white p-4">
                          <svg className="mb-2 text-[#7FA9A0]" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l4.55 1.45A2 2 0 0 0 23 17V7z"></path>
                          </svg>
                          <span className="font-bold text-gray-800 text-[11px] text-center">Upload video tutorial</span>
                          <span className="text-gray-400 text-[10px]">MP4, MOV</span>
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
              <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">4</div>
              <h2 className="text-2xl font-bold text-gray-800">Instructions</h2>
            </div>

            <div className="pl-11">
              <textarea 
                rows={10} 
                placeholder="Describe this step... (e.g. Chop the vegetables)" 
                value={instructions} 
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full py-4 px-4 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400 resize-none leading-relaxed bg-white shadow-inner"
              />
            </div>
          </div>

          {/* แถวปุ่มกดด้านล่างสุด */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-6 border-t border-transparent relative z-20">
            <div className="lg:col-span-2">
              <button type="button" className="w-full py-3.5 border border-[#71B254] text-[#71B254] rounded-md font-bold hover:bg-[#F4FAF1] hover:-translate-y-0.5 active:translate-y-0 transition-all text-center bg-white text-lg">
                Save Draft
              </button>
            </div>
            <div className="lg:col-span-1">
              <button type="button" className="w-full py-3.5 bg-[#71B254] text-white rounded-md font-bold hover:bg-[#5b9642] hover:-translate-y-0.5 active:translate-y-0 transition-all text-center text-lg shadow-sm">
                Publish Recipe
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}