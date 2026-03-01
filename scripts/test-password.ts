import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function testPassword() {
  try {
    const email = "ajaytayal09@yahoo.com";
    const password = "Ajay@1234";

    console.log(`Testing login for: ${email}`);
    console.log(`Password: ${password}\n`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log(`✅ User found: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Active: ${user.isActive}`);
    console.log(`Password hash: ${user.password}\n`);

    if (!user.password) {
      console.log("❌ No password hash stored");
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    console.log(`Password validation: ${isValid ? "✅ VALID" : "❌ INVALID"}`);

    if (!isValid) {
      console.log("\n🔄 Re-hashing password and updating...");
      const newHash = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash },
      });
      console.log("✅ Password updated");
      
      // Test again
      const user2 = await prisma.user.findUnique({
        where: { email },
      });
      const isValid2 = await bcrypt.compare(password, user2!.password!);
      console.log(`New password validation: ${isValid2 ? "✅ VALID" : "❌ INVALID"}`);
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();
