'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { driverProximityQueue } from '../../data/mockData';
import { RouteStop } from '../../types';
import { UpiQrModal } from '../Modals/UpiQrModal';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../common/Icon';

interface DriverProximityViewProps {
  onNotify: (msg: string) => void;
  onDropCompleted: (amount: number) => void;
  onOpenCustomerRegistration?: () => void;
}

export const DriverProximityView: React.FC<DriverProximityViewProps> = ({
  onNotify,
  onDropCompleted,
  onOpenCustomerRegistration,
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isDriver2 = user?.email?.includes('driver2') || user?.full_name?.includes('Suresh');
  const driverName = isDriver2 ? 'Suresh Kumar (Driver 2)' : (user?.full_name || 'Rajesh Patil (Driver 1)');
  const vanPlate = isDriver2 ? 'MH-12-BR-3041' : (user?.van_plate || 'MH-12-BR-3042');
  const routeSector = isDriver2 ? 'Sector 14 & 15' : (user?.van_sector || 'IT Corridor - Phase 2');
  const vanNumber = isDriver2 ? 'Van #01' : 'Van #02';

  const [queue, setQueue] = useState<RouteStop[]>(driverProximityQueue);
  const [selectedStopId, setSelectedStopId] = useState<string>('queue-01');
  const [activeFilter, setActiveFilter] = useState<'all' | '500m' | '1km' | 'unserved'>('all');

  // On-Route Quick Customer Registration State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustGps, setNewCustGps] = useState('');
  const [isCapturingRouteGps, setIsCapturingRouteGps] = useState(false);
  const [routeGpsAccuracy, setRouteGpsAccuracy] = useState<number | null>(null);
  const [newCustCans, setNewCustCans] = useState<number>(2);
  const [newCustDuplicateError, setNewCustDuplicateError] = useState<string | null>(null);
  const [isSubmittingCust, setIsSubmittingCust] = useState(false);

  // Active Drop-off form state
  const selectedStop = queue.find((s) => s.id === selectedStopId) || queue[0];
  const [cansDelivered, setCansDelivered] = useState<number>(selectedStop?.cansToDeliver || 2);
  const [emptiesCollected, setEmptiesCollected] = useState<number>(selectedStop?.expectedEmpties || 2);
  const [paymentMethod, setPaymentMethod] = useState<'UPI QR' | 'Cash' | 'Ledger'>('UPI QR');
  const [gateNote, setGateNote] = useState<string>('');
  const [vanStock, setVanStock] = useState<number>(42);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [inVanCash, setInVanCash] = useState<number>(3920);
  const [dropsDone, setDropsDone] = useState<number>(28);

  const handleCaptureRouteGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      onNotify('GPS is not supported on this device/browser.');
      return;
    }
    setIsCapturingRouteGps(true);

    let bestAcc = 999999;
    let hasFinalized = false;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const acc = Math.round(accuracy);

        if (acc < bestAcc) {
          bestAcc = acc;
          const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setNewCustGps(coords);
          setRouteGpsAccuracy(acc);
          if (!newCustAddress) {
            setNewCustAddress(`GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          }
        }

        // If satellite lock achieved precision (<= 15m), lock immediately
        if (acc <= 15) {
          hasFinalized = true;
          navigator.geolocation.clearWatch(watchId);
          setIsCapturingRouteGps(false);
          onNotify(
            language === 'hi'
              ? `सटीक उपग्रह GPS कैप्चर हुआ (सटीकता: ±${acc}m)`
              : `High-precision GPS captured (±${acc}m accuracy)`
          );
        }
      },
      (err) => {
        navigator.geolocation.clearWatch(watchId);
        setIsCapturingRouteGps(false);
        if (!hasFinalized && bestAcc === 999999) {
          onNotify(
            language === 'hi'
              ? 'GPS अनुमति अस्वीकृत या सिग्नल नहीं मिला।'
              : 'GPS signal unavailable or location permission denied.'
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Timeout after 5 seconds to take best acquired fix
    setTimeout(() => {
      if (!hasFinalized) {
        hasFinalized = true;
        navigator.geolocation.clearWatch(watchId);
        setIsCapturingRouteGps(false);
        if (bestAcc < 999999) {
          onNotify(
            bestAcc > 20
              ? language === 'hi'
                ? `नेटवर्क स्थान दर्ज: ±${bestAcc}m (फ़ोन में खुली जगह पर ±5m मिलता है)`
                : `Network location locked (±${bestAcc}m). Smartphones outdoors achieve ±5m.`
              : language === 'hi'
              ? `सटीक GPS स्थान दर्ज: ±${bestAcc}m`
              : `GPS locked: ±${bestAcc}m accuracy`
          );
        }
      }
    }, 5000);
  };

  const handleRegisterCustomerOnRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewCustDuplicateError(null);
    const cleanPhone = newCustPhone.replace(/[^0-9]/g, '');
    if (!newCustName.trim() || cleanPhone.length < 10) {
      setNewCustDuplicateError(
        language === 'hi'
          ? 'कृपया वैध 10-अंकीय मोबाइल नंबर और ग्राहक का नाम दर्ज करें।'
          : 'Please enter a valid 10-digit mobile number and customer name.'
      );
      return;
    }

    setIsSubmittingCust(true);
    try {
      const assignedVanId = isDriver2 ? 'van-01' : 'van-02';
      const assignedVanPlate = isDriver2 ? 'MH-12-BR-3041' : 'MH-12-BR-3042';
      const assignedDriverName = isDriver2 ? 'Suresh Kumar (Driver 2)' : 'Rajesh Patil (Driver 1)';

      let lat = 0;
      let lng = 0;
      if (newCustGps) {
        const parts = newCustGps.split(/[, ]+/).filter(Boolean);
        lat = parseFloat(parts[0]) || 0;
        lng = parseFloat(parts[1]) || 0;
      }
      const coordsObj = {
        lat,
        lng,
        formatted: newCustGps || '',
      };

      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustName.trim(),
          phone: `+91 ${cleanPhone.slice(-10)}`,
          email: `${newCustName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}@mumpywater.com`,
          accountType: 'Residential',
          sector: routeSector,
          assignedVanId,
          assignedVanPlate,
          assignedDriverName,
          premises: newCustAddress.trim() || routeSector,
          coordinates: coordsObj,
          productTier: '20L Mineral Can',
          canQuota: newCustCans,
          cadence: 'Daily',
          slot: '07 - 10 AM',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.duplicate) {
        setNewCustDuplicateError(data.error || 'Duplicate customer registration rejected by server.');
        setIsSubmittingCust(false);
        return;
      }

      // Add to active delivery queue immediately!
      const newStop: RouteStop = {
        id: data.customer?.id || `MUM-${Math.floor(8900 + Math.random() * 900)}`,
        customerName: newCustName.trim(),
        address: newCustAddress.trim() || (newCustGps ? `GPS: ${newCustGps}` : routeSector),
        distance: '50m',
        distanceMeters: 50,
        priority: 'High Priority',
        orderSummary: `${newCustCans} x 20L Mineral Cans`,
        cansToDeliver: newCustCans,
        packsToDeliver: 0,
        expectedEmpties: 0,
        balanceDue: 0,
        status: 'Pending',
        etaOrCompletedTime: language === 'hi' ? 'ऑन-रूट स्टॉप' : 'On-Route Priority',
        phone: `+91 ${cleanPhone.slice(-10)}`,
        gateNotes: 'New on-route customer registration',
      };

      setQueue((prev) => [newStop, ...prev]);
      setSelectedStopId(newStop.id);
      setCansDelivered(newCustCans);
      setEmptiesCollected(0);
      setIsRegisterModalOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      setNewCustGps('');
      setRouteGpsAccuracy(null);
      setNewCustCans(2);
      setIsSubmittingCust(false);

      onNotify(
        language === 'hi'
          ? `ग्राहक "${newCustName}" सफलतापूर्वक पंजीकृत! आपके मार्ग में नया स्टॉप जोड़ा गया।`
          : `Customer "${newCustName}" registered successfully! Added to your delivery route as Stop #1.`
      );
    } catch (err: any) {
      console.error('Customer registration error:', err);
      setNewCustDuplicateError(err?.message || 'Server connection error during registration.');
      setIsSubmittingCust(false);
    }
  };

  const calculateAmount = () => {
    return cansDelivered * 70;
  };

  const handleConfirmDrop = () => {
    if (paymentMethod === 'UPI QR') {
      setIsUpiModalOpen(true);
      return;
    }
    finishDrop('Cash');
  };

  const finishDrop = async (method: string) => {
    const amount = calculateAmount();
    setVanStock((prev) => Math.max(0, prev - cansDelivered));
    setDropsDone((prev) => prev + 1);
    if (method === 'Cash' || method === 'UPI QR') {
      setInVanCash((prev) => prev + amount);
      onDropCompleted(amount);
    }

    setQueue((prev) =>
      prev.map((item) =>
        item.id === selectedStop.id
          ? { ...item, status: 'Completed', etaOrCompletedTime: language === 'hi' ? 'अभी-अभी' : 'Just Now' }
          : item
      )
    );

    // Call dynamic server-based API
    try {
      await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedStop.id,
          customerName: selectedStop.customerName,
          deliveredCount: cansDelivered,
          emptiesReturned: emptiesCollected,
          paymentMethod: method,
          paymentAmount: amount,
          notes: gateNote,
          vanId: isDriver2 ? 'van-01' : 'van-02',
        }),
      });
    } catch (e) {
      console.warn('Server delivery sync:', e);
    }

    onNotify(
      language === 'hi'
        ? `${selectedStop.customerName} पर डिलीवरी पूर्ण! ${cansDelivered} कैन दिए गए, ${emptiesCollected} खाली कैन मिले। तत्काल एसएमएस रसीद भेजी गई।`
        : `Drop completed at ${selectedStop.customerName}! ${cansDelivered} cans unloaded, ${emptiesCollected} empties retrieved. SMS receipt dispatched.`
    );
  };

  const filteredQueue = queue.filter((item) => {
    if (activeFilter === '500m') return item.distanceMeters <= 500;
    if (activeFilter === '1km') return item.distanceMeters <= 1000;
    if (activeFilter === 'unserved') return item.status !== 'Completed';
    return true;
  });

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
      {/* Top Van Telemetry Banner */}
      <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-md ring-2 ring-primary/20 shrink-0">
            <Image
              src="/images/avatar-rajesh.png"
              alt={driverName}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-headline-sm text-primary">
                {vanNumber} ({vanPlate})
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                {language === 'hi' ? 'सक्रिय मार्ग' : 'ACTIVE ROUTE'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-on-surface">
                <Icon name="person" className="text-base text-primary" />
                {t('pilot')}: {driverName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-secondary">
                <Icon name="near_me" className="text-base" />
                {routeSector}
              </span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded font-semibold text-[10px]">
                {language === 'hi' ? 'एकल ड्राइवर अनन्य आवंटन' : 'Exclusive Single-Driver Locked'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary-fixed flex items-center justify-center text-secondary">
              <Icon name="water_bottle" className="text-2xl" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-display text-primary font-extrabold leading-none">
                  {vanStock}
                </span>
                <span className="text-xs text-outline font-semibold">/ 100 Initial</span>
              </div>
              <span className="text-xs text-on-surface-variant block mt-1">
                {vanStock}% {language === 'hi' ? 'स्टॉक वैन में शेष' : 'stock remaining in van'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-container transition-all shadow-md"
            >
              <Icon name="person_add" className="text-base" />
              <span>{language === 'hi' ? '+ नया ग्राहक जोड़ें' : '+ Register Customer'}</span>
            </button>

            <button
              onClick={() => {
                setVanStock(100);
                onNotify(language === 'hi' ? 'मुख्य प्लांट पर वैन 100 फुल जार के साथ रीलोड हो गई।' : 'Van reloaded to 100 full 20L seal jugs at Main Plant.');
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-low text-primary font-bold text-xs hover:bg-surface-container transition-all border border-surface-container"
              title={t('reloadStock')}
            >
              <Icon name="restart_alt" className="text-base" />
              <span className="hidden sm:inline">{t('reloadStock')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Proximity Queue (Left 7 cols) & Instant Delivery Entry (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Proximity Queue */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container">
              <div>
                <div className="flex items-center gap-2">
                  <Icon name="near_me" className="text-secondary text-xl" />
                  <h3 className="text-headline-sm text-primary font-bold">
                    {t('proximityQueueTitle')}
                  </h3>
                  <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="ml-2 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-secondary-fixed text-on-secondary-fixed font-bold text-xs hover:bg-secondary hover:text-white transition-all shadow-2xs"
                    title="Register New Customer on Route"
                  >
                    <Icon name="person_add" size={14} />
                    <span>{language === 'hi' ? '+ ऑन-रूट पंजीकरण' : '+ Quick Onboard'}</span>
                  </button>
                </div>
                <span className="text-xs text-on-surface-variant">
                  {t('sortedByGps')}
                </span>
              </div>

              {/* Distance Filters */}
              <div className="flex bg-surface-container-low p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeFilter === 'all'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant'
                  }`}
                >
                  {language === 'hi' ? `सभी (${queue.length})` : `All (${queue.length})`}
                </button>
                <button
                  onClick={() => setActiveFilter('500m')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeFilter === '500m'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant'
                  }`}
                >
                  &lt; 500m
                </button>
                <button
                  onClick={() => setActiveFilter('1km')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeFilter === '1km'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant'
                  }`}
                >
                  &lt; 1km
                </button>
                <button
                  onClick={() => setActiveFilter('unserved')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeFilter === 'unserved'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant'
                  }`}
                >
                  {language === 'hi' ? 'अपूर्ण' : 'Unserved'}
                </button>
              </div>
            </div>

            {/* Queue Cards */}
            <div className="flex flex-col gap-3">
              {filteredQueue.map((item) => {
                const isSelected = selectedStop.id === item.id;
                const isCompleted = item.status === 'Completed';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedStopId(item.id);
                      setCansDelivered(item.cansToDeliver);
                      setEmptiesCollected(item.expectedEmpties);
                    }}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2.5 ${
                      isSelected
                        ? 'border-primary bg-primary-fixed/20 shadow-md scale-[1.01]'
                        : isCompleted
                        ? 'border-emerald-200 bg-emerald-50/40 opacity-70'
                        : 'border-surface-container bg-surface-container-lowest hover:bg-surface-container-low/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold">
                            {item.distance}
                          </span>
                          <span className="text-xs font-bold text-outline">
                            {item.priority}
                          </span>
                          {isCompleted && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded">
                              ✓ {language === 'hi' ? 'डिलीवर' : 'Delivered'}
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-on-surface text-base mt-1">
                          {item.customerName}
                        </h4>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <Icon name="location_on" className="text-sm text-outline" />
                          {item.address}
                        </p>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1.5">
                        <span className="text-xs font-bold text-on-surface">
                          {language === 'hi' ? 'बैलेंस:' : 'Balance:'} {item.balanceDue === 0 ? 'Clear (₹0)' : `₹${item.balanceDue} Due`}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1 rounded-xl bg-surface-container hover:bg-secondary-fixed text-secondary font-bold text-xs border border-surface-container-high transition-all flex items-center gap-1 shadow-2xs"
                            title={language === 'hi' ? 'गूगल मैप्स नेविगेशन खोलें' : 'Open GPS Navigation in Google Maps'}
                          >
                            <Icon name="navigation" size={13} />
                            <span>{language === 'hi' ? 'नेविगेट' : 'GPS'}</span>
                          </a>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStopId(item.id);
                              setCansDelivered(item.cansToDeliver);
                              setEmptiesCollected(item.expectedEmpties);
                            }}
                            className="px-3 py-1 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container shadow-xs flex items-center gap-1"
                          >
                            <Icon name="local_shipping" className="text-sm" />
                            {t('logDropOff')}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-surface-container-low flex items-center justify-between text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1 font-medium">
                        <Icon name="water_drop" className="text-secondary text-sm" />
                        {language === 'hi' ? 'ऑर्डर:' : 'Standard order:'} <strong>{item.orderSummary}</strong>
                      </span>
                      {item.gateNotes && (
                        <span className="text-outline text-[11px] italic hidden sm:inline">
                          {item.gateNotes}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Instant Delivery Entry Form */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border-2 border-primary/20 flex flex-col gap-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary tracking-wider block">
                  {language === 'hi' ? 'लाइव डिलीवरी एक्शन' : 'Live Delivery Action'}
                </span>
                <h3 className="font-extrabold text-headline-sm text-primary">
                  {t('instantDeliveryEntry')}
                </h3>
              </div>
              <span className="text-xs bg-secondary-fixed text-on-secondary-fixed font-bold px-2.5 py-1 rounded-full">
                {selectedStop.distance}
              </span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-bold text-base text-on-surface">
                  {selectedStop.customerName}
                </h4>
                <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                  <Icon name="location_on" className="text-xs text-outline shrink-0" />
                  <span>{selectedStop.address}</span>
                </p>
              </div>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedStop.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-secondary-fixed text-on-secondary-fixed font-bold text-xs hover:bg-secondary hover:text-white transition-all shadow-2xs flex items-center gap-1.5 shrink-0"
                title="Start Turn-by-Turn GPS Navigation"
              >
                <Icon name="directions" size={15} />
                <span>{language === 'hi' ? 'GPS नेविगेशन' : 'Start GPS'}</span>
              </a>
            </div>

            {/* Packaging Verification Banner */}
            <div className="p-3 bg-surface-container-low rounded-2xl flex items-center gap-3 border border-surface-container">
              <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-white shadow-xs shrink-0">
                <Image
                  src="/images/mumpy-bottles.png"
                  alt="Mumpy Bottle Verification"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="text-xs">
                <strong className="text-primary font-bold block">
                  Mumpy Pure Mineral Water
                </strong>
                <p className="text-[11px] text-on-surface-variant leading-tight">
                  {t('mumpyMineralPackDesc')}
                </p>
                <div className="flex items-center gap-2 mt-1 font-bold text-[10px]">
                  <span className="text-outline">BATCH #MP-2024-88A</span>
                  <span className="text-emerald-600">✓ {t('verifiedSealed')}</span>
                </div>
              </div>
            </div>

            {/* Counters for Delivered Cans & Empties Recovered */}
            <div className="grid grid-cols-2 gap-3 text-center">
              {/* Delivered */}
              <div className="p-3 bg-surface-container-low rounded-2xl flex flex-col gap-1.5 border border-surface-container">
                <span className="text-xs font-bold text-primary flex items-center justify-center gap-1">
                  <Icon name="water_bottle" className="text-sm" />
                  {t('deliveredCount')}
                </span>
                <span className="text-[10px] text-outline">{t('fullMumpyCans')}</span>
                <div className="flex items-center justify-between bg-white rounded-xl p-1.5 mt-1 border border-surface-container">
                  <button
                    onClick={() => setCansDelivered(Math.max(1, cansDelivered - 1))}
                    className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-base hover:bg-surface-container-high"
                  >
                    -
                  </button>
                  <span className="font-display text-xl font-extrabold text-primary">
                    {cansDelivered}
                  </span>
                  <button
                    onClick={() => setCansDelivered(cansDelivered + 1)}
                    className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-base hover:bg-surface-container-high"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Empties Returned */}
              <div className="p-3 bg-surface-container-low rounded-2xl flex flex-col gap-1.5 border border-surface-container">
                <span className="text-xs font-bold text-secondary flex items-center justify-center gap-1">
                  <Icon name="autorenew" className="text-sm" />
                  {t('emptiesReturned')}
                </span>
                <span className="text-[10px] text-outline">{t('cleanReturnableCans')}</span>
                <div className="flex items-center justify-between bg-white rounded-xl p-1.5 mt-1 border border-surface-container">
                  <button
                    onClick={() => setEmptiesCollected(Math.max(0, emptiesCollected - 1))}
                    className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-base hover:bg-surface-container-high"
                  >
                    -
                  </button>
                  <span className="font-display text-xl font-extrabold text-secondary">
                    {emptiesCollected}
                  </span>
                  <button
                    onClick={() => setEmptiesCollected(emptiesCollected + 1)}
                    className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-base hover:bg-surface-container-high"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-on-surface">{t('paymentCollection')}</span>
                <span className="font-extrabold text-primary text-sm">
                  ₹{calculateAmount().toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('Cash')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'Cash'
                      ? 'border-primary bg-primary text-white shadow-sm'
                      : 'border-surface-container bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <Icon name="payments" className="text-base" />
                  {t('cash')}
                </button>
                <button
                  onClick={() => setPaymentMethod('UPI QR')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'UPI QR'
                      ? 'border-secondary bg-secondary text-white shadow-sm'
                      : 'border-surface-container bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <Icon name="qr_code_2" className="text-base" />
                  {t('upiQr')}
                </button>
                <button
                  onClick={() => setPaymentMethod('Ledger')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'Ledger'
                      ? 'border-primary-container bg-primary-container text-white shadow-sm'
                      : 'border-surface-container bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <Icon name="menu_book" className="text-base" />
                  {t('monthlyLedger')}
                </button>
              </div>
            </div>

            {/* Drop-off Notes */}
            <div className="flex flex-col gap-1 text-xs">
              <label className="font-semibold text-on-surface">
                {language === 'hi' ? 'ड्रॉप-ऑफ नोट / सुरक्षा गार्ड संदर्भ' : 'Drop-off Note / Security Gate Reference (Optional)'}
              </label>
              <input
                type="text"
                value={gateNote}
                onChange={(e) => setGateNote(e.target.value)}
                placeholder={t('dropOffNotePlaceholder')}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-xs"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleConfirmDrop}
              className="w-full py-3 rounded-2xl bg-primary text-white font-extrabold text-sm hover:bg-primary-container shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Icon name="check_circle" className="text-lg" />
              {t('confirmAndGenerateSms')}
            </button>

            <span className="text-[11px] text-center text-outline flex items-center justify-center gap-1">
              <Icon name="sync" className="text-sm text-emerald-600" />
              {language === 'hi'
                ? 'ग्राहक सदस्यता पासबुक और प्लांट डिस्पैच बैलेंस स्वतः अपडेट होता है'
                : 'Auto-updates customer subscription passbook & plant dispatch balance'}
            </span>
          </div>
        </div>
      </div>

      {/* Driver Daily Telemetry Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
            <Icon name="schedule" className="text-xl" />
          </div>
          <div>
            <span className="text-[11px] text-outline uppercase font-bold block">{t('avgStopDuration')}</span>
            <strong className="text-on-surface text-base">14 min</strong>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <Icon name="autorenew" className="text-xl" />
          </div>
          <div>
            <span className="text-[11px] text-outline uppercase font-bold block">{t('emptiesRecovered')}</span>
            <strong className="text-on-surface text-base">38 Cans</strong>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
            <Icon name="account_balance_wallet" className="text-xl" />
          </div>
          <div>
            <span className="text-[11px] text-outline uppercase font-bold block">{t('cashUpiInVan')}</span>
            <strong className="text-on-surface text-base">₹{inVanCash.toLocaleString('en-IN')}</strong>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <Icon name="task_alt" className="text-xl" />
          </div>
          <div>
            <span className="text-[11px] text-outline uppercase font-bold block">{t('dailyDropsCompleted')}</span>
            <strong className="text-on-surface text-base">{dropsDone} / 42</strong>
          </div>
        </div>
      </div>

      {/* QR Code Modal for Doorstep UPI */}
      <UpiQrModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        customerName={selectedStop.customerName}
        amount={calculateAmount()}
        onPaymentSuccess={() => finishDrop('UPI QR')}
      />

      {/* On-Route Quick Customer Registration Modal for Driver */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-surface-container relative flex flex-col gap-4">
            <div className="flex items-start justify-between border-b border-surface-container pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
                  <Icon name="person_add" className="text-xl" />
                </div>
                <div>
                  <h3 className="font-extrabold text-title-lg text-primary">
                    {language === 'hi' ? 'ऑन-रूट नया ग्राहक पंजीकरण' : 'On-Route Customer Registration'}
                  </h3>
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    {language === 'hi'
                      ? `वाहन: ${vanNumber} (${vanPlate}) • ${routeSector}`
                      : `Route: ${vanNumber} (${vanPlate}) • ${routeSector}`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterModalOpen(false);
                  setNewCustDuplicateError(null);
                }}
                className="p-1 rounded-lg text-outline hover:bg-surface-container transition-colors"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Anti-Duplication Warning Alert */}
            {newCustDuplicateError && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-400 text-amber-950 flex flex-col gap-1 text-xs animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Icon name="warning" className="text-amber-600" size={16} />
                  <span>{language === 'hi' ? 'दोहरा पंजीकरण अस्वीकृत' : 'Duplicate Registration Blocked'}</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {newCustDuplicateError}
                </p>
              </div>
            )}

            <form onSubmit={handleRegisterCustomerOnRoute} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-on-surface">
                  {language === 'hi' ? 'ग्राहक का नाम *' : 'Customer Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface">
                    {language === 'hi' ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="e.g. 9823012345"
                    className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface">
                    {language === 'hi' ? 'प्रारंभिक 20L कैन' : 'Initial 20L Cans'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newCustCans}
                    onChange={(e) => setNewCustCans(parseInt(e.target.value) || 1)}
                    className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-on-surface">
                    {language === 'hi' ? 'पता / फ्लैट / परिसर *' : 'Address / Premises / Flat No. *'}
                  </label>
                  <button
                    type="button"
                    onClick={handleCaptureRouteGps}
                    disabled={isCapturingRouteGps}
                    className="flex items-center gap-1 text-[11px] text-secondary font-bold hover:underline"
                  >
                    {isCapturingRouteGps ? (
                      <>
                        <span className="w-3 h-3 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                        <span>{language === 'hi' ? 'GPS खोज रहा...' : 'Capturing GPS...'}</span>
                      </>
                    ) : (
                      <>
                        <Icon name="my_location" size={13} />
                        <span>{language === 'hi' ? '📍 लाइव GPS स्थान लें' : '📍 Capture Current GPS'}</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="e.g. Flat 302, Palm Heights"
                  className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              {/* GPS Coordinates & Accuracy Badge */}
              <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl border border-surface-container text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Icon name="navigation" size={14} className="text-secondary" />
                  <span className="font-medium text-on-surface">
                    {newCustGps ? (
                      <span className="font-mono font-bold text-primary">{newCustGps}</span>
                    ) : (
                      <span className="text-outline">
                        {language === 'hi' ? 'GPS निर्देशांक कैप्चर नहीं किया गया' : 'No GPS coordinates locked yet'}
                      </span>
                    )}
                  </span>
                </div>
                {routeGpsAccuracy !== null && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      routeGpsAccuracy <= 15
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {routeGpsAccuracy <= 15 ? (
                      <>
                        <span>✓</span>
                        <span>±{routeGpsAccuracy}m GPS</span>
                      </>
                    ) : (
                      <>
                        <Icon name="wifi" size={10} />
                        <span>±{routeGpsAccuracy}m Wi-Fi</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              <div className="p-2.5 bg-surface-container-low rounded-xl border border-surface-container text-[11px] text-on-surface-variant flex items-center justify-between">
                <span className="font-medium text-on-surface">
                  {language === 'hi' ? 'अनन्य असाइनमेंट:' : 'Exclusive Lock:'}
                </span>
                <span className="font-bold text-primary font-mono">
                  {vanNumber} ({vanPlate})
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterModalOpen(false);
                    setNewCustDuplicateError(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant font-bold hover:bg-surface-container-high transition-colors"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingCust}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-extrabold hover:bg-primary-container transition-all shadow-md flex items-center gap-1.5"
                >
                  {isSubmittingCust ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>{language === 'hi' ? 'पंजीकृत हो रहा है...' : 'Registering...'}</span>
                    </>
                  ) : (
                    <>
                      <Icon name="person_add" size={16} />
                      <span>{language === 'hi' ? 'पंजीकृत करें और रूट में जोड़ें' : 'Register & Add Stop'}</span>
                    </>
                  )}
                </button>
              </div>

              {onOpenCustomerRegistration && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterModalOpen(false);
                      onOpenCustomerRegistration();
                    }}
                    className="text-[11px] text-secondary font-bold hover:underline"
                  >
                    {language === 'hi' ? '→ पूरी ग्राहक निर्देशिका और सीआरएम खोलें' : '→ Open Full Customer Directory & CRM'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
