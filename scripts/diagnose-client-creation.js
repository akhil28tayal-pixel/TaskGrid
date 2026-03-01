require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseClientCreation() {
  console.log("🔍 Diagnosing Client Creation Issue\n");
  
  try {
    // Test 1: Database Connection
    console.log("Test 1: Database Connection");
    console.log("Attempting to connect to database...");
    await prisma.$connect();
    console.log("✅ Database connection successful\n");

    // Test 2: Check existing clients
    console.log("Test 2: Existing Clients");
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        portalAccess: true,
      },
    });
    console.log(`Found ${clients.length} client(s) in database:`);
    clients.forEach((client, index) => {
      console.log(`  ${index + 1}. ${client.legalName} (${client.primaryEmail})`);
      console.log(`     Portal Access: ${client.portalAccess ? '✅ Yes' : '❌ No'}`);
    });
    console.log("");

    // Test 3: Check users who can create clients
    console.log("Test 3: Users with Client Creation Permission");
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['PARTNER', 'MANAGER']
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });
    console.log(`Found ${users.length} user(s) who can create clients:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });
    console.log("");

    // Test 4: SMTP Configuration
    console.log("Test 4: SMTP Configuration");
    console.log(`SMTP_HOST: ${process.env.SMTP_HOST || 'NOT SET'}`);
    console.log(`SMTP_PORT: ${process.env.SMTP_PORT || 'NOT SET'}`);
    console.log(`SMTP_USER: ${process.env.SMTP_USER || 'NOT SET'}`);
    console.log(`SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '***SET***' : 'NOT SET'}`);
    console.log(`SMTP_FROM: ${process.env.SMTP_FROM || 'NOT SET'}`);
    console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'NOT SET'}`);
    console.log("");

    // Test 5: Try creating a test client
    console.log("Test 5: Creating Test Client");
    const testClientData = {
      clientType: "INDIVIDUAL",
      legalName: "Diagnostic Test Client",
      preferredName: "Test",
      primaryEmail: "test@diagnostic.com",
      billingAddressSame: true,
      servicesRequired: ["TAX_PREPARATION"],
      billingPreference: "MONTHLY",
      onboardingStatus: "PENDING_DOCS",
      fiscalYearStartMonth: 1,
      tags: [],
      status: "ACTIVE",
      approvalStatus: "APPROVED",
    };

    console.log("Creating test client...");
    const testClient = await prisma.client.create({
      data: testClientData,
    });
    console.log(`✅ Test client created successfully! ID: ${testClient.id}`);

    // Create portal access
    const accessToken = `client_${Date.now()}_test`;
    await prisma.clientPortalAccess.create({
      data: {
        clientId: testClient.id,
        email: testClientData.primaryEmail,
        accessToken: accessToken,
        isActive: true,
      },
    });
    console.log(`✅ Portal access created with token: ${accessToken}`);

    // Clean up test client
    console.log("Cleaning up test client...");
    await prisma.clientPortalAccess.deleteMany({
      where: { clientId: testClient.id }
    });
    await prisma.client.delete({
      where: { id: testClient.id }
    });
    console.log("✅ Test client cleaned up\n");

    console.log("=".repeat(60));
    console.log("DIAGNOSIS SUMMARY:");
    console.log("=".repeat(60));
    console.log("✅ Database connection: WORKING");
    console.log("✅ Client creation: WORKING");
    console.log("✅ Portal access creation: WORKING");
    console.log(`${process.env.SMTP_USER ? '✅' : '❌'} SMTP configuration: ${process.env.SMTP_USER ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
    console.log("");
    console.log("CONCLUSION:");
    console.log("The backend database operations are working correctly.");
    console.log("The issue is likely in the frontend form submission.");
    console.log("");
    console.log("Possible causes:");
    console.log("1. Form validation preventing submission");
    console.log("2. JavaScript error in browser preventing form submission");
    console.log("3. Server action not being called from the frontend");
    console.log("4. Session/authentication issue preventing server action execution");
    console.log("");

  } catch (error) {
    console.error("❌ Error during diagnosis:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseClientCreation()
  .then(() => {
    console.log("Diagnosis complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Diagnosis failed:", error);
    process.exit(1);
  });
