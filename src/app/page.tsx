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
import { LandingPageView } from '../components/views/LandingPageView';
import { BroadcastModal } from '../components/Modals/BroadcastModal';
import { LoginModal } from '../components/Modals/LoginModal';
import { Toast } from '../components/Toast';

export default function Home() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(
    role === 'driver' ? 'driver-delivery' : 'admin-insights'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [grossRevenue, setGrossRevenue] = useState<number>(48650);
  const [reservoirLevel, setReservoirLevel] = useState<number>(92);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  // Automatically enforce tab based on role
  useEffect(() => {
    if (role === 'driver') {
      if (activeTab === 'admin-insights') {
        setActiveTab('driver-delivery');
      }
    } else if (role === 'admin' && activeTab === 'driver-delivery') {
      setActiveTab('admin-insights');
    }
  }, [role, activeTab]);

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
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenBroadcast={() => setIsBroadcastOpen(true)}
      />

      {/* Main Container Layout */}
      <div className="flex flex-1 pt-16">
        {/* Left Navigation Sidebar for Desktop / Tablet */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
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
                  onOpenCustomerRegistration={() => setActiveTab('customer-directory')}
                />
              )}

              {activeTab === 'customer-directory' && (
                <CustomerDirectoryView onNotify={showToast} />
              )}
            </>
          ) : (
            /* ADMIN VIEWS - ONLY Admin Insights & Customer Directory (Driver Proximity completely removed) */
            <>
              {activeTab === 'admin-insights' && (
                <AdminInsightsView
                  grossRevenue={grossRevenue}
                  onDeployExtraReserve={handleDeployExtraReserve}
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
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

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
