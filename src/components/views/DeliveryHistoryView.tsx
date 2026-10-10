'use client';

import React, { useState } from 'react';
import { initialAreaHotspots } from '../../data/mockData';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '../common/Icon';

import { AreaClientRecord, areaClientsDatabase } from '../../data/areaClientsData';
export type { AreaClientRecord };
export { areaClientsDatabase };

interface DeliveryHistoryViewProps {
  initialAreaId?: string | null;
  onBackToAnalytics?: () => void;
  onNotify?: (msg: string) => void;
}

export const DeliveryHistoryView: React.FC<DeliveryHistoryViewProps> = ({
  initialAreaId,
  onBackToAnalytics,
  onNotify,
}) => {
  const { language } = useLanguage();
  const [clientsList, setClientsList] = useState<AreaClientRecord[]>(areaClientsDatabase);
  const [selectedAreaId, setSelectedAreaId] = useState<string>(initialAreaId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialAreaId && initialAreaId !== 'all'
      ? areaClientsDatabase.find((c) => c.areaId === initialAreaId)?.id || areaClientsDatabase[0].id
      : areaClientsDatabase[0].id
  );

  React.useEffect(() => {
    fetch('/api/settlements')
      .then((res) => res.json())
      .then((data) => {
        if (data?.areaClients && data.areaClients.length > 0) {
          setClientsList(data.areaClients);
        }
      })
      .catch((err) => console.warn('Settlements API fetch:', err));
  }, []);

  const handleSettleInvoice = async (clientId: string, invoiceNo: string, amount: number) => {
    try {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settle_invoice',
          clientId,
          invoiceNo,
          amountPaid: amount,
        }),
      });
      const data = await res.json();
      if (data?.areaClients) {
        setClientsList(data.areaClients);
      }
      if (onNotify) {
        onNotify(
          language === 'hi'
            ? `चालान ${invoiceNo} (₹${amount}) सफलतापूर्वक चुकता हुआ!`
            : `Invoice ${invoiceNo} (₹${amount}) marked as settled successfully!`
        );
      }
    } catch (e) {
      console.warn('Settle invoice error:', e);
    }
  };

  const filteredClients = clientsList.filter((client) => {
    if (selectedAreaId !== 'all' && client.areaId !== selectedAreaId) return false;
    if (paymentStatusFilter !== 'All' && client.paymentStatus !== paymentStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        client.name.toLowerCase().includes(q) ||
        client.address.toLowerCase().includes(q) ||
        client.phone.includes(q) ||
        client.id.toLowerCase().includes(q) ||
        client.areaName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedClient =
    filteredClients.find((c) => c.id === selectedClientId) ||
    filteredClients[0] ||
    clientsList[0];

  const totalFilteredRevenue = filteredClients.reduce(
    (acc, c) => acc + c.history.reduce((hAcc, h) => hAcc + h.amount, 0),
    0
  );
  const totalDelivered = filteredClients.reduce((acc, c) => acc + c.dailyBottles, 0);
  const totalPendingDue = filteredClients.reduce((acc, c) => acc + c.balanceDue, 0);

  const exportClientLedger = () => {
    if (!selectedClient) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Invoice,Date,Delivered,EmptiesReturned,Amount,PaymentMethod,Status\n' +
      selectedClient.history
        .map(
          (h) =>
            `${h.invoiceNo},"${h.date}",${h.delivered},${h.emptiesReturned},${h.amount},"${h.method}","${h.status}"`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedClient.name.replace(/[^a-z0-9]/gi, '_')}_Ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onNotify) {
      onNotify(`Exported statement for ${selectedClient.name}`);
    }
  };

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
      {/* Top Breadcrumb & Action Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {onBackToAnalytics && (
              <button
                onClick={onBackToAnalytics}
                className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary transition-colors bg-secondary-fixed/50 px-2.5 py-1 rounded-xl"
              >
                <Icon name="arrow_back" size={14} />
                <span>{language === 'hi' ? '← एनालिटिक्स मैट्रिक्स पर वापस' : '← Back to Matrix'}</span>
              </button>
            )}
            <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm uppercase tracking-wider font-extrabold text-[10px]">
              {language === 'hi' ? 'वितरण और भुगतान इतिहास' : 'Delivery & Settlement Ledger'}
            </span>
          </div>

          <h1 className="text-headline-lg text-primary tracking-tight font-extrabold mt-1">
            {language === 'hi'
              ? 'उपभोक्ता डिलीवरी इतिहास और भुगतान निपटान'
              : 'Customer Delivery History & Payment Settlements'}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {language === 'hi'
              ? 'प्रत्येक क्षेत्र के उपभोक्ताओं के पिछले डिलीवरी लॉग, वापसी कैन और भुगतान इनवॉइस'
              : 'Complete transactional passbook, empty return audits, and payment settlement records'}
          </p>
        </div>

        {/* Global Stats Counter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 bg-surface-container-low rounded-2xl border border-surface-container text-right">
            <span className="text-[10px] uppercase font-bold text-outline block">
              {language === 'hi' ? 'दैनिक बोतलें' : 'Volume Delivered'}
            </span>
            <strong className="text-base text-primary font-black">
              {totalDelivered} Bottles
            </strong>
          </div>

          <div className="px-4 py-2.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">
              {language === 'hi' ? 'निपटाया गया राजस्व' : 'Settled Ledger'}
            </span>
            <strong className="text-base text-emerald-700 font-black">
              ₹{totalFilteredRevenue.toLocaleString('en-IN')}
            </strong>
          </div>

          <div className="px-4 py-2.5 bg-amber-50 rounded-2xl border border-amber-200 text-right">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">
              {language === 'hi' ? 'लंबित राशि' : 'Outstanding Balance'}
            </span>
            <strong className="text-base text-amber-800 font-black">
              ₹{totalPendingDue.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>
      </div>

      {/* Sector Quick Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-outline shrink-0 mr-1">
          {language === 'hi' ? 'क्षेत्र फ़िल्टर:' : 'Filter Sector:'}
        </span>
        <button
          onClick={() => setSelectedAreaId('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedAreaId === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          {language === 'hi' ? `सभी क्षेत्र (${areaClientsDatabase.length})` : `All Sectors (${areaClientsDatabase.length})`}
        </button>

        {initialAreaHotspots.map((area) => (
          <button
            key={area.id}
            onClick={() => setSelectedAreaId(area.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              selectedAreaId === area.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {area.rank}
            </span>
            <span>{area.areaName}</span>
          </button>
        ))}
      </div>

      {/* Main Two-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Accounts Directory in Selected Sector */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-surface-container flex flex-col gap-4">
            {/* Search and Status Dropdown */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pb-2 border-b border-surface-container">
              <div className="relative flex-1 w-full">
                <Icon name="search" className="absolute left-3 top-2.5 text-outline text-base" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'hi' ? 'उपभोक्ता या पता खोजें...' : 'Search client, phone, sector...'}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary"
              >
                <option value="All">{language === 'hi' ? 'सभी स्थितियाँ' : 'All Status'}</option>
                <option value="Cleared">{language === 'hi' ? 'निपटाया (Cleared)' : 'Cleared'}</option>
                <option value="Collected">{language === 'hi' ? 'नकद प्राप्त' : 'Collected'}</option>
                <option value="Due in 5d">{language === 'hi' ? 'लंबित (Due)' : 'Due / Pending'}</option>
              </select>
            </div>

            {/* Account List */}
            <div className="flex flex-col gap-2.5 max-h-[720px] overflow-y-auto pr-1">
              {filteredClients.map((client) => {
                const isSelected = selectedClient?.id === client.id;
                return (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'border-primary bg-primary-fixed/20 shadow-md scale-[1.01]'
                        : 'border-surface-container hover:bg-surface-container-low bg-surface-container-lowest'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-extrabold text-on-surface text-sm">
                            {client.name}
                          </h3>
                        </div>
                        <span className="text-[11px] font-semibold text-secondary block mt-0.5">
                          {client.type} • <span className="text-outline">{client.areaName}</span>
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          client.paymentStatus === 'Cleared'
                            ? 'bg-emerald-100 text-emerald-800'
                            : client.paymentStatus === 'Collected'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {client.paymentStatus}
                      </span>
                    </div>

                    <div className="text-xs text-on-surface-variant flex items-center gap-1 truncate">
                      <Icon name="location_on" size={13} className="text-outline shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-surface-container-low">
                      <span className="flex items-center gap-1 text-primary font-bold">
                        <Icon name="water_drop" size={13} />
                        {client.dailyBottles} Cans/Day
                      </span>
                      <span className="font-extrabold text-on-surface">
                        {client.balanceDue === 0 ? (
                          <span className="text-emerald-700">✓ Balance Clear</span>
                        ) : (
                          <span className="text-amber-800">₹{client.balanceDue} Due</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredClients.length === 0 && (
                <div className="p-8 text-center text-outline flex flex-col items-center gap-2">
                  <Icon name="search_off" className="text-3xl" />
                  <span className="text-xs">No accounts found matching filter.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Selected Account Full Settlement History & Ledger */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container flex flex-col gap-5">
            {selectedClient ? (
              <>
                {/* Account Profile Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-surface-container">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-primary text-white font-black flex items-center justify-center text-base shadow-sm shrink-0">
                      {selectedClient.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-black text-headline-sm text-primary">
                          {selectedClient.name}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold">
                          {selectedClient.type}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                        <Icon name="location_on" size={14} className="text-outline" />
                        <span>{selectedClient.address}</span>
                      </p>
                      <div className="flex items-center gap-3 text-xs text-outline mt-1 font-medium">
                        <span className="flex items-center gap-1">
                          <Icon name="call" size={12} />
                          {selectedClient.phone}
                        </span>
                        <span>•</span>
                        <span className="text-primary font-semibold">
                          {selectedClient.routeTag}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                    <button
                      onClick={exportClientLedger}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-low text-primary hover:bg-surface-container text-xs font-bold transition-all border border-surface-container"
                    >
                      <Icon name="download" size={15} />
                      <span>{language === 'hi' ? 'बहीखाता डाउनलोड' : 'Export Statement'}</span>
                    </button>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        selectedClient.balanceDue === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedClient.balanceDue === 0 ? '✓ No Balance Pending' : `Pending: ₹${selectedClient.balanceDue}`}
                    </span>
                  </div>
                </div>

                {/* Account Telemetry Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-surface-container-low rounded-2xl border border-surface-container">
                    <span className="text-[10px] uppercase font-bold text-outline block">
                      {language === 'hi' ? 'दैनिक कोटा' : 'Daily Can Quota'}
                    </span>
                    <strong className="text-base text-primary font-extrabold">
                      {selectedClient.dailyBottles} Cans
                    </strong>
                  </div>
                  <div className="p-3 bg-surface-container-low rounded-2xl border border-surface-container">
                    <span className="text-[10px] uppercase font-bold text-outline block">
                      {language === 'hi' ? 'अंतिम डिलीवरी' : 'Last Delivery'}
                    </span>
                    <strong className="text-xs text-secondary font-bold block mt-1">
                      {selectedClient.lastDeliveryTime}
                    </strong>
                  </div>
                  <div className="p-3 bg-surface-container-low rounded-2xl border border-surface-container">
                    <span className="text-[10px] uppercase font-bold text-outline block">
                      {language === 'hi' ? 'डिफ़ॉल्ट भुगतान मोड' : 'Payment Mode'}
                    </span>
                    <strong className="text-xs text-primary font-bold block mt-1 truncate">
                      {selectedClient.paymentMethod}
                    </strong>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                      {language === 'hi' ? 'कुल निपटान (अंतिम 5 दिन)' : 'Total Settled (5d)'}
                    </span>
                    <strong className="text-base text-emerald-700 font-extrabold">
                      ₹{selectedClient.history.reduce((a, b) => a + b.amount, 0).toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                {/* Delivery & Payment Settlements Ledger */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Icon name="receipt_long" className="text-secondary text-base" />
                      {language === 'hi' ? 'विस्तृत इनवॉइस और निपटान लॉग' : 'Detailed Delivery & Payment Audit Logs'}
                    </span>
                    <span className="text-[11px] text-outline font-medium">
                      {selectedClient.history.length} Transactions Recorded
                    </span>
                  </div>

                  <div className="flex flex-col divide-y divide-surface-container-low border border-surface-container rounded-2xl overflow-hidden shadow-xs">
                    {selectedClient.history.map((record, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-surface-container-lowest hover:bg-surface-container-low/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
                            <Icon name={record.method.includes('UPI') ? 'bolt' : record.method === 'Cash' ? 'payments' : 'menu_book'} size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-on-surface font-extrabold text-sm">
                                {record.date}
                              </strong>
                              <span className="text-[10px] font-mono text-outline bg-surface-container px-2 py-0.5 rounded-md font-bold">
                                {record.invoiceNo}
                              </span>
                            </div>
                            <span className="text-xs text-on-surface-variant block mt-0.5">
                              Unloaded: <strong className="text-primary">{record.delivered}</strong> full cans • Retrieved: <strong className="text-secondary">{record.emptiesReturned}</strong> empties
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 text-right">
                          <div>
                            <span className="font-black text-primary text-base block">
                              ₹{record.amount.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-outline block">
                              via {record.method}
                            </span>
                          </div>

                          {record.status === 'Pending' ? (
                            <button
                              type="button"
                              onClick={() => handleSettleInvoice(selectedClient.id, record.invoiceNo, record.amount)}
                              className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Icon name="check_circle" size={13} />
                              <span>{language === 'hi' ? 'चुकता करें' : 'Settle Now'}</span>
                            </button>
                          ) : (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                              ✓ {record.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit & Passbook Footer */}
                <div className="p-3.5 bg-surface-container-low rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-on-surface-variant border border-surface-container">
                  <div className="flex items-center gap-2">
                    <Icon name="verified" size={16} className="text-emerald-600" />
                    <span>
                      {language === 'hi'
                        ? 'जीएसटी अनुपालन और बैंक गेटवे से स्वचालित रूप से सत्यापित'
                        : 'Reconciled automatically against central water plant dispatch passbook'}
                    </span>
                  </div>
                  <span className="font-mono text-outline text-[11px] font-bold">
                    ACCOUNT #{selectedClient.id}-2026
                  </span>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-outline flex flex-col items-center gap-2 my-auto">
                <Icon name="person_search" className="text-4xl" />
                <span>Select an account from the left list to view delivery logs and payment settlements.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
