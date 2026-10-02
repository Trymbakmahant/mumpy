'use client';

import React, { useState } from 'react';
import { Truck, X, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface OrderPlantRefillModalProps {
  isOpen: boolean;
  onClose: () => void;
  vanNumber: string;
  onRefillOrdered: (quantity: number) => void;
}

export const OrderPlantRefillModal: React.FC<OrderPlantRefillModalProps> = ({
  isOpen,
  onClose,
  vanNumber,
  onRefillOrdered,
}) => {
  const { t } = useLanguage();
  const [cansCount, setCansCount] = useState(120);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-surface-container relative">
        <div className="flex justify-between items-center pb-3 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-secondary" />
            <h3 className="font-bold text-headline-sm text-primary">
              {t('orderPlantRefillModalTitle')}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-outline hover:bg-surface-container">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 flex flex-col gap-3 text-xs">
          <p className="text-on-surface-variant">
            {t('orderPlantRefillDesc')} <strong className="text-primary">{vanNumber}</strong>.
          </p>

          <div className="p-3 bg-surface-container-low rounded-2xl flex flex-col gap-2">
            <span className="font-bold text-on-surface">{t('refillCrateQuantity')}</span>
            <div className="flex items-center justify-between bg-white rounded-xl p-2 border border-surface-container">
              <button
                onClick={() => setCansCount(Math.max(20, cansCount - 20))}
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-bold text-lg text-primary hover:bg-surface-container-high"
              >
                -
              </button>
              <div className="text-center">
                <span className="font-display text-2xl font-extrabold text-primary block leading-none">
                  {cansCount}
                </span>
                <span className="text-[10px] text-outline font-semibold uppercase">
                  {t('mineralCan20L')}
                </span>
              </div>
              <button
                onClick={() => setCansCount(cansCount + 20)}
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-bold text-lg text-primary hover:bg-surface-container-high"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
            <span className="flex items-center gap-1.5 font-semibold">
              <Clock className="w-4 h-4 text-amber-700" />
              {t('estInterceptTime')}
            </span>
            <strong className="font-bold">{t('hubDepotDistance')}</strong>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-surface-container">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-on-surface-variant font-bold text-xs hover:bg-surface-container">
            {t('cancel')}
          </button>
          <button
            onClick={() => {
              onRefillOrdered(cansCount);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-secondary text-white font-bold text-xs hover:bg-secondary/90 shadow-sm"
          >
            {t('dispatchReplenishment')}
          </button>
        </div>
      </div>
    </div>
  );
};
