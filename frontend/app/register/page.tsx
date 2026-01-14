'use client';
// 👇 แก้ path ให้ตรงกับที่ไฟล์ global.d.ts อยู่จริงในเครื่องคุณ (บางทีอาจเป็น ../../src/...)
/// <reference path="../../src/global.d.ts" />

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React from 'react';

const Icons = {
  User: () => <span className="w-4 h-4 inline-flex items-center justify-center">👤</span>,
  Mail: () => <span className="w-4 h-4 inline-flex items-center justify-center">✉️</span>,
  Phone: () => <span className="w-4 h-4 inline-flex items-center justify-center">📞</span>,
  Lock: () => <span className="w-4 h-4 inline-flex items-center justify-center">🔒</span>,
  Map: () => <span className="w-4 h-4 inline-flex items-center justify-center">🗺️</span>,
  Calendar: () => <span className="w-4 h-4 inline-flex items-center justify-center">📅</span>
};

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({ 
    username: '', email: '', password: '', confirmPassword: '', 
    birthDay: '', birthMonth: '', birthYear: '',
    phone: '', address: '' 
  });
  const [error, setError] = useState('');

  // Refs
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // กรองให้พิมพ์ได้แค่ตัวเลข
    if (['phone', 'birthDay', 'birthMonth', 'birthYear'].includes(name)) {
        if (!/^\d*$/.test(value)) return;
    }

    // Auto Focus Logic
    if (name === 'birthDay' && value.length === 2) {
        monthRef.current?.focus();
    }
    if (name === 'birthMonth' && value.length === 2) {
        yearRef.current?.focus();
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, prevRef: React.RefObject<HTMLInputElement | null>) => {
    if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '') {
        prevRef.current?.focus();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- Validation ---
    if (formData.password !== formData.confirmPassword) { setError('รหัสผ่านไม่ตรงกัน'); return; }
    if (formData.password.length < 4) { setError('รหัสผ่านสั้นเกินไป'); return; }

    // --- Date Validation & Formatting ---
    // ตรวจสอบว่ากรอกครบไหม
    if (!formData.birthDay || !formData.birthMonth || !formData.birthYear) {
        setError('กรุณากรอกวันเดือนปีเกิดให้ครบ');
        return;
    }

    const yearBE = parseInt(formData.birthYear);
    const yearAD = yearBE - 543; // แปลง พ.ศ. เป็น ค.ศ.
    
    // สร้าง Date Object เพื่อเช็กอายุ
    const birthDateObj = new Date(yearAD, parseInt(formData.birthMonth) - 1, parseInt(formData.birthDay));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (birthDateObj > today) {
        setError('วันเกิดต้องไม่เกินวันปัจจุบัน');
        return;
    }

    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
    }

    if (age < 10) { setError('ขออภัย ผู้ใช้งานต้องมีอายุ 10 ปีขึ้นไป'); return; }

    // --- Sending to Backend ---
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // จัดฟอร์แมตวันที่ให้เป็น YYYY-MM-DD (ISO Format) เพื่อส่งให้ Database
      const formattedBirthDate = `${yearAD}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`;

      const res = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: formData.username,
            password: formData.password,
            email: formData.email,
            phone: formData.phone,
            birthdate: formattedBirthDate, // ✅ ส่งแบบ Date String
            address: formData.address || '-' // ถ้าว่างส่งขีด
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'สมัครสมาชิกไม่สำเร็จ');
      }

      // ✅ สมัครสำเร็จ -> ไปหน้า Login
      alert('สมัครสมาชิกเรียบร้อย! กรุณาเข้าสู่ระบบ');
      router.push('/login');

    } catch (err: unknown) { // ✅ เปลี่ยนเป็น unknown
  console.error("Register Error:", err);

  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
  }
}
  };
  
  // --- UI ส่วนล่างนี้เหมือนเดิม 100% ---
  return (
    <main className="relative w-screen h-screen flex flex-col items-center justify-center p-4 bg-slate-900 font-sans overflow-hidden">
      
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-slate-900 to-black"></div>
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/30 blur-[120px] animate-pulse-slow mix-blend-screen"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-pink-600/20 blur-[120px] animate-pulse-slow delay-1000 mix-blend-screen"></div>
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"></div>
      </div>

      {/* Card Container */}
      <div className="relative z-10 w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.3)] animate-enter">
        
        {/* Header */}
        <div className="text-center mb-6 flex items-center justify-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-3xl shadow-inner border border-white/10 animate-bounce">
                📝
            </div>
            <div className="text-left">
                <h1 className="text-2xl font-black text-white uppercase tracking-wider leading-none">สมัครสมาชิก</h1>
                <p className="text-xs text-gray-400 font-bold tracking-wider mt-1">ลงทะเบียนเข้าสู่ระบบ SATI</p>
            </div>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-3">
            
            {/* Row 1: Username & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="group relative">
                    <label className="text-[10px] text-gray-400 font-bold ml-2 mb-1 block group-focus-within:text-blue-400 transition-colors uppercase tracking-wider">ชื่อผู้ใช้</label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors"><Icons.User /></div>
                        <input type="text" name="username" required value={formData.username} onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600"
                            placeholder="ตั้งชื่อผู้ใช้" autoComplete="off"
                        />
                    </div>
                </div>
                <div className="group relative">
                    <label className="text-[10px] text-gray-400 font-bold ml-2 mb-1 block group-focus-within:text-blue-400 transition-colors uppercase tracking-wider">อีเมล</label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors"><Icons.Mail /></div>
                        <input type="email" name="email" required value={formData.email} onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600"
                            placeholder="example@mail.com"
                        />
                    </div>
                </div>
            </div>

            {/* Row 2: เบอร์โทร & วันเกิด */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="group relative">
                    <label className="text-[10px] text-gray-400 font-bold ml-2 mb-1 block group-focus-within:text-yellow-400 transition-colors uppercase tracking-wider">เบอร์โทรศัพท์</label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-400 transition-colors"><Icons.Phone /></div>
                        <input 
                            type="tel" name="phone" required value={formData.phone} onChange={handleChange} maxLength={10}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all placeholder-gray-600"
                            placeholder="08xxxxxxxx"
                        />
                    </div>
                </div>
                
                <div className="group relative">
                    <label className="text-[10px] text-gray-400 font-bold ml-2 mb-1 block group-focus-within:text-yellow-400 transition-colors uppercase tracking-wider">วันเดือนปีเกิด (วว/ดด/ปี พ.ศ.)</label>
                    
                    <div className="relative flex items-center w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 transition-all focus-within:border-yellow-500 focus-within:ring-1 focus-within:ring-yellow-500">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-400 transition-colors pointer-events-none">
                            <Icons.Calendar />
                        </div>

                        <div className="flex items-center gap-1 pl-6 w-full text-white text-sm">
                            <input 
                                ref={dayRef}
                                type="tel" name="birthDay" placeholder="01" maxLength={2} required
                                value={formData.birthDay} onChange={handleChange} 
                                className="w-[3ch] bg-transparent text-center focus:outline-none placeholder-gray-600"
                            />
                            <span className="text-gray-500">/</span>
                            
                            <input 
                                ref={monthRef}
                                type="tel" name="birthMonth" placeholder="01" maxLength={2} required
                                value={formData.birthMonth} onChange={handleChange} 
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, dayRef)} 
                                className="w-[3ch] bg-transparent text-center focus:outline-none placeholder-gray-600"
                            />
                            <span className="text-gray-500">/</span>
                            
                            <input 
                                ref={yearRef}
                                type="tel" name="birthYear" placeholder="2543" maxLength={4} required
                                value={formData.birthYear} onChange={handleChange} 
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, monthRef)}
                                className="w-[5ch] bg-transparent text-center focus:outline-none placeholder-gray-600"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 3: รหัสผ่าน */}
            <div className="grid grid-cols-2 gap-3">
                <div className="group relative">
                    <label className="text-[10px] text-gray-400 font-bold ml-2 mb-1 block group-focus-within:text-purple-400 transition-colors uppercase tracking-wider">รหัสผ่าน</label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors"><Icons.Lock /></div>
                        <input type="password" name="password" required value={formData.password} onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-gray-600"
                            placeholder="••••••"
                        />
                    </div>
                </div>
                <div className="group relative">
                    <label className="text-[10px] text-gray-400 font-bold ml-2 mb-1 block group-focus-within:text-green-400 transition-colors uppercase tracking-wider">ยืนยันรหัสผ่าน</label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-400 transition-colors"><Icons.Lock /></div>
                        <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-gray-600"
                            placeholder="••••••"
                        />
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="text-red-400 text-xs text-center bg-red-500/10 p-2 rounded-xl border border-red-500/20 animate-pulse font-bold flex items-center justify-center gap-2">
                    <span>⚠️</span> {error}
                </div>
            )}

            {/* Action Area */}
            <div className="mt-4 flex flex-col gap-3">
                <button 
                    type={'submit' as const} 
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold tracking-widest uppercase hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group shadow-lg border border-white/10"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span className="text-xs">กำลังบันทึกข้อมูล...</span>
                        </div>
                    ) : (
                        <span className="relative z-10 flex items-center justify-center gap-2 text-sm">
                            ลงทะเบียน <span className="text-lg">🚀</span>
                        </span>
                    )}
                </button>

                <div className="text-center text-xs text-gray-400 font-bold tracking-wide">
                    มีบัญชีอยู่แล้ว? 
                    <Link href="/login" className="text-emerald-400 ml-2 hover:text-emerald-300 underline decoration-dashed underline-offset-4 transition-colors">
                        เข้าสู่ระบบ
                    </Link>
                </div>
            </div>
        </form>
      </div>
    </main>
  );
}