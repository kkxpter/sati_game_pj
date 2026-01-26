// backend/reset_pass.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // 1. สร้าง Hash ของคำว่า "1234"
    const hashedPassword = await bcrypt.hash('1234', 10);
    console.log("🔑 Generated Hash for '1234':", hashedPassword);

    // 2. อัปเดต User ทุกคนให้ใช้รหัสนี้ (หรือจะแก้แค่เฉพาะ ID ก็ได้)
    // ตรง where: {} คือแก้ทุกคน ถ้าจะแก้เฉพาะคนให้ใส่ where: { username: 'kT' }
    const updateUsers = await prisma.user.updateMany({
        data: {
            password: hashedPassword
        }
    });

    console.log(`✅ Reset password to '1234' for ${updateUsers.count} users.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());