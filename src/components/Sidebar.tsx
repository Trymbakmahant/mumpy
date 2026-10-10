'use client';

import React from 'react';
import Image from 'next/image';
import { TabType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Icon } from './common/Icon';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  reservoirLevel?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  reservoirLevel = 92,
}) => {
  const { t, language } = useLanguage();
  const { role, user, logout } = useAuth();

  const isDriver2 = user?.email?.includes('driver2') || user?.assigned_van_id === 'van-01';
  const driverName = isDriver2 ? 'Suresh Kumar' : (user?.full_name?.replace(/\(.*\)/, '').trim() || 'Rajesh Patil');
  const driverRoleLabel = isDriver2 ? 'Driver 2 (Van #01)' : 'Driver 1 (Van #02)';
  const driverVanPlate = isDriver2 ? 'MH-12-BR-3041' : 'MH-12-BR-3042';
  const driverSector = isDriver2 ? 'Sector 14 & 15' : 'IT Corridor';

  const navItems: { id: TabType; labelKey: string; icon: string; count?: string }[] =
    role === 'driver'
      ? [
          {
            id: 'driver-delivery',
            labelKey: 'driverProximity',
            icon: 'local_shipping',
            count: language === 'hi' ? '14 स्टॉप' : '14 drops',
          },
          {
            id: 'customer-directory',
            labelKey: 'customerDirectory',
            icon: 'person_add',
            count: language === 'hi' ? '+ नया' : '+ Register',
          },
        ]
      : [
          {
            id: 'admin-insights',
            labelKey: 'adminInsights',
            icon: 'analytics',
          },
          {
            id: 'delivery-history',
            labelKey: 'deliveryHistory',
            icon: 'receipt_long',
          },
          {
            id: 'customer-directory',
            labelKey: 'customerDirectory',
            icon: 'group_add',
            count: '342',
          },
        ];

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-surface-container-lowest/90 backdrop-blur-md z-40 flex flex-col justify-between p-3.5 border-r border-surface-container-high/60 hidden md:flex shadow-xs">
      <div className="flex flex-col gap-4">
        {/* User / Driver Profile Header Card */}
        {role === 'driver' ? (
          <div className="p-3 rounded-2xl bg-surface-container-low/70 border border-surface-container flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-1 ring-primary/20 shrink-0 bg-white">
              <Image
                src="/images/avatar-rajesh.png"
                alt={driverName}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-on-surface text-xs truncate">
                  {driverName}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Online" />
              </div>
              <span className="text-[10px] text-on-surface-variant font-medium truncate">
                {driverRoleLabel}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-50 to-slate-50 border border-brand-100/80 flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-brand-700 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="leading-tight">
              <h4 className="font-bold text-xs text-slate-900">Operations Hub Admin</h4>
              <p className="text-[11px] text-slate-500 font-medium">Shift: Morning Supervisor</p>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1 mt-1 text-[10px] text-brand-600 font-semibold hover:underline cursor-pointer"
              >
                <span>Switch Hub Role</span>
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <div className="flex flex-col gap-1">
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-outline">
            {role === 'driver' ? (language === 'hi' ? 'दैनिक मार्ग' : 'Delivery Actions') : t('operationalUnits')}
          </span>

          <nav className="flex flex-col gap-1.5 mt-1">
            {role === 'driver' ? (
              navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-title-md text-left text-xs ${
                      isActive
                        ? 'bg-primary text-white shadow-sm font-bold scale-[1.01]'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        name={item.icon}
                        className={isActive ? 'text-white' : 'text-primary'}
                        size={18}
                      />
                      <span>{t(item.labelKey)}</span>
                    </div>
                    {item.count && (
                      <span
                        className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin-insights')}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-title-md text-left text-xs cursor-pointer ${
                    activeTab === 'admin-insights'
                      ? 'bg-brand-navy text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className={`w-4 h-4 ${activeTab === 'admin-insights' ? 'text-brand-300' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    <span>{language === 'hi' ? 'एडमिन इनसाइट्स' : 'Admin Insights'}</span>
                  </div>
                  {activeTab === 'admin-insights' && <span className="w-2 h-2 rounded-full bg-brand-400"></span>}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('delivery-history')}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-title-md text-left text-xs cursor-pointer ${
                    activeTab === 'delivery-history'
                      ? 'bg-brand-navy text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    <span>{language === 'hi' ? 'इतिहास और निपटान' : 'History & Settlements'}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('customer-directory')}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-title-md text-left text-xs cursor-pointer ${
                    activeTab === 'customer-directory'
                      ? 'bg-brand-navy text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    <span>{language === 'hi' ? 'ग्राहक निर्देशिका' : 'Customer Directory'}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-slate-100 text-slate-600">342</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin-insights');
                    const el = document.getElementById('jar-inventory');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    <span>{language === 'hi' ? 'जार वापसी और नुकसान' : 'Jar Return & Losses'}</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-amber-700">140 Due</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin-insights');
                    const el = document.getElementById('live-routes');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    <span>{language === 'hi' ? 'रूट डिस्पैच' : 'Route Dispatch'}</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Driver Quick Shift Progress Card (clean, practical, no fake telemetry) */}
        {role === 'driver' && (
          <div className="p-3.5 rounded-2xl bg-surface-container-low/50 border border-surface-container flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                <Icon name="clock" size={11} className="text-secondary" />
                <span>{language === 'hi' ? 'आज का शिफ्ट लक्ष्य' : 'Shift Target'}</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                67% {language === 'hi' ? 'पूर्ण' : 'Done'}
              </span>
            </div>

            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <strong className="text-primary font-bold">28 {language === 'hi' ? 'वितरित' : 'Drops Done'}</strong>
                <span className="text-outline text-[11px]">14 {language === 'hi' ? 'शेष' : 'Remaining'}</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: '67%' }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-surface-container flex items-center justify-between text-[11px] text-on-surface-variant">
              <span className="flex items-center gap-1">
                <Icon name="navigation" size={11} className="text-secondary" />
                <span>{driverSector}</span>
              </span>
              <span className="font-mono text-[10px] text-outline">{driverVanPlate}</span>
            </div>
          </div>
        )}

        {/* Quick Plant Assistance Contact for Driver */}
        {role === 'driver' && (
          <div className="p-3 rounded-2xl bg-secondary-fixed/30 border border-secondary-fixed flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-secondary text-white flex items-center justify-center shrink-0">
                <Icon name="phone" size={13} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-on-surface-variant block">
                  {language === 'hi' ? 'प्लांट सहायता' : 'Plant Dispatch'}
                </span>
                <span className="text-[11px] font-bold text-secondary">
                  +91 98220 11990
                </span>
              </div>
            </div>
            <a
              href="tel:+919822011990"
              className="px-2 py-1 rounded-lg bg-white text-secondary font-bold text-[10px] shadow-2xs hover:bg-secondary hover:text-white transition-all"
              title="Call Plant Dispatch"
            >
              {language === 'hi' ? 'कॉल' : 'Call'}
            </a>
          </div>
        )}
        {/* Admin Live Feed Alert Mini-Box */}
        {role === 'admin' && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[11px] text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                Live Feed Alert
              </span>
              <span className="text-[10px] text-slate-400">Just now</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              <strong>Van #04</strong> restocked <span className="text-brand-600 font-bold">120 Jars</span> at IT Park Tech Phase 2.
            </p>
            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>SLA On-Time:</span>
              <span className="text-emerald-600 font-bold">98.4%</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Admin Plant Reservoir or Driver Footer with Logout */}
      <div className="flex flex-col gap-2 pt-2 border-t border-surface-container">
        {role === 'admin' ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-brand-900 to-brand-navy text-white shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-brand-200 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" d="M10 2a.75.75 0 01.75.75v.259l.215.086c2.404.962 4.035 3.298 4.035 5.905 0 3.314-2.686 6-6 6s-6-2.686-6-6c0-2.607 1.631-4.943 4.035-5.905l.215-.086V2.75A.75.75 0 0110 2z" fillRule="evenodd"></path>
                </svg>
                PLANT RESERVOIR
              </span>
              <span className="text-cyan-300 font-mono font-bold">{reservoirLevel}% Full</span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden my-2">
              <div
                className="bg-gradient-to-r from-cyan-400 to-brand-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${reservoirLevel}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[11px] text-brand-100">
              <span>RO Line Active</span>
              <span className="font-mono font-bold text-white">18,400L Total</span>
            </div>
          </div>
        ) : null}

        {/* Clean Logout / Switch Role Button */}
        <button
          onClick={logout}
          className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-all text-xs font-semibold group"
          title="Sign out of current account"
        >
          <div className="flex items-center gap-2">
            <Icon name="logout" size={15} className="group-hover:text-error transition-colors" />
            <span>{language === 'hi' ? 'लॉग आउट / खाता बदलें' : 'Sign Out / Switch'}</span>
          </div>
          <span className="text-[10px] text-outline group-hover:text-on-error-container">
            {role === 'driver' ? 'Driver' : 'Admin'}
          </span>
        </button>
      </div>
    </aside>
  );
};
