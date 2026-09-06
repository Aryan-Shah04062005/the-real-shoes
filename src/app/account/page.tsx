'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import QuickViewModal from '@/components/QuickViewModal';
import { User, Package, Heart, MapPin, LogOut, ArrowRight, ShieldCheck, Mail, Lock, Phone } from 'lucide-react';
import Link from 'next/link';

export default function AccountPage() {
  const { wishlist } = useCart();
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile' | 'addresses'>('orders');

  // Local Customer Session state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Auth Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoggedIn(true);
  };

  const mockOrders = [
    {
      id: 'TR-2026-00001',
      date: '2026-08-15',
      total: 14999,
      status: 'Delivered',
      items: [{ name: 'THE REAL Genesis 3D', size: 9, qty: 1 }],
    },
  ];

  return (
    <div className="relative min-h-screen bg-premium-black text-premium-light py-12 px-4 sm:px-6 lg:px-8">
      <QuickViewModal />

      {/* Background Glows */}
      <div className="glow-blue top-[10%] left-[-100px]" />
      <div className="glow-silver top-[40%] right-[-100px]" />

      <div className="mx-auto max-w-6xl space-y-8">
        {!isLoggedIn ? (
          /* LOGIN / SIGNUP FORM CARD */
          <div className="max-w-md mx-auto glass-card rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-royal-blue">CUSTOMER PORTAL</span>
              <h1 className="text-2xl font-black text-white uppercase">{authMode === 'login' ? 'SIGN IN TO YOUR ACCOUNT' : 'CREATE YOUR ACCOUNT'}</h1>
              <p className="text-xs text-slate-400 font-light">Access orders, track shipments, and manage your wishlist.</p>
            </div>

            {/* Auth Mode Toggle */}
            <div className="flex rounded-xl bg-white/5 border border-white/10 p-1">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 rounded-lg py-2 text-xs font-bold uppercase transition-all ${
                  authMode === 'login' ? 'bg-royal-blue text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 rounded-lg py-2 text-xs font-bold uppercase transition-all ${
                  authMode === 'signup' ? 'bg-royal-blue text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Full Name</label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aryan Shah"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. aryan@thereal.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                  />
                </div>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Mobile Number</label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-royal-blue hover:bg-royal-blue-hover py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-royal-blue/20"
              >
                {authMode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </button>
            </form>
          </div>
        ) : (
          /* LOGGED IN CUSTOMER DASHBOARD */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-4 glass-card rounded-2xl p-6 border border-white/10 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="h-12 w-12 rounded-full bg-royal-blue/20 border border-royal-blue/30 flex items-center justify-center text-royal-blue font-black text-lg">
                  {name ? name.substring(0, 1).toUpperCase() : 'A'}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{name || 'Aryan Shah'}</h3>
                  <p className="text-xs text-slate-400">{email || 'aryan@thereal.com'}</p>
                </div>
              </div>

              <nav className="space-y-1 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    activeTab === 'orders' ? 'bg-royal-blue text-white font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Package className="h-4 w-4" /> My Orders
                </button>

                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    activeTab === 'wishlist' ? 'bg-royal-blue text-white font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Heart className="h-4 w-4" /> Saved Wishlist ({wishlist.length})
                </button>

                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    activeTab === 'addresses' ? 'bg-royal-blue text-white font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <MapPin className="h-4 w-4" /> Saved Addresses
                </button>

                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    activeTab === 'profile' ? 'bg-royal-blue text-white font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <User className="h-4 w-4" /> Profile Details
                </button>

                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-red-400 hover:bg-red-500/10 transition-all pt-4 border-t border-white/5"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </nav>
            </div>

            {/* Dashboard Content */}
            <div className="lg:col-span-8 glass-card rounded-2xl p-6 sm:p-8 border border-white/10">
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider border-b border-white/10 pb-4">ORDER HISTORY</h2>
                  {mockOrders.map((ord) => (
                    <div key={ord.id} className="rounded-xl border border-white/10 bg-slate-950 p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-royal-blue">{ord.id}</span>
                          <span className="text-slate-500 ml-2">({ord.date})</span>
                        </div>
                        <span className="rounded bg-green-500/20 text-green-400 px-2 py-0.5 font-bold">{ord.status}</span>
                      </div>
                      <div className="text-xs text-slate-300">
                        {ord.items.map((it, i) => (
                          <p key={i}>{it.name} - Size UK {it.size} x {it.qty}</p>
                        ))}
                      </div>
                      <div className="flex justify-between items-center border-t border-white/5 pt-2 text-xs">
                        <span className="font-bold text-white">Total: ₹{ord.total.toLocaleString('en-IN')}</span>
                        <Link href={`/track-order?id=${ord.id}`} className="text-royal-blue font-bold hover:underline">
                          Track Shipment →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'wishlist' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider border-b border-white/10 pb-4">SAVED WISHLIST</h2>
                  {wishlist.length === 0 ? (
                    <p className="text-xs text-slate-500">Your wishlist is currently empty.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {wishlist.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider border-b border-white/10 pb-4">SAVED ADDRESSES</h2>
                  <div className="rounded-xl border border-white/10 bg-slate-950 p-4 space-y-1 text-xs text-slate-300">
                    <span className="font-bold text-white uppercase text-xs block mb-1">DEFAULT HOME ADDRESS</span>
                    <p>Flat 402, Skyline Premium Tower</p>
                    <p>BKC, Mumbai, Maharashtra - 400051</p>
                    <p>India</p>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider border-b border-white/10 pb-4">PROFILE DETAILS</h2>
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-bold block">NAME</span>
                      <span className="text-white font-semibold">{name || 'Aryan Shah'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">EMAIL</span>
                      <span className="text-white font-semibold">{email || 'aryan@thereal.com'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">PHONE</span>
                      <span className="text-white font-semibold">{phone || '+91 98765 43210'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
