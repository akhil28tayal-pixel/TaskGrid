# TaskGrid - CPA Practice Management Software

A modern web application for CPA firms to manage clients, projects, documents, team assignments, and timelines.

## Features

- **Dashboard** - Overview of active projects, pending documents, and upcoming deadlines
- **Clients** - Manage client profiles, contacts, and relationships
- **Projects** - Track tax returns, bookkeeping, audits, and other engagements
- **Documents** - Handle documents needed from clients, received, and created for clients
- **Team** - Manage team members, assignments, and workload
- **Timeline** - View project deadlines and milestones

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui + Radix UI
- **Database**: PostgreSQL with Prisma ORM
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database

### Installation

1. Install dependencies:
   ```bash
   cd TaskGrid
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Update `.env.local` with your database connection string.

3. Set up the database:
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
TaskGrid/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Dashboard layout group
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── clients/        # Client management
│   │   │   ├── projects/       # Project tracking
│   │   │   ├── documents/      # Document management
│   │   │   ├── team/           # Team management
│   │   │   └── timeline/       # Timeline view
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home redirect
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   └── layout/             # Layout components (Sidebar, Header)
│   └── lib/
│       ├── db.ts               # Prisma client
│       └── utils.ts            # Utility functions
├── prisma/
│   └── schema.prisma           # Database schema
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Database Schema

The application uses the following main entities:

- **User** - Team members with roles (Admin, Manager, Staff)
- **Client** - Client profiles with contacts
- **Project** - Engagements linked to clients
- **Document** - Files with types (Needed, Received, Created)
- **Task** - Tasks within projects
- **Milestone** - Project milestones and deadlines
- **Activity** - Audit log of actions

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio

## License

This project is open source and available under the [MIT License](LICENSE).
