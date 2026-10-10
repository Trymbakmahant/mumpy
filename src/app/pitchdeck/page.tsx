'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sliders,
  Maximize2,
  Minimize2,
  Zap,
  TrendingUp,
  FileSpreadsheet,
  QrCode,
  MapPin,
  Package,
  Layers,
  ChevronRight,
  Sparkles,
  PhoneCall,
  Copy,
  Check,
  Gauge,
  Cpu,
  Radio,
  ExternalLink,
} from 'lucide-react';

// Web Audio API Mechanical Sound Generator (Zero external assets needed)
class MechanicalSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (val) this.playMechanicalClick();
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public playMechanicalClick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.04);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // Audio not supported or blocked
    }
  }

  public playPneumaticShift() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Noise burst for pneumatic / hydraulic air release
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.08);
      filter.Q.value = 3.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch {
      // Audio not supported or blocked
    }
  }

  public playHeavyRelay() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.06);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.065);
    } catch {
      // Fallback
    }
  }
}

const audio = new MechanicalSoundEngine();

export default function PitchDeckPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lang, setLang] = useState<'hinglish' | 'hindi' | 'english'>('hinglish');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [calculatorJars, setCalculatorJars] = useState(250);
  const [leverState, setLeverState] = useState<'old' | 'new'>('new');
  const [, startTransition] = useTransition();
  const deckContainerRef = useRef<HTMLDivElement>(null);

  const totalSlides = 8;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      audio.playPneumaticShift();
      startTransition(() => {
        setCurrentSlide((prev) => prev + 1);
      });
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      audio.playPneumaticShift();
      startTransition(() => {
        setCurrentSlide((prev) => prev - 1);
      });
    }
  };

  const jumpToSlide = (idx: number) => {
    if (idx !== currentSlide) {
      audio.playHeavyRelay();
      startTransition(() => {
        setCurrentSlide(idx);
      });
    }
  };

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    audio.setEnabled(nextVal);
  };

  const toggleFullscreen = () => {
    audio.playMechanicalClick();
    if (!document.fullscreenElement) {
      deckContainerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Home') {
        jumpToSlide(0);
      } else if (e.key === 'End') {
        jumpToSlide(totalSlides - 1);
      } else if (e.key.toLowerCase() === 'm') {
        toggleSound();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, soundEnabled]);

  const copyWhatsAppPitch = () => {
    audio.playMechanicalClick();
    const text = `Namaste Sir,
Main aapka regular customer hu. Mumpy ke paani ki quality bohot badiya hai, par maine notice kiya ki daily delivery aur hisab-kitab me register use karne se delivery bhool jana, khali dabbe gum hona aur payment ka hisab milane me dikkatein aati hain.

Aapke is operation ko 100% digital aur leakage-free banane ke liye maine "Mumpy Smart Logistics App" banaya hai jisme:
✅ Naye customer ka exact doorstep GPS location & delivery days save hote hain.
✅ Driver ko sabse paas ka ghar pehle dikhta hai, drop-off ke baad card auto-remove ho jata hai (koi ghar nahi chhutega).
✅ Kitna paani diya aur kitna khali dabba wapas mila — Zero jar loss tracking.
✅ Cash, Doorstep UPI QR aur Bahi-khata credit ka hisab live update hota hai.
✅ Live Admin Dashboard for daily sales & reports.

App ready hai sir, agar aap free hon toh main aapke plant me 10 minute me live demo dikha sakta hu. Kya hum kal mil sakte hain?`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  // Calculator figures
  const lostJarsPerMonth = Math.round(calculatorJars * 0.08); // 8% lost per month without system
  const jarCostSavedPerYear = lostJarsPerMonth * 180 * 12; // 180 rs per jar
  const deliveryHoursSavedPerMonth = Math.round(calculatorJars * 0.12 * 30); // 12% route time saved

  return (
    <div
      ref={deckContainerRef}
      className="min-h-screen bg-[#070e17] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black font-sans relative overflow-hidden"
    >
      {/* Background Industrial Grid Matrix & Glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-sky-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />

        {/* Precision Blueprint Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="mech-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="1" />
              <circle cx="0" cy="0" r="1.5" fill="#38bdf8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mech-grid)" />
        </svg>

        {/* Ambient Top Scanning Laser Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 animate-pulse" />
      </div>

      {/* MECHANICAL TOP APPARATUS BAR */}
      <header className="relative z-20 px-4 sm:px-8 py-3.5 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Branding & Mission Badge */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 flex items-center justify-center shadow-lg shadow-sky-500/20 border border-cyan-400/30">
              <span className="font-extrabold text-white text-base tracking-tighter">M</span>
            </div>
            {/* Spinning Micro-Gear indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-cyan-400 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                MUMPY <span className="text-cyan-400 font-mono text-xs uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800">Pitch Deck</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                MECHANICAL MOTION V2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Smart Water Logistics & Doorstep Telemetry • Pitch to Owner
            </p>
          </div>
        </div>

        {/* Center: Slide Progress Pill with Mechanical Teeth */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shadow-inner">
          <span className="text-[11px] font-mono text-slate-400 px-2 font-semibold">
            SLIDE <span className="text-cyan-400 font-bold">{currentSlide + 1}</span> / {totalSlides}
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => jumpToSlide(idx)}
                className={`h-2 rounded-xs transition-all duration-300 cursor-pointer ${
                  idx === currentSlide
                    ? 'w-6 bg-cyan-400 shadow-sm shadow-cyan-400/50'
                    : idx < currentSlide
                    ? 'w-2 bg-sky-600'
                    : 'w-2 bg-slate-800 hover:bg-slate-700'
                }`}
                title={`Go to Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right Controls: Audio, Language, Launch App, Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Mechanical Audio Switch */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-2 rounded-xl border text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-950/40 border-cyan-600/60 text-cyan-300 shadow-xs shadow-cyan-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Mechanical Tactile Audio (Hot-key: M)"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline text-[11px]">{soundEnabled ? 'SFX ON' : 'SFX MUTED'}</span>
          </button>

          {/* Language Toggle Rocker */}
          <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                audio.playMechanicalClick();
                setLang('hinglish');
              }}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                lang === 'hinglish' ? 'bg-cyan-500 text-slate-950 shadow-xs font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hinglish
            </button>
            <button
              type="button"
              onClick={() => {
                audio.playMechanicalClick();
                setLang('hindi');
              }}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                lang === 'hindi' ? 'bg-cyan-500 text-slate-950 shadow-xs font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Fullscreen Mode (Hot-key: F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Live App Launcher Link */}
          <Link
            href="/"
            target="_blank"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Open Live App</span>
          </Link>
        </div>
      </header>

      {/* MECHANICAL SLIDE STAGE */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        {/* SLIDE 0: TITLE & HOOK */}
        {currentSlide === 0 && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in zoom-in-95 duration-300">
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-mono font-semibold w-fit shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>CUSTOMER TO OWNER PROPOSAL • MUMPY WATER</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {lang === 'hindi' ? (
                  <>कागज़ और रजिस्टर का ज़माना गया — मंपी को बनाएं <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300">100% डिजिटल और लीकेज-फ्री</span></>
                ) : (
                  <>Kagaz aur Register ka zamana gaya — Mumpy ko banayein <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300">100% Digital & Leakage-Free</span></>
                )}
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {lang === 'hindi' ? (
                  <>
                    नमस्ते सर, मैं आपका एक नियमित ग्राहक हूँ। आपके पानी की गुणवत्ता बहुत बढ़िया है, लेकिन डिलीवरी और बहीखाते के पुराने तरीके से हर महीने हज़ारों रुपये और दर्जनों खाली जार (डब्बे) गुम हो रहे हैं। हमने ख़ास आपके ऑपरेशन्स के लिए यह लाइव सिस्टम बनाया है।
                  </>
                ) : (
                  <>
                    Namaste Sir, main aapka ek regular customer hu. Mumpy ke paani ki quality lajawab hai, par delivery aur bahi-khate ke purane tareeke se har mahine hazaron rupaye aur dabbo (jars) ka nuksaan ho raha hai. Maine aapke business ke liye ek complete automated system ready kiya hai.
                  </>
                )}
              </p>

              {/* Pneumatic Metric Cards */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-inner flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Empty Jars</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400">0% Loss</span>
                  <span className="text-[11px] text-slate-400">Digital Jar Ledger</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-inner flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Delivery Speed</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-cyan-400">+30% Fast</span>
                  <span className="text-[11px] text-slate-400">GPS Doorstep Queue</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-inner flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Live Revenue</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-amber-300">100% Clear</span>
                  <span className="text-[11px] text-slate-400">Cash • UPI • Credit</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 text-slate-950 font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Dekhein Ye Kaise Kaam Karta Hai</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={copyWhatsAppPitch}
                  className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  {copiedWhatsApp ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedWhatsApp ? 'WhatsApp Pitch Copied!' : 'Copy WhatsApp Pitch'}</span>
                </button>
              </div>
            </div>

            {/* AI Generated Modern Plant & Fleet Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/10 group">
                <Image
                  src="/images/mumpy_smart_fleet_plant.jpg"
                  alt="Mumpy Smart Water Fleet Hub"
                  width={640}
                  height={400}
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-mono font-bold text-slate-200">AQUAFLOW / MUMPY FLEET HUB</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">TELEMETRY ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 1: GROUND REALITY - 4 PAIN POINTS VS MECHANICAL LEVER */}
        {currentSlide === 1 && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold">
                  Problem Breakdown • Zameeni Haqeeqat
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                  Purane Register ke 4 Badi Problems aur Roz ka Nuksaan
                </h2>
              </div>

              {/* Mechanical Comparison Lever Switch */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    audio.playMechanicalClick();
                    setLeverState('old');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    leverState === 'old'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ❌ Purana Register Tareeka
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audio.playMechanicalClick();
                    setLeverState('new');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    leverState === 'new'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ✅ Mumpy Smart App
                </button>
              </div>
            </div>

            {/* Comparison Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col justify-between gap-3 ${
                leverState === 'old' ? 'bg-rose-950/20 border-rose-800/80 shadow-lg shadow-rose-950/40' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-rose-900/40 border border-rose-700/50 flex items-center justify-center text-rose-400 font-mono font-bold">
                    01
                  </div>
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Register me Likhna</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Barish me bheegna, handwriting samajh na aana, page fatna, aur sham ko ghanton hisab milana.
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-[11px] text-cyan-300">
                  ⚡ <strong>Smart Fix:</strong> 1-Tap Digital Log on Driver Phone
                </div>
              </div>

              <div className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col justify-between gap-3 ${
                leverState === 'old' ? 'bg-rose-950/20 border-rose-800/80 shadow-lg shadow-rose-950/40' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-rose-900/40 border border-rose-700/50 flex items-center justify-center text-rose-400 font-mono font-bold">
                    02
                  </div>
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Delivery Bhool Jana</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Naye ladke route nahi jaante; purane ladke bhool jaate hain ki kis gali me kiska paani bacha hai. Customer naraz!
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-[11px] text-cyan-300">
                  ⚡ <strong>Smart Fix:</strong> Doorstep Proximity Queue (Nearest First)
                </div>
              </div>

              <div className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col justify-between gap-3 ${
                leverState === 'old' ? 'bg-rose-950/20 border-rose-800/80 shadow-lg shadow-rose-950/40' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-rose-900/40 border border-rose-700/50 flex items-center justify-center text-rose-400 font-mono font-bold">
                    03
                  </div>
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Khali Jar Gum Hona</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Har mahine 20–50 khali dabbe missing ho jaate hain. ₹180 per jar ke hisab se mahine ka seedha ₹5,000–₹10,000 loss!
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-[11px] text-cyan-300">
                  ⚡ <strong>Smart Fix:</strong> Delivered vs Return Bottle Guard
                </div>
              </div>

              <div className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col justify-between gap-3 ${
                leverState === 'old' ? 'bg-rose-950/20 border-rose-800/80 shadow-lg shadow-rose-950/40' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-rose-900/40 border border-rose-700/50 flex items-center justify-center text-rose-400 font-mono font-bold">
                    04
                  </div>
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Cash & Udhaari Ka Gadbad</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Driver bolta hai *"Unhone kal dene ko kaha"*, customer bolta hai *"Maine de diya tha"*. Paisa leak hota hai.
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-[11px] text-cyan-300">
                  ⚡ <strong>Smart Fix:</strong> Doorstep UPI + Auto Bahi-Khata Ledger
                </div>
              </div>
            </div>

            {/* Bottom Insight Callout */}
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-slate-300 font-medium">
                💡 <strong>Owner Insight:</strong> Aapka plant accha chal raha hai, lekin ye 4 leaks har mahine aapke munafey (profits) ko silently kam kar rahi hain.
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-cyan-300 active:scale-95 transition-all cursor-pointer"
              >
                <span>Dekhein Solution</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 2: THE 3-PILLAR SMART LOGISTICS ARCHITECTURE */}
        {currentSlide === 2 && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                The Solution Architecture • सम्पूर्ण समाधान
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Mumpy Smart Logistics Engine: 3 Pillars
              </h2>
              <p className="text-slate-300 text-sm mt-1">
                Zero training needed — chahe driver kam padha-likha ho ya naya ho, 2 minute me chala lega.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Pillar 1 */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-cyan-500/50 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-700 text-cyan-400 flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">PILLAR 1</span>
                  <h3 className="text-xl font-bold text-white mt-1">Doorstep GPS Onboarding</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Naye customer ko register karte waqt exact ghar ke darwaze ka GPS pin hota hai. Delivery days select karein (Daily, Alternate, No Sunday).
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>GPS Precision</span>
                  <span className="text-emerald-400 font-bold">±5 Meter Pin</span>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-sky-500/50 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-sky-950 border border-sky-700 text-sky-400 flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">PILLAR 2</span>
                  <h3 className="text-xl font-bold text-white mt-1">Driver Proximity Queue</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Van jaha khadi hai, sabse paas ka ghar top par aayega. 1-Tap drop-off: delivered bottles aur return bottles count hoti hain, card auto-remove ho jata hai.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Queue Action</span>
                  <span className="text-cyan-400 font-bold">Auto-Clear Queue</span>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-indigo-500/50 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-700 text-indigo-400 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">PILLAR 3</span>
                  <h3 className="text-xl font-bold text-white mt-1">Owner Command Center</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Live daily revenue, jar inventory balance, route telemetry, sector hotspot analytics aur 1-Click CSV / GST manifest download.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Owner View</span>
                  <span className="text-indigo-400 font-bold">Live Real-Time Feed</span>
                </div>
              </div>
            </div>

            {/* Mechanical Flow Diagram */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>Customer GPS Registered</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                <span>Van Arrives • 18m Doorstep Distance Alert</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Bottles Logged • Paid • Plant Ledger Updated</span>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3: DRIVER PROXIMITY & SMART ROUTING DEMO */}
        {currentSlide === 3 && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in zoom-in-95 duration-300">
            <div className="lg:col-span-6 flex flex-col gap-4">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Feature 01 & 02 • ड्राइवर के लिए वरदान
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Sabse Paas Ka Ghar Pehle — Driver Kabhi Nahi Bhulega
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Driver jaise hi colony me enter karta hai, app GPS se scan karta hai aur sabse nazdeek wale ghar ko sabse upar dikhata hai.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs">Doorstep Distance Display</h4>
                    <p className="text-[11px] text-slate-400">
                      Screen par dikhta hai: *18m Doorstep* ya *45m Turn Left*. Rasta dhundhne me samay barbad nahi hota.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs">Auto-Clearing Queue</h4>
                    <p className="text-[11px] text-slate-400">
                      Paani diya, button dabaya — wo ghar list se gayab! Agla ghar turant samne. Sham ko list zero = 100% customer satisfied.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs">Scheduled Delivery Filter</h4>
                    <p className="text-[11px] text-slate-400">
                      Agar customer ne Sunday chhutti rakhi hai, toh Sunday ko uska naam aayega hi nahi. No unnecessary stops.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Driver Mockup Card Frame */}
            <div className="lg:col-span-6 bg-slate-950 p-5 rounded-3xl border-2 border-slate-800 shadow-2xl relative">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 text-xs font-mono">
                <span className="text-cyan-400 flex items-center gap-1.5 font-bold">
                  <Truck className="w-4 h-4" /> DRIVER PROXIMITY QUEUE
                </span>
                <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                  LIVE GPS LOCK (±1.8m)
                </span>
              </div>

              {/* Sample Simulated Cards */}
              <div className="space-y-3 pt-4">
                {/* Active Nearest Card */}
                <div className="p-4 rounded-2xl bg-slate-900 border-2 border-cyan-500 shadow-lg shadow-cyan-500/10 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded">
                        NEAREST • 18m DOORSTEP
                      </span>
                      <h4 className="text-base font-bold text-white mt-1">Rajesh Sharma (B-402)</h4>
                      <p className="text-xs text-slate-400">Shri Krishna Heights, Ward 12</p>
                    </div>
                    <span className="text-sm font-bold text-amber-300 font-mono">2 Jars (40L)</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-400 font-mono">Baki: ₹0.00</span>
                    <button
                      type="button"
                      onClick={() => audio.playPneumaticShift()}
                      className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Log Drop-Off</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Second Upcoming Card */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex justify-between items-center opacity-70">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">NEXT • 42m</span>
                    <h5 className="font-bold text-white text-xs">Pooja Verma (Flat 101)</h5>
                  </div>
                  <span className="text-xs font-mono text-slate-400">1 Jar</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 4: JAR TELEMETRY & ZERO BOTTLE LOSS GUARANTEE */}
        {currentSlide === 4 && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in zoom-in-95 duration-300">
            <div className="lg:col-span-6 flex flex-col gap-4">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Feature 03 & 04 • खाली डब्बे का पक्का हिसाब
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Kitna Paani Diya, Kitna Dabba Mila — Zero Jar Loss Guarantee
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Water plant owners ka sabse bada headache hota hai market se 20L plastic jars gayab hona. Mumpy App me har drop-off par dabba count record hota hai.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <Package className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs">Delivered vs Returned Counter</h4>
                    <p className="text-[11px] text-slate-400">
                      Driver ne 2 bhara hua jar diya aur 1 khali dabba liya — app me turant entry hoti hai: *1 Empty Jar Pending*.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs">Customer Bottle Debt Record</h4>
                    <p className="text-[11px] text-slate-400">
                      Customer ke account me jud jata hai ki uske paas kitne dabbe hain. Koi bhi dabba bina record ke nahi fas sakta.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs">Factory Inventory Balance</h4>
                    <p className="text-[11px] text-slate-400">
                      Sham ko gaadi me kitne khali dabbe wapas aaye aur factory me kitne hone chahiye — digital match 30 second me!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mechanical Jar Counter Visual */}
            <div className="lg:col-span-6 bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col gap-4 shadow-2xl">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">DROP-OFF TELEMETRY DIAL</span>
                <span className="text-emerald-400 font-bold">100% ACCURACY</span>
              </div>

              {/* Counters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-sky-800/80 flex flex-col items-center text-center gap-1">
                  <span className="text-[11px] font-mono text-sky-400 uppercase">Jars Delivered (Full)</span>
                  <span className="text-4xl font-extrabold font-mono text-white mt-1">2</span>
                  <span className="text-[10px] text-slate-400">40 Litres Pure Water</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-800/80 flex flex-col items-center text-center gap-1">
                  <span className="text-[11px] font-mono text-emerald-400 uppercase">Empties Returned</span>
                  <span className="text-4xl font-extrabold font-mono text-emerald-400 mt-1">2</span>
                  <span className="text-[10px] text-emerald-500 font-semibold">Zero Pending Bottle</span>
                </div>
              </div>

              {/* Saving Calculation Alert */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-300 block">Mahine Ki Seedhi Bachat</span>
                  <span className="text-[11px] text-slate-300">30 Missing Jars Saved = ₹5,400 / month</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-bold font-mono text-xs">
                  ₹64,800 / Year
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 5: MULTI-MODE SETTLEMENT & BAHI-KHATA */}
        {currentSlide === 5 && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in zoom-in-95 duration-300">
            <div className="lg:col-span-6 flex flex-col gap-4">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                Feature 05 • पेमेंट और बहीखाता
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Cash, UPI QR aur Bahi-Khata — Ek-Ek Rupaye Ka Hisab
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Aapka driver chahe cash le, customer QR scan karke seedha aapke UPI par bhejey, ya bole *"Mahine ke aakhiri me dunga"* — sab ek tap me save hota hai.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <QrCode className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs">Doorstep UPI QR Code</h4>
                    <p className="text-[11px] text-slate-400">
                      Customer apne PhonePe, Google Pay ya Paytm se scan kare — paisa seedha aapke bank account me.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs">Purana Baki Alert (Automatic Reminder)</h4>
                    <p className="text-[11px] text-slate-400">
                      Driver ke phone par pehle hi laal rang me dikhta hai: *PICHHLA BAKI: ₹240*. Driver wahi maang lega.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs">Automatic Monthly Billing</h4>
                    <p className="text-[11px] text-slate-400">
                      Mahine ke end me kisi ko pen se hisab jodna nahi padega. Invoice ready milta hai.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Modes UI Preview */}
            <div className="lg:col-span-6 bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col gap-4 shadow-2xl">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">SETTLEMENT MODES</span>
                <span className="text-amber-400 font-bold">1-TAP VERIFIED</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col items-center gap-1.5 text-center cursor-pointer hover:border-amber-400 transition-all">
                  <span className="text-xl">💵</span>
                  <span className="font-bold text-white text-xs">CASH</span>
                  <span className="text-[10px] text-slate-400 font-mono">Driver Collected</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col items-center gap-1.5 text-center cursor-pointer hover:border-amber-400 transition-all">
                  <span className="text-xl">📲</span>
                  <span className="font-bold text-white text-xs">UPI QR</span>
                  <span className="text-[10px] text-slate-400 font-mono">Instant Bank Credit</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col items-center gap-1.5 text-center cursor-pointer hover:border-amber-400 transition-all">
                  <span className="text-xl">📖</span>
                  <span className="font-bold text-white text-xs">BAHI-KHATA</span>
                  <span className="text-[10px] text-slate-400 font-mono">Monthly Ledger</span>
                </div>
              </div>

              {/* Outstanding Balance Banner Example */}
              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-bold text-rose-300">Pichhla Udhaar: ₹360.00</span>
                </div>
                <span className="text-rose-400 font-mono font-bold text-[11px]">Auto-Settled on Collection</span>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 6: OWNER COMMAND CENTER & LIVE TELEMETRY */}
        {currentSlide === 6 && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">
                  Feature 06 & 07 • मालिक के लिए लाइव कमांड सेंटर
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                  Aapka Live Remote Control — Factory, Ghar ya Gaadi Se
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-emerald-400 font-bold">SUPABASE LIVE TELEMETRY</span>
              </div>
            </div>

            {/* Dashboard Telemetry Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Today&apos;s Deliveries</span>
                <span className="text-2xl font-bold font-mono text-cyan-400">142 Jars</span>
                <span className="text-[10px] text-slate-400">+18% vs Yesterday</span>
              </div>

              <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Today&apos;s Collections</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">₹7,840</span>
                <span className="text-[10px] text-slate-400">₹4,200 UPI • ₹3,640 Cash</span>
              </div>

              <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Bottles in Circulation</span>
                <span className="text-2xl font-bold font-mono text-amber-300">418 Active</span>
                <span className="text-[10px] text-slate-400">Zero Unaccounted</span>
              </div>

              <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Outstanding Bills</span>
                <span className="text-2xl font-bold font-mono text-rose-400">₹1,950</span>
                <span className="text-[10px] text-slate-400">8 Customers</span>
              </div>
            </div>

            {/* Features Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-xs">1-Click CSV & Excel Export</h4>
                  <p className="text-[11px] text-slate-400">
                    CA ya accountant ko bhejne ke liye Daily Sales, GST sheet aur Manifest ek click me download karein.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-xs">Sector Hotspot Heatmap</h4>
                  <p className="text-[11px] text-slate-400">
                    Pata chalega kis colony me paani ki maang sabse zyada hai aur naye van routes kaha kholne chahiye.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-xs">Multi-Van Fleet Control</h4>
                  <p className="text-[11px] text-slate-400">
                    Van #01 (Suresh) aur Van #02 (Rajesh) dono ka live feed alag-alag aur consolidated ek jagah.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 7: INTERACTIVE MECHANICAL ROI CALCULATOR & CLOSE */}
        {currentSlide === 7 && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in zoom-in-95 duration-300">
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Business ROI & Proposal • आपका असली मुनाफ़ा
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                  Mumpy Water Ka Saal Me Kitna Bachhega?
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm mt-1">
                  Mechanical slider ko aage-peeche karke dekhein aapke plant ke volume ke hisab se kitna fayda hoga:
                </p>
              </div>

              {/* Interactive Mechanical Slider */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col gap-3 shadow-inner">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">DAILY DELIVERY VOLUME:</span>
                  <span className="text-cyan-400 font-extrabold text-sm">{calculatorJars} Jars / Day</span>
                </div>

                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={calculatorJars}
                  onChange={(e) => {
                    audio.playMechanicalClick();
                    setCalculatorJars(Number(e.target.value));
                  }}
                  className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />

                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>50 Jars</span>
                  <span>500 Jars</span>
                  <span>1000 Jars</span>
                </div>
              </div>

              {/* Dynamic Calculated Savings Output */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase">Jar Theft Saved</span>
                  <span className="text-base sm:text-lg font-bold font-mono text-white">
                    ₹{jarCostSavedPerYear.toLocaleString('en-IN')}/yr
                  </span>
                  <span className="text-[10px] text-emerald-300">~{lostJarsPerMonth} Jars/mo safe</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/80 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase">Driver Time Saved</span>
                  <span className="text-base sm:text-lg font-bold font-mono text-white">
                    {deliveryHoursSavedPerMonth} hrs/mo
                  </span>
                  <span className="text-[10px] text-cyan-300">Fast GPS routing</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/80 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-amber-400 uppercase">Cash Leakage</span>
                  <span className="text-base sm:text-lg font-bold font-mono text-white">0% Leakage</span>
                  <span className="text-[10px] text-amber-300">100% reconciled</span>
                </div>
              </div>

              {/* Closing Action Bar */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950 via-slate-900 to-sky-950 border border-cyan-700/60 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-white text-sm">Sir, Hum Kal Mil Sakte Hain?</h4>
                  <p className="text-xs text-slate-300">
                    Aapke office me aakar 10 minute me live demo dikhaunga. 1 week free trial bhi dunga!
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyWhatsAppPitch}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500 text-cyan-300 hover:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    {copiedWhatsApp ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedWhatsApp ? 'Copied' : 'Copy Pitch'}</span>
                  </button>

                  <Link
                    href="/"
                    target="_blank"
                    className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md shadow-cyan-400/20"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Launch Live App</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Owner Closing Card & Customization Promise */}
            <div className="lg:col-span-5 bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col gap-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">100% Customization Promise</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Aapke business ki specific zaroorat ke hisab se — naye rate card, custom bill print format, ya gaadi ka route mapping — jo bhi aap chahenge, main khud customize karke dunga.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Free Cloud Database & Realtime Sync</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Works on All Android & iOS Phones</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Zero Server Setup Headache for Owner</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Direct Contact</span>
                  <span className="text-xs font-bold text-white block">Aapka Tech Partner & Customer</span>
                </div>
                <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-full border border-cyan-800">
                  READY FOR PILOT
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MECHANICAL BOTTOM COCKPIT NAVIGATOR */}
      <footer className="relative z-20 px-4 sm:px-8 py-3.5 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        {/* Left: Previous Button & Slide Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              currentSlide === 0
                ? 'opacity-30 border-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800 active:scale-95'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Peeche (Prev)</span>
          </button>

          <span className="text-xs font-mono text-slate-400 hidden md:inline">
            Use keyboard <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">←</kbd>{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">→</kbd> or{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Space</kbd>
          </span>
        </div>

        {/* Center: Slide Indicator Titles */}
        <div className="text-xs text-slate-300 font-semibold text-center hidden sm:block">
          {currentSlide === 0 && '01. The Problem & Customer Hook'}
          {currentSlide === 1 && '02. Ground Reality & Register Pain Points'}
          {currentSlide === 2 && '03. The 3-Pillar Smart Architecture'}
          {currentSlide === 3 && '04. Driver Proximity & Doorstep GPS'}
          {currentSlide === 4 && '05. Jar Telemetry & Zero Bottle Loss'}
          {currentSlide === 5 && '06. Payment Modes & Bahi-Khata'}
          {currentSlide === 6 && '07. Owner Command Center & Live Telemetry'}
          {currentSlide === 7 && '08. Interactive ROI Calculator & Demo Offer'}
        </div>

        {/* Right: Next Slide or Launch App */}
        <div className="flex items-center gap-2">
          {currentSlide < totalSlides - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 hover:brightness-110 active:scale-95 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-md shadow-cyan-400/20 transition-all cursor-pointer"
            >
              <span>Agla (Next)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/"
              target="_blank"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 active:scale-95 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-400/25 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Live System Demo</span>
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
