// routes/admin.js
import express from 'express';

const router = express.Router();

export default (prisma) => {
    
    // API: /admin/stats
    router.get('/stats', async (req, res) => {
        try {
            // 1. Overview
            const totalUsers = await prisma.user.count();
            const totalGames = await prisma.game.count();
            const totalVirusGames = await prisma.gameScore.count({
                where: { game_type: 'virus' }
            });

            // 2. Hardest Questions
            const questionStats = await prisma.answerLogs.groupBy({
                by: ['qid', 'is_correct'],
                _count: { _all: true },
            });

            const questions = await prisma.questions.findMany({
                select: { qid: true, question: true, level: true }
            });

            const analyzedQuestions = questions.map(q => {
                const correctLog = questionStats.find(s => s.qid === q.qid && s.is_correct === true);
                const wrongLog = questionStats.find(s => s.qid === q.qid && s.is_correct === false);
                
                const correctCount = correctLog?._count._all || 0;
                const wrongCount = wrongLog?._count._all || 0;
                const totalAttempts = correctCount + wrongCount;
                
                return {
                    ...q,
                    correctRate: totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0,
                    totalAttempts
                };
            })
            .sort((a, b) => a.correctRate - b.correctRate)
            .slice(0, 10);

            // 3. Recent Logs
            const recentLogs = await prisma.answerLogs.findMany({
                take: 20,
                orderBy: { answered_at: 'desc' },
                include: {
                    user: { select: { username: true } },
                    question: { select: { question: true } },
                    choice: { select: { choice_text: true } }
                }
            });

            res.json({
                overview: { totalUsers, totalGames, totalVirusGames },
                hardestQuestions: analyzedQuestions,
                recentLogs
            });

        } catch (error) {
            console.error("Admin stats error:", error);
            res.status(500).json({ error: 'Failed to fetch admin stats' });
        }
    });

    return router;
};