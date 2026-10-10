'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { initialAreaHotspots, initialSettlements, weeklySalesTrend } from '../../data/mockData';
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

interface LedgerAccountItem {
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
}

const INITIAL_LEDGER_ACCOUNTS: LedgerAccountItem[] = [
  {
    id: 'CUST-4409',
    accountNo: 'Account #CUST-4409',
    customerName: 'Infosys Cafeteria #2',
    sector: 'IT Park Tech Phase 2',
    deliveredVolume: '120 Jars',
    productType: '20L RO Water',
    emptyJarsText: '120 / 120 Returned',
    emptyJarsClass: 'text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]',
    amount: 4200,
    paymentMode: 'UPI Autopay',
    status: 'paid',
    statusLabel: 'PAID & SETTLED',
    statusClass: 'bg-emerald-100 text-emerald-800',
  },
  {
    id: 'CUST-1048',
    accountNo: 'Account #CUST-1048',
    customerName: 'Lakeview Society Tower C',
    sector: 'Lakeview Loop A',
    deliveredVolume: '60 Jars',
    productType: '20L RO Water',
    emptyJarsText: '45 / 60 (15 Due)',
    emptyJarsClass: 'text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded text-[11px]',
    amount: 3000,
    paymentMode: 'Credit Net-7',
    status: 'credit',
    statusLabel: 'DUE IN 2 DAYS',
    statusClass: 'bg-amber-100 text-amber-900',
  },
  {
    id: 'CUST-7721',
    accountNo: 'Account #CUST-7721',
    customerName: 'Aura Mart & General Store',
    sector: 'High Street Commercial',
    deliveredVolume: '40 Cartons',
    productType: '1L Bottles',
    emptyJarsText: '— (Non-returnable)',
    emptyJarsClass: 'text-slate-400 text-[11px] font-medium',
    amount: 1850,
    paymentMode: 'Cash to Van #08',
    status: 'paid',
    statusLabel: 'DRIVER RECONCILED',
    statusClass: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'CUST-9011',
    accountNo: 'Account #CUST-9011',
    customerName: 'Blue Horizon Fitness Gym',
    sector: 'South Perimeter Ring',
    deliveredVolume: '18 Jars',
    productType: '20L RO Water',
    emptyJarsText: '8 / 18 (10 Overdue)',
    emptyJarsClass: 'text-rose-800 font-semibold bg-rose-100 px-2 py-0.5 rounded text-[11px]',
    amount: 1440,
    paymentMode: 'UPI Pending',
    status: 'unpaid',
    statusLabel: 'OVERDUE 4 DAYS',
    statusClass: 'bg-rose-100 text-rose-800',
    isOverdue: true,
  },
  {
    id: 'CUST-0024',
    accountNo: 'Account #CUST-0024',
    customerName: 'Apex Heart Institute',
    sector: 'Civil Lines Hospital Hub',
    deliveredVolume: '160 Jars',
    productType: '20L RO Pure',
    emptyJarsText: '160 / 160 Returned',
    emptyJarsClass: 'text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]',
    amount: 6400,
    paymentMode: 'Corporate NEFT / UPI',
    status: 'paid',
    statusLabel: 'PAID & SETTLED',
    statusClass: 'bg-emerald-100 text-emerald-800',
  },
];

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
  const [serverSyncTime, setServerSyncTime] = useState<string>('2 mins ago');
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccountItem[]>(INITIAL_LEDGER_ACCOUNTS);
  const [settlements, setSettlements] = useState<PaymentSettlement[]>(initialSettlements);
  const [systemTime, setSystemTime] = useState<string>('02:45 PM IST');

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

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => {
        if (data?.syncTime) {
          setServerSyncTime(data.syncTime);
        }
        if (data?.settlements && data.settlements.length > 0) {
          setSettlements(data.settlements);
        }
      })
      .catch((e) => console.warn('Analytics server sync:', e));
  }, []);

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
      onNotify('Daily Sales CSV downloaded successfully.');
    }
  };

  const handleMarkPaid = (id: string) => {
    setLedgerAccounts((prev) =>
      prev.map((acc) =>
        acc.id === id
          ? {
              ...acc,
              status: 'paid',
              statusLabel: 'PAID & SETTLED',
              statusClass: 'bg-emerald-100 text-emerald-800',
              isOverdue: false,
            }
          : acc
      )
    );
    const target = ledgerAccounts.find((a) => a.id === id);
    if (onNotify && target) {
      onNotify(`Invoice of ₹${target.amount} for ${target.customerName} marked as PAID & SETTLED.`);
    }
  };

  const handleSendReminder = (acc: LedgerAccountItem) => {
    if (onNotify) {
      onNotify(`Payment reminder link of ₹${acc.amount} sent via WhatsApp & SMS to ${acc.customerName}.`);
    }
  };

  const handleCallOwner = (acc: LedgerAccountItem) => {
    if (onNotify) {
      onNotify(`Initiating call with Accounts Manager of ${acc.customerName}...`);
    }
  };

  const filteredLedger = ledgerAccounts.filter((item) => {
    if (ledgerFilter === 'paid') return item.status === 'paid';
    if (ledgerFilter === 'unpaid') return item.status === 'unpaid';
    if (ledgerFilter === 'credit') return item.status === 'credit';
    return true;
  });

  const totalClearedAmount = ledgerAccounts
    .filter((a) => a.status === 'paid')
    .reduce((sum, a) => sum + a.amount, 0) + 31760; // offset for 128 accounts total

  const totalOverdueAmount = ledgerAccounts
    .filter((a) => a.status === 'unpaid' || a.status === 'credit')
    .reduce((sum, a) => sum + a.amount, 0);

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
              • {language === 'hi' ? 'रीयल-टाइम बहीखाता सिंक्रनाइज़' : 'Real-time ledger synced'} {serverSyncTime}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            {language === 'hi' ? 'राजस्व और क्षेत्र खपत मैट्रिक्स' : 'Revenue & Area Consumption Matrix'}
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5 font-medium">
            {language === 'hi'
              ? 'लाइव टेलीमेट्री, खाली जार ट्रैकिंग और डिलीवरी मार्गों में संग्रह विभाजन'
              : 'Live telemetry, empty jar tracking, and cash collection breakdown across delivery routes'}
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
              className={`px-3 py-1.5 rounded-lg transition-all ${
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
              className={`px-3 py-1.5 rounded-lg transition-all ${
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
              className={`px-3 py-1.5 rounded-lg transition-all ${
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
              className={`px-3 py-1.5 rounded-lg transition-all hidden sm:inline-block ${
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            type="button"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span>{language === 'hi' ? 'कस्टम दिनांक' : 'Custom Date'}</span>
          </button>

          {/* Export CSV / Print Manifest */}
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

      {/* BEGIN: KeyMetricsCards (4 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-purpose="top-kpi-metrics">
        {/* Card 1: Gross Revenue Today */}
        <div className="bg-white rounded-2xl p-4 lg:p-5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {language === 'hi' ? 'आज का कुल राजस्व' : 'Gross Revenue Today'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              ₹{grossRevenue.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                +14.2% vs Yesterday
              </span>
              <span className="text-slate-400">Target: ₹45,000</span>
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
                1,620
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {language === 'hi' ? 'कुल इकाइयाँ' : 'Units Total'}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0"></span>
                <strong className="font-bold text-slate-700">980</strong> 1L Bottles
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0"></span>
                <strong className="font-bold text-slate-700">640</strong> 20L Jars
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
              <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">70.3%</span>
              <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                UPI Verified
              </span>
            </div>
            {/* Multi-colored payment progress strip */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex my-2">
              <div className="bg-brand-500 h-full" style={{ width: '70.3%' }} title="UPI: 70.3%"></div>
              <div className="bg-emerald-500 h-full" style={{ width: '23.5%' }} title="Cash: 23.5%"></div>
              <div className="bg-amber-400 h-full" style={{ width: '6.2%' }} title="Credit: 6.2%"></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>UPI: <strong>₹34.2k</strong></span>
              <span>Cash: <strong>₹11.4k</strong></span>
              <span className="text-amber-700 font-bold">Credit: <strong>₹3.0k</strong></span>
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
                1,480 <span className="text-xs font-normal text-slate-500">/ 1,620</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                91.3% In
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-amber-700">
                {language === 'hi' ? 'बकाया वापसी: 140 जार' : 'Pending Return: 140 Jars'}
              </span>
              <span className="text-slate-400">
                Loss Rate: <strong className="text-slate-700">1.2%</strong>
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
                    ? 'दैनिक कार्टन और जार घनत्व के अनुसार वितरण क्षेत्रों की रैंकिंग'
                    : 'Ranking delivery sectors by daily carton & jar density'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/60">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
                {language === 'hi' ? 'लाइव रूट टेलीमेट्री' : 'LIVE ROUTE TELEMETRY'}
              </span>
            </div>

            {/* Route ranking rows */}
            <div className="mt-4 space-y-3.5">
              {/* Sector 1 */}
              <div
                onClick={() => onOpenHistory?.('area-01')}
                className="p-3.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                    01
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                        IT Park & Tech Phase 2
                      </h4>
                      <span className="px-2 py-0.2 text-[10px] rounded bg-emerald-100 text-emerald-800 font-semibold">
                        High Demand Peak
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      Hub Route: Express North #4 • 11:00 AM - 2:00 PM
                    </p>
                  </div>
                </div>
                <div className="flex items-center sm:text-right gap-4 justify-between sm:justify-end">
                  <div>
                    <div className="text-xs font-bold font-mono text-slate-900">
                      450 bottles <span className="text-slate-400 font-normal">(28%)</span>
                    </div>
                    <div className="text-[11px] text-brand-600 font-medium">
                      Auto-restock +120 Jars Dispatched
                    </div>
                  </div>
                  <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden shrink-0">
                    <div className="bg-brand-navy h-full rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>

              {/* Sector 2 */}
              <div
                onClick={() => onOpenHistory?.('area-02')}
                className="p-3.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                    02
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                        Lakeview Residential Towers
                      </h4>
                      <span className="px-2 py-0.2 text-[10px] rounded bg-blue-100 text-blue-800 font-semibold">
                        Morning Run Completed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Hub Route: Lakeside Loop A</p>
                  </div>
                </div>
                <div className="flex items-center sm:text-right gap-4 justify-between sm:justify-end">
                  <div>
                    <div className="text-xs font-bold font-mono text-slate-900">
                      380 bottles <span className="text-slate-400 font-normal">(23%)</span>
                    </div>
                    <div className="text-[11px] text-emerald-600 font-medium">Buffer: 40 Units Available</div>
                  </div>
                  <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden shrink-0">
                    <div className="bg-brand-navy h-full rounded-full" style={{ width: '72%' }}></div>
                  </div>
                </div>
              </div>

              {/* Sector 3 */}
              <div
                onClick={() => onOpenHistory?.('area-03')}
                className="p-3.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                    03
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                        Civil Lines & Care Hospitals
                      </h4>
                      <span className="px-2 py-0.2 text-[10px] rounded bg-rose-100 text-rose-800 font-semibold">
                        Strict Quality Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      Hub Route: MedCorridor Quick • TDS: 110ppm Checked
                    </p>
                  </div>
                </div>
                <div className="flex items-center sm:text-right gap-4 justify-between sm:justify-end">
                  <div>
                    <div className="text-xs font-bold font-mono text-slate-900">
                      310 bottles <span className="text-slate-400 font-normal">(19%)</span>
                    </div>
                    <div className="text-[11px] text-rose-600 font-medium">Critical Priority Stop</div>
                  </div>
                  <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden shrink-0">
                    <div className="bg-brand-navy h-full rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>

              {/* Sector 4 */}
              <div
                onClick={() => onOpenHistory?.('area-04')}
                className="p-3.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                    04
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                        High Street Commercial Plaza
                      </h4>
                      <span className="px-2 py-0.2 text-[10px] rounded bg-amber-100 text-amber-800 font-semibold">
                        Evening Refresh Pending
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Hub Route: Retail Transit #1</p>
                  </div>
                </div>
                <div className="flex items-center sm:text-right gap-4 justify-between sm:justify-end">
                  <div>
                    <div className="text-xs font-bold font-mono text-slate-900">
                      260 bottles <span className="text-slate-400 font-normal">(16%)</span>
                    </div>
                    <div className="text-[11px] text-brand-600 font-medium">Van 08 Dispatched</div>
                  </div>
                  <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden shrink-0">
                    <div className="bg-brand-navy h-full rounded-full" style={{ width: '48%' }}></div>
                  </div>
                </div>
              </div>

              {/* Sector 5 */}
              <div
                onClick={() => onOpenHistory?.('area-05')}
                className="p-3.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                    05
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                        University Campus Hostels
                      </h4>
                      <span className="px-2 py-0.2 text-[10px] rounded bg-purple-100 text-purple-800 font-semibold">
                        Bulk Discount Applied
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Hub Route: South Perimeter Ring</p>
                  </div>
                </div>
                <div className="flex items-center sm:text-right gap-4 justify-between sm:justify-end">
                  <div>
                    <div className="text-xs font-bold font-mono text-slate-900">
                      220 bottles <span className="text-slate-400 font-normal">(14%)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">Next Delivery 4:30 PM</div>
                  </div>
                  <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden shrink-0">
                    <div className="bg-brand-navy h-full rounded-full" style={{ width: '38%' }}></div>
                  </div>
                </div>
              </div>
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
                  {language === 'hi' ? 'रीयल-टाइम भुगतान सत्यापन फ़ीड' : 'Real-time payment verification feed'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                {language === 'hi' ? 'लाइव फ़ीड' : 'LIVE FEED'}
              </span>
            </div>

            {/* Mini List of Transactions */}
            <div className="mt-4 space-y-3">
              {/* Payment item 1 */}
              <div
                onClick={() => onOpenHistory?.('area-01')}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-none group-hover:text-brand-600 transition-colors">
                      Infosys Cafeteria #2
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1">IT Park • INV-9821</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold font-mono text-slate-900">₹4,200</span>
                  <div className="mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      UPI Auto • Cleared
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment item 2 */}
              <div
                onClick={() => onOpenHistory?.('area-04')}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-none group-hover:text-brand-600 transition-colors">
                      Aura Mart & General Store
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1">High Street • INV-9820</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold font-mono text-slate-900">₹1,850</span>
                  <div className="mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                      Cash • Collected
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment item 3 */}
              <div
                onClick={() => onOpenHistory?.('area-03')}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-none group-hover:text-brand-600 transition-colors">
                      Apex Heart Institute
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1">Civil Lines • INV-9819</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold font-mono text-slate-900">₹6,400</span>
                  <div className="mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      UPI QR • Cleared
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment item 4: Credit Overdue */}
              <div
                onClick={() => onOpenHistory?.('area-02')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 hover:bg-amber-50 border border-amber-200/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-none group-hover:text-amber-900 transition-colors">
                      Lakeview Society Tower C
                    </h5>
                    <p className="text-[11px] text-amber-800 mt-1">Lakeview • INV-9818</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold font-mono text-slate-900">₹3,000</span>
                  <div className="mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                      Credit Net-7 • Due in 5d
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment item 5 */}
              <div
                onClick={() => onOpenHistory?.('area-05')}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-none group-hover:text-brand-600 transition-colors">
                      Engineering Faculty Mess
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1">University • INV-9817</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold font-mono text-slate-900">₹2,100</span>
                  <div className="mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      UPI QR • Cleared
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment item 6 */}
              <div
                onClick={() => onOpenHistory?.('area-01')}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-none group-hover:text-brand-600 transition-colors">
                      Sharma Residency - Flat 402
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1">IT Corridor • INV-9816</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold font-mono text-slate-900">₹240</span>
                  <div className="mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      UPI QR • Cleared
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Button */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onOpenHistory?.('all')}
              className="w-full py-2 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              type="button"
            >
              <span>{language === 'hi' ? 'आज के सभी 142 चालान देखें' : 'View All 142 Invoices Today'}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>
          </div>
        </div>
      </section>
      {/* END: MidSectionGrid */}

      {/* BEGIN: CustomerLedgerSection ("Who Paid vs Who Didn't") */}
      <section
        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 lg:p-6"
        data-purpose="customer-payment-ledger"
        id="customer-directory"
      >
        {/* Header & Detailed Tab Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {language === 'hi' ? 'ग्राहक निपटान बहीखाता' : 'Customer Settlement Ledger'}
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                342 Active Accounts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'hi'
                ? 'किसने भुगतान किया, लंबित क्रेडिट, वैन में नकदी और वन-क्लिक रिमाइंडर फ़िल्टर करें'
                : "Filter who has paid, pending credit aging, cash held with delivery vans, and one-click reminders"}
            </p>
          </div>

          {/* "Who Paid vs Who Didn't" Filter Tabs */}
          <div className="flex items-center flex-wrap gap-2">
            <div
              className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/90 text-xs font-semibold"
              data-purpose="payment-status-filter-pills"
            >
              <button
                onClick={() => setLedgerFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  ledgerFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                type="button"
              >
                All Records
              </button>
              <button
                onClick={() => setLedgerFilter('paid')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  ledgerFilter === 'paid'
                    ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                    : 'text-emerald-700 hover:text-emerald-900 font-semibold'
                }`}
                type="button"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Paid / Cleared (128)
              </button>
              <button
                onClick={() => setLedgerFilter('unpaid')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  ledgerFilter === 'unpaid'
                    ? 'bg-white text-rose-900 shadow-2xs font-bold'
                    : 'text-rose-700 hover:text-rose-900 font-semibold'
                }`}
                type="button"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Unpaid / Due (14)
              </button>
              <button
                onClick={() => setLedgerFilter('credit')}
                className={`px-3 py-1.5 rounded-lg transition-colors hidden sm:flex items-center gap-1 cursor-pointer ${
                  ledgerFilter === 'credit'
                    ? 'bg-white text-amber-900 shadow-2xs font-bold'
                    : 'text-amber-700 hover:text-amber-900 font-semibold'
                }`}
                type="button"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Credit / Net-7 (8)
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
              {filteredLedger.map((row) => (
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
                          onClick={() => handleMarkPaid(row.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-white font-semibold text-[11px] transition-colors cursor-pointer"
                          type="button"
                        >
                          Mark Paid
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Ledger Pagination & Quick Stats Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>
              Showing <strong>{filteredLedger.length}</strong> of <strong>342</strong> accounts
            </span>
            <span className="text-emerald-700 font-semibold">
              Total Cleared Today: ₹{totalClearedAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-rose-700 font-semibold">
              Total Overdue: ₹{totalOverdueAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs cursor-pointer" type="button">
              Previous
            </button>
            <button className="px-2.5 py-1 rounded-lg bg-brand-navy text-white text-xs font-bold cursor-pointer" type="button">
              1
            </button>
            <button className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs cursor-pointer" type="button">
              2
            </button>
            <button className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs cursor-pointer" type="button">
              3
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs cursor-pointer" type="button">
              68
            </button>
            <button className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs cursor-pointer" type="button">
              Next
            </button>
          </div>
        </div>
      </section>
      {/* END: CustomerLedgerSection */}

      {/* BEGIN: BottomStatusBar */}
      <footer className="bg-white rounded-2xl border border-slate-200/90 py-3 px-4 lg:px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-800">Mumpy Central Operating System v4.2</span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            All 8 Delivery Vans Connected (GPS Telemetry Live)
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span>
            Driver Cash Handover Reconciled: <strong className="text-slate-800">₹11,400</strong>
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
        grossRevenue={grossRevenue}
      />
      <ManifestModal
        isOpen={isManifestOpen}
        onClose={() => setIsManifestOpen(false)}
      />
    </div>
  );
};
