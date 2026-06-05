"use client";

import React, { useState } from "react";
import { useRouter } from 'next/navigation'

interface SettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "profile" | "preferences" | "ai";

export default function SettingModal({ isOpen, onClose }: SettingModalProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const [activeTab, setActiveTab] = useState<TabType>("profile");
  
  // State สำหรับแท็บ AI Personalization (Toggles)
  const [aiRec, setAiRec] = useState(true);
  const [aiHistory, setAiHistory] = useState(true);
  const [dailySug, setDailySug] = useState(false);

  // State สำหรับแท็บ Food Preferences
  const [diet, setDiet] = useState("Vegetarian");
  const [allergy, setAllergy] = useState("Peanut");

  if (!isOpen) return null;

  return (
    /* 🌟 แก้ไขตรงนี้: จาก bg-black bg-opacity-40 เป็น bg-black/40 เพื่อให้ฉากหลังโปร่งแสงใน Tailwind v4 */
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fade-in">
      
      {/* กล่อง Modal หลัก */}
      <div className="bg-white w-full max-w-[900px] h-[550px] rounded-[24px] shadow-2xl overflow-hidden flex border border-gray-100 animate-scale-up">
        
        {/* =========================================
            แถบเมนูด้านซ้าย (Sidebar สีเหลืองทอง)
            ========================================= */}
        <div className="w-[260px] bg-[#FFC700] p-6 flex flex-col justify-between shrink-0 text-black">
          <div>
            <h2 className="text-3xl font-black mb-8 tracking-wide">Setting</h2>
            
            <nav className="flex flex-col gap-2">
              {/* ปุ่ม Profile */}
              <button 
                onClick={() => setActiveTab("profile")}
                /* 🌟 เปลี่ยนเป็น bg-white/20 และ hover:bg-white/10 */
                className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl text-left font-bold text-base transition-all ${
                  activeTab === "profile" ? "bg-white/20 shadow-sm" : "hover:bg-white/10"
                }`}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Profile
              </button>

              {/* ปุ่ม Food Preferences */}
              <button 
                onClick={() => setActiveTab("preferences")}
                /* 🌟 เปลี่ยนเป็น bg-white/20 และ hover:bg-white/10 */
                className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl text-left font-bold text-base transition-all ${
                  activeTab === "preferences" ? "bg-white/20 shadow-sm" : "hover:bg-white/10"
                }`}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
                Food Preferences
              </button>

              {/* ปุ่ม AI Personalization */}
              <button 
                onClick={() => setActiveTab("ai")}
                /* 🌟 เปลี่ยนเป็น bg-white/20 และ hover:bg-white/10 */
                className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl text-left font-bold text-base transition-all ${
                  activeTab === "ai" ? "bg-white/20 shadow-sm" : "hover:bg-white/10"
                }`}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path>
                </svg>
                AI Personalization
              </button>
            </nav>
          </div>

          {/* ปุ่มด้านล่างสุด (Delete & Logout) */}
          <div className="flex flex-col gap-1 border-t border-black/10 pt-4">
            {/* 🌟 เปลี่ยนเป็น hover:bg-red-500/10 */}
            <button className="flex items-center gap-3 w-full py-2.5 px-4 rounded-xl text-left font-bold text-red-600 hover:bg-red-500/10 transition-colors">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete Account
            </button>
            {/* 🌟 เปลี่ยนเป็น hover:bg-black/5 */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full py-2.5 px-4 rounded-xl text-left font-bold text-black hover:bg-black/5 transition-colors"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* =========================================
            เนื้อหาฝั่งขวา (เปลี่ยนไปตามเเท็บที่เลือก)
            ========================================= */}
        <div className="flex-grow p-8 relative flex flex-col overflow-y-auto bg-white">
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
          >
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="#EAEAEA" stroke="none"></circle>
              <line x1="15" y1="9" x2="9" y2="15" stroke="#757575" strokeWidth="2.5"></line>
              <line x1="9" y1="9" x2="15" y2="15" stroke="#757575" strokeWidth="2.5"></line>
            </svg>
          </button>

          {activeTab === "profile" && (
            <div className="flex flex-col gap-6 h-full justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Profile</h3>
                
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src="https://images.unsplash.com/photo-1531123897727-8f129e120a4?auto=format&fit=crop&w=150&q=80" 
                    alt="Alice" className="w-20 h-20 rounded-full object-cover border-2 border-gray-100" 
                  />
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">Alice</h4>
                    <p className="text-gray-400 text-sm">Alice@gmail.com</p>
                  </div>
                  <button className="ml-auto py-2 px-4 border border-gray-300 rounded-md text-sm font-bold hover:bg-gray-50 flex items-center gap-2 transition shadow-sm text-gray-700">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    Change Profile
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-sm">Username</label>
                    <input type="text" defaultValue="Alice" className="w-full p-2.5 bg-gray-100 rounded-md border border-transparent focus:outline-none focus:bg-white focus:border-[#FFC700] text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-sm">Password</label>
                    <input type="password" defaultValue="123456789012" className="w-full p-2.5 bg-gray-100 rounded-md border border-transparent focus:outline-none focus:bg-white focus:border-[#FFC700] text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-sm">Email Address</label>
                    <input type="email" defaultValue="Alice@gmail.com" className="w-full p-2.5 bg-gray-100 rounded-md border border-transparent focus:outline-none focus:bg-white focus:border-[#FFC700] text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-sm">Confirm Password</label>
                    <input type="password" defaultValue="123456789012" className="w-full p-2.5 bg-gray-100 rounded-md border border-transparent focus:outline-none focus:bg-white focus:border-[#FFC700] text-gray-800" />
                  </div>
                </div>

                <input type="password" placeholder="Enter your current password to change your information." className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-[#FFC700] text-gray-700 placeholder-gray-400 text-sm" />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button onClick={onClose} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold rounded-md transition-colors text-sm">Cancel</button>
                <button className="px-6 py-2 bg-[#CCCCCC] text-white font-bold rounded-md cursor-not-allowed text-sm">Confirm</button>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="flex flex-col h-full justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Food Preferences</h3>
                <p className="text-gray-400 text-sm mb-6">Manage your food conditions for better recommended dishes.</p>

                <div className="mb-6">
                  <h4 className="font-bold text-gray-800 mb-3 text-base">Dietary Preferences</h4>
                  <div className="flex flex-wrap gap-3">
                    {["Vegetarian", "Halal", "No Pork"].map((item) => (
                      <button 
                        key={item} onClick={() => setDiet(item)}
                        className={`px-5 py-2.5 rounded-md font-bold text-sm transition-all ${
                          diet === item ? "bg-[#FFC700] text-black shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-800 mb-3 text-base">Allergies</h4>
                  <div className="flex flex-wrap gap-3">
                    {["Peanut", "Seafood", "Milk"].map((item) => (
                      <button 
                        key={item} onClick={() => setAllergy(item)}
                        className={`px-5 py-2.5 rounded-md font-bold text-sm transition-all ${
                          allergy === item ? "bg-[#FFC700] text-black shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Personalization</h3>
              <p className="text-gray-400 text-sm mb-8">Customize how AI helps tailor recipes specifically for your taste buds.</p>

              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h4 className="font-bold text-gray-800 text-base">Enable AI Recommendations</h4>
                    <p className="text-gray-400 text-sm mt-0.5">Use AI to suggest recipes based on your preferences.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={aiRec} onChange={() => setAiRec(!aiRec)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFC700]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h4 className="font-bold text-gray-800 text-base">Reset AI History</h4>
                    <p className="text-gray-400 text-sm mt-0.5">Clear all personalized AI history and restart recommendations.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={aiHistory} onChange={() => setAiHistory(!aiHistory)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFC700]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between pb-4">
                  <div>
                    <h4 className="font-bold text-gray-800 text-base">Daily Suggestions</h4>
                    <p className="text-gray-400 text-sm mt-0.5">Receive new recipe suggestions daily.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={dailySug} onChange={() => setDailySug(!dailySug)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFC700]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}