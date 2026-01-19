// routes/score.js
import express from 'express';
const router = express.Router();

export default function (prisma) {

    router.post('/save', async (req, res) => {
        // รับค่าจาก Frontend (ชื่อตัวแปรตรงนี้ไม่ต้องแก้ เพราะ Frontend ส่งมาแบบนี้)
        const { userId, score, gameType, difficulty } = req.body;

        // เช็คก่อนบันทึก: ถ้า userId เป็น NaN ให้หยุดทำงาน
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ error: "Invalid User ID" });
        }

        try {
            await prisma.gameScore.create({
                data: {
                    // ✅ แก้ฝั่งซ้ายให้ตรงกับ Schema (uid, game_type)
                    uid: parseInt(userId),       // ใน DB ชื่อ uid
                    score: parseInt(score),
                    game_type: gameType,         // ใน DB ชื่อ game_type
                    difficulty: difficulty || null
                }
            });
            res.json({ success: true });
        } catch (err) {
            console.error("Database Error:", err); // ดู Error เต็มๆ
            res.status(500).json({ error: "Save score failed" });
        }
    });
    // ✅ API 2: ดึง Leaderboard (Top 10 High Score)
    router.get('/leaderboard', async (req, res) => {
        const { type } = req.query; // รับค่า 'quiz_hard' หรือ 'virus'

        try {
            let whereCondition = {};

            if (type === 'quiz_hard') {
                whereCondition = { gameType: 'quiz', difficulty: 'hard' };
            } else if (type === 'virus') {
                whereCondition = { gameType: 'virus' };
            }

            // ดึงคะแนนสูงสุดของแต่ละคน (Group By UserId)
            // หมายเหตุ: Prisma GroupBy อาจจะซับซ้อน ถ้าเอาง่ายๆ ให้ดึงมาแล้ว filter ในโค้ด หรือใช้ Raw Query
            // วิธีแบบบ้านๆ: ดึงมาทั้งหมด เรียงตามคะแนน แล้วกรองชื่อซ้ำออก
            const scores = await prisma.gameScore.findMany({
                where: whereCondition,
                include: { user: true },
                orderBy: { score: 'desc' },
                take: 100 // ดึงมาเผื่อตัดตัวซ้ำ
            });

            // กรองเอาเฉพาะคะแนนสูงสุดของแต่ละคน (Unique User)
            const uniqueLeaderboard = [];
            const userSet = new Set();

            for (const s of scores) {
                if (!userSet.has(s.userId)) {
                    uniqueLeaderboard.push({
                        username: s.user.username,
                        score: s.score,
                        avatar: '😎' // ใส่ Logic Avatar ตามต้องการ
                    });
                    userSet.add(s.userId);
                }
                if (uniqueLeaderboard.length >= 20) break; // เอาแค่ Top 20
            }

            res.json(uniqueLeaderboard);

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Fetch leaderboard failed" });
        }
    });

    return router;
}