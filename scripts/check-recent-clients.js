require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecentClients() {
  try {
    console.log("🔍 Checking recent clients...\n");

    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        portalAccess: true,
      },
    });

    if (clients.length === 0) {
      console.log("No clients found in database.");
      return;
    }

    console.log(`Found ${clients.length} recent client(s):\n`);

    clients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.legalName}`);
      console.log(`   Email: ${client.primaryEmail}`);
      console.log(`   Created: ${client.createdAt}`);
      console.log(`   Status: ${client.status}`);
      
      if (client.portalAccess) {
        console.log(`   Portal Access: ✅ Created`);
        console.log(`   Access Token: ${client.portalAccess.accessToken?.substring(0, 30)}...`);
        console.log(`   Portal Active: ${client.portalAccess.isActive}`);
        const portalLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/client-portal?token=${client.portalAccess.accessToken}`;
        console.log(`   Portal Link: ${portalLink}`);
      } else {
        console.log(`   Portal Access: ❌ NOT CREATED`);
      }
      console.log('');
    });

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentClients();
