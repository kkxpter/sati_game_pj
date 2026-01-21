import express from 'express';
const router = express.Router();

export default function (prisma) {

    // เปลี่ยนรหัสผ่าน
    router.post('/change-password', async (req, res) => {
        const { userId, currentPassword, newPassword } = req.body;

        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
        }

        try {
            // 1. หา User
            const user = await prisma.user.findUnique({
                where: { uid: parseInt(userId) }
            });

            if (!user) return res.status(404).json({ error: "ไม่พบผู้ใช้งาน" });

            // 2. เช็ครหัสเดิม (แบบง่าย ถ้าเข้ารหัสต้องใช้ bcrypt)
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