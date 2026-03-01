import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function testAuthFlow() {
  try {
    const credentials = {
      email: "ajaytayal09@yahoo.com",
      password: "Ajay@1234"
    };

    console.log("🔐 Testing authentication flow...\n");
    console.log(`Email: ${credentials.email}`);
    console.log(`Password: ${credentials.password}\n`);

    // Step 1: Find user
    console.log("Step 1: Finding user...");
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (!user || !user.password) {
      console.log("❌ User not found or no password");
      return;
    }
    console.log(`✅ User found: ${user.name} (${user.role})\n`);

    // Step 2: Check if active
    console.log("Step 2: Checking if user is active...");
    if (!user.isActive) {
      console.log("❌ Account is deactivated");
      return;
    }
    console.log(`✅ User is active\n`);

    // Step 3: Verify password
    console.log("Step 3: Verifying password...");
    console.log(`Stored hash: ${user.password.substring(0, 30)}...`);
    
    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.password
    );

    console.log(`Password valid: ${isPasswordValid ? "✅ YES" : "❌ NO"}\n`);

    if (!isPasswordValid) {
      console.log("❌ Authentication failed: Invalid password");
      return;
    }

    console.log("✅ Authentication successful!");
    console.log("\nUser details:");
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthFlow();
