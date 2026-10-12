import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const conn = await connectToDatabase();
    
    // Check readyState: 1 = connected, 2 = connecting, 0 = disconnected, 3 = disconnecting
    const stateNumber = conn.connection.readyState;
    const isConnected = stateNumber === 1;

    let dbName = conn.connection.name || 'default';
    let pingResult = false;

    if (isConnected && conn.connection.db) {
      const ping = await conn.connection.db.admin().ping();
      pingResult = ping?.ok === 1;
    }

    return NextResponse.json({
      status: isConnected ? 'healthy' : 'degraded',
      database: {
        connected: isConnected,
        readyState: stateNumber,
        dbName,
        ping: pingResult ? 'pong (Atlas Active)' : 'failed',
        host: conn.connection.host,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        database: {
          connected: false,
          error: error.message || 'Unable to connect to MongoDB',
        },
      },
      { status: 500 }
    );
  }
}
