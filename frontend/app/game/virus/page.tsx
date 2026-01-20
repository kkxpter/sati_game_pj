'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { playSound } from '@/app/lib/sound';

type CellState = 'empty' | 'virus' | 'bomb' | 'file' | 'exploding' | 'boss';
type GameState = 'tutorial' | 'playing' | 'gameover';

// ✅ ใช้ 4x4 (16 ช่อง) เหมือนเดิม
const GRID_SIZE = 16; 
const GRID_COLS = 'grid-cols-4'; 

export default function VirusPage() {
  const router = useRouter();
  
  // --- State ---
  const [view, setView] = useState<GameState>('tutorial');
  const [grid, setGrid] = useState<CellState[]>(Array(GRID_SIZE).fill('empty'));
  const [hp, setHp] = useState(200);
  const [score, setScore] = useState(0);
  const [survivalTime, setSurvivalTime] = useState(0);
  const [showStats, setShowStats] = useState(false);
  
  // Effect States
  const [isShaking, setIsShaking] = useState(false);
  const [bossHp, setBossHp] = useState(0);

  // Phase Logic
  let phase = 1;
  if (survivalTime >= 40) phase = 3;
  else if (survivalTime >= 20) phase = 2;

  // Refs
  const loopRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const bossTimerRef = useRef<number>(0);

  // --- SAVE SCORE ---
  const saveScore = async (finalScore: number) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    const userIdToSend = user.uid || user.id; 

    if (!userIdToSend) return;

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        await fetch(`${apiUrl}/scores/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userIdToSend,
                score: finalScore,
                gameType: 'virus'
            })
        });
    } catch (e) {
        console.error(e);
    }
  };

  // --- GAME OVER CHECK ---
  useEffect(() => {
    if (hp <= 0 && view === 'playing') {
        saveScore(score);
        const timeoutId = setTimeout(() => {
            setView('gameover');
        }, 0);
        return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    .scanline-effect {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, transparent, rgba(255, 0, 0, 0.1), transparent);
        height: 10px;
        width: 100%;
        animation: scanline 2s linear infinite;
        pointer-events: none;
    }
    @keyframes scanline {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100%); }
    }
  `;

  const triggerShake = () => {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
  };

  // Timer
  useEffect(() => {
    if (view !== 'playing') return;
    timerRef.current = setInterval(() => setSurvivalTime(t => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view]);

  // Show Stats Delay
  useEffect(() => {
    if (view !== 'gameover') {
        setShowStats(false);
        return;
    }
    const timer = setTimeout(() => {
        setShowStats(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [view]);

  // Spawn Logic
  useEffect(() => {
    if (view !== 'playing') return;

    let spawnRate = 1000;
    let disappearRate = 2000;

    if (phase === 2) { spawnRate = 700; disappearRate = 1500; } 
    else if (phase === 3) { spawnRate = 450; disappearRate = 1000; }

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
                     } else if (type === 'boss') {
                         triggerShake();
                         playSound('wrong');
                         setHp(h => Math.max(0, h - 100));
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

    const initialSpawn = setTimeout(spawn, 0);
    return () => { 
        clearTimeout(initialSpawn);
        if (loopRef.current) clearTimeout(loopRef.current); 
    };
  }, [view, phase]); 

  // Click Handler (ปรับปรุงการคิดคะแนน)
  const handleHit = (index: number) => {
    if (view !== 'playing') return;
    const type = grid[index];
    if (type === 'empty' || type === 'exploding') return;

    const newGrid = [...grid];

    if (type === 'boss') {
        if (bossHp > 1) {
            playSound('click');
            setBossHp(prev => prev - 1);
            setScore(s => s + 20); // ตีบอสทีละ 20
        } else {
            playSound('smash');
            newGrid[index] = 'empty';
            setScore(s => s + 200); // ฆ่าบอส +200
            setHp(h => Math.min(200, h + 30));
            setBossHp(0);
        }
    } else if (type === 'virus') {
        playSound('smash');
        newGrid[index] = 'empty';
        setScore(s => s + 10); // ไวรัสปกติ +10
    } else if (type === 'bomb') {
        triggerShake(); 
        playSound('wrong');
        newGrid[index] = 'exploding';
        setHp(0);
    } else if (type === 'file') {
        // ✅ [แก้ไข] กดโดนไฟล์
        triggerShake(); 
        playSound('wrong');
        newGrid[index] = 'exploding';
        setHp(h => Math.max(0, h - 30));    // หักเลือด
        setScore(s => Math.max(0, s - 50)); // หักคะแนน 50 (ไม่ติดลบ)
        setTimeout(() => {
            setGrid(g => { const n = [...g]; n[index] = 'empty'; return n; });
        }, 300);
    }

    setGrid(newGrid);
  };

  const startGame = () => {
    playSound('click');
    setHp(200);
    setScore(0);
    setSurvivalTime(0);
    setBossHp(0);
    bossTimerRef.current = 0;
    setGrid(Array(GRID_SIZE).fill('empty'));
    setShowStats(false); 
    setView('playing');
  };

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
        className="absolute top-4 left-4 z-50 w-10 h-10 md:w-14 md:h-14 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-white text-xl hover:bg-red-500/20 hover:border-red-500 transition-all hover:scale-110 cursor-pointer shadow-lg"
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
                       <div className="text-left"><div className="text-white font-bold">ไวรัส</div><div className="text-gray-400 text-[10px]">ต้องรีบกด! +10 คะแนน</div></div>
                   </div>
                   <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                       <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-2xl animate-pulse">💣</div>
                       <div className="text-left"><div className="text-white font-bold">ระเบิด</div><div className="text-red-400 text-[10px] font-bold">ห้ามกดเด็ดขาด! GAME OVER</div></div>
                   </div>
                   <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                       <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-2xl">📁</div>
                       <div className="text-left"><div className="text-white font-bold">ไฟล์งาน</div><div className="text-gray-400 text-[10px]">ห้ามกด! -30 เลือด / -50 คะแนน</div></div>
                   </div>
                   <div className="flex items-center gap-3 bg-purple-500/20 p-2 rounded-xl border border-purple-500/50 animate-pulse">
                       <div className="w-10 h-10 rounded-lg bg-purple-900/50 border border-purple-500 flex items-center justify-center text-3xl drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">👾</div>
                       <div className="text-left"><div className="text-purple-300 font-bold">บอสไวรัส!</div><div className="text-purple-200 text-[10px]">กด 5 ที! ฆ่าได้ +200 คะแนน</div></div>
                   </div>
               </div>

               <button 
                   onClick={startGame} 
                   className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
               >
                   พร้อมแล้ว ลุย!
               </button>
           </div>
       )}

       {/* --- 2. GAMEPLAY SCREEN (4x4 แต่ขยายขนาด) --- */}
       {view === 'playing' && (
        <div className="relative z-10 w-full max-w-[500px] flex flex-col gap-6 animate-fade-in"> 
            
            {/* Header Score Bar */}
            <div className="flex justify-between items-center bg-black/40 p-4 md:p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-lg">
                <div className="text-center min-w-[70px]">
                    <div className="text-[10px] md:text-xs text-gray-400 tracking-widest font-bold">TIME</div>
                    <div className="text-2xl md:text-3xl font-mono text-white leading-none">{survivalTime}s</div>
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-[10px] md:text-xs text-purple-400 tracking-widest font-bold mb-2">THREAT LEVEL</div>
                    <div className="flex gap-2">
                        <div className={`w-10 h-3 rounded-full transition-colors ${phase >= 1 ? 'bg-green-500 shadow-[0_0_10px_lime]' : 'bg-gray-700'}`}></div>
                        <div className={`w-10 h-3 rounded-full transition-colors ${phase >= 2 ? 'bg-yellow-500 shadow-[0_0_10px_orange]' : 'bg-gray-700'}`}></div>
                        <div className={`w-10 h-3 rounded-full transition-colors ${phase >= 3 ? 'bg-red-500 shadow-[0_0_10px_red] animate-pulse' : 'bg-gray-700'}`}></div>
                    </div>
                </div>
                <div className="text-center min-w-[70px]">
                    <div className="text-[10px] md:text-xs text-blue-400 tracking-widest font-bold">SCORE</div>
                    <div className="text-2xl md:text-3xl font-black text-blue-300 leading-none">{score}</div>
                </div>
            </div>

            {/* Health Bar */}
            <div className="relative w-full">
                <div className="flex justify-between text-xs md:text-sm text-gray-400 mb-2 px-2 font-bold uppercase tracking-wider">
                    <span>System Health</span>
                    <span>{hp}/200</span>
                </div>
                <div className="w-full bg-black/30 h-6 md:h-8 rounded-full overflow-hidden border border-white/10 shadow-inner relative">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.2)_1px,transparent_1px)] bg-[size:10%_100%] z-10 pointer-events-none"></div>
                    <div 
                        className={`h-full transition-all duration-300 ${hp < 50 ? 'bg-red-500 shadow-[0_0_20px_red] animate-pulse' : 'bg-gradient-to-r from-green-500 to-emerald-400'}`} 
                        style={{ width: `${(hp / 200) * 100}%` }} 
                    />
                </div>
            </div>
            
            {/* ✅ GRID GAMEPLAY (4x4 แต่ขยายใหญ่) */}
            <div className={`p-4 md:p-6 bg-black/60 backdrop-blur-md rounded-[2.5rem] border border-white/10 shadow-2xl transition-all duration-500 ${phase === 3 ? 'border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : ''}`}>
                <div className={`grid ${GRID_COLS} gap-3 md:gap-4`}> 
                    {grid.map((cell, i) => (
                        <div 
                            key={i} 
                            className={`
                                aspect-square rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-100 select-none border relative overflow-hidden
                                text-5xl md:text-7xl /* 👈 ขยายไอคอนให้ใหญ่สะใจ */
                                ${cell === 'empty' ? 'bg-white/5 border-white/5 hover:bg-white/10' : ''}
                                ${cell === 'virus' ? 'bg-red-500/20 border-red-500/50 hover:scale-100 active:scale-90 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}
                                ${cell === 'bomb' ? 'bg-orange-500/20 border-orange-500/50 animate-pulse' : ''}
                                ${cell === 'file' ? 'bg-blue-500/20 border-blue-500/50' : ''}
                                ${cell === 'exploding' ? 'bg-red-600 border-red-600 animate-ping' : ''}
                                ${cell === 'boss' ? 'bg-purple-900/80 border-purple-500 animate-pulse drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]' : ''}
                            `}
                            onMouseDown={() => handleHit(i)}
                            onTouchStart={(e) => { e.preventDefault(); handleHit(i); }}
                        >
                            {cell === 'virus' ? '🦠' : cell === 'bomb' ? '💣' : cell === 'file' ? '📁' : cell === 'exploding' ? '💥' : ''}
                            {cell === 'boss' && (
                                <>
                                    <span className="text-6xl md:text-8xl">👾</span>
                                    <div className="absolute bottom-2 left-2 right-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-400 transition-all" style={{ width: `${(bossHp / 5) * 100}%` }}></div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {phase === 3 && (
                <div className="text-center animate-pulse text-red-500 font-bold tracking-widest text-sm md:text-base bg-black/20 p-2 rounded-lg">
                    ⚠️ DANGER LEVEL MAX! SPEED INCREASED! ⚠️
                </div>
            )}
        </div>
       )}
    
    {/* --- 3. GAMEOVER SCREEN --- */}
    {view === 'gameover' && (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden">
        
        {/* ✨ พื้นหลังหลัก */}
        <div className={`absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-1000 ${showStats ? 'opacity-100' : 'opacity-0'}`}></div>

        {/* 🖼️ GIF พื้นหลัง */}
        <div className={`absolute inset-0 z-10 flex items-center justify-center transition-all duration-1000 ease-in-out ${showStats ? 'opacity-20 scale-100' : 'opacity-100 scale-125'}`}>
            <img src="/images/Game_over.gif" alt="GameOver" className="w-full h-auto max-w-none" />
        </div>

        {/* 📊 กล่องคะแนน */}
        <div className={`relative z-30 w-full max-w-[400px] p-6 transition-all duration-700 transform ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
            
            <div className="bg-[#1a1a2e]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl p-8 text-center border-t-white/20">
                
                <div className="flex justify-center mb-4">
                    <div className="relative">
                        <span className="text-6xl drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-bounce">💥</span>
                    </div>
                </div>

                <h2 className="text-red-500 font-black text-2xl tracking-[0.15em] uppercase italic mb-1 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                    SYSTEM CRASHED
                </h2>
                <p className="text-red-400/60 text-[10px] font-mono mb-6 tracking-widest uppercase italic font-bold">
                    ERROR_CODE: 0xDEADBEEF
                </p>

                <div className="relative bg-black/40 border border-white/20 rounded-2xl p-6 mb-8 overflow-hidden shadow-inner">
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
    
    <div className={`scanline-effect z-20 transition-opacity duration-1000 ${showStats ? 'opacity-20' : 'opacity-0'}`}></div>
    </div>
  );
}