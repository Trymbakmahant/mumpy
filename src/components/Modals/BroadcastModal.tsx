'use client';

import React, { useState } from 'react';
import { Radio, X, Send } from 'lucide-react';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent: (message: string) => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  onSent,
}) => {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'Urgent' | 'Emergency'>('Urgent');

  if (!isOpen) return null;

  const quickAlerts = [
    'Surge Demand Peak at Tech Phase 2: Redirect excess 20L jars.',
    'Flyover maintenance near Ring Road: Divert via MedCorridor bypass.',
    'Stock Refill Truck reaching Sector 14 junction in 10 minutes.',
    'Quality batch #MP-2024-88A confirmed 48 ppm TDS. Safe to disburse.',
  ];

  const handleSend = () => {
    if (!message.trim()) return;
    onSent(message);
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-surface-container relative">
        <div className="flex items-center justify-between pb-4 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-headline-sm text-primary">
                Fleet Telemetry Broadcast
              </h3>
              <p className="text-xs text-on-surface-variant">
                Push audio chime & SMS alert to all 8 active drivers
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

        <div className="my-5 flex flex-col gap-4 text-xs">
          <div>
            <label className="font-bold text-on-surface mb-1.5 block">
              Priority Level:
            </label>
            <div className="flex gap-2">
              {(['Normal', 'Urgent', 'Emergency'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setPriority(lvl)}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-xs ${
                    priority === lvl
                      ? lvl === 'Emergency'
                        ? 'bg-red-600 text-white shadow-sm'
                        : lvl === 'Urgent'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-primary text-white shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold text-on-surface mb-1.5 block">
              Select Preset Announcement:
            </label>
            <div className="flex flex-col gap-1.5">
              {quickAlerts.map((txt, idx) => (
                <button
                  key={idx}
                  onClick={() => setMessage(txt)}
                  className="text-left p-2 rounded-lg bg-surface-container-low hover:bg-secondary-fixed/30 hover:text-secondary text-[11px] text-on-surface-variant transition-colors"
                >
                  • {txt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold text-on-surface mb-1 block">
              Custom Dispatch Message:
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type dispatch instructions for drivers..."
              className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container text-on-surface text-xs focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-surface-container">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container font-bold text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Transmit to All Vans
          </button>
        </div>
      </div>
    </div>
  );
};
