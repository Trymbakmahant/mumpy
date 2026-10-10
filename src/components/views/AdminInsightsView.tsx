'use client';

import React, { useState } from 'react';
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
}

export const AdminInsightsView: React.FC<AdminInsightsViewProps> = ({
  grossRevenue,
  onDeployExtraReserve,
  onOpenHistory,
}) => {
  const { t, language } = useLanguage();
  const [isGstOpen, setIsGstOpen] = useState(false);
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('Today');
  const [serverSyncTime, setServerSyncTime] = useState<string>('2 mins ago');
  const [settlements, setSettlements] = useState<PaymentSettlement[]>(initialSettlements);

  React.useEffect(() => {
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
  };

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
      {/* Top Action Bar & Financial Pulse */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm uppercase tracking-wider font-bold">
              {t('financialHub')}
            </span>
            <span className="text-body-sm text-on-surface-variant flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('realtimeLedgerSynced')}
            </span>
          </div>
          <h1 className="text-headline-lg text-primary tracking-tight font-extrabold">
            {t('revenueMatrixTitle')}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {t('revenueMatrixSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low text-secondary hover:bg-surface-container-high transition-all font-title-md shadow-sm border border-surface-container hover:scale-105 active:scale-95"
            id="btnExportCsv"
          >
            <Icon name="download" className="text-lg" />
            <span>{t('dailySalesCsv')}</span>
          </button>
          <button
            onClick={() => setIsManifestOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-title-md shadow-sm border border-surface-container hover:scale-105 active:scale-95"
            id="btnPrintManifest"
          >
            <Icon name="receipt_long" className="text-lg" />
            <span>{t('manifest')}</span>
          </button>
          <button
            onClick={() => setIsGstOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-container shadow-md transition-all font-title-md hover:scale-105 active:scale-95"
            id="btnGstReport"
          >
            <Icon name="analytics" className="text-lg" />
            <span>{t('gstSummary')}</span>
          </button>
        </div>
      </div>

      {/* Metric Overview Bento Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Revenue */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
                {t('grossRevenueToday')}
              </span>
              <span className="text-display text-primary tracking-tight font-extrabold">
                ₹{grossRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary shadow-sm">
              <Icon name="payments" className="text-2xl" />
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between border-t border-surface-container-low">
            <div className="flex items-center gap-1.5 text-secondary font-label-md font-bold">
              <Icon name="trending_up" className="text-base" />
              <span>{t('vsYesterday')}</span>
            </div>
            <span className="text-body-sm text-on-surface-variant font-medium">
              {t('target')}: ₹45,000
            </span>
          </div>
        </div>

        {/* Card 2: Total Volume Delivered */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
                {t('hydrationUnitsDispatched')}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-display text-secondary tracking-tight font-extrabold">
                  1,620
                </span>
                <span className="text-title-md text-on-surface-variant font-medium">
                  {language === 'hi' ? 'इकाइयां' : 'Units'}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-secondary-fixed flex items-center justify-center text-secondary shadow-sm">
              <Icon name="water_bottle" className="text-2xl" />
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center gap-4 text-on-surface-variant text-body-sm font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
              <span><strong>980</strong> {t('mumpyBottles')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
              <span><strong>640</strong> {t('jars20L')}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Digital vs Cash Ratio */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
                {t('paymentMix')}
              </span>
              <span className="text-display text-on-surface tracking-tight font-extrabold">
                70.3%
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-primary shadow-sm">
              <Icon name="qr_code_scanner" className="text-2xl" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden flex shadow-inner">
              <div className="h-full bg-secondary" style={{ width: '70%' }} title="UPI: ₹34,200" />
              <div className="h-full bg-secondary-container" style={{ width: '24%' }} title="Cash: ₹11,450" />
              <div className="h-full bg-amber-500" style={{ width: '6%' }} title="Credit: ₹3,000" />
            </div>
            <div className="flex justify-between items-center font-label-sm text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> UPI: ₹34.2k
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" /> {language === 'hi' ? 'कैश' : 'Cash'}: ₹11.4k
              </span>
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {language === 'hi' ? 'उधार' : 'Credit'}: ₹3k
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Avg Proximity Stop */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
                {t('avgProximityStop')}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-display text-primary tracking-tight font-extrabold">
                  18
                </span>
                <span className="text-body-sm text-on-surface-variant font-medium">
                  {language === 'hi' ? 'मिनट/डिलीवरी' : 'mins/delivery'}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-tertiary-fixed flex items-center justify-center text-tertiary shadow-sm">
              <Icon name="schedule" className="text-2xl" />
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between border-t border-surface-container-low text-xs">
            <span className="text-on-surface-variant">{t('fleetSpeedSla')}:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
              {t('optimal')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Area Telemetry + Weekly Rhythm, Right Payment Stream + SKU Quality */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Heatmap & Weekly Correlation */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* Area Water Consumption Heatmap */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
              <div>
                <h2 className="text-headline-sm text-primary font-bold">
                  {t('areaHeatmapTitle')}
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  {t('rankingDeliverySectors')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="font-label-sm text-secondary uppercase font-bold tracking-wider">
                  {t('liveRouteTelemetry')}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              {initialAreaHotspots.map((area) => (
                <div
                  key={area.id}
                  onClick={() => onOpenHistory?.(area.id)}
                  className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container hover:border-primary/50 hover:bg-surface-container-low/60 hover:shadow-md cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  title={language === 'hi' ? 'क्लिक करके इतिहास और निपटान पृष्ठ खोलें' : 'Click to open History & Settlements page for this sector'}
                >
                  <div className="flex items-start gap-3.5">
                    <span className="w-9 h-9 rounded-xl bg-primary-fixed text-primary font-extrabold flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform">
                      {area.rank}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-on-surface text-base group-hover:text-primary transition-colors flex items-center gap-1.5">
                          <span>{area.areaName}</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary text-xs font-semibold flex items-center">
                            → {language === 'hi' ? 'इतिहास पृष्ठ' : 'View History Page'}
                          </span>
                        </h4>
                        <span className="text-xs text-outline font-medium">
                          {area.routeTag}
                        </span>
                      </div>
                      <span className="inline-block mt-1 text-xs text-on-surface-variant">
                        {area.statusTag}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="text-right">
                      <div className="text-base font-extrabold text-primary">
                        {area.bottlesCount}{' '}
                        <span className="text-xs text-on-surface-variant font-normal">
                          {language === 'hi' ? 'बोतलें' : 'bottles'} ({area.percentage}%)
                        </span>
                      </div>
                      {area.actionNote && (
                        <span className="text-[11px] font-bold text-secondary">
                          {area.actionNote}
                        </span>
                      )}
                    </div>

                    <div className="w-24 bg-surface-container rounded-full h-2 overflow-hidden hidden sm:block">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${area.percentage * 3.2}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Revenue vs Bottle Volume (Bar Chart) */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-headline-sm text-primary font-bold">
                  {t('weeklyRevenueChartTitle')}
                </h3>
                <p className="text-body-sm text-on-surface-variant">
                  {t('weeklyRevenueSubtitle')}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-primary">
                  <span className="w-3 h-3 rounded bg-primary" /> {t('revenueInr')}
                </span>
                <span className="flex items-center gap-1.5 text-secondary">
                  <span className="w-3 h-3 rounded bg-secondary-container" /> {t('volumeUnits')}
                </span>
              </div>
            </div>

            {/* Interactive Bar Chart Representation */}
            <div className="pt-6 pb-2">
              <div className="grid grid-cols-7 gap-2 md:gap-4 items-end h-56 border-b border-surface-container pb-4 px-2">
                {weeklySalesTrend.map((item) => {
                  const maxRevenue = 55000;
                  const heightPercent = (item.revenue / maxRevenue) * 100;
                  const isSelected = selectedDay === item.day;

                  return (
                    <div
                      key={item.day}
                      onClick={() => setSelectedDay(item.day)}
                      className="flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
                    >
                      <span className="text-[11px] font-bold text-on-surface transition-opacity group-hover:scale-110">
                        {item.label}
                      </span>
                      <div className="w-full max-w-[48px] bg-surface-container-low rounded-t-xl overflow-hidden relative flex flex-col justify-end transition-all">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-500 ${
                            item.isToday
                              ? 'bg-primary shadow-md'
                              : item.isPeak
                              ? 'bg-secondary'
                              : isSelected
                              ? 'bg-primary-container'
                              : 'bg-surface-variant group-hover:bg-primary-fixed-dim'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          item.isToday ? 'text-primary' : 'text-on-surface-variant'
                        }`}
                      >
                        {item.day === 'Today' && language === 'hi' ? 'आज' : item.day}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-on-surface-variant gap-2 pt-2">
                <span className="flex items-center gap-1.5">
                  <Icon name="lightbulb" className="text-secondary text-base" />
                  {language === 'hi'
                    ? 'सप्ताहांत पर आवासीय क्षेत्रों में पानी की मांग +26% बढ़ जाती है।'
                    : 'Demand spikes by +26% on weekends in residential sectors.'}
                </span>
                <div className="flex gap-4 font-bold text-sm">
                  <span>{t('total7DayRevenue')}: <strong className="text-primary">₹3,08,650</strong></span>
                  <span>{t('totalVolume')}: <strong className="text-secondary">10,480 Units</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Payment Stream & SKU Quality */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Payment Stream (Live Feed) */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div>
                <h3 className="text-headline-sm text-primary font-bold">
                  {t('paymentStreamTitle')}
                </h3>
                <span className="text-xs text-on-surface-variant">
                  {language === 'hi' ? 'रीयल-टाइम भुगतान सत्यापन' : 'Real-time payment verification'}
                </span>
              </div>
              <span className="font-label-sm uppercase tracking-wider font-extrabold text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded-full">
                {t('liveFeed')}
              </span>
            </div>

            <div className="divide-y divide-surface-container-low flex flex-col">
              {settlements.map((tx) => {
                const matchedArea = initialAreaHotspots.find((a) =>
                  tx.location.toLowerCase().includes(a.areaName.toLowerCase().split(' ')[0]) ||
                  (tx.clientName.toLowerCase().includes('infosys') && a.id === 'area-01') ||
                  (tx.clientName.toLowerCase().includes('aura') && a.id === 'area-04') ||
                  (tx.clientName.toLowerCase().includes('apex') && a.id === 'area-03') ||
                  (tx.clientName.toLowerCase().includes('lakeview') && a.id === 'area-02') ||
                  (tx.clientName.toLowerCase().includes('faculty') && a.id === 'area-05')
                ) || initialAreaHotspots[0];

                return (
                  <div
                    key={tx.id}
                    onClick={() => onOpenHistory?.(matchedArea.id)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-surface-container-low/60 rounded-xl px-2 transition-all cursor-pointer group"
                    title={language === 'hi' ? 'क्लिक करके निपटान और इतिहास पृष्ठ देखें' : 'Click to inspect settlement ledger & history page'}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-primary text-sm shadow-xs group-hover:scale-105 transition-transform">
                        <Icon name={tx.method.includes('UPI') ? 'bolt' : tx.method === 'Cash' ? 'store' : 'domain'} className="text-base" />
                      </div>
                      <div>
                        <h5 className="font-bold text-on-surface text-sm leading-tight group-hover:text-primary transition-colors">
                          {tx.clientName}
                        </h5>
                        <span className="text-[11px] text-outline">
                          {tx.location}
                        </span>
                      </div>
                    </div>

                  <div className="text-right">
                    <span className="font-bold text-on-surface text-sm block">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        tx.status === 'Cleared'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tx.status === 'Collected'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tx.method} • {tx.status}
                    </span>
                  </div>
                </div>
                );
              })}
            </div>

            <button
              onClick={() => onOpenHistory ? onOpenHistory('all') : alert(language === 'hi' ? 'सभी 142 दैनिक भुगतान खुल रहे हैं।' : 'Opening all 142 daily settlements table view.')}
              className="w-full py-2.5 rounded-xl bg-surface-container-low text-primary font-bold text-xs hover:bg-surface-container transition-colors text-center"
            >
              {t('viewAllInvoices')}
            </button>
          </div>

          {/* Packaging Unit Telemetry (Mumpy Mineral Pack SKU) */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div>
                <span className="font-label-sm uppercase font-bold text-outline">
                  {language === 'hi' ? 'इन्वेंट्री टेलीमेट्री' : 'Inventory Telemetry'}
                </span>
                <h4 className="font-bold text-base text-primary">
                  {t('packagingUnitA')}
                </h4>
              </div>
              <span className="text-xs bg-primary-fixed text-primary font-bold px-2 py-0.5 rounded-full">
                {t('primarySku')}
              </span>
            </div>

            <div className="flex items-center gap-4 p-3 bg-surface-container-low rounded-2xl">
              <div className="relative w-20 h-28 rounded-xl overflow-hidden bg-white shadow-sm border border-surface-container shrink-0">
                <Image
                  src="/images/mumpy-bottles.png"
                  alt="Mumpy Packaged Drinking Water with Added Minerals"
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <strong className="text-on-surface text-sm">Mumpy Mineral Pack</strong>
                <p className="text-[11px] text-on-surface-variant leading-tight">
                  {t('mumpyMineralPackDesc')}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-outline block">{t('currentStock')}</span>
                    <strong className="text-primary font-bold">4,850 Carts</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block">{t('bufferRate')}</span>
                    <strong className="text-emerald-600 font-bold">96.4%</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-surface-container-low rounded-xl">
                <span className="text-[11px] text-outline block">{t('mineralTdsLevel')}</span>
                <strong className="text-on-surface text-sm font-extrabold">115 PPM</strong>
                <span className="text-[10px] text-secondary font-bold block">(Optimal)</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl">
                <span className="text-[11px] text-outline block">{t('phPurityMetric')}</span>
                <strong className="text-on-surface text-sm font-extrabold">7.2 Neutral</strong>
                <span className="text-[10px] text-emerald-600 font-bold block">BIS Certified</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl">
                <span className="text-[11px] text-outline block">{t('cappingVelocity')}</span>
                <strong className="text-on-surface text-sm font-extrabold">120 Bpm</strong>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl">
                <span className="text-[11px] text-outline block">{t('microFiltrationLog')}</span>
                <strong className="text-emerald-700 text-sm font-extrabold">{t('verifiedClean')}</strong>
              </div>
            </div>

            {/* Deploy Extra Reserve Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-white flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon name="water" className="text-2xl text-secondary-fixed" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-secondary-fixed font-bold block">
                    {t('bottlingReserveFleet')}
                  </span>
                  <span className="font-extrabold text-sm">
                    {t('hubAvailable')}
                  </span>
                </div>
              </div>
              <button
                onClick={onDeployExtraReserve}
                className="px-3.5 py-1.5 rounded-xl bg-secondary-container text-on-secondary-container font-extrabold text-xs hover:bg-white transition-all shadow-sm shrink-0"
              >
                {t('deployExtra')}
              </button>
            </div>
          </div>
        </div>
      </div>

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
