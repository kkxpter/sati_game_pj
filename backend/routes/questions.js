// routes/questions.js
import express from 'express';

export default function (pool) {
    const router = express.Router();

    router.get('/', (req, res) => {
        const { level } = req.query;

        if (!level) {
            return res.status(400).json({ error: 'กรุณาระบุระดับความยาก (level)' });
        }

        // ✅ แก้ตรงนี้: เปลี่ยน LIMIT 5 เป็น LIMIT 10
        // ORDER BY RAND() จะทำการสุ่มแถวให้เอง และเมื่อเราดึงมาทีเดียว 10 แถว มันจะไม่ซ้ำกันแน่นอนในรอบนั้น
        const sqlQuestions = `SELECT * FROM questions WHERE level = ? ORDER BY RAND() LIMIT 10`;
        
        pool.query(sqlQuestions, [level], (err, questions) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // ถ้าคำถามใน Database มีไม่ถึง 10 ข้อ มันจะส่งมาเท่าที่มีครับ
            if (questions.length === 0) {
                return res.json({ success: true, questions: [] });
            }

            const questionIds = questions.map(q => q.qid);
            const sqlChoices = `SELECT * FROM choices WHERE qid IN (?) ORDER BY RAND()`;

            pool.query(sqlChoices, [questionIds], (err, choices) => {
                if (err) return res.status(500).json({ error: err.message });

                const data = questions.map(q => ({
                    ...q,
                    choices: choices.filter(c => c.qid === q.qid)
                }));

                res.json({ success: true, questions: data });
            });
        });
    });

    return router;
}