import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { driverProximityQueue } from '@/data/mockData';
import { RouteStop } from '@/types';

export const dynamic = 'force-dynamic';

// In-memory dynamic store for running sessions
let serverDeliveries: RouteStop[] = [...driverProximityQueue];

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
      const { data, error } = await supabase.from('deliveries').select('*, customers(*)');
      if (data && !error && data.length > 0) {
        return NextResponse.json({ success: true, deliveries: data });
      }
    }

    return NextResponse.json({
      success: true,
      deliveries: serverDeliveries,
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
    const { customerId, deliveredCount, emptiesReturned, paymentMethod, paymentAmount, notes, driverId, vanId } = body;

    const deliveryRecord: RouteStop = {
      id: `queue-${Date.now()}`,
      customerName: body.customerName || 'Direct Doorstep Customer',
      address: body.address || 'Doorstep Delivery',
      distance: '0.05 km',
      distanceMeters: 50,
      priority: 'Standard',
      orderSummary: `${deliveredCount || 2} x 20L Mineral Cans`,
      cansToDeliver: deliveredCount || 2,
      packsToDeliver: 0,
      expectedEmpties: emptiesReturned || 2,
      balanceDue: paymentAmount || 0,
      status: 'Completed',
      etaOrCompletedTime: 'Just Now',
      gateNotes: notes,
    };

    serverDeliveries = [deliveryRecord, ...serverDeliveries];

    // Try Supabase persistence if connected
    const supabase = createServerSupabaseClient();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
      await supabase.from('deliveries').insert({
        customer_id: customerId,
        driver_id: driverId,
        van_id: vanId,
        delivered_quantity: deliveredCount,
        empties_returned: emptiesReturned,
        payment_method: paymentMethod,
        payment_amount: paymentAmount,
        drop_off_notes: notes,
        status: 'Delivered',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery recorded successfully by dynamic server',
      delivery: deliveryRecord,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
