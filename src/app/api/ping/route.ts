// src/app/api/ping/route.ts
import { NextResponse } from 'next/server';

// This is a simple test endpoint to verify if the Next.js backend is running.
// It should return a JSON object with a success message and the current timestamp.
// If you see a 404 error when accessing /api/ping, it means the backend is not deployed.
export async function GET() {
  try {
    return NextResponse.json({ 
      message: "Pong! The backend API route is working.",
      timestamp: new Date().toISOString() 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      message: "Error from ping endpoint.",
      error: error.message 
    }, { status: 500 });
  }
}
