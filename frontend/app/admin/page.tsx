// app/admin/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// ✅ 1. ประกาศ Type ให้ชัดเจน (แก้ปัญหา Unexpected any)
interface Overview {
  totalUsers: number;
  totalGames: number;
  totalVirusGames: number;
}

interface QuestionStats {
  qid: number;
  question: string;
  level: string;
  correctRate: number;
  totalAttempts: number;
}

interface Log {
  al_id: number;
  is_correct: boolean;
  answered_at: string;
  user: { username: string };
  question: { question: string };
  choice: { choice_text: string };
}

interface DashboardData {
  overview: Overview;
  hardestQuestions: QuestionStats[];
  recentLogs: Log[];
}

export default function AdminDashboard() {
  const router = useRouter();
  
  // State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null); // ✅ ระบุ Type ตรงนี้
  const [loading, setLoading] = useState(true);

  // --- 1. Check Admin Role ---
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        alert("⛔️ คุณไม่มีสิทธิ์เข้าถึงหน้านี้!");
        router.push('/'); 
      } else {
        setIsAuthorized(true);
      }
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  // --- 2. Fetch Data ---
  useEffect(() => {
    if (!isAuthorized) return;

    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthorized]);

  // --- Render Conditions ---
  if (!isAuthorized) {
      return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">กำลังตรวจสอบสิทธิ์...</div>;
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Admin Data...</div>;

  if (!data) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-500">Error fetching data</div>;

  // --- Dashboard UI ---
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-cyan-400 border-b border-gray-700 pb-4">
        🛡️ Game Admin Analytics
      </h1>

      {/* 1. Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider">Total Users</h3>
          <p className="text-4xl font-bold text-white mt-2">{data.overview?.totalUsers || 0}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider">Quiz Sessions Played</h3>
          <p className="text-4xl font-bold text-blue-400 mt-2">{data.overview?.totalGames || 0}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider">Virus Missions Played</h3>
          <p className="text-4xl font-bold text-green-400 mt-2">{data.overview?.totalVirusGames || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 2. Hardest Questions */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
            ⚠️ 10 อันดับข้อสอบที่คนตอบผิดเยอะที่สุด
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-700/50 text-gray-300">
                <tr>
                  <th className="p-3 rounded-tl-lg">Question</th>
                  <th className="p-3">Level</th>
                  <th className="p-3">Correct %</th>
                  <th className="p-3 rounded-tr-lg">Attempts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {/* ✅ ไม่ต้องใส่ (q: any) แล้ว เพราะ TS รู้จัก Type จาก Interface ด้านบน */}
                {data.hardestQuestions?.map((q) => (
                  <tr key={q.qid} className="hover:bg-gray-700/30 transition">
                    <td className="p-3 truncate max-w-[200px]" title={q.question}>{q.question}</td>
                    <td className="p-3"><span className="bg-gray-700 px-2 py-1 rounded text-xs">{q.level}</span></td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${q.correctRate < 30 ? 'bg-red-500' : 'bg-yellow-500'}`} 
                            style={{ width: `${q.correctRate}%` }}
                          ></div>
                        </div>
                        <span className={q.correctRate < 30 ? 'text-red-400' : 'text-yellow-400'}>
                          {q.correctRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-400">{q.totalAttempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Live Logs */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
            📝 บันทึกการตอบคำถามล่าสุด (Real-time)
          </h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {data.recentLogs?.map((log) => (
              <div key={log.al_id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 text-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-white">{log.user?.username}</span>
                  <span className="text-xs text-gray-500">{new Date(log.answered_at).toLocaleString('th-TH')}</span>
                </div>
                <p className="text-gray-400 mb-2">Q: {log.question?.question}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${log.is_correct ? 'bg-green-900/50 text-green-400 border border-green-500/30' : 'bg-red-900/50 text-red-400 border border-red-500/30'}`}>
                    Ans: {log.choice?.choice_text}
                  </span>
                  {log.is_correct ? '✅ ถูกต้อง' : '❌ ผิด'}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}