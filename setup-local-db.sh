#!/bin/bash

echo "🚀 Setting up local database for TaskGrid"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Start PostgreSQL container
echo "📦 Starting PostgreSQL container..."
if docker compose version &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

if [ $? -ne 0 ]; then
    echo "❌ Failed to start PostgreSQL container"
    exit 1
fi

echo "✅ PostgreSQL container started"
echo ""

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << 'EOF'
# Local PostgreSQL Database
DATABASE_URL="postgresql://taskgrid:taskgrid123@localhost:5432/taskgrid_dev?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="local-dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="mail.taskgrid@gmail.com"
SMTP_PASSWORD="P@ssword01"
SMTP_FROM="TaskGrid <mail.taskgrid@gmail.com>"
EOF
    echo "✅ .env.local file created"
else
    echo "ℹ️  .env.local already exists, skipping..."
fi

echo ""
echo "🔄 Running Prisma migrations..."
npx prisma migrate dev --name init

if [ $? -ne 0 ]; then
    echo "❌ Failed to run migrations"
    exit 1
fi

echo "✅ Migrations completed"
echo ""

# Ask if user wants to seed the database
read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
    echo "✅ Database seeded"
fi

echo ""
echo "✅ Local database setup complete!"
echo ""
echo "📊 You can now:"
echo "   - Run 'npm run dev' to start the development server"
echo "   - Run 'npx prisma studio' to view the database"
echo "   - Access the app at http://localhost:3000"
echo ""
echo "🐳 Docker commands:"
echo "   - Stop database: docker compose down"
echo "   - View logs: docker compose logs -f"
echo "   - Restart: docker compose restart"
