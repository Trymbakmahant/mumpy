import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { initialSettlements, initialAreaHotspots } from '@/data/mockData';
import { areaClientsDatabase, AreaClientRecord } from '@/data/areaClientsData';
import { PaymentSettlement } from '@/types';

export const dynamic = 'force-dynamic';

let serverSettlements: PaymentSettlement[] = [...initialSettlements];
let serverAreaClients: AreaClientRecord[] = [...areaClientsDatabase];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const areaId = searchParams.get('areaId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const supabase = createServerSupabaseClient();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
      const { data: dbSettlements } = await supabase
        .from('payment_settlements')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: dbCustomers } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      let liveAreaClients = [...serverAreaClients];
      if (dbCustomers && dbCustomers.length > 0) {
        const mappedLiveClients: AreaClientRecord[] = dbCustomers.map((c: any) => {
          const bal = Number(c.balance_due || 0);
          const isIT = (c.sector || '').includes('IT');
          const isLake = (c.sector || '').includes('Lake');
          const isCivil = (c.sector || '').includes('Civil');
          const aId = isIT ? 'area-01' : isLake ? 'area-02' : isCivil ? 'area-03' : 'area-01';
          const quota = Number(c.can_quota || 2);

          return {
            id: c.id,
            name: c.name,
            type: c.account_type || 'Residential',
            areaId: aId,
            areaName: c.sector || 'Main Hub Sector',
            routeTag: `Hub Route: ${c.sector || 'Main Route'}`,
            address: c.premises || 'Doorstep Delivery',
            phone: c.phone || '',
            dailyBottles: quota,
            lastDeliveryTime: 'Today',
            paymentMethod: bal > 0 ? 'Credit / Net-7' : 'UPI QR',
            balanceDue: bal,
            paymentStatus: bal === 0 ? ('Cleared' as const) : ('Due in 5d' as const),
            history: [
              {
                date: 'Today, Oct 11',
                delivered: quota,
                emptiesReturned: Number(c.clean_empties || quota),
                amount: bal > 0 ? bal : quota * 70,
                status: bal === 0 ? ('Settled' as const) : ('Pending' as const),
                invoiceNo: `INV-${c.id}`,
                method: bal > 0 ? 'Credit / Net-7' : 'UPI QR',
              },
            ],
          };
        });

        liveAreaClients = [
          ...mappedLiveClients,
          ...serverAreaClients.filter((sc) => !mappedLiveClients.some((lc) => lc.id === sc.id)),
        ];
      }

      if (dbSettlements && dbSettlements.length > 0) {
        let mapped = dbSettlements.map((s: any) => ({
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

        if (status && status !== 'all') {
          mapped = mapped.filter((s: any) => s.status.toLowerCase() === status.toLowerCase());
        }
        if (search) {
          const q = search.toLowerCase();
          mapped = mapped.filter((s: any) => s.clientName.toLowerCase().includes(q) || s.invoiceNo.toLowerCase().includes(q));
        }

        let filteredClients = liveAreaClients;
        if (areaId && areaId !== 'all') {
          filteredClients = filteredClients.filter((c) => c.areaId === areaId);
        }
        if (status && status !== 'all') {
          filteredClients = filteredClients.filter((c) => c.paymentStatus.toLowerCase() === status.toLowerCase());
        }
        if (search) {
          const q = search.toLowerCase();
          filteredClients = filteredClients.filter(
            (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.address.toLowerCase().includes(q)
          );
        }

        return NextResponse.json({
          success: true,
          settlements: mapped,
          areaClients: filteredClients,
          hotspots: initialAreaHotspots,
          source: 'supabase_db',
        });
      }
    }

    let clientsResult = serverAreaClients;
    if (areaId && areaId !== 'all') {
      clientsResult = clientsResult.filter((c) => c.areaId === areaId);
    }
    if (status && status !== 'all') {
      clientsResult = clientsResult.filter((c) => c.paymentStatus.toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      clientsResult = clientsResult.filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.address.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      settlements: serverSettlements,
      areaClients: clientsResult,
      hotspots: initialAreaHotspots,
      source: 'server_dynamic',
      syncTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, clientId, invoiceNo, paymentMethod, amountPaid } = body;

    if (action === 'settle_invoice') {
      // 1. Update in-memory area clients
      serverAreaClients = serverAreaClients.map((client) => {
        if (client.id === clientId) {
          const updatedHistory = client.history.map((h) =>
            h.invoiceNo === invoiceNo ? { ...h, status: 'Settled' as const } : h
          );
          const hasRemainingUnsettled = updatedHistory.some((h) => h.status === 'Pending');
          const settledAmount = amountPaid || client.balanceDue || 0;
          return {
            ...client,
            history: updatedHistory,
            balanceDue: Math.max(0, client.balanceDue - settledAmount),
            paymentStatus: hasRemainingUnsettled ? ('Due in 5d' as const) : ('Cleared' as const),
          };
        }
        return client;
      });

      // 2. Update settlements stream
      serverSettlements = serverSettlements.map((s) =>
        s.invoiceNo === invoiceNo ? { ...s, status: 'Cleared' as const } : s
      );

      // 3. Try Supabase update
      const supabase = createServerSupabaseClient();
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
        try {
          await supabase
            .from('payment_settlements')
            .update({ status: 'Cleared' })
            .eq('invoice_no', invoiceNo);

          if (clientId) {
            await supabase
              .from('area_clients')
              .update({ payment_status: 'Cleared', balance_due: 0 })
              .eq('id', clientId);
          }
        } catch (dbErr) {
          console.warn('Supabase settlement update warning:', dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Invoice ${invoiceNo} settled successfully!`,
        areaClients: serverAreaClients,
        settlements: serverSettlements,
      });
    }

    // Default: Record new settlement
    const newSettlement: PaymentSettlement = {
      id: body.id || `settle-${Date.now()}`,
      clientName: body.clientName,
      location: body.location || 'Doorstep',
      amount: Number(body.amount || 0),
      method: body.method || 'Cash',
      status: body.status || 'Cleared',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      units: body.units || '2 Cans',
      invoiceNo: body.invoiceNo || `INV-${Math.floor(9850 + Math.random() * 500)}`,
    };

    serverSettlements = [newSettlement, ...serverSettlements];

    const supabase = createServerSupabaseClient();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')) {
      await supabase.from('payment_settlements').insert({
        id: newSettlement.id,
        invoice_no: newSettlement.invoiceNo,
        client_name: newSettlement.clientName,
        location: newSettlement.location,
        amount: newSettlement.amount,
        method: newSettlement.method,
        status: newSettlement.status,
        units: newSettlement.units,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Settlement recorded successfully',
      settlement: newSettlement,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
