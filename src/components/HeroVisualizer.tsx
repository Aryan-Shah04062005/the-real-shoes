'use client';

import React, { useState } from 'react';
import SneakerCanvas from './SneakerCanvas';
import { motion } from 'framer-motion';

export default function HeroVisualizer() {
  const colors = [
    { name: 'Royal Blue', hex: '#0a58ca', threeColor: '#0a58ca' },
    { name: 'Silver Shadow', hex: '#cbd5e1', threeColor: '#cbd5e1' },
    { name: 'Carbon Black', hex: '#111827', threeColor: '#111827' },
  ];

  const [activeColor, setActiveColor] = useState(colors[0]);

  return (
    <div className="relative flex h-[380px] sm:h-[500px] w-full flex-col items-center justify-center lg:h-[550px]">
      {/* Glow Effects in Background */}
      <div
        className="absolute top-1/2 left-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-30 transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${activeColor.hex} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      {/* Main 3D Canvas Box */}
      <div className="h-full w-full max-w-xl">
        <SneakerCanvas color={activeColor.threeColor} size={9.5} autoRotate={true} hover={true} />
      </div>

      {/* Real-time Color Switcher Overlay */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-6 flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/60 px-5 py-3 backdrop-blur-md"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customizer Live Colorway</span>
        <div className="flex gap-4 mt-1">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => setActiveColor(color)}
              className={`group relative flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                activeColor.name === color.name ? 'border-royal-blue scale-110 shadow-lg shadow-royal-blue/30' : 'border-white/10 hover:border-white/30'
              }`}
              title={color.name}
            >
              <span
                className="h-5 w-5 rounded-full"
                style={{ backgroundColor: color.hex }}
              />
              <span className="pointer-events-none absolute bottom-full mb-2 scale-0 rounded bg-slate-900 px-2 py-0.5 text-[9px] text-white transition-all group-hover:scale-100 whitespace-nowrap border border-white/5">
                {color.name}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
