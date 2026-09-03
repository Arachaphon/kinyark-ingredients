"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation'
import { mutate } from "swr";

interface SettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: { id?: string; username?: string | null; email?: string; avatarUrl?: string | null } | null;
}

type TabType = "profile" | "preferences" | "ai";

export default function SettingModal({ isOpen, onClose, userProfile }: SettingModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    onClose();
    try {
      await fetch('/api/auth/logout', { method: 'POST', redirect: 'manual' });
    } catch {
      // ignore
    }
    await mutate('/api/auth/me', null, { revalidate: false });
    window.location.replace('/login');
  };

  const [activeTab, setActiveTab] = useState<TabType>("profile");
  
  const [aiRec, setAiRec] = useState(true);
  const [aiHistory, setAiHistory] = useState(true);
  const [dailySug, setDailySug] = useState(false);

  const [diet, setDiet] = useState("มังสวิรัติ");
  const [allergy, setAllergy] = useState("ถั่วลิสง");

  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formConfirmPassword, setFormConfirmPassword] = useState("");
  const [formCurrentPassword, setFormCurrentPassword] = useState("");
  
  // States สำหรับควบคุมการซ่อน/แสดงรหัสผ่าน
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [showFormConfirmPassword, setShowFormConfirmPassword] = useState(false);
  const [showFormCurrentPassword, setShowFormCurrentPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);


  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);


  useEffect(() => {
    if (userProfile) {
      setFormUsername(userProfile.username || "");
      setFormEmail(userProfile.email || "");
      setPreviewUrl(userProfile.avatarUrl || null);
    }
  }, [userProfile]);


  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setAvatarError("รองรับเฉพาะไฟล์ JPEG, PNG, WebP เท่านั้น");
        e.target.value = "";
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setAvatarError("ไฟล์ต้องมีขนาดไม่เกิน 5 MB");
        e.target.value = "";
        return;
      }
      setPreviewUrl(URL.createObjectURL(file));
      setAvatarFile(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const passwordError =
    formPassword.length > 0
      ? formPassword.length < 8
        ? "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร"
        : !/[A-Z]/.test(formPassword)
        ? "รหัสผ่านต้องมีอักษรตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว"
        : !/[a-z]/.test(formPassword)
        ? "รหัสผ่านต้องมีอักษรตัวพิมพ์เล็กอย่างน้อย 1 ตัว"
        : !/\d/.test(formPassword)
        ? "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว"
        : !/[^a-zA-Z0-9]/.test(formPassword)
        ? "รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว"
        : ""
      : "";

  const isFormValid = formPassword.length > 0 ? formCurrentPassword.length > 0 : true;
  const hasChanges =
    formUsername !== (userProfile?.username || "") ||
    formPassword !== "" ||
    formEmail !== (userProfile?.email || "") ||
    avatarFile !== null;

  if (!isOpen || !userProfile) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in font-anuphan">
      
      <div className="bg-white w-full max-w-[900px] h-auto md:h-[550px] max-h-[92vh] md:max-h-none rounded-[24px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100 animate-scale-up relative">
        
        <div className="w-full md:w-[260px] bg-[#FCB49560] p-4 md:p-6 flex flex-row md:flex-col justify-between shrink-0 text-black items-center md:items-stretch gap-2 md:gap-4 border-b md:border-b-0 md:border-r border-black/5">
          <div className="w-full flex md:flex-col justify-between md:justify-start items-center md:items-stretch">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black md:mb-8 tracking-wide whitespace-nowrap">ตั้งค่า</h2>
            
            <nav className="flex flex-row md:flex-col gap-1 sm:gap-2 overflow-x-auto no-scrollbar ml-4 md:ml-0">
              <button 
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 md:gap-3 py-1.5 px-3 md:py-3 md:px-4 rounded-xl text-left font-bold text-xs sm:text-sm md:text-base transition-all whitespace-nowrap ${
                  activeTab === "profile" ? "bg-white/20 shadow-sm" : "hover:bg-white/10"
                }`}
              >
                <svg className="hidden sm:block" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                โปรไฟล์
              </button>

              <button 
                onClick={() => setActiveTab("preferences")}
                className={`flex items-center gap-2 md:gap-3 py-1.5 px-3 md:py-3 md:px-4 rounded-xl text-left font-bold text-xs sm:text-sm md:text-base transition-all whitespace-nowrap ${
                  activeTab === "preferences" ? "bg-white/20 shadow-sm" : "hover:bg-white/10"
                }`}
              >
                <svg className="hidden sm:block" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
                ข้อมูลโภชนาการที่ชอบ
              </button>

              <button 
                onClick={() => setActiveTab("ai")}
                className={`flex items-center gap-2 md:gap-3 py-1.5 px-3 md:py-3 md:px-4 rounded-xl text-left font-bold text-xs sm:text-sm md:text-base transition-all whitespace-nowrap ${
                  activeTab === "ai" ? "bg-white/20 shadow-sm" : "hover:bg-white/10"
                }`}
              >
                <svg className="hidden sm:block" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path>
                </svg>
                การปรับแต่งด้วย AI
              </button>
            </nav>
          </div>

          <div className="hidden md:flex flex-col gap-1 border-t border-black/10 pt-4">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-3 w-full py-2.5 px-4 rounded-xl text-left font-bold text-red-600 hover:bg-red-500/10 transition-colors"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              ลบบัญชีผู้ใช้
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full py-2.5 px-4 rounded-xl text-left font-bold text-black hover:bg-black/5 transition-colors"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              ออกจากระบบ
            </button>
          </div>
        </div>

        <div className="flex-grow p-5 sm:p-6 md:p-8 relative flex flex-col overflow-y-auto bg-white min-h-0">
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-black transition-colors z-50"
          >
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="#EAEAEA" stroke="none"></circle>
              <line x1="15" y1="9" x2="9" y2="15" stroke="#757575" strokeWidth="2.5"></line>
              <line x1="9" y1="9" x2="15" y2="15" stroke="#757575" strokeWidth="2.5"></line>
            </svg>
          </button>

          {activeTab === "profile" && (
            <div className="flex flex-col gap-4 md:gap-6 h-full justify-between">
              <div className="overflow-y-auto md:overflow-visible pr-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 md:mb-6">โปรไฟล์</h3>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-4 md:mb-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={previewUrl} 
                      alt="Preview" className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gray-100" 
                    />
                  ) : userProfile?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- TODO: user-controlled arbitrary domain, no validation yet
                    <img 
                      src={userProfile.avatarUrl} 
                      alt={userProfile?.username || "User"} className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gray-100" 
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gray-100 border-2 border-gray-100 flex items-center justify-center shrink-0">
                      <span className="text-xl sm:text-3xl font-bold text-gray-400">
                        {userProfile?.username?.charAt(0).toUpperCase() || userProfile?.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  <div className="text-center sm:text-left">
                    <h4 className="text-base sm:text-xl font-bold text-gray-800">{userProfile?.username || "User"}</h4>
                    <p className="text-gray-400 text-xs sm:text-sm">{userProfile?.email || ""}</p>
                  </div>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <button 
                    onClick={handleUploadClick}
                    type="button"
                    className="w-full sm:w-auto sm:ml-auto py-1.5 px-3 border border-gray-300 rounded-md text-xs sm:text-sm font-bold hover:bg-gray-50 flex items-center justify-center gap-2 transition shadow-sm text-gray-700"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    เปลี่ยนรูปโปรไฟล์
                  </button>
                  {avatarError && (
                    <p className="text-red-500 text-xs mt-1 w-full text-center sm:text-left">{avatarError}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-xs sm:text-sm">ชื่อผู้ใช้งาน</label>
                    <input type="text" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} className="w-full p-2.5 bg-gray-100 rounded-md border border-transparent focus:outline-none focus:bg-white focus:border-[#FFC700] text-gray-800 text-sm" />
                  </div>
                  
                  {/* ช่องรหัสผ่านใหม่ พร้อมไอคอนลูกตา */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-xs sm:text-sm">รหัสผ่านใหม่</label>
                    <div className="relative">
                      <input 
                        type={showFormPassword ? "text" : "password"} 
                        value={formPassword} 
                        onChange={(e) => setFormPassword(e.target.value)} 
                        placeholder="กรอกรหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)" 
                        className="w-full p-2.5 pr-10 bg-gray-100 rounded-md border border-transparent focus:outline-none focus:bg-white focus:border-[#FFC700] text-gray-800 placeholder-gray-400 text-sm" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showFormPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 17.772 17.772m-10.46-10.46a4.5 4.5 0 0 0 6.364 6.364m-6.364-6.364a4.5 4.5 0 0 1 6.364 6.364" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-xs sm:text-sm">ที่อยู่อีเมล</label>
                    <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full p-2.5 bg-gray-100 rounded-md border border-transparent focus:outline-none focus:bg-white focus:border-[#FFC700] text-gray-800 text-sm" />
                  </div>

                  {/* ช่องยืนยันรหัสผ่านใหม่ พร้อมไอคอนลูกตา */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-xs sm:text-sm">ยืนยันรหัสผ่านใหม่</label>
                    <div className="relative">
                      <input 
                        type={showFormConfirmPassword ? "text" : "password"} 
                        value={formConfirmPassword} 
                        onChange={(e) => setFormConfirmPassword(e.target.value)} 
                        placeholder="ยืนยันรหัสผ่านใหม่" 
                        className="w-full p-2.5 pr-10 bg-gray-100 rounded-md border border-transparent focus:outline-none focus:bg-white focus:border-[#FFC700] text-gray-800 placeholder-gray-400 text-sm" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormConfirmPassword(!showFormConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showFormConfirmPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 17.772 17.772m-10.46-10.46a4.5 4.5 0 0 0 6.364 6.364m-6.364-6.364a4.5 4.5 0 0 1 6.364 6.364" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ช่องรหัสผ่านปัจจุบัน พร้อมไอคอนลูกตา */}
                <div className="relative">
                  <input 
                    type={showFormCurrentPassword ? "text" : "password"} 
                    value={formCurrentPassword} 
                    onChange={(e) => { setFormCurrentPassword(e.target.value); setCurrentPasswordError(""); }} 
                    placeholder="กรุณากรอกรหัสผ่านปัจจุบัน (เฉพาะเมื่อต้องการเปลี่ยนรหัสผ่าน)" 
                    className="w-full p-2.5 pr-10 border border-gray-300 rounded-md focus:outline-none focus:border-[#FFC700] text-gray-700 placeholder-gray-400 text-xs sm:text-sm" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormCurrentPassword(!showFormCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showFormCurrentPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 17.772 17.772m-10.46-10.46a4.5 4.5 0 0 0 6.364 6.364m-6.364-6.364a4.5 4.5 0 0 1 6.364 6.364" />
                      </svg>
                    )}
                  </button>
                </div>

                {currentPasswordError && (
                  <p className="text-red-500 text-xs mt-1">{currentPasswordError}</p>
                )}

                {formPassword.length > 0 && formPassword !== formConfirmPassword && (
                  <p className="text-red-500 text-xs mt-1">รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน</p>
                )}
              </div>

              <div className="flex md:hidden flex-col gap-2 border-t border-gray-100 pt-4 mt-4">
                <button 
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-black text-xs font-bold rounded-lg text-center transition shadow-sm"
                >
                  ออกจากระบบ
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2 px-4 text-red-600 text-xs font-bold text-center hover:bg-red-50 rounded-lg transition"
                >
                  ลบบัญชีผู้ใช้
                </button>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-2">
                <button onClick={onClose} className="px-5 py-2 sm:px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold rounded-md transition-colors text-xs sm:text-sm">ยกเลิก</button>
                <button
                  disabled={!isFormValid || !hasChanges || isSaving || (formPassword.length > 0 && formPassword !== formConfirmPassword) || !!passwordError}
                  onClick={async () => {
                    if (formPassword.length > 0 && formPassword !== formConfirmPassword) return;
                    setCurrentPasswordError("");
                    setIsSaving(true);
                    try {
                      let updatedUser = null;

                      if (avatarFile) {
                        const formData = new FormData();
                        formData.append("avatar", avatarFile);
                        const uploadRes = await fetch("/api/users/me/avatar", {
                          method: "POST",
                          body: formData,
                        });
                        if (!uploadRes.ok) {
                          const err = await uploadRes.json();
                          setCurrentPasswordError(err.error || "เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์");
                          return;
                        }
                        const uploadData = await uploadRes.json();
                        updatedUser = uploadData?.data?.user;
                      }

                      const hasOtherChanges =
                        formUsername !== (userProfile?.username || "") ||
                        formPassword !== "" ||
                        formEmail !== (userProfile?.email || "");

                      if (hasOtherChanges) {
                        const body: Record<string, string> = {};
                        if (formCurrentPassword) body.currentPassword = formCurrentPassword;
                        if (formUsername !== (userProfile?.username || "")) body.username = formUsername;
                        if (formEmail !== (userProfile?.email || "")) body.email = formEmail;
                        if (formPassword.length > 0) body.newPassword = formPassword;

                        const res = await fetch("/api/users/me", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(body),
                        });

                        if (!res.ok) {
                          const err = await res.json();
                          setCurrentPasswordError(err.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
                          return;
                        }

                        const updatedData = await res.json().catch(() => null);
                        if (updatedData?.data?.user) {
                          updatedUser = updatedData.data.user;
                        }
                      }

                      await mutate(
                        "/api/auth/me",
                        updatedUser ? { user: updatedUser } : undefined,
                        { revalidate: true }
                      );

                      setFormPassword("");
                      setFormConfirmPassword("");
                      setFormCurrentPassword("");
                      setCurrentPasswordError("");
                      setAvatarFile(null);
                      setPreviewUrl(null);
                      onClose();
                    } catch {
                      setCurrentPasswordError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  className={`px-5 py-2 sm:px-6 font-bold rounded-md transition-colors text-xs sm:text-sm ${
                    !isFormValid || !hasChanges || isSaving || (formPassword.length > 0 && formPassword !== formConfirmPassword) || !!passwordError
                      ? "bg-[#CCCCCC] text-white cursor-not-allowed"
                      : "bg-[#FFC700] text-black hover:bg-[#e6b300] cursor-pointer"
                  }`}
                >
                  {isSaving ? "กำลังบันทึก..." : "ยืนยัน"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="flex flex-col h-full justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">ข้อมูลโภชนาการที่ชอบ</h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">จัดการเงื่อนไขด้านอาหารของคุณเพื่อการแนะนำเมนูที่ดียิ่งขึ้น</p>

                <div className="mb-5">
                  <h4 className="font-bold text-gray-800 mb-2.5 text-sm sm:text-base">ประเภทการทานอาหาร</h4>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {["มังสวิรัติ", "ฮาลาล", "ไม่ทานเนื้อหมู"].map((item) => (
                      <button 
                        key={item} onClick={() => setDiet(item)}
                        className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-md font-bold text-xs sm:text-sm transition-all ${
                          diet === item ? "bg-[#FCB49560] text-black shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-800 mb-2.5 text-sm sm:text-base">อาหารที่แพ้</h4>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {["ถั่วลิสง", "อาหารทะเล", "นม"].map((item) => (
                      <button 
                        key={item} onClick={() => setAllergy(item)}
                        className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-md font-bold text-xs sm:text-sm transition-all ${
                          allergy === item ? "bg-[#FCB49560] text-black shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex md:hidden flex-col gap-2 border-t border-gray-100 pt-4 mt-8">
                <button 
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-black text-xs font-bold rounded-lg text-center transition shadow-sm"
                >
                  ออกจากระบบ
                </button>
                <button className="w-full py-2 px-4 text-red-600 text-xs font-bold text-center hover:bg-red-50 rounded-lg transition">
                  ลบบัญชีผู้ใช้
                </button>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">การปรับแต่งด้วย AI</h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-5 sm:mb-8">ตั้งค่าเพื่อให้ AI ช่วยคัดสรรสูตรอาหารพิเศษให้ตรงกับความชอบของคุณ</p>

                <div className="flex flex-col gap-4 sm:gap-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 sm:pb-4 gap-4">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm sm:text-base">เปิดใช้งานการแนะนำด้วย AI</h4>
                      <p className="text-gray-400 text-xs sm:text-sm mt-0.5">ใช้ระบบ AI ในการเสนอสูตรอาหารที่ใช่ตามประวัติและความชอบของคุณ</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" checked={aiRec} onChange={() => setAiRec(!aiRec)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FCB49560]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 sm:pb-4 gap-4">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm sm:text-base">ล้างประวัติการจำของ AI</h4>
                      <p className="text-gray-400 text-xs sm:text-sm mt-0.5">คืนค่าประวัติเฉพาะบุคคลทั้งหมดเพื่อเริ่มคำนวณการแนะนำใหม่</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" checked={aiHistory} onChange={() => setAiHistory(!aiHistory)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FCB49560]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pb-3 sm:pb-4 gap-4">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm sm:text-base">แนะนำประจำวัน</h4>
                      <p className="text-gray-400 text-xs sm:text-sm mt-0.5">รับข้อเสนอแนะสูตรอาหารใหม่ ๆ ในทุก ๆ วัน</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" checked={dailySug} onChange={() => setDailySug(!dailySug)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FCB49560]"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex md:hidden flex-col gap-2 border-t border-gray-100 pt-4 mt-8">
                <button 
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-black text-xs font-bold rounded-lg text-center transition shadow-sm"
                >
                  ออกจากระบบ
                </button>
                <button className="w-full py-2 px-4 text-red-600 text-xs font-bold text-center hover:bg-red-50 rounded-lg transition">
                  ลบบัญชีผู้ใช้
                </button>
              </div>
            </div>
          )}

        </div>

        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-[24px]">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">ลบบัญชีผู้ใช้</h3>
              <p className="text-gray-500 text-sm mb-4">การกระทำนี้ไม่สามารถย้อนกลับได้ กรุณากรอกรหัสผ่านเพื่อยืนยันการลบบัญชี</p>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(""); }}
                placeholder="กรอกรหัสผ่าน"
                className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-red-500 text-gray-700 placeholder-gray-400 text-sm mb-3"
              />
              {deleteError && (
                <p className="text-red-500 text-xs mb-3">{deleteError}</p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); }}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold rounded-md transition-colors text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  disabled={isDeleting || deletePassword.length === 0}
                  onClick={async () => {
                    setDeleteError("");
                    setIsDeleting(true);
                    try {
                      const res = await fetch("/api/auth/delete-account", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ password: deletePassword }),
                      });
                      if (!res.ok) {
                        const err = await res.json();
                        setDeleteError(err.message || "เกิดข้อผิดพลาด");
                        return;
                      }
                      await mutate('/api/auth/me', null, { revalidate: false });
                      window.location.replace('/login');
                    } catch {
                      setDeleteError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className={`px-4 py-2 font-bold rounded-md transition-colors text-sm ${
                    isDeleting || deletePassword.length === 0
                      ? "bg-red-300 text-white cursor-not-allowed"
                      : "bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                  }`}
                >
                  {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}