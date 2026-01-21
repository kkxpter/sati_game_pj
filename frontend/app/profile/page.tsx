'use client';
/// <reference path="../../src/global.d.ts" />

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { playSound } from '@/app/lib/sound';

// 1. Interfaces
interface UserData {
  username: string;
  emoji?: string;
  password?: string;
}

interface GameStats {
  normal: number;
  virus: number;
  chat: number;
}

// 2. Icons (เหมือนเดิม)
const Icons = {
  User: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Lock: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  LogOut: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Trophy: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  Zap: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Message: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
};

const EMOJI_OPTIONS = ['🧠', '🎮', '🔥', '⚡', '🐱', '🤖', '👻', '💎', '🦊', '👾'];

export default function ProfilePage() {
  const router = useRouter();
  
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<GameStats>({ normal: 0, virus: 0, chat: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [editMode, setEditMode] = useState<'none' | 'info' | 'password'>('none');
  
  const [tempUsername, setTempUsername] = useState('');
  const [tempEmoji, setTempEmoji] = useState('🧠');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const storedUserStr = localStorage.getItem('user');
      const savedStatsStr = localStorage.getItem('cyberStakes_played');
      
      if (storedUserStr) {
        const userData = JSON.parse(storedUserStr);
        setUser(userData);
        setTempUsername(userData.username);
        setTempEmoji(userData.emoji || '🧠');
      } else {
        router.push('/login');
      }

      if (savedStatsStr) {
        setStats(JSON.parse(savedStatsStr));
      }
      
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  const handleSaveInfo = () => {
    playSound('click');
    if (!user) return;
    if (!tempUsername.trim()) {
        alert("กรุณาระบุชื่อผู้ใช้งาน");
        return;
    }
    const updatedUser = { ...user, username: tempUsername, emoji: tempEmoji };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setEditMode('none');
    alert('บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว');
  };

  const handleSavePassword = () => {
    playSound('click');
    if (!user) return;
    if (user.password && currentPasswordInput !== user.password) {
        alert('รหัสผ่านปัจจุบันไม่ถูกต้อง!');
        return;
    }
    if (newPassword !== confirmPassword) {
      alert('รหัสผ่านใหม่ไม่ตรงกัน!');
      return;
    }
    if (newPassword.length < 4) {
      alert('รหัสผ่านใหม่สั้นเกินไป (ต้อง 4 ตัวขึ้นไป)!');
      return;
    }
    const updatedUser = { ...user, password: newPassword };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmPassword('');
    setEditMode('none');
    alert('เปลี่ยนรหัสผ่านสำเร็จ!');
  };

  const handleLogout = () => {
    playSound('click');
    if (confirm('ยืนยันการออกจากระบบ?')) {
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-slate-950" />;

  return (
    // ✅ แก้ไข Layout:
    // - min-h-screen: ให้สูงอย่างน้อยเท่าจอ แต่ยืดได้ถ้ายาวกว่า
    // - overflow-y-auto: ให้มี Scrollbar ถ้าเนื้อหายาวเกิน
    // - justify-start: เริ่มวางเนื้อหาจากด้านบน (ไม่กึ่งกลางแนวตั้ง) ป้องกันหัว/ท้ายขาดในจอเล็ก
    <main className="relative min-h-screen w-full flex flex-col items-center justify-start py-8 px-4 font-sans text-slate-200 overflow-y-auto">
      
      {/* ==================== ✨ Fixed Background (พื้นหลังนิ่ง) ✨ ==================== */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-slate-950"></div>
        <div className="absolute inset-0 z-0 w-[200%] h-full animate-scroll-bg opacity-40">
            <div className="w-1/2 h-full bg-cover bg-center grayscale-[50%]" style={{ backgroundImage: "url('/images/bg1.png')" }}></div>
            <div className="w-1/2 h-full bg-cover bg-center grayscale-[50%]" style={{ backgroundImage: "url('/images/bg1.png')" }}></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90 z-10"></div>
        <div className="absolute top-[10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse-slow mix-blend-screen z-20"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse-slow delay-1000 mix-blend-screen z-20"></div>
      </div>

      {/* ==================== 🎫 Content Area ==================== */}
      {/* ใช้ mb-8 เพื่อเว้นระยะล่างให้ Scroll ลงไปสุดได้สวยๆ */}
      <div className="relative z-30 w-full max-w-md mb-8 animate-fade-in">
        
        {/* สีพื้นหลังทึบขึ้น: bg-slate-900/95 */}
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden relative">
            
            {/* Decorative Line */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent opacity-70"></div>
            
            <div className="flex flex-col items-center gap-6 relative z-10">
                
                {/* --- Avatar Display --- */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-purple-500 to-blue-500">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-6xl shadow-inner relative overflow-hidden">
                            <span className="drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                                {editMode === 'info' ? tempEmoji : user?.emoji}
                            </span>
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-full pointer-events-none"></div>
                        </div>
                    </div>
                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-4 border-slate-900 shadow-md"></div>
                </div>

                {/* --- View Mode: Stats --- */}
                {editMode === 'none' && user && (
                    <div className="w-full text-center animate-fade-in space-y-6">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight">{user.username}</h2>
                            <div className="inline-block mt-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                <span className="text-[10px] text-purple-300 uppercase tracking-widest font-bold">
                                    ✨ สมาชิกผู้เล่นทั่วไป
                                </span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 w-full mt-2">
                            {/* Quiz */}
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-green-500/10 hover:border-green-500/30 transition-all group cursor-default">
                                <div className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-300 mb-2 group-hover:scale-110 transition-transform">
                                    <Icons.Trophy />
                                </div>
                                <div className="text-center">
                                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Quiz</div>
                                    <div className="text-lg font-black text-white">{stats.normal} <span className="text-[10px] font-normal text-gray-500">วิน</span></div>
                                </div>
                            </div>
                            {/* Virus */}
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all group cursor-default">
                                <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-300 mb-2 group-hover:scale-110 transition-transform">
                                    <Icons.Zap />
                                </div>
                                <div className="text-center">
                                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Virus</div>
                                    <div className="text-lg font-black text-white">{stats.virus} <span className="text-[10px] font-normal text-gray-500">แต้ม</span></div>
                                </div>
                            </div>
                            {/* Chat */}
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group cursor-default">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 mb-2 group-hover:scale-110 transition-transform">
                                    <Icons.Message />
                                </div>
                                <div className="text-center">
                                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Chat</div>
                                    <div className="text-lg font-black text-white">{stats.chat} <span className="text-[10px] font-normal text-gray-500">รอด</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Edit Info Form --- */}
                {editMode === 'info' && (
                    <div className="w-full space-y-5 animate-slide-up text-left">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-300 ml-1">ชื่อที่ใช้แสดง (Display Name)</label>
                            <input 
                                type="text" 
                                value={tempUsername} 
                                onChange={(e) => setTempUsername(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 focus:border-purple-500/50 text-white p-4 rounded-xl outline-none focus:ring-2 ring-purple-500/20 transition-all placeholder:text-gray-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-300 ml-1">เลือกรูปอวตาร (Select Avatar)</label>
                            <div className="grid grid-cols-5 gap-2 p-2 bg-slate-800 rounded-xl border border-white/10">
                                {EMOJI_OPTIONS.map(e => (
                                    <button 
                                        key={e} 
                                        onClick={() => setTempEmoji(e)} 
                                        className={`aspect-square text-2xl rounded-lg flex items-center justify-center transition-all duration-200 ${
                                            tempEmoji === e ? 'bg-purple-600 shadow-lg scale-110' : 'hover:bg-white/10 opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleSaveInfo} className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-white shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60 transition-all flex items-center justify-center gap-2">
                            <Icons.Check /> บันทึกการเปลี่ยนแปลง
                        </button>
                    </div>
                )}

                {/* --- Edit Password Form --- */}
                {editMode === 'password' && (
                    <div className="w-full space-y-4 animate-slide-up text-left">
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs text-center mb-2">
                            🔒 กรุณายืนยันรหัสผ่านเดิมก่อนตั้งรหัสใหม่
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">รหัสผ่านปัจจุบัน</label>
                            <input 
                                type="password" 
                                value={currentPasswordInput} 
                                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 focus:border-amber-500/50 text-white p-3.5 rounded-xl outline-none focus:ring-2 ring-amber-500/20 transition-all"
                            />
                        </div>

                        <div className="h-px bg-white/10 my-2"></div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">รหัสผ่านใหม่</label>
                            <input 
                                type="password" 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 focus:border-red-500/50 text-white p-3.5 rounded-xl outline-none focus:ring-2 ring-red-500/20 transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">ยืนยันรหัสผ่านใหม่</label>
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 focus:border-red-500/50 text-white p-3.5 rounded-xl outline-none focus:ring-2 ring-red-500/20 transition-all"
                            />
                        </div>
                        <button onClick={handleSavePassword} className="w-full py-3.5 mt-2 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white shadow-lg shadow-red-900/40 hover:shadow-red-900/60 transition-all flex items-center justify-center gap-2">
                            <Icons.Lock /> อัปเดตรหัสผ่าน
                        </button>
                    </div>
                )}

                {/* --- Menu Buttons --- */}
                <div className="w-full flex flex-col gap-3 pt-5 border-t border-white/10 mt-2">
                    {editMode === 'none' ? (
                        <>
                            {/* Edit Info */}
                            <button onClick={() => setEditMode('info')} className="relative group w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-400/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all overflow-hidden">
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                                        <Icons.User />
                                    </div>
                                    <div className="text-left flex-1 font-bold text-gray-300 group-hover:text-white">แก้ไขข้อมูลส่วนตัว</div>
                                    <div className="text-purple-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</div>
                                </div>
                            </button>

                            {/* Change Password */}
                            <button onClick={() => setEditMode('password')} className="relative group w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-400/50 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)] transition-all overflow-hidden">
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-300 group-hover:scale-110 transition-transform">
                                        <Icons.Lock />
                                    </div>
                                    <div className="text-left flex-1 font-bold text-gray-300 group-hover:text-white">เปลี่ยนรหัสผ่าน</div>
                                    <div className="text-yellow-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</div>
                                </div>
                            </button>

                            {/* Back to Home */}
                            <button onClick={() => router.push('/')} className="relative group w-full p-3 rounded-xl bg-slate-800/50 border border-white/10 hover:border-white/30 hover:bg-slate-800 transition-all overflow-hidden mt-1">
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-10 h-10 rounded-lg bg-gray-700/50 border border-gray-600 flex items-center justify-center text-gray-300 group-hover:text-white group-hover:scale-110 transition-transform">
                                        <Icons.Home />
                                    </div>
                                    <div className="text-left flex-1 font-bold text-gray-300 group-hover:text-white">กลับสู่เมนูหลัก</div>
                                    <div className="text-white opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</div>
                                </div>
                            </button>

                            {/* Logout */}
                            <button onClick={handleLogout} className="w-full py-2 text-[10px] text-red-400 font-bold uppercase tracking-[0.1em] hover:text-red-300 transition-all text-center mt-4 opacity-60 hover:opacity-100 flex items-center justify-center gap-2">
                                <Icons.LogOut />
                                <span>ออกจากระบบ</span>
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => setEditMode('none')} 
                            className="w-full py-3 text-xs text-gray-400 font-bold uppercase tracking-widest hover:text-white flex justify-center items-center gap-2 transition-all bg-white/5 rounded-xl hover:bg-white/10"
                        >
                            <span>✕</span> ยกเลิกการแก้ไข
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}