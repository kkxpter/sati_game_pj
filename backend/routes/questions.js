// routes/questions.js (แบบแก้ปัญหา pool.promise)
import express from 'express';

export default function (pool) {
    const router = express.Router();

    router.get('/', (req, res) => {
        const diff = req.query.diff || 'easy';

        // 1. ดึงคำถาม
        const sqlQuestion = `
            SELECT q.*, c.name AS category_name 
            FROM questions q
            LEFT JOIN category c ON q.cg_id = c.cg_id
            WHERE q.level = ? 
            ORDER BY RAND() 
            LIMIT 10
        `;

        pool.query(sqlQuestion, [diff], (err, questions) => {
            if (err) {
                console.error("DB Error (Questions):", err);
                return res.status(500).json({ error: err.message });
            }

            if (questions.length === 0) return res.json([]);

            // 2. ดึงตัวเลือก
            const questionIds = questions.map(q => q.qid);
            const sqlChoices = `SELECT * FROM choices WHERE qid IN (?)`;

            pool.query(sqlChoices, [questionIds], (err2, choices) => {
                if (err2) {
                    console.error("DB Error (Choices):", err2);
                    return res.status(500).json({ error: err2.message });
                }

                // 3. รวมร่าง
                const gameData = questions.map(q => {
                    const myChoices = choices.filter(c => c.qid === q.qid);
                    return {
                        qid: q.qid,
                        q: q.name,
                        desc: q.explanation,
                        category_name: q.category_name || 'ทั่วไป',
                        optionsRaw: myChoices.map(c => ({
                            text: c.name,
                            isCorrect: c.is_correct === 1
                        }))
                    };
                });

                res.json(gameData);
            });
        });
    });

    return router;
};