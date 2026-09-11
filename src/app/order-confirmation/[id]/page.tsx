import React from 'react';
import { getOrdersList } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Mail, Phone, Calendar, Truck, Landmark, XCircle, ArrowRight, MessageSquare } from 'lucide-react';

export const revalidate = 0; // Prevent page caching so live order status changes are immediately visible

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { id } = await params;
  const orders = await getOrdersList();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    notFound();
  }

  // Define tracking status mapping
  const statuses = [
    { label: 'Pending', key: 'Pending' },
    { label: 'Confirmed', key: 'Confirmed' },
    { label: 'Processing', key: 'Processing' },
    { label: 'Shipped', key: 'Shipped' },
    { label: 'Out for Delivery', key: 'Out for Delivery' },
    { label: 'Delivered', key: 'Delivered' }
  ];

  const currentIdx = statuses.findIndex(s => s.key === order.status);
  const isCancelled = order.status === 'Cancelled';

  // Format Date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Background glow */}
      <div className="glow-blue top-[10%] left-[-100px]" />
      <div className="glow-silver top-[50%] right-[-100px]" />

      <div className="space-y-8 z-10 relative">
        {/* HEADER BLOCK */}
        {isCancelled ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center space-y-3">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-white uppercase">Order Cancelled</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              We regret to inform you that Order <strong className="text-white">{order.id}</strong> has been cancelled. Please contact our support team if you believe this is an error.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-white uppercase">Order Confirmed</h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Thank you for shopping at THE REAL. Your order <strong className="text-white">{order.id}</strong> has been placed and is currently pending verification.
            </p>
          </div>
        )}

        {/* LIVE TRACKING BAR */}
        {!isCancelled && (
          <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-6">
            <h3 className="text-sm font-bold tracking-widest text-royal-blue uppercase border-b border-white/5 pb-3">
              LIVE TRACKING STATUS
            </h3>
            
            {/* Steps Container */}
            <div className="relative flex flex-col md:flex-row justify-between items-center md:items-start gap-8 md:gap-2">
              {/* Connector line for desktop */}
              <div className="absolute left-6 right-6 top-[22px] hidden md:block h-0.5 bg-slate-800 z-0">
                <div 
                  className="h-full bg-royal-blue transition-all duration-500" 
                  style={{ width: `${(Math.max(0, currentIdx) / (statuses.length - 1)) * 100}%` }}
                />
              </div>

              {statuses.map((step, idx) => {
                const isPassed = idx <= currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div key={step.key} className="flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center z-10 w-full md:w-auto">
                    {/* Circle Indicator */}
                    <div 
                      className={`h-11 w-11 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${
                        isPassed 
                          ? 'border-royal-blue bg-royal-blue text-white shadow-lg shadow-royal-blue/30 scale-105' 
                          : 'border-slate-800 bg-slate-900 text-slate-500'
                      } ${isCurrent ? 'animate-pulse' : ''}`}
                    >
                      {idx + 1}
                    </div>
                    {/* Label */}
                    <div>
                      <span className={`block text-xs font-semibold ${isPassed ? 'text-white' : 'text-slate-500'}`}>
                        {step.label}
                      </span>
                      {isCurrent && (
                        <span className="inline-block rounded bg-royal-blue/15 border border-royal-blue/30 px-1.5 py-0.5 text-[8px] font-bold text-royal-blue uppercase mt-1">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ORDER DETAILS & PRODUCTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Left panel: Product summaries */}
          <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-6">
            <h3 className="text-sm font-bold tracking-widest text-white uppercase border-b border-white/5 pb-3">
              ORDERED PRODUCTS
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center justify-between pb-4 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 opacity-25" style={{ backgroundColor: item.colorHex }} />
                      <span className="z-10 text-[9px] font-bold text-white uppercase text-center px-1">
                        {item.name.split(' ').pop()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Qty: {item.quantity} &bull; Size: {item.size} &bull; Color: {item.color}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/5 pt-4 space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white">₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="text-white">
                  {order.deliveryCharges === 0 ? <span className="text-green-400 font-semibold">FREE</span> : `₹${order.deliveryCharges}`}
                </span>
              </div>
              <div className="border-t border-white/5 pt-3 flex justify-between text-sm font-bold text-white">
                <span>Total Amount Paid</span>
                <span className="text-royal-blue">₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Right panel: Shipping & Customer Details */}
          <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-6">
            <h3 className="text-sm font-bold tracking-widest text-white uppercase border-b border-white/5 pb-3">
              SHIPPING DETAILS
            </h3>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500">Customer Name</span>
                <span className="text-sm font-bold text-white">{order.customerName}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500">Mobile Phone</span>
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-royal-blue" />
                    {order.phone}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500">Email Address</span>
                  <span className="font-semibold text-white flex items-center gap-1.5 truncate">
                    <Mail className="h-3.5 w-3.5 text-royal-blue" />
                    {order.email}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500">Delivery Address</span>
                <span className="leading-relaxed block">
                  {order.address.flat}, {order.address.street}<br />
                  {order.address.city}, {order.address.state} - {order.address.zip}<br />
                  {order.address.country}
                </span>
              </div>

              {order.landmark && (
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500">Landmark</span>
                  <span>{order.landmark}</span>
                </div>
              )}

              {order.notes && (
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500">Order Notes</span>
                  <span className="italic">"{order.notes}"</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500">Order Placed</span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-royal-blue animate-float" />
                    {formatDate(order.date)}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500">Payment Option</span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Landmark className="h-3.5 w-3.5 text-royal-blue" />
                    {order.paymentMethod === 'UPI' ? 'UPI (GPay / PhonePe / Paytm)' :
                     order.paymentMethod === 'CARD' ? 'Credit / Debit Card' :
                     order.paymentMethod === 'NETBANKING' ? 'Net Banking' : 'Cash on Delivery'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM NAV BAR */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6 border-t border-white/10">
          <Link
            href="/shop"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-all w-full sm:w-auto"
          >
            Continue Shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://wa.me/919876543210?text=Hello%20THE%20REAL%20Support,%20I'd%20like%20to%20inquire%20about%20Order%20status%20for%20ID:%20"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-6 py-3.5 text-xs font-semibold text-green-400 hover:bg-green-500/20 transition-all w-full sm:w-auto"
          >
            <MessageSquare className="h-4 w-4" />
            CHAT ABOUT THIS ORDER
          </a>
        </div>
      </div>
    </div>
  );
}
