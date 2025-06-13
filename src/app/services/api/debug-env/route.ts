import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    E2E_TEST: process.env.E2E_TEST,
    isTestEnvironment: process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true',
    timestamp: new Date().toISOString()
  });
}