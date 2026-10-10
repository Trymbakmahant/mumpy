import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { driverProximityQueue, initialSettlements } from '@/data/mockData';
import { RouteStop, PaymentSettlement } from '@/types';

export const dynamic = 'force-dynamic';

// In-memory dynamic store for running sessions
let serverDeliveries: RouteStop[] = [...driverProximityQueue];
let serverSettlements: PaymentSettlement[] = [...initialSettlements];

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*, customers(*)')
        .order('delivered_at', { ascending: false });
      if (data && !error && data.length > 0) {
        return NextResponse.json({ success: true, deliveries: data, source: 'supabase_db' });
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
    const customerId = body.customerId || body.customer_id;
    const customerName = body.customerName || body.customer_name;
    const deliveredCount = Number(body.deliveredCount ?? body.delivered_quantity ?? body.deliveredQuantity ?? 2);
    const emptiesReturned = Number(body.emptiesReturned ?? body.empties_returned ?? 0);
    const paymentMethod = body.paymentMethod || body.payment_method || 'Cash';
    const paymentAmount = Number(body.paymentAmount ?? body.payment_amount ?? 0);
    const oldBalanceCollected = Number(body.oldBalanceCollected ?? body.old_balance_collected ?? 0);
    const currentDeliveryPaid = body.currentDeliveryPaid ?? body.current_delivery_paid ?? true;
    const creditApplied = Number(body.creditApplied ?? body.credit_applied ?? 0);
    const remainingBalance = Number(body.remainingBalance ?? body.remaining_balance ?? 0);
    const notes = body.notes || body.drop_off_notes || '';
    const driverId = body.driverId || body.driver_id;
    const vanId = body.vanId || body.van_id;

    const deliveryRecord: RouteStop = {
      id: customerId || `queue-${Date.now()}`,
      customerName: customerName || 'Direct Doorstep Customer',
      address: body.address || 'Doorstep Delivery',
      distance: '0.05 km',
      distanceMeters: 50,
      priority: 'Standard',
      orderSummary: `${deliveredCount || 2} x 20L Mineral Cans`,
      cansToDeliver: deliveredCount || 2,
      packsToDeliver: 0,
      expectedEmpties: emptiesReturned || 0,
      balanceDue: remainingBalance ?? 0,
      status: 'Completed',
      etaOrCompletedTime: 'Just Now',
      gateNotes: notes,
    };

    serverDeliveries = [deliveryRecord, ...serverDeliveries.filter((d) => d.id !== customerId)];

    const nowFormattedTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const invoiceNo = `INV-${Math.floor(9830 + Math.random() * 900)}`;

    const newSettlement: PaymentSettlement = {
      id: `settle-${Date.now()}`,
      clientName: customerName || 'Doorstep Customer',
      location: notes ? `${customerName} • ${notes}` : customerName || 'Delivery Drop',
      amount: paymentAmount || 0,
      method: (paymentMethod === 'Ledger' ? 'Monthly Ledger' : paymentMethod) as any,
      status: paymentMethod === 'Ledger' ? 'Pending' : 'Cleared',
      time: nowFormattedTime,
      units: `${deliveredCount || 2} Cans`,
      invoiceNo,
    };
    serverSettlements = [newSettlement, ...serverSettlements];

    // Try Supabase persistence if connected
    const supabase = createServerSupabaseClient();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
      try {
        // 1. Insert into deliveries table with old money breakdown
        await supabase.from('deliveries').insert({
          customer_id: customerId || null,
          customer_name: customerName || null,
          driver_id: driverId || null,
          van_id: vanId || 'van-02',
          delivered_quantity: deliveredCount || 2,
          empties_returned: emptiesReturned || 0,
          payment_method: paymentMethod === 'Ledger' ? 'Monthly Ledger' : paymentMethod || 'Cash',
          payment_amount: paymentAmount || 0,
          old_balance_collected: oldBalanceCollected || 0,
          current_delivery_paid: currentDeliveryPaid ?? true,
          credit_applied: creditApplied || 0,
          remaining_balance: remainingBalance ?? 0,
          payment_status: paymentMethod === 'Ledger' ? 'Pending' : 'Completed',
          drop_off_notes: notes || '',
          status: 'Delivered',
        });

        // 2. Update Customer balance in customers table
        if (customerId) {
          await supabase
            .from('customers')
            .update({
              balance_due: remainingBalance ?? 0,
            })
            .eq('id', customerId);
        }

        // 3. Insert into payment_settlements table for live Admin History & Feeds
        await supabase.from('payment_settlements').insert({
          id: newSettlement.id,
          invoice_no: newSettlement.invoiceNo,
          customer_id: customerId || null,
          client_name: newSettlement.clientName,
          location: newSettlement.location,
          amount: newSettlement.amount,
          method: newSettlement.method,
          status: newSettlement.status,
          units: newSettlement.units,
          delivered_count: deliveredCount || 2,
          empties_returned: emptiesReturned || 0,
          old_balance_settled: oldBalanceCollected || 0,
          time_display: nowFormattedTime,
        });

        // 4. Update Financial Records for today
        const todayStr = new Date().toISOString().slice(0, 10);
        const { data: finData } = await supabase
          .from('financial_records')
          .select('*')
          .eq('date', todayStr)
          .single();

        if (finData) {
          await supabase
            .from('financial_records')
            .update({
              gross_revenue: Number(finData.gross_revenue || 0) + Number(paymentAmount || 0),
              cash_collected:
                paymentMethod === 'Cash'
                  ? Number(finData.cash_collected || 0) + Number(paymentAmount || 0)
                  : finData.cash_collected,
              upi_collected:
                paymentMethod === 'UPI QR' || paymentMethod === 'UPI Auto'
                  ? Number(finData.upi_collected || 0) + Number(paymentAmount || 0)
                  : finData.upi_collected,
              ledger_billed:
                paymentMethod === 'Ledger' || paymentMethod === 'Monthly Ledger'
                  ? Number(finData.ledger_billed || 0) + Number(paymentAmount || 0)
                  : finData.ledger_billed,
              old_dues_recovered: Number(finData.old_dues_recovered || 0) + Number(oldBalanceCollected || 0),
              bottles_delivered: Number(finData.bottles_delivered || 0) + Number(deliveredCount || 2),
            })
            .eq('id', finData.id);
        } else {
          await supabase.from('financial_records').insert({
            date: todayStr,
            gross_revenue: paymentAmount || 0,
            cash_collected: paymentMethod === 'Cash' ? paymentAmount || 0 : 0,
            upi_collected: paymentMethod === 'UPI QR' ? paymentAmount || 0 : 0,
            ledger_billed: paymentMethod === 'Ledger' ? paymentAmount || 0 : 0,
            old_dues_recovered: oldBalanceCollected || 0,
            bottles_delivered: deliveredCount || 2,
            jars_delivered: 0,
            active_vans_count: 4,
          });
        }
      } catch (dbErr) {
        console.warn('Supabase delivery record warning:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery recorded and customer ledger adjusted successfully',
      delivery: {
        ...deliveryRecord,
        delivered_quantity: deliveredCount,
        old_balance_collected: oldBalanceCollected,
        current_delivery_paid: currentDeliveryPaid,
        credit_applied: creditApplied,
        remaining_balance: remainingBalance,
        payment_amount: paymentAmount,
        payment_method: paymentMethod,
      },
      settlement: newSettlement,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
