'use client';

import React from 'react';
import { TabType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Icon } from './common/Icon';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { t, language } = useLanguage();
  const { role, user, logout } = useAuth();

  const isDriver2 = user?.email?.includes('driver2') || user?.assigned_van_id === 'van-01';
  const driverVan = isDriver2 ? 'Van #01 (Suresh)' : 'Van #02 (Rajesh)';
  const driverSector = isDriver2 ? 'Sector 14 & 15' : 'IT Corridor';

  // Driver mobile bottom bar - Delivery Route & Customer Registration
  if (role === 'driver') {
    const driverTabs: { id: TabType; label: string; icon: string }[] = [
      {
        id: 'driver-delivery',
        label: language === 'hi' ? 'डिलीवरी रूट' : 'Delivery Route',
        icon: 'local_shipping',
      },
      {
        id: 'customer-directory',
        label: language === 'hi' ? 'ग्राहक पंजीकरण' : 'Register User',
        icon: 'person_add',
      },
    ];

    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-xl border-t border-surface-container flex items-center justify-around px-2 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        {driverTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 gap-0.5 text-xs transition-all relative ${
                isActive
                  ? 'text-primary font-bold scale-105'
                  : 'text-on-surface-variant/70 hover:text-on-surface font-medium'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 bg-primary rounded-full" />
              )}
              <Icon
                name={tab.icon}
                className={isActive ? 'text-primary' : 'text-on-surface-variant'}
                size={22}
              />
              <span className="text-[11px] leading-tight tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}

        <button
          onClick={logout}
          className="flex flex-col items-center justify-center flex-1 py-1 gap-0.5 text-xs text-on-surface-variant/70 hover:text-primary font-medium transition-colors"
          title="Switch Role"
        >
          <Icon name="swap_horiz" size={20} />
          <span className="text-[11px] leading-tight tracking-tight">
            {language === 'hi' ? 'लॉगआउट' : 'Switch'}
          </span>
        </button>
      </nav>
    );
  }

  // Admin mobile bottom navigation - ONLY Admin Insights & Customer Directory (Driver Proximity Removed)
  const tabs: { id: TabType; labelKey: string; icon: string }[] = [
    {
      id: 'admin-insights',
      labelKey: 'analyticsTab',
      icon: 'analytics',
    },
    {
      id: 'customer-directory',
      labelKey: 'customersTab',
      icon: 'groups',
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-xl border-t border-surface-container flex items-center justify-around px-2 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 gap-0.5 text-xs transition-all relative ${
              isActive
                ? 'text-primary font-bold scale-105'
                : 'text-on-surface-variant/70 hover:text-on-surface font-medium'
            }`}
          >
            {isActive && (
              <span className="absolute -top-1 w-8 h-1 bg-primary rounded-full" />
            )}
            <Icon
              name={tab.icon}
              className={isActive ? 'text-primary' : 'text-on-surface-variant'}
              size={22}
            />
            <span className="text-[11px] leading-tight tracking-tight">
              {t(tab.labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
