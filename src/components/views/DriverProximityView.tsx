'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { driverProximityQueue } from '../../data/mockData';
import { RouteStop } from '../../types';
import { UpiQrModal } from '../Modals/UpiQrModal';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../common/Icon';
import { toDms, parseCoordinates, EXACT_DEFAULT_LAT, EXACT_DEFAULT_LNG, EXACT_DEFAULT_DMS } from '../../lib/geoUtils';
import { use5SecGpsCompiler } from '../../lib/use5SecGpsCompiler';

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
  const WEEK_DAYS = [
    { key: 'Mon', en: 'Mon', hi: 'सोम' },
    { key: 'Tue', en: 'Tue', hi: 'मंगल' },
    { key: 'Wed', en: 'Wed', hi: 'बुध' },
    { key: 'Thu', en: 'Thu', hi: 'गुरु' },
    { key: 'Fri', en: 'Fri', hi: 'शुक्र' },
    { key: 'Sat', en: 'Sat', hi: 'शनि' },
    { key: 'Sun', en: 'Sun', hi: 'रवि' },
  ];
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustGps, setNewCustGps] = useState('');
  const [isCapturingRouteGps, setIsCapturingRouteGps] = useState(false);
  const [routeGpsAccuracy, setRouteGpsAccuracy] = useState<number | null>(null);
  const [newCustCans, setNewCustCans] = useState<number>(2);
  const [newCustDeliveryDays, setNewCustDeliveryDays] = useState<string[]>([
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
  ]);
  const [newCustDuplicateError, setNewCustDuplicateError] = useState<string | null>(null);
  const [isSubmittingCust, setIsSubmittingCust] = useState(false);

  // 5-second multi-sample compilation GPS engine
  const gpsCompiler = use5SecGpsCompiler();

  const handleToggleDay = (dayKey: string) => {
    setNewCustDeliveryDays((prev) => {
      if (prev.includes(dayKey)) {
        return prev.filter((d) => d !== dayKey);
      } else {
        const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const next = [...prev, dayKey];
        return order.filter((d) => next.includes(d));
      }
    });
  };

  const handleToggleAllDays = () => {
    if (newCustDeliveryDays.length === 7) {
      setNewCustDeliveryDays([]);
    } else {
      setNewCustDeliveryDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    }
  };

  const getDeliveryDaysSummary = (days: string[]) => {
    if (days.length === 7) {
      return language === 'hi' ? 'प्रतिदिन (सभी 7 दिन)' : 'Every Day (All 7 Days)';
    }
    if (days.length === 6 && !days.includes('Sun')) {
      return language === 'hi' ? 'रविवार छोड़कर प्रतिदिन (सोम-शनि)' : 'Every day except Sunday (Mon - Sat)';
    }
    if (days.length === 5 && !days.includes('Sat') && !days.includes('Sun')) {
      return language === 'hi' ? 'केवल कार्यदिवस (सोम-शुक्र)' : 'Weekdays only (Mon - Fri)';
    }
    if (days.length === 0) {
      return language === 'hi' ? '⚠️ कोई दिन नहीं चुना गया' : '⚠️ No days selected';
    }
    return `${days.join(', ')} (${days.length} ${language === 'hi' ? 'दिन/सप्ताह' : 'days/wk'})`;
  };

  // Active Drop-off form state
  const selectedStop = queue.find((s) => s.id === selectedStopId) || queue[0];
  const [cansDelivered, setCansDelivered] = useState<number>(selectedStop?.cansToDeliver || 2);
  const [emptiesCollected, setEmptiesCollected] = useState<number>(selectedStop?.expectedEmpties || 2);
  const [paymentMethod, setPaymentMethod] = useState<'UPI QR' | 'Cash' | 'Ledger'>('UPI QR');
  const [payCurrentDelivery, setPayCurrentDelivery] = useState<boolean>(true);
  const [payPastBalance, setPayPastBalance] = useState<boolean>(false);
  const [pastPaymentAmount, setPastPaymentAmount] = useState<number>(0);
  const [applyCredit, setApplyCredit] = useState<boolean>(false);
  const [gateNote, setGateNote] = useState<string>('');
  const [vanStock, setVanStock] = useState<number>(42);
  const [isDropOffModalOpen, setIsDropOffModalOpen] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [inVanCash, setInVanCash] = useState<number>(3920);
  const [dropsDone, setDropsDone] = useState<number>(28);

  const handleTogglePayPastBalance = () => {
    setPayPastBalance((prev) => {
      const next = !prev;
      if (next) {
        if (!pastPaymentAmount || pastPaymentAmount === 0) {
          setPastPaymentAmount(selectedStop.balanceDue);
        }
        if (paymentMethod === 'Ledger') {
          setPaymentMethod('UPI QR');
        }
      } else {
        setPastPaymentAmount(0);
      }
      return next;
    });
  };

  const openDropOffModal = (stop: RouteStop) => {
    setSelectedStopId(stop.id);
    setCansDelivered(stop.cansToDeliver);
    setEmptiesCollected(stop.expectedEmpties);
    setPayCurrentDelivery(true);
    setPayPastBalance(false);
    setPastPaymentAmount(stop.balanceDue > 0 ? stop.balanceDue : 0);
    setApplyCredit(false);
    setIsDropOffModalOpen(true);
  };

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

    if (newCustDeliveryDays.length === 0) {
      setNewCustDuplicateError(
        language === 'hi'
          ? 'कृपया कम से कम एक डिलीवरी दिन चुनें (उदा. रविवार को छोड़कर या सभी दिन)।'
          : 'Please select at least one delivery day (e.g. All Days or custom days).'
      );
      return;
    }

    setIsSubmittingCust(true);
    try {
      const assignedVanId = isDriver2 ? 'van-01' : 'van-02';
      const assignedVanPlate = isDriver2 ? 'MH-12-BR-3041' : 'MH-12-BR-3042';
      const assignedDriverName = isDriver2 ? 'Suresh Kumar (Driver 2)' : 'Rajesh Patil (Driver 1)';

      const effectiveGps = newCustGps.trim() || gpsCompiler.gpsCoords;
      const parsed = parseCoordinates(effectiveGps);
      const coordsObj = {
        lat: parsed.lat,
        lng: parsed.lng,
        formatted: parsed.formatted,
      };

      const computedCadence =
        newCustDeliveryDays.length === 7
          ? 'Daily'
          : !newCustDeliveryDays.includes('Sun') && newCustDeliveryDays.length === 6
          ? 'Except Sunday (Mon - Sat)'
          : newCustDeliveryDays.length === 5 &&
            !newCustDeliveryDays.includes('Sat') &&
            !newCustDeliveryDays.includes('Sun')
          ? 'Weekdays (Mon - Fri)'
          : `${newCustDeliveryDays.join(', ')}`;

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
          cadence: computedCadence,
          deliveryDays: newCustDeliveryDays,
          slot: '07 - 10 AM',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.duplicate) {
        setNewCustDuplicateError(data.error || 'Duplicate customer registration rejected by server.');
        setIsSubmittingCust(false);
        return;
      }

      const scheduleLabel =
        newCustDeliveryDays.length === 7
          ? (language === 'hi' ? 'प्रतिदिन (Mon-Sun)' : 'Daily')
          : !newCustDeliveryDays.includes('Sun') && newCustDeliveryDays.length === 6
          ? (language === 'hi' ? 'सोम-शनि (रविवार बंद)' : 'Mon-Sat (No Sun)')
          : `${newCustDeliveryDays.join(',')}`;

      // Add to active delivery queue immediately!
      const newStop: RouteStop = {
        id: data.customer?.id || `MUM-${Math.floor(8900 + Math.random() * 900)}`,
        customerName: newCustName.trim(),
        address: newCustAddress.trim() || `GPS: ${effectiveGps}`,
        distance: '50m',
        distanceMeters: 50,
        priority: 'High Priority',
        orderSummary: `${newCustCans} x 20L Mineral Cans • ${scheduleLabel}`,
        cansToDeliver: newCustCans,
        packsToDeliver: 0,
        expectedEmpties: 0,
        balanceDue: 0,
        status: 'Pending',
        etaOrCompletedTime: language === 'hi' ? 'ऑन-रूट स्टॉप' : 'On-Route Priority',
        phone: `+91 ${cleanPhone.slice(-10)}`,
        gateNotes:
          newCustDeliveryDays.length === 7
            ? 'Daily customer'
            : !newCustDeliveryDays.includes('Sun') && newCustDeliveryDays.length === 6
            ? 'No delivery on Sunday (Mon-Sat only)'
            : `Delivery days: ${newCustDeliveryDays.join(', ')}`,
        deliveryDays: newCustDeliveryDays,
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
      setNewCustDeliveryDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
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

  const fullCurrentDeliveryCost = cansDelivered * 70;

  const getEffectiveCurrentPayment = () => {
    return payCurrentDelivery ? fullCurrentDeliveryCost : 0;
  };

  const getEffectivePastPayment = () => {
    if (!selectedStop) return 0;
    if (selectedStop.balanceDue > 0 && payPastBalance) {
      return Math.max(0, Number(pastPaymentAmount) || 0);
    }
    return 0;
  };

  const getEffectiveCreditApplied = () => {
    if (!selectedStop) return 0;
    if (selectedStop.balanceDue < 0 && applyCredit) {
      return Math.min(getEffectiveCurrentPayment(), Math.abs(selectedStop.balanceDue));
    }
    return 0;
  };

  const calculateAmount = () => {
    const currentPaid = getEffectiveCurrentPayment();
    const pastPaid = getEffectivePastPayment();
    const creditUsed = getEffectiveCreditApplied();
    return Math.max(0, currentPaid + pastPaid - creditUsed);
  };

  const handleConfirmDrop = () => {
    if (paymentMethod === 'UPI QR') {
      setIsUpiModalOpen(true);
      return;
    }
    finishDrop(paymentMethod);
  };

  const finishDrop = async (method: string) => {
    const totalAmount = calculateAmount();
    const paidPast = getEffectivePastPayment();
    const creditUsed = getEffectiveCreditApplied();
    const paidCurrent = payCurrentDelivery && method !== 'Ledger';

    setIsDropOffModalOpen(false);
    setVanStock((prev) => Math.max(0, prev - cansDelivered));
    setDropsDone((prev) => prev + 1);

    if (method === 'Cash' || method === 'UPI QR') {
      setInVanCash((prev) => prev + totalAmount);
      onDropCompleted(totalAmount);
    }

    // Compute updated balanceDue for this customer
    let newBalanceDue = selectedStop.balanceDue || 0;
    // If today's delivery was NOT paid now in cash/UPI, add to customer balance
    if (!paidCurrent) {
      newBalanceDue += fullCurrentDeliveryCost;
    }
    // Any past balance paid is deducted from customer's balance due
    if (newBalanceDue > 0 && paidPast > 0) {
      newBalanceDue = Math.max(0, newBalanceDue - paidPast);
    } else if (newBalanceDue < 0 && creditUsed > 0) {
      newBalanceDue = newBalanceDue + creditUsed;
    }

    setQueue((prev) =>
      prev.map((item) =>
        item.id === selectedStop.id
          ? {
              ...item,
              balanceDue: newBalanceDue,
              status: 'Completed',
              etaOrCompletedTime: language === 'hi' ? 'अभी-अभी' : 'Just Now',
            }
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
          paymentAmount: totalAmount,
          oldBalanceCollected: paidPast,
          currentDeliveryPaid: paidCurrent,
          creditApplied: creditUsed,
          remainingBalance: newBalanceDue,
          notes: gateNote,
          vanId: isDriver2 ? 'van-01' : 'van-02',
        }),
      });
    } catch (e) {
      console.warn('Server delivery sync:', e);
    }

    let toastMsg = '';
    if (language === 'hi') {
      if (paidPast > 0 && paidCurrent) {
        toastMsg = `${selectedStop.customerName} पर डिलीवरी पूर्ण! कुल संग्रह ₹${totalAmount} (आज की डिलीवरी ₹${fullCurrentDeliveryCost} + पुराना बकाया ₹${paidPast})। शेष बकाया: ₹${newBalanceDue}।`;
      } else if (paidPast > 0 && !paidCurrent) {
        toastMsg = `${selectedStop.customerName} पर डिलीवरी पूर्ण! पुराना बकाया ₹${paidPast} प्राप्त हुआ। आज की डिलीवरी खाते में दर्ज। शेष बकाया: ₹${newBalanceDue}।`;
      } else if (paidCurrent) {
        toastMsg = `${selectedStop.customerName} पर डिलीवरी पूर्ण! ₹${totalAmount} प्राप्त हुए (${cansDelivered} कैन)।`;
      } else {
        toastMsg = `${selectedStop.customerName} पर डिलीवरी पूर्ण! ₹${fullCurrentDeliveryCost} खाते में दर्ज (${cansDelivered} कैन)।`;
      }
    } else {
      if (paidPast > 0 && paidCurrent) {
        toastMsg = `Drop completed at ${selectedStop.customerName}! Collected ₹${totalAmount} (Delivery: ₹${fullCurrentDeliveryCost} + Old Balance: ₹${paidPast}). Remaining balance: ₹${newBalanceDue}. Instant SMS receipt sent.`;
      } else if (paidPast > 0 && !paidCurrent) {
        toastMsg = `Drop completed at ${selectedStop.customerName}! Collected ₹${paidPast} old balance. Today's drop (₹${fullCurrentDeliveryCost}) added to ledger. Remaining balance: ₹${newBalanceDue}. Instant SMS receipt sent.`;
      } else if (paidCurrent) {
        toastMsg = `Drop completed at ${selectedStop.customerName}! Collected ₹${totalAmount} for ${cansDelivered} cans. Instant SMS receipt sent.`;
      } else {
        toastMsg = `Drop completed at ${selectedStop.customerName}! ₹${fullCurrentDeliveryCost} booked to monthly ledger for ${cansDelivered} cans.`;
      }
    }

    onNotify(toastMsg);
  };

  const filteredQueue = queue.filter((item) => {
    if (activeFilter === '500m') return item.distanceMeters <= 500;
    if (activeFilter === '1km') return item.distanceMeters <= 1000;
    if (activeFilter === 'unserved') return item.status !== 'Completed';
    return true;
  });

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
      {/* Top Register Customer Action */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white font-extrabold text-sm hover:bg-primary-container transition-all shadow-md active:scale-95 hover:scale-[1.01]"
        >
          <Icon name="person_add" className="text-lg" />
          <span>{language === 'hi' ? '+ नया ग्राहक जोड़ें' : '+ Register Customer'}</span>
        </button>
      </div>

      {/* Main Content: Proximity Queue */}
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-boro-sm flex flex-col gap-3.5">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-brand-700 flex items-center justify-center border border-blue-100 shadow-2xs">
                <Icon name="near_me" size={16} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 leading-tight">
                  {t('proximityQueueTitle')}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {t('sortedByGps')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="flex items-center gap-1 bg-blue-50/90 hover:bg-blue-100/80 active:scale-95 text-brand-700 border border-blue-200/70 rounded-full px-3 py-1 text-[11px] font-semibold transition-all shadow-2xs"
                title="Register New Customer on Route"
              >
                <Icon name="add" size={14} />
                <span>{language === 'hi' ? 'त्वरित जोड़ें' : 'Quick Onboard'}</span>
              </button>
            </div>
          </div>

          {/* Filter Segmented Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                activeFilter === 'all'
                  ? 'bg-brand-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              {language === 'hi' ? `सभी (${queue.length})` : `All (${queue.length})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('500m')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeFilter === '500m'
                  ? 'bg-brand-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              &lt; 500m
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('1km')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeFilter === '1km'
                  ? 'bg-brand-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              &lt; 1km
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('unserved')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeFilter === 'unserved'
                  ? 'bg-brand-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              {language === 'hi' ? 'अपूर्ण' : 'Unserved'}
            </button>
          </div>

          {/* Delivery List */}
          <section aria-label="Nearby Deliveries Queue" className="space-y-3">
            {filteredQueue.map((item) => {
              const isSelected = selectedStop.id === item.id;
              const isCompleted = item.status === 'Completed';

              return (
                <article
                  key={item.id}
                  onClick={() => {
                    setSelectedStopId(item.id);
                    setCansDelivered(item.cansToDeliver);
                    setEmptiesCollected(item.expectedEmpties);
                    setPayCurrentDelivery(true);
                    setPayPastBalance(false);
                    setPastPaymentAmount(item.balanceDue > 0 ? item.balanceDue : 0);
                    setApplyCredit(false);
                  }}
                  className={`bg-white rounded-2xl p-3.5 border transition-all flex flex-col justify-between relative group cursor-pointer ${
                    isSelected
                      ? 'border-brand-950 ring-1 ring-brand-950/20 shadow-boro-md bg-blue-50/10'
                      : isCompleted
                      ? 'border-slate-200/80 bg-slate-50/50 opacity-80'
                      : 'border-slate-200/80 shadow-boro-sm hover:border-slate-300'
                  }`}
                >
                  {/* Card Header / Distance & Financial Status */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">
                        {item.distance} away
                      </span>
                      {isCompleted ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                          ✓ {language === 'hi' ? 'डिलीवर' : 'Delivered'}
                        </span>
                      ) : item.priority === 'High Priority' ? (
                        <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100">
                          High Priority
                        </span>
                      ) : item.priority === 'Enterprise' ? (
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100">
                          Enterprise
                        </span>
                      ) : item.priority === 'Commercial' ? (
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full">
                          Commercial
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full">
                          {item.priority || 'Standard'}
                        </span>
                      )}
                    </div>

                    {/* Financial Status Badge */}
                    {item.balanceDue > 0 ? (
                      <div className="text-[12px] font-semibold text-amber-700 bg-amber-50/80 border border-amber-200/60 px-2 py-0.5 rounded-md">
                        Balance: ₹{item.balanceDue} Due
                      </div>
                    ) : item.balanceDue === 0 ? (
                      <div className="text-[12px] font-semibold text-emerald-700 bg-emerald-50/90 border border-emerald-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Balance: Clear (₹0)</span>
                      </div>
                    ) : (
                      <div className="text-[12px] font-semibold text-blue-700 bg-blue-50/90 border border-blue-200/70 px-2 py-0.5 rounded-md">
                        Credit: ₹{Math.abs(item.balanceDue)}
                      </div>
                    )}
                  </div>

                  {/* Customer Identity */}
                  <div className="mb-2">
                    <h3 className="text-[15px] font-bold text-slate-900 leading-snug tracking-tight">
                      {item.customerName}
                    </h3>
                    <p className="text-[12px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                      <Icon name="location_on" size={14} className="text-slate-400 shrink-0" />
                      <span>{item.address}</span>
                    </p>
                    {item.deliveryDays && item.deliveryDays.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1 border border-slate-200/60">
                          <Icon name="calendar" size={11} className="text-slate-400" />
                          <span>
                            {item.deliveryDays.length === 7
                              ? (language === 'hi' ? 'प्रतिदिन (Mon-Sun)' : 'Daily')
                              : !item.deliveryDays.includes('Sun') && item.deliveryDays.length === 6
                              ? (language === 'hi' ? 'सोम-शनि (रविवार बंद)' : 'Mon - Sat (No Sun)')
                              : item.deliveryDays.join(', ')}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Interaction Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-semibold hover:bg-blue-100 transition-colors active:scale-95 shadow-2xs"
                      title={language === 'hi' ? 'गूगल मैप्स नेविगेशन खोलें' : 'Open GPS Navigation in Google Maps'}
                    >
                      <Icon name="navigation" size={13} />
                      <span>GPS</span>
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDropOffModal(item);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-950 text-white text-xs font-semibold hover:bg-brand-900 transition-colors shadow-xs active:scale-95"
                    >
                      <Icon name="truck" size={14} className="text-blue-300" />
                      <span>{t('logDropOff')}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
        </div>

      {/* Bottom Metrics Row */}
      <footer className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-boro-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{t('avgStopDuration')}</p>
            <p className="text-base font-extrabold text-slate-800 tracking-tight mt-0.5">3.4 min</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
            <Icon name="schedule" size={16} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-boro-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{t('emptiesRecovered')}</p>
            <p className="text-base font-extrabold text-emerald-700 tracking-tight mt-0.5">18 Crates</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Icon name="autorenew" size={16} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-boro-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{t('cashUpiInVan')}</p>
            <p className="text-base font-extrabold text-blue-700 tracking-tight mt-0.5">₹{inVanCash.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <Icon name="wallet" size={16} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-boro-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{t('dailyDropsCompleted')}</p>
            <p className="text-base font-extrabold text-slate-800 tracking-tight mt-0.5">{dropsDone} / 42</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700">
            <Icon name="task_alt" size={16} />
          </div>
        </div>
      </footer>

      {/* Log Drop-off Entry Modal */}
      {isDropOffModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          onClick={() => setIsDropOffModalOpen(false)}
        >
          {/* BEGIN: ModalContainer / Sheet */}
          <main 
            className="relative z-20 w-full max-w-[420px] bg-white rounded-t-[34px] sm:rounded-[34px] shadow-modal pt-2 pb-6 px-4 flex flex-col max-h-[90vh] overflow-hidden" 
            data-purpose="drop-off-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Pull Bar & Close Row */}
            <div className="flex flex-col items-center mb-1">
              <div className="w-9 h-1 bg-slate-300 rounded-full mb-1"></div>
            </div>

            {/* BEGIN: ModalHeader */}
            <header className="flex items-start justify-between pb-3 px-1 border-b border-slate-100">
              <div className="flex items-start space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-brand-navy flex items-center justify-center text-white shadow-sm shrink-0 mt-0.5">
                  {/* Delivery Truck Icon */}
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18 18.5a2.5 2.5 0 0 1-2.5-2.5c0-.18.02-.35.06-.52H8.44c.04.17.06.34.06.52A2.5 2.5 0 1 1 6 13.5h.39A4.47 4.47 0 0 1 10 10h5V6H3a1 1 0 0 0-1 1v10h1.56A2.5 2.5 0 0 1 6 18.5a2.5 2.5 0 0 1 2.5-2.5c0-.18-.02-.35-.06-.52h7.02c-.04.17-.06.34-.06.52a2.5 2.5 0 0 0 2.5 2.5m1.5-12.5h-3.5v5H21l-1.5-5zM20 15h1a1 1 0 0 0 1-1v-2.22c0-.36-.13-.7-.37-.96L19.42 8.3c-.26-.28-.62-.43-.99-.43H18v7.13A2.48 2.48 0 0 1 19.5 15z"></path>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold tracking-wider text-sky-600 uppercase">
                      {language === 'hi' ? 'लाइव डिलीवरी ड्रॉप-ऑफ' : 'Log Delivery Drop-Off'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                      {selectedStop.distance || '350m away'}
                    </span>
                  </div>
                  <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-snug truncate">
                    {selectedStop.customerName}
                  </h1>
                  <p className="text-[12px] text-slate-500 flex items-center mt-0.5">
                    <svg className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                      <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    <span className="truncate">{selectedStop.address}</span>
                  </p>
                </div>
              </div>

              {/* Dismiss Button */}
              <button 
                aria-label="Close" 
                type="button" 
                onClick={() => setIsDropOffModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition shrink-0 ml-2" 
              >
                <svg className="w-4 h-4 stroke-current stroke-2" fill="none" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>
            </header>
            {/* END: ModalHeader */}

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pt-3 pb-2 pr-0.5 no-scrollbar">
              {/* BEGIN: ProductBadgeCard */}
              <article className="bg-slate-50/90 border border-slate-100 rounded-2xl p-2.5 flex items-center space-x-3" data-purpose="product-badge">
                <div className="w-12 h-12 bg-white rounded-xl border border-slate-200/60 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden relative">
                  <Image 
                    alt="Mumpy Pure Mineral Water" 
                    className="w-full h-full object-cover rounded-lg" 
                    src="/images/mumpy-bottles.png"
                    fill
                    sizes="48px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-900 truncate">Mumpy Pure Mineral Water</h2>
                    <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                      <svg className="w-2.5 h-2.5 mr-1 fill-emerald-600" viewBox="0 0 20 20">
                        <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                      </svg>
                      {t('verifiedSealed')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {t('mumpyMineralPackDesc')}
                  </p>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">BATCH #MP-2024-88A</div>
                </div>
              </article>
              {/* END: ProductBadgeCard */}

              {/* BEGIN: CounterSection */}
              <section aria-label="Delivered and Returned Quantities" className="grid grid-cols-2 gap-2.5">
                {/* Delivered Counter */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center space-x-1.5 mb-2">
                    <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-slate-900 leading-none">{t('deliveredCount')}</div>
                      <div className="text-[10px] text-slate-500">{t('fullMumpyCans')}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-xl p-1 shadow-xs border border-blue-100/70">
                    <button 
                      aria-label="Decrease Delivered" 
                      type="button"
                      onClick={() => setCansDelivered(Math.max(1, cansDelivered - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-lg active:scale-95 transition"
                    >
                      -
                    </button>
                    <span className="text-lg font-bold text-slate-900 font-sans">{cansDelivered}</span>
                    <button 
                      aria-label="Increase Delivered" 
                      type="button"
                      onClick={() => setCansDelivered(cansDelivered + 1)}
                      className="w-8 h-8 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-lg active:scale-95 transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Return Counter */}
                <div className="bg-teal-50/40 border border-teal-100 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center space-x-1.5 mb-2">
                    <div className="w-5 h-5 rounded-md bg-teal-100 text-teal-700 flex items-center justify-center">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"></path></svg>
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-slate-900 leading-none">{t('emptiesReturned')}</div>
                      <div className="text-[10px] text-slate-500">{t('cleanReturnableCans')}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-xl p-1 shadow-xs border border-teal-100/70">
                    <button 
                      aria-label="Decrease Returned" 
                      type="button"
                      onClick={() => setEmptiesCollected(Math.max(0, emptiesCollected - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-lg active:scale-95 transition"
                    >
                      -
                    </button>
                    <span className="text-lg font-bold text-slate-900 font-sans">{emptiesCollected}</span>
                    <button 
                      aria-label="Increase Returned" 
                      type="button"
                      onClick={() => setEmptiesCollected(emptiesCollected + 1)}
                      className="w-8 h-8 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-lg active:scale-95 transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </section>
              {/* END: CounterSection */}

              {/* BEGIN: OutstandingBalanceNotice */}
              {selectedStop.balanceDue > 0 ? (
                <section aria-label="Outstanding Dues" className="bg-amberSoft border border-amberBorder/80 rounded-2xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amberText flex items-center justify-center font-bold text-xs">!</div>
                      <div>
                        <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                          {t('previousOutstandingBalance')}
                        </span>
                        <p className="text-[10px] text-amber-700">
                          {language === 'hi' ? 'पूर्व डिलीवरी का बकाया खाता' : 'Past unpaid delivery dues'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-amber-100/80 font-bold text-xs text-amber-900">
                      ₹{selectedStop.balanceDue.toFixed(2)}
                    </span>
                  </div>

                  {/* Collect Now Checkbox Pill */}
                  <label 
                    onClick={handleTogglePayPastBalance}
                    className={`mt-2.5 flex items-center justify-between rounded-xl px-3 py-2 border cursor-pointer shadow-2xs transition-all ${
                      payPastBalance
                        ? 'bg-amber-100/60 border-amber-300'
                        : 'bg-white/95 border-amber-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <input 
                        type="checkbox"
                        checked={payPastBalance}
                        onChange={() => {}} // handled by parent onClick
                        className="w-4 h-4 rounded text-brand-navy focus:ring-0 focus:ring-offset-0 border-slate-300 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-800">
                          {t('collectOldBalance')}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {language === 'hi' ? `आज ₹${selectedStop.balanceDue} बकाया वसूल करें` : `Include ₹${selectedStop.balanceDue} past dues today`}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-brand-navy bg-slate-100 px-2 py-0.5 rounded-lg">
                      +₹{(pastPaymentAmount || selectedStop.balanceDue).toFixed(2)}
                    </span>
                  </label>

                  {/* Optional partial amount adjustment input when checked */}
                  {payPastBalance && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 pt-2 border-t border-amber-200/80 flex items-center gap-2"
                    >
                      <span className="text-[10px] font-semibold text-amber-900 shrink-0">
                        {language === 'hi' ? 'जमा राशि:' : 'Amount to clear:'}
                      </span>
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="1"
                          max={selectedStop.balanceDue}
                          value={pastPaymentAmount || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPastPaymentAmount(val);
                            if (paymentMethod === 'Ledger') {
                              setPaymentMethod('UPI QR');
                            }
                          }}
                          className="w-full pl-6 pr-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
                          placeholder={selectedStop.balanceDue.toString()}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPastPaymentAmount(selectedStop.balanceDue);
                          if (paymentMethod === 'Ledger') {
                            setPaymentMethod('UPI QR');
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-[10px] font-bold text-amber-950 transition-colors shrink-0"
                      >
                        {language === 'hi' ? 'पूरा चुकता' : 'Full (₹' + selectedStop.balanceDue + ')'}
                      </button>
                    </div>
                  )}
                </section>
              ) : selectedStop.balanceDue < 0 ? (
                <section aria-label="Advance Credit" className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">₹</div>
                      <div>
                        <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wide">
                          {t('creditAvailable')}
                        </span>
                        <p className="text-[10px] text-sky-600">
                          {language === 'hi' ? 'ग्राहक के पास अग्रिम क्रेडिट है' : 'Advance balance on file'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-sky-100/80 font-bold text-xs text-sky-900">
                      ₹{Math.abs(selectedStop.balanceDue).toFixed(2)}
                    </span>
                  </div>
                  <label className="mt-2 flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-sky-200 cursor-pointer shadow-2xs">
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        checked={applyCredit}
                        onChange={(e) => setApplyCredit(e.target.checked)}
                        className="w-4 h-4 text-sky-600 rounded focus:ring-0"
                      />
                      <span className="text-xs font-semibold text-slate-800">
                        {t('applyCredit')} (-₹{Math.min(cansDelivered * 70, Math.abs(selectedStop.balanceDue)).toFixed(2)})
                      </span>
                    </div>
                  </label>
                </section>
              ) : (
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">✓</div>
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">{t('accountAllClear')}</span>
                      <p className="text-[10px] text-emerald-600">
                        {language === 'hi' ? 'पूर्व बिलों का कोई बकाया नहीं है' : 'No past dues or pending balance'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">₹0.00</span>
                </div>
              )}
              {/* END: OutstandingBalanceNotice */}

              {/* BEGIN: PaymentSummary */}
              <section className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    <button 
                      type="button" 
                      onClick={() => setPayCurrentDelivery((prev) => !prev)}
                      className="flex items-center gap-1.5 text-left font-medium hover:text-slate-900 transition"
                      title={payCurrentDelivery ? 'Click to defer payment' : 'Click to pay now'}
                    >
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] border font-bold ${payCurrentDelivery ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 bg-white'}`}>
                        {payCurrentDelivery ? '✓' : ''}
                      </span>
                      <span>Current Delivery ({cansDelivered} × ₹70)</span>
                    </button>
                  </div>
                  <span className={`font-semibold ${payCurrentDelivery ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                    ₹{fullCurrentDeliveryCost.toFixed(2)}
                  </span>
                </div>

                {payPastBalance && getEffectivePastPayment() > 0 && (
                  <div className="flex items-center justify-between text-xs text-amber-700">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      <span>{t('oldBalanceSettled')}</span>
                    </div>
                    <span className="font-semibold">+₹{getEffectivePastPayment().toFixed(2)}</span>
                  </div>
                )}

                {applyCredit && getEffectiveCreditApplied() > 0 && (
                  <div className="flex items-center justify-between text-xs text-sky-600">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                      <span>{language === 'hi' ? 'क्रेडिट कटौती' : 'Credit Applied'}</span>
                    </div>
                    <span className="font-semibold">-₹{getEffectiveCreditApplied().toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('totalToCollect')}</span>
                  <div className="text-right">
                    <span className="text-lg font-black text-brand-navy tracking-tight">₹{calculateAmount().toFixed(2)}</span>
                    {paymentMethod === 'Ledger' && !payPastBalance && (
                      <span className="text-[10px] text-sky-700 block font-medium">
                        {language === 'hi' ? '(मासिक बहीखाते में दर्ज)' : '(Billed to Monthly Ledger)'}
                      </span>
                    )}
                  </div>
                </div>
              </section>
              {/* END: PaymentSummary */}

              {/* BEGIN: PaymentMethods */}
              <fieldset className="space-y-1.5">
                <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Payment Method</legend>
                <div className="grid grid-cols-3 gap-2">
                  {/* Cash */}
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('Cash')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition cursor-pointer ${
                      paymentMethod === 'Cash'
                        ? 'border-2 border-sky-600 bg-brand-navy text-white shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect height="12" rx="2" strokeWidth="2" width="20" x="2" y="6"></rect>
                      <circle cx="12" cy="12" r="2" strokeWidth="2"></circle>
                    </svg>
                    <span className="text-[11px] font-semibold">{t('cash')}</span>
                  </button>

                  {/* UPI QR (Active default) */}
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('UPI QR')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition cursor-pointer ${
                      paymentMethod === 'UPI QR'
                        ? 'border-2 border-sky-600 bg-brand-navy text-white shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <svg className="w-5 h-5 mb-1 fill-current" viewBox="0 0 24 24">
                      <path d="M3 3h8v8H3zm2 2v4h4V5zm8-2h8v8h-8zm2 2v4h4V5zM3 13h8v8H3zm2 2v4h4v-4zm13-2h3v3h-3zm-5 5h3v3h-3zm3 0h3v3h-3zm2-3h3v3h-3z"></path>
                    </svg>
                    <span className="text-[11px] font-bold">{t('upiQr')}</span>
                  </button>

                  {/* Monthly Ledger */}
                  <button 
                    type="button"
                    disabled={payPastBalance}
                    onClick={() => {
                      if (!payPastBalance) setPaymentMethod('Ledger');
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition ${
                      payPastBalance
                        ? 'border-slate-100 bg-slate-100/60 text-slate-300 cursor-not-allowed opacity-60'
                        : paymentMethod === 'Ledger'
                          ? 'border-2 border-sky-600 bg-brand-navy text-white shadow-xs cursor-pointer'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 cursor-pointer'
                    }`}
                  >
                    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    <span className="text-[11px] font-semibold truncate w-full text-center">{t('monthlyLedger')}</span>
                  </button>
                </div>
                {payPastBalance && (
                  <span className="text-[10px] text-amber-800 flex items-center gap-1 font-medium bg-amber-50 border border-amber-200/70 rounded-xl px-2.5 py-1.5 mt-1">
                    <Icon name="info" className="text-xs shrink-0" />
                    {t('instantPaymentRequiredForDues')}
                  </span>
                )}
              </fieldset>
              {/* END: PaymentMethods */}

              {/* BEGIN: DropOffNotes */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1" htmlFor="drop-note">
                  {language === 'hi' ? 'ड्रॉप-ऑफ नोट / सुरक्षा गार्ड संदर्भ' : 'Drop-off Note / Gate Reference'}
                </label>
                <input 
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-navy focus:ring-1 focus:ring-brand-navy text-slate-800 transition" 
                  id="drop-note" 
                  placeholder={t('dropOffNotePlaceholder') || 'e.g. Handed to security guard Mohan / Left at flat'} 
                  type="text"
                  value={gateNote}
                  onChange={(e) => setGateNote(e.target.value)}
                />
              </div>
              {/* END: DropOffNotes */}
            </div>

            {/* BEGIN: ActionButtons */}
            <footer className="pt-3 border-t border-slate-100 flex flex-col space-y-2 shrink-0">
              <div className="flex items-center space-x-2">
                <button 
                  className="w-1/3 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition active:scale-98 cursor-pointer" 
                  type="button"
                  onClick={() => setIsDropOffModalOpen(false)}
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button 
                  className="flex-1 py-3 px-3 rounded-2xl bg-brand-navy hover:bg-brand-900 text-white text-xs font-bold shadow-btn flex items-center justify-center space-x-2 active:scale-98 transition cursor-pointer" 
                  type="button"
                  onClick={handleConfirmDrop}
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 20 20">
                    <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd"></path>
                  </svg>
                  <span className="tracking-tight">{t('confirmAndGenerateSms') || 'Confirm & Send Instant SMS Receipt'}</span>
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-400 font-medium">
                {language === 'hi'
                  ? 'ग्राहक सदस्यता पासबुक और डिस्पैच बैलेंस स्वतः अपडेट होता है'
                  : 'Auto-updates customer subscription passbook & plant ledger'}
              </p>
            </footer>
            {/* END: ActionButtons */}

            {/* iOS Home Bar Indicator */}
            <div className="w-32 h-1 bg-slate-300 rounded-full mx-auto mt-2 shrink-0"></div>
          </main>
          {/* END: ModalContainer */}
        </div>
      )}

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
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-surface-container relative flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-surface-container pb-3 shrink-0">
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

              {/* Delivery Days & Custom Schedule Selector */}
              <div className="flex flex-col gap-2 p-3.5 bg-surface-container-low rounded-2xl border border-surface-container shrink-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <label className="font-bold text-on-surface text-xs block">
                      {language === 'hi' ? 'डिलीवरी के दिन / शेड्यूल' : 'Delivery Schedule (Days)'}
                    </label>
                    <span className="text-[11px] text-primary font-extrabold block">
                      {getDeliveryDaysSummary(newCustDeliveryDays)}
                    </span>
                  </div>

                  {/* Small Check Button for All Days */}
                  <button
                    type="button"
                    onClick={handleToggleAllDays}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer border ${
                      newCustDeliveryDays.length === 7
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-white text-on-surface border-surface-container hover:border-primary/40'
                    }`}
                    title={
                      newCustDeliveryDays.length === 7
                        ? 'Click to deselect all days'
                        : 'Click to select all 7 days'
                    }
                  >
                    <Icon
                      name={
                        newCustDeliveryDays.length === 7
                          ? 'check_box'
                          : 'check_box_outline_blank'
                      }
                      className="text-sm"
                    />
                    <span>{language === 'hi' ? 'सभी दिन (All Days)' : 'All Days'}</span>
                  </button>
                </div>

                {/* Weekday Buttons (Mon to Sun) */}
                <div className="grid grid-cols-7 gap-1.5 pt-1">
                  {WEEK_DAYS.map((d) => {
                    const isSelected = newCustDeliveryDays.includes(d.key);
                    const isSun = d.key === 'Sun';
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => handleToggleDay(d.key)}
                        className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center gap-0.5 transition-all border cursor-pointer ${
                          isSelected
                            ? isSun
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-white text-on-surface-variant border-surface-container hover:bg-surface-container/60 hover:text-on-surface'
                        }`}
                        title={`${d.en} (${isSelected ? 'Delivery Active' : 'Off - No Delivery'})`}
                      >
                        <span className="text-xs font-black leading-none">{d.en}</span>
                        <span
                          className={`text-[9px] font-medium leading-none ${
                            isSelected ? 'text-white/85' : 'text-outline'
                          }`}
                        >
                          {d.hi}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Helper hint and quick exclude Sunday tag */}
                <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-0.5">
                  <span>
                    {language === 'hi'
                      ? '💡 जिस दिन डिलीवरी नहीं चाहिए, उस पर क्लिक करके बंद करें (उदा. Sunday)'
                      : '💡 Click any day to toggle off (e.g. click Sun to exclude Sunday)'}
                  </span>
                  {!newCustDeliveryDays.includes('Sun') && newCustDeliveryDays.length > 0 && (
                    <span className="text-amber-800 font-bold bg-amber-100/90 px-1.5 py-0.5 rounded-md border border-amber-300">
                      {language === 'hi' ? 'रविवार बंद ✕' : 'Sunday Off ✕'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-on-surface">
                  {language === 'hi' ? 'पता / परिसर / फ्लैट नं. *' : 'Address / Premises / Flat No. *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="e.g. Flat 302, Palm Heights, Sector 14"
                  className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                />
                <span className="text-[10px] text-on-surface-variant flex items-center gap-1 pt-0.5">
                  <Icon name="auto_awesome" size={12} className="text-emerald-600 shrink-0" />
                  <span>
                    {language === 'hi'
                      ? 'सटीक डोरस्टेप GPS पंजीकरण पर स्वतः लॉक हो जाएगा।'
                      : 'Precise doorstep GPS is automatically attached on registration.'}
                  </span>
                </span>
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
