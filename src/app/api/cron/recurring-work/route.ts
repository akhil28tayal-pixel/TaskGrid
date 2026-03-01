import { NextResponse } from 'next/server';
import { processRecurringWork } from '@/lib/cron';

// API endpoint to manually trigger recurring work processing
// Can be called by external cron services like Vercel Cron or GitHub Actions
export async function GET(request: Request) {
  try {
    // Optional: Add authentication check here for security
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('[API] Recurring work cron endpoint called');
    
    const result = await processRecurringWork();
    
    return NextResponse.json({
      message: 'Recurring work processed',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API] Error in recurring work cron endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process recurring work' 
      },
      { status: 500 }
    );
  }
}

// Allow POST as well for flexibility
export async function POST(request: Request) {
  return GET(request);
}
