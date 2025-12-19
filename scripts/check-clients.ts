import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      legalName: true,
      approvalStatus: true,
      createdById: true,
    },
  });
  console.log('All clients:', JSON.stringify(clients, null, 2));
  
  const pendingClients = await prisma.client.findMany({
    where: { approvalStatus: 'PENDING' },
  });
  console.log('Pending clients count:', pendingClients.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
