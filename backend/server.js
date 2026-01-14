// server.js
import express from 'express';
import cors from 'cors';

// ✅ แก้การ Import Prisma แบบ ES Module
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// นำเข้า Routes
import authRoute from './routes/auth.js';
import questionRoute from './routes/questions.js';

const app = express();
app.use(cors());
const prisma = new PrismaClient(); // ✅ สร้างตัวเชื่อมต่อ
const port = 4000;

// ----------------------------------------------------
// ✅ จุดที่ต้องแก้: ตั้งค่า CORS ให้ยอมรับ Frontend ของคุณ
// ----------------------------------------------------
app.use(cors({
  origin: [
    "http://localhost:3000",                    // 1. อนุญาตให้ตัวเองตอนรันในเครื่อง
    "https://sati-game-pj.vercel.app",          // 2. อนุญาต Frontend บน Vercel (ตาม Error ที่แจ้งมา)
    "https://sati-game-pj-frontend.vercel.app"  // 3. เผื่อไว้กรณี Vercel มี Link อื่น
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],    // อนุญาต Method พื้นฐาน
  credentials: true                             // อนุญาตให้ส่ง Header/Cookie
}));

app.use(express.json());

console.log('✅ Server is ready with Prisma...');

// 3. เรียกใช้ Route และส่ง prisma เข้าไป
app.use('/', authRoute(prisma));       
app.use('/questions', questionRoute(prisma)); 

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}

export default app;