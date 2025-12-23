# Local Database Setup Guide

## Option 1: PostgreSQL with Docker (Recommended)

### 1. Create docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: taskgrid-postgres
    environment:
      POSTGRES_USER: taskgrid
      POSTGRES_PASSWORD: taskgrid123
      POSTGRES_DB: taskgrid_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 2. Start PostgreSQL
```bash
docker-compose up -d
```

### 3. Update .env.local
Create `.env.local` file with:
```env
# Local PostgreSQL Database
DATABASE_URL="postgresql://taskgrid:taskgrid123@localhost:5432/taskgrid_dev?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="your-local-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# SMTP Configuration (same as production or use mailtrap for testing)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="mail.taskgrid@gmail.com"
SMTP_PASSWORD="P@ssword01"
SMTP_FROM="TaskGrid <mail.taskgrid@gmail.com>"
```

### 4. Run Migrations
```bash
npx prisma migrate dev
```

### 5. Seed Database (Optional)
```bash
npx prisma db seed
```

---

## Option 2: Local PostgreSQL Installation

### macOS (using Homebrew)
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Create database
createdb taskgrid_dev

# Create user
psql postgres
CREATE USER taskgrid WITH PASSWORD 'taskgrid123';
GRANT ALL PRIVILEGES ON DATABASE taskgrid_dev TO taskgrid;
\q
```

### Update .env.local
```env
DATABASE_URL="postgresql://taskgrid:taskgrid123@localhost:5432/taskgrid_dev?schema=public"
```

---

## Clear Production Database

⚠️ **WARNING: This will delete ALL data from production!**

```bash
# Run the reset script
npx ts-node reset-production-db.ts
```

---

## Environment Files Structure

- `.env` - Default environment variables (committed to git, no secrets)
- `.env.local` - Local development overrides (gitignored)
- `.env.production` - Production environment variables (gitignored)

Next.js automatically loads `.env.local` in development, overriding `.env`.

---

## Verify Setup

1. **Check database connection:**
```bash
npx prisma db pull
```

2. **Open Prisma Studio:**
```bash
npx prisma studio
```

3. **Run development server:**
```bash
npm run dev
```

4. **Access app:**
http://localhost:3000

---

## Production vs Development

### Development (Local)
- Uses `.env.local` with local PostgreSQL
- Database: `taskgrid_dev` on localhost
- URL: http://localhost:3000

### Production (Vercel)
- Uses Vercel environment variables
- Database: Neon PostgreSQL (cloud)
- URL: https://taskgrid-two.vercel.app

---

## Troubleshooting

### Connection refused
```bash
# Check if PostgreSQL is running
docker ps  # for Docker
brew services list  # for Homebrew
```

### Migration errors
```bash
# Reset database and migrations
npx prisma migrate reset
```

### Prisma Client out of sync
```bash
npx prisma generate
```
