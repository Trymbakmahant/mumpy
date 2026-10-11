'use client';

import React, { useState, useEffect } from 'react';
import { TabType } from '../types';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { AdminInsightsView } from '../components/views/AdminInsightsView';
import { DriverProximityView } from '../components/views/DriverProximityView';
import { CustomerDirectoryView } from '../components/views/CustomerDirectoryView';
import { DeliveryHistoryView } from '../components/views/DeliveryHistoryView';
import { LandingPageView } from '../components/views/LandingPageView';
import { BroadcastModal } from '../components/Modals/BroadcastModal';
import { LoginModal } from '../components/Modals/LoginModal';
import { Toast } from '../components/Toast';

export default function Home() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('admin-insights');
  const [selectedHistoryAreaId, setSelectedHistoryAreaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [grossRevenue, setGrossRevenue] = useState<number>(0);
  const [reservoirLevel, setReservoirLevel] = useState<number>(92);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => {
        if (data?.kpis?.grossRevenueToday !== undefined) {
          setGrossRevenue(data.kpis.grossRevenueToday);
        }
      })
      .catch(() => null);
  }, []);

  // Load and enforce tab based on role and saved preference
  useEffect(() => {
    try {
      const savedTab = localStorage.getItem('mumpy_active_tab') as TabType;
      if (savedTab) {
        if (role === 'driver' && (savedTab === 'admin-insights' || savedTab === 'delivery-history')) {
          setActiveTab('driver-delivery');
        } else if (role === 'admin' && savedTab === 'driver-delivery') {
          setActiveTab('admin-insights');
        } else {
          setActiveTab(savedTab);
        }
        return;
      }
    } catch (e) {
      // localStorage fallback
    }

    if (role === 'driver') {
      setActiveTab('driver-delivery');
    } else if (role === 'admin') {
      setActiveTab('admin-insights');
    }
  }, [role]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('mumpy_active_tab', tab);
    } catch (e) {}
  };

  // If user has not selected a role yet, show the role selection Landing Page
  if (!user) {
    return <LandingPageView />;
  }

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleDeployExtraReserve = () => {
    setReservoirLevel(98);
    showToast('Reserve Bottling Activated: +8,400L RO Water ready for daily dispatch.');
  };

  const handleDropCompleted = (amount: number) => {
    setGrossRevenue((prev) => prev + amount);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface">
      {/* Top Fixed Header with Role Badge & Language Switcher */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenBroadcast={() => setIsBroadcastOpen(true)}
      />

      {/* Main Container Layout */}
      <div className="flex flex-1 pt-16">
        {/* Left Navigation Sidebar for Desktop / Tablet */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          reservoirLevel={reservoirLevel}
        />

        {/* Dynamic Content Area: Partitioned by role */}
        <main className="flex-1 w-full md:pl-64 min-h-[calc(100vh-4rem)] pb-20 md:pb-6 transition-all">
          {role === 'driver' ? (
            /* DRIVER VIEWS - Delivery Route and Customer Registration Power */
            <>
              {activeTab === 'driver-delivery' && (
                <DriverProximityView
                  onNotify={showToast}
                  onDropCompleted={handleDropCompleted}
                  onOpenCustomerRegistration={() => handleTabChange('customer-directory')}
                />
              )}

              {activeTab === 'customer-directory' && (
                <CustomerDirectoryView onNotify={showToast} />
              )}
            </>
          ) : (
            /* ADMIN VIEWS - Admin Insights, Customer Directory & Delivery History Page */
            <>
              {activeTab === 'admin-insights' && (
                <AdminInsightsView
                  grossRevenue={grossRevenue}
                  onDeployExtraReserve={handleDeployExtraReserve}
                  onOpenHistory={(areaId) => {
                    setSelectedHistoryAreaId(areaId || 'all');
                    handleTabChange('delivery-history');
                  }}
                  onNotify={showToast}
                />
              )}

              {activeTab === 'delivery-history' && (
                <DeliveryHistoryView
                  initialAreaId={selectedHistoryAreaId}
                  onBackToAnalytics={() => handleTabChange('admin-insights')}
                  onNotify={showToast}
                />
              )}

              {activeTab === 'customer-directory' && (
                <CustomerDirectoryView onNotify={showToast} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Native Mobile Bottom Navigation Bar (Visible on phone/small screen viewports) */}
      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Global Modals & Notifications */}
      <BroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        onSent={(msg) => showToast(`Emergency Broadcast sent: "${msg}"`)}
      />

      <LoginModal />

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
