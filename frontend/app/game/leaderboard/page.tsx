'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { playSound } from '@/app/lib/sound';
// ลบ Link ออกถ้าไม่ได้ใช้ หรือเก็บไว้ถ้ามีปุ่มกลับหน้าหลักที่ใช้ Link
import Link from 'next/link'; 

// 1. Interface สำหรับข้อมูลที่ใช้แสดงผลในหน้าเว็บ
interface LeaderboardPlayer {
  username: string;
  score: number;
  avatar: string;
  isMe?: boolean;
}

// 2. ✅ เพิ่ม Interface สำหรับข้อมูลดิบจาก API (แก้ปัญหา Unexpected any)
interface ApiPlayerResponse {
  username: string;
  score: number;
  // อาจมี field อื่นๆ จาก DB ที่เราไม่ได้ใช้ ก็ปล่อยไว้ได้ หรือใส่เป็น optional
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quiz_hard' | 'virus'>('quiz_hard');
  const [myRankIndex, setMyRankIndex] = useState<number>(-1);

  const fetchLeaderboard = async (type: string) => {
      setIsLoading(true);
      setMyRankIndex(-1); // Reset อันดับตัวเองก่อนโหลดใหม่
      try {
          // ดึง User ปัจจุบันเพื่อหา isMe
          const userStr = localStorage.getItem('user');
          const currentUser = userStr ? JSON.parse(userStr) : null;

          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          const res = await fetch(`${apiUrl}/scores/leaderboard?type=${type}`);
          
          if (!res.ok) {
             throw new Error('Failed to fetch data');
          }

          const data: ApiPlayerResponse[] = await res.json(); // 👈 ระบุ Type ตรงนี้ว่าเป็น Array ของ ApiPlayerResponse

          // Map ข้อมูลเพื่อเช็คว่าเป็นเราไหม + ใส่ Avatar
          const avatars = ['🤖', '🕵️', '🛡️', '🎣', '🧠', '🌐', '🧱', '🔒', '🎩', '🐛'];
          
          const mappedData: LeaderboardPlayer[] = data.map((p, idx) => ({
              username: p.username,
              score: p.score,
              avatar: p.username === currentUser?.username ? '😎' : avatars[idx % avatars.length],
              isMe: currentUser && p.username === currentUser.username
          }));

          setLeaderboard(mappedData);

          // หาอันดับตัวเอง
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

  // Helper Function: แสดงแต่ละแถว
  const renderPlayerRow = (player: LeaderboardPlayer, index: number, isSticky: boolean = false) => {
      const rank = index + 1;
      
      let cardStyle = isSticky
        ? "bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-cyan-500/50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 rounded-t-2xl md:rounded-t-[2rem]" 
        : "bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl"; 

      let rankDisplay = <span className="text-gray-500 font-bold text-base md:text-lg w-6 md:w-8 text-center font-mono">#{rank}</span>;
      let textGradient = "text-gray-200";
      let avatarStyle = "bg-white/5 text-gray-400 border-transparent";
      let scoreColor = "text-gray-400";

      // 🥇 Gold
      if (rank === 1 && !isSticky) {
          cardStyle = "bg-gradient-to-r from-yellow-900/20 to-transparent border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.15)]";
          rankDisplay = <span className="text-2xl md:text-3xl w-6 md:w-8 text-center drop-shadow-md animate-pulse">🥇</span>;
          textGradient = "text-yellow-100";
          avatarStyle = "bg-yellow-500/20 text-yellow-200 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]";
          scoreColor = "text-yellow-200 drop-shadow-md";
      } 
      // 🥈 Silver
      else if (rank === 2 && !isSticky) {
          cardStyle = "bg-gradient-to-r from-slate-800/30 to-transparent border-slate-400/30 shadow-[0_0_15px_rgba(148,163,184,0.15)]";
          rankDisplay = <span className="text-xl md:text-2xl w-6 md:w-8 text-center drop-shadow-md">🥈</span>;
          textGradient = "text-slate-100";
          avatarStyle = "bg-slate-500/20 text-slate-200 border-slate-400/50";
          scoreColor = "text-slate-200";
      } 
      // 🥉 Bronze
      else if (rank === 3 && !isSticky) {
          cardStyle = "bg-gradient-to-r from-orange-900/20 to-transparent border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]";
          rankDisplay = <span className="text-xl md:text-2xl w-6 md:w-8 text-center drop-shadow-md">🥉</span>;
          textGradient = "text-orange-100";
          avatarStyle = "bg-orange-500/20 text-orange-200 border-orange-500/50";
          scoreColor = "text-orange-200";
      }

      // 🔵 Sticky Bar & User Highlight
      if (isSticky) {
          rankDisplay = <span className="text-cyan-400 font-black text-lg md:text-xl w-6 md:w-8 text-center font-mono drop-shadow-[0_0_5px_cyan]">#{rank}</span>;
          textGradient = "text-white";
          avatarStyle = "bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow-[0_0_15px_cyan]";
          scoreColor = "text-cyan-300 drop-shadow-md";
      } else if (player.isMe) {
          cardStyle += " bg-cyan-900/10 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]";
      }

      return (
          <div 
              key={isSticky ? 'me-sticky' : index} 
              className={`flex items-center justify-between px-3 py-3 md:px-5 md:py-4 transition-all duration-300 group ${cardStyle} ${isSticky ? '' : 'mb-2'}`}
          >
              <div className="flex items-center gap-3 md:gap-5 overflow-hidden">
                  <div className="flex-shrink-0 flex justify-center">{rankDisplay}</div>
                  
                  <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                      <div className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center text-lg md:text-xl shadow-inner border flex-shrink-0 ${avatarStyle} relative overflow-hidden transition-transform group-hover:scale-110`}>
                          {player.avatar}
                      </div>
                      
                      <div className="flex flex-col min-w-0">
                          <div className={`font-bold text-sm md:text-base leading-tight flex items-center gap-2 truncate ${textGradient}`}>
                              <span className="truncate max-w-[100px] md:max-w-[200px]">{player.username}</span>
                              {player.isMe && (
                                  <span className="text-[8px] md:text-[9px] bg-cyan-500 text-black px-1 py-0.5 rounded font-black tracking-wider shadow-[0_0_8px_cyan] flex-shrink-0">YOU</span>
                              )}
                          </div>
                          <div className={`text-[9px] md:text-[10px] uppercase tracking-wider font-medium opacity-60 truncate ${isSticky ? 'text-cyan-200' : 'text-gray-400'}`}>
                              {isSticky ? 'Your Rank' : 'Cyber Hunter'}
                          </div>
                      </div>
                  </div>
              </div>

              <div className="text-right flex-shrink-0 pl-2">
                  <div className={`font-mono font-black text-sm md:text-lg tracking-wider ${scoreColor}`}>
                      {player.score.toLocaleString()}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <main className="relative w-screen h-[100dvh] flex flex-col items-center justify-center md:p-4 overflow-hidden bg-[#0a0a0a] font-sans selection:bg-cyan-500/30">
      
      {/* ==================== ✨ BACKGROUND ✨ ==================== */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none"> 
          <div className="absolute inset-0 z-0 w-[200%] h-full animate-scroll-bg opacity-30 mix-blend-luminosity">
              {/* ตรวจสอบ path รูปภาพให้ถูกต้อง */}
              <div className="w-1/2 h-full bg-cover bg-center grayscale" style={{ backgroundImage: "url('/images/bg1.png')" }}></div>
              <div className="w-1/2 h-full bg-cover bg-center grayscale" style={{ backgroundImage: "url('/images/bg1.png')" }}></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0a0a0a_100%)] z-10"></div>
          <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse-slow z-0"></div>
          <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] animate-pulse-slow delay-1000 z-0"></div>
          <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-[0.03] z-10"></div>
      </div>

      {/* ==================== 🏆 MAIN CARD ==================== */}
      <div className="relative z-20 w-full h-full md:max-w-xl md:h-[85vh] bg-[#0a0a0a] md:bg-black/40 backdrop-blur-xl md:border border-white/10 md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="shrink-0 pt-8 pb-4 md:pt-8 md:pb-4 text-center relative z-10 bg-gradient-to-b from-[#0a0a0a] to-transparent">
            <div className="text-5xl md:text-6xl mb-2 filter drop-shadow-[0_0_20px_rgba(6,182,212,0.4)] animate-bounce-slow">🏆</div>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-[0.15em] drop-shadow-lg mb-4">
                Hall of Fame
            </h1>
            
            {/* ✅ ปุ่มสลับ Tab */}
            <div className="flex justify-center gap-3 px-4">
                <button 
                    onClick={() => { playSound('click'); setActiveTab('quiz_hard'); }}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all border ${activeTab === 'quiz_hard' ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}
                >
                    🧠 Quiz Hard
                </button>
                <button 
                    onClick={() => { playSound('click'); setActiveTab('virus'); }}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all border ${activeTab === 'virus' ? 'bg-red-600/20 border-red-500 text-red-300 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}
                >
                    🦠 Virus Smash
                </button>
            </div>
        </div>

        {/* 📋 Scrollable List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 md:px-4 md:py-2 custom-scrollbar space-y-1 relative pb-32">
            {isLoading ? (
                // --- Loading ---
                <div className="flex flex-col items-center justify-center h-full gap-6 opacity-60">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-xs text-cyan-400 animate-pulse tracking-widest uppercase">Fetching Data...</p>
                </div>
            ) : leaderboard.length === 0 ? (
                // --- Empty ---
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                    <div className="text-4xl">🏜️</div>
                    <p className="text-sm text-gray-400">ยังไม่มีผู้เล่นในโหมดนี้</p>
                </div>
            ) : (
                // --- Loop ---
                leaderboard.map((player, index) => renderPlayerRow(player, index))
            )}
        </div>

        {/* 👇 STICKY USER RANK (ลอยอยู่ด้านล่าง) 👇 */}
        {!isLoading && myRankIndex !== -1 && (
            <div className="absolute bottom-[3.5rem] md:bottom-[4.5rem] left-0 right-0 z-40 px-0 md:px-4">
                {renderPlayerRow(leaderboard[myRankIndex], myRankIndex, true)}
            </div>
        )}

        {/* Footer Button */}
        <div className="shrink-0 p-3 md:p-4 bg-[#0a0a0a]/95 border-t border-white/10 relative z-50 backdrop-blur-md">
            <button 
                onClick={() => { playSound('click'); router.push('/'); }} 
                className="w-full py-3 md:py-3 text-xs text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-all flex justify-center items-center gap-2 group hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 active:bg-white/10"
            >
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Menu
            </button>
        </div>

      </div>
    </main>
  );
}