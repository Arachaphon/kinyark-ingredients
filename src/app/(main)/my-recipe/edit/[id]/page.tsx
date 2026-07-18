"use client";

import React, { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Anuphan } from "next/font/google";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

function EditRecipeForm({ recipeId }: { recipeId: string }) {
  // TODO: Replace mock data with real API fetch (with loading/error state) when backend is ready
  const [title, setTitle] = useState(
    recipeId ? "สลัดซีซาร์การ์เดน (แก้ไขแล้ว)" : ""
  );
  const [description, setDescription] = useState(
    recipeId ? "นี่คือคำอธิบายที่อัปเดตแล้วสำหรับสูตรสลัดนี้" : ""
  );
  const [instructions, setInstructions] = useState(
    recipeId
      ? "ขั้นตอนที่ 1: ล้างผักให้สะอาด...\nขั้นตอนที่ 2: หั่นให้ละเอียด..."
      : ""
  );
  const [ingredients, setIngredients] = useState(
    recipeId ? ["มะเขือเทศ", "หอมหัวใหญ่หวาน", "พริกไทย"] : [""]
  );
  const [coverImage, setCoverImage] = useState<string | null>(
    recipeId
      ? "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80"
      : null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => setIngredients([...ingredients, ""]);

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(URL.createObjectURL(file));
    }
  };

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
          <span className="text-lg">แก้ไขโพสต์ (ID: {recipeId})</span>
        </Link>

        <div className="bg-white border border-[#71B254] rounded-sm p-8 md:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-8">
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* [1] Basic Information */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    ข้อมูลพื้นฐาน
                  </h2>
                </div>
                <div className="flex flex-col gap-5 pl-11">
                  <div>
                    <label className="block text-gray-700 text-lg mb-2">
                      ชื่อสูตรอาหาร
                    </label>
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
                    <label className="block text-gray-700 text-lg mb-2">
                      คำอธิบาย
                    </label>
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
                    3
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">ส่วนผสม</h2>
                </div>
                <div className="flex flex-col gap-3 pl-11">
                  <div className="flex flex-wrap items-center gap-3">
                    {ingredients.map((ing, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="ส่วนผสม"
                          value={ing}
                          onChange={(e) =>
                            handleIngredientChange(index, e.target.value)
                          }
                          className="w-[200px] py-2 px-4 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400 bg-white"
                        />
                        {ingredients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeIngredient(index)}
                            className="text-red-500 hover:text-red-700 p-1 transition-colors"
                          >
                            <svg
                              width="18"
                              height="18"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
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
                      className="px-4 py-2 border border-[#71B254] text-[#71B254] rounded-md font-medium hover:bg-[#F4FAF1] transition text-sm flex items-center gap-1 shrink-0 bg-white"
                    >
                      <span>+</span> เพิ่มส่วนผสม
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* [2] Recipe Images */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <h2 className="text-2xl font-bold text-gray-800">รูปภาพสูตรอาหาร</h2>
              </div>
              <div className="pl-11 h-[250px] relative">
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
                {coverImage ? (
                  <div className="w-full h-full border border-[#71B254] rounded-md overflow-hidden relative group">
                    <img
                      src={coverImage}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setCoverImage(null)}
                        className="bg-white text-red-500 px-4 py-2 rounded-md font-bold shadow-sm"
                      >
                        ลบรูปภาพ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-full border border-[#71B254] rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4FAF1] transition bg-white"
                  >
                    <svg
                      className="mb-3 text-[#7FA9A0]"
                      width="40"
                      height="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span className="font-bold text-gray-800 text-sm mb-1 text-center px-4">
                      ลากและวางรูปภาพหน้าปกความละเอียดสูง
                    </span>
                    <span className="text-gray-400 text-xs">PNG, JPG</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* [4] Instructions */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#71B254] text-white flex items-center justify-center font-bold text-lg">
                4
              </div>
              <h2 className="text-2xl font-bold text-gray-800">วิธีทำ</h2>
            </div>
            <div className="pl-11">
              <textarea
                rows={12}
                placeholder="อธิบายขั้นตอนนี้..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full py-4 px-4 border border-[#71B254] rounded-md focus:outline-none focus:ring-1 focus:ring-[#71B254] text-gray-700 placeholder-gray-400 resize-none leading-relaxed bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-6 border-t border-transparent">
            <div className="lg:col-span-2">
              <button
                type="button"
                className="w-full py-3.5 border border-[#71B254] text-[#71B254] rounded-md font-bold hover:bg-[#F4FAF1] transition text-center bg-white text-lg"
              >
                ยกเลิก
              </button>
            </div>
            <div className="lg:col-span-1">
              <button
                type="button"
                className="w-full py-3.5 bg-[#71B254] text-white rounded-md font-bold hover:bg-[#5b9642] transition text-center text-lg shadow-sm"
              >
                อัปเดตสูตรอาหาร
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