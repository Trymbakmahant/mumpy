'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Truck, ShieldCheck, Shield, CheckCircle2, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export const LandingPageView: React.FC = () => {
  const { login, loginAsDriver1, loginAsDriver2, loginAsAdmin, isLoading } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [activeFormRole, setActiveFormRole] = useState<'driver' | 'admin' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCustomLogin = async (e: React.FormEvent, role: 'driver' | 'admin') => {
    e.preventDefault();
    setErrorMsg('');
    const targetEmail =
      email.trim() || (role === 'driver' ? 'driver1@mumpywater.com' : 'admin@mumpywater.com');
    const targetPassword = password.trim();

    const res = await login(targetEmail, targetPassword, role);
    if (!res.success) {
      setErrorMsg(
        res.error ||
          (language === 'hi'
            ? 'लॉगिन विफल रहा। कृपया सही आईडी और पासवर्ड दर्ज करें।'
            : 'Authentication failed. Please verify your credentials.')
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-container-lowest to-surface-container-low flex flex-col font-sans text-on-surface relative overflow-hidden">
      {/* Background Decorative Hydro Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl overflow-hidden bg-white shadow-md flex items-center justify-center p-1 border border-surface-container shrink-0">
            <Image
              src="/images/mumpy-logo.png"
              alt="Mumpy Logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <span className="font-extrabold text-headline-sm text-primary tracking-tight">
              {language === 'hi' ? 'मंपी' : 'Mumpy'}
            </span>
            <span className="text-[10px] text-secondary font-bold block uppercase tracking-wider">
              {language === 'hi' ? 'शुद्ध पेयजल लॉजिस्टिक्स' : 'Pure Hydration Logistics'}
            </span>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-white shadow-sm p-1 rounded-2xl border border-surface-container text-xs font-semibold">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              language === 'en'
                ? 'bg-primary text-white shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              language === 'hi'
                ? 'bg-secondary text-white shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            हिंदी
          </button>
        </div>
      </header>

      {/* Hero Header */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 z-10 max-w-6xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-fixed/60 text-on-secondary-fixed border border-secondary/30 mb-4 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {language === 'hi'
              ? 'सुपाबेस रियल-टाइम फ्लीट एवं डिलीवरी नेटवर्क'
              : 'Supabase Real-Time Fleet & Dispatch Network'}
          </span>
        </div>

        <h1 className="text-display sm:text-4xl lg:text-5xl font-extrabold text-primary tracking-tight max-w-3xl mb-3">
          {language === 'hi'
            ? 'मंपी वाटर डिलीवरी एवं ऑपरेशन्स पोर्टल'
            : 'Mumpy Water Delivery & Operations Portal'}
        </h1>

        <p className="text-body-lg text-on-surface-variant max-w-2xl mb-8 sm:mb-12">
          {language === 'hi'
            ? 'अपने कार्यक्षेत्र में प्रवेश करने के लिए डिलीवरी पार्टनर या ऑपरेशन्स एडमिन के रूप में लॉगिन करें।'
            : 'Select your operational role below to enter your customized real-time workspace.'}
        </p>

        {errorMsg && (
          <div className="mb-6 p-3 rounded-2xl bg-error-container text-on-error-container text-xs font-semibold max-w-md w-full shadow-sm">
            {errorMsg}
          </div>
        )}

        {/* Dual Role Login Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full max-w-4xl text-left">
          {/* CARD 1: DELIVERY BOY / DRIVER */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 lg:p-8 border-2 border-surface-container hover:border-secondary transition-all shadow-md hover:shadow-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-fixed/20 rounded-bl-full pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-secondary-fixed flex items-center justify-center text-secondary shadow-sm">
                  <Truck className="w-8 h-8" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-secondary-fixed text-on-secondary-fixed px-2.5 py-1 rounded-full">
                  {language === 'hi' ? 'फील्ड ऑपरेशन्स' : 'Field Operations'}
                </span>
              </div>

              <h2 className="text-headline-md font-bold text-primary mb-2">
                {language === 'hi' ? 'डिलीवरी पार्टनर (ड्राइवर)' : 'Delivery Partner / Driver'}
              </h2>

              <p className="text-body-md text-on-surface-variant mb-5">
                {language === 'hi'
                  ? 'लाइव जीपीएस निकटता कतार, डोरस्टेप यूपीआई क्यूआर संग्रह, खाली कैन की वापसी और तत्काल एसएमएस रसीद।'
                  : 'Real-time proximity drop-off queue, doorstep UPI QR payments, empty bottle ledger, and route GPS directions.'}
              </p>

              <div className="space-y-2.5 mb-6 text-xs text-on-surface-variant">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                  <span>{language === 'hi' ? 'वैन #02 (राजेश पाटिल - आईटी कॉरिडोर)' : 'Van #02 (Rajesh Patil - IT Corridor)'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                  <span>{language === 'hi' ? 'त्वरित डिलीवरी प्रविष्टि और खाली कैन ट्रैकिंग' : 'Instant 1-Tap Delivery & Empties Logger'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                  <span>{language === 'hi' ? 'डोरस्टेप डिजिटल क्यूआर और नकद निपटान' : 'Doorstep UPI QR & Cash Settlement'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-surface-container">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={loginAsDriver1}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3 rounded-xl bg-secondary text-white font-extrabold text-xs hover:bg-secondary/90 transition-all shadow-md flex items-center justify-center gap-2 group-hover:scale-[1.01]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>
                    {language === 'hi'
                      ? 'ड्राइवर 1 के रूप में लॉगिन करें (राजेश - वैन #02)'
                      : 'Login as Driver 1 (Rajesh - Van #02)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={loginAsDriver2}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3 rounded-xl bg-cyan-700 text-white font-extrabold text-xs hover:bg-cyan-800 transition-all shadow-md flex items-center justify-center gap-2 group-hover:scale-[1.01]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>
                    {language === 'hi'
                      ? 'ड्राइवर 2 के रूप में लॉगिन करें (सुरेश - वैन #01)'
                      : 'Login as Driver 2 (Suresh - Van #01)'}
                  </span>
                </button>
              </div>

              {/* Verified Credentials helper */}
              <div className="p-2.5 bg-surface-container-low rounded-xl border border-surface-container text-[11px] text-on-surface-variant flex flex-col gap-1">
                <span className="font-bold text-secondary uppercase text-[10px] tracking-wider">
                  {language === 'hi' ? 'आधिकारिक ड्राइवर क्रेडेंशियल:' : 'Official Driver Credentials:'}
                </span>
                <div className="flex justify-between items-center text-[10.5px]">
                  <span>ID 1: <strong className="text-primary font-mono">driver1@mumpywater.com</strong></span>
                  <span className="font-mono bg-white px-1.5 py-0.2 rounded border text-primary font-semibold">Driver1@123</span>
                </div>
                <div className="flex justify-between items-center text-[10.5px]">
                  <span>ID 2: <strong className="text-primary font-mono">driver2@mumpywater.com</strong></span>
                  <span className="font-mono bg-white px-1.5 py-0.2 rounded border text-primary font-semibold">Driver2@123</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveFormRole(activeFormRole === 'driver' ? null : 'driver');
                  setEmail('driver1@mumpywater.com');
                  setPassword('Driver1@123');
                  setErrorMsg('');
                }}
                className="w-full py-2 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors text-center"
              >
                {activeFormRole === 'driver'
                  ? language === 'hi' ? 'क्रेडेंशियल फॉर्म छिपाएं' : 'Hide Custom Form'
                  : language === 'hi' ? 'ईमेल और पासवर्ड से लॉगिन करें' : 'Sign in with Custom Credentials'}
              </button>

              {/* Expandable Custom Login Form for Driver */}
              {activeFormRole === 'driver' && (
                <form
                  onSubmit={(e) => handleCustomLogin(e, 'driver')}
                  className="pt-2 flex flex-col gap-2.5 text-xs animate-in fade-in"
                >
                  {errorMsg && (
                    <div className="p-2 rounded-lg bg-error-container text-on-error-container text-xs font-medium">
                      {errorMsg}
                    </div>
                  )}
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="driver1@mumpywater.com or driver1"
                    className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Driver1@123"
                    className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                  <button
                    type="submit"
                    className="py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-container"
                  >
                    {language === 'hi' ? 'सत्यापित करें' : 'Sign In with Password'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* CARD 2: OPERATIONS ADMIN */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 lg:p-8 border-2 border-surface-container hover:border-primary transition-all shadow-md hover:shadow-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed/20 rounded-bl-full pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary shadow-sm">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-primary-fixed text-on-primary-fixed font-bold px-2.5 py-1 rounded-full">
                  {language === 'hi' ? 'कमांड सेंटर' : 'Command Center'}
                </span>
              </div>

              <h2 className="text-headline-md font-bold text-primary mb-2">
                {language === 'hi' ? 'ऑपरेशन्स एडमिन' : 'Operations Admin'}
              </h2>

              <p className="text-body-md text-on-surface-variant mb-5">
                {language === 'hi'
                  ? 'दैनिक जल वितरण, राजस्व रिपोर्ट, मार्ग प्रबंधन और नए ग्राहक ऑनबोर्डिंग।'
                  : 'Daily water deliveries, revenue tracking, route management, and customer onboarding.'}
              </p>

              <div className="space-y-2.5 mb-6 text-xs text-on-surface-variant">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>{language === 'hi' ? 'दैनिक जल वितरण एवं ग्राहक प्रबंधन' : 'Town Water Delivery & Customer Management'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>{language === 'hi' ? 'दैनिक बिक्री, जीएसटी और रूट मैनिफ़ेस्ट निर्यात' : 'Daily Sales, GST & Route Manifest CSVs'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>{language === 'hi' ? 'सत्यापित जीपीएस के साथ ग्राहक ऑनबोर्डिंग' : 'Customer Intake with Real GPS Location'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-surface-container">
              <button
                type="button"
                onClick={loginAsAdmin}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-primary text-white font-extrabold text-sm hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2 group-hover:scale-[1.01]"
              >
                {isLoading ? (
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>
                      {language === 'hi'
                        ? 'एडमिन के रूप में प्रवेश करें'
                        : 'Login as Operations Admin'}
                    </span>
                  </>
                )}
              </button>

              {/* Verified Admin Credentials helper */}
              <div className="p-2.5 bg-surface-container-low rounded-xl border border-surface-container text-[11px] text-on-surface-variant flex flex-col gap-1">
                <span className="font-bold text-primary uppercase text-[10px] tracking-wider">
                  {language === 'hi' ? 'आधिकारिक एडमिन क्रेडेंशियल:' : 'Official Admin Credentials:'}
                </span>
                <div className="flex justify-between items-center text-[10.5px]">
                  <span>Admin ID: <strong className="text-primary font-mono">admin@mumpywater.com</strong></span>
                  <span className="font-mono bg-white px-1.5 py-0.2 rounded border text-primary font-semibold">Admin@123</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveFormRole(activeFormRole === 'admin' ? null : 'admin');
                  setEmail('admin@mumpywater.com');
                  setPassword('Admin@123');
                  setErrorMsg('');
                }}
                className="w-full py-2 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors text-center"
              >
                {activeFormRole === 'admin'
                  ? language === 'hi' ? 'क्रेडेंशियल फॉर्म छिपाएं' : 'Hide Custom Form'
                  : language === 'hi' ? 'ईमेल और पासवर्ड से लॉगिन करें' : 'Sign in with Custom Credentials'}
              </button>

              {/* Expandable Custom Login Form for Admin */}
              {activeFormRole === 'admin' && (
                <form
                  onSubmit={(e) => handleCustomLogin(e, 'admin')}
                  className="pt-2 flex flex-col gap-2.5 text-xs animate-in fade-in"
                >
                  {errorMsg && (
                    <div className="p-2 rounded-lg bg-error-container text-on-error-container text-xs font-medium">
                      {errorMsg}
                    </div>
                  )}
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@mumpywater.com or admin"
                    className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Admin@123"
                    className="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    className="py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-container"
                  >
                    {language === 'hi' ? 'सत्यापित करें' : 'Sign In with Password'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Supabase Live Connection Indicator */}
        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-outline">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-on-surface">
            {language === 'hi' ? 'सुपाबेस पोस्टग्रेस लाइव' : 'Connected to Live Supabase DB'}
          </span>
          <span>•</span>
          <span className="font-mono text-[11px]">Next.js 16.3 / SSL Enforced</span>
        </div>
      </main>
    </div>
  );
};
