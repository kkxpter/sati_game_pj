'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { playSound } from '@/app/lib/sound';

type CellState = 'empty' | 'virus' | 'bomb' | 'file' | 'exploding' | 'boss';
type GameState = 'tutorial' | 'playing' | 'gameover';

export default function VirusPage() {
  const router = useRouter();
  
  // --- State ---
  const [view, setView] = useState<GameState>('tutorial');
  const [grid, setGrid] = useState<CellState[]>(Array(16).fill('empty'));
  const [hp, setHp] = useState(200);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [survivalTime, setSurvivalTime] = useState(0);
  const [showStats, setShowStats] = useState(false);
  
  // Effect States
  const [isShaking, setIsShaking] = useState(false);
  const [bossHp, setBossHp] = useState(0);

  // ✅ Phase Logic (20s per phase)
  let phase = 1;
  if (survivalTime >= 40) phase = 3;
  else if (survivalTime >= 20) phase = 2;

  // Refs
  const loopRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const bossTimerRef = useRef<number>(0);

  // --- 🔥 SECTION 1: ฟังก์ชันบันทึกคะแนน ---
  const saveScore = async (finalScore: number) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        await fetch(`${apiUrl}/scores/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                score: finalScore,
                gameType: 'virus'
            })
        });
        console.log("✅ Score saved successfully:", finalScore);
    } catch (e) {
        console.error("❌ Save score error:", e);
    }
  };

  // --- 🔥 SECTION 2: ระบบจบเกมอัตโนมัติ (แก้ไขแล้ว) ---
  useEffect(() => {
    if (hp <= 0 && view === 'playing') {
        saveScore(score); 
        
        // ✅ ใส่ setTimeout แก้ Error Cascading Render
        const timeoutId = setTimeout(() => {
            setView('gameover');
        }, 0);

        return () => clearTimeout(timeoutId);
    }
  }, [hp, view, score]);

  // CSS Animation
  const shakeStyle = `
    @keyframes shake {
        0% { transform: translate(1px, 1px) rotate(0deg); }
        10% { transform: translate(-1px, -2px) rotate(-1deg); }
        20% { transform: translate(-3px, 0px) rotate(1deg); }
        30% { transform: translate(3px, 2px) rotate(0deg); }
        40% { transform: translate(1px, -1px) rotate(1deg); }
        50% { transform: translate(-1px, 2px) rotate(-1deg); }
        60% { transform: translate(-3px, 1px) rotate(0deg); }
        70% { transform: translate(3px, 1px) rotate(-1deg); }
        80% { transform: translate(-1px, -1px) rotate(1deg); }
        90% { transform: translate(1px, 2px) rotate(0deg); }
        100% { transform: translate(1px, -2px) rotate(-1deg); }
    }
    .animate-shake {
        animation: shake 0.5s;
        animation-iteration-count: 1;
    }
    /* เพิ่มต่อจาก @keyframes shake */
@keyframes flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
}
@keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
}
.animate-flash { animation: flash 0.1s infinite; }
.scanline-effect {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent, rgba(255, 0, 0, 0.1), transparent);
    height: 10px;
    width: 100%;
    animation: scanline 2s linear infinite;
}
  `;

  const triggerShake = () => {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
  };

  // 1. Timer
  useEffect(() => {
    if (view !== 'playing') return;
    timerRef.current = setInterval(() => setSurvivalTime(t => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view]);

 useEffect(() => {
    if (view !== 'gameover') return;
    const timer = setTimeout(() => {
        setShowStats(true);
    }, 3000); // 3 วินาทีตามที่ต้องการ
    return () => clearTimeout(timer);
}, [view]);
  // 2. Spawn Loop
  useEffect(() => {
    if (view !== 'playing') return;

    let spawnRate = 1200;
    let disappearRate = 2000;

    if (phase === 2) { spawnRate = 800; disappearRate = 1500; } 
    else if (phase === 3) { spawnRate = 500; disappearRate = 1000; }

    const spawn = () => {
      setGrid(prevGrid => {
        const isBossActive = prevGrid.includes('boss');
        bossTimerRef.current += spawnRate;

        const emptyIndices = prevGrid.map((c, i) => c === 'empty' ? i : -1).filter(i => i !== -1);
        if (emptyIndices.length === 0) return prevGrid;

        const randIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        const newGrid = [...prevGrid];
        
        const r = Math.random();
        let type: CellState = 'virus';
        let currentDisappearRate = disappearRate;

        // Boss Logic
        if (!isBossActive && bossTimerRef.current > 20000 && r > 0.7) {
            type = 'boss';
            setBossHp(5);
            bossTimerRef.current = 0;
            currentDisappearRate = 4000;
        } 
        else {
            if (phase === 3) {
                if (r > 0.95) type = 'bomb';
                else if (r < 0.25) type = 'file';
            } else {
                if (r > 0.97) type = 'bomb';
                else if (r < 0.2) type = 'file';
            }
        }  

        newGrid[randIdx] = type;

        setTimeout(() => {
             setGrid(currentGrid => {
                 if (currentGrid[randIdx] === type) { 
                     const nextGrid = [...currentGrid];
                     nextGrid[randIdx] = 'empty';
                     
                     if (type === 'virus') {
                         setHp(h => Math.max(0, h - 10));
                         setCombo(0);
                     } else if (type === 'boss') {
                         triggerShake();
                         playSound('wrong');
                         setHp(h => Math.max(0, h - 100));
                         setCombo(0);
                     }
                     return nextGrid;
                 }
                 return currentGrid;
             });
        }, currentDisappearRate);

        return newGrid;
      });

      loopRef.current = setTimeout(spawn, spawnRate);
    };

    // ✅ แก้ไข: ใช้ setTimeout 0 เพื่อไม่ให้ spawn ทำงาน sync เกินไปตอนเริ่ม
    const initialSpawn = setTimeout(spawn, 0);
    return () => { 
        clearTimeout(initialSpawn);
        if (loopRef.current) clearTimeout(loopRef.current); 
    };
  }, [view, phase]); 

  // 3. Click Handler
  const handleHit = (index: number) => {
    if (view !== 'playing') return;
    const type = grid[index];
    if (type === 'empty' || type === 'exploding') return;

    const newGrid = [...grid];

    if (type === 'boss') {
        if (bossHp > 1) {
            playSound('click');
            setBossHp(prev => prev - 1);
        } else {
            playSound('smash');
            newGrid[index] = 'empty';
            setScore(s => s + 500);
            setHp(h => Math.min(200, h + 30));
            setBossHp(0);
        }
    } else if (type === 'virus') {
        playSound('smash');
        newGrid[index] = 'empty';
        const points = 10 + Math.min(20, combo);
        setScore(s => s + points);
        setCombo(c => c + 1);
    } else if (type === 'bomb') {
        triggerShake(); 
        playSound('wrong');
        newGrid[index] = 'exploding';
        setHp(0); 
    } else if (type === 'file') {
        triggerShake(); 
        playSound('wrong');
        newGrid[index] = 'exploding';
        setHp(h => Math.max(0, h - 30));
        setCombo(0);
        setTimeout(() => {
            setGrid(g => { const n = [...g]; n[index] = 'empty'; return n; });
        }, 300);
    }

    
    setGrid(newGrid);


   if (hp <= 0 || type === 'bomb') {
    setShowStats(false); // ปิดคะแนนไว้ก่อนตั้งแต่ตอนนี้
    setView('gameover');
}

  };

  const startGame = () => {
    playSound('click');
    setHp(200);
    setScore(0);
    setCombo(0);
    setSurvivalTime(0);
    setBossHp(0);
    bossTimerRef.current = 0;
    setGrid(Array(16).fill('empty'));
    setShowStats(false); // มั่นใจว่าปิดคะแนนไว้ก่อนเล่นรอบใหม่
    setView('playing');
};

 // Replace the return statement starting from line 235 with the following complete JSX:

  return (
    <div className={`relative h-screen w-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-slate-900 font-sans transition-all ${isShaking ? 'animate-shake' : ''}`}>
       <style>{shakeStyle}</style>

       {/* Background */}
       <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950 pointer-events-none">
          <div className="absolute inset-0 z-0 w-[200%] h-full animate-scroll-bg opacity-40">
              <div className="w-1/2 h-full bg-cover bg-center grayscale-[50%]" style={{ backgroundImage: "url('/images/bg1.png')" }}></div>
              <div className="w-1/2 h-full bg-cover bg-center grayscale-[50%]" style={{ backgroundImage: "url('/images/bg1.png')" }}></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90 z-10"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse-slow mix-blend-screen z-20"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse-slow delay-1000 mix-blend-screen z-20"></div>
       </div>

       <button 
        onClick={() => { 
            playSound('click'); 
            if(view === 'playing') {
                if(confirm('จบเกมเลยไหม?')) router.push('/'); 
            } else {
                router.push('/');
            }
        }}
        className="absolute top-4 left-4 z-50 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-red-500/20 hover:border-red-500 transition-all hover:scale-110 cursor-pointer"
      >
        ✕
      </button>

       {/* --- 1. TUTORIAL SCREEN --- */}
       {view === 'tutorial' && (
           <div className="relative z-10 w-full max-w-sm bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl text-center animate-fade-in">
               <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-6 uppercase tracking-wider">
                   คู่มือปราบไวรัส
               </h1>
               
               <div className="flex flex-col gap-3 mb-6">
                   <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                       <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(239,68,68,0.3)]">🦠</div>
                       <div className="text-left"><div className="text-white font-bold">ไวรัส</div><div className="text-gray-400 text-[10px]">ต้องรีบกด! หลุดแล้วเลือดลด</div></div>
                   </div>
                   <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                       <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-2xl animate-pulse">💣</div>
                       <div className="text-left"><div className="text-white font-bold">ระเบิด</div><div className="text-red-400 text-[10px] font-bold">ห้ามกดเด็ดขาด! GAME OVER ทันที</div></div>
                   </div>
                   <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                       <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-2xl">📁</div>
                       <div className="text-left"><div className="text-white font-bold">ไฟล์งาน</div><div className="text-gray-400 text-[10px]">ห้ามกด! เลือดลด -30</div></div>
                   </div>
                   <div className="flex items-center gap-3 bg-purple-500/20 p-2 rounded-xl border border-purple-500/50 animate-pulse">
                       <div className="w-10 h-10 rounded-lg bg-purple-900/50 border border-purple-500 flex items-center justify-center text-3xl drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">👾</div>
                       <div className="text-left"><div className="text-purple-300 font-bold">บอสไวรัส!</div><div className="text-purple-200 text-[10px]">กด 5 ที! ฆ่าได้เลือดเด้ง</div></div>
                   </div>
               </div>

               <div className="text-center text-gray-400 text-xs mb-6 bg-black/20 p-3 rounded-lg">
                   <p className="text-yellow-400">ระดับความยากเพิ่มทุก 20 วินาที!</p>
               </div>

               <button 
                   onClick={startGame} 
                   className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
               >
                   พร้อมแล้ว ลุย!
               </button>
           </div>
       )}

       {/* --- 2. GAMEPLAY SCREEN --- */}
       {view === 'playing' && (
        <div className="relative z-10 w-full max-w-[380px] flex flex-col gap-4 animate-fade-in">
            {/* Header Bar */}
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg">
                <div>
                    <div className="text-[10px] text-gray-400 tracking-widest font-bold">TIME</div>
                    <div className="text-2xl font-mono text-white">{survivalTime}s</div>
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-[10px] text-purple-400 tracking-widest font-bold mb-1">THREAT LEVEL</div>
                    <div className="flex gap-1">
                        <div className={`w-8 h-2 rounded-full transition-colors ${phase >= 1 ? 'bg-green-500 shadow-[0_0_10px_lime]' : 'bg-gray-700'}`}></div>
                        <div className={`w-8 h-2 rounded-full transition-colors ${phase >= 2 ? 'bg-yellow-500 shadow-[0_0_10px_orange]' : 'bg-gray-700'}`}></div>
                        <div className={`w-8 h-2 rounded-full transition-colors ${phase >= 3 ? 'bg-red-500 shadow-[0_0_10px_red] animate-pulse' : 'bg-gray-700'}`}></div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-blue-400 tracking-widest font-bold">SCORE</div>
                    <div className="text-2xl font-black text-blue-300">{score}</div>
                </div>
            </div>

            <div className="relative w-full">
                <div className="flex justify-between text-xs text-gray-400 mb-1 px-1">
                    <span>SYSTEM HEALTH</span>
                    <span>{hp}/200</span>
                </div>
                <div className="w-full bg-black/30 h-6 rounded-full overflow-hidden border border-white/10 shadow-inner relative">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.2)_1px,transparent_1px)] bg-[size:10%_100%] z-10 pointer-events-none"></div>
                    <div 
                        className={`h-full transition-all duration-300 ${hp < 50 ? 'bg-red-500 shadow-[0_0_20px_red] animate-pulse' : 'bg-gradient-to-r from-green-500 to-emerald-400'}`} 
                        style={{ width: `${(hp / 200) * 100}%` }} 
                    />
                </div>
            </div>
            
            <div className={`p-4 bg-black/60 backdrop-blur-md rounded-[2rem] border border-white/10 shadow-2xl transition-all duration-500 ${phase === 3 ? 'border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : ''}`}>
                <div className="grid grid-cols-4 gap-2">
                    {grid.map((cell, i) => (
                        <div 
                            key={i} 
                            className={`
                                aspect-square rounded-xl flex items-center justify-center text-4xl cursor-pointer transition-all duration-100 select-none border relative overflow-hidden
                                ${cell === 'empty' ? 'bg-white/5 border-white/5 hover:bg-white/10' : ''}
                                ${cell === 'virus' ? 'bg-red-500/20 border-red-500/50 hover:scale-100 active:scale-85 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}
                                ${cell === 'bomb' ? 'bg-orange-500/20 border-orange-500/50 animate-pulse' : ''}
                                ${cell === 'file' ? 'bg-blue-500/20 border-blue-500/50' : ''}
                                ${cell === 'exploding' ? 'bg-red-600 border-red-600 animate-ping' : ''}
                                ${cell === 'boss' ? 'bg-purple-900/80 border-purple-500 animate-pulse drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]' : ''}
                            `}
                            onMouseDown={() => handleHit(i)}
                            onTouchStart={(e) => { e.preventDefault(); handleHit(i); }}
                        >
                            {cell === 'virus' ? '🦠' : cell === 'bomb' ? '💣' : cell === 'file' ? '📁' : cell === 'exploding' ? '💥' : ''}
                            {cell === 'boss' && (
                                <>
                                    <span className="text-5xl">👾</span>
                                    <div className="absolute bottom-1 left-1 right-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-400 transition-all" style={{ width: `${(bossHp / 5) * 100}%` }}></div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {phase === 3 && (
                <div className="text-center animate-pulse text-red-500 font-bold tracking-widest text-sm">
                    ⚠️ DANGER LEVEL MAX! SPEED INCREASED! ⚠️
                </div>
            )}
        </div>
       )}
    
    {view === 'gameover' && (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden">
        
        {/* ✨ พื้นหลังหลัก (Layer 0) */}
        <div className={`absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-1000 ${showStats ? 'opacity-100' : 'opacity-0'}`}></div>
       {/* --- 3. GAMEOVER SCREEN --- */}
       {view === 'gameover' && (
           <div className="relative z-10 bg-black/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] text-center max-w-sm w-full shadow-2xl animate-fade-in">
               <div className="text-8xl mb-4 animate-bounce drop-shadow-xl">💥</div>
               <h1 className="text-3xl font-black mb-2 uppercase tracking-wide text-red-500 drop-shadow-md">
                   SYSTEM CRASHED
               </h1>
               
               <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                   <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">เวลาที่รอด</p>
                   <div className="text-white text-4xl font-mono font-black mb-2">{survivalTime} วินาที</div>
                   <div className="w-full h-px bg-white/10 my-2"></div>
                   <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">คะแนนรวม</p>
                   <div className="text-blue-300 text-5xl font-mono font-black">{score}</div>
               </div>

               <div className="flex gap-3">
                   <button 
                       onClick={() => { playSound('click'); router.push('/'); }} 
                       className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all"
                   >
                       กลับหน้าหลัก
                   </button>
                   <button 
                       onClick={startGame} 
                       className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition-all shadow-lg hover:scale-105"
                   >
                       เล่นใหม่
                   </button>
               </div>
           </div>
       )}
=======
        {/* 🖼️ GIF พื้นหลัง (Layer 1) - จังหวะแรกใหญ่ จังหวะสองจางลง */}
        <div className={`absolute inset-0 z-10 flex items-center justify-center transition-all duration-1000 ease-in-out ${showStats ? 'opacity-20 scale-100' : 'opacity-100 scale-125'}`}>
            <img src="/images/Game_over.gif" alt="GameOver" className="w-full h-auto max-w-none" />
        </div>

        {/* 📊 กล่องคะแนนดีไซน์ใหม่ (Layer 2) */}
        <div className={`relative z-30 w-full max-w-[400px] p-6 transition-all duration-700 transform ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
            
            {/* กรอบนอกแบบ Glassmorphism */}
            <div className="bg-[#1a1a2e]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl p-8 text-center border-t-white/20">
                
                {/* Icon ระเบิดด้านบน */}
                <div className="flex justify-center mb-4">
                    <div className="relative">
                        <span className="text-6xl drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-bounce">💥</span>
                    </div>
                </div>

                {/* หัวข้อ System Crashed */}
                <h2 className="text-red-500 font-black text-2xl tracking-[0.15em] uppercase italic mb-1 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                    SYSTEM CRASHED
                </h2>
                <p className="text-red-400/60 text-[10px] font-mono mb-6 tracking-widest uppercase italic font-bold">
                    ERROR_CODE: 0xDEADBEEF
                </p>

                {/* โซนแสดงคะแนน (กรอบสีขาวบางๆ ตามรูป) */}
                <div className="relative bg-black/40 border border-white/20 rounded-2xl p-6 mb-8 overflow-hidden shadow-inner">
                    {/* เส้นตกแต่งมุมกรอบ */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-white/40"></div>
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-white/40"></div>
                    
                    <div className="mb-4 border-b border-white/5 pb-4">
                        <p className="text-gray-400 text-xs font-bold mb-1">เวลาที่รอด</p>
                        <div className="text-white text-4xl font-black tracking-tight leading-none uppercase">
                            {survivalTime} <span className="text-xl">วินาที</span>
                        </div>
                    </div>
                    
                    <div>
                        <p className="text-gray-400 text-xs font-bold mb-1">คะแนนรวม</p>
                        <div className="text-cyan-400 text-5xl font-black drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                            {score.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* ปุ่มควบคุม (2 ปุ่มซ้ายขวา) */}
                <div className="flex gap-4">
                    <button 
                        onClick={() => { playSound('click'); router.push('/'); }} 
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 transition-all active:scale-95 text-sm uppercase tracking-wider"
                    >
                        กลับหน้าหลัก
                    </button>
                    <button 
                        onClick={startGame} 
                        className="flex-1 bg-gradient-to-br from-green-400 to-emerald-600 hover:from-green-300 hover:to-emerald-500 text-slate-950 font-black py-4 rounded-2xl shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-all active:scale-95 text-sm uppercase tracking-wider"
                    >
                        เล่นใหม่
                    </button>
                </div>
            </div>
        </div>
    </div>
    )}
    {/* Scanline Effect สำหรับเพิ่ม Texture */}
        <div className={`scanline-effect z-20 transition-opacity duration-1000 ${showStats ? 'opacity-20' : 'opacity-0'}`}></div>
    </div>
    
  );
}