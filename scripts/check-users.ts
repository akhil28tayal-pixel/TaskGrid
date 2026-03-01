import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log("🔍 Checking users in database...\n");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
      },
    });

    console.log(`Found ${users.length} users:\n`);
    
    users.forEach((user) => {
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Password Hash: ${user.password?.substring(0, 20)}...`);
      console.log('---');
    });

  } catch (error) {
    console.error("❌ Check failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
