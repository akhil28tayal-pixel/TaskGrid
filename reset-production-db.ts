import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function resetDatabase() {
  try {
    console.log('🗑️  Clearing production database...');
    console.log('');

    // Delete in correct order to respect foreign key constraints
    console.log('Deleting notifications...');
    await prisma.notification.deleteMany();
    
    console.log('Deleting email attachments...');
    await prisma.emailAttachment.deleteMany();
    
    console.log('Deleting emails...');
    await prisma.email.deleteMany();
    
    console.log('Deleting email threads...');
    await prisma.emailThread.deleteMany();
    
    console.log('Deleting time entries...');
    await prisma.timeEntry.deleteMany();
    
    console.log('Deleting payments...');
    await prisma.payment.deleteMany();
    
    console.log('Deleting invoice items...');
    await prisma.invoiceItem.deleteMany();
    
    console.log('Deleting invoices...');
    await prisma.invoice.deleteMany();
    
    console.log('Deleting client requests...');
    await prisma.clientRequest.deleteMany();
    
    console.log('Deleting client portal access...');
    await prisma.clientPortalAccess.deleteMany();
    
    console.log('Deleting recurring work...');
    await prisma.recurringWork.deleteMany();
    
    console.log('Deleting workflow template attachments...');
    await prisma.workflowTemplateAttachment.deleteMany();
    
    console.log('Deleting workflow template automations...');
    await prisma.workflowTemplateAutomation.deleteMany();
    
    console.log('Deleting workflow template subtasks...');
    await prisma.workflowTemplateSubtask.deleteMany();
    
    console.log('Deleting workflow template tasks...');
    await prisma.workflowTemplateTask.deleteMany();
    
    console.log('Deleting workflow template sections...');
    await prisma.workflowTemplateSection.deleteMany();
    
    console.log('Deleting workflow templates...');
    await prisma.workflowTemplate.deleteMany();
    
    console.log('Deleting comment mentions...');
    await prisma.commentMention.deleteMany();
    
    console.log('Deleting comments...');
    await prisma.comment.deleteMany();
    
    console.log('Deleting activities...');
    await prisma.activity.deleteMany();
    
    console.log('Deleting milestones...');
    await prisma.milestone.deleteMany();
    
    console.log('Deleting documents...');
    await prisma.document.deleteMany();
    
    console.log('Deleting task attachments...');
    await prisma.taskAttachment.deleteMany();
    
    console.log('Deleting tasks...');
    await prisma.task.deleteMany();
    
    console.log('Deleting project assignments...');
    await prisma.projectAssignment.deleteMany();
    
    console.log('Deleting projects...');
    await prisma.project.deleteMany();
    
    console.log('Deleting project tags...');
    await prisma.projectTag.deleteMany();
    
    console.log('Deleting client contacts...');
    await prisma.clientContact.deleteMany();
    
    console.log('Deleting clients...');
    await prisma.client.deleteMany();
    
    console.log('Deleting sessions...');
    await prisma.session.deleteMany();
    
    console.log('Deleting users...');
    await prisma.user.deleteMany();

    console.log('');
    console.log('✅ Production database cleared successfully!');
    console.log('');
    console.log('⚠️  All data has been deleted from production.');
    console.log('💡 You can now seed the database if needed.');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
