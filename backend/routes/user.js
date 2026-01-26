import express from 'express';
const router = express.Router();

export default function (prisma) {

    // ==========================================
    // 1. เปลี่ยนชื่อผู้ใช้ (Update Profile)
    // ==========================================
    router.post('/update-profile', async (req, res) => {
        const { userId, username } = req.body;

        if (!userId || !username) {
            return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
        }

        try {
            await prisma.user.update({
                where: { uid: parseInt(userId) },
                data: { username: username }
            });

            res.json({ success: true, message: "อัปเดตข้อมูลสำเร็จ" });
        } catch (err) {
            console.error("Update Profile Error:", err);
            res.status(500).json({ error: "อัปเดตข้อมูลไม่สำเร็จ" });
        }
    });

    // ==========================================
    // 2. เปลี่ยนรหัสผ่าน (Change Password)
    // ==========================================
    router.post('/change-password', async (req, res) => {
        const { userId, currentPassword, newPassword } = req.body;

        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        }

        try {
            // 1. หา User
            const user = await prisma.user.findUnique({
                where: { uid: parseInt(userId) }
            });

            if (!user) return res.status(404).json({ error: "ไม่พบผู้ใช้งาน" });

            // 2. เช็ครหัสเดิม
            if (user.password !== currentPassword) {
                return res.status(401).json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
            }

            // 3. อัปเดตรหัสใหม่
            await prisma.user.update({
                where: { uid: parseInt(userId) },
                data: { password: newPassword }
            });

            res.json({ success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" });

        } catch (err) {
            console.error("Change Password Error:", err);
            res.status(500).json({ error: "เปลี่ยนรหัสผ่านไม่สำเร็จ" });
        }
    });

    return router;
}