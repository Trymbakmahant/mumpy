'use client';

import React from 'react';
import { Droplets, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-secondary/40 backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-secondary/20 flex items-center justify-center text-cyan-300 shrink-0">
          <Droplets className="w-4 h-4 text-secondary" />
        </div>
        <p className="text-xs font-medium text-slate-100">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
