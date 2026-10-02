'use client';

import React, { useState } from 'react';
import { Route, X } from 'lucide-react';
import { initialVans } from '../../data/mockData';

interface ReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVanNumber: string;
  onReassigned: (targetVanNumber: string) => void;
}

export const ReassignModal: React.FC<ReassignModalProps> = ({
  isOpen,
  onClose,
  currentVanNumber,
  onReassigned,
}) => {
  const [selectedVan, setSelectedVan] = useState(
    initialVans.find((v) => v.pickupNumber !== currentVanNumber)?.pickupNumber || ''
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-container relative">
        <div className="flex justify-between items-center pb-3 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <Route className="w-6 h-6 text-primary" />
            <h3 className="font-bold text-headline-sm text-primary">
              Reassign Route Segment
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-outline hover:bg-surface-container">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 flex flex-col gap-3 text-xs">
          <p className="text-on-surface-variant">
            Transfer pending stops from <strong className="text-primary">{currentVanNumber}</strong> to an adjacent vehicle with available can capacity.
          </p>

          <label className="font-bold text-on-surface">Target Delivery Van:</label>
          <div className="flex flex-col gap-2">
            {initialVans
              .filter((v) => v.pickupNumber !== currentVanNumber)
              .map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVan(v.pickupNumber)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedVan === v.pickupNumber
                      ? 'border-primary bg-primary-fixed/20 shadow-sm'
                      : 'border-surface-container hover:bg-surface-container-low'
                  }`}
                >
                  <div>
                    <span className="font-bold text-on-surface block text-sm">
                      {v.pickupNumber} {v.plateNumber}
                    </span>
                    <span className="text-outline text-xs">
                      {v.driverName} • Route: {v.route}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-secondary font-bold text-xs block">
                      {v.bottlesRemaining} cans available
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      {v.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-surface-container">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-on-surface-variant font-bold text-xs hover:bg-surface-container">
            Cancel
          </button>
          <button
            onClick={() => {
              onReassigned(selectedVan);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-container shadow-sm"
          >
            Confirm Reassignment
          </button>
        </div>
      </div>
    </div>
  );
};
