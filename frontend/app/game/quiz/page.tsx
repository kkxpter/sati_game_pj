'use client';
import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { playSound } from '@/app/lib/sound';
import Link from 'next/link';

// --- Interface ---
interface Choice {
  cid: number;
  choice_text: string;
  is_correct: boolean;
  qid: number;
}

interface Question {
  qid: number;
  question: string;
  explanation?: string;
  level: string;
  choices: Choice[];
}

interface ApiResponse {
  success: boolean;
  questions: Question[];
}

interface UserData {
    id: number;
    username: string;
}

interface LeaderboardEntry {
    username: string;
    score: number;
    isMe: boolean;
    avatar: string;
}

// --- Config ---
const GAME_CONFIG: Record<string, { time: number; score: number; color: string }> = {
  easy: { time: 20, score: 20, color: 'text-green-400' },
  medium: { time: 15, score: 30, color: 'text-yellow-400' },
  hard: { time: 10, score: 40, color: 'text-red-400' },
};

const MOCK_BOTS = [
    { username: 'CyberNinja', score: 350, avatar: '🥷' },
    { username: 'GlitchH.', score: 280, avatar: '👾' },
    { username: 'NeonSamu', score: 220, avatar: '👺' },
    { username: 'BitBot', score: 180, avatar: '🤖' },
    { username: 'CodeMaster', score: 150, avatar: '👨‍💻' },
    { username: 'BugHunter', score: 100, avatar: '🕷️' },
];

const RANK_SYSTEM = [
    { percent: 100, icon: "👑", title: "เทพเจ้าไอที", desc: "สุดยอด! มิจฉาชีพกราบ", color: "text-purple-400", border: "border-purple-500", bg: "from-purple-500/20" },
    { percent: 80,  icon: "🛡️", title: "ผู้พิทักษ์", desc: "สกิลตึงเปรี้ยะ!", color: "text-blue-400", border: "border-blue-500", bg: "from-blue-500/20" },
    { percent: 60,  icon: "🔫", title: "มือปราบ", desc: "เริ่มเก๋าเกมแล้วนะ", color: "text-green-400", border: "border-green-500", bg: "from-green-500/20" },
    { percent: 40,  icon: "🐢", title: "เน็ตเต่า", desc: "มีความรู้บ้าง... ระวังหน่อย", color: "text-yellow-400", border: "border-yellow-500", bg: "from-yellow-500/20" },
    { percent: 20,  icon: "🎣", title: "มือไว", desc: "ใจเย็นๆ นะวัยรุ่น", color: "text-orange-400", border: "border-orange-500", bg: "from-orange-500/20" },
    { percent: 0,   icon: "🍼", title: "เบบี้", desc: "กลับไปดื่มนมก่อนลูก", color: "text-gray-400", border: "border-gray-500", bg: "from-gray-500/20" },
];

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const diff = searchParams.get('diff') || 'easy';
  const config = GAME_CONFIG[diff.toLowerCase()] || GAME_CONFIG['easy'];

  // --- State ---
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'finished'>('loading');
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.time);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [isBonus, setIsBonus] = useState(false);
  const [isTimeOut, setIsTimeOut] = useState(false);

  // --- Init ---
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { router.push('/login'); return; }
    
    setTimeout(() => {
        setCurrentUser(JSON.parse(userStr));
    }, 0);

    const fetchQuestions = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/questions?level=${diff}`);
        const data: ApiResponse = await res.json();

        if (data.success && data.questions && data.questions.length > 0) {
            
            // ✅ เพิ่มตรงนี้: ฟังก์ชันสุ่มตัวเลือก (Shuffle Choices)
            const shuffledQuestions = data.questions.map((q) => {
                // สร้าง array ใหม่ของ choices เพื่อนำมาสลับ
                const choices = [...q.choices];
                // ใช้สูตร Fisher-Yates Shuffle เพื่อการสุ่มที่ทั่วถึง
                for (let i = choices.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [choices[i], choices[j]] = [choices[j], choices[i]];
                }
                return { ...q, choices };
            });

            setQuestions(shuffledQuestions); // บันทึกคำถามที่สลับช้อยส์แล้ว
            setGameState('playing');
            setTimeout(() => setIsTimerRunning(true), 0);
            playSound('click'); 
        } else {
            alert(`ไม่พบคำถามระดับ ${diff} ในระบบ`);
            router.push('/');
        }
      } catch (error) {
        console.error(error);
        router.push('/');
      }
    };
    fetchQuestions();
  }, [diff, router]);

  const handleTimeOut = useCallback(() => {
      setIsTimerRunning(false);
      setIsCorrect(false);
      setIsTimeOut(true);
      setShowFeedback(true);
      playSound('wrong');
      setEarnedPoints(0);
  }, []);

  // --- Timer ---
  useEffect(() => {
    if (!isTimerRunning) return;
    if (timeLeft <= 0) {
        const timeoutId = setTimeout(() => handleTimeOut(), 0);
        return () => clearTimeout(timeoutId);
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isTimerRunning, handleTimeOut]);

  // --- Logic ---
  const finishGame = () => {
      setGameState('finished');
      playSound('correct'); 
  };

  const nextQuestion = () => {
    setShowFeedback(false);
    setSelectedChoiceId(null);
    setIsBonus(false);
    setIsTimeOut(false);
    if (currentQIndex < questions.length - 1) {
        setCurrentQIndex((prev) => prev + 1);
        setTimeLeft(config.time);
        setIsTimerRunning(true);
    } else {
        finishGame();
    }
  };

  const handleAnswer = (choice: Choice) => {
    if (showFeedback) return;
    setIsTimerRunning(false);
    setSelectedChoiceId(choice.cid);
    
    const correct = choice.is_correct === true; 
    setIsCorrect(correct);
    setIsTimeOut(false);

    if (correct) {
        setCorrectCount(prev => prev + 1);
        const points = config.score; 
        let bonus = 0;
        if (timeLeft > config.time / 2) {
            bonus = 10;
            setIsBonus(true);
        } else {
            setIsBonus(false);
        }
        const totalPoints = points + bonus;
        setScore((prev) => prev + totalPoints);
        setEarnedPoints(totalPoints);
        playSound('correct');
    } else {
        setEarnedPoints(0);
        playSound('wrong');
    }
    setShowFeedback(true);
  };

  const leaderboard = useMemo(() => {
      if (gameState !== 'finished' || !currentUser) return [];
      const botEntries: LeaderboardEntry[] = MOCK_BOTS.map(bot => ({ ...bot, isMe: false }));
      const myEntry: LeaderboardEntry = { username: currentUser.username, score: score, isMe: true, avatar: '😎' };
      return [...botEntries, myEntry].sort((a, b) => b.score - a.score);
  }, [gameState, score, currentUser]);


  // --- RENDER: Loading ---
  if (gameState === 'loading') return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="text-xl font-bold animate-pulse tracking-widest">กำลังโหลดข้อมูล...</div>
    </div>
  );

  // --- RENDER: Finished (Responsive & Compact) ---
  if (gameState === 'finished') {
      const totalPossibleScore = questions.length * (config.score + 10);
      const scorePercentage = totalPossibleScore > 0 ? (score / totalPossibleScore) * 100 : 0;
      const myRank = RANK_SYSTEM.find(r => scorePercentage >= r.percent) || RANK_SYSTEM[RANK_SYSTEM.length - 1];
      const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

      return (
        <main className="relative min-h-screen w-screen bg-slate-950 font-sans flex flex-col items-center justify-start md:justify-center p-4 overflow-y-auto">
            
            {/* ==================== ✨ พื้นหลัง (รูปภาพเลื่อน + สีดรอปลง) ✨ ==================== */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950 pointer-events-none">
                
                {/* 1. รูปภาพเลื่อน (ปรับให้ช้าลง + Opacity ต่ำลง + Grayscale) */}
                <div className="absolute inset-0 z-0 w-[200%] h-full animate-scroll-bg opacity-40">
                    <div 
                        className="w-1/2 h-full bg-cover bg-center grayscale-[50%]" 
                        style={{ backgroundImage: "url('/images/bg1.png')" }} 
                    ></div>
                    <div 
                        className="w-1/2 h-full bg-cover bg-center grayscale-[50%]"
                        style={{ backgroundImage: "url('/images/bg1.png')" }} 
                    ></div>
                </div>

                {/* 2. Overlay สีดำไล่ระดับ (Gradient) */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90 z-10"></div>

                {/* 3. Effect แสงไฟ */}
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse-slow mix-blend-screen z-20"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse-slow delay-1000 mix-blend-screen z-20"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 md:p-8 text-center shadow-[0_0_80px_rgba(0,0,0,0.5)] animate-fade-in flex flex-col gap-4 md:gap-6 my-4 md:my-0">
                
                <h1 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 uppercase tracking-widest drop-shadow-lg">
                    MISSION COMPLETE
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    
                    {/* LEFT: Personal Result */}
                    <div className="flex flex-col gap-4 order-1">
                        <div className={`bg-slate-900 rounded-3xl p-6 border-4 ${myRank.border} relative overflow-hidden shadow-2xl flex flex-col justify-center items-center min-h-[250px]`}>
                             <div className={`absolute inset-0 bg-gradient-to-br ${myRank.bg} to-transparent opacity-20`}></div>
                            
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="text-gray-400 text-xs md:text-sm font-bold uppercase tracking-widest mb-2">คะแนนรวมของคุณ</div>
                                <div className="text-5xl md:text-7xl font-black text-white mb-2 md:mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-[bounce_2s_infinite]">
                                    {score}
                                </div>
                                <div className="w-24 md:w-32 h-1 bg-white/20 rounded-full my-2 md:my-4"></div>
                                <div className="text-5xl md:text-6xl mb-2 md:mb-4 filter drop-shadow-lg">{myRank.icon}</div>
                                <div className={`text-xl md:text-2xl font-black ${myRank.color} uppercase tracking-widest`}>{myRank.title}</div>
                            </div>
                        </div>

                        {/* Mini Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-800 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-[10px] md:text-xs text-gray-400 uppercase font-bold">ตอบถูก</span>
                                <span className="text-lg md:text-xl font-black text-green-400">{correctCount} <span className="text-xs text-gray-500">/ {questions.length}</span></span>
                            </div>
                            <div className="bg-slate-800 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-[10px] md:text-xs text-gray-400 uppercase font-bold">ความแม่นยำ</span>
                                <span className="text-lg md:text-xl font-black text-blue-400">{accuracy}%</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Leaderboard */}
                    <div className="bg-black/40 rounded-[2rem] border border-white/10 flex flex-col overflow-hidden h-[350px] md:h-[420px] relative backdrop-blur-sm order-2">
                        <div className="p-3 md:p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-lg md:text-xl">🏆</span> 
                                <span className="uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">Leaderboard</span>
                            </h3>
                            <span className="text-[10px] text-gray-400 font-mono bg-black/50 px-2 py-1 rounded">LIVE</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            {leaderboard.map((entry, index) => {
                                let rankStyle = "bg-white/5 border-white/5 text-gray-300";
                                let rankIcon = <span className="font-mono text-gray-500 text-sm md:text-base w-6 text-center">#{index + 1}</span>;
                                if (index === 0) {
                                    rankStyle = "bg-yellow-900/30 border-yellow-500/30 text-yellow-100";
                                    rankIcon = <span className="text-lg w-6 text-center">🥇</span>;
                                } else if (index === 1) {
                                    rankStyle = "bg-slate-700/30 border-slate-400/30 text-slate-100";
                                    rankIcon = <span className="text-lg w-6 text-center">🥈</span>;
                                } else if (index === 2) {
                                    rankStyle = "bg-orange-900/30 border-orange-500/30 text-orange-100";
                                    rankIcon = <span className="text-lg w-6 text-center">🥉</span>;
                                }
                                if (entry.isMe) rankStyle += " ring-1 ring-blue-500 z-10 sticky top-0 bottom-0 shadow-lg !bg-blue-900/80 backdrop-blur-md";

                                return (
                                    <div key={index} className={`flex items-center justify-between p-2 rounded-xl border transition-all ${rankStyle}`}>
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="flex-shrink-0">{rankIcon}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-base md:text-lg">{entry.avatar}</span>
                                                <span className={`font-bold text-xs md:text-sm ${entry.isMe ? 'text-blue-300' : ''}`}>
                                                    {entry.username} {entry.isMe && <span className="text-[9px] bg-blue-600 text-white px-1 py-0.5 rounded ml-1 uppercase">YOU</span>}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`font-black text-sm md:text-base ${index < 3 ? 'text-white' : 'text-gray-400'} font-mono`}>{entry.score.toLocaleString()}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Bottom Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2 order-3">
                     <button onClick={() => window.location.reload()} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-all shadow-lg active:scale-95 text-xs md:text-sm">
                        🔄 เล่นอีกครั้ง
                    </button>
                    <Link href="/" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold uppercase tracking-widest hover:shadow-lg transition-all flex justify-center items-center shadow-lg active:scale-95 text-xs md:text-sm">
                        🏠 หน้าหลัก
                    </Link>
                </div>
            </div>
        </main>
      );
  }

  // --- RENDER: Playing ---
  const currentQuestion = questions[currentQIndex];
  if (!currentQuestion) return <div>โหลดข้อผิดพลาด...</div>;

  const timePercentage = (timeLeft / config.time) * 100;
  let timerColor = 'bg-green-500 shadow-[0_0_10px_#22c55e]';
  if (timeLeft <= config.time * 0.5) timerColor = 'bg-yellow-500 shadow-[0_0_10px_#eab308]';
  if (timeLeft <= config.time * 0.2) timerColor = 'bg-red-600 shadow-[0_0_15px_#dc2626] animate-pulse';

  return (
    <main className="relative min-h-screen w-screen overflow-hidden bg-slate-950 font-sans flex flex-col items-center justify-start md:justify-center p-4">
        
        {/* ==================== ✨ พื้นหลัง (รูปภาพเลื่อน + สีดรอปลง) ✨ ==================== */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950 pointer-events-none">
            
            {/* 1. รูปภาพเลื่อน (ปรับให้ช้าลง + Opacity ต่ำลง + Grayscale) */}
            <div className="absolute inset-0 z-0 w-[200%] h-full animate-scroll-bg opacity-40">
                <div 
                    className="w-1/2 h-full bg-cover bg-center grayscale-[50%]" 
                    style={{ backgroundImage: "url('/images/bg1.png')" }} 
                ></div>
                <div 
                    className="w-1/2 h-full bg-cover bg-center grayscale-[50%]"
                    style={{ backgroundImage: "url('/images/bg1.png')" }} 
                ></div>
            </div>

            {/* 2. Overlay สีดำไล่ระดับ (Gradient) */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90 z-10"></div>

            {/* 3. Effect แสงไฟ */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse-slow mix-blend-screen z-20"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse-slow delay-1000 mix-blend-screen z-20"></div>
        </div>

        <div className="relative z-10 w-full max-w-4xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 md:p-8 shadow-[0_0_60px_rgba(0,0,0,0.4)] flex flex-col gap-4 md:gap-6 mt-4 md:mt-0">
            {/* Header */}
            <div className="flex items-center gap-2 md:gap-4 w-full">
                <button 
                    onClick={() => router.push('/')}
                    className="h-10 w-10 md:h-12 md:w-auto md:px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
                >
                    <span className="text-lg md:text-xl text-gray-400">✕</span>
                    <span className="hidden md:inline-block text-xs font-bold text-gray-400 uppercase tracking-widest">ออก</span>
                </button>

                <div className="flex-1 h-10 md:h-12 bg-black/40 rounded-xl overflow-hidden border border-white/10 relative shadow-inner flex items-center px-3 md:px-4">
                    <div className={`absolute left-0 top-0 h-full transition-all duration-1000 ease-linear opacity-50 ${timerColor}`} style={{ width: `${timePercentage}%` }}></div>
                    <div className="relative z-10 w-full flex justify-between items-center text-white font-bold tracking-widest">
                        <div className="flex items-center gap-1 md:gap-2">
                            <span className="animate-pulse text-sm md:text-base">⏳</span>
                            <span className="text-lg md:text-xl font-mono">{timeLeft.toString().padStart(2, '0')}</span>
                        </div>
                        <span className="text-[10px] md:text-xs text-gray-400">TIME</span>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 shrink-0 min-w-[70px] md:min-w-[100px]">
                    <div className="h-10 md:h-14 px-3 md:px-6 bg-white/10 rounded-xl md:rounded-2xl border border-white/10 flex flex-col items-center justify-center w-full shadow-lg">
                        <span className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase leading-none mb-0.5 md:mb-1">SCORE</span>
                        <span className="text-lg md:text-2xl font-black text-yellow-400 leading-none">{score}</span>
                    </div>
                    <div className="flex items-baseline gap-1 bg-black/20 px-2 py-0.5 md:px-3 md:py-1 rounded-lg border border-white/5 shadow-sm">
                        <span className="text-[10px] md:text-sm font-bold text-gray-400">ข้อ</span>
                        <span className="text-sm md:text-2xl font-black text-blue-400">{currentQIndex + 1}</span>
                    </div>
                </div>
            </div>

            {/* Question */}
            <div className="w-full py-4 md:py-10 text-center">
                <h2 className="text-xl md:text-3xl font-black text-white leading-relaxed drop-shadow-md animate-fade-in">
                    {currentQuestion.question} 
                </h2>
            </div>

            {/* Choices */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pb-4 md:pb-0">
                {currentQuestion.choices.map((choice, index) => {
                    const letter = ['ก', 'ข', 'ค', 'ง'][index];
                    let btnColorClass = 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-blue-400/50 hover:text-white';
                    if (showFeedback) {
                        if (choice.is_correct === true) btnColorClass = 'bg-green-600/20 border-green-500 text-green-100 shadow-[0_0_20px_rgba(34,197,94,0.3)]';
                        else if (selectedChoiceId === choice.cid) btnColorClass = 'bg-red-600/20 border-red-500 text-red-100 opacity-60';
                        else btnColorClass = 'bg-black/20 border-transparent text-gray-600 opacity-40';
                    }
                    return (
                    <button 
                        key={choice.cid} disabled={showFeedback} onClick={() => handleAnswer(choice)}
                        className={`relative overflow-hidden p-3 md:p-4 rounded-2xl border-2 text-base md:text-lg font-bold transition-all duration-300 transform active:scale-[0.98] group ${btnColorClass}`}
                    >
                        <div className="relative z-10 flex items-center gap-3 md:gap-4">
                            <span className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-lg font-black shadow-inner transition-colors ${showFeedback && choice.is_correct === true ? 'bg-green-500 text-black' : 'bg-black/30 border border-white/10 group-hover:border-blue-400/50 group-hover:text-blue-300'}`}>
                                {letter}
                            </span>
                            <span className="text-left text-sm md:text-base flex-1 leading-snug">{choice.choice_text || "ไม่มีข้อมูล"}</span>
                            {showFeedback && choice.is_correct === true && <span className="text-lg md:text-xl animate-bounce">✅</span>}
                            {showFeedback && selectedChoiceId === choice.cid && choice.is_correct !== true && <span className="text-lg md:text-xl animate-pulse">❌</span>}
                        </div>
                    </button>
                )})}
            </div>
        </div>

        {/* FEEDBACK POPUP (Responsive) */}
        {showFeedback && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"></div>
                <div className={`relative w-full max-w-[320px] md:max-w-sm rounded-[2rem] overflow-hidden shadow-2xl transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-white/10 ${isCorrect ? 'bg-gradient-to-b from-green-900/90 to-slate-900/95 shadow-[0_0_50px_-12px_rgba(34,197,94,0.5)]' : (isTimeOut ? 'bg-gradient-to-b from-orange-900/90 to-slate-900/95 shadow-[0_0_50px_-12px_rgba(249,115,22,0.5)]' : 'bg-gradient-to-b from-red-900/90 to-slate-900/95 shadow-[0_0_50px_-12px_rgba(239,68,68,0.5)]')}`}>
                    <div className={`absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${isCorrect ? 'from-green-500' : 'from-red-500'} to-transparent pointer-events-none animate-spin-slow`}></div>
                    <div className="relative z-10 flex flex-col items-center p-6 md:p-8 pb-6">
                        <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-inner border-[4px] md:border-[6px] backdrop-blur-sm ${isCorrect ? 'bg-green-500/20 border-green-400/30 text-green-400 shadow-green-500/20' : 'bg-red-500/20 border-red-400/30 text-red-400 shadow-red-500/20'}`}>
                            <span className="text-4xl md:text-6xl animate-[bounce_1s_infinite]">{isCorrect ? '🎉' : (isTimeOut ? '⏰' : '💔')}</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest drop-shadow-md mb-2">{isTimeOut ? 'หมดเวลา!' : (isCorrect ? 'ถูกต้อง!' : 'ผิดครับ!')}</h2>
                        <div className="h-6 md:h-8 mb-4">{isCorrect && (<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 animate-pulse"><span className="text-yellow-400 text-base md:text-lg">★</span><span className="text-green-300 font-bold text-sm md:text-base">+{earnedPoints} คะแนน</span></div>)}</div>
                        <div className="w-full bg-black/30 rounded-2xl p-4 md:p-5 border border-white/5 mb-4 md:mb-6 text-left">
                            <div className="flex items-center gap-2 mb-2 opacity-70"><svg className="w-3 h-3 md:w-4 md:h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"></path></svg><span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-blue-300">เฉลย / คำอธิบาย</span></div>
                            <p className="text-gray-300 text-xs md:text-sm font-medium leading-relaxed">{currentQuestion.explanation || "ไม่มีคำอธิบายเพิ่มเติมสำหรับข้อนี้"}</p>
                        </div>
                        <button onClick={nextQuestion} className={`w-full py-3 md:py-4 rounded-xl font-bold text-base md:text-lg text-white shadow-lg tracking-widest uppercase transform transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 ${isCorrect ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/50' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/50'}`}><span>{currentQIndex < questions.length - 1 ? 'ข้อต่อไป' : 'ดูสรุปผล'}</span><svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg></button>
                    </div>
                </div>
            </div>
        )}
    </main>
  );
}

// ✅ Component หลักสำหรับหน้าเว็บ
export default function QuizPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="text-xl font-bold animate-pulse tracking-widest">กำลังโหลดข้อมูล...</div>
        </div>
    }>
      <QuizContent />
    </Suspense>
  );
}