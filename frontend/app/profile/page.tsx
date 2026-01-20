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
    const [isLoaded, setIsLoaded] = useState(false);
    const [stats, setStats] = useState({ normal: 0, virus: 0, chat: 0 });

    // State สำหรับการแยกโหมดแก้ไข
    const [editMode, setEditMode] = useState<'none' | 'info' | 'password'>('none');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

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
            if (savedStatsStr) setStats(JSON.parse(savedStatsStr));
            setIsLoaded(true);
        }, 0);
        return () => clearTimeout(timer);
    }, [router]);

    const handleSaveInfo = () => {
        playSound('click');
        const storedUser = localStorage.getItem('user');
        const currentData = storedUser ? JSON.parse(storedUser) : {};
        const updatedUser = { ...currentData, username: username, emoji: userEmoji };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setEditMode('none');
        alert('อัปเดตข้อมูลส่วนตัวสำเร็จ!');
    };

    const handleSavePassword = () => {
        playSound('click');
        if (newPassword !== confirmPassword) {
            alert('รหัสผ่านไม่ตรงกัน!');
            return;
        }
        if (newPassword.length < 4) {
            alert('รหัสผ่านสั้นเกินไป!');
            return;
        }
        const storedUser = localStorage.getItem('user');
        const currentData = storedUser ? JSON.parse(storedUser) : {};
        localStorage.setItem('user', JSON.stringify({ ...currentData, password: newPassword }));
        setNewPassword('');
        setConfirmPassword('');
        setEditMode('none');
        alert('เปลี่ยนรหัสผ่านสำเร็จ!');
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
        <main className="relative w-screen h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-slate-900 font-sans text-white">
            {/* Background Animation (เหมือนเดิม) */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
                <div className="absolute inset-0 z-0 w-[200%] h-full animate-scroll-bg opacity-40">
                    <div className="w-1/2 h-full bg-cover bg-center" style={{ backgroundImage: "url('/images/bg1.png')" }}></div>
                    <div className="w-1/2 h-full bg-cover bg-center" style={{ backgroundImage: "url('/images/bg1.png')" }}></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/70 to-slate-950/90 z-10"></div>
            </div>

            <div className="relative z-30 w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-fade-in overflow-y-auto max-h-[90vh] custom-scrollbar">
                <div className="flex flex-col items-center gap-6">
                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-2xl font-black uppercase tracking-[0.2em]">Profile Center</h1>
                        <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mt-2 rounded-full"></div>
                    </div>

                    {/* Avatar Display */}
                    <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 p-1 shadow-lg">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-5xl">
                            {userEmoji}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="w-full space-y-4">
                        {editMode === 'none' && (
                            <div className="text-center animate-fade-in">
                                <h2 className="text-3xl font-bold">{username}</h2>
                                <p className="text-gray-400 text-sm mt-1">ยินดีต้อนรับกลับสู่ระบบ</p>
                                
                                <div className="grid grid-cols-3 gap-3 mt-6">
                                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <div className="text-[10px] text-purple-400 uppercase">Quiz</div>
                                        <div className="font-black text-xl">{stats.normal}</div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <div className="text-[10px] text-blue-400 uppercase">Virus</div>
                                        <div className="font-black text-xl">{stats.virus}</div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <div className="text-[10px] text-green-400 uppercase">Chat</div>
                                        <div className="font-black text-xl">{stats.chat}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Edit Info Mode */}
                        {editMode === 'info' && (
                            <div className="space-y-4 animate-slide-up">
                                <label className="text-xs font-bold text-purple-400 uppercase tracking-widest ml-2">Edit Display Name</label>
                                <input 
                                    type="text" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-white/10 border border-purple-500/50 p-4 rounded-2xl outline-none focus:ring-2 ring-purple-500/20"
                                />
                                <div className="grid grid-cols-5 gap-2 mt-2">
                                    {EMOJI_OPTIONS.map(e => (
                                        <button key={e} onClick={() => setUserEmoji(e)} className={`text-xl p-2 rounded-xl ${userEmoji === e ? 'bg-purple-600' : 'bg-white/5'}`}>{e}</button>
                                    ))}
                                </div>
                                <button onClick={handleSaveInfo} className="w-full py-4 bg-purple-600 rounded-2xl font-bold shadow-lg shadow-purple-900/40">บันทึกข้อมูลส่วนตัว</button>
                            </div>
                        )}

                        {/* Edit Password Mode */}
                        {editMode === 'password' && (
                            <div className="space-y-4 animate-slide-up">
                                <label className="text-xs font-bold text-red-400 uppercase tracking-widest ml-2">Secure Change Password</label>
                                <input 
                                    type="password" 
                                    placeholder="New Password" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-white/10 border border-red-500/50 p-4 rounded-2xl outline-none"
                                />
                                <input 
                                    type="password" 
                                    placeholder="Confirm Password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-white/10 border border-red-500/50 p-4 rounded-2xl outline-none"
                                />
                                <button onClick={handleSavePassword} className="w-full py-4 bg-red-600 rounded-2xl font-bold shadow-lg shadow-red-900/40">อัปเดตรหัสผ่านใหม่</button>
                            </div>
                        )}
                    </div>

                    {/* Main Menu Buttons */}
                    <div className="w-full flex flex-col gap-3 border-t border-white/10 pt-6">
                        {editMode === 'none' ? (
                            <>
                                <button onClick={() => setEditMode('info')} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
                                    👤 แก้ไขข้อมูลส่วนบุคคล
                                </button>
                                <button onClick={() => setEditMode('password')} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
                                    🔒 เปลี่ยนรหัสผ่านความปลอดภัย
                                </button>
                                <button onClick={handleLogout} className="w-full py-4 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl font-bold transition-all">
                                    🚪 ออกจากระบบ
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setEditMode('none')} className="w-full py-3 text-gray-400 font-bold hover:text-white transition-colors">
                                ← ยกเลิกการแก้ไข
                            </button>
                        )}
                        <button onClick={() => router.push('/')} className="w-full py-2 text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] hover:text-white transition-all text-center">
                            Back to Game Menu
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}