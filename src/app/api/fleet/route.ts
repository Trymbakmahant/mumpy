import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { initialVans } from '@/data/mockData';
import { VanTelemetry } from '@/types';

export const dynamic = 'force-dynamic';

let serverVans: VanTelemetry[] = [...initialVans];

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
      const { data, error } = await supabase.from('vans').select('*');
      if (data && !error && data.length > 0) {
        return NextResponse.json({ success: true, vans: data });
      }
    }

    return NextResponse.json({
      success: true,
      vans: serverVans,
      radarSector: 'Pune West & PCMC Industrial Belt',
      source: 'server_dynamic',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, vanId, quantity, newRoute } = body;

    if (action === 'refill') {
      serverVans = serverVans.map(v =>
        v.id === vanId
          ? {
              ...v,
              bottlesRemaining: v.bottlesRemaining + (quantity || 120),
              status: 'Active Delivery' as const,
            }
          : v
      );
      return NextResponse.json({
        success: true,
        message: `Replenishment order dispatched: +${quantity || 120} cans sent to ${vanId}`,
        vans: serverVans,
      });
    }

    if (action === 'reassign') {
      serverVans = serverVans.map(v =>
        v.id === vanId ? { ...v, route: newRoute || 'Express Sector' } : v
      );
      return NextResponse.json({
        success: true,
        message: `Route updated for ${vanId}: reassigned to ${newRoute}`,
        vans: serverVans,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
