import { NextResponse } from 'next/server';
import { initialSettlements, initialAreaHotspots, weeklySalesTrend } from '@/data/mockData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      settlements: initialSettlements,
      hotspots: initialAreaHotspots,
      weeklyTrend: weeklySalesTrend,
      syncTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      source: 'server_dynamic',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
