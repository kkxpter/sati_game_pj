'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { playSound } from '@/app/lib/sound';

// 1. สร้าง Type
interface LeaderboardPlayer {
  username: string;
  score: number;
  avatar: string;
  isMe?: boolean;
}

// 🔥 Mock Data
const MOCK_LEADERBOARD: LeaderboardPlayer[] = [
  { username: 'CyberGod_99', score: 99999, avatar: '🤖' },
  { username: 'HackHunter_X', score: 85000, avatar: '🕵️' },
  { username: 'NoScamPls', score: 78900, avatar: '🛡️' },
  { username: 'PhishBuster', score: 72500, avatar: '🎣' },
  { username: 'SecureMind', score: 68000, avatar: '🧠' },
  { username: 'NetWalker', score: 65400, avatar: '🌐' },
  { username: 'ByteDefender', score: 62000, avatar: '🧱' },
  { username: 'ZeroTrust', score: 59000, avatar: '🔒' },
  { username: 'WhiteHat_TH', score: 55500, avatar: '🎩' },
  { username: 'BugBounty', score: 51200, avatar: '🐛' },
  { username: 'Firewall_Master', score: 48000, avatar: '🔥' },
  { username: 'CryptoKeeper', score: 45000, avatar: '💰' },
  { username: 'DataGuardian', score: 42000, avatar: '💾' },
  { username: 'CloudSentinel', score: 39500, avatar: '☁️' },
  { username: 'NetworkNinja', score: 37000, avatar: '🥷' },
  { username: 'CodeWarrior', score: 35000, avatar: '⚔️' },
  { username: 'SysAdmin', score: 33000, avatar: '🖥️' },
  { username: 'PatchManager', score: 31000, avatar: '🩹' },
  { username: 'LogAnalyzer', score: 29000, avatar: '📊' },
  { username: 'VirusSlayer', score: 27500, avatar: '🦠' },
  { username: 'SpamBlocker', score: 26000, avatar: '📧' },
  { username: 'LinkChecker', score: 24500, avatar: '🔗' },
  { username: 'PassManager', score: 23000, avatar: '🔑' },
  { username: 'TwoFactor', score: 21500, avatar: '📱' },
  { username: 'Incognito', score: 20000, avatar: '🕶️' },
  { username: 'ProxyServer', score: 19500, avatar: '🔄' },
  { username: 'VPN_User', score: 18000, avatar: '🌍' },
  { username: 'CookieMonster', score: 17500, avatar: '🍪' },
  { username: 'CacheCleaner', score: 16000, avatar: '🧹' },
  { username: 'UpdateRequired', score: 15500, avatar: '⚠️' },
  { username: 'TrojanHorse', score: 14000, avatar: '🐴' },
  { username: 'WormDetector', score: 13500, avatar: '🪱' },
  { username: 'SpywareScanner', score: 12000, avatar: '🔍' },
  { username: 'AdBlocker', score: 11500, avatar: '🚫' },
  { username: 'PopUp_Killer', score: 10000, avatar: '💥' },
  { username: 'Digital_Nomad', score: 9500, avatar: '🏝️' },
  { username: 'WiFi_Secured', score: 9000, avatar: '📶' },
  { username: 'Bluetooth_Off', score: 8500, avatar: '🦷' },
  { username: 'NFC_Reader', score: 8000, avatar: '💳' },
  { username: 'QR_Scanner', score: 7500, avatar: '📷' },
  { username: 'Social_Eng', score: 7000, avatar: '🗣️' },
  { username: 'Identity_Safe', score: 6500, avatar: '🆔' },
  { username: 'Backup_Daily', score: 6000, avatar: '📂' },
  { username: 'Restore_Point', score: 5500, avatar: '⏪' },
  { username: 'DeepWeb_Ex', score: 5000, avatar: '🔦' },
  { username: 'DarkMode', score: 4500, avatar: '🌑' },
  { username: 'RGB_Key', score: 4000, avatar: '🌈' },
  { username: 'Mech_Switch', score: 3500, avatar: '⌨️' },
  { username: 'Mouse_Jig', score: 3000, avatar: '🖱️' },
  { username: 'Screen_Sav', score: 2500, avatar: '📺' },
];

export default function LeaderboardPage() {
  const router = useRouter();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myRankIndex, setMyRankIndex] = useState<number>(-1);

  useEffect(() => {
    const timer = setTimeout(() => {
        // 1. ดึงข้อมูล User และ Score
        const userStr = localStorage.getItem('user');
        const statsStr = localStorage.getItem('cyberStakes_played');
        
        let userScore = 0;
        let currentUser = null;

        if (userStr && statsStr) {
            currentUser = JSON.parse(userStr);
            const stats = JSON.parse(statsStr);
            userScore = ((stats.normal || 0) * 500) + ((stats.virus || 0) * 200) + ((stats.chat || 0) * 1000);
        }

        // 2. รวมข้อมูล
        const allPlayers: LeaderboardPlayer[] = [...MOCK_LEADERBOARD];
        
        if (currentUser) {
            allPlayers.push({ 
                username: currentUser.username, 
                score: userScore, 
                avatar: '😎', 
                isMe: true 
            });
        }

        // 3. เรียงลำดับ (มาก -> น้อย)
        allPlayers.sort((a, b) => b.score - a.score);
        
        // 4. หาอันดับของเรา
        const myIndex = allPlayers.findIndex(p => p.isMe);
        setMyRankIndex(myIndex);

        setLeaderboard(allPlayers);
        setIsLoading(false); 
    }, 800);

    return () => clearTimeout(timer); 
  }, []);

  // Helper Function
  const renderPlayerRow = (player: LeaderboardPlayer, index: number, isSticky: boolean = false) => {
      const rank = index + 1;
      
      // Responsive Style: ปรับ Padding และขนาดตามหน้าจอ
      let cardStyle = isSticky
        ? "bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-cyan-500/50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 rounded-t-2xl md:rounded-t-[2rem]" 
        : "bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl"; 

      // Responsive Font Size
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

      // 🔵 Sticky Bar
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
    // ✅ ใช้ h-[100dvh] เพื่อแก้ปัญหา Browser Bar ในมือถือ
    <main className="relative w-screen h-[100dvh] flex flex-col items-center justify-center md:p-4 overflow-hidden bg-[#0a0a0a] font-sans selection:bg-cyan-500/30">
      
      {/* ==================== ✨ BACKGROUND ✨ ==================== */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none"> 
          <div className="absolute inset-0 z-0 w-[200%] h-full animate-scroll-bg opacity-30 mix-blend-luminosity">
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
      {/* ✅ ปรับขนาด Mobile: w-full h-full rounded-none */}
      <div className="relative z-20 w-full h-full md:max-w-xl md:h-[85vh] bg-[#0a0a0a] md:bg-black/40 backdrop-blur-xl md:border border-white/10 md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="shrink-0 pt-8 pb-4 md:pt-8 md:pb-4 text-center relative z-10 bg-gradient-to-b from-[#0a0a0a] to-transparent">
            <div className="text-5xl md:text-6xl mb-2 filter drop-shadow-[0_0_20px_rgba(6,182,212,0.4)] animate-bounce-slow">🏆</div>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-[0.15em] drop-shadow-lg mb-1">
                Hall of Fame
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto rounded-full opacity-80"></div>
        </div>

        {/* 📋 Scrollable List */}
        {/* ✅ ปรับ Padding Mobile */}
        <div className="flex-1 overflow-y-auto px-3 py-2 md:px-4 md:py-2 custom-scrollbar space-y-1 relative pb-32">
            
            {isLoading ? (
                // --- Loading ---
                <div className="flex flex-col items-center justify-center h-full gap-6 opacity-60">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-xs text-cyan-400 animate-pulse tracking-widest uppercase">Fetching Data...</p>
                </div>
            ) : (
                // --- Loop ---
                leaderboard.map((player, index) => renderPlayerRow(player, index))
            )}
        </div>

        {/* 👇 STICKY USER RANK (ลอยอยู่ด้านล่าง) 👇 */}
        {!isLoading && myRankIndex !== -1 && (
            // ✅ ปรับตำแหน่ง Mobile: bottom-[4rem]
            <div className="absolute bottom-[3.5rem] md:bottom-[4.5rem] left-0 right-0 z-40 px-0 md:px-4">
                {renderPlayerRow(leaderboard[myRankIndex], myRankIndex, true)}
            </div>
        )}

        {/* Footer Button */}
        {/* ✅ ปรับ Padding Mobile */}
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