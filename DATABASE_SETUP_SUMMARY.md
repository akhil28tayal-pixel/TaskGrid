# Database Setup Summary

## Quick Start - Local Development

### 1. Start Local PostgreSQL Database
```bash
./setup-local-db.sh
```

This will:
- Start PostgreSQL in Docker
- Create `.env.local` with local database URL
- Run migrations
- Optionally seed the database

### 2. Start Development Server
```bash
npm run dev
```

Access at: http://localhost:3000

---

## Clear Production Database

⚠️ **WARNING: This deletes ALL production data!**

```bash
npx ts-node reset-production-db.ts
```

---

## Manual Setup (if you prefer)

### Start PostgreSQL with Docker
```bash
docker compose up -d
```

### Create .env.local
```env
DATABASE_URL="postgresql://taskgrid:taskgrid123@localhost:5432/taskgrid_dev?schema=public"
NEXTAUTH_SECRET="local-dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="mail.taskgrid@gmail.com"
SMTP_PASSWORD="P@ssword01"
SMTP_FROM="TaskGrid <mail.taskgrid@gmail.com>"
```

### Run Migrations
```bash
npx prisma migrate dev
```

### Seed Database (Optional)
```bash
npx prisma db seed
```

---

## Environment Configuration

### Development (Local)
- **File**: `.env.local` (gitignored)
- **Database**: Local PostgreSQL in Docker
- **URL**: http://localhost:3000

### Production (Vercel)
- **File**: Vercel Environment Variables
- **Database**: Neon PostgreSQL (cloud)
- **URL**: https://taskgrid-two.vercel.app

---

## Useful Commands

### Database Management
```bash
# View database in browser
npx prisma studio

# Reset local database
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Create new migration
npx prisma migrate dev --name your_migration_name
```

### Docker Commands
```bash
# Stop database
docker compose down

# View logs
docker compose logs -f postgres

# Restart database
docker compose restart

# Remove database (deletes all data)
docker compose down -v
```

---

## Default Login Credentials

After seeding, you can login with:

**Partner Account:**
- Email: `partner@taskgrid.com`
- Password: `partner123`

**Manager Account:**
- Email: `manager@taskgrid.com`
- Password: `manager123`

**Client Portal:**
- Email: `demo@client.com`
- Password: `client123`

---

## Troubleshooting

### Port 5432 already in use
```bash
# Stop existing PostgreSQL
brew services stop postgresql
# or
docker ps  # find container ID
docker stop <container_id>
```

### Prisma Client errors
```bash
npx prisma generate
```

### Migration conflicts
```bash
npx prisma migrate reset
```

### Connection refused
```bash
# Check if Docker is running
docker ps

# Restart PostgreSQL container
docker compose restart
```
