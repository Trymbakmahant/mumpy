'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Truck, ShieldCheck, CheckCircle2, LogIn, ArrowRight, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export const LandingPageView: React.FC = () => {
  const { login, loginAsDriver1, loginAsDriver2, loginAsAdmin, isLoading } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [activeRole, setActiveRole] = useState<'driver' | 'admin'>('driver');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [email, setEmail] = useState('driver1@mumpywater.com');
  const [password, setPassword] = useState('Driver1@123');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleSwitch = (role: 'driver' | 'admin') => {
    setActiveRole(role);
    setShowCustomForm(false);
    setErrorMsg('');
    if (role === 'driver') {
      setEmail('driver1@mumpywater.com');
      setPassword('Driver1@123');
    } else {
      setEmail('admin@mumpywater.com');
      setPassword('Admin@123');
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const targetEmail =
      email.trim() ||
      (activeRole === 'driver' ? 'driver1@mumpywater.com' : 'admin@mumpywater.com');
    const targetPassword = password.trim();

    const res = await login(targetEmail, targetPassword, activeRole);
    if (!res.success) {
      setErrorMsg(
        res.error ||
          (language === 'hi'
            ? 'लॉगिन विफल रहा। कृपया सही क्रेडेंशियल दर्ज करें।'
            : 'Authentication failed. Please verify your credentials.')
      );
    }
  };

  return (
    <div className="bg-slate-900 text-slate-800 antialiased min-h-screen flex justify-center items-start sm:py-6 selection:bg-sky-500 selection:text-white font-sans">
      {/* Mobile Container (393px typical mobile viewport, framed on desktop) */}
      <div className="relative w-full max-w-[420px] min-h-screen sm:min-h-[850px] sm:rounded-[40px] sm:shadow-2xl sm:border-[6px] sm:border-slate-800 bg-slate-50 flex flex-col justify-between overflow-x-hidden">
        {/* Ambient Background Graphic Layer (Water Logistics Inspired) */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-24 -left-20 w-80 h-80 bg-sky-200/50 rounded-full blur-3xl"></div>
          <div className="absolute top-1/4 -right-24 w-80 h-80 bg-blue-100/60 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-sky-100/50 rounded-full blur-3xl"></div>
          {/* Subtle watermark grid lines */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.04]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="grid-pattern" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#0066CC" strokeWidth="1.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 flex flex-col flex-1 px-5 pt-3 pb-6">
          {/* iOS Status Bar Simulation */}
          <div className="flex justify-between items-center py-2 text-slate-900 text-xs font-semibold select-none">
            <span className="tracking-tight text-sm font-semibold">9:41</span>
            <div className="flex items-center gap-1.5 text-slate-700">
              {/* Cellular Signal */}
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9zm0 14.5c-3.04 0-5.5-2.46-5.5-5.5S8.96 6.5 12 6.5s5.5 2.46 5.5 5.5-2.46 5.5-5.5 5.5z"></path>
              </svg>
              {/* WiFi */}
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4z"></path>
              </svg>
              {/* Battery */}
              <div className="w-5 h-2.5 border border-slate-700 rounded-xs p-0.5 flex items-center">
                <div className="h-full w-full bg-slate-700 rounded-2xs"></div>
              </div>
            </div>
          </div>

          {/* App Header Bar */}
          <header className="flex justify-between items-center mt-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">
                  {language === 'hi' ? 'मंपी' : 'Mumpy'}
                </h1>
                <p className="text-[10px] uppercase font-bold tracking-wider text-sky-600 mt-0.5">
                  {language === 'hi' ? 'शुद्ध पेयजल लॉजिस्टिक्स' : 'Hydration Logistics'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Gateway Status Badge */}
              <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-semibold px-2 py-1 rounded-full shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>99.98%</span>
              </div>
              {/* Language Pill */}
              <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    language === 'hi'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  हिंदी
                </button>
              </div>
            </div>
          </header>

          {/* Welcome Banner */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-1.5 bg-sky-100/80 border border-sky-200 text-sky-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
              <span>
                {language === 'hi' ? 'सुपाबेस रियल-टाइम नेटवर्क' : 'Supabase Real-Time Network'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
              {language === 'hi' ? 'ऑपरेशन्स एवं डिस्पैच पोर्टल' : 'Operations & Dispatch Portal'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'hi'
                ? 'अपने कार्यक्षेत्र में प्रवेश करने के लिए भूमिका चुनें'
                : 'Select your role to access your dedicated workspace'}
            </p>
          </div>

          {/* Error Message if present */}
          {errorMsg && (
            <div className="mb-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold shadow-2xs flex items-center justify-between">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg('')}
                className="text-rose-500 hover:text-rose-700 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Segmented Tab Toggle (DRIVER vs ADMIN) */}
          <div className="bg-slate-200/90 p-1 rounded-2xl flex items-center mb-4 shadow-inner">
            {/* Driver Tab */}
            <button
              id="driver-tab"
              type="button"
              onClick={() => handleRoleSwitch('driver')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                activeRole === 'driver'
                  ? 'bg-white text-sky-700 shadow-sm shadow-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>{language === 'hi' ? 'फील्ड / ड्राइवर' : 'Driver / Field'}</span>
            </button>

            {/* Admin Tab */}
            <button
              id="admin-tab"
              type="button"
              onClick={() => handleRoleSwitch('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                activeRole === 'admin'
                  ? 'bg-white text-indigo-900 shadow-sm shadow-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{language === 'hi' ? 'ऑपरेशन्स एडमिन' : 'Operations Admin'}</span>
            </button>
          </div>

          {/* ROLE PANEL 1: DRIVER */}
          {activeRole === 'driver' && (
            <div
              id="driver-panel"
              className="bg-white/95 backdrop-blur-md border border-white/80 rounded-3xl p-4 shadow-xl shadow-slate-200/60 flex flex-col gap-3.5 transition-all duration-200 animate-in fade-in"
            >
              {/* Role Meta Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {language === 'hi' ? 'डिलीवरी पार्टनर' : 'Delivery Partner'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {language === 'hi' ? 'फील्ड वैन ड्रॉप-ऑफ और खाली जार' : 'Field van drop-off & empty jars'}
                    </p>
                  </div>
                </div>
                <span className="bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Field Ops
                </span>
              </div>

              {/* Capability Bullet Highlights */}
              <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    {language === 'hi'
                      ? 'रीयल-टाइम निकटता ड्रॉप-ऑफ कतार'
                      : 'Real-time proximity drop-off queue'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    {language === 'hi'
                      ? 'त्वरित 1-टैप डिलीवरी और खाली कैन लॉगर'
                      : 'Instant 1-Tap delivery & empties logger'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    {language === 'hi'
                      ? 'डोरस्टेप यूपीआई क्यूआर और नकद संग्रह'
                      : 'Doorstep UPI QR & cash settlement'}
                  </span>
                </div>
              </div>

              {/* Fast 1-Tap Driver Login Actions */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={loginAsDriver1}
                  disabled={isLoading}
                  className="w-full bg-sky-600 hover:bg-sky-700 active:scale-[0.98] transition-all text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-sky-600/25 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {language === 'hi'
                      ? 'ड्राइवर 1 के रूप में लॉगिन (राजेश - वैन #02)'
                      : 'Login as Driver 1 (Rajesh - Van #02)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={loginAsDriver2}
                  disabled={isLoading}
                  className="w-full bg-slate-800 hover:bg-slate-900 active:scale-[0.98] transition-all text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {language === 'hi'
                      ? 'ड्राइवर 2 के रूप में लॉगिन (सुरेश - वैन #01)'
                      : 'Login as Driver 2 (Suresh - Van #01)'}
                  </span>
                </button>
              </div>

              {/* Official Driver Credentials Box */}
              <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-2.5 text-[11px] text-slate-600">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wide">
                    {language === 'hi' ? 'परीक्षण क्रेडेंशियल:' : 'Test Credentials:'}
                  </span>
                  <span className="text-[10px] text-sky-600 font-medium">Van #02 IT Corridor</span>
                </div>
                <div className="flex justify-between items-center py-0.5 font-mono text-[11px]">
                  <span className="text-slate-500">driver1@mumpywater.com</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-sky-700 font-bold">
                    Driver1@123
                  </span>
                </div>
              </div>

              {/* Custom Credentials Toggle Link */}
              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowCustomForm((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
                >
                  <span>
                    {showCustomForm
                      ? language === 'hi'
                        ? 'कस्टम फ़ॉर्म छिपाएं'
                        : 'Hide Custom Credentials'
                      : language === 'hi'
                      ? 'कस्टम क्रेडेंशियल से लॉगिन करें'
                      : 'Sign in with Custom Credentials'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Custom Form Expandable */}
              {showCustomForm && (
                <form
                  onSubmit={handleCustomLogin}
                  className="pt-2 flex flex-col gap-2.5 text-xs animate-in fade-in"
                >
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="driver1@mumpywater.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-600"
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Driver1@123"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-600"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    {isLoading ? 'Authenticating...' : 'Sign In with Password'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ROLE PANEL 2: ADMIN */}
          {activeRole === 'admin' && (
            <div
              id="admin-panel"
              className="bg-white/95 backdrop-blur-md border border-white/80 rounded-3xl p-4 shadow-xl shadow-slate-200/60 flex flex-col gap-3.5 transition-all duration-200 animate-in fade-in"
            >
              {/* Role Meta Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {language === 'hi' ? 'ऑपरेशन्स एडमिन' : 'Operations Admin'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {language === 'hi' ? 'फ्लीट टेलीमेट्री और वित्त बहीखाता' : 'Fleet telemetry & finance ledger'}
                    </p>
                  </div>
                </div>
                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Command Center
                </span>
              </div>

              {/* Capability Bullet Highlights */}
              <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    {language === 'hi'
                      ? 'जल वितरण और राजस्व मेट्रिक्स'
                      : 'Town water delivery & revenue metrics'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    {language === 'hi'
                      ? 'दैनिक बिक्री, जीएसटी और रूट मैनिफ़ेस्ट CSV'
                      : 'Daily sales, GST reports & manifest CSVs'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    {language === 'hi'
                      ? 'जार टेलीमेट्री और ग्राहक निर्देशिका'
                      : 'Full jar telemetry & customer directory'}
                  </span>
                </div>
              </div>

              {/* Admin Login Action */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={loginAsAdmin}
                  disabled={isLoading}
                  className="w-full bg-[#0A2540] hover:bg-slate-900 active:scale-[0.98] transition-all text-white font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-950/25 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {language === 'hi'
                      ? 'ऑपरेशन्स एडमिन के रूप में लॉगिन करें'
                      : 'Login as Operations Admin'}
                  </span>
                </button>
                <div className="text-center text-[10px] text-slate-400 font-medium py-0.5">
                  Full Dispatch & Ledger Privileges
                </div>
              </div>

              {/* Official Admin Credentials Box */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-2.5 text-[11px] text-slate-600">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wide">
                    {language === 'hi' ? 'एडमिन क्रेडेंशियल:' : 'Admin Credentials:'}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-medium">Headquarters</span>
                </div>
                <div className="flex justify-between items-center py-0.5 font-mono text-[11px]">
                  <span className="text-slate-500">admin@mumpywater.com</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700 font-bold">
                    Admin@123
                  </span>
                </div>
              </div>

              {/* Custom Credentials Toggle Link */}
              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowCustomForm((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  <span>
                    {showCustomForm
                      ? language === 'hi'
                        ? 'कस्टम फ़ॉर्म छिपाएं'
                        : 'Hide Custom Credentials'
                      : language === 'hi'
                      ? 'कस्टम क्रेडेंशियल से लॉगिन करें'
                      : 'Sign in with Custom Credentials'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Custom Form Expandable */}
              {showCustomForm && (
                <form
                  onSubmit={handleCustomLogin}
                  className="pt-2 flex flex-col gap-2.5 text-xs animate-in fade-in"
                >
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@mumpywater.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Admin@123"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="py-2.5 px-3 rounded-xl bg-[#0A2540] hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    {isLoading ? 'Authenticating...' : 'Sign In with Password'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Mobile Footer & Telemetry */}
        <footer className="relative z-10 px-5 py-3 border-t border-slate-200/80 bg-white/70 backdrop-blur-md flex flex-col gap-1 text-[10px] text-slate-500">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Supabase DB • SSL Enforced
            </span>
            <span className="font-mono text-slate-400">v4.2</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Mumpy Pure Hydration Pvt Ltd</span>
            <span className="text-sky-600 font-semibold">Support Desk</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
