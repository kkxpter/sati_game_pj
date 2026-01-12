// server.js
import express from 'express';
import cors from 'cors';
import { createPool } from 'mysql2';
// import bcrypt from 'bcrypt'; // ไม่ได้ใช้ในไฟล์นี้ ลบออกได้ครับจะได้ไม่หนัก

import authRoute from './routes/auth.js';
import questionRoute from './routes/questions.js';

const app = express();
const port = 4000; // ✅ Server รันที่ Port 4000

app.use(cors());
app.use(express.json());

// 1. สร้าง Pool เชื่อมต่อ Database
const pool = createPool({
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: 4000,                       // 🔴 แก้เป็น port (ตัวเล็ก) และใส่เป็นตัวเลข 4000
  user: '2yDQVMebVCe2FT7.root',
  password: '28sLilMqjv5V76JS',     // (รหัสผ่านนี้ถ้าเปลี่ยนใหม่แล้ว อย่าลืมแก้ให้ตรงนะครับ)
  database: 'SATI_game_pj',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
});

console.log('✅ Connecting to TiDB Cloud...');

// 2. เรียกใช้ Route
app.use('/', authRoute(pool));          // เส้นทางสำหรับ Login/Register
app.use('/questions', questionRoute(pool)); // เส้นทางสำหรับดึงคำถาม

// เงื่อนไขสำหรับรัน Local vs Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}

export default app;