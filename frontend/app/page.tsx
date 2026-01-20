'use client';
// 👇 เพิ่มบรรทัดนี้ถ้ายังไม่มี (แก้ Error TypeScript)
/// <reference path="../src/global.d.ts" />

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { playSound } from '@/app/lib/sound';
import Image from 'next/image';

// 1. Interface
interface UserData {
  username: string;
  emoji?: string;
}

interface GameStats {
  normal: number;
  virus: number;
  chat: number;
}

export default function HomePage() {
  const router = useRouter();
  const [view, setView] = useState<'home' | 'bet'>('home');
  
  // Audio Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // State
  const [isMuted, setIsMuted] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<GameStats>({ normal: 0, virus: 0, chat: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const toggleMute = () => {
    const newMutedStatus = !isMuted;
    setIsMuted(newMutedStatus);
    
    if (audioRef.current) {
      audioRef.current.muted = newMutedStatus; 
    }
    localStorage.setItem('isMuted', JSON.stringify(newMutedStatus)); 
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        // 1. โหลดข้อมูล User และ Stats
        try {
            const savedStatsStr = localStorage.getItem('cyberStakes_played');
            const storedUserStr = localStorage.getItem('user'); 

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

        // 2. Setup Audio & Mute Status
        const audio = new Audio('/sounds/main_bgm.wav'); 
        audio.loop = true;   
        audio.volume = 0.4;  
        audioRef.current = audio;

        const savedMute = localStorage.getItem('isMuted');
        if (savedMute !== null) {
            const initialMuted = JSON.parse(savedMute);
            setIsMuted(initialMuted);
            audio.muted = initialMuted;
        }

        const playBgm = () => {
            if (audio.paused) {
                audio.play().catch(() => {
                    console.log("Autoplay blocked, waiting for interaction");
                });
            }
        };

        playBgm();
        
        const handleInteraction = () => {
            playBgm();
            window.removeEventListener('click', handleInteraction);
        };
        window.addEventListener('click', handleInteraction);

    }, 0);

    return () => {
        clearTimeout(timer);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, []);

 const handleLogout = () => {
  playSound('click');
  if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) { 
      localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
  }
};

  const handleStart = (mode: string) => {
    playSound('click');

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
    window.location.href = `/game/quiz?diff=${diff}`;
  };

  return (
    <main className="relative w-screen h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-slate-900 font-sans">
      
      {/* ==================== ✨ พื้นหลัง ✨ ==================== */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950"> 
          <div className="absolute inset-0 z-0 w-[200%] h-full animate-scroll-bg opacity-40">
              <div className="w-1/2 h-full bg-cover bg-center grayscale-[50%]" style={{ backgroundImage: "url('/images/bg1.png')" }}></div>
              <div className="w-1/2 h-full bg-cover bg-center grayscale-[50%]" style={{ backgroundImage: "url('/images/bg1.png')" }}></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90 z-10"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse-slow mix-blend-screen z-20"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse-slow delay-1000 mix-blend-screen z-20"></div>
      </div>

      {/* ==================== 👤 User Bar (มุมขวาบน - ปรับปรุงใหม่) ==================== */}
      {isLoaded && (
          <div className="absolute top-6 right-6 z-50 animate-fade-in">
            {user ? (
               // ✨ รวมปุ่ม Profile และ Logout ไว้ในแคปซูลเดียวกัน (Glass Effect)
               <div className="flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-full p-1.5 shadow-2xl hover:border-white/40 transition-all duration-300">
                  
                  {/* ส่วน Profile */}
                  <button 
                    onClick={() => { playSound('click'); router.push('/profile'); }}
                    className="flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-white/10 transition-all group"
                  >
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                            {user.emoji ? user.emoji : (user.username ? user.username.charAt(0).toUpperCase() : 'U')}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                    </div>
                    <div className="flex flex-col text-left mr-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Player</span>
                        <span className="text-sm font-black text-white leading-none group-hover:text-purple-300 transition-colors">{user.username}</span>
                    </div>
                  </button>

                  {/* เส้นกั้น */}
                  <div className="w-px h-8 bg-white/20 mx-1"></div>

                  {/* ส่วน Logout */}
                  <button 
                    onClick={handleLogout}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-red-400 hover:text-white hover:bg-red-500/80 transition-all duration-300"
                    title="ออกจากระบบ"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                  </button>
               </div>
            ) : (
              <button 
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.7)] transition-all transform hover:-translate-y-0.5"
              >
                <span>เข้าสู่ระบบเพื่อเล่น</span>
              </button>
            )}

            {/* ปุ่ม Leaderboard แยกออกมาเล็กน้อย */}
            <div className="mt-2 flex justify-end">
                 <button 
                    onClick={() => { playSound('click'); router.push('/game/leaderboard'); }} 
                    className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest shadow-lg"
                >
                    <span className="text-lg">🏆</span> Leaderboard
                </button>
            </div>
          </div>
      )}

     {/* --- VIEW 1: HOME MENU --- */}
      {view === 'home' && (
        <div className="relative w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 animate-fade-in z-10 shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-visible group/card mt-10">
          
          {/* เส้นขอบตกแต่ง */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-70"></div>

          {/* ==================== 🤖 ส่วนหัว Mascot ==================== */}
          {/* 1. เปลี่ยน mb-6 เป็น mb-1 เพื่อลดระยะห่าง */}
          <div className="flex flex-col items-center mb-1 relative z-20">
            
            <div className="relative w-[160%] h-[420px] -mt-36 drop-shadow-[0_0_40px_rgba(167,139,250,0.5)] transition-transform duration-700 hover:scale-105 pointer-events-none">
              <Image 
                src="/images/Model02.gif" 
                alt="SATI Digital Mascot" 
                fill 
                className="object-contain" 
                priority
                unoptimized 
              />
            </div>

          </div>

          {/* ==================== ปุ่มกดเลือกโหมด ==================== */}
          {/* 2. ใส่ -mt-16 เพื่อดึงปุ่มขึ้นไปปิดช่องว่าง (ถ้ายังห่างไปให้เพิ่มเป็น -mt-20) */}
          <div className="flex flex-col gap-3 relative z-10 -mt-16">
            
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

      {/* --- VIEW 2: DIFFICULTY SELECTOR (คงเดิมไว้) --- */}
      {view === 'bet' && (
        <div className="relative w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/15 rounded-[2rem] p-8 animate-fade-in z-10 shadow-[0_0_60px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col gap-3 relative z-10 -mt-8">
            <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">เลือกความตึง</h2>
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
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide group-hover:text-gray-200">เวลา 20 วิ • ชิลๆ เหมือนเดินห้าง</div>
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
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide group-hover:text-gray-200">เวลา 15 วิ • เริ่มตึงนิดๆ</div>
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
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide group-hover:text-gray-200">เวลา 10 วิ • กระพริบตาคือตุย</div>
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

      {/* ✅ ปุ่มเปิด/ปิดเสียง */}
      <button 
        onClick={toggleMute}
        className="absolute bottom-6 right-6 z-50 p-4 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl hover:scale-110 transition-transform"
      >
        <span className="text-xl">{isMuted ? '🔇' : '🔊'}</span>
      </button>
    </main>
  );
}