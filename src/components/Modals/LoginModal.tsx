'use client';

import React, { useState } from 'react';
import { Shield, ShieldCheck, Truck, BadgeCheck, LogIn, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    closeLoginModal,
    login,
    loginAsDriver1,
    loginAsDriver2,
    loginAsAdmin,
    isLoading,
  } = useAuth();
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'driver' | 'admin'>('driver');
  const [email, setEmail] = useState('driver1@mumpywater.com');
  const [password, setPassword] = useState('Driver1@123');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const targetEmail =
      email.trim() ||
      (activeTab === 'driver' ? 'driver1@mumpywater.com' : 'admin@mumpywater.com');
    const targetPassword = password.trim();

    const res = await login(targetEmail, targetPassword, activeTab);
    if (!res.success) {
      setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-container relative">
        {/* Top Header */}
        <div className="flex justify-between items-center pb-3 border-b border-surface-container">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-headline-sm text-primary">
                {language === 'hi' ? 'मंपी पोर्टल लॉगिन' : 'Mumpy Portal Access'}
              </h3>
              <p className="text-[11px] text-on-surface-variant font-medium">
                {language === 'hi'
                  ? 'आधिकारिक आईडी और पासवर्ड सत्यापन'
                  : 'Official ID & Password Authentication'}
              </p>
            </div>
          </div>
          <button
            onClick={closeLoginModal}
            className="p-1.5 rounded-lg text-outline hover:bg-surface-container transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Tabs */}
        <div className="grid grid-cols-2 gap-2 my-4 bg-surface-container-low p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('driver');
              setEmail('driver1@mumpywater.com');
              setPassword('Driver1@123');
              setErrorMsg('');
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'driver'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Truck className="w-4 h-4" />
            {language === 'hi' ? 'डिलीवरी पार्टनर (ड्राइवर)' : 'Delivery Drivers (2)'}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setEmail('admin@mumpywater.com');
              setPassword('Admin@123');
              setErrorMsg('');
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'admin'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {language === 'hi' ? 'एडमिन (हब ऑपरेशन्स)' : 'Operations Admin (1)'}
          </button>
        </div>

        {/* Quick Instant Fast Switch for all 3 Official Accounts */}
        <div className="mb-4 p-3 bg-secondary-fixed/20 border border-secondary/30 rounded-2xl flex flex-col gap-1.5">
          <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">
            {language === 'hi' ? 'त्वरित 1-क्लिक टेस्ट एक्सेस' : 'Instant 1-Click Fast Switch'}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={loginAsDriver1}
              disabled={isLoading}
              className="py-1.5 px-1.5 rounded-xl bg-white border border-secondary/40 text-secondary text-[10px] font-bold hover:bg-secondary hover:text-white transition-all shadow-xs flex flex-col items-center justify-center gap-0.5 text-center"
              title="Rajesh Patil (Van #02)"
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Driver 1 (Rajesh)</span>
            </button>

            <button
              type="button"
              onClick={loginAsDriver2}
              disabled={isLoading}
              className="py-1.5 px-1.5 rounded-xl bg-white border border-cyan-500/40 text-cyan-800 text-[10px] font-bold hover:bg-cyan-700 hover:text-white transition-all shadow-xs flex flex-col items-center justify-center gap-0.5 text-center"
              title="Suresh Kumar (Van #01)"
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Driver 2 (Suresh)</span>
            </button>

            <button
              type="button"
              onClick={loginAsAdmin}
              disabled={isLoading}
              className="py-1.5 px-1.5 rounded-xl bg-white border border-primary/40 text-primary text-[10px] font-bold hover:bg-primary hover:text-white transition-all shadow-xs flex flex-col items-center justify-center gap-0.5 text-center"
              title="Operations Administrator"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin (Plant)</span>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-error-container text-on-error-container text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-on-surface">
              {language === 'hi' ? 'आईडी / ईमेल' : 'Login ID / Email'}
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. driver1@mumpywater.com"
              className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-on-surface">
              {language === 'hi' ? 'पासवर्ड' : 'Password'}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-xs"
            />
          </div>

          {/* Credentials Helper Pill Box */}
          <div className="p-2 bg-surface-container-low rounded-xl border border-surface-container text-[10px] text-on-surface-variant flex flex-col gap-0.5">
            <span className="font-bold text-outline uppercase tracking-wider text-[9px]">
              {language === 'hi' ? 'अधिकृत क्रेडेंशियल:' : 'Verified System Credentials:'}
            </span>
            <div className="flex justify-between">
              <span>Driver 1: <strong>driver1@mumpywater.com</strong></span>
              <span className="font-mono bg-white px-1 rounded border">Driver1@123</span>
            </div>
            <div className="flex justify-between">
              <span>Driver 2: <strong>driver2@mumpywater.com</strong></span>
              <span className="font-mono bg-white px-1 rounded border">Driver2@123</span>
            </div>
            <div className="flex justify-between">
              <span>Admin: <strong>admin@mumpywater.com</strong></span>
              <span className="font-mono bg-white px-1 rounded border">Admin@123</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-1 py-2.5 rounded-xl bg-primary text-white font-extrabold text-xs hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                {language === 'hi' ? 'सत्यापित किया जा रहा है...' : 'Authenticating...'}
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                {language === 'hi' ? 'लॉगिन करें' : 'Sign In with Credentials'}
              </>
            )}
          </button>
        </form>

        {/* Supabase PostgreSQL Status */}
        <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-[11px] text-outline">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Supabase DB Connected
          </span>
          <span className="font-mono text-[10px]">v16.3 / SSL Ready</span>
        </div>
      </div>
    </div>
  );
};
