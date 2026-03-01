# Recurring Work Cron Job Documentation

## Overview

The recurring work cron job automatically generates projects for clients based on predefined schedules and frequencies. This eliminates the need for manual project creation for recurring work like monthly tax reviews, quarterly audits, annual filings, etc.

## How It Works

### 1. Recurring Work Setup
Staff members create recurring work records through the `/workflows` page with:
- **Client**: Which client the work is for
- **Frequency**: DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, or ANNUALLY
- **Interval**: How often (e.g., every 2 weeks, every 3 months)
- **Template**: Optional workflow template with predefined tasks
- **Auto-assign**: Whether to automatically assign tasks to a specific user
- **Start Date**: When to begin generating projects
- **End Date**: Optional end date for the recurring work

### 2. Automatic Processing
The cron job runs **every hour** and:
1. Queries for active recurring work where `nextRunDate <= current time`
2. For each due recurring work:
   - Creates a new project with the client
   - Copies tasks from the workflow template (if specified)
   - Auto-assigns tasks to the designated user (if enabled)
   - Updates `lastRunDate` to current time
   - Calculates and sets the next `nextRunDate` based on frequency

### 3. Frequency Calculation

| Frequency | Calculation |
|-----------|-------------|
| DAILY | Adds `interval` days |
| WEEKLY | Adds `interval × 7` days |
| BIWEEKLY | Adds `interval × 14` days |
| MONTHLY | Adds `interval` months |
| QUARTERLY | Adds `interval × 3` months |
| ANNUALLY | Adds `interval` years |

**Example:**
- Monthly recurring work with interval 1: Runs on the same day each month
- Quarterly recurring work with interval 1: Runs every 3 months
- Weekly recurring work with interval 2: Runs every 2 weeks

## Cron Schedule

**Schedule:** `0 * * * *` (Every hour at minute 0)

**Cron Format:** `minute hour day month dayOfWeek`

**Examples:**
- `0 * * * *` - Every hour at minute 0 (current)
- `0 0 * * *` - Daily at midnight
- `0 */6 * * *` - Every 6 hours
- `*/30 * * * *` - Every 30 minutes

To change the schedule, edit `/src/lib/cron.ts` line 193.

## API Endpoint

**URL:** `GET /api/cron/recurring-work`

**Purpose:** Manually trigger recurring work processing

**Usage:**
```bash
# Using curl
curl http://localhost:3000/api/cron/recurring-work

# Using browser
http://localhost:3000/api/cron/recurring-work
```

**Response:**
```json
{
  "success": true,
  "processed": 2,
  "successCount": 2,
  "failureCount": 0,
  "timestamp": "2026-03-01T10:00:00.000Z"
}
```

## Files

### Core Files
- `/src/lib/cron.ts` - Cron job logic and scheduling
- `/src/lib/startup.ts` - Application initialization
- `/src/app/layout.tsx` - Cron job startup integration
- `/src/app/api/cron/recurring-work/route.ts` - API endpoint

### Related Files
- `/src/app/actions/workflows.ts` - Recurring work CRUD operations
- `/src/app/(dashboard)/workflows/page.tsx` - Recurring work UI
- `/prisma/schema.prisma` - RecurringWork model definition

## Testing

### Test Script
```bash
node scripts/test-recurring-work-cron.js
```

This script:
- Checks for existing recurring work
- Creates a test recurring work if none exists
- Shows which recurring work is due for processing
- Provides instructions for manual testing

### Manual Testing Steps

1. **Create Recurring Work:**
   - Go to http://localhost:3000/workflows
   - Click "Add Recurring Work"
   - Fill in the form with a client and frequency
   - Set `startDate` to current date/time
   - Save

2. **Verify Setup:**
   ```bash
   node scripts/test-recurring-work-cron.js
   ```

3. **Trigger Manually:**
   ```bash
   curl http://localhost:3000/api/cron/recurring-work
   ```

4. **Check Results:**
   - Go to http://localhost:3000/projects
   - Look for the newly generated project
   - Project name will be: `[Recurring Work Name] - [Date]`

5. **Verify Next Run:**
   - Check the recurring work record
   - `lastRunDate` should be updated
   - `nextRunDate` should be calculated based on frequency

## Logs

The cron job produces detailed logs:

```
[CRON] Running scheduled recurring work check...
[CRON] Checking for recurring work to process...
[CRON] Found 2 recurring work item(s) to process
[CRON] Generating project for recurring work: Monthly Tax Review
[CRON] Project created: Monthly Tax Review - 3/1/2026 (ID: abc123)
[CRON] Created 5 tasks for project abc123
[CRON] Next run date set to: 2026-04-01T10:00:00.000Z
[CRON] Processing complete: 2 succeeded, 0 failed
```

## Troubleshooting

### Cron Job Not Running
**Check:**
1. Server is running: `npm run dev`
2. Logs show initialization: `[STARTUP] ✅ Application initialized successfully`
3. Cron job started: `[CRON] ✅ Recurring work cron job started`

**Solution:** Restart the server

### No Projects Generated
**Check:**
1. Recurring work exists: `node scripts/test-recurring-work-cron.js`
2. Recurring work is active: `isActive = true`
3. Next run date is in the past: `nextRunDate <= now`
4. End date hasn't passed: `endDate = null` or `endDate >= now`

**Solution:** Update the recurring work record or wait for the next scheduled run

### Projects Generated Multiple Times
**Cause:** Multiple server instances running

**Solution:** 
- Stop all server instances
- Start only one instance
- The cron job checks if it's already running to prevent duplicates

## Production Deployment

### Vercel
For Vercel deployment, use Vercel Cron:

1. Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/recurring-work",
    "schedule": "0 * * * *"
  }]
}
```

2. Add authentication to the API endpoint (uncomment in route.ts)
3. Set `CRON_SECRET` environment variable in Vercel

### Other Platforms
Use external cron services:
- **GitHub Actions** - Scheduled workflows
- **Cron-job.org** - Free cron service
- **EasyCron** - Cron as a service

Configure them to call: `https://yourdomain.com/api/cron/recurring-work`

## Security

### API Endpoint Protection
To secure the cron endpoint, uncomment the authentication check in `/src/app/api/cron/recurring-work/route.ts`:

```typescript
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

Then set `CRON_SECRET` in your `.env`:
```env
CRON_SECRET="your-secret-key-here"
```

Call the endpoint with:
```bash
curl -H "Authorization: Bearer your-secret-key-here" \
  http://localhost:3000/api/cron/recurring-work
```

## Database Schema

```prisma
model RecurringWork {
  id                String              @id @default(cuid())
  name              String
  description       String?
  projectType       ProjectType
  frequency         RecurrenceFrequency
  interval          Int                 @default(1)
  dayOfWeek         Int?
  dayOfMonth        Int?
  monthOfYear       Int?
  startDate         DateTime
  endDate           DateTime?
  nextRunDate       DateTime
  lastRunDate       DateTime?
  isActive          Boolean             @default(true)
  autoAssign        Boolean             @default(true)
  clientId          String
  templateId        String?
  assigneeId        String?
  generatedProjects Project[]
  client            Client
  template          WorkflowTemplate?
  assignee          User?
}
```

## Benefits

✅ **Automation** - No manual project creation needed
✅ **Consistency** - Same tasks and structure every time
✅ **Reliability** - Never miss recurring work deadlines
✅ **Scalability** - Handle hundreds of clients effortlessly
✅ **Flexibility** - Different frequencies for different clients
✅ **Transparency** - Full audit trail of generated projects

## Future Enhancements

Potential improvements:
- Email notifications when projects are generated
- Custom scheduling (e.g., "2nd Tuesday of each month")
- Pause/resume individual recurring work
- Bulk operations for multiple clients
- Analytics on recurring work performance
- Client-specific templates and customization
