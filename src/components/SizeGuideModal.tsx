'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { X, Ruler, HelpCircle } from 'lucide-react';

export default function SizeGuideModal() {
  const { isSizeGuideOpen, setSizeGuideOpen } = useCart();

  if (!isSizeGuideOpen) return null;

  const sizeTable = [
    { uk: 6, us: 7, eu: 40, cm: 24.5 },
    { uk: 7, us: 8, eu: 41, cm: 25.4 },
    { uk: 8, us: 9, eu: 42, cm: 26.2 },
    { uk: 9, us: 10, eu: 43, cm: 27.1 },
    { uk: 10, us: 11, eu: 44, cm: 27.9 },
    { uk: 11, us: 12, eu: 45, cm: 28.8 },
    { uk: 12, us: 13, eu: 46, cm: 29.6 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setSizeGuideOpen(false)}
          className="absolute top-4 right-4 z-10 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 text-royal-blue">
          <Ruler className="h-6 w-6" />
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">SNEAKER SIZE GUIDE</h2>
        </div>

        {/* Conversion Table */}
        <div className="overflow-x-auto rounded-xl border border-white/10 mb-6">
          <table className="w-full text-center text-xs">
            <thead className="bg-white/5 uppercase text-slate-400 font-bold">
              <tr>
                <th className="p-3 border-b border-white/10">UK Size</th>
                <th className="p-3 border-b border-white/10">US Size</th>
                <th className="p-3 border-b border-white/10">EU Size</th>
                <th className="p-3 border-b border-white/10">Foot Length (CM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {sizeTable.map((row) => (
                <tr key={row.uk} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-bold text-royal-blue">UK {row.uk}</td>
                  <td className="p-3">US {row.us}</td>
                  <td className="p-3">EU {row.eu}</td>
                  <td className="p-3 font-mono">{row.cm} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* How to Measure Feet */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <HelpCircle className="h-4 w-4 text-royal-blue" />
            <span>HOW TO MEASURE YOUR FEET AT HOME</span>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 font-light leading-relaxed">
            <li>Place a piece of paper flat against a wall on a hard surface.</li>
            <li>Stand on the paper with your heel touching the wall flat.</li>
            <li>Use a pencil to mark the longest part of your foot (tip of the big toe) on the paper.</li>
            <li>Measure the distance from the wall edge to your mark in centimeters (CM).</li>
            <li>Compare your measurement to the table above to pick your ideal UK sneaker size!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
