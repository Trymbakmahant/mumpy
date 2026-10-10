'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { TabType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Icon } from './common/Icon';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenBroadcast: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenBroadcast,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, role, openLoginModal, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isDriver2 = user?.email?.includes('driver2') || user?.assigned_van_id === 'van-01';
  const driverVanTitle = isDriver2 ? 'Van #01 (Suresh Kumar)' : 'Van #02 (Rajesh Patil)';
  const driverVanShort = isDriver2 ? 'Van #01' : 'Van #02';

  const adminNotifications = [
    {
      id: 1,
      title: language === 'hi' ? 'कम बोतल थ्रेशोल्ड अलर्ट' : 'Low Bottle Threshold Alert',
      desc: language === 'hi' ? 'वैन #03 (अमित वर्मा) के पास मॉडल कॉलोनी में 4 बोतलें बची हैं।' : 'Van #03 (Amit Varma) reached 4 bottles in Model Colony.',
      time: '3m ago',
      unread: true,
      type: 'warning',
    },
    {
      id: 2,
      title: language === 'hi' ? 'रूट बैच पूरा हुआ' : 'Route Batch Completed',
      desc: language === 'hi' ? 'वैन #01 ने ओम साई रेजिडेंसी पर स्टॉप #14 पूरा किया।' : 'Van #01 finished stop #14 at Om Sai Residency.',
      time: '12m ago',
      unread: true,
      type: 'success',
    },
    {
      id: 3,
      title: language === 'hi' ? 'थोक कॉर्पोरेट ऑर्डर' : 'Bulk Corporate Order',
      desc: language === 'hi' ? 'इन्फोसिस कैफेटेरिया #2 ने दोपहर 14:00 बजे +140 जार का अनुरोध किया।' : 'Infosys Cafeteria #2 requested +140 20L jars for 14:00.',
      time: '35m ago',
      unread: false,
      type: 'info',
    },
  ];

  const driverNotifications = [
    {
      id: 1,
      title: language === 'hi' ? 'अगला स्टॉप कतार में' : 'Next Priority Stop',
      desc: language === 'hi' ? 'साइबर हाइट्स (फ्लैट 402) - 2 कैन डिलीवरी और 2 खाली जार वापसी।' : 'Cyber Heights (Flat 402) - 2 cans delivery and 2 empties retrieval.',
      time: 'Just now',
      unread: true,
      type: 'info',
    },
    {
      id: 2,
      title: language === 'hi' ? 'डिजिटल यूपीआई भुगतान प्राप्त' : 'Doorstep UPI Confirmed',
      desc: language === 'hi' ? 'ओम साई रेजिडेंसी ने ₹140 यूपीआई से भुगतान किया।' : 'Om Sai Residency paid ₹140 via UPI QR.',
      time: '15m ago',
      unread: false,
      type: 'success',
    },
  ];

  const notifications = role === 'driver' ? driverNotifications : adminNotifications;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex items-center justify-between px-3 md:px-6 border-b border-surface-container-high/60">
      {/* Brand Logo & Hub Status */}
      <div className="flex items-center gap-2.5 md:gap-5">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center p-0.5 border border-surface-container shrink-0">
            <Image
              src="/images/mumpy-logo.png"
              alt="Mumpy Logo"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <span className="font-extrabold text-headline-sm text-primary tracking-tight font-sans">
            {t('brandTitle')}
          </span>
        </div>

        <div className="h-5 w-px bg-outline-variant/40 hidden sm:block" />

        {role === 'driver' ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed border border-secondary-container/40">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shrink-0" />
            <span className="font-label-sm uppercase tracking-wider font-bold text-[10px] sm:text-[11px] truncate max-w-[170px] sm:max-w-none">
              {language === 'hi' ? `${driverVanShort} जीपीएस सक्रिय` : `${driverVanShort} GPS ACTIVE`}
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-xs font-semibold tracking-wide shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="tracking-wider">{language === 'hi' ? 'लाइव जल आपूर्ति' : 'LIVE WATER DELIVERIES'}</span>
          </div>
        )}
      </div>

      {/* Dispatched Telemetry Metrics on larger displays */}
      <div className="hidden lg:flex items-center gap-3 bg-surface-container-low px-4 py-1.5 rounded-full border border-surface-container">
        {role === 'driver' ? (
          <>
            <Icon name="local_shipping" className="text-secondary" size={16} />
            <span className="text-body-sm text-on-surface-variant">
              {language === 'hi' ? 'वैन स्टॉक' : 'Van Stock'}: <strong className="text-primary font-bold">42 Cans</strong>
            </span>
            <span className="text-outline-variant text-body-sm">|</span>
            <span className="text-body-sm text-on-surface-variant">
              {language === 'hi' ? 'डिलीवरी पूर्ण' : 'Shift Drops'}: <strong className="text-secondary font-bold">28 Done</strong>
            </span>
            <span className="text-outline-variant text-body-sm">|</span>
            <span className="text-body-sm text-on-surface-variant">
              {language === 'hi' ? 'नकद शेष' : 'In-Van Cash'}: <strong className="text-emerald-700 font-bold">₹3,920</strong>
            </span>
          </>
        ) : (
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-500"></div>
              <span>In Transit: <strong className="text-slate-900 font-bold font-mono">420</strong> units</span>
            </div>
            <div className="h-3.5 w-px bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Delivered Today: <strong className="text-slate-900 font-bold font-mono">1,620</strong></span>
            </div>
            <div className="h-3.5 w-px bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Plant RO Active:</span>
              <strong className="text-brand-600 font-bold font-mono">18,400L (92%)</strong>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: Language Selector, Search, Notifications, Profile */}
      <div className="flex items-center gap-2 md:gap-3.5">
        {/* Language Switcher (EN / हिंदी) */}
        <div className="flex items-center bg-surface-container-low p-0.5 rounded-xl border border-surface-container text-xs font-semibold">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              language === 'en'
                ? 'bg-primary text-white shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="English"
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
              language === 'hi'
                ? 'bg-secondary text-white shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="हिंदी (Hindi)"
          >
            <span>हिंदी</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Icon name="search" className="absolute left-3 text-outline pointer-events-none" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="pl-9 pr-4 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-body-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary w-36 lg:w-52 transition-all border border-transparent focus:border-primary/20"
          />
        </div>

        {/* Notifications Icon & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <Icon name="notifications" size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-96 bg-white rounded-2xl shadow-xl border border-surface-container-high p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                <span className="font-bold text-title-md text-primary">
                  {t('operationalAlerts')}
                </span>
                <span className="text-xs bg-error-container text-on-error-container font-bold px-2 py-0.5 rounded-full">
                  {language === 'hi' ? '2 आवश्यक' : '2 Critical'}
                </span>
              </div>
              <div className="divide-y divide-surface-container-low max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 flex flex-col gap-1 hover:bg-surface-container-lowest transition-colors px-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-body-sm text-on-surface">
                        {n.title}
                      </span>
                      <span className="text-xs text-outline">{n.time}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">{n.desc}</p>
                  </div>
                ))}
              </div>
              {role === 'admin' && (
                <div className="pt-2 mt-1 border-t border-surface-container text-center">
                  <button
                    onClick={onOpenBroadcast}
                    className="text-xs text-secondary font-bold hover:underline"
                  >
                    {t('broadcastUrgentAlert')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Role & Switch Button */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-container-low border border-surface-container text-xs font-bold text-primary">
            <Icon
              name={role === 'driver' ? 'local_shipping' : 'admin_panel_settings'}
              size={16}
            />
            <span className="hidden sm:inline">
              {role === 'driver'
                ? driverVanTitle
                : language === 'hi' ? 'हब एडमिन' : 'Hub Admin'}
            </span>
            <span className="text-[10px] bg-secondary-fixed text-on-secondary-fixed font-bold px-1.5 py-0.2 rounded-md">
              {role === 'driver' ? 'PILOT' : 'ADMIN'}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-container hover:bg-surface-container-high border border-surface-container text-xs font-bold text-on-surface-variant hover:text-primary transition-all shadow-2xs"
            title="Return to Landing Page / Switch Role"
          >
            <Icon name="swap_horiz" size={14} />
            <span className="hidden lg:inline">
              {language === 'hi' ? 'रोल बदलें' : 'Switch Role'}
            </span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="relative">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-1 cursor-pointer select-none"
          >
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary-container/20 shadow-sm shrink-0">
              <Image
                src={user?.avatar_url || '/images/avatar-rajesh.png'}
                alt={user?.full_name || 'User'}
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="font-label-md text-on-surface font-semibold leading-tight">
                {user?.full_name || 'Rajesh Patil'}
              </span>
              <span className="font-label-sm text-on-surface-variant leading-tight">
                {role === 'driver'
                  ? language === 'hi' ? 'डिलीवरी पार्टनर' : 'Delivery Pilot'
                  : language === 'hi' ? 'हब एडमिन' : 'Operations Admin'}
              </span>
            </div>
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-surface-container-high p-3 z-50">
              <div className="flex items-center gap-3 p-2 bg-surface-container-low rounded-xl mb-2">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                  <Image
                    src={user?.avatar_url || '/images/avatar-rajesh.png'}
                    alt={user?.full_name || 'User'}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-primary truncate">
                    {user?.full_name || 'Rajesh Patil'}
                  </p>
                  <p className="text-xs text-on-surface-variant truncate">
                    {user?.email || 'rajesh.patil@mumpywater.com'}
                  </p>
                  <span className="text-[10px] bg-secondary-fixed text-on-secondary-fixed font-bold px-1.5 py-0.2 rounded inline-block mt-0.5">
                    {role === 'driver' ? 'Van #02 Pilot' : 'Full Admin Authority'}
                  </span>
                </div>
              </div>

              <div className="text-xs flex flex-col gap-1 text-on-surface-variant">
                <div className="flex justify-between py-1 border-b border-surface-container">
                  <span>{language === 'hi' ? 'सक्रिय भूमिका:' : 'Active Role:'}</span>
                  <strong className="text-primary font-bold uppercase">{role || 'admin'}</strong>
                </div>
                {role === 'driver' && (
                  <div className="flex justify-between py-1 border-b border-surface-container">
                    <span>{language === 'hi' ? 'सौंपी गई वैन:' : 'Assigned Van:'}</span>
                    <span className="font-semibold text-secondary">MH-12-BR-3042</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-surface-container">
                  <span>{language === 'hi' ? 'डेटाबेस:' : 'Database:'}</span>
                  <span className="font-semibold text-emerald-600">Supabase Live</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-surface-container flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    openLoginModal();
                  }}
                  className="w-full py-1.5 px-3 rounded-xl bg-surface-container text-primary font-bold text-xs hover:bg-surface-container-high transition-colors text-center"
                >
                  {language === 'hi' ? 'रोल बदलें / लॉगिन करें' : 'Switch Role / Login'}
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                    openLoginModal();
                  }}
                  className="w-full py-1.5 px-3 rounded-xl bg-error-container/40 text-on-error-container font-semibold text-xs hover:bg-error-container transition-colors text-center"
                >
                  {language === 'hi' ? 'लॉगआउट' : 'Sign Out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
