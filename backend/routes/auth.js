// routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';

export default function (pool) {
    const router = express.Router();

    // ✅ API สมัครสมาชิก
    router.post('/register', async (req, res) => {
        // ❌ ลบ thai_id ออกจากตัวแปรที่รับมา
        const { username, password, email, phone, birthdate, address } = req.body;

        // 1. เช็คว่ามี Username หรือ Email หรือ Phone ซ้ำไหม
        const checkSql = "SELECT username, email, phone FROM user WHERE username = ? OR email = ? OR phone = ?";
        
        pool.query(checkSql, [username, email, phone], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            // 2. ตรวจสอบผลลัพธ์
            if (results.length > 0) {
                const existingUser = results[0];

                if (existingUser.username === username) {
                    return res.status(400).json({ error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว!" });
                }
                if (existingUser.email === email) {
                    return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานแล้ว!" });
                }
                if (existingUser.phone === phone) {
                    return res.status(400).json({ error: "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว!" });
                }
            }

            // ถ้าไม่ซ้ำเลย ก็ไปต่อ
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                
                // ❌ ลบ thai_id ออกจากคำสั่ง SQL
                const insertSql = "INSERT INTO user (username, password, email, phone, birthdate, address) VALUES (?, ?, ?, ?, ?, ?)";
                
                // ❌ ลบ thai_id ออกจาก array ตัวแปร (เหลือแค่ 6 ตัว)
                pool.query(insertSql, [username, hashedPassword, email, phone, birthdate, address], (err, result) => {
                    if (err) return res.status(500).json({ error: "สมัครสมาชิกไม่สำเร็จ: " + err.message });
                    res.json({ message: "สมัครสมาชิกเรียบร้อย!", userId: result.insertId });
                });
            } catch (hashError) {
                res.status(500).json({ error: "เกิดข้อผิดพลาดในการเข้ารหัส" });
            }
        });
    });

    // ... (ส่วน Login เหมือนเดิม) ...
    router.post('/login', (req, res) => {
        const { username, password } = req.body;
        const sql = "SELECT * FROM user WHERE username = ?";
        pool.query(sql, [username], async (err, results) => {
           if (err) return res.status(500).json({ error: err.message });
           if (results.length > 0) {
               const user = results[0];
               const match = await bcrypt.compare(password, user.password);
               if (match) {
                   // ✅ เพิ่ม phone เข้าไปใน response ด้วยก็ได้ เผื่อเอาไปโชว์หน้าเว็บ
                   res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, phone: user.phone } });
               } else {
                   res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
               }
           } else {
               res.status(401).json({ error: "ไม่พบชื่อผู้ใช้นี้" });
           }
        });
    });

    return router;
};