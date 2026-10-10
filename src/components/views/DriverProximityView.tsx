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
import { GpsCompilationWidget } from '../common/GpsCompilationWidget';

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
                      setPayCurrentDelivery(true);
                      setPayPastBalance(false);
                      setPastPaymentAmount(item.balanceDue > 0 ? item.balanceDue : 0);
                      setApplyCredit(false);
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
                        {item.deliveryDays && item.deliveryDays.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-container text-on-surface flex items-center gap-1">
                              <Icon name="event" size={12} className="text-primary" />
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

                      <div className="text-right flex flex-col items-end gap-1.5">
                        <span
                          className={`text-xs font-bold ${
                            item.balanceDue > 0
                              ? 'text-amber-800'
                              : item.balanceDue < 0
                              ? 'text-blue-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {language === 'hi' ? 'बैलेंस:' : 'Balance:'}{' '}
                          {item.balanceDue === 0
                            ? language === 'hi'
                              ? 'चुकता (₹0)'
                              : 'Clear (₹0)'
                            : item.balanceDue > 0
                            ? `₹${item.balanceDue} Due`
                            : `₹${Math.abs(item.balanceDue)} Credit`}
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
                              openDropOffModal(item);
                            }}
                            className="px-3 py-1 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container shadow-xs flex items-center gap-1"
                          >
                            <Icon name="local_shipping" className="text-sm" />
                            {t('logDropOff')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {/* Log Drop-off Entry Modal */}
      {isDropOffModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsDropOffModalOpen(false)}
        >
          <div 
            className="bg-surface-container-lowest max-w-lg w-full rounded-3xl p-6 shadow-2xl border-2 border-primary/20 relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-container shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
                  <Icon name="local_shipping" className="text-xl" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-secondary tracking-wider block">
                    {language === 'hi' ? 'लाइव डिलीवरी एंट्री' : 'Log Delivery Drop-off'}
                  </span>
                  <h3 className="font-extrabold text-title-lg text-primary">
                    {selectedStop.customerName}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-secondary-fixed text-on-secondary-fixed font-bold px-2.5 py-1 rounded-full">
                  {selectedStop.distance}
                </span>
                <button
                  type="button"
                  onClick={() => setIsDropOffModalOpen(false)}
                  className="p-1.5 rounded-xl text-outline hover:bg-surface-container transition-colors"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
            </div>

            {/* Stop Address & Navigation Link */}
            <div className="flex items-center justify-between gap-3 p-3 bg-surface-container-low rounded-2xl border border-surface-container shrink-0">
              <div className="flex items-start gap-2 min-w-0">
                <Icon name="location_on" className="text-sm text-outline shrink-0 mt-0.5" />
                <span className="text-xs text-on-surface truncate">{selectedStop.address}</span>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedStop.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-xl bg-secondary-fixed text-on-secondary-fixed font-bold text-xs hover:bg-secondary hover:text-white transition-all shadow-2xs flex items-center gap-1 shrink-0"
                title="Start GPS"
              >
                <Icon name="directions" size={13} />
                <span>{language === 'hi' ? 'GPS' : 'GPS'}</span>
              </a>
            </div>

            {/* Packaging Verification Banner */}
            <div className="p-3 bg-surface-container-low rounded-2xl flex items-center gap-3 border border-surface-container shrink-0">
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
            <div className="grid grid-cols-2 gap-3 text-center shrink-0">
              {/* Delivered */}
              <div className="p-3 bg-surface-container-low rounded-2xl flex flex-col gap-1.5 border border-surface-container">
                <span className="text-xs font-bold text-primary flex items-center justify-center gap-1">
                  <Icon name="water_bottle" className="text-sm" />
                  {t('deliveredCount')}
                </span>
                <span className="text-[10px] text-outline">{t('fullMumpyCans')}</span>
                <div className="flex items-center justify-between bg-white rounded-xl p-1.5 mt-1 border border-surface-container">
                  <button
                    type="button"
                    onClick={() => setCansDelivered(Math.max(1, cansDelivered - 1))}
                    className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-base hover:bg-surface-container-high transition-colors"
                  >
                    -
                  </button>
                  <span className="font-display text-xl font-extrabold text-primary">
                    {cansDelivered}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCansDelivered(cansDelivered + 1)}
                    className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-base hover:bg-surface-container-high transition-colors"
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
                    type="button"
                    onClick={() => setEmptiesCollected(Math.max(0, emptiesCollected - 1))}
                    className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-base hover:bg-surface-container-high transition-colors"
                  >
                    -
                  </button>
                  <span className="font-display text-xl font-extrabold text-secondary">
                    {emptiesCollected}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEmptiesCollected(emptiesCollected + 1)}
                    className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-base hover:bg-surface-container-high transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Customer Ledger & Old Balance / Credits Card */}
            <div className="rounded-2xl border transition-all overflow-hidden bg-surface-container-low border-surface-container shrink-0">
              {selectedStop.balanceDue > 0 ? (
                <div className="p-3.5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
                        <Icon name="history_edu" className="text-base" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block">
                          {t('previousOutstandingBalance')}
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium">
                          {language === 'hi' ? 'पूर्व डिलीवरी का बकाया खाता' : 'Unpaid balance from past deliveries'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-extrabold text-sm inline-block shadow-2xs border border-amber-200">
                        ₹{selectedStop.balanceDue.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Pay Old Balance Toggle / Action */}
                  <div
                    className={`rounded-xl border transition-all shadow-2xs overflow-hidden ${
                      payPastBalance
                        ? 'bg-amber-50/90 border-amber-300'
                        : 'bg-white border-amber-200/70 hover:border-amber-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={handleTogglePayPastBalance}
                      className="w-full p-3 flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                            payPastBalance
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'border-2 border-outline/50 bg-white'
                          }`}
                        >
                          {payPastBalance && <Icon name="check" size={14} className="font-black" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-on-surface block leading-tight">
                            {t('collectOldBalance')}
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-medium block truncate">
                            {payPastBalance
                              ? language === 'hi'
                                ? 'हटाने के लिए फिर से क्लिक करें'
                                : 'Click to uncheck / remove'
                              : language === 'hi'
                              ? 'आज की वसूली में जोड़ने के लिए चुनें'
                              : 'Include past dues in today’s collection'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-extrabold px-2.5 py-1 rounded-lg inline-block ${
                            payPastBalance
                              ? 'bg-amber-200/90 text-amber-950 border border-amber-300'
                              : 'text-amber-800 bg-amber-50 border border-amber-200/60'
                          }`}
                        >
                          {payPastBalance
                            ? `+₹${(pastPaymentAmount || 0).toFixed(2)}`
                            : language === 'hi'
                            ? `₹${selectedStop.balanceDue.toFixed(2)} बकाया`
                            : `₹${selectedStop.balanceDue.toFixed(2)} Due`}
                        </span>
                      </div>
                    </button>

                    {payPastBalance && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 pb-3 pt-2.5 border-t border-amber-200/80 flex items-center gap-2 animate-in fade-in duration-150 bg-white/60"
                      >
                        <span className="text-[11px] text-on-surface-variant font-medium shrink-0">
                          {language === 'hi' ? 'जमा राशि:' : 'Amount to clear:'}
                        </span>
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-outline">
                            ₹
                          </span>
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
                            className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                          className="px-2.5 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-[10px] font-bold text-amber-950 transition-colors shrink-0 shadow-2xs"
                        >
                          {language === 'hi' ? 'पूरा चुकता' : 'Full (₹' + selectedStop.balanceDue + ')'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedStop.balanceDue < 0 ? (
                <div className="p-3.5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                        <Icon name="savings" className="text-base" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block">
                          {t('creditAvailable')}
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium">
                          {language === 'hi' ? 'ग्राहक के पास अग्रिम क्रेडिट है' : 'Advance balance on file'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-blue-100 text-blue-900 font-extrabold text-sm">
                      ₹{Math.abs(selectedStop.balanceDue).toFixed(2)}
                    </span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer bg-white/90 p-2.5 rounded-xl border border-blue-200/60 select-none">
                    <input
                      type="checkbox"
                      checked={applyCredit}
                      onChange={(e) => setApplyCredit(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-on-surface">
                      {t('applyCredit')} (-₹{Math.min(cansDelivered * 70, Math.abs(selectedStop.balanceDue)).toFixed(2)})
                    </span>
                  </label>
                </div>
              ) : (
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <Icon name="check_circle" className="text-base" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">
                        {t('accountAllClear')}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {language === 'hi' ? 'पूर्व बिलों का कोई बकाया नहीं है' : 'No previous dues or pending balance'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    ₹0.00
                  </span>
                </div>
              )}
            </div>

            {/* Payment Amount Breakdown & Method Selector */}
            <div className="flex flex-col gap-2.5 shrink-0">
              <div className="p-3.5 bg-surface-container-low rounded-2xl border border-surface-container flex flex-col gap-2 text-xs">
                {/* Current Delivery Row with Interactive Pay Toggle Button */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/80 border border-surface-container">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPayCurrentDelivery((prev) => !prev)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                        payCurrentDelivery
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                      title={payCurrentDelivery ? 'Click to defer payment' : 'Click to pay now'}
                    >
                      <Icon
                        name={payCurrentDelivery ? 'check_box' : 'check_box_outline_blank'}
                        className="text-sm"
                      />
                      <span>{t('payCurrentDelivery')}</span>
                    </button>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      ({cansDelivered} × ₹70)
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-extrabold text-xs ${
                        payCurrentDelivery ? 'text-on-surface' : 'text-outline line-through'
                      }`}
                    >
                      ₹{fullCurrentDeliveryCost.toFixed(2)}
                    </span>
                    {!payCurrentDelivery && (
                      <span className="block text-[10px] text-amber-700 font-semibold">
                        {t('deferToLedger')}
                      </span>
                    )}
                  </div>
                </div>

                {payPastBalance && getEffectivePastPayment() > 0 && (
                  <div className="flex justify-between items-center text-amber-800 font-semibold px-1">
                    <span className="flex items-center gap-1">
                      <Icon name="history" className="text-xs" />
                      {t('oldBalanceSettled')}
                    </span>
                    <span>+₹{getEffectivePastPayment().toFixed(2)}</span>
                  </div>
                )}

                {applyCredit && getEffectiveCreditApplied() > 0 && (
                  <div className="flex justify-between items-center text-blue-800 font-semibold px-1">
                    <span className="flex items-center gap-1">
                      <Icon name="redeem" className="text-xs" />
                      {language === 'hi' ? 'क्रेडिट कटौती' : 'Credit Applied'}
                    </span>
                    <span>-₹{getEffectiveCreditApplied().toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-surface-container flex justify-between items-center px-1">
                  <span className="font-extrabold text-xs text-on-surface uppercase tracking-wide">
                    {t('totalToCollect')}
                  </span>
                  <div className="text-right">
                    <span className="font-black text-primary text-base">
                      ₹{calculateAmount().toFixed(2)}
                    </span>
                    {paymentMethod === 'Ledger' && !payPastBalance && (
                      <span className="text-[10px] text-primary block font-medium">
                        {language === 'hi' ? '(मासिक बहीखाते में दर्ज)' : '(Billed to Monthly Ledger)'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method Selector - Only Cash & UPI QR when old balance is on */}
              <div className="flex flex-col gap-1.5">
                <div className={`grid ${payPastBalance ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                  <button
                    type="button"
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
                    type="button"
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
                  {!payPastBalance && (
                    <button
                      type="button"
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
                  )}
                </div>

                {payPastBalance && (
                  <span className="text-[11px] text-amber-800 flex items-center gap-1 font-medium bg-amber-50 border border-amber-200/70 rounded-xl px-2.5 py-1.5">
                    <Icon name="info" className="text-xs shrink-0" />
                    {t('instantPaymentRequiredForDues')}
                  </span>
                )}
              </div>
            </div>

            {/* Drop-off Notes */}
            <div className="flex flex-col gap-1 text-xs shrink-0">
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

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsDropOffModalOpen(false)}
                className="px-4 py-3 rounded-2xl bg-surface-container text-on-surface font-bold text-xs hover:bg-surface-container-high transition-colors"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDrop}
                className="flex-1 py-3 rounded-2xl bg-primary text-white font-extrabold text-sm hover:bg-primary-container shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Icon name="check_circle" className="text-lg" />
                {t('confirmAndGenerateSms')}
              </button>
            </div>

            <span className="text-[11px] text-center text-outline flex items-center justify-center gap-1 shrink-0 pb-1">
              <Icon name="sync" className="text-sm text-emerald-600" />
              {language === 'hi'
                ? 'ग्राहक सदस्यता पासबुक और डिस्पैच बैलेंस स्वतः अपडेट होता है'
                : 'Auto-updates customer subscription passbook & plant dispatch balance'}
            </span>
          </div>
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
                      ? 'केवल पता दर्ज करें। नीचे 5-सेकंड GPS संग्रह से सटीक स्थान स्वतः लॉक होगा।'
                      : 'Just enter address; precise GPS is auto-pinned from live 5s telemetry.'}
                  </span>
                </span>
              </div>

              {/* 5-Second Accurate GPS Multi-Sample Compilation Widget */}
              <GpsCompilationWidget
                language={language}
                compiler={gpsCompiler}
                manualCoordsOverride={newCustGps}
              />

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
