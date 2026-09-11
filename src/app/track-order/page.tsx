'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackOrderAction } from '@/app/actions';
import { Order } from '@/lib/db';
import { Search, Package, CheckCircle2, Truck, Clock, MapPin, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const queryId = searchParams.get('id') || searchParams.get('orderId');
    const queryContact = searchParams.get('email') || searchParams.get('phone');
    if (queryId) setOrderId(queryId);
    if (queryContact) setEmailOrPhone(queryContact);
  }, [searchParams]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTrackedOrder(null);

    const res = await trackOrderAction(orderId, emailOrPhone);
    setLoading(false);

    if (res.success && res.order) {
      setTrackedOrder(res.order);
    } else {
      setError(res.error || 'Order not found.');
    }
  };

  const statusSteps: Order['status'][] = [
    'Pending',
    'Confirmed',
    'Processing',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered'
  ];

  const getStepIndex = (status: Order['status']) => {
    const idx = statusSteps.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="relative min-h-screen bg-premium-black text-premium-light py-12 px-4 sm:px-6 lg:px-8">
      {/* Background glows */}
      <div className="glow-blue top-[10%] left-[-100px]" />
      <div className="glow-silver top-[40%] right-[-100px]" />

      <div className="mx-auto max-w-3xl space-y-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white uppercase tracking-wider">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        {/* Title */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-royal-blue">LIVE ORDER UPDATES</span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">TRACK YOUR ORDER</h1>
          <p className="text-xs text-slate-400 font-light">
            Enter your Order ID (e.g. TR-2026-00001) and Email or Mobile number to view real-time delivery status.
          </p>
        </div>

        {/* Search Form */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  ORDER ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TR-2026-00001"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white uppercase placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  EMAIL OR MOBILE NUMBER
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. aryan@thereal.com or 9876543210"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-royal-blue hover:bg-royal-blue-hover py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Searching Order...' : 'TRACK ORDER'} <Search className="h-4 w-4" />
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}
        </div>

        {/* Tracked Order Result Timeline */}
        {trackedOrder && (
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4 gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-royal-blue">ORDER #{trackedOrder.id}</span>
                <h3 className="text-lg font-bold text-white">Recipient: {trackedOrder.customerName}</h3>
                <p className="text-xs text-slate-400 font-light">Placed on {trackedOrder.date}</p>
              </div>
              <span className="rounded-full bg-royal-blue/20 border border-royal-blue/30 px-3 py-1 text-xs font-bold text-royal-blue uppercase">
                STATUS: {trackedOrder.status}
              </span>
            </div>

            {/* Visual Timeline Bar */}
            <div className="py-4">
              <div className="relative flex items-center justify-between">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2 z-0" />
                <div
                  className="absolute top-1/2 left-0 h-1 bg-royal-blue -translate-y-1/2 z-0 transition-all duration-500"
                  style={{
                    width: `${(getStepIndex(trackedOrder.status) / (statusSteps.length - 1)) * 100}%`,
                  }}
                />

                {statusSteps.map((step, idx) => {
                  const currentIdx = getStepIndex(trackedOrder.status);
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={step} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCurrent
                            ? 'border-royal-blue bg-royal-blue text-white scale-110 shadow-lg shadow-royal-blue/30'
                            : isCompleted
                            ? 'border-royal-blue bg-slate-900 text-royal-blue'
                            : 'border-white/10 bg-slate-950 text-slate-600'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-3.5 w-3.5" />}
                      </div>
                      <span
                        className={`mt-2 text-[9px] font-bold uppercase tracking-wider text-center max-w-[60px] ${
                          isCurrent ? 'text-royal-blue' : isCompleted ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items Breakdown */}
            <div className="border-t border-white/10 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">ORDERED ITEMS</h4>
              <div className="space-y-2">
                {trackedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                    <div>
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="text-slate-400 ml-2">(Size: UK {item.size}, Qty: {item.quantity})</span>
                    </div>
                    <span className="font-bold text-white">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-white pt-2">
                <span>Total Amount:</span>
                <span className="text-royal-blue">₹{trackedOrder.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-premium-black flex items-center justify-center text-slate-400">
        Loading order tracker...
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}
