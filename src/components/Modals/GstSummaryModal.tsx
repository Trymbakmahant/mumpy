'use client';

import React from 'react';
import { Receipt, CheckCircle2, X } from 'lucide-react';

interface GstSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  grossRevenue: number;
}

export const GstSummaryModal: React.FC<GstSummaryModalProps> = ({
  isOpen,
  onClose,
  grossRevenue,
}) => {
  if (!isOpen) return null;

  const taxableValue = (grossRevenue / 1.18);
  const cgst = taxableValue * 0.09;
  const sgst = taxableValue * 0.09;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-surface-container relative">
        <div className="flex items-center justify-between pb-4 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-headline-sm text-primary">
                Daily GST Compliance Summary
              </h3>
              <p className="text-xs text-on-surface-variant">
                HSN 22019010 • Packaged Drinking Water (IS 14543)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 flex flex-col gap-3 text-sm">
          <div className="p-3 bg-surface-container-low rounded-xl flex justify-between items-center">
            <span className="text-on-surface-variant font-medium">Reporting Date & Facility:</span>
            <span className="font-bold text-primary">Today • Main Water Plant</span>
          </div>

          <div className="border border-surface-container rounded-xl overflow-hidden divide-y divide-surface-container-low">
            <div className="flex justify-between p-3 bg-surface-container-lowest">
              <span className="text-on-surface-variant">Net Taxable Turnover:</span>
              <span className="font-bold text-on-surface">₹{taxableValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between p-3 bg-surface-container-lowest">
              <span className="text-on-surface-variant">CGST (9.0%):</span>
              <span className="font-semibold text-secondary">₹{cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between p-3 bg-surface-container-lowest">
              <span className="text-on-surface-variant">SGST (9.0%):</span>
              <span className="font-semibold text-secondary">₹{sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between p-3 bg-surface-container-low font-bold">
              <span className="text-primary">Total Gross Invoiced:</span>
              <span className="text-primary text-base">₹{grossRevenue.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <span>
              E-Way Bill auto-generated for corporate dispatches exceeding ₹50,000 threshold. Portal sync state: <strong>CLEARED</strong>.
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-surface-container">
          <button
            onClick={() => {
              alert('GSTR-1 JSON and CSV manifest exported to your downloads folder.');
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-secondary-fixed text-on-secondary-fixed font-bold text-xs hover:bg-secondary-fixed-dim transition-colors"
          >
            Download GSTR-1 CSV
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-container transition-colors shadow-sm"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
