'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { playSound } from '@/app/lib/sound';
import Image from 'next/image';

const EMOJI_OPTIONS = ['🧠', '🎮', '🔥', '⚡', '🐱', '🤖', '👻', '💎', '🦊', '👾'];

export default function ProfilePage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [userEmoji, setUserEmoji] = useState('🧠');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [stats, setStats] = useState({ normal: 0, virus: 0, chat: 0 });

    useEffect(() => {
        const timer = setTimeout(() => {
            const storedUser = localStorage.getItem('user');
            const savedStatsStr = localStorage.getItem('cyberStakes_played');

            if (storedUser) {
                const userData = JSON.parse(storedUser);
                setUsername(userData.username);
                setUserEmoji(userData.emoji || '🧠');
            } else {
                router.push('/login');
            }

            if (savedStatsStr) {
                setStats(JSON.parse(savedStatsStr));
            }
            setIsLoaded(true);
        }, 0);
        return () => clearTimeout(timer);
    }, [router]);

    const handleSave = () => {
        playSound('click');
        const storedUser = localStorage.getItem('user');
        const currentData = storedUser ? JSON.parse(storedUser) : {};
        
        const updatedUser = { ...currentData, username: username, emoji: userEmoji };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setIsEditing(false);
    };

    const handleLogout = () => {
        playSound('click');
        if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
            localStorage.removeItem('user');
            router.push('/login');
        }
    };

    if (!isLoaded) return <div className="min-h-screen bg-slate-950" />;

    return (
        <main className="relative w-screen h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-slate-900 font-sans">
            
            {/* ✨ พื้นหลัง Animation (เหมือนหน้าแรก) */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950"> 
                <div className="absolute inset-0 z-0 w-[200%] h-full animate-scroll-bg opacity-40">
                    <div className="w-1/2 h-full bg-cover bg-center grayscale-[50%]" style={{ backgroundImage: "url('/images/bg1.png')" }}></div>
                    <div className="w-1/2 h-full bg-cover bg-center grayscale-[50%]" style={{ backgroundImage: "url('/images/bg1.png')" }}></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90 z-10"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse-slow z-20"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse-slow delay-1000 z-20"></div>
            </div>

            {/* 📦 Profile Card */}
            <div className="relative z-30 w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-fade-in overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>
                
                <div className="flex flex-col items-center gap-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em]">User Profile</h1>
                        <div className="w-12 h-1 bg-purple-500 mx-auto mt-2 rounded-full"></div>
                    </div>

                    {/* Avatar Display */}
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 p-1 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-5xl">
                                {userEmoji}
                            </div>
                        </div>
                    </div>

                    <div className="w-full space-y-4">
                        {/* Display Name Input */}
                        <div className="relative group">
                            <label className="text-[10px] text-purple-400 font-bold uppercase ml-4 mb-1 block tracking-widest">Username</label>
                            <input 
                                type="text"
                                disabled={!isEditing}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold transition-all ${
                                    isEditing 
                                    ? 'bg-white/10 border-purple-500 text-white ring-4 ring-purple-500/10' 
                                    : 'bg-black/40 border-white/5 text-gray-400 cursor-not-allowed'
                                }`}
                            />
                        </div>

                        {/* Switchable Section: Emoji Selector OR Stats */}
                        {isEditing ? (
                            <div className="animate-fade-in">
                                <label className="text-[10px] text-purple-400 font-bold uppercase block mb-3 text-center tracking-widest">Select Avatar</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {EMOJI_OPTIONS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => { playSound('click'); setUserEmoji(emoji); }}
                                            className={`text-xl p-2 rounded-xl transition-all ${
                                                userEmoji === emoji ? 'bg-purple-600 scale-110 shadow-lg' : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2 py-2">
                                <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                                    <div className="text-[10px] text-gray-400">Normal</div>
                                    <div className="text-white font-black">{stats.normal}</div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                                    <div className="text-[10px] text-gray-400">Virus</div>
                                    <div className="text-white font-black">{stats.virus}</div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                                    <div className="text-[10px] text-gray-400">Chat</div>
                                    <div className="text-white font-black">{stats.chat}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full flex flex-col gap-3 mt-2">
                        {isEditing ? (
                            <button onClick={handleSave} className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-green-900/40 transition-all active:scale-95">
                                SAVE CHANGES
                            </button>
                        ) : (
                            <>
                                <button onClick={() => { playSound('click'); setIsEditing(true); }} className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black border border-white/10 transition-all active:scale-95">
                                    EDIT PROFILE
                                </button>
                                <button onClick={handleLogout} className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2">
                                    🚪 LOGOUT
                                </button>
                            </>
                        )}
                        <button onClick={() => { playSound('click'); router.push('/'); }} className="w-full py-2 text-xs text-gray-500 hover:text-white font-bold transition-colors uppercase tracking-widest text-center">
                            ← Back to Menu
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}