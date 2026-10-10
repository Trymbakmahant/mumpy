import { NextResponse } from 'next/server';
import { initialSettlements, initialAreaHotspots, weeklySalesTrend } from '@/data/mockData';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settlements = [...initialSettlements];
    let source = 'server_mock';

    const supabase = createServerSupabaseClient();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
      try {
        const { data: dbSettlements, error } = await supabase
          .from('payment_settlements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && dbSettlements && dbSettlements.length > 0) {
          settlements = dbSettlements.map((s: any) => ({
            id: s.id,
            clientName: s.client_name,
            location: s.location,
            amount: Number(s.amount || 0),
            method: s.method,
            status: s.status,
            time: s.time_display || new Date(s.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            units: s.units,
            invoiceNo: s.invoice_no,
            oldBalanceSettled: Number(s.old_balance_settled || 0),
          }));
          source = 'supabase_db';
        }
      } catch (dbErr) {
        console.warn('Analytics DB query fallback:', dbErr);
      }
    }

    const totalRevenue = settlements.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const collectedToday = settlements
      .filter((s) => s.status === 'Cleared' || s.status === 'Collected')
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const outstandingBalance = settlements
      .filter((s) => s.status === 'Pending' || s.status === 'Due in 5d')
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const analyticsSummary = {
      total_revenue: totalRevenue,
      collected_today: collectedToday,
      outstanding_balance: outstandingBalance,
      settlements_count: settlements.length,
      sector_hotspots: initialAreaHotspots,
      recent_settlements: settlements,
    };

    return NextResponse.json({
      success: true,
      analytics: analyticsSummary,
      settlements,
      hotspots: initialAreaHotspots,
      weeklyTrend: weeklySalesTrend,
      syncTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      source,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
