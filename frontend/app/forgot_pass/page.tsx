'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', phone: '', newPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // ✅ เช็ค URL ให้ชัวร์ (ถ้า Backend มี /api ต้องใส่ด้วย)
     const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    //const apiUrl = 'http://localhost:4000';
    try {
      const res = await fetch(`${apiUrl}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      // ✅ อ่านเป็น Text ก่อน เพื่อกัน Error JSON
      const text = await res.text();
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Server Response (Non-JSON):", text);
        throw new Error(`Server Error (${res.status}): API ไม่ถูกต้อง หรือ URL ผิด`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      }

      setSuccess('✅ เปลี่ยนรหัสผ่านเรียบร้อย! กำลังไปหน้า Login...');
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: unknown) { 
      console.error("Reset Password Error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative w-screen h-screen flex items-center justify-center p-4 bg-slate-900 font-sans overflow-hidden">
      
      {/* Background Theme */}
      <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900 via-slate-900 to-black"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-fade-in">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🔑</div>
          <h1 className="text-2xl font-black text-white uppercase tracking-widest">ลืมรหัสผ่าน?</h1>
          <p className="text-gray-400 text-xs mt-2">กรอกข้อมูลเพื่อตั้งรหัสผ่านใหม่</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 ml-1">ชื่อผู้ใช้ (Username)</label>
            <input 
              type="text" 
              className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-red-500 focus:outline-none transition-all mt-1"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 ml-1">เบอร์โทรศัพท์ (ยืนยันตัวตน)</label>
            <input 
              type="tel" 
              className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-red-500 focus:outline-none transition-all mt-1"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 ml-1">รหัสผ่านใหม่ (New Password)</label>
            <input 
              type="password" 
              className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-red-500 focus:outline-none transition-all mt-1"
              value={formData.newPassword}
              onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
              required
            />
          </div>

          {error && <div className="p-3 bg-red-500/20 text-red-200 text-xs rounded-lg text-center animate-pulse">{error}</div>}
          {success && <div className="p-3 bg-green-500/20 text-green-200 text-xs rounded-lg text-center animate-bounce">{success}</div>}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold uppercase tracking-widest hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {isLoading ? 'กำลังตรวจสอบ...' : 'ตั้งรหัสผ่านใหม่'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-gray-400 text-sm hover:text-white transition-colors">
            ← กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </main>
  );
}