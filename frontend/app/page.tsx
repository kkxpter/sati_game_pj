'use client';
// 👇 เพิ่มบรรทัดนี้ถ้ายังไม่มี (แก้ Error TypeScript)
/// <reference path="../src/global.d.ts" />

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { playSound } from '@/app/lib/sound';

// 1. เพิ่ม Interface
interface UserData {
  username: string;
}

interface GameStats {
  normal: number;
  virus: number;
  chat: number;
}

export default function HomePage() {
  const router = useRouter();
  const [view, setView] = useState<'home' | 'bet'>('home');
  
  // 2. เพิ่ม State สำหรับเก็บ User
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<GameStats>({ normal: 0, virus: 0, chat: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 3. โหลดข้อมูล User และ Stats
    const loadData = () => {
      try {
        const savedStatsStr = localStorage.getItem('cyberStakes_played');
        const storedUserStr = localStorage.getItem('user'); // ✅ ใช้ key 'user' ให้ตรงกับหน้า Login

        const savedStats = savedStatsStr ? JSON.parse(savedStatsStr) : {};
        const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;

        setStats({ 
          normal: savedStats.normal || 0, 
          virus: savedStats.virus || 0,
          chat: savedStats.chat || 0 
        });

        if (storedUser) {
          setUser(storedUser);
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error("Error loading localStorage:", error);
        setIsLoaded(true); 
      }
    };
    loadData();
  }, []);

  const handleLogout = () => {
    playSound('click');
    localStorage.removeItem('user'); // ✅ ลบข้อมูล user
    setUser(null);
    router.push('/login');
  };

  const handleStart = (mode: string) => {
    playSound('click');

    // ✅ 4. เช็คก่อนว่า Login หรือยัง (ถ้ายัง ให้ไปหน้า Login)
    if (!user) {
        router.push('/login');
        return; 
    }

    if (mode === 'normal') setView('bet'); 
    else if (mode === 'virus') router.push('/game/virus'); 
    else if (mode === 'chat') router.push('/game/chat');
  };

  const selectDifficulty = (diff: string) => {
    playSound('click');
    
    // ✅ 5. ใช้ window.location.href เพื่อแก้ปัญหาหน้าค้าง
    console.log('Navigating to:', `/game/quiz?diff=${diff}`);
    window.location.href = `/game/quiz?diff=${diff}`;
  };

  return (
    <main className="relative w-screen h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-slate-900 font-sans">
      
      {/* ==================== ✨ พื้นหลัง ✨ ==================== */}
      <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-slate-900 to-black"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/30 blur-[120px] animate-pulse-slow mix-blend-screen"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-pink-600/20 blur-[120px] animate-pulse-slow delay-1000 mix-blend-screen"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"></div>
      </div>

      {/* ==================== 👤 User Profile (มุมขวาบน) ==================== */}
      {isLoaded && (
          <div className="absolute top-4 right-4 z-50 animate-fade-in">
            {user ? (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-300 leading-none">Logged in as</span>
                  <span className="text-sm font-bold text-white leading-none">{user.username}</span>
                </div>
                <button onClick={handleLogout} className="ml-2 p-1.5 rounded-full bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all" title="Logout">
                   <span className="h-4 w-4 inline-flex items-center justify-center">🚪</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-full font-bold shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.7)] transition-all transform hover:-translate-y-0.5"
              >
                <span>เข้าสู่ระบบเพื่อเล่น</span>
                <span className="h-4 w-4 animate-pulse inline-flex items-center justify-center">➡️</span>
              </button>
            )}
          </div>
      )}

      {/* --- VIEW 1: HOME MENU --- */}
      {view === 'home' && (
        <div className="relative w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 animate-fade-in z-10 shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden group/card">
          
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-70"></div>

          <div className="flex flex-col items-center mb-8 relative">
            <div className="relative w-24 h-24 mb-4">
               <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-spin-slow"></div>
               <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-purple-500/10 to-blue-500/10 rounded-full backdrop-blur-sm shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                  <span className="text-5xl animate-bounce drop-shadow-[0_0_10px_rgba(167,139,250,0.8)]">👾</span>
               </div>
            </div>
            
            <h1 className="text-4xl font-black text-white uppercase tracking-wider text-center leading-none">
              เดิมพัน<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-sm">ไซเบอร์</span>
            </h1>
            <p className="text-xs text-gray-300 mt-2 font-bold tracking-widest opacity-80">โตไปไม่โดนหลอก 🤪</p>
          </div>

          <div className="flex flex-col gap-3 relative z-10">
            
            {/* Quiz Mode */}
            <button onClick={() => handleStart('normal')} className={`relative group w-full p-4 rounded-xl border transition-all duration-300 overflow-hidden ${!user ? 'bg-white/5 border-white/5 opacity-70 hover:opacity-100 hover:border-white/20' : 'bg-white/5 border-white/10 hover:border-green-400/50 hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]'}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-transform duration-300 ${!user ? 'bg-gray-700 text-gray-400 grayscale' : 'bg-green-500/20 border border-green-500/30 text-green-300 group-hover:scale-110'}`}>
                   {!user ? '🔒' : '🧠'}
                </div>
                <div className="text-left flex-1">
                  <div className={`font-bold text-lg transition-colors ${!user ? 'text-gray-400' : 'text-white group-hover:text-green-300'}`}>
                    ตอบคำถามวัดกึ๋น
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1 group-hover:text-gray-200">
                    {!user ? <span className="text-amber-400 font-bold">ต้องเข้าสู่ระบบก่อน</span> : <span>ชนะไปแล้ว: <span className="text-green-400 font-bold">{stats.normal} รอบ</span></span>}
                  </div>
                </div>
                <div className="text-green-400 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 font-bold text-xl">→</div>
              </div>
            </button>

            {/* Virus Mode */}
            <button onClick={() => handleStart('virus')} className={`relative group w-full p-4 rounded-xl border transition-all duration-300 overflow-hidden ${!user ? 'bg-white/5 border-white/5 opacity-70 hover:opacity-100 hover:border-white/20' : 'bg-white/5 border-white/10 hover:border-red-400/50 hover:shadow-[0_0_20px_rgba(248,113,113,0.2)]'}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-transform duration-300 ${!user ? 'bg-gray-700 text-gray-400 grayscale' : 'bg-red-500/20 border border-red-500/30 text-red-300 group-hover:scale-110'}`}>
                   {!user ? '🔒' : '🔨'}
                </div>
                <div className="text-left flex-1">
                  <div className={`font-bold text-lg transition-colors ${!user ? 'text-gray-400' : 'text-white group-hover:text-red-300'}`}>
                    ทุบไวรัสวัดนิ้ว
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1 group-hover:text-gray-200">
                    {!user ? <span className="text-amber-400 font-bold">ต้องเข้าสู่ระบบก่อน</span> : <span>โหมดแอคชั่น: <span className="text-red-400 font-bold">มันส์มาก!</span></span>}
                  </div>
                </div>
                <div className="text-red-400 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 font-bold text-xl">→</div>
              </div>
            </button>

            {/* Chat Mode */}
            <button onClick={() => handleStart('chat')} className={`relative group w-full p-4 rounded-xl border transition-all duration-300 overflow-hidden ${!user ? 'bg-white/5 border-white/5 opacity-70 hover:opacity-100 hover:border-white/20' : 'bg-white/5 border-white/10 hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(96,165,250,0.2)]'}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-transform duration-300 ${!user ? 'bg-gray-700 text-gray-400 grayscale' : 'bg-blue-500/20 border border-blue-500/30 text-blue-300 group-hover:scale-110'}`}>
                   {!user ? '🔒' : '💬'}
                </div>
                <div className="text-left flex-1">
                  <div className={`font-bold text-lg transition-colors ${!user ? 'text-gray-400' : 'text-white group-hover:text-blue-300'}`}>
                    แชทปั่นแก๊งคอล
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1 group-hover:text-gray-200">
                    {!user ? <span className="text-amber-400 font-bold">ต้องเข้าสู่ระบบก่อน</span> : <span>ชนะไปแล้ว: <span className="text-blue-400 font-bold">{stats.chat} รอบ</span></span>}
                  </div>
                </div>
                <div className="text-blue-400 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 font-bold text-xl">→</div>
              </div>
            </button>

          </div>
        </div>
      )}

      {/* --- VIEW 2: DIFFICULTY SELECTOR --- */}
      {view === 'bet' && (
        <div className="relative w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/15 rounded-[2rem] p-8 animate-fade-in z-10 shadow-[0_0_60px_rgba(0,0,0,0.4)]">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-1">เลือกความตึง</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto rounded-full"></div>
          </div>
          
          <div className="flex flex-col gap-4">
             {/* Easy */}
             <button onClick={() => selectDifficulty('easy')} className="relative group w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-green-900/20 hover:border-green-400/30 transition-all duration-300 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-4">
                    <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all duration-300 scale-90 group-hover:scale-110">👶</span>
                    <div className="text-left">
                        <div className="font-bold text-white text-lg group-hover:text-green-300 transition-colors">อนุบาลหัดเดิน</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide group-hover:text-gray-200">
                            เวลา 20 วิ • ชิลๆ เหมือนเดินห้าง
                        </div>
                    </div>
                </div>
             </button>

             {/* Normal */}
             <button onClick={() => selectDifficulty('medium')} className="relative group w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-yellow-900/20 hover:border-yellow-400/30 transition-all duration-300 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-4">
                    <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all duration-300 scale-90 group-hover:scale-110">🧑‍🦱</span>
                    <div className="text-left">
                        <div className="font-bold text-white text-lg group-hover:text-yellow-300 transition-colors">มนุษย์เดินดิน</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide group-hover:text-gray-200">
                            เวลา 15 วิ • เริ่มตึงนิดๆ
                        </div>
                    </div>
                </div>
             </button>

             {/* Hard */}
             <button onClick={() => selectDifficulty('hard')} className="relative group w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-red-900/20 hover:border-red-400/30 transition-all duration-300 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-4">
                    <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all duration-300 scale-90 group-hover:scale-110 animate-pulse">⚡</span>
                    <div className="text-left">
                        <div className="font-bold text-white text-lg group-hover:text-red-300 transition-colors">เทพเจ้าสายฟ้า</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide group-hover:text-gray-200">
                            เวลา 10 วิ • กระพริบตาคือตุย
                        </div>
                    </div>
                </div>
             </button>
          </div>

          <button 
            onClick={() => { playSound('click'); setView('home'); }} 
            className="w-full mt-8 py-3 text-xs text-gray-400 font-bold uppercase tracking-widest hover:text-white flex justify-center items-center gap-2 transition-all opacity-70 hover:opacity-100"
          >
            <span>←</span> กลับหน้าหลัก
          </button>
        </div>
      )}
    </main>
  );
}