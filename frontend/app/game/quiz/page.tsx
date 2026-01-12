'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { playSound } from '@/app/lib/sound';
import Link from 'next/link';

// --- Interface ---
interface Choice {
  cid: number;
  name: string;
  is_correct: number;
  qid: number;
}

interface Question {
  qid: number;
  name: string;
  explanation: string;
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
    correctCount?: number;
}

// --- Config ---
const GAME_CONFIG: Record<string, { time: number; score: number; color: string }> = {
  easy: { time: 20, score: 20, color: 'text-green-400' },
  medium: { time: 15, score: 30, color: 'text-yellow-400' },
  hard: { time: 10, score: 40, color: 'text-red-400' },
};

const MOCK_BOTS = [
    { username: 'CyberNinja', score: 350 },
    { username: 'GlitchH.', score: 280 },
    { username: 'NeonSamu', score: 220 },
    { username: 'BitBot', score: 150 },
];

const RANK_SYSTEM = [
    { percent: 100, icon: "👑", title: "เทพเจ้าไอที", desc: "สุดยอด! มิจฉาชีพกราบ", color: "text-purple-400", border: "border-purple-500", bg: "from-purple-500/20" },
    { percent: 80,  icon: "🛡️", title: "ผู้พิทักษ์", desc: "สกิลตึงเปรี้ยะ!", color: "text-blue-400", border: "border-blue-500", bg: "from-blue-500/20" },
    { percent: 60,  icon: "🔫", title: "มือปราบ", desc: "เริ่มเก๋าเกมแล้วนะ", color: "text-green-400", border: "border-green-500", bg: "from-green-500/20" },
    { percent: 40,  icon: "🐢", title: "เน็ตเต่า", desc: "มีความรู้บ้าง... ระวังหน่อย", color: "text-yellow-400", border: "border-yellow-500", bg: "from-yellow-500/20" },
    { percent: 20,  icon: "🎣", title: "มือไว", desc: "ใจเย็นๆ นะวัยรุ่น", color: "text-orange-400", border: "border-orange-500", bg: "from-orange-500/20" },
    { percent: 0,   icon: "🍼", title: "เบบี้", desc: "กลับไปดื่มนมก่อนลูก", color: "text-gray-400", border: "border-gray-500", bg: "from-gray-500/20" },
];

export default function QuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const diff = searchParams.get('diff') || 'easy';
  const config = GAME_CONFIG[diff.toLowerCase()] || GAME_CONFIG['easy'];

  // --- State ---
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'finished'>('loading');
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  // Stats
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Timer
  const [timeLeft, setTimeLeft] = useState(config.time);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [isBonus, setIsBonus] = useState(false);
  const [isTimeOut, setIsTimeOut] = useState(false);

  // --- 1. Init Data ---
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { router.push('/login'); return; }
    
    setTimeout(() => {
        setCurrentUser(JSON.parse(userStr));
    }, 0);

    const fetchQuestions = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/questions?level=${diff}`);
        const data: ApiResponse = await res.json();

        if (data.success && data.questions.length > 0) {
            setQuestions(data.questions);
            setGameState('playing');
            setTimeout(() => setIsTimerRunning(true), 0);
            playSound('click'); 
        } else {
            alert('ไม่พบคำถามในหมวดนี้');
            router.push('/');
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
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

  // --- 2. Timer Logic ---
  useEffect(() => {
    if (!isTimerRunning) return;

    if (timeLeft <= 0) {
        const timeoutId = setTimeout(() => {
            handleTimeOut();
        }, 0);
        return () => clearTimeout(timeoutId);
    }

    const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isTimerRunning, handleTimeOut]);

  // --- 3. Game Logic Functions ---
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
    
    const correct = choice.is_correct === 1;
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
      const myEntry: LeaderboardEntry = { username: currentUser.username, score: score, isMe: true };
      return [...botEntries, myEntry].sort((a, b) => b.score - a.score);
  }, [gameState, score, currentUser]);


  // --- RENDER: Loading ---
  if (gameState === 'loading') return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="text-xl font-bold animate-pulse tracking-widest">กำลังโหลดข้อมูล...</div>
    </div>
  );

  // --- RENDER: Finished (หน้าสรุปผล - แบบ Wide Dashboard) ---
  if (gameState === 'finished') {
      const totalPossibleScore = questions.length * (config.score + 10);
      const scorePercentage = totalPossibleScore > 0 ? (score / totalPossibleScore) * 100 : 0;
      const myRank = RANK_SYSTEM.find(r => scorePercentage >= r.percent) || RANK_SYSTEM[RANK_SYSTEM.length - 1];
      const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

      return (
        <main className="relative min-h-screen w-screen overflow-hidden bg-slate-900 font-sans flex flex-col items-center justify-center p-4">
            <div className="absolute inset-0 z-0 pointer-events-none"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-slate-900 to-black"></div><div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse-slow"></div><div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"></div></div>

            {/* ✅ WIDE MAIN CONTAINER (max-w-5xl) */}
            <div className="relative z-10 w-full max-w-5xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 text-center shadow-[0_0_80px_rgba(0,0,0,0.5)] animate-fade-in flex flex-col gap-8">
                
                {/* Header */}
                <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 uppercase tracking-widest drop-shadow-lg">
                    ภารกิจเสร็จสิ้น!
                </h1>
                
                {/* Content Grid (2 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* LEFT: Rank Card */}
                    <div className={`bg-gradient-to-br ${myRank.bg} to-black/40 rounded-3xl p-8 border-2 ${myRank.border} relative overflow-hidden shadow-lg flex flex-col justify-center items-center`}>
                        <div className="text-gray-300 text-sm font-bold uppercase tracking-widest mb-2">คะแนนรวมของคุณ</div>
                        <div className="text-6xl md:text-7xl font-black text-white mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-[pulse_3s_infinite]">
                            {score}
                        </div>
                        <div className="w-full h-px bg-white/10 my-4"></div>
                        <div className="text-6xl mb-2 animate-bounce drop-shadow-md">{myRank.icon}</div>
                        <div className={`text-2xl font-black ${myRank.color} uppercase tracking-widest`}>{myRank.title}</div>
                        <p className="text-gray-300 text-sm italic mt-1 opacity-80">{myRank.desc}</p>
                    </div>

                    {/* RIGHT: Stats & Leaderboard */}
                    <div className="flex flex-col gap-4">
                        
                        {/* 4 Stats Box */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-xs text-gray-400 uppercase font-bold">ตอบถูก</span>
                                <span className="text-2xl font-black text-green-400">{correctCount} <span className="text-sm text-gray-500">/ {questions.length}</span></span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-xs text-gray-400 uppercase font-bold">ความแม่นยำ</span>
                                <span className="text-2xl font-black text-blue-400">{accuracy}%</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-xs text-gray-400 uppercase font-bold">ความยาก</span>
                                <span className={`text-2xl font-black ${config.color} uppercase`}>{diff}</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                <span className="text-xs text-gray-400 uppercase font-bold">เวลาเฉลี่ย</span>
                                <span className="text-2xl font-black text-gray-200">~2.5<span className="text-sm">s</span></span>
                            </div>
                        </div>

                        {/* Leaderboard (Compact) */}
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex-1 flex flex-col">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-center gap-2">
                                🏆 อันดับผู้เล่น
                            </h3>
                            <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                                {leaderboard.map((entry, index) => (
                                    <div key={index} className={`flex justify-between items-center p-2 rounded-lg border transition-all ${entry.isMe ? 'bg-blue-600/40 border-blue-400 shadow-lg scale-[1.01]' : 'bg-white/5 border-white/5 opacity-70'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${index === 0 ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-300'}`}>{index + 1}</div>
                                            <span className={`font-bold text-xs ${entry.isMe ? 'text-white' : 'text-gray-400'}`}>{entry.username} {entry.isMe && '(คุณ)'}</span>
                                        </div>
                                        <span className={`font-bold text-sm ${entry.isMe ? 'text-yellow-300' : 'text-white'}`}>{entry.score}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-row gap-4 justify-center mt-2">
                     <button onClick={() => window.location.reload()} className="px-8 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/20 transition-all flex-1 shadow-lg active:scale-95">
                        🔄 เล่นอีกครั้ง
                    </button>
                    <Link href="/" className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-purple-500/30 transition-all flex-1 flex justify-center items-center shadow-lg active:scale-95">
                        🏠 หน้าหลัก
                    </Link>
                </div>
            </div>
        </main>
      );
  }

  // --- RENDER: Playing ---
  const currentQuestion = questions[currentQIndex];
  const timePercentage = (timeLeft / config.time) * 100;
  let timerColor = 'bg-green-500 shadow-[0_0_10px_#22c55e]';
  if (timeLeft <= config.time * 0.5) timerColor = 'bg-yellow-500 shadow-[0_0_10px_#eab308]';
  if (timeLeft <= config.time * 0.2) timerColor = 'bg-red-600 shadow-[0_0_15px_#dc2626] animate-pulse';

  return (
    <main className="relative min-h-screen w-screen overflow-hidden bg-slate-900 font-sans flex flex-col items-center justify-center p-4">
        {/* Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-slate-900 to-black"></div><div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse-slow"></div><div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"></div></div>

        {/* ✅ MAIN FRAME */}
        <div className="relative z-10 w-full max-w-4xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-[0_0_60px_rgba(0,0,0,0.4)] flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex items-center gap-4 w-full">
                <button 
                    onClick={() => router.push('/')}
                    className="h-12 w-12 md:w-auto md:px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 flex items-center justify-center gap-2 group active:scale-95 shrink-0"
                    title="กลับหน้าหลัก"
                >
                    <span className="text-xl text-gray-400 group-hover:text-red-400 transition-colors">✕</span>
                    <span className="hidden md:inline-block text-xs font-bold text-gray-400 group-hover:text-white uppercase tracking-widest">ออก</span>
                </button>

                <div className="flex-1 h-12 bg-black/40 rounded-xl overflow-hidden border border-white/10 relative shadow-inner flex items-center px-4">
                    <div className={`absolute left-0 top-0 h-full transition-all duration-1000 ease-linear opacity-50 ${timerColor}`} style={{ width: `${timePercentage}%` }}></div>
                    <div className="relative z-10 w-full flex justify-between items-center text-white font-bold tracking-widest">
                        <span className="text-xs text-gray-400 hidden sm:inline">TIME</span>
                        <div className="flex items-center gap-2">
                            <span className="animate-pulse">⏳</span>
                            <span className="text-xl font-mono">{timeLeft.toString().padStart(2, '0')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2 shrink-0 min-w-[100px]">
                    <div className="h-14 px-6 bg-white/10 rounded-2xl border border-white/10 flex flex-col items-center justify-center w-full shadow-lg">
                        <span className="text-[10px] text-gray-400 font-black uppercase leading-none mb-1">SCORE</span>
                        <span className="text-2xl font-black text-yellow-400 leading-none">{score}</span>
                    </div>
                    
                    {/* Question Count */}
                    <div className="flex items-baseline gap-1 bg-black/20 px-3 py-1 rounded-lg border border-white/5 shadow-sm">
                        <span className="text-sm font-bold text-gray-400">ข้อที่</span>
                        <span className="text-2xl font-black text-blue-400 drop-shadow-md">{currentQIndex + 1}</span>
                        <span className="text-sm font-bold text-gray-600">/ {questions.length}</span>
                    </div>
                </div>
            </div>

            {/* Question Text */}
            <div className="w-full py-6 md:py-10 text-center relative">
                <h2 className="text-2xl md:text-3xl font-black text-white leading-relaxed drop-shadow-md animate-fade-in">
                    {currentQuestion.name}
                </h2>
            </div>

            {/* Choices Grid */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.choices.map((choice, index) => {
                    const letter = ['ก', 'ข', 'ค', 'ง'][index];
                    let btnColorClass = 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-blue-400/50 hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]';
                    if (showFeedback) {
                        if (choice.is_correct === 1) btnColorClass = 'bg-green-600/20 border-green-500 text-green-100 shadow-[0_0_20px_rgba(34,197,94,0.3)]';
                        else if (selectedChoiceId === choice.cid) btnColorClass = 'bg-red-600/20 border-red-500 text-red-100 opacity-60';
                        else btnColorClass = 'bg-black/20 border-transparent text-gray-600 opacity-40';
                    }

                    return (
                    <button 
                        key={choice.cid}
                        disabled={showFeedback}
                        onClick={() => handleAnswer(choice)}
                        className={`relative overflow-hidden p-4 rounded-2xl border-2 text-lg font-bold transition-all duration-300 transform active:scale-[0.98] group ${btnColorClass}`}
                    >
                        <div className="relative z-10 flex items-center gap-4">
                            <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shadow-inner transition-colors ${showFeedback && choice.is_correct === 1 ? 'bg-green-500 text-black' : 'bg-black/30 border border-white/10 group-hover:border-blue-400/50 group-hover:text-blue-300'}`}>
                                {letter}
                            </span>
                            <span className="text-left text-base flex-1">{choice.name}</span>
                            {showFeedback && choice.is_correct === 1 && <span className="text-xl animate-bounce">✅</span>}
                            {showFeedback && selectedChoiceId === choice.cid && choice.is_correct !== 1 && <span className="text-xl animate-pulse">❌</span>}
                        </div>
                    </button>
                )})}
            </div>
        </div>

        {/* ================= Feedback Popup ================= */}
        {showFeedback && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
                <div className={`
                    w-full max-w-md p-6 rounded-[2.5rem] shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200 text-center relative overflow-hidden border-4
                    ${isCorrect ? 'bg-slate-900 border-green-500 shadow-green-500/30' : (isTimeOut ? 'bg-slate-900 border-orange-500 shadow-orange-500/30' : 'bg-slate-900 border-red-500 shadow-red-500/30')}
                `}>
                    
                    <div className={`absolute top-0 left-0 w-full h-32 opacity-20 bg-gradient-to-b ${isCorrect ? 'from-green-500' : (isTimeOut ? 'from-orange-500' : 'from-red-500')} to-transparent pointer-events-none`}></div>

                    <div className="relative z-10 pt-4 flex flex-col items-center gap-4">
                        
                        <div className={`
                            w-24 h-24 rounded-full flex items-center justify-center text-6xl shadow-lg border-4
                            ${isCorrect ? 'bg-green-500 border-green-300 text-white' : (isTimeOut ? 'bg-orange-500 border-orange-300 text-white' : 'bg-red-500 border-red-300 text-white')}
                        `}>
                            {isCorrect ? '✓' : (isTimeOut ? '!' : '✕')}
                        </div>

                        <div className="flex flex-col items-center">
                            <h3 className={`text-3xl font-black uppercase mb-2 ${isCorrect ? 'text-green-400' : (isTimeOut ? 'text-orange-400' : 'text-red-400')}`}>
                                {isTimeOut ? 'หมดเวลา!' : (isCorrect ? 'ถูกต้องครับ!' : 'ตอบผิดครับ!')}
                            </h3>
                            
                            {isCorrect && (
                                <div className="bg-white/10 px-6 py-2 rounded-full border border-white/20 flex items-center gap-2 animate-bounce">
                                    <span className="text-yellow-400 font-black text-2xl">+{earnedPoints}</span>
                                    <span className="text-xs text-white uppercase font-bold tracking-widest">คะแนน</span>
                                </div>
                            )}
                        </div>

                        <div className="w-full bg-black/40 p-5 rounded-2xl border-l-4 border-white/20 text-left mt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">💡</span>
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">คำอธิบาย</span>
                            </div>
                            <p className="text-gray-200 text-sm leading-relaxed font-medium">
                                {currentQuestion.explanation || "ไม่มีคำอธิบายเพิ่มเติม"}
                            </p>
                        </div>

                        <button 
                            onClick={nextQuestion}
                            className={`
                                w-full py-4 rounded-xl font-bold text-white text-lg uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-lg mt-2
                                ${isCorrect ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/40' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/40'}
                            `}
                        >
                            {currentQIndex < questions.length - 1 ? 'ข้อต่อไป ➜' : 'ดูผลลัพธ์ 🏆'}
                        </button>

                    </div>
                </div>
            </div>
        )}
    </main>
  );
}