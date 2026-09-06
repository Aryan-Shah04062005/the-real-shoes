'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Send, CheckCircle2, Camera } from 'lucide-react';

export default function Footer() {
  const { setSizeGuideOpen } = useCart();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="w-full border-t border-white/10 bg-premium-black pt-16 pb-8 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Newsletter Banner */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900 via-royal-blue/10 to-slate-900 p-6 md:p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-royal-blue block mb-1">
              EXCLUSIVE OFFERS & DISCOUNTS
            </span>
            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
              Get 10% OFF your first order.
            </h3>
            <p className="text-xs text-slate-300 font-light mt-1">
              Subscribe to THE REAL newsletter for early drop access and exclusive colorway releases.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="w-full md:w-auto flex flex-col sm:flex-row gap-3 min-w-[300px]">
            {subscribed ? (
              <div className="flex items-center gap-2 text-green-400 text-xs font-bold bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                <CheckCircle2 className="h-4 w-4" />
                Subscribed! Coupon REAL10 unlocked.
              </div>
            ) : (
              <>
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none min-w-[240px]"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-royal-blue hover:bg-royal-blue-hover px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 hover:scale-105"
                >
                  Subscribe <Send className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="space-y-4 sm:col-span-2 md:col-span-1">
            <h3 className="text-xl font-black tracking-widest text-white">THE REAL SHOES</h3>
            <p className="text-xs italic text-slate-300">"Step Into Your Reality"</p>
            <p className="text-xs font-light leading-relaxed">
              Experience the pinnacle of footwear engineering. The Real Shoes offers premium sneaker design and comfort founded by Aryan Shah.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">SHOP</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/shop" className="hover:text-royal-blue transition-colors">All Sneakers</Link>
              </li>
              <li>
                <Link href="/shop?category=Running" className="hover:text-royal-blue transition-colors">Running Shoes</Link>
              </li>
              <li>
                <Link href="/shop?category=Lifestyle" className="hover:text-royal-blue transition-colors">Lifestyle</Link>
              </li>
              <li>
                <Link href="/shop?filter=new" className="hover:text-royal-blue transition-colors">New Arrivals</Link>
              </li>
              <li>
                <Link href="/shop?filter=best" className="hover:text-royal-blue transition-colors">Best Sellers</Link>
              </li>
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">HELP</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/#contact" className="hover:text-royal-blue transition-colors">Contact Support</Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-royal-blue transition-colors">Track Your Order</Link>
              </li>
              <li>
                <button onClick={() => setSizeGuideOpen(true)} className="hover:text-royal-blue transition-colors text-left">
                  Size Guide
                </button>
              </li>
              <li>
                <Link href="/policies/shipping" className="hover:text-royal-blue transition-colors">Shipping Policy</Link>
              </li>
              <li>
                <Link href="/policies/returns" className="hover:text-royal-blue transition-colors">Returns & Refund</Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">COMPANY</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/#about" className="hover:text-royal-blue transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-royal-blue transition-colors">Our Story</Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="hover:text-royal-blue transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/policies/terms" className="hover:text-royal-blue transition-colors">Terms & Conditions</Link>
              </li>
            </ul>
          </div>

          {/* Follow & Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">FOLLOW US</h4>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/therealaryanshah_shoes"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg p-2 bg-white/5 border border-white/10 hover:border-royal-blue hover:text-white transition-all flex items-center gap-2 text-xs"
                title="@therealaryanshah_shoes on Instagram"
              >
                <Camera className="h-4 w-4 text-royal-blue" />
                <span className="font-semibold text-slate-300 hover:text-white">@therealaryanshah_shoes</span>
              </a>
            </div>

            <div className="text-xs space-y-1 pt-2">
              <p><strong className="text-slate-200">Owner:</strong> Aryan Shah</p>
              <p><strong className="text-slate-200">Email:</strong> aryan@thereal.com</p>
              <p><strong className="text-slate-200">Location:</strong> Mumbai, MH, India</p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between text-center gap-4 text-[11px] font-light">
          <p>&copy; 2026 THE REAL SHOES. All Rights Reserved.</p>
          <p className="text-slate-300 font-normal">
            Founded and owned by <span className="text-royal-blue font-bold">Aryan Shah</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}
