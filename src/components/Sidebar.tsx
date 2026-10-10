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
                {role === 'driver' ? driverName : (user?.full_name || 'Plant Admin')}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Online" />
            </div>
            <span className="text-[10px] text-on-surface-variant font-medium truncate">
              {role === 'driver' ? driverRoleLabel : 'Operations Supervisor'}
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex flex-col gap-1">
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-outline">
            {role === 'driver' ? (language === 'hi' ? 'दैनिक मार्ग' : 'Delivery Actions') : t('operationalUnits')}
          </span>

          <nav className="flex flex-col gap-1.5 mt-1">
            {navItems.map((item) => {
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
            })}
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
      </div>

      {/* Bottom Section: Admin Plant Reservoir or Driver Footer with Logout */}
      <div className="flex flex-col gap-2 pt-2 border-t border-surface-container">
        {role === 'admin' ? (
          <div className="p-3 bg-surface-container rounded-2xl flex flex-col gap-2 border border-surface-container-high/60 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="font-label-sm uppercase font-bold text-on-surface-variant text-[10.5px]">
                {t('plantReservoir')}
              </span>
              <span className="font-label-sm font-bold text-secondary text-xs">
                {reservoirLevel}% {t('full')}
              </span>
            </div>

            <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-secondary to-secondary-container h-full rounded-full transition-all duration-700"
                style={{ width: `${reservoirLevel}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-on-surface-variant pt-0.5">
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                {t('roLineActive')}
              </span>
              <span className="font-bold text-primary text-[11px]">18,400L</span>
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
