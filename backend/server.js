// server.js
import express from 'express';
import cors from 'cors';

// ✅ แก้การ Import Prisma แบบ ES Module (ตามที่แก้ไปเมื่อกี้)
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// นำเข้า Routes
import authRoute from './routes/auth.js';
import questionRoute from './routes/questions.js';

const app = express();
const prisma = new PrismaClient(); // ✅ สร้างตัวเชื่อมต่อ
const port = 4000;

app.use(cors());
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