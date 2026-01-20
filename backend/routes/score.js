import express from 'express';
const router = express.Router();

export default function (prisma) {

    // ==========================================
    // 1. Save Score (บันทึกทุกรอบลง DB)
    // ==========================================
    router.post('/save', async (req, res) => {
        const { userId, score, gameType, difficulty } = req.body;

        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ error: "Invalid User ID" });
        }

        try {
            await prisma.gameScore.create({
                data: {
                    uid: parseInt(userId),
                    score: parseInt(score),
                    game_type: gameType,
                    difficulty: difficulty || null
                }
            });
            console.log(`✅ Saved: User ${userId} | Score ${score} | Mode ${gameType} (${difficulty})`);
            res.json({ success: true });
        } catch (err) {
            console.error("Database Error:", err);
            res.status(500).json({ error: "Save failed" });
        }
    });

    // ==========================================
    // 2. Leaderboard (หัวใจสำคัญ: คำนวณคะแนนที่นี่)
    // ==========================================
    router.get('/leaderboard', async (req, res) => {
        const { type } = req.query; 
        console.log(`🔍 Fetching Leaderboard for type: ${type}`); // Log ดูว่า Frontend ส่งอะไรมา

        try {
            let whereCondition = {};
            
            // ตั้งเงื่อนไขดึงข้อมูล (Query Database)
            if (type === 'quiz_hard') {
                whereCondition = { 
                    game_type: 'quiz', 
                    difficulty: 'hard' 
                };
            } else if (type === 'virus') {
                whereCondition = { 
                    game_type: 'virus' 
                };
            }

            // 1. ดึงประวัติ "ทั้งหมด" ออกมา
            const allScores = await prisma.gameScore.findMany({
                where: whereCondition,
                include: { user: true }, 
            });

            console.log(`Found ${allScores.length} records for ${type}`);

            // 2. สร้างตัวแปรเก็บคะแนนรวมของแต่ละคน (Map)
            const leaderboardMap = new Map();

            // 3. วนลูปทุกแถวใน Database เพื่อคำนวณ
            for (const record of allScores) {
                const uid = record.uid;
                const currentScore = record.score;

                // ถ้ายังไม่เคยเจอ User นี้ใน Map ให้สร้างใหม่
                if (!leaderboardMap.has(uid)) {
                    leaderboardMap.set(uid, {
                        username: record.user.username,
                        score: 0, // เริ่มต้นที่ 0
                        avatar: '😎' 
                    });
                }

                const entry = leaderboardMap.get(uid);

                // 🔥🔥🔥 LOGIC การนับคะแนน (ปรับปรุงใหม่) 🔥🔥🔥
                if (type === 'quiz_hard') {
                    // ✅ Quiz Hard: นับทบ (Sum)
                    // console.log(`User ${record.user.username}: Old ${entry.score} + New ${currentScore}`);
                    entry.score += currentScore;
                } else {
                    // ✅ Virus: เอาคะแนนสูงสุด (Max)
                    if (currentScore > entry.score) {
                        entry.score = currentScore;
                    }
                }
            }

            // 4. แปลงกลับเป็นรายการ -> เรียงลำดับ -> ตัดมา 20 คนแรก
            const calculatedLeaderboard = Array.from(leaderboardMap.values())
                .sort((a, b) => b.score - a.score) 
                .slice(0, 20);

            res.json(calculatedLeaderboard);

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Fetch leaderboard failed" });
        }
    });

    return router;
}