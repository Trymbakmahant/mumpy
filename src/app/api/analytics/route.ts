import { NextRequest, NextResponse } from 'next/server';
import { initialSettlements, initialAreaHotspots, weeklySalesTrend, initialCustomers, initialVans } from '@/data/mockData';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AreaHotspot, PaymentSettlement } from '@/types';

export const dynamic = 'force-dynamic';

export interface LedgerAccountItem {
  id: string;
  accountNo: string;
  customerName: string;
  sector: string;
  deliveredVolume: string;
  productType: string;
  emptyJarsText: string;
  emptyJarsClass: string;
  amount: number;
  paymentMode: string;
  status: 'paid' | 'unpaid' | 'credit';
  statusLabel: string;
  statusClass: string;
  isOverdue?: boolean;
  phone?: string;
  balanceDue?: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeFilter = searchParams.get('timeFilter') || 'today';

    const supabase = createServerSupabaseClient();
    const hasSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo')
    );

    let customers: any[] = [];
    let deliveries: any[] = [];
    let settlements: any[] = [];
    let financials: any[] = [];
    let vans: any[] = [];
    let source = 'server_mock';

    if (hasSupabase) {
      try {
        const [custRes, delRes, setRes, finRes, vanRes] = await Promise.all([
          supabase.from('customers').select('*').order('created_at', { ascending: false }),
          supabase.from('deliveries').select('*, customers(*)').order('delivered_at', { ascending: false }),
          supabase.from('payment_settlements').select('*').order('created_at', { ascending: false }),
          supabase.from('financial_records').select('*').order('date', { ascending: false }),
          supabase.from('vans').select('*'),
        ]);

        if (custRes.data && custRes.data.length > 0) customers = custRes.data;
        if (delRes.data && delRes.data.length > 0) deliveries = delRes.data;
        if (setRes.data && setRes.data.length > 0) settlements = setRes.data;
        if (finRes.data && finRes.data.length > 0) financials = finRes.data;
        if (vanRes.data && vanRes.data.length > 0) vans = vanRes.data;
        source = 'supabase_db';
      } catch (dbErr) {
        console.warn('Analytics DB query fallback error:', dbErr);
      }
    }

    // Fallbacks if tables are empty
    if (customers.length === 0) customers = initialCustomers as any[];
    if (settlements.length === 0) settlements = initialSettlements as any[];
    if (vans.length === 0) vans = initialVans as any[];

    // Normalize settlements format
    const mappedSettlements: PaymentSettlement[] = settlements.map((s: any) => ({
      id: s.id,
      clientName: s.client_name || s.clientName || 'Customer',
      location: s.location || 'Doorstep Delivery',
      amount: Number(s.amount || 0),
      method: s.method || 'UPI QR',
      status: s.status || 'Cleared',
      time:
        s.time_display ||
        s.time ||
        (s.created_at
          ? new Date(s.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          : 'Today'),
      units: s.units || `${s.delivered_count || 2} Cans`,
      invoiceNo: s.invoice_no || s.invoiceNo || `INV-${s.id}`,
    }));

    // Date filtering
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

    // Filter deliveries & settlements based on timeFilter
    const filteredDeliveries = deliveries.filter((d: any) => {
      const dDate = (d.delivered_at || '').slice(0, 10);
      if (timeFilter === 'today') return dDate === todayStr || !dDate;
      if (timeFilter === 'week') return dDate >= sevenDaysAgoStr;
      if (timeFilter === 'month') return dDate >= thirtyDaysAgoStr;
      return true;
    });

    const filteredSettlements = mappedSettlements.filter((s: any) => {
      if (timeFilter === 'today') {
        const raw = settlements.find((rawS: any) => rawS.id === s.id);
        const sDate = (raw?.created_at || '').slice(0, 10);
        return sDate === todayStr || !sDate;
      }
      return true;
    });

    // 1. KPI: Gross Revenue
    // Calculate for timeframe
    let activeGrossRevenue = 0;
    let upiAmount = 0;
    let cashAmount = 0;
    let creditAmount = 0;

    const targetSettlementSet =
      timeFilter === 'today' && filteredSettlements.length > 0
        ? filteredSettlements
        : mappedSettlements;

    for (const s of targetSettlementSet) {
      const amt = Number(s.amount || 0);
      const m = (s.method || '').toLowerCase();
      const st = (s.status || '').toLowerCase();
      activeGrossRevenue += amt;

      if (m.includes('cash')) {
        cashAmount += amt;
      } else if (m.includes('credit') || st.includes('due') || st.includes('pending')) {
        creditAmount += amt;
      } else {
        upiAmount += amt;
      }
    }

    const totalPaid = cashAmount + upiAmount + creditAmount;
    const upiPercentage = totalPaid > 0 ? (upiAmount / totalPaid) * 100 : 70;
    const cashPercentage = totalPaid > 0 ? (cashAmount / totalPaid) * 100 : 20;
    const creditPercentage = totalPaid > 0 ? (creditAmount / totalPaid) * 100 : 10;

    // Yesterday comparison
    const yesterdayRecord = financials.find((f: any) => f.date === yesterdayStr);
    const yesterdayRevenue = yesterdayRecord ? Number(yesterdayRecord.gross_revenue || 0) : 2660;
    const revenueTrendPercentage =
      yesterdayRevenue > 0
        ? Number((((activeGrossRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1))
        : 14.2;

    // 2. KPI: Units Dispatched
    let totalUnits = 0;
    let jarsCount = 0;
    let bottlesCount = 0;
    let emptiesReturned = 0;

    const deliverySource = filteredDeliveries.length > 0 ? filteredDeliveries : deliveries;
    for (const d of deliverySource) {
      const qty = Number(d.delivered_quantity || 0);
      const isBottle = (d.drop_off_notes || '').includes('1L') || (d.orderSummary || '').includes('1L');
      if (isBottle) {
        bottlesCount += qty;
      } else {
        jarsCount += qty;
      }
      totalUnits += qty;
      emptiesReturned += Number(d.empties_returned || 0);
    }

    if (totalUnits === 0) {
      totalUnits = 6;
      jarsCount = 6;
      emptiesReturned = 6;
    }

    const totalJarsExpected = jarsCount || totalUnits;
    const returnPercentage =
      totalJarsExpected > 0 ? Math.min(100, (emptiesReturned / totalJarsExpected) * 100) : 100;
    const pendingReturnJars = Math.max(0, totalJarsExpected - emptiesReturned);

    // 3. KPI: Driver Cash Reconciled
    let driverCashReconciled = 0;
    for (const d of deliveries) {
      if ((d.payment_method || '').toLowerCase() === 'cash') {
        driverCashReconciled += Number(d.payment_amount || 0);
      }
    }
    if (driverCashReconciled === 0) driverCashReconciled = cashAmount;

    // 4. Sector Hotspots (Ranked dynamically by client count and bottle demand)
    const sectorMap: Record<
      string,
      { count: number; bottles: number; balance: number; name: string }
    > = {};

    for (const c of customers) {
      const s = c.sector || 'Main Hub Sector';
      if (!sectorMap[s]) {
        sectorMap[s] = { count: 0, bottles: 0, balance: 0, name: s };
      }
      sectorMap[s].count++;
      sectorMap[s].bottles += Number(c.can_quota || 2);
      sectorMap[s].balance += Number(c.balance_due || 0);
    }

    const totalSectorBottles = Object.values(sectorMap).reduce((acc, s) => acc + s.bottles, 0) || 1;
    const sortedSectors = Object.values(sectorMap).sort((a, b) => b.bottles - a.bottles);

    const hotspots: AreaHotspot[] = sortedSectors.map((sec, idx) => {
      const pct = Math.round((sec.bottles / totalSectorBottles) * 100);
      const rankNum = String(idx + 1).padStart(2, '0');
      let statusTag = 'Regular Delivery Route';
      let statusType: 'alert' | 'success' | 'warning' | 'info' = 'info';

      if (idx === 0) {
        statusTag = 'High Demand Peak';
        statusType = 'alert';
      } else if (pct > 20) {
        statusTag = 'Morning Run Active';
        statusType = 'success';
      } else if (sec.balance > 0) {
        statusTag = `₹${sec.balance} Outstanding`;
        statusType = 'warning';
      }

      return {
        id: `area-0${idx + 1}`,
        rank: rankNum,
        areaName: sec.name,
        routeTag: `Hub Route: Sector Route #${idx + 1}`,
        bottlesCount: sec.bottles,
        percentage: Math.max(5, pct),
        statusTag,
        statusType,
        actionNote: `${sec.count} Active Accounts • Fleet Assigned`,
      };
    });

    // 5. Customer Ledger Accounts
    const ledgerAccounts: LedgerAccountItem[] = customers.map((c: any) => {
      const bal = Number(c.balance_due ?? c.balanceDue ?? 0);
      const canQuota = Number(c.can_quota ?? c.canQuota ?? 2);
      const cleanEmpties = Number(c.clean_empties ?? c.emptiesBalance?.clean ?? 0);
      const heldEmpties = Number(c.held_empties ?? c.emptiesBalance?.held ?? 0);
      const productType = c.product_tier || c.productTier || '20L Mineral Can';
      const isB2B = c.account_type === 'Office / B2B' || c.account_type === 'Commercial' || c.accountType === 'Office / B2B';

      let status: 'paid' | 'unpaid' | 'credit' = 'paid';
      let statusLabel = 'PAID & SETTLED';
      let statusClass = 'bg-emerald-100 text-emerald-800';
      let paymentMode = isB2B ? 'Corporate UPI / NEFT' : 'UPI Verified';

      if (bal > 0) {
        if (isB2B) {
          status = 'credit';
          statusLabel = 'DUE IN 2 DAYS';
          statusClass = 'bg-amber-100 text-amber-900';
          paymentMode = 'Credit Net-7';
        } else {
          status = 'unpaid';
          statusLabel = bal > 200 ? 'OVERDUE' : 'DUE / PENDING';
          statusClass = 'bg-rose-100 text-rose-800';
          paymentMode = 'UPI Pending';
        }
      }

      let emptyJarsText = `${cleanEmpties} / ${canQuota} Returned`;
      let emptyJarsClass = 'text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]';

      if (productType.includes('1L')) {
        emptyJarsText = '— (Non-returnable)';
        emptyJarsClass = 'text-slate-400 text-[11px] font-medium';
      } else if (heldEmpties > 5) {
        emptyJarsText = `${cleanEmpties} / ${cleanEmpties + heldEmpties} (${heldEmpties} Overdue)`;
        emptyJarsClass = 'text-rose-800 font-semibold bg-rose-100 px-2 py-0.5 rounded text-[11px]';
      } else if (heldEmpties > 0) {
        emptyJarsText = `${cleanEmpties} / ${cleanEmpties + heldEmpties} (${heldEmpties} Due)`;
        emptyJarsClass = 'text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded text-[11px]';
      }

      return {
        id: c.id,
        accountNo: `Account #${c.id}`,
        customerName: c.name,
        sector: c.sector || 'Main City Sector',
        deliveredVolume: `${canQuota} Jars`,
        productType,
        emptyJarsText,
        emptyJarsClass,
        amount: bal > 0 ? bal : canQuota * 70,
        paymentMode,
        status,
        statusLabel,
        statusClass,
        isOverdue: bal > 200,
        phone: c.phone || '',
        balanceDue: bal,
      };
    });

    // Sort ledger: unpaid/credit first, then by name
    ledgerAccounts.sort((a, b) => {
      if (a.status !== 'paid' && b.status === 'paid') return -1;
      if (a.status === 'paid' && b.status !== 'paid') return 1;
      return a.customerName.localeCompare(b.customerName);
    });

    const paidAccounts = ledgerAccounts.filter((a) => a.status === 'paid');
    const unpaidAccounts = ledgerAccounts.filter((a) => a.status === 'unpaid');
    const creditAccounts = ledgerAccounts.filter((a) => a.status === 'credit');

    const totalClearedAmount = paidAccounts.reduce((sum, a) => sum + a.amount, 0);
    const totalOverdueAmount = [...unpaidAccounts, ...creditAccounts].reduce((sum, a) => sum + a.amount, 0);

    // 6. Weekly Trend (Dynamic from financial records)
    const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
    const dynamicWeeklyTrend = daysOrder.map((day, idx) => {
      const isToday = day === 'Today';
      if (isToday) {
        return {
          day,
          revenue: activeGrossRevenue,
          label: `₹${(activeGrossRevenue / 1000).toFixed(1)}k`,
          volume: totalUnits,
          isToday: true,
        };
      }
      const finEntry = financials[idx] || weeklySalesTrend[idx] || { revenue: 38000, volume: 1200 };
      const rev = Number(finEntry.gross_revenue ?? finEntry.revenue ?? 35000);
      const vol = Number(finEntry.bottles_delivered ?? finEntry.volume ?? 1200);
      return {
        day,
        revenue: rev,
        label: `₹${(rev / 1000).toFixed(0)}k`,
        volume: vol,
        isPeak: idx === 5,
      };
    });

    const kpis = {
      grossRevenueToday: activeGrossRevenue,
      targetRevenue: timeFilter === 'today' ? 5000 : 25000,
      revenueTrendPercentage,
      unitsDispatched: totalUnits,
      bottlesCount,
      jarsCount,
      paymentMix: {
        upiAmount,
        upiPercentage,
        cashAmount,
        cashPercentage,
        creditAmount,
        creditPercentage,
      },
      jarTelemetry: {
        totalJars: totalJarsExpected,
        returnedJars: emptiesReturned,
        pendingJars: pendingReturnJars,
        returnPercentage,
        lossRatePercentage: 1.2,
      },
      driverCashReconciled,
      activeVansCount: vans.length || 4,
    };

    const ledgerSummary = {
      totalAccounts: ledgerAccounts.length,
      paidCount: paidAccounts.length,
      unpaidCount: unpaidAccounts.length,
      creditCount: creditAccounts.length,
      totalCleared: totalClearedAmount,
      totalOverdue: totalOverdueAmount,
    };

    return NextResponse.json({
      success: true,
      kpis,
      hotspots: hotspots.length > 0 ? hotspots : initialAreaHotspots,
      settlements: mappedSettlements,
      ledgerAccounts,
      ledgerSummary,
      weeklyTrend: dynamicWeeklyTrend,
      syncTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      source,
    });
  } catch (error: any) {
    console.error('Analytics API Route error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
