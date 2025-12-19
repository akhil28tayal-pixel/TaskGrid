# TaskGrid Project Documentation

## Overview
TaskGrid is a project management application built with Next.js 14, designed for accounting/professional services firms to manage clients, projects, and workflow templates.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI, shadcn/ui
- **Styling**: TailwindCSS
- **Icons**: Lucide React

## Authentication
- **Login**: `partner@taskgrid.com` / `partner123`
- Session-based authentication with NextAuth.js
- Role-based access control (RBAC)

## User Roles & Hierarchy
```
Partner (highest)
  └── Manager
        └── Associate (lowest)
```

### Role Permissions
| Feature | Partner | Manager | Associate |
|---------|---------|---------|-----------|
| Create Templates | ✅ | ❌ | ❌ |
| Edit/Delete Templates | ✅ | ❌ | ❌ |
| Create Clients | ✅ | ✅ | ❌ |
| Edit/Delete Clients | ✅ | ❌ | ❌ |
| Approve Clients | ✅ | ❌ | ❌ |
| View Dashboard | ✅ | ✅ | ✅ |
| Manage Team | ✅ | ❌ | ❌ |

## Key Features Implemented

### 1. Team Hierarchy & Management
- Partner > Manager > Associate role structure
- Team management UI for adding/editing/deleting team members
- Role-based sidebar navigation

### 2. Client Management
- Client creation with approval workflow
- Only Partners can edit/delete clients
- Associates cannot create clients

### 3. Workflow Templates System
Templates allow standardizing processes with:
- **Sections**: Group tasks (Team Tasks / Client Request)
- **Tasks**: Individual work items with types
- **Subtasks**: Nested items within tasks
- **Automations**: Triggered actions on task completion
- **Attachments**: File uploads on tasks

### Task Types
- `TEAM_TASK`: Internal team work
- `CLIENT_REQUEST`: External client-facing requests

### Automation Actions
- `CHANGE_PROJECT_TAG`: Update project tag
- `SEND_EMAIL_TO_CLIENT`: Send customized email
- `CREATE_PROJECT`: Create project from template

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── workflows/
│   │   │   ├── page.tsx          # Workflows list page
│   │   │   └── [id]/page.tsx     # Template editor page
│   │   ├── clients/
│   │   ├── projects/
│   │   └── team/
│   ├── actions/
│   │   ├── templates.ts          # Template CRUD operations
│   │   ├── workflows.ts          # Recurring work operations
│   │   ├── clients.ts
│   │   └── team.ts
│   └── api/auth/
├── components/
│   ├── ui/                       # shadcn/ui components
│   └── workflows/
│       ├── TemplateEditor.tsx    # Main template editor
│       ├── TaskDetailPanel.tsx   # Task detail sidebar
│       ├── CreateTemplateDialog.tsx
│       └── WorkflowsPageClient.tsx
└── lib/
    ├── prisma.ts
    └── auth.ts
```

## Database Schema (Key Models)

### WorkflowTemplate
- `id`, `name`, `description`, `isActive`
- Relations: `sections`, `createdBy`, `projects`

### WorkflowTemplateSection
- `id`, `name`, `order`, `templateId`
- Relations: `tasks`, `template`

### WorkflowTemplateTask
- `id`, `title`, `description`, `order`, `taskType`, `isRequired`, `daysOffset`
- Relations: `subtasks`, `automations`, `attachments`, `section`

### WorkflowTemplateSubtask
- `id`, `title`, `order`, `isRequired`, `taskId`

### WorkflowTemplateAutomation
- `id`, `trigger`, `action`, `actionData`, `taskId`

### WorkflowTemplateAttachment
- `id`, `name`, `fileUrl`, `fileSize`, `mimeType`, `taskId`

## Server Actions (templates.ts)

### Template Operations
- `createWorkflowTemplate(data)` - Create new template
- `getWorkflowTemplates()` - Get all active templates
- `getWorkflowTemplateById(id)` - Get single template
- `updateWorkflowTemplate(id, data)` - Update template
- `deleteWorkflowTemplate(id)` - Soft delete template

### Section Operations
- `addTemplateSection(templateId, data)` - Add section
- `updateTemplateSection(sectionId, data)` - Update section
- `deleteTemplateSection(sectionId)` - Delete section
- `duplicateTemplateSection(sectionId)` - Duplicate section

### Task Operations
- `addTemplateTask(sectionId, data)` - Add task
- `updateTemplateTask(taskId, data)` - Update task
- `deleteTemplateTask(taskId)` - Delete task

### Subtask Operations
- `addTemplateSubtask(taskId, data)` - Add subtask
- `deleteTemplateSubtask(subtaskId)` - Delete subtask

### Automation Operations
- `addTemplateAutomation(taskId, data)` - Add automation
- `deleteTemplateAutomation(automationId)` - Delete automation

### Attachment Operations
- `addTemplateAttachment(taskId, data)` - Add attachment
- `deleteTemplateAttachment(attachmentId)` - Delete attachment

## UI Components

### TemplateEditor
Main editor component with:
- Header with template name, badge, delete option
- Tabs: List view, Files view
- Collapsible sections with tasks
- Inline task/section editing
- Task detail panel on click

### TaskDetailPanel
Slide-out panel for task details:
- Task type badge
- Subtasks management (add/delete)
- Automations management (add/delete)
- File attachments (upload/delete)
- Delete task button

## Running the Project

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed

# Start development server
npm run dev
```

## Environment Variables
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Recent Bug Fixes
1. **Server Component onClick error**: Removed event handlers from Server Components
2. **Delete task not working**: Fixed by updating state management between TemplateEditor and TaskDetailPanel
3. **Foreign key constraint on template creation**: Fixed by looking up user by email instead of session ID
4. **Subtasks not displaying**: Added subtask rendering below tasks in list view

## Future Enhancements
- [ ] Cloud storage integration for file uploads (S3/Cloudinary)
- [ ] Drag-and-drop reordering for sections/tasks
- [ ] Template duplication
- [ ] Create project from template functionality
- [ ] Email automation integration
- [ ] Activity logging/audit trail
