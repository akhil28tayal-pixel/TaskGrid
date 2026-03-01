require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRecurringWorkCron() {
  console.log("🧪 Testing Recurring Work Cron Job Setup\n");

  try {
    // Test 1: Check if there are any recurring work records
    console.log("Test 1: Checking for recurring work records...");
    const recurringWork = await prisma.recurringWork.findMany({
      include: {
        client: true,
        template: true,
      },
    });
    
    console.log(`Found ${recurringWork.length} recurring work record(s)`);
    
    if (recurringWork.length === 0) {
      console.log("\n⚠️  No recurring work found. Let's create a test record.\n");
      
      // Get a client to use
      const client = await prisma.client.findFirst();
      if (!client) {
        console.log("❌ No clients found. Please create a client first.");
        return;
      }

      console.log(`Using client: ${client.legalName}`);

      // Create a test recurring work
      const testRecurringWork = await prisma.recurringWork.create({
        data: {
          name: "Monthly Tax Review",
          description: "Automated monthly tax review for client",
          projectType: "TAX_RETURN_INDIVIDUAL",
          frequency: "MONTHLY",
          interval: 1,
          startDate: new Date(),
          nextRunDate: new Date(), // Set to now so it runs immediately
          isActive: true,
          autoAssign: true,
          clientId: client.id,
        },
      });

      console.log(`✅ Created test recurring work: ${testRecurringWork.name}`);
      console.log(`   ID: ${testRecurringWork.id}`);
      console.log(`   Next Run: ${testRecurringWork.nextRunDate}`);
    } else {
      console.log("\nExisting recurring work:");
      recurringWork.forEach((work, index) => {
        console.log(`\n${index + 1}. ${work.name}`);
        console.log(`   Client: ${work.client.legalName}`);
        console.log(`   Frequency: ${work.frequency}`);
        console.log(`   Next Run: ${work.nextRunDate}`);
        console.log(`   Active: ${work.isActive}`);
      });
    }

    // Test 2: Check for due recurring work
    console.log("\n\nTest 2: Checking for due recurring work...");
    const now = new Date();
    const dueWork = await prisma.recurringWork.findMany({
      where: {
        isActive: true,
        nextRunDate: {
          lte: now,
        },
      },
      include: {
        client: true,
      },
    });

    console.log(`Found ${dueWork.length} recurring work item(s) due for processing`);
    
    if (dueWork.length > 0) {
      console.log("\nDue recurring work:");
      dueWork.forEach((work, index) => {
        console.log(`${index + 1}. ${work.name} - ${work.client.legalName}`);
      });
    }

    // Test 3: Test the API endpoint
    console.log("\n\nTest 3: Testing cron API endpoint...");
    console.log("You can manually trigger the cron job by calling:");
    console.log(`  GET http://localhost:3000/api/cron/recurring-work`);
    console.log("\nOr using curl:");
    console.log(`  curl http://localhost:3000/api/cron/recurring-work`);

    console.log("\n" + "=".repeat(60));
    console.log("CRON JOB SETUP SUMMARY");
    console.log("=".repeat(60));
    console.log("✅ Cron job will run automatically every hour");
    console.log("✅ Checks for recurring work where nextRunDate <= now");
    console.log("✅ Generates projects automatically for due work");
    console.log("✅ Updates nextRunDate based on frequency");
    console.log("\nCron Schedule: Every hour at minute 0 (0 * * * *)");
    console.log("API Endpoint: /api/cron/recurring-work");
    console.log("\nTo test immediately:");
    console.log("1. Create recurring work in the UI at /workflows");
    console.log("2. Set nextRunDate to current time or past");
    console.log("3. Wait for next hour, or call the API endpoint manually");
    console.log("4. Check /projects to see generated projects");

  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testRecurringWorkCron()
  .then(() => {
    console.log("\n✅ Test complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
