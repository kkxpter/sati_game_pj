import express from 'express';
const router = express.Router();

export default function (prisma) {

    router.post('/save', async (req, res) => {
        const { userId, score, gameType, difficulty } = req.body;

        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ error: "Invalid User ID", receivedId: userId });
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
            res.json({ success: true });
        } catch (err) {
            console.error("Database Error:", err);
            res.status(500).json({ error: "Save score failed" });
        }
    });

    router.get('/leaderboard', async (req, res) => {
        const { type } = req.query; 
        try {
            let whereCondition = {};
            if (type === 'quiz_hard') whereCondition = { game_type: 'quiz', difficulty: 'hard' };
            else if (type === 'virus') whereCondition = { game_type: 'virus' };

            const scores = await prisma.gameScore.findMany({
                where: whereCondition,
                include: { user: true },
                orderBy: { score: 'desc' },
                take: 50
            });

            const uniqueLeaderboard = [];
            const userSet = new Set();

            for (const s of scores) {
                if (!userSet.has(s.uid)) {
                    uniqueLeaderboard.push({
                        username: s.user.username,
                        score: s.score,
                        avatar: '😎' 
                    });
                    userSet.add(s.uid);
                }
                if (uniqueLeaderboard.length >= 20) break; 
            }
            res.json(uniqueLeaderboard);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Fetch leaderboard failed" });
        }
    });

    return router;
}