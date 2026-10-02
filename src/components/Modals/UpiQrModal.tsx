'use client';

import React, { useState } from 'react';
import { Droplets, CheckCircle2, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface UpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  amount: number;
  onPaymentSuccess: (amount: number, method: 'UPI QR') => void;
}

export const UpiQrModal: React.FC<UpiQrModalProps> = ({
  isOpen,
  onClose,
  customerName,
  amount,
  onPaymentSuccess,
}) => {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess(amount, 'UPI QR');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-surface-container relative text-center">
        <div className="flex justify-between items-center pb-2 border-b border-surface-container">
          <span className="text-xs uppercase font-bold text-secondary">
            {t('instantMerchantUpi')}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-outline hover:bg-surface-container"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 flex flex-col items-center gap-3">
          <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-secondary/40 shadow-inner flex flex-col items-center">
            {/* Simulated UPI QR code SVG */}
            <div className="w-48 h-48 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center relative">
              <div className="grid grid-cols-6 gap-1 w-full h-full p-2 bg-white rounded shadow-sm">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-xs ${
                      (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35 || i === 14 || i === 21
                        ? 'bg-primary'
                        : i % 5 === 0
                        ? 'bg-secondary'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center border border-primary/20">
                  <Droplets className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>
            <span className="text-[11px] text-outline mt-2 font-mono">
              UPI ID: mumpywater.hub04@icici
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-on-surface-variant font-medium">
              {t('paymentFor')} {customerName}
            </span>
            <span className="font-extrabold text-headline-sm text-primary">
              ₹{amount.toFixed(2)}
            </span>
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
              {t('zeroMerchantSurcharge')}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-surface-container">
          <button
            onClick={handleSimulatePayment}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                {t('verifyingDoorstepUpi')}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {t('simulateScanPay')}
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="text-xs text-on-surface-variant hover:text-on-surface py-1 font-medium"
          >
            {t('switchToCashLedger')}
          </button>
        </div>
      </div>
    </div>
  );
};
