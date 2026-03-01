require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAkhilClient() {
  try {
    console.log("🔍 Searching for Akhil client...\n");

    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { legalName: { contains: 'Akhil', mode: 'insensitive' } },
          { primaryEmail: { contains: 'akhil', mode: 'insensitive' } },
        ],
      },
      include: {
        portalAccess: true,
      },
    });

    if (!client) {
      console.log("❌ No client found matching 'Akhil'");
      
      // Show all clients
      const allClients = await prisma.client.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          legalName: true,
          primaryEmail: true,
          createdAt: true,
        },
      });
      
      console.log(`\nAll clients in database (${allClients.length}):`);
      allClients.forEach((c, i) => {
        console.log(`${i + 1}. ${c.legalName} - ${c.primaryEmail}`);
      });
      return;
    }

    console.log("✅ Client found!");
    console.log(`Name: ${client.legalName}`);
    console.log(`Email: ${client.primaryEmail}`);
    console.log(`Created: ${client.createdAt}`);
    console.log(`Status: ${client.status}`);
    
    if (client.portalAccess) {
      console.log(`\n✅ Portal Access EXISTS`);
      console.log(`Access Token: ${client.portalAccess.accessToken}`);
      console.log(`Portal Active: ${client.portalAccess.isActive}`);
      const portalLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/client-portal?token=${client.portalAccess.accessToken}`;
      console.log(`Portal Link: ${portalLink}`);
    } else {
      console.log(`\n❌ Portal Access NOT CREATED`);
      console.log("This means the email was NOT sent!");
    }

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAkhilClient();
