'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { playSound } from '@/app/lib/sound';

// --- Interfaces ---
interface LeaderboardPlayer {
    username: string;
    score: number;
    isMe?: boolean;
}

interface ApiPlayerResponse {
    username: string;
    score: number;
}

export default function LeaderboardPage() {
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'quiz_hard' | 'virus'>('quiz_hard');
    const [myRankIndex, setMyRankIndex] = useState<number>(-1);

    const fetchLeaderboard = async (type: string) => {
        setIsLoading(true);
        setMyRankIndex(-1);
        try {
            const userStr = localStorage.getItem('user');
            const currentUser = userStr ? JSON.parse(userStr) : null;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await fetch(`${apiUrl}/scores/leaderboard?type=${type}`);
            
            if (!res.ok) throw new Error('Failed to fetch data');

            const data: ApiPlayerResponse[] = await res.json();
            
            const mappedData: LeaderboardPlayer[] = data.map((p) => ({
                username: p.username,
                score: p.score,
                isMe: currentUser && p.username === currentUser.username
            }));

            setLeaderboard(mappedData);
            const myIndex = mappedData.findIndex((p) => p.isMe);
            setMyRankIndex(myIndex);

        } catch (error) {
            console.error("Fetch leaderboard error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard(activeTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // --- Component: Player Row ---
    const PlayerRow = ({ player, index }: { player: LeaderboardPlayer, index: number }) => {
        const rank = index + 1;
        
        // 🎨 Design Logic (ปรับปรุงใหม่)
        // - เพิ่ม group เพื่อใช้กับ hover effect ด้านใน
        // - เพิ่ม duration-300 เพื่อความนุ่มนวล
        // - เพิ่ม mb-2 เพิ่มช่องว่างระหว่างแถว
        // - เพิ่ม overflow-hidden สำหรับ shine effect
        let containerClass = "relative flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-300 border mb-2 group overflow-hidden relative";
        let rankBadge = <span className="font-mono text-gray-500 text-xs w-6 text-center font-bold transition-colors group-hover:text-gray-300">#{rank}</span>;
        let textClass = "text-gray-300 font-medium transition-colors group-hover:text-white";
        let scoreClass = "text-gray-400 font-mono text-sm transition-colors group-hover:text-gray-200";

        if (rank === 1) { 
            containerClass += " bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-transparent border-yellow-500/40 shadow-[inset_0_0_20px_rgba(234,179,8,0.15)] hover:shadow-[inset_0_0_25px_rgba(234,179,8,0.25)] hover:border-yellow-500/60";
            rankBadge = <span className="text-xl w-6 text-center drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)] scale-110 animate-pulse-slow">🥇</span>;
            textClass = "text-yellow-100 font-bold drop-shadow-sm";
            scoreClass = "text-yellow-300 font-bold text-base drop-shadow-sm";
        } else if (rank === 2) {
            containerClass += " bg-gradient-to-r from-slate-400/20 via-slate-400/10 to-transparent border-slate-400/40 shadow-[inset_0_0_20px_rgba(148,163,184,0.15)] hover:shadow-[inset_0_0_25px_rgba(148,163,184,0.25)] hover:border-slate-400/60";
            rankBadge = <span className="text-lg w-6 text-center drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)] scale-105">🥈</span>;
            textClass = "text-slate-100 font-bold drop-shadow-sm";
            scoreClass = "text-slate-300 font-bold text-base drop-shadow-sm";
        } else if (rank === 3) {
            containerClass += " bg-gradient-to-r from-orange-700/20 via-orange-600/10 to-transparent border-orange-500/40 shadow-[inset_0_0_20px_rgba(234,88,12,0.15)] hover:shadow-[inset_0_0_25px_rgba(234,88,12,0.25)] hover:border-orange-500/60";
            rankBadge = <span className="text-lg w-6 text-center drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)] scale-105">🥉</span>;
            textClass = "text-orange-100 font-bold drop-shadow-sm";
            scoreClass = "text-orange-300 font-bold text-base drop-shadow-sm";
        } else {
            // ✨ ปรับปรุงแถวทั่วไป: เพิ่มความสว่างตอน Hover, เพิ่มเงา, และยกตัวขึ้นเล็กน้อย
            containerClass += " bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.08] hover:border-white/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5";
        }

        if (player.isMe) {
            // เน้นแถวของตัวเองให้ชัดขึ้นอีกนิด
            containerClass += " ring-2 ring-cyan-500/50 bg-cyan-900/20 hover:bg-cyan-900/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]";
        }

        return (
            <div className={containerClass}>
                {/* ✨ เอฟเฟกต์แสงวิ่ง (Shine Effect) เมื่อ Hover */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden relative z-10">
                    <div className="flex-shrink-0 flex justify-center w-6 md:w-8">{rankBadge}</div>
                    
                    <div className="flex flex-col min-w-0">
                        <div className={`text-sm truncate max-w-[120px] md:max-w-[180px] flex items-center gap-2 ${textClass}`}>
                            {player.username}
                            {player.isMe && (
                                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 rounded-md uppercase tracking-wider font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]">คุณ</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className={`text-right tracking-wider relative z-10 ${scoreClass}`}>
                    {player.score.toLocaleString()}
                </div>
            </div>
        );
    };

    return (
        <main className="relative w-full h-[100dvh] flex flex-col items-center justify-center bg-slate-900 font-sans overflow-hidden">
            
            {/* ==================== ✨ Background ✨ ==================== */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950"> 
                <div className="absolute inset-0 z-0 w-[200%] h-full animate-scroll-bg opacity-40">
                    <div className="w-1/2 h-full bg-cover bg-center grayscale-[50%]" style={{ backgroundImage: "url('/images/bg1.png')" }}></div>
                    <div className="w-1/2 h-full bg-cover bg-center grayscale-[50%]" style={{ backgroundImage: "url('/images/bg1.png')" }}></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90 z-10"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse-slow mix-blend-screen z-20"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse-slow delay-1000 mix-blend-screen z-20"></div>
            </div>

            {/* ==================== 🏆 MAIN CARD ==================== */}
            {/* ✨ ปรับปรุง Main Card: 
                - เปลี่ยนพื้นหลังเป็น bg-slate-900/60 เพื่อความเข้มและชัดเจนของตัวหนังสือ
                - เพิ่ม backdrop-blur-2xl ให้เบลอมากขึ้น
                - เพิ่ม shadow ที่เข้มขึ้น
                - เพิ่ม ring-1 ring-white/5 ring-inset เพื่อสร้างขอบเรืองแสงด้านใน
            */}
            <div className="relative z-20 w-full h-full md:h-[90vh] max-w-md bg-slate-900/60 backdrop-blur-2xl md:border border-white/10 md:rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-fade-in-up ring-1 ring-white/5 ring-inset">
                
                {/* Header & Tabs */}
                <div className="shrink-0 pt-6 pb-4 px-6 text-center z-20 relative">
                    
                    {/* ปุ่ม Back */}
                    <button 
                        onClick={() => { playSound('click'); router.push('/'); }} 
                        className="absolute top-6 left-5 w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-all active:scale-95 z-50 backdrop-blur-md shadow-lg hover:shadow-white/10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>

                    <div className="flex items-center justify-center gap-2 mb-4">
                        {/* ✨ เพิ่มแสงเรืองให้ถ้วยรางวัล */}
                        <span className="text-3xl drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">🏆</span>
                        <h1 className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-md">ทำเนียบยอดฝีมือ</h1>
                    </div>
                    
                    <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/10 relative shadow-inner">
                        <button 
                            onClick={() => { playSound('click'); setActiveTab('quiz_hard'); }}
                            className={`flex-1 py-2.5 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === 'quiz_hard' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {activeTab === 'quiz_hard' && (
                                // ✨ ปรับปรุง Tab Active ให้ดูมีมิติขึ้น
                                <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-white/5 border border-white/20 rounded-xl -z-10 shadow-[0_2px_10px_rgba(0,0,0,0.2)] animate-fade-in"></div>
                            )}
                            <span className="drop-shadow-sm">🧠 แบบทดสอบ (ยาก)</span>
                        </button>

                        <button 
                            onClick={() => { playSound('click'); setActiveTab('virus'); }}
                            className={`flex-1 py-2.5 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === 'virus' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {activeTab === 'virus' && (
                                <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-white/5 border border-white/20 rounded-xl -z-10 shadow-[0_2px_10px_rgba(0,0,0,0.2)] animate-fade-in"></div>
                            )}
                            <span className="drop-shadow-sm">🦠 ภารกิจปราบไวรัส</span>
                        </button>
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto px-4 pb-28 custom-scrollbar" style={{ scrollbarGutter: 'stable' }}> 
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-4 opacity-60 animate-pulse">
                            <div className="w-10 h-10 border-3 border-white/20 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.3)]"></div>
                            <p className="text-xs text-cyan-300/70 font-mono uppercase tracking-widest">กำลังเชื่อมต่อข้อมูล...</p>
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 opacity-50">
                            <div className="text-5xl grayscale drop-shadow-lg">🏜️</div>
                            <p className="text-sm text-gray-400 font-medium">ยังไม่มีผู้เล่นในโหมดนี้</p>
                        </div>
                    ) : (
                        <div className="space-y-1 pt-2">
                            {leaderboard.map((player, index) => (
                                <PlayerRow key={index} player={player} index={index} />
                            ))}
                        </div>
                    )}
                </div>

                {/* ✨ PREMIUM STICKY USER RANK ✨ */}
                {!isLoading && myRankIndex !== -1 && (
                    <div className="absolute bottom-6 left-0 right-0 z-30 px-4 animate-slide-up">
                        {/* เพิ่มเงาและขอบให้ดูพรีเมียมขึ้น */}
                        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/50 bg-[#0f172a]/95 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.25)] py-2.5 px-4 flex items-center justify-between group ring-1 ring-cyan-400/20 ring-inset transition-all hover:shadow-[0_0_40px_rgba(6,182,212,0.35)] hover:border-cyan-400/70">
                            
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-600/5 to-cyan-500/10 animate-pulse-slow"></div>
                            <div className="absolute -left-10 top-0 bottom-0 w-2 bg-cyan-400 blur-xl opacity-50"></div>

                            <div className="relative flex items-center gap-4 z-10">
                                <div className="flex flex-col items-center">
                                    <span className="text-[8px] text-cyan-300 font-bold tracking-widest uppercase mb-0.5 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">อันดับ</span>
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 text-white font-black text-xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-300/50">
                                        {myRankIndex + 1}
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-black text-base flex items-center gap-2 drop-shadow-sm">
                                        {leaderboard[myRankIndex].username}
                                        <span className="text-[8px] bg-cyan-950 text-cyan-300 border border-cyan-400/50 px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.15)]">คุณ</span>
                                    </span>
                                    <span className="text-[10px] text-cyan-200/70 font-mono tracking-wider">สถิติของคุณ</span>
                                </div>
                            </div>

                            <div className="relative z-10 text-right">
                                <div className="text-[8px] text-cyan-300 font-bold tracking-widest uppercase mb-0.5 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">คะแนนรวม</div>
                                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-300 drop-shadow-[0_2px_8px_rgba(6,182,212,0.6)]">
                                    {leaderboard[myRankIndex].score.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}