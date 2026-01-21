'use client';
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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null); // ใช้ Ref เดิมสำหรับเมนู Profile
  
  const [isMuted, setIsMuted] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<GameStats>({ normal: 0, virus: 0, chat: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobileMenuExpanded, setIsMobileMenuExpanded] = useState(false);

  const toggleMute = () => {
    const newMutedStatus = !isMuted;
    setIsMuted(newMutedStatus);
    if (audioRef.current) audioRef.current.muted = newMutedStatus; 
    localStorage.setItem('isMuted', JSON.stringify(newMutedStatus)); 
  };

  // Logic Click Outside สำหรับ Profile Menu เท่านั้น
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuExpanded && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuExpanded]);

  useEffect(() => {
    const timer = setTimeout(() => {
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

            if (storedUser) setUser(storedUser);
            setIsLoaded(true);
        } catch (error) {
            console.error("Error loading localStorage:", error);
            setIsLoaded(true); 
        }

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
                audio.play().catch(() => {});
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

  const toggleMobileMenu = () => {
      setIsMobileMenuExpanded(!isMobileMenuExpanded);
      playSound('click');
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

      {/* ==================== 👤 User Menu Bar (Right Aligned) ==================== */}
      {isLoaded && (
          <div className="absolute top-6 right-6 z-50 animate-fade-in flex flex-col items-end gap-2">
            
            {/* --- 1. Profile Capsule (Expandable) --- */}
            {user ? (
               // ✅ ผูก ref={menuRef} ไว้เฉพาะปุ่ม Profile เพื่อใช้ Click Outside
               <div 
                    ref={menuRef}
                    className={`
                        flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-full p-1.5 shadow-2xl 
                        transition-all duration-300 ease-out overflow-hidden cursor-pointer
                        ${isMobileMenuExpanded ? 'w-48' : 'w-[54px]'} md:w-48
                    `}
               >
                  {/* Avatar (Click to toggle) */}
                  <button 
                    onClick={toggleMobileMenu}
                    className="relative flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xl shadow-inner group hover:scale-105 transition-transform"
                  >
                      {user.emoji ? user.emoji : (user.username ? user.username.charAt(0).toUpperCase() : 'U')}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                  </button>

                  {/* Expanded Details */}
                  <div className={`
                      flex items-center overflow-hidden transition-all duration-300 whitespace-nowrap
                      ${isMobileMenuExpanded ? 'opacity-100 ml-3' : 'opacity-0 ml-0 w-0'} 
                      md:opacity-100 md:ml-3 md:w-auto
                  `}>
                      <button 
                        onClick={() => { playSound('click'); router.push('/profile'); }}
                        className="flex flex-col text-left mr-3 hover:opacity-80 transition-opacity w-full"
                      >
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Tap to View</span>
                          <span className="text-sm font-black text-white leading-none truncate max-w-[80px]">{user.username}</span>
                      </button>

                      <div className="w-px h-8 bg-white/20 mx-1 flex-shrink-0"></div>

                      <button 
                        onClick={handleLogout}
                        className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full text-red-400 hover:text-white hover:bg-red-500/80 transition-all duration-300"
                        title="ออกจากระบบ"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                      </button>
                  </div>
               </div>
            ) : (
              <button 
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.7)] transition-all transform hover:-translate-y-0.5"
              >
                <span>เข้าสู่ระบบเพื่อเล่น</span>
              </button>
            )}

            {/* --- 2. Leaderboard Button (Independent) --- */}
            {/* ✅ ไม่ใช้ isMobileMenuExpanded แล้ว */}
            <div className={`transition-all duration-300 ${user ? 'opacity-100' : 'opacity-0 scale-0'}`}>
                 <button 
                    onClick={() => { 
                        playSound('click'); 
                        router.push('/game/leaderboard'); 
                    }} 
                    className={`
                        flex items-center bg-black/40 backdrop-blur-md border border-yellow-500/30 rounded-full p-1.5 shadow-lg
                        transition-all duration-300 ease-out overflow-hidden hover:bg-yellow-500/10 hover:border-yellow-500/50
                        w-[54px] md:w-48  /* ✅ มือถือ = กลมเล็ก (54px), คอม = ยาว (48) */
                    `}
                >
                    {/* Icon (ถ้วยรางวัล) */}
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-yellow-500/10 text-yellow-400 text-lg">
                        🏆
                    </div>

                    {/* Text (โชว์เฉพาะบนคอม) */}
                    <div className={`
                        flex flex-col text-left ml-3 overflow-hidden whitespace-nowrap
                        opacity-0 w-0 md:opacity-100 md:w-auto /* ✅ ซ่อนบนมือถือ, โชว์บนคอม */
                    `}>
                        <span className="text-[9px] text-yellow-500/70 font-bold uppercase tracking-wider">Ranking</span>
                        <span className="text-xs font-bold text-yellow-100 uppercase tracking-widest">Leaderboard</span>
                    </div>
                </button>
            </div>

          </div>
      )}

      {/* --- VIEW 1: HOME MENU (เหมือนเดิม) --- */}
      {view === 'home' && (
        <div className="relative w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 animate-fade-in z-10 shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-visible group/card mt-16 md:mt-12">
          
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-70"></div>

          {/* ส่วน Mascot (z-20) */}
          <div className="flex flex-col items-center relative z-20">
            <div className="relative w-[160%] h-[360px] -mt-28 drop-shadow-[0_0_40px_rgba(167,139,250,0.5)] transition-transform duration-700 hover:scale-105 pointer-events-none">
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

          {/* ✅ แก้ไขตรงนี้: เปลี่ยน z-10 เป็น z-30 เพื่อให้ปุ่มอยู่เหนือรูปภาพ */}
          <div className="flex flex-col gap-3 relative z-30 -mt-4">
            
            {/* ... (ปุ่มต่างๆ เหมือนเดิม) ... */}
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
                    {!user ? <span className="text-amber-400 font-bold">ต้องเข้าสู่ระบบก่อน</span> : <span>คำถาม 4 ตัวเลือก</span>}
                  </div>
                </div>
                <div className="text-green-400 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 font-bold text-xl">→</div>
              </div>
            </button>
            
            {/* ... ปุ่มอื่นๆ ... */}
            <button onClick={() => handleStart('virus')} className={`relative group w-full p-4 rounded-xl border transition-all duration-300 overflow-hidden ${!user ? 'bg-white/5 border-white/5 opacity-70 hover:opacity-100 hover:border-white/20' : 'bg-white/5 border-white/10 hover:border-red-400/50 hover:shadow-[0_0_20px_rgba(248,113,113,0.2)]'}`}>
                {/* ... เนื้อหาปุ่ม ... */}
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

            <button onClick={() => handleStart('chat')} className={`relative group w-full p-4 rounded-xl border transition-all duration-300 overflow-hidden ${!user ? 'bg-white/5 border-white/5 opacity-70 hover:opacity-100 hover:border-white/20' : 'bg-white/5 border-white/10 hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(96,165,250,0.2)]'}`}>
                {/* ... เนื้อหาปุ่ม ... */}
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
                        {!user ? <span className="text-amber-400 font-bold">ต้องเข้าสู่ระบบก่อน</span> : <span>สถานะการหลอกลวง</span>}
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