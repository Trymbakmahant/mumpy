'use client';

import React from 'react';
import { X, Printer } from 'lucide-react';
import { initialVans } from '../../data/mockData';

interface ManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManifestModal: React.FC<ManifestModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-surface-container relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-surface-container">
          <div>
            <span className="text-xs uppercase font-bold text-secondary tracking-wider">
              Shift Dispatch Form #MUM-2026-10
            </span>
            <h3 className="font-bold text-headline-sm text-primary">
              Daily Route Run Sheet
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-3 gap-3 p-3 bg-surface-container-low rounded-xl">
            <div>
              <span className="text-outline block">Plant Facility:</span>
              <strong className="text-on-surface text-sm">Main Town Water Plant</strong>
            </div>
            <div>
              <span className="text-outline block">Date & Shift:</span>
              <strong className="text-on-surface text-sm">Today • 06:00 - 18:00 IST</strong>
            </div>
            <div>
              <span className="text-outline block">Supervisor / Lead:</span>
              <strong className="text-on-surface text-sm">Rajesh Patel</strong>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-surface-container rounded-xl overflow-hidden">
            <thead className="bg-surface-container text-on-surface-variant font-bold">
              <tr>
                <th className="p-2.5">Van / Driver</th>
                <th className="p-2.5">Route</th>
                <th className="p-2.5">Initial Load</th>
                <th className="p-2.5">Delivered</th>
                <th className="p-2.5">Remaining</th>
                <th className="p-2.5">Empties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {initialVans.map((van) => (
                <tr key={van.id} className="hover:bg-surface-container-lowest">
                  <td className="p-2.5">
                    <span className="font-bold text-primary block">{van.pickupNumber} {van.plateNumber}</span>
                    <span className="text-outline">{van.driverName}</span>
                  </td>
                  <td className="p-2.5 font-medium">{van.route}</td>
                  <td className="p-2.5 font-bold">{van.initialLoad} cans</td>
                  <td className="p-2.5 text-secondary font-bold">
                    {van.initialLoad - van.bottlesRemaining}
                  </td>
                  <td className="p-2.5 text-on-surface">{van.bottlesRemaining}</td>
                  <td className="p-2.5 font-bold text-emerald-600">
                    {van.initialLoad - van.bottlesRemaining - 2}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-slate-700">
            <span>Total Units Dispatched Today: <strong>1,620 Units</strong></span>
            <span>Empty Can Recovery: <strong>96.4% Efficiency</strong></span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-surface-container">
          <span className="text-xs text-outline">Digital Manifest Verified by Hub Supervisor</span>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-bold text-xs hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Print Form
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-container transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
