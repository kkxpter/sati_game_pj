// routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';

export default function (prisma) {
    const router = express.Router();

    // ✅ API สมัครสมาชิก
    router.post('/register', async (req, res) => {
        const { username, password, email, phone, birthdate, address } = req.body;

        try {
            // 1. เช็คข้อมูลซ้ำ
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: username },
                        { email: email },
                        { phone: phone }
                    ]
                }
            });

            if (existingUser) {
                if (existingUser.username === username) return res.status(400).json({ error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว!" });
                if (existingUser.email === email) return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานแล้ว!" });
                if (existingUser.phone === phone) return res.status(400).json({ error: "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว!" });
            }

            // 2. เข้ารหัสรหัสผ่าน
            const hashedPassword = await bcrypt.hash(password, 10);

            // 3. บันทึก (แปลง birthdate เป็น Date object ให้ถูกต้อง)
            const newUser = await prisma.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    email,
                    phone,
                    birthdate: new Date(birthdate), 
                    address
                }
            });

            // ✅ แก้ตรงนี้: ใน Schema คุณใช้ชื่อ "id" ไม่ใช่ "uid"
            res.json({ message: "สมัครสมาชิกเรียบร้อย!", userId: newUser.id });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "สมัครสมาชิกไม่สำเร็จ" });
        }
    });

    // ✅ API เข้าสู่ระบบ
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;

        try {
            const user = await prisma.user.findUnique({
                where: { username: username }
            });

            if (!user) {
                return res.status(401).json({ error: "ไม่พบชื่อผู้ใช้นี้" });
            }

            const match = await bcrypt.compare(password, user.password);
            if (match) {
                res.json({
                    success: true,
                    user: {
                        id: user.id, // ✅ ใช้ id
                        username: user.username,
                        email: user.email,
                        phone: user.phone
                    }
                });
            } else {
                res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
            }

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};