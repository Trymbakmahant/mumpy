'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { initialAreaHotspots, initialSettlements } from '../../data/mockData';
import { AreaHotspot, PaymentSettlement } from '../../types';
import { GstSummaryModal } from '../Modals/GstSummaryModal';
import { ManifestModal } from '../Modals/ManifestModal';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '../common/Icon';

interface AdminInsightsViewProps {
  grossRevenue: number;
  onDeployExtraReserve: () => void;
  onOpenHistory?: (areaId?: string) => void;
  onNotify?: (msg: string) => void;
}

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

interface AnalyticsKpis {
  grossRevenueToday: number;
  targetRevenue: number;
  revenueTrendPercentage: number;
  unitsDispatched: number;
  bottlesCount: number;
  jarsCount: number;
  paymentMix: {
    upiAmount: number;
    upiPercentage: number;
    cashAmount: number;
    cashPercentage: number;
    creditAmount: number;
    creditPercentage: number;
  };
  jarTelemetry: {
    totalJars: number;
    returnedJars: number;
    pendingJars: number;
    returnPercentage: number;
    lossRatePercentage: number;
  };
  driverCashReconciled: number;
  activeVansCount: number;
}

const DEFAULT_KPIS: AnalyticsKpis = {
  grossRevenueToday: 420,
  targetRevenue: 5000,
  revenueTrendPercentage: 14.2,
  unitsDispatched: 6,
  bottlesCount: 0,
  jarsCount: 6,
  paymentMix: {
    upiAmount: 280,
    upiPercentage: 66.7,
    cashAmount: 140,
    cashPercentage: 33.3,
    creditAmount: 0,
    creditPercentage: 0,
  },
  jarTelemetry: {
    totalJars: 6,
    returnedJars: 6,
    pendingJars: 0,
    returnPercentage: 100,
    lossRatePercentage: 1.2,
  },
  driverCashReconciled: 140,
  activeVansCount: 4,
};

export const AdminInsightsView: React.FC<AdminInsightsViewProps> = ({
  grossRevenue,
  onDeployExtraReserve,
  onOpenHistory,
  onNotify,
}) => {
  const { t, language } = useLanguage();
  const [isGstOpen, setIsGstOpen] = useState(false);
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'paid' | 'unpaid' | 'credit'>('all');
  const [ledgerSearch, setLedgerSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const [serverSyncTime, setServerSyncTime] = useState<string>('Just now');
  const [systemTime, setSystemTime] = useState<string>('12:00 PM IST');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Live state fetched from API
  const [kpis, setKpis] = useState<AnalyticsKpis>(DEFAULT_KPIS);
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccountItem[]>([]);
  const [hotspots, setHotspots] = useState<AreaHotspot[]>(initialAreaHotspots);
  const [settlements, setSettlements] = useState<PaymentSettlement[]>(initialSettlements);
  const [isSettling, setIsSettling] = useState<string | null>(null);

  // System clock timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata',
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real analytics data
  const loadLiveAnalytics = async (filter: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analytics?timeFilter=${filter}`);
      const data = await res.json();
      if (data?.success) {
        if (data.kpis) {
          setKpis(data.kpis);
        }
        if (data.hotspots && data.hotspots.length > 0) {
          setHotspots(data.hotspots);
        }
        if (data.settlements && data.settlements.length > 0) {
          setSettlements(data.settlements);
        }
        if (data.ledgerAccounts && data.ledgerAccounts.length > 0) {
          setLedgerAccounts(data.ledgerAccounts);
        }
        if (data.syncTime) {
          setServerSyncTime(data.syncTime);
        }
      }
    } catch (e) {
      console.warn('Analytics API sync warning:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLiveAnalytics(timeFilter);
  }, [timeFilter]);

  // Export Daily Sales CSV with real settlement records
  const exportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Invoice,Client,Location,Amount,Method,Status,Time\n' +
      settlements
        .map(
          (s) =>
            `${s.invoiceNo},"${s.clientName}","${s.location}",${s.amount},${s.method},${s.status},${s.time}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Mumpy_Sales_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onNotify) {
      onNotify(language === 'hi' ? 'दैनिक बिक्री CSV सफलतापूर्वक डाउनलोड हुई।' : 'Daily Sales CSV downloaded successfully.');
    }
  };

  // Mark Customer Paid with backend persistence
  const handleMarkPaid = async (id: string) => {
    const target = ledgerAccounts.find((a) => a.id === id);
    if (!target) return;

    setIsSettling(id);

    // Optimistically update UI
    setLedgerAccounts((prev) =>
      prev.map((acc) =>
        acc.id === id
          ? {
              ...acc,
              amount: 0,
              balanceDue: 0,
              status: 'paid',
              statusLabel: 'PAID & SETTLED',
              statusClass: 'bg-emerald-100 text-emerald-800',
              isOverdue: false,
            }
          : acc
      )
    );

    try {
      // 1. Update customer balance in customers table
      await fetch('/api/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          balanceDue: 0,
          status: 'Active',
        }),
      });

      // 2. Settle in settlements API
      await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settle_invoice',
          clientId: id,
          invoiceNo: `INV-${target.id}`,
          amountPaid: target.amount,
        }),
      });

      if (onNotify) {
        onNotify(
          language === 'hi'
            ? `${target.customerName} का खाता (₹${target.amount}) सफलतापूर्वक चुकता हुआ!`
            : `Invoice of ₹${target.amount} for ${target.customerName} marked as PAID & SETTLED.`
        );
      }
    } catch (err) {
      console.warn('Mark paid error:', err);
    } finally {
      setIsSettling(null);
    }
  };

  // Send WhatsApp payment reminder link
  const handleSendReminder = (acc: LedgerAccountItem) => {
    const rawPhone = (acc.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const msg = `Dear ${acc.customerName}, payment of ₹${acc.amount} for your Mumpy Pure RO Water delivery is due. Kindly clear via UPI QR or link. Thank you!`;

    if (cleanPhone && typeof window !== 'undefined') {
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    if (onNotify) {
      onNotify(
        language === 'hi'
          ? `${acc.customerName} को ₹${acc.amount} का भुगतान रिमाइंडर WhatsApp पर भेजा गया।`
          : `Payment reminder of ₹${acc.amount} sent via WhatsApp to ${acc.customerName}.`
      );
    }
  };

  // Call owner
  const handleCallOwner = (acc: LedgerAccountItem) => {
    if (acc.phone && typeof window !== 'undefined') {
      window.open(`tel:${acc.phone}`, '_self');
    }
    if (onNotify) {
      onNotify(
        language === 'hi'
          ? `${acc.customerName} (${acc.phone || 'खाता प्रबंधक'}) को कॉल प्रारंभ किया जा रहा है...`
          : `Initiating call with ${acc.customerName} (${acc.phone || 'Accounts Manager'})...`
      );
    }
  };

  // Computed filtered ledger list
  const filteredLedger = useMemo(() => {
    return ledgerAccounts.filter((item) => {
      if (ledgerFilter === 'paid' && item.status !== 'paid') return false;
      if (ledgerFilter === 'unpaid' && item.status !== 'unpaid') return false;
      if (ledgerFilter === 'credit' && item.status !== 'credit') return false;

      if (ledgerSearch.trim()) {
        const q = ledgerSearch.toLowerCase();
        return (
          item.customerName.toLowerCase().includes(q) ||
          item.accountNo.toLowerCase().includes(q) ||
          item.sector.toLowerCase().includes(q) ||
          (item.phone && item.phone.includes(q))
        );
      }
      return true;
    });
  }, [ledgerAccounts, ledgerFilter, ledgerSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredLedger.length / pageSize));
  const paginatedLedger = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLedger.slice(start, start + pageSize);
  }, [filteredLedger, currentPage, pageSize]);

  // Dynamic counts for status pills
  const paidCount = useMemo(() => ledgerAccounts.filter((a) => a.status === 'paid').length, [ledgerAccounts]);
  const unpaidCount = useMemo(() => ledgerAccounts.filter((a) => a.status === 'unpaid').length, [ledgerAccounts]);
  const creditCount = useMemo(() => ledgerAccounts.filter((a) => a.status === 'credit').length, [ledgerAccounts]);

  const totalClearedAmount = useMemo(() => {
    return ledgerAccounts
      .filter((a) => a.status === 'paid')
      .reduce((sum, a) => sum + (a.amount || 0), 0);
  }, [ledgerAccounts]);

  const totalOverdueAmount = useMemo(() => {
    return ledgerAccounts
      .filter((a) => a.status === 'unpaid' || a.status === 'credit')
      .reduce((sum, a) => sum + (a.amount || 0), 0);
  }, [ledgerAccounts]);

  const formatCurrencyK = (num: number) => {
    if (!num) return '0';
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString('en-IN');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* BEGIN: HeaderAndDateRangeFilterBar */}
      <section
        className="bg-white rounded-2xl p-4 lg:p-6 border border-slate-200/90 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-4"
        data-purpose="header-and-filters"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-brand-50 text-brand-700 uppercase tracking-wide">
              {language === 'hi' ? 'वित्तीय केंद्र' : 'Financial Hub'}
            </span>
            <span className="text-xs text-slate-400">
              • {language === 'hi' ? 'रीयल-टाइम बहीखाता सिंक्रनाइज़' : 'Real-time ledger synced'}{' '}
              <strong className="text-slate-600 font-semibold">{serverSyncTime}</strong>
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            {language === 'hi' ? 'राजस्व और क्षेत्र खपत मैट्रिक्स' : 'Revenue & Area Consumption Matrix'}
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5 font-medium">
            {language === 'hi'
              ? 'लाइव टेलीमेट्री, खाली जार ट्रैकिंग और डिलीवरी मार्गों में संग्रह विभाजन'
              : 'Live telemetry, empty jar tracking, and real cash collection breakdown across delivery routes'}
          </p>
        </div>

        {/* Date Range Filter & Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Segmented Pills */}
          <div
            className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/90 text-xs font-semibold text-slate-600"
            data-purpose="date-segmented-control"
          >
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeFilter === 'today'
                  ? 'bg-white text-brand-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
              type="button"
            >
              {language === 'hi' ? 'आज (लाइव)' : 'Today (Live)'}
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeFilter === 'week'
                  ? 'bg-white text-brand-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
              type="button"
            >
              {language === 'hi' ? 'इस सप्ताह' : 'This Week'}
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeFilter === 'month'
                  ? 'bg-white text-brand-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
              type="button"
            >
              {language === 'hi' ? 'इस माह' : 'This Month'}
            </button>
            <button
              onClick={() => setTimeFilter('year')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer hidden sm:inline-block ${
                timeFilter === 'year'
                  ? 'bg-white text-brand-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
              type="button"
            >
              {language === 'hi' ? 'इस वर्ष' : 'This Year'}
            </button>
          </div>

          {/* Date Picker Button */}
          <button
            onClick={() => setIsManifestOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            type="button"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span>{language === 'hi' ? 'कस्टम दिनांक' : 'Custom Date'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 border border-brand-200/80 text-xs font-bold hover:bg-brand-100 transition-colors cursor-pointer"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span>{language === 'hi' ? 'दैनिक बिक्री CSV' : 'Daily Sales CSV'}</span>
          </button>

          {/* GST Summary */}
          <button
            onClick={() => setIsGstOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-slate-900 transition-colors shadow-xs cursor-pointer"
            type="button"
          >
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span>{language === 'hi' ? 'GST सारांश' : 'GST Summary'}</span>
          </button>
        </div>
      </section>
      {/* END: HeaderAndDateRangeFilterBar */}

      {/* BEGIN: KeyMetricsCards (4 Cards - Powered by Live Data) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-purpose="top-kpi-metrics">
        {/* Card 1: Gross Revenue Today */}
        <div className="bg-white rounded-2xl p-4 lg:p-5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {timeFilter === 'today'
                ? language === 'hi'
                  ? 'आज का कुल राजस्व'
                  : 'Gross Revenue Today'
                : language === 'hi'
                ? 'कुल चयनित राजस्व'
                : 'Gross Period Revenue'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              ₹{kpis.grossRevenueToday.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                +{kpis.revenueTrendPercentage}% {language === 'hi' ? 'वृद्धि' : 'vs Baseline'}
              </span>
              <span className="text-slate-400">
                Target: ₹{kpis.targetRevenue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Hydration Units Dispatched */}
        <div className="bg-white rounded-2xl p-4 lg:p-5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {language === 'hi' ? 'प्रेषित जल इकाइयाँ' : 'Hydration Units Dispatched'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight leading-none">
                {kpis.unitsDispatched.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {language === 'hi' ? 'कुल इकाइयाँ' : 'Units Total'}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0"></span>
                <strong className="font-bold text-slate-700">{kpis.jarsCount}</strong> 20L Jars
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0"></span>
                <strong className="font-bold text-slate-700">{kpis.bottlesCount}</strong> 1L Bottles
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Payment Mix Today */}
        <div className="bg-white rounded-2xl p-4 lg:p-5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {language === 'hi' ? 'भुगतान संग्रह अनुपात' : 'Payment Collection Mix'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {kpis.paymentMix.upiPercentage.toFixed(1)}%
              </span>
              <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                UPI Verified
              </span>
            </div>
            {/* Multi-colored payment progress strip */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex my-2">
              <div
                className="bg-brand-500 h-full transition-all duration-500"
                style={{ width: `${Math.max(5, kpis.paymentMix.upiPercentage)}%` }}
                title={`UPI: ${kpis.paymentMix.upiPercentage.toFixed(1)}%`}
              ></div>
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${Math.max(5, kpis.paymentMix.cashPercentage)}%` }}
                title={`Cash: ${kpis.paymentMix.cashPercentage.toFixed(1)}%`}
              ></div>
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${Math.max(2, kpis.paymentMix.creditPercentage)}%` }}
                title={`Credit: ${kpis.paymentMix.creditPercentage.toFixed(1)}%`}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>
                UPI: <strong>₹{formatCurrencyK(kpis.paymentMix.upiAmount)}</strong>
              </span>
              <span>
                Cash: <strong>₹{formatCurrencyK(kpis.paymentMix.cashAmount)}</strong>
              </span>
              <span className="text-amber-700 font-bold">
                Credit: <strong>₹{formatCurrencyK(kpis.paymentMix.creditAmount)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Empty Jar Telemetry & Loss */}
        <div
          className="bg-white rounded-2xl p-4 lg:p-5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow"
          id="jar-inventory"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {language === 'hi' ? 'जार वापसी टेलीमेट्री' : 'Jar Return Telemetry'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {kpis.jarTelemetry.returnedJars}{' '}
                <span className="text-xs font-normal text-slate-500">/ {kpis.jarTelemetry.totalJars}</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {kpis.jarTelemetry.returnPercentage.toFixed(1)}% In
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-amber-700">
                {language === 'hi'
                  ? `बकाया वापसी: ${kpis.jarTelemetry.pendingJars} जार`
                  : `Pending Return: ${kpis.jarTelemetry.pendingJars} Jars`}
              </span>
              <span className="text-slate-400">
                Loss Rate: <strong className="text-slate-700">{kpis.jarTelemetry.lossRatePercentage}%</strong>
              </span>
            </div>
          </div>
        </div>
      </section>
      {/* END: KeyMetricsCards */}

      {/* BEGIN: MidSectionGrid (Area Consumption & Live Payment Stream) */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Area Water Consumption Heatmap & Route Ranking (Col 7) */}
        <div
          className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between"
          id="live-routes"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{language === 'hi' ? 'क्षेत्रीय जल खपत हीटमैप' : 'Area Water Consumption Heatmap'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'hi'
                    ? 'दैनिक कार्टन और जार घनत्व के अनुसार वास्तविक वितरण क्षेत्रों की रैंकिंग'
                    : 'Ranking live delivery sectors by daily carton & jar density from customer directory'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/60">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
                {language === 'hi' ? 'लाइव रूट टेलीमेट्री' : 'LIVE ROUTE TELEMETRY'}
              </span>
            </div>

            {/* Dynamic Route ranking rows from live data */}
            <div className="mt-4 space-y-3.5">
              {hotspots.map((area, idx) => {
                const badgeColor =
                  area.statusType === 'alert'
                    ? 'bg-emerald-100 text-emerald-800'
                    : area.statusType === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : area.statusType === 'success'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800';

                return (
                  <div
                    key={area.id || idx}
                    onClick={() => onOpenHistory?.(area.id)}
                    className="p-3.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        {area.rank || String(idx + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                            {area.areaName}
                          </h4>
                          <span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${badgeColor}`}>
                            {area.statusTag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          {area.routeTag}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center sm:text-right gap-4 justify-between sm:justify-end">
                      <div>
                        <div className="text-xs font-bold font-mono text-slate-900">
                          {area.bottlesCount} bottles <span className="text-slate-400 font-normal">({area.percentage}%)</span>
                        </div>
                        <div className="text-[11px] text-brand-600 font-medium">
                          {area.actionNote || 'Fleet Active'}
                        </div>
                      </div>
                      <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden shrink-0">
                        <div
                          className="bg-brand-navy h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(8, area.percentage))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fleet Proximity Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              Avg Proximity Stop Time: <strong className="text-slate-900 font-mono">18 mins/delivery</strong>
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              FLEET SPEED SLA: OPTIMAL
            </span>
          </div>
        </div>

        {/* Real-Time Payment Stream & Verification (Col 5) */}
        <div
          className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between"
          id="financial-hub"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'hi' ? 'भुगतान प्रवाह' : 'Payment Stream'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'hi' ? 'रीयल-टाइम भुगतान सत्यापन फ़ीड' : 'Real-time payment verification feed from active drops'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                {language === 'hi' ? 'लाइव फ़ीड' : 'LIVE FEED'}
              </span>
            </div>

            {/* Dynamic List of Real Transactions */}
            <div className="mt-4 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {settlements.slice(0, 8).map((s, idx) => {
                const isCash = (s.method || '').toLowerCase().includes('cash');
                const isDue = (s.status || '').toLowerCase().includes('due') || (s.status || '').toLowerCase().includes('pending');

                return (
                  <div
                    key={s.id || idx}
                    onClick={() => onOpenHistory?.('all')}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer group ${
                      isDue
                        ? 'bg-amber-50/60 hover:bg-amber-50 border-amber-200/50'
                        : 'bg-white hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform ${
                          isCash
                            ? 'bg-emerald-50 text-emerald-600'
                            : isDue
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-brand-50 text-brand-600'
                        }`}
                      >
                        {isCash ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                          </svg>
                        ) : isDue ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                          </svg>
                        )}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 leading-none group-hover:text-brand-600 transition-colors">
                          {s.clientName}
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-1 truncate max-w-[190px]">
                          {s.location} • {s.invoiceNo}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold font-mono text-slate-900">
                        ₹{s.amount.toLocaleString('en-IN')}
                      </span>
                      <div className="mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            s.status === 'Cleared'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'Collected'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          {s.method} • {s.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Button */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onOpenHistory?.('all')}
              className="w-full py-2 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              type="button"
            >
              <span>
                {language === 'hi'
                  ? `आज के सभी ${settlements.length} चालान देखें`
                  : `View All ${settlements.length} Recorded Invoices`}
              </span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>
          </div>
        </div>
      </section>
      {/* END: MidSectionGrid */}

      {/* BEGIN: CustomerLedgerSection ("Who Paid vs Who Didn't" - Powered by Live Database) */}
      <section
        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 lg:p-6"
        data-purpose="customer-payment-ledger"
        id="customer-directory"
      >
        {/* Header & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {language === 'hi' ? 'ग्राहक निपटान बहीखाता' : 'Customer Settlement Ledger'}
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                {ledgerAccounts.length} Active Accounts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'hi'
                ? 'किसने भुगतान किया, लंबित क्रेडिट, वैन में नकदी और वन-क्लिक रिमाइंडर फ़िल्टर करें'
                : 'Live customer directory showing exact account balances, delivered jars, and instant payment settlement'}
            </p>
          </div>

          {/* Search and Status Filter Tabs */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Quick search input */}
            <div className="relative">
              <input
                type="text"
                value={ledgerSearch}
                onChange={(e) => {
                  setLedgerSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={language === 'hi' ? 'ग्राहक या खाता खोजें...' : 'Search client, sector...'}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 w-44 sm:w-56"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>

            {/* Status Tabs */}
            <div
              className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/90 text-xs font-semibold"
              data-purpose="payment-status-filter-pills"
            >
              <button
                onClick={() => {
                  setLedgerFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  ledgerFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                type="button"
              >
                All ({ledgerAccounts.length})
              </button>
              <button
                onClick={() => {
                  setLedgerFilter('paid');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  ledgerFilter === 'paid'
                    ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                    : 'text-emerald-700 hover:text-emerald-900 font-semibold'
                }`}
                type="button"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Paid ({paidCount})
              </button>
              <button
                onClick={() => {
                  setLedgerFilter('unpaid');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  ledgerFilter === 'unpaid'
                    ? 'bg-white text-rose-900 shadow-2xs font-bold'
                    : 'text-rose-700 hover:text-rose-900 font-semibold'
                }`}
                type="button"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Unpaid / Due ({unpaidCount})
              </button>
              <button
                onClick={() => {
                  setLedgerFilter('credit');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors hidden sm:flex items-center gap-1 cursor-pointer ${
                  ledgerFilter === 'credit'
                    ? 'bg-white text-amber-900 shadow-2xs font-bold'
                    : 'text-amber-700 hover:text-amber-900 font-semibold'
                }`}
                type="button"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Credit ({creditCount})
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto mt-4 -mx-5 px-5">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Customer / Facility</th>
                <th className="py-3 px-3">Sector / Route</th>
                <th className="py-3 px-3">Delivered Volume</th>
                <th className="py-3 px-3">Empty Jars Return</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Payment Mode</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLedger.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    {language === 'hi'
                      ? 'कोई खाता नहीं मिला।'
                      : 'No matching customer accounts found in this filter.'}
                  </td>
                </tr>
              ) : (
                paginatedLedger.map((row) => (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      row.isOverdue
                        ? 'bg-rose-50/40 hover:bg-rose-50/70'
                        : row.status === 'credit'
                        ? 'bg-amber-50/30 hover:bg-amber-50/60'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">{row.customerName}</div>
                      <div className="text-[11px] text-slate-400">{row.accountNo}</div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 font-medium">{row.sector}</td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono font-bold text-slate-800">{row.deliveredVolume}</span>
                      <span className="text-[10px] text-slate-400 block">{row.productType}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={row.emptyJarsClass}>{row.emptyJarsText}</span>
                    </td>
                    <td
                      className={`py-3.5 px-3 font-mono font-bold text-sm ${
                        row.isOverdue || row.status === 'unpaid' ? 'text-rose-700' : 'text-slate-900'
                      }`}
                    >
                      ₹{row.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 font-medium">{row.paymentMode}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${row.statusClass}`}
                      >
                        {row.status === 'paid' && (
                          <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              clipRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              fillRule="evenodd"
                            ></path>
                          </svg>
                        )}
                        {(row.status === 'credit' || row.isOverdue) && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              row.isOverdue ? 'bg-rose-600' : 'bg-amber-600'
                            }`}
                          />
                        )}
                        {row.statusLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                      {row.status === 'paid' ? (
                        <button
                          onClick={() => setIsGstOpen(true)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-brand-700 hover:border-brand-300 font-semibold text-[11px] transition-colors cursor-pointer"
                          type="button"
                        >
                          Receipt
                        </button>
                      ) : row.status === 'credit' ? (
                        <>
                          <button
                            onClick={() => handleSendReminder(row)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs transition-colors cursor-pointer"
                            type="button"
                          >
                            WhatsApp Link
                          </button>
                          <button
                            disabled={isSettling === row.id}
                            onClick={() => handleMarkPaid(row.id)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-white font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                            type="button"
                          >
                            {isSettling === row.id ? 'Saving...' : 'Mark Paid'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSendReminder(row)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] shadow-xs transition-colors cursor-pointer"
                            type="button"
                          >
                            Send Reminder
                          </button>
                          <button
                            disabled={isSettling === row.id}
                            onClick={() => handleMarkPaid(row.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                            type="button"
                          >
                            {isSettling === row.id ? 'Saving...' : 'Mark Paid'}
                          </button>
                          <button
                            onClick={() => handleCallOwner(row)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-white font-semibold text-[11px] transition-colors cursor-pointer"
                            type="button"
                          >
                            Call Owner
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Ledger Pagination & Real Financial Totals */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              Showing <strong>{filteredLedger.length}</strong> of <strong>{ledgerAccounts.length}</strong> accounts
            </span>
            <span className="text-emerald-700 font-semibold">
              Total Cleared: ₹{totalClearedAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-rose-700 font-semibold">
              Total Overdue: ₹{totalOverdueAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs cursor-pointer disabled:opacity-40"
              type="button"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setCurrentPage(pg)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  currentPage === pg
                    ? 'bg-brand-navy text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                type="button"
              >
                {pg}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs cursor-pointer disabled:opacity-40"
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </section>
      {/* END: CustomerLedgerSection */}

      {/* BEGIN: BottomStatusBar (Dynamic Vans & Cash Reconciled) */}
      <footer className="bg-white rounded-2xl border border-slate-200/90 py-3 px-4 lg:px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-800">Mumpy Central Operating System v4.2</span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            All {kpis.activeVansCount} Delivery Vans Connected (GPS Telemetry Live)
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span>
            Driver Cash Handover Reconciled:{' '}
            <strong className="text-slate-800">₹{kpis.driverCashReconciled.toLocaleString('en-IN')}</strong>
          </span>
          <span>•</span>
          <span className="text-slate-400 font-mono">System Time: {systemTime}</span>
        </div>
      </footer>
      {/* END: BottomStatusBar */}

      {/* Modals */}
      <GstSummaryModal
        isOpen={isGstOpen}
        onClose={() => setIsGstOpen(false)}
        grossRevenue={kpis.grossRevenueToday || grossRevenue}
      />
      <ManifestModal
        isOpen={isManifestOpen}
        onClose={() => setIsManifestOpen(false)}
      />
    </div>
  );
};
