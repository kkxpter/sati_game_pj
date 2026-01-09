// server.js
import express from 'express';
import cors from 'cors';
import { createPool } from 'mysql2';
import bcrypt from 'bcrypt'; // ต้อง import ถ้ามีการใช้ใน server แต่ปกติใช้ใน route

// Import Route ที่เราจะแก้
import authRoute from './routes/auth.js';
import questionRoute from './routes/questions.js'; // สมมติว่ามีไฟล์นี้ด้วย

const app = express();
const port = 4000; // ใช้ Port 4000 ตามที่คุณเคยตั้ง

app.use(cors());
app.use(express.json());

// 1. สร้าง Pool ที่นี่ (ใช้ค่า Config เดิมของคุณ)
const pool = createPool({
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  PORT:"4000",
  user: '3J3R4CVkCymAtX5.root',
  password: 'XIEOhSrELG3xvkRA',
  database: 'sati_game',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log('✅ Connected to database (via pool)');

// 2. เรียกใช้ Route โดยส่ง pool เข้าไป
// สังเกตว่า authRoute มันจะเป็นฟังก์ชันรับค่า pool
app.use('/', authRoute(pool)); 
app.use('/questions', questionRoute(pool));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});