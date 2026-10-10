'use client';

import React from 'react';
import { Icon } from './Icon';
import { use5SecGpsCompiler } from '@/lib/use5SecGpsCompiler';

interface GpsCompilationWidgetProps {
  language?: 'en' | 'hi';
  onCoordinatesLocked?: (coords: string) => void;
  compiler: ReturnType<typeof use5SecGpsCompiler>;
  manualCoordsOverride?: string;
  className?: string;
}

export const GpsCompilationWidget: React.FC<GpsCompilationWidgetProps> = ({
  language = 'en',
  compiler,
  manualCoordsOverride,
  className = '',
}) => {
  const {
    isCompiling,
    progressPercent,
    currentStep,
    totalSteps,
    currentAccuracy,
    gpsCoords,
    gpsDms,
    accuracy,
    improvementPercent,
    recompile,
  } = compiler;

  const displayCoords = manualCoordsOverride?.trim() || gpsCoords;

  return (
    <div
      className={`p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 border border-emerald-300 rounded-2xl flex flex-col gap-2.5 shadow-xs transition-all ${className}`}
    >
      {/* Header bar: Status + Accuracy Badge + Recalibrate Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            {isCompiling ? (
              <>
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 relative" />
              </>
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-xs" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xs text-emerald-950 flex items-center gap-1">
              <Icon name="satellite_alt" size={15} className="text-emerald-700" />
              <span>
                {language === 'hi'
                  ? '5-सेकंड GPS सटीकता संकलन (5s Accuracy Improvement)'
                  : '5-Second GPS Accuracy Compilation'}
              </span>
            </span>
            <span className="text-[10px] text-emerald-800 font-medium">
              {isCompiling
                ? language === 'hi'
                  ? `सैटेलाइट टेलीमेट्री संकलन जारी: सैंपल ${currentStep}/${totalSteps}...`
                  : `Compiling 5s multi-sample fixes: Sample ${currentStep}/${totalSteps}...`
                : language === 'hi'
                ? `✓ 5 सैटेलाइट सैंपल संकलित • ${improvementPercent}% सटीकता सुधार (±${accuracy}m)`
                : `✓ 5 satellite samples compiled • +${improvementPercent}% precision gain (±${accuracy}m)`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10.5px] font-black text-emerald-900 bg-emerald-200/90 px-2 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
            {isCompiling ? `±${currentAccuracy}m` : `±${accuracy}m Survey`}
          </span>
          <button
            type="button"
            onClick={recompile}
            disabled={isCompiling}
            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[10.5px] font-bold ${
              isCompiling
                ? 'bg-emerald-100 text-emerald-400 border-emerald-200 cursor-not-allowed'
                : 'bg-white hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs active:scale-95'
            }`}
            title={language === 'hi' ? '5 सेकंड का नया संकलन शुरू करें' : 'Run fresh 5-second GPS compilation'}
          >
            <Icon
              name="sync"
              size={12}
              className={isCompiling ? 'animate-spin text-emerald-600' : 'text-emerald-700'}
            />
            <span className="hidden sm:inline">
              {language === 'hi' ? 'पुनः संकलित' : 'Recalibrate'}
            </span>
          </button>
        </div>
      </div>

      {/* 5-Second Compilation Progress Bar */}
      <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden p-0.5 border border-emerald-300/80">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isCompiling
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse'
              : 'bg-emerald-600'
          }`}
          style={{ width: `${isCompiling ? progressPercent : 100}%` }}
        />
      </div>

      {/* Primary Coordinates Display Card */}
      <div className="bg-white/95 p-2.5 rounded-xl border border-emerald-200 shadow-2xs flex flex-col gap-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                {language === 'hi' ? 'दशमलव (Decimal):' : 'Decimal:'}
              </span>
              <span className="font-mono font-black text-primary text-xs sm:text-sm tracking-wide">
                {displayCoords}
              </span>
              <a
                href={`https://www.google.com/maps?q=${encodeURIComponent(displayCoords)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary hover:underline flex items-center gap-0.5 text-[11px] font-bold ml-1"
                title="Open coordinates in Google Maps"
              >
                <Icon name="open_in_new" size={11} />
                <span>{language === 'hi' ? 'मैप्स' : 'Maps'}</span>
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                {language === 'hi' ? 'डिग्री (DMS):' : 'DMS:'}
              </span>
              <span className="font-mono text-xs text-emerald-900 font-bold">
                {gpsDms}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
              {language === 'hi' ? 'सटीक डोरस्टेप पिन' : 'Doorstep Calibrated'}
            </span>
          </div>
        </div>

        {/* Explanatory note confirming Decimal and DMS are identical */}
        <div className="pt-1.5 border-t border-emerald-100 flex items-center justify-between text-[10px] text-emerald-800">
          <span className="flex items-center gap-1">
            <Icon name="bolt" size={12} className="text-amber-600 shrink-0" />
            <span>
              {language === 'hi'
                ? '22.556539, 83.465826 और 22°33\'23.6"N 83°27\'56.2"E दोनों एक ही सटीक स्थान हैं।'
                : 'Decimal and DMS point to the identical doorstep location (5s compiled centroid).'}
            </span>
          </span>
          <span className="font-semibold text-emerald-700 shrink-0">
            {isCompiling
              ? (language === 'hi' ? 'संकलन चालू...' : 'Sampling...')
              : (language === 'hi' ? 'सटीक पिन लॉक' : 'Fix Locked')}
          </span>
        </div>
      </div>
    </div>
  );
};
