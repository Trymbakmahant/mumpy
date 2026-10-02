'use client';

import React, { useState, useEffect } from 'react';
import { initialCustomers } from '../../data/mockData';
import { CustomerAccount } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../common/Icon';

interface CustomerDirectoryViewProps {
  onNotify: (msg: string) => void;
}

export const CustomerDirectoryView: React.FC<CustomerDirectoryViewProps> = ({ onNotify }) => {
  const { t, language } = useLanguage();
  const { role, user } = useAuth();

  const isDriver = role === 'driver';
  const isDriver2 = user?.email?.includes('driver2') || user?.assigned_van_id === 'van-01';
  const driverVanName = isDriver2 ? 'Suresh Kumar (Driver 2)' : 'Rajesh Patil (Driver 1)';
  const driverVanId = isDriver2 ? 'van-01' : 'van-02';
  const driverPlate = isDriver2 ? 'MH-12-BR-3041' : 'MH-12-BR-3042';
  const driverRouteSector = isDriver2 ? 'Sector 14 - Lakeview' : 'IT Corridor - Phase 2';

  const [customers, setCustomers] = useState<CustomerAccount[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All Sectors');
  const [statusFilter, setStatusFilter] = useState('All');

  // Intake Form State
  const [accType, setAccType] = useState<'Residential' | 'Office / B2B'>('Office / B2B');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [whatsAppOptIn, setWhatsAppOptIn] = useState(true);
  const [selectedSector, setSelectedSector] = useState(driverRouteSector);
  const [assignedVan, setAssignedVan] = useState(
    isDriver2
      ? 'Van #01 (Suresh Kumar - Sector 14)'
      : 'Van #02 (Rajesh Patil - IT Corridor)'
  );

  useEffect(() => {
    if (isDriver) {
      setSelectedSector(driverRouteSector);
      setAssignedVan(
        isDriver2
          ? 'Van #01 (Suresh Kumar - Sector 14)'
          : 'Van #02 (Rajesh Patil - IT Corridor)'
      );
    }
  }, [isDriver, isDriver2, driverRouteSector]);
  const [premises, setPremises] = useState('');
  const [gpsCoordinates, setGpsCoordinates] = useState('');
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [productTier, setProductTier] = useState<'20L' | '1L'>('20L');
  const [dropQuantity, setDropQuantity] = useState(6);
  const [cadence, setCadence] = useState<'Daily' | 'Alternate Days' | 'Weekly Mon'>('Daily');
  const [slot, setSlot] = useState<'07 - 10 AM' | '10 - 01 PM' | '02 - 05 PM'>('07 - 10 AM');

  const [duplicateAlert, setDuplicateAlert] = useState<{
    show: boolean;
    message: string;
    existing?: CustomerAccount;
  } | null>(null);

  const depositTotal = productTier === '20L' ? dropQuantity * 150 : 0;

  const parseCoordinates = (coordStr: string) => {
    if (!coordStr || !coordStr.trim()) return { lat: 0, lng: 0, formatted: '' };
    const cleaned = coordStr.replace(/[°NSEWnsew]/g, '').trim();
    const parts = cleaned.split(/[, ]+/).filter(Boolean);
    const lat = parseFloat(parts[0]) || 0;
    const lng = parseFloat(parts[1]) || 0;
    return {
      lat,
      lng,
      formatted: coordStr.trim(),
    };
  };

  const handleFetchCoordinates = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      const err =
        language === 'hi'
          ? 'आपके डिवाइस में GPS समर्थित नहीं है। कृपया मैन्युअल रूप से दर्ज करें।'
          : 'GPS is not supported on this browser/device. Please type coordinates manually.';
      setGpsError(err);
      onNotify(err);
      return;
    }

    setIsFetchingGps(true);
    setGpsError(null);

    let bestAcc = 999999;
    let hasFinalized = false;

    // Use watchPosition for continuous satellite convergence (refining accuracy from Wi-Fi ~50m down to satellite ~5m)
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const accMeters = Math.round(accuracy);

        if (accMeters < bestAcc) {
          bestAcc = accMeters;
          const formatted = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setGpsCoordinates(formatted);
          setGpsAccuracy(accMeters);
        }

        // If satellite lock reached high precision (<= 15 meters), finalize immediately
        if (accMeters <= 15) {
          hasFinalized = true;
          navigator.geolocation.clearWatch(watchId);
          setIsFetchingGps(false);
          const successMsg =
            language === 'hi'
              ? `उच्च सटीकता उपग्रह GPS लॉक हुआ (±${accMeters}m)`
              : `High-precision Satellite GPS locked (±${accMeters}m accuracy)`;
          onNotify(successMsg);
        }
      },
      (error) => {
        navigator.geolocation.clearWatch(watchId);
        setIsFetchingGps(false);
        if (!hasFinalized && bestAcc === 999999) {
          let errorMsg = 'Failed to acquire device GPS location.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg =
              language === 'hi'
                ? 'GPS स्थान की अनुमति अस्वीकृत। कृपया ब्राउज़र या फ़ोन में स्थान (Location) चालू करें, या निर्देशांक मैन्युअल दर्ज करें।'
                : 'Location permission denied. Please allow location access in your browser or enter coordinates manually.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg =
              language === 'hi'
                ? 'GPS सिग्नल अनुपलब्ध है। कृपया खुली जगह में पुनः प्रयास करें।'
                : 'GPS position unavailable. Please ensure location services are enabled on your device.';
          } else if (error.code === error.TIMEOUT) {
            errorMsg =
              language === 'hi'
                ? 'GPS अनुरोध का समय समाप्त। कृपया पुनः प्रयास करें।'
                : 'GPS location request timed out. Please try again.';
          }
          setGpsError(errorMsg);
          onNotify(errorMsg);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Timeout after 5 seconds to take the best reading available (Wi-Fi or satellite)
    setTimeout(() => {
      if (!hasFinalized) {
        hasFinalized = true;
        navigator.geolocation.clearWatch(watchId);
        setIsFetchingGps(false);
        if (bestAcc < 999999) {
          const note =
            bestAcc > 20
              ? language === 'hi'
                ? `स्थान लॉक (सटीकता: ±${bestAcc}m)। मोबाइल फ़ोन में उपग्रह जीपीएस ±5m तक सटीक रहता है।`
                : `Location locked (±${bestAcc}m). Smartphones outdoors achieve ±5m precision.`
              : language === 'hi'
              ? `सटीक GPS स्थान दर्ज: ±${bestAcc}m`
              : `GPS locked: ±${bestAcc}m accuracy`;
          onNotify(note);
        }
      }
    }, 5000);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateAlert(null);
    if (!custName.trim() || !custPhone.trim()) return;

    // Check for duplicate phone number
    const cleanInputPhone = custPhone.replace(/[^0-9]/g, '');
    const duplicate = customers.find((c) => {
      const p = c.phone.replace(/[^0-9]/g, '');
      return (
        p === cleanInputPhone ||
        (p.length >= 10 && cleanInputPhone.length >= 10 && p.slice(-10) === cleanInputPhone.slice(-10))
      );
    });

    if (duplicate) {
      setDuplicateAlert({
        show: true,
        message:
          language === 'hi'
            ? `दोहरा पंजीकरण अवरुद्ध! यह ग्राहक पहले से ID "${duplicate.id}" (${duplicate.name}) के रूप में ${duplicate.assignedDriverName || 'ड्राइवर'} (${duplicate.assignedVanId || 'Van #02'}) में पंजीकृत है। 2 ड्राइवर एक ही व्यक्ति पर गलती न करें, इसलिए एक ग्राहक के 2 ID नहीं बनाए जा सकते।`
            : `Duplicate Registration Blocked! This person is already registered under ID "${duplicate.id}" (${duplicate.name}) and assigned exclusively to ${duplicate.assignedDriverName || 'Driver'} (${duplicate.assignedVanId || 'Van #02'}). Creating multiple IDs for the same person is prohibited so 2 different drivers cannot mistakenly service the same customer.`,
        existing: duplicate,
      });
      return;
    }

    // Determine strict single van/driver assignment based on sector
    const isDriver2 = selectedSector.includes('Sector 14') || selectedSector.includes('Lakeview');
    const assignedVanId = isDriver2 ? 'van-01' : 'van-02';
    const assignedVanPlate = isDriver2 ? 'MH-12-BR-3041' : 'MH-12-BR-3042';
    const assignedDriverName = isDriver2 ? 'Suresh Kumar (Driver 2)' : 'Rajesh Patil (Driver 1)';

    const parsedCoords = parseCoordinates(gpsCoordinates);
    const newCust: CustomerAccount = {
      id: `MUM-${Math.floor(8900 + Math.random() * 900)}`,
      name: custName.trim(),
      phone: `+91 ${custPhone.trim()}`,
      email: custEmail.trim() || 'info@client.com',
      accountType: accType,
      sector: selectedSector,
      hub: 'Main Water Plant',
      assignedVanId: assignedVanId,
      assignedVanPlate: assignedVanPlate,
      assignedDriverName: assignedDriverName,
      premises: premises || 'Town Delivery Point',
      coordinates: parsedCoords,
      productTier: productTier === '20L' ? '20L Mineral Can' : '1L Case (12 Pcs)',
      canQuota: productTier === '20L' ? dropQuantity : 0,
      packQuota: productTier === '1L' ? dropQuantity : 0,
      cadence: cadence,
      slot: slot,
      emptiesBalance: {
        clean: dropQuantity,
        held: dropQuantity,
        status: 'Clean',
      },
      depositAmount: depositTotal,
      whatsAppOptIn: whatsAppOptIn,
      status: 'Active',
    };

    // Dynamic server API integration with Supabase & Duplicate Verification
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCust),
      });
      const data = await res.json();
      if (!res.ok || data.duplicate) {
        setDuplicateAlert({
          show: true,
          message: data.error || 'Duplicate customer registration rejected by server.',
        });
        return;
      }
    } catch (err) {
      console.warn('Server customer sync:', err);
    }

    setCustomers([newCust, ...customers]);
    onNotify(`Account created for ${custName}! Exclusively assigned to ${assignedDriverName} (${assignedVanId}).`);

    // Reset Form
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setPremises('');
    setGpsCoordinates('');
    setGpsAccuracy(null);
    setGpsError(null);
  };

  const handleExportRunSheet = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Customer,Type,Sector,Coordinates,Allocation,EmptiesHeld,Deposit\n' +
      customers
        .map(
          (c) =>
            `${c.id},"${c.name}",${c.accountType},"${c.sector}","${c.coordinates.formatted}","${
              c.canQuota ? `${c.canQuota} x 20L` : `${c.packQuota} x 1L`
            }",${c.emptiesBalance.held},₹${c.depositAmount}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Mumpy_Route_RunSheet_${selectedSector.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('Exported Route Run Sheet CSV.');
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    const matchesSector = sectorFilter === 'All Sectors' || c.sector.includes(sectorFilter);
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Clean' && c.emptiesBalance.status === 'Clean') ||
      (statusFilter === 'Alert' && c.emptiesBalance.status === 'Deposit Alert');
    return matchesSearch && matchesSector && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
      {/* Top Metric Ribbon & Header Context */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-secondary font-bold bg-secondary-fixed/40 px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider">
              {t('crmProtocol')}
            </span>
            <span className="text-outline">•</span>
            <span className="text-xs text-on-surface-variant font-semibold">
              {language === 'hi' ? 'मुख्य जल संयंत्र • नगर वितरण' : 'Main Water Plant • Town Distribution'}
            </span>
          </div>
          <h1 className="text-headline-lg text-primary tracking-tight font-extrabold">
            {t('customerDirectoryTitle')}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {t('customerDirectorySubtitle')}
          </p>
        </div>

        {/* Quick Operational Metrics Bento */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-surface-container-lowest shadow-sm border border-surface-container rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
              <Icon name="groups" className="text-2xl" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-outline uppercase font-bold">{t('totalAccounts')}</span>
              <span className="text-headline-sm text-on-surface font-extrabold leading-none">
                {customers.length + 337}
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest shadow-sm border border-surface-container rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
              <Icon name="person_add" className="text-2xl" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-outline uppercase font-bold">{t('newThisMonth')}</span>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-headline-sm text-secondary font-extrabold">28</span>
                <span className="text-[10px] bg-secondary-fixed text-on-secondary-fixed px-1.5 py-0.2 rounded font-bold">
                  +14%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest shadow-sm border border-surface-container rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
              <Icon name="verified" className="text-2xl" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-outline uppercase font-bold">{t('activeFulfillment')}</span>
              <span className="text-headline-sm text-on-surface font-extrabold leading-none">
                98.4%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Intake Form (Left 5 cols) & Directory Explorer (Right 7 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Customer Onboarding Form (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-surface-container p-6 relative overflow-hidden">
            {/* Hydro Decorative Water Glow */}
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 mb-5 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
                  <Icon name="person_pin" className="text-xl" />
                </div>
                <div>
                  <h2 className="text-headline-sm text-primary font-bold">
                    {t('newCustomerOnboarding')}
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    {t('fastDispatchTagging')}
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-bold uppercase tracking-wider">
                {t('step1of3')}
              </span>
            </div>

            {isDriver && (
              <div className="mb-4 p-3 rounded-2xl bg-secondary-fixed/25 border border-secondary/40 text-on-secondary-fixed flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs">
                  <Icon name="local_shipping" className="text-secondary text-xl shrink-0" />
                  <div>
                    <strong className="font-bold text-primary block text-xs">
                      {language === 'hi' ? 'ड्राइवर ऑनबोर्डिंग अधिकार सक्रिय' : 'Driver Registration Power Active'}
                    </strong>
                    <span className="text-[11px] text-on-surface-variant block">
                      {language === 'hi'
                        ? `नए ग्राहक स्वचालित रूप से आपके वाहन (${driverVanName}) और रूट में जुड़ेंगे।`
                        : `New accounts will be registered and locked to your vehicle (${driverVanName}).`}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-secondary text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  {driverPlate}
                </span>
              </div>
            )}

            {duplicateAlert?.show && (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <Icon name="warning" className="text-amber-600 mt-0.5" size={18} />
                  <div className="flex-1 text-xs">
                    <strong className="font-bold text-amber-900 block text-[13px]">
                      {language === 'hi' ? 'दोहरा पंजीकरण अवरुद्ध (एंटी-डुप्लीकेशन सक्रिय)' : 'Duplicate Registration Blocked (Anti-Duplication Active)'}
                    </strong>
                    <p className="mt-0.5 leading-relaxed text-amber-800">
                      {duplicateAlert.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDuplicateAlert(null)}
                    className="p-1 rounded-lg hover:bg-amber-100 text-amber-600 hover:text-amber-900"
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
                {duplicateAlert.existing && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery(duplicateAlert.existing!.id);
                      setDuplicateAlert(null);
                    }}
                    className="self-start text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Icon name="search" size={12} />
                    {language === 'hi' ? 'मौजूदा ग्राहक रिकॉर्ड देखें' : 'View Existing Customer Profile'}
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="flex flex-col gap-4 text-xs">
              {/* Classification Selector */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary flex items-center gap-1.5 text-xs">
                  <Icon name="badge" className="text-base" />
                  {t('contactBillingIdentity')}
                </span>
                <div className="flex bg-surface-container-low p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAccType('Residential')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      accType === 'Residential'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {t('residential')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccType('Office / B2B')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      accType === 'Office / B2B'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {t('officeB2b')}
                  </button>
                </div>
              </div>

              {/* Name & Contact */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-on-surface">
                  {t('fullNameEntity')} <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Zenitron Software Labs / Arvind Rao"
                  className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-on-surface">
                    {t('primaryContactSms')} <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-outline font-bold">+91</span>
                    <input
                      type="tel"
                      required
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      placeholder="98230 45892"
                      className="pl-11 pr-3 py-2 w-full rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-on-surface">{t('billingEmail')}</label>
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="accounts@company.com"
                    className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={whatsAppOptIn}
                  onChange={(e) => setWhatsAppOptIn(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="text-on-surface-variant font-medium">
                  {t('whatsAppOptIn')}
                </span>
              </label>

              {/* Delivery Destination & Geofence Coordinates */}
              <div className="flex flex-col gap-2 pt-2 border-t border-surface-container">
                <span className="font-bold text-primary flex items-center gap-1.5 text-xs">
                  <Icon name="location_on" className="text-base" />
                  {t('deliveryDestination')}
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-on-surface">{t('operationalSector')}</label>
                    <select
                      value={selectedSector}
                      onChange={(e) => setSelectedSector(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface text-xs font-medium focus:ring-2 focus:ring-primary"
                    >
                      <option>IT Corridor - Phase 2</option>
                      <option>Lakeview Residential</option>
                      <option>Sector 14 &amp; 15</option>
                      <option>Civil Lines &amp; Hospitals</option>
                      <option>Kalyani Hills</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-on-surface">{t('assignedRouteVan')}</label>
                    <select
                      value={assignedVan}
                      onChange={(e) => setAssignedVan(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface text-xs font-medium focus:ring-2 focus:ring-primary"
                    >
                      <option>Van #04 (Ramesh Patil - IT Corridor)</option>
                      <option>Van #01 (Suresh Kumar - Sector 14)</option>
                      <option>Van #02 (Ramesh Patil - Express)</option>
                      <option>Van #03 (Amit Varma - Model Colony)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-on-surface">{t('premisesUnit')}</label>
                  <input
                    type="text"
                    value={premises}
                    onChange={(e) => setPremises(e.target.value)}
                    placeholder="Tower B, Suite 402, Quantum Heights"
                    className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-on-surface text-xs flex items-center gap-1">
                      <Icon name="my_location" className="text-secondary text-sm" />
                      <span>{language === 'hi' ? 'जीपीएस स्थान (निर्देशांक)' : 'GPS Coordinates'}</span>
                    </label>
                    {gpsAccuracy !== null && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          gpsAccuracy <= 15
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                        title={
                          gpsAccuracy <= 15
                            ? 'High Precision Satellite GPS'
                            : 'Estimated via Wi-Fi network. Smart phones outdoors achieve ±5m satellite GPS.'
                        }
                      >
                        {gpsAccuracy <= 15 ? (
                          <>
                            <span>✓</span>
                            <span>{language === 'hi' ? `उपग्रह GPS (±${gpsAccuracy}m)` : `Satellite GPS (±${gpsAccuracy}m)`}</span>
                          </>
                        ) : (
                          <>
                            <Icon name="wifi" size={10} />
                            <span>{language === 'hi' ? `वाई-फ़ाई स्थान (±${gpsAccuracy}m)` : `Network/Wi-Fi Fix (±${gpsAccuracy}m)`}</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={gpsCoordinates}
                        onChange={(e) => {
                          setGpsCoordinates(e.target.value);
                          setGpsError(null);
                        }}
                        placeholder={language === 'hi' ? 'उदा: 20.5937, 78.9629 या लाइव प्राप्त करें' : 'e.g. 20.5937, 78.9629 or tap fetch'}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleFetchCoordinates}
                      disabled={isFetchingGps}
                      className="px-3.5 py-2 rounded-xl bg-secondary text-white hover:bg-secondary-dim font-bold text-xs shadow-xs flex items-center gap-1.5 shrink-0 transition-all disabled:opacity-50"
                      title="Fetch current device location via GPS"
                    >
                      {isFetchingGps ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{language === 'hi' ? 'सटीक खोज...' : 'Refining...'}</span>
                        </>
                      ) : (
                        <>
                          <Icon name="my_location" className="text-sm" />
                          <span>{language === 'hi' ? 'लाइव GPS लें' : 'Get Live GPS'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {gpsAccuracy !== null && gpsAccuracy > 20 && (
                    <div className="p-2 rounded-xl bg-surface-container-low border border-surface-container text-[10.5px] text-on-surface-variant flex items-center gap-1.5">
                      <Icon name="info" size={13} className="text-secondary shrink-0" />
                      <span>
                        {language === 'hi'
                          ? 'लैपटॉप केवल वाई-फ़ाई सिग्नल (±50m) का उपयोग करते हैं। ड्राइवर के मोबाइल फ़ोन में उपग्रह (Satellite GPS) से ±3-8m सटीक स्थान मिलता है।'
                          : 'Laptops estimate location via Wi-Fi (±50m). Drivers using mobile phones outdoors with satellite GPS achieve ±3m to ±8m precision.'}
                      </span>
                    </div>
                  )}

                  {gpsCoordinates && (
                    <div className="flex items-center justify-between text-[11px] px-1">
                      <span className="text-on-surface-variant font-medium">
                        {language === 'hi' ? 'स्थान पिन किया गया' : 'Location pinned'}
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${encodeURIComponent(gpsCoordinates)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary font-bold hover:underline flex items-center gap-1"
                      >
                        <Icon name="open_in_new" size={12} />
                        <span>{language === 'hi' ? 'गूगल मैप्स पर देखें' : 'View on Google Maps'}</span>
                      </a>
                    </div>
                  )}

                  {gpsError && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] flex items-center gap-1.5">
                      <Icon name="warning" size={14} className="text-amber-600 shrink-0" />
                      <span>{gpsError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Water Specification & Quota */}
              <div className="flex flex-col gap-2 pt-2 border-t border-surface-container">
                <span className="font-bold text-primary flex items-center gap-1.5 text-xs">
                  <Icon name="water_drop" className="text-base" />
                  {t('waterSpecQuota')}
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setProductTier('20L')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      productTier === '20L'
                        ? 'border-primary bg-primary-fixed/20 shadow-xs'
                        : 'border-surface-container bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary text-xs">{t('mineralCan20L')}</span>
                      <Icon name="check_circle" className="text-sm text-primary" />
                    </div>
                    <span className="text-[11px] text-on-surface-variant block mt-1">
                      {t('canDesc')}
                    </span>
                  </div>

                  <div
                    onClick={() => setProductTier('1L')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      productTier === '1L'
                        ? 'border-secondary bg-secondary-fixed/30 shadow-xs'
                        : 'border-surface-container bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-secondary text-xs">{t('mumpyCase1L')}</span>
                      <Icon name="inventory_2" className="text-sm text-secondary" />
                    </div>
                    <span className="text-[11px] text-on-surface-variant block mt-1">
                      {t('caseDesc')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 items-center pt-1">
                  <div>
                    <span className="font-semibold text-on-surface block mb-1">{t('quantityPerDrop')}</span>
                    <div className="flex items-center justify-between bg-white rounded-xl p-1 border border-surface-container">
                      <button
                        type="button"
                        onClick={() => setDropQuantity(Math.max(1, dropQuantity - 1))}
                        className="w-6 h-6 rounded bg-surface-container font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm text-primary">{dropQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setDropQuantity(dropQuantity + 1)}
                        className="w-6 h-6 rounded bg-surface-container font-bold text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-on-surface block mb-1">{t('cadence')}</span>
                    <select
                      value={cadence}
                      onChange={(e: any) => setCadence(e.target.value)}
                      className="w-full py-1.5 px-2 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium"
                    >
                      <option value="Daily">{t('daily')}</option>
                      <option value="Alternate Days">{t('altDays')}</option>
                      <option value="Weekly Mon">{t('weeklyMon')}</option>
                    </select>
                  </div>

                  <div>
                    <span className="font-semibold text-on-surface block mb-1">{t('slot')}</span>
                    <select
                      value={slot}
                      onChange={(e: any) => setSlot(e.target.value)}
                      className="w-full py-1.5 px-2 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium"
                    >
                      <option>07 - 10 AM</option>
                      <option>10 - 01 PM</option>
                      <option>02 - 05 PM</option>
                    </select>
                  </div>
                </div>

                {productTier === '20L' && (
                  <div className="p-3 bg-secondary-fixed/20 border border-secondary/30 rounded-xl flex items-center justify-between text-xs text-on-secondary-fixed">
                    <span>{t('emptyCanDepositCalc').replace('{count}', dropQuantity.toString())}</span>
                    <strong className="font-bold text-sm">₹{depositTotal}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-surface-container">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-primary text-white font-extrabold text-xs hover:bg-primary-container shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Icon name="person_add" className="text-base" />
                  {t('saveAndAssignRoute')}
                </button>
                <button
                  type="button"
                  onClick={() => onNotify('Tag QR code generated for client doorstep sticker.')}
                  className="px-4 py-3 rounded-2xl bg-surface-container text-primary font-bold text-xs hover:bg-surface-container-high transition-colors flex items-center gap-1"
                >
                  <Icon name="qr_code" className="text-base" />
                  {t('tagQr')}
                </button>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl text-[11px] text-on-surface-variant flex items-start gap-2">
                <Icon name="verified_user" className="text-secondary text-sm mt-0.5" />
                <span>
                  {t('automatedManifestSyncNote')}
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Directory Explorer (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          {/* Route Cluster Optimization banner */}
          <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-surface-container flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
                <Icon name="hub" className="text-2xl" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-primary">
                    {t('routeClusterOptimization')}
                  </h4>
                  <span className="text-[10px] text-outline">{t('updated2mAgo')}</span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  {t('clusterDesc')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold shrink-0">
              <div>
                <span className="text-outline text-[10px] uppercase block">{t('emptiesInTransit')}</span>
                <span className="text-primary text-sm">142 Cans</span>
              </div>
              <div className="h-7 w-px bg-surface-container" />
              <div>
                <span className="text-outline text-[10px] uppercase block">{t('depositsHeld')}</span>
                <span className="text-secondary text-sm">₹51,300</span>
              </div>
            </div>
          </div>

          {/* Client Directory Explorer */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container">
              <div>
                <h3 className="text-headline-sm text-primary font-bold">
                  {t('clientDirectoryTitle')}
                </h3>
                <span className="text-xs text-on-surface-variant">
                  {t('manageBottleBalances')}
                </span>
              </div>

              <button
                onClick={handleExportRunSheet}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low text-secondary font-bold text-xs hover:bg-surface-container transition-all border border-surface-container"
              >
                <Icon name="download" className="text-base" />
                {t('exportRunSheet')}
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Icon name="search" className="absolute left-3 top-2.5 text-outline text-base" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchClientPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary"
              >
                <option value="All Sectors">{t('allSectors')}</option>
                <option>IT Corridor</option>
                <option>Lakeview</option>
                <option>Sector 14</option>
                <option>Hospitals</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary"
              >
                <option>All</option>
                <option>Clean</option>
                <option>Alert</option>
              </select>
            </div>

            {/* Directory Rows */}
            <div className="flex flex-col gap-3">
              {filteredCustomers.map((cust) => (
                <div
                  key={cust.id}
                  className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container hover:border-secondary/40 hover:bg-surface-container-low/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                      {cust.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-on-surface text-sm font-bold">{cust.name}</strong>
                        <span className="text-[10px] bg-secondary-fixed text-on-secondary-fixed font-bold px-2 py-0.2 rounded">
                          {cust.accountType}
                        </span>
                      </div>
                      <span className="text-xs text-outline block mt-0.5">
                        {cust.id} • {cust.phone}
                      </span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                          <Icon name="location_on" className="text-xs text-outline" />
                          {cust.premises}
                        </p>
                        {cust.coordinates?.lat && cust.coordinates?.lng ? (
                          <a
                            href={`https://www.google.com/maps?q=${cust.coordinates.lat},${cust.coordinates.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-secondary font-bold hover:underline flex items-center gap-0.5 bg-secondary-fixed/50 px-2 py-0.5 rounded-md"
                            title="Open Google Maps Location"
                          >
                            <Icon name="navigation" size={10} />
                            <span>Maps</span>
                          </a>
                        ) : cust.coordinates?.formatted ? (
                          <span className="text-[10px] text-outline font-mono">
                            ({cust.coordinates.formatted})
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 text-xs">
                    <div>
                      <span className="text-[10px] text-outline uppercase font-semibold block">{t('allocation')}</span>
                      <strong className="text-primary font-bold block text-sm">
                        {cust.canQuota ? `${cust.canQuota} × 20L Cans` : `${cust.packQuota} × 1L Cases`}
                      </strong>
                      <span className="text-[10px] text-on-surface-variant font-medium">
                        {cust.cadence} ({cust.slot})
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-outline uppercase font-semibold block">{t('emptiesBalance')}</span>
                      <span
                        className={`text-xs font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                          cust.emptiesBalance.status === 'Clean'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {cust.emptiesBalance.status === 'Clean' ? '✓' : '!'} {cust.emptiesBalance.clean}/{cust.emptiesBalance.held} {cust.emptiesBalance.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${cust.phone}`}
                        className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                        title={t('call')}
                      >
                        <Icon name="call" className="text-base" />
                      </a>
                      <button
                        onClick={() => onNotify(`Route directions to ${cust.name} sent to Van pilot.`)}
                        className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary hover:bg-secondary hover:text-white transition-colors"
                        title={t('routeDirections')}
                      >
                        <Icon name="navigation" className="text-base" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination footer */}
            <div className="flex justify-between items-center text-xs text-on-surface-variant pt-3 border-t border-surface-container">
              <span>
                {t('showingAccounts').replace('{filtered}', filteredCustomers.length.toString()).replace('{total}', (customers.length + 337).toString())}
              </span>
              <div className="flex gap-2 font-bold">
                <button className="px-3 py-1 rounded-lg bg-surface-container-low text-outline hover:bg-surface-container">
                  {t('previous')}
                </button>
                <span className="px-3 py-1 rounded-lg bg-primary text-white">1</span>
                <button className="px-3 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container">
                  {t('next')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
