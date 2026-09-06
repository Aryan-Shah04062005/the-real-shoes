'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-premium-black pt-16 pb-8 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-black tracking-widest text-white">THE REAL SHOES</h3>
            <p className="text-xs italic text-slate-300">"Step Into Your Reality"</p>
            <p className="text-xs font-light leading-relaxed max-w-xs">
              Experience the pinnacle of footwear engineering. The Real Shoes offers premium 3D design and comfort founded by Aryan Shah.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Shop Collections</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/shop" className="hover:text-royal-blue transition-colors">All Sneakers</Link>
              </li>
              <li>
                <Link href="/shop?filter=new" className="hover:text-royal-blue transition-colors">New Arrivals</Link>
              </li>
              <li>
                <Link href="/shop?filter=best" className="hover:text-royal-blue transition-colors">Best Sellers</Link>
              </li>
              <li>
                <Link href="/shop?category=Running" className="hover:text-royal-blue transition-colors">Running Shoes</Link>
              </li>
              <li>
                <Link href="/shop?category=Lifestyle" className="hover:text-royal-blue transition-colors">Lifestyle</Link>
              </li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Store Policies</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/policies/shipping" className="hover:text-royal-blue transition-colors">Shipping Policy</Link>
              </li>
              <li>
                <Link href="/policies/returns" className="hover:text-royal-blue transition-colors">Return & Refund Policy</Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="hover:text-royal-blue transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/policies/terms" className="hover:text-royal-blue transition-colors">Terms & Conditions</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3 text-xs">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Contact Info</h4>
            <p>
              <strong className="text-slate-200">Owner:</strong> Aryan Shah
            </p>
            <p>
              <strong className="text-slate-200">Email:</strong> aryan@thereal.com
            </p>
            <p>
              <strong className="text-slate-200">Phone:</strong> +91 98765 43210
            </p>
            <p className="leading-relaxed">
              Skyline Premium Tower, BKC, Mumbai, MH, India
            </p>
          </div>
        </div>

        {/* Bottom copyright segment */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between text-center gap-4 text-[11px] font-light">
          <p>
            &copy; 2026 THE REAL SHOES. All Rights Reserved.
          </p>
          <p className="text-slate-300 font-normal">
            Founded and owned by <span className="text-royal-blue font-bold">Aryan Shah</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}
