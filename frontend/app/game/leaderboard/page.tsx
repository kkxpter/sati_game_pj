'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { playSound } from '@/app/lib/sound';

// --- Interfaces ---
interface LeaderboardPlayer {
    username: string;
    score: number;
    avatar: string;
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
            const avatars = ['🤖', '🕵️', '🛡️', '🎣', '🧠', '🌐', '🧱', '🔒', '🎩', '🐛'];
            
            const mappedData: LeaderboardPlayer[] = data.map((p, idx) => ({
                username: p.username,
                score: p.score,
                avatar: p.username === currentUser?.username ? '😎' : avatars[idx % avatars.length],
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
        
        // 🎨 Design Logic
        let containerClass = "relative flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-200 border mb-1.5";
        let rankBadge = <span className="font-mono text-gray-500 text-xs w-6 text-center font-bold">#{rank}</span>;
        let textClass = "text-gray-300 font-medium";
        let scoreClass = "text-gray-400 font-mono text-sm";
        let avatarClass = "bg-white/5 border-transparent text-gray-400";

        if (rank === 1) { 
            containerClass += " bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent border-yellow-500/30 shadow-[inset_0_0_15px_rgba(234,179,8,0.1)]";
            rankBadge = <span className="text-xl w-6 text-center drop-shadow-md">🥇</span>;
            textClass = "text-yellow-100 font-bold";
            scoreClass = "text-yellow-300 font-bold text-base";
            avatarClass = "bg-yellow-500/20 border-yellow-500/50 text-yellow-200";
        } else if (rank === 2) {
            containerClass += " bg-gradient-to-r from-slate-400/10 via-slate-400/5 to-transparent border-slate-400/30";
            rankBadge = <span className="text-lg w-6 text-center drop-shadow-md">🥈</span>;
            textClass = "text-slate-100 font-bold";
            scoreClass = "text-slate-300 font-bold text-base";
            avatarClass = "bg-slate-500/20 border-slate-400/50 text-slate-200";
        } else if (rank === 3) {
            containerClass += " bg-gradient-to-r from-orange-700/10 via-orange-600/5 to-transparent border-orange-500/30";
            rankBadge = <span className="text-lg w-6 text-center drop-shadow-md">🥉</span>;
            textClass = "text-orange-100 font-bold";
            scoreClass = "text-orange-300 font-bold text-base";
            avatarClass = "bg-orange-500/20 border-orange-500/50 text-orange-200";
        } else {
            containerClass += " bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]";
        }

        if (player.isMe) {
            // ✅ ใช้สี Cyan เดียวกับ Sticky Bar
            containerClass += " ring-1 ring-cyan-500/40 bg-cyan-900/10";
        }

        return (
            <div className={containerClass}>
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                    <div className="flex-shrink-0 flex justify-center w-6 md:w-8">{rankBadge}</div>
                    <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-lg md:text-xl shadow-inner border ${avatarClass} flex-shrink-0`}>
                        {player.avatar}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className={`text-sm truncate max-w-[120px] md:max-w-[180px] flex items-center gap-2 ${textClass}`}>
                            {player.username}
                            {player.isMe && (
                                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 rounded-md uppercase tracking-wider font-bold">คุณ</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className={`text-right tracking-wider ${scoreClass}`}>
                    {player.score.toLocaleString()}
                </div>
            </div>
        );
    };

    return (
        <main className="relative w-full h-[100dvh] flex flex-col items-center justify-center bg-[#050505] font-sans overflow-hidden">
            
            {/* ==================== ✨ Background ✨ ==================== */}
            <div className="absolute inset-0 z-0 pointer-events-none"> 
                <div className="absolute inset-0 z-0 w-[200%] h-full animate-scroll-bg opacity-30 mix-blend-luminosity">
                    <div className="w-1/2 h-full bg-cover bg-center grayscale opacity-60" style={{ backgroundImage: "url('/images/bg1.png')" }}></div>
                    <div className="w-1/2 h-full bg-cover bg-center grayscale opacity-60" style={{ backgroundImage: "url('/images/bg1.png')" }}></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-[#0a0a0a]/40 z-10"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[50%] rounded-full bg-blue-600/10 blur-[100px] animate-pulse-slow z-10"></div>
                <div className="absolute bottom-[-10%] right-[0%] w-[60%] h-[40%] rounded-full bg-purple-600/10 blur-[100px] animate-pulse-slow delay-1000 z-10"></div>
                <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-[0.05] z-10"></div>
            </div>

            {/* ==================== 🏆 MAIN CARD ==================== */}
            <div className="relative z-20 w-full h-full md:h-[90vh] max-w-md bg-[#0a0a0a]/80 backdrop-blur-3xl md:border border-white/5 md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                
                {/* Header & Tabs */}
                <div className="shrink-0 pt-6 pb-4 px-6 text-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="text-3xl">🏆</span>
                        <h1 className="text-2xl font-black text-white uppercase tracking-widest">ทำเนียบยอดฝีมือ</h1>
                    </div>
                    
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 relative">
                        <button 
                            onClick={() => { playSound('click'); setActiveTab('quiz_hard'); }}
                            className={`flex-1 py-2 rounded-lg font-bold text-xs md:text-sm tracking-wide transition-all relative z-10 flex items-center justify-center gap-2 ${activeTab === 'quiz_hard' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {activeTab === 'quiz_hard' && (
                                <div className="absolute inset-0 bg-white/10 border border-white/10 rounded-lg -z-10 shadow-lg animate-fade-in"></div>
                            )}
                            <span>🧠 แบบทดสอบ (ยาก)</span>
                        </button>

                        <button 
                            onClick={() => { playSound('click'); setActiveTab('virus'); }}
                            className={`flex-1 py-2 rounded-lg font-bold text-xs md:text-sm tracking-wide transition-all relative z-10 flex items-center justify-center gap-2 ${activeTab === 'virus' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {activeTab === 'virus' && (
                                <div className="absolute inset-0 bg-white/10 border border-white/10 rounded-lg -z-10 shadow-lg animate-fade-in"></div>
                            )}
                            <span>🦠 ภารกิจปราบไวรัส</span>
                        </button>
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto px-4 pb-28 custom-scrollbar"> 
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 opacity-60">
                            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">กำลังเชื่อมต่อข้อมูล...</p>
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-2 opacity-40">
                            <div className="text-4xl grayscale">🏜️</div>
                            <p className="text-xs text-gray-500">ยังไม่มีผู้เล่นในโหมดนี้</p>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {leaderboard.map((player, index) => (
                                <PlayerRow key={index} player={player} index={index} />
                            ))}
                        </div>
                    )}
                </div>

                {/* ✨ PREMIUM STICKY USER RANK (Smaller & Higher) ✨ */}
                {!isLoading && myRankIndex !== -1 && (
                    // ✅ ปรับ bottom-[5.5rem] เพื่อเลื่อนขึ้น
                    <div className="absolute bottom-[5.5rem] left-0 right-0 z-30 px-4 animate-slide-up">
                        {/* ✅ ปรับ padding เป็น py-2 px-3 และ rounded-xl ให้เล็กลง */}
                        <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-[#0f172a]/95 backdrop-blur-xl shadow-[0_0_20px_rgba(6,182,212,0.2)] py-2 px-3 flex items-center justify-between group">
                            
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 animate-pulse-slow"></div>
                            <div className="absolute -left-10 top-0 bottom-0 w-2 bg-cyan-400 blur-xl opacity-50"></div>

                            <div className="relative flex items-center gap-3 z-10">
                                <div className="flex flex-col items-center">
                                    {/* ✅ ลดขนาดฟอนต์ */}
                                    <span className="text-[8px] text-cyan-400 font-bold tracking-widest uppercase mb-0.5">อันดับ</span>
                                    {/* ✅ ลดขนาดกล่อง w-8 h-8 และฟอนต์ text-lg */}
                                    <div className="w-8 h-8 rounded-md bg-cyan-500 text-black font-black text-lg flex items-center justify-center shadow-[0_0_10px_cyan]">
                                        {myRankIndex + 1}
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    {/* ✅ ลดขนาดฟอนต์ชื่อ text-sm */}
                                    <span className="text-white font-bold text-sm flex items-center gap-2">
                                        {leaderboard[myRankIndex].username}
                                        {/* ✅ ลดขนาดป้าย You text-[7px] */}
                                        <span className="text-[7px] bg-cyan-900 text-cyan-300 border border-cyan-500/50 px-1 py-0 rounded-sm uppercase tracking-wider">คุณ</span>
                                    </span>
                                    {/* ✅ ลดขนาดฟอนต์ text-[9px] */}
                                    <span className="text-[9px] text-cyan-200/60 font-mono tracking-wider">สถิติของคุณ</span>
                                </div>
                            </div>

                            <div className="relative z-10 text-right">
                                {/* ✅ ลดขนาดฟอนต์ */}
                                <div className="text-[8px] text-cyan-400 font-bold tracking-widest uppercase mb-0.5">คะแนนรวม</div>
                                {/* ✅ ลดขนาดฟอนต์ text-xl */}
                                <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-300 drop-shadow-[0_2px_5px_rgba(6,182,212,0.5)]">
                                    {leaderboard[myRankIndex].score.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Button */}
                <div className="shrink-0 p-4 bg-[#050505] border-t border-white/5 relative z-40">
                    <button 
                        onClick={() => { playSound('click'); router.push('/'); }} 
                        className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span>← กลับหน้าหลัก</span>
                    </button>
                </div>

            </div>
        </main>
    );
}