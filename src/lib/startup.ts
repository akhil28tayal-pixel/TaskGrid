// Application startup tasks
import { startRecurringWorkCron } from './cron';

let isInitialized = false;

export function initializeApp() {
  if (isInitialized) {
    console.log('[STARTUP] Application already initialized');
    return;
  }

  console.log('[STARTUP] Initializing application...');

  // Start the recurring work cron job
  startRecurringWorkCron();

  isInitialized = true;
  console.log('[STARTUP] ✅ Application initialized successfully');
}
