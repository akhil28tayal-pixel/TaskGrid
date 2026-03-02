import { NextResponse } from 'next/server';
import { initializeApp } from '@/lib/startup';

let initialized = false;

export async function GET() {
  if (!initialized) {
    initializeApp();
    initialized = true;
  }
  return NextResponse.json({ status: 'initialized' });
}
