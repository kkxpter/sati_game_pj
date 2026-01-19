import express from 'express';
import cors from 'cors'; // ✅ 1. ต้องมีตัวนี้
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// นำเข้า Routes
import authRoute from './routes/auth.js';
import questionRoute from './routes/questions.js';
import scoreRoute from './routes/score.js';
const app = express();
const prisma = new PrismaClient();
const port = 4000;

// ------------------------------------------------------------------
// ✅ แก้ไขจุดที่ 1: ใช้ CORS แบบเปิดหมด (Allow All) เพื่อตัดปัญหา
// และต้องวางไว้บรรทัดแรกๆ ทันทีหลังสร้าง app
// ------------------------------------------------------------------
app.use(cors({
  origin: "*", // อนุญาตทุกเว็บ (แก้ขัดไปก่อน รับรองผ่านชัวร์)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json()); // ต้องอยู่หลัง cors

console.log('✅ Server is ready with Prisma...');

// ------------------------------------------------------------------
// ✅ แก้ไขจุดที่ 2: ส่ง prisma เข้าไปใน Route
// ------------------------------------------------------------------
app.use('/', authRoute(prisma));       
app.use('/questions', questionRoute(prisma)); 
app.use('/scores', scoreRoute(prisma));
// สำหรับ Local Development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}

// สำหรับ Vercel (ต้อง export default app)
export default app;