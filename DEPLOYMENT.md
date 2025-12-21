# TaskGrid Production Deployment Guide

## Recommended Deployment Options

### Option 1: Vercel (Recommended - Easiest)

**Best for:** Quick deployment, automatic scaling, zero configuration

#### Steps:
1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Connect your GitHub repository
   - Configure environment variables:
     ```
     DATABASE_URL=your_neon_postgres_url
     NEXTAUTH_SECRET=your_secret_key
     NEXTAUTH_URL=https://your-domain.vercel.app
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_USER=your_email
     SMTP_PASSWORD=your_password
     SMTP_FROM=TaskGrid <your_email>
     ```
   - Click "Deploy"

3. **Custom Domain (Optional)**
   - In Vercel dashboard → Settings → Domains
   - Add your custom domain

**Pros:**
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Zero configuration
- ✅ Automatic deployments on git push
- ✅ Built-in CI/CD

**Cons:**
- ❌ Serverless functions have execution time limits
- ❌ Less control over infrastructure

---

### Option 2: Railway.app

**Best for:** Full-stack apps with databases, easy deployment

#### Steps:
1. **Push to GitHub** (same as above)

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Add environment variables (same as Vercel)
   - Railway will auto-detect Next.js and deploy

**Pros:**
- ✅ Free $5/month credit
- ✅ Can host PostgreSQL database
- ✅ Easy to use
- ✅ No cold starts
- ✅ Automatic HTTPS

**Cons:**
- ❌ Limited free tier
- ❌ Can get expensive with scale

---

### Option 3: Render.com

**Best for:** Full control, affordable pricing

#### Steps:
1. **Push to GitHub**

2. **Deploy to Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Configure:
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
   - Add environment variables
   - Click "Create Web Service"

**Pros:**
- ✅ Free tier available
- ✅ PostgreSQL hosting included
- ✅ Automatic HTTPS
- ✅ Good performance

**Cons:**
- ❌ Free tier has cold starts
- ❌ Slower than Vercel

---

### Option 4: DigitalOcean App Platform

**Best for:** Scalable production apps

#### Steps:
1. **Push to GitHub**

2. **Deploy to DigitalOcean**
   - Go to [digitalocean.com/products/app-platform](https://www.digitalocean.com/products/app-platform)
   - Click "Create App"
   - Connect GitHub repository
   - Configure build settings
   - Add environment variables
   - Deploy

**Pros:**
- ✅ Reliable infrastructure
- ✅ Good pricing
- ✅ Managed PostgreSQL available
- ✅ Automatic scaling

**Cons:**
- ❌ No free tier
- ❌ More complex than Vercel

---

### Option 5: Docker + Any Cloud Provider

**Best for:** Maximum control and portability

#### Create Dockerfile:
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Deploy to:
- **AWS ECS/Fargate**
- **Google Cloud Run**
- **Azure Container Apps**
- **DigitalOcean Droplet**
- **Fly.io**

---

## Database Options

### Current: Neon PostgreSQL (Recommended)
- Already configured
- Serverless PostgreSQL
- Free tier: 0.5 GB storage
- Auto-scaling
- **Keep using this - no changes needed**

### Alternatives:
1. **Supabase** - PostgreSQL + Auth + Storage
2. **PlanetScale** - MySQL serverless
3. **Railway PostgreSQL** - If deploying on Railway
4. **Managed PostgreSQL** - AWS RDS, DigitalOcean, etc.

---

## Pre-Deployment Checklist

### 1. Update next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // For Docker deployments
  reactStrictMode: true,
}

module.exports = nextConfig
```

### 2. Environment Variables
Create `.env.production`:
```env
DATABASE_URL="your_production_database_url"
NEXTAUTH_SECRET="generate_with: openssl rand -base64 32"
NEXTAUTH_URL="https://your-production-domain.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your_email@gmail.com"
SMTP_PASSWORD="your_app_password"
SMTP_FROM="TaskGrid <your_email@gmail.com>"
```

### 3. Security
- ✅ Use strong NEXTAUTH_SECRET
- ✅ Enable HTTPS (automatic on most platforms)
- ✅ Set secure CORS policies
- ✅ Use environment variables for secrets
- ✅ Enable rate limiting (if needed)

### 4. Database
- ✅ Run migrations: `npx prisma migrate deploy`
- ✅ Seed initial data if needed
- ✅ Set up backups

### 5. Monitoring (Optional)
- Set up error tracking (Sentry)
- Set up analytics (Google Analytics, Plausible)
- Set up uptime monitoring (UptimeRobot, Better Uptime)

---

## My Recommendation

**For your use case, I recommend Vercel:**

1. **Fastest to deploy** (5 minutes)
2. **Free tier** is generous
3. **Zero configuration** needed
4. **Automatic HTTPS** and CDN
5. **Works perfectly** with Next.js
6. **Your Neon database** already works with it

### Quick Start with Vercel:
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts and add environment variables when asked
```

---

## Cost Comparison

| Platform | Free Tier | Paid Plans Start At |
|----------|-----------|---------------------|
| Vercel | ✅ Generous | $20/month |
| Railway | $5 credit/month | $5/month usage-based |
| Render | ✅ Limited | $7/month |
| DigitalOcean | ❌ None | $5/month |
| Fly.io | ✅ Limited | $3/month |

---

## Need Help?

After choosing a platform, I can help you:
1. Set up the deployment
2. Configure environment variables
3. Set up custom domains
4. Configure CI/CD pipelines
5. Set up monitoring and logging
