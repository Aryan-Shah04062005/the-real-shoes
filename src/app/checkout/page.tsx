'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { placeOrderAction } from '@/app/actions';
import { ShoppingBag, ArrowRight, ShieldCheck, CreditCard, Landmark, Check } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const { cart, subtotal, deliveryCharges, total, clearCart } = useCart();

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    flat: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
    landmark: '',
    notes: '',
  });

  const [confirmDetails, setConfirmDetails] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card' | 'upi'>('cod');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmDetails) {
      setErrorMessage('Please confirm that your delivery details are correct.');
      return;
    }
    
    if (cart.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    // Format items for placement action
    const items = cart.map((item) => ({
      productId: item.product.id,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    }));

    const result = await placeOrderAction(formData, items);

    if (result.success && result.orderId) {
      // Clear cart state and redirect
      clearCart();
      window.location.href = `/order-confirmation/${result.orderId}`;
    } else {
      setStatus('error');
      setErrorMessage(result.error || 'Failed to place order. Please try again.');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-6 py-24 mx-auto max-w-md space-y-6">
        <div className="rounded-full bg-white/5 border border-white/5 p-6 text-slate-600">
          <ShoppingBag className="h-12 w-12" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white uppercase">Checkout is locked</h2>
          <p className="text-xs text-slate-400 mt-2 font-light leading-relaxed">
            Your cart is currently empty. Add shoes from our collection to unlock checkout.
          </p>
        </div>
        <Link
          href="/shop"
          className="rounded-full bg-royal-blue hover:bg-royal-blue-hover px-8 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-royal-blue/20"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Background glow */}
      <div className="glow-blue top-[10%] left-[-150px]" />
      <div className="glow-silver top-[50%] right-[-150px]" />

      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-10 uppercase text-left border-b border-white/10 pb-4">
        SECURE CHECKOUT
      </h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">
        {/* LEFT COLUMN: Customer Information Form */}
        <div className="lg:col-span-7 space-y-8 z-10">
          {/* Section 1: Customer Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-widest text-royal-blue uppercase">1. Customer Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aryan Shah"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:border-royal-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 99999 99999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:border-royal-blue focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. aryan@thereal.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:border-royal-blue focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-widest text-royal-blue uppercase">2. Shipping Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  House / Flat Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Penthouse A, Level 12"
                  value={formData.flat}
                  onChange={(e) => setFormData({ ...formData, flat: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:border-royal-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Street / Area
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skyline Heights Road"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:border-royal-blue focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:border-royal-blue focus:outline-none"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  State
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:border-royal-blue focus:outline-none"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  ZIP / PIN
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 400001"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:border-royal-blue focus:outline-none"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Country
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. India"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:border-royal-blue focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near BKC Tower"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:border-royal-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Order Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deliver on weekend"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:border-royal-blue focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-widest text-royal-blue uppercase">3. Payment Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Cash On Delivery (Active) */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`rounded-2xl border p-5 flex flex-col items-center justify-center text-center gap-2 transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-royal-blue bg-royal-blue/10 text-white'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                }`}
              >
                <Landmark className="h-6 w-6 text-royal-blue" />
                <span className="text-xs font-bold uppercase tracking-wider">Cash on Delivery</span>
                <span className="text-[9px] text-slate-400">Pay in cash on receipt</span>
              </button>

              {/* Card (Architecture Placeholder) */}
              <button
                type="button"
                disabled
                className="rounded-2xl border border-white/5 bg-white/5 p-5 flex flex-col items-center justify-center text-center gap-2 opacity-40 cursor-not-allowed"
                title="Cards payment coming soon"
              >
                <CreditCard className="h-6 w-6 text-slate-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Credit / Debit</span>
                <span className="text-[9px] text-slate-600">Online Gateway (Soon)</span>
              </button>

              {/* UPI (Architecture Placeholder) */}
              <button
                type="button"
                disabled
                className="rounded-2xl border border-white/5 bg-white/5 p-5 flex flex-col items-center justify-center text-center gap-2 opacity-40 cursor-not-allowed"
                title="UPI payments coming soon"
              >
                <div className="h-6 w-6 rounded-full border border-slate-600 flex items-center justify-center text-[10px] font-black text-slate-500">
                  UPI
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">UPI / QR SCAN</span>
                <span className="text-[9px] text-slate-600">Instant UPI transfer (Soon)</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Order Summary & Placement Confirmation */}
        <div className="lg:col-span-5 space-y-6 z-10">
          <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-6">
            <h3 className="text-sm font-bold tracking-widest text-white uppercase border-b border-white/5 pb-4">
              ORDER SUMMARY
            </h3>

            {/* Cart Items Details */}
            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2">
              {cart.map((item, idx) => {
                const colorHex = item.product.availableColors.find(c => c.name === item.color)?.hex || '#ffffff';
                return (
                  <div key={idx} className="flex gap-3 items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Visual Color Thumbnail */}
                      <div className="relative h-12 w-12 flex-shrink-0 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden">
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{ backgroundColor: colorHex }}
                        />
                      <span className="z-10 text-[8px] font-bold text-white uppercase text-center px-0.5 truncate">
                        {item.product.name.split(' ').pop()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{item.product.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Qty: {item.quantity} &bull; Size: {item.size} &bull; Color: {item.color}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white">₹{item.product.price * item.quantity}</span>
                </div>
                );
              })}
            </div>

            <hr className="border-white/5" />

            {/* Price Calculations */}
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white font-medium">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="text-white font-medium">
                  {deliveryCharges === 0 ? <span className="text-green-400 font-semibold">FREE</span> : `₹${deliveryCharges}`}
                </span>
              </div>
              <div className="border-t border-white/5 pt-3 flex justify-between text-sm font-bold text-white">
                <span>Final Total</span>
                <span className="text-royal-blue text-base">₹{total}</span>
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Checkbox confirmation details */}
            <div className="space-y-4">
              <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={confirmDetails}
                  onChange={(e) => setConfirmDetails(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-white/10 bg-white/5 text-royal-blue focus:ring-0 mt-0.5"
                />
                <span>I confirm that my delivery details are correct and agree to place the order.</span>
              </label>

              {errorMessage && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-royal-blue hover:bg-royal-blue-hover py-4 text-xs font-bold uppercase tracking-widest text-white transition-all disabled:opacity-50 shadow-lg shadow-royal-blue/20"
              >
                {status === 'submitting' ? 'PLACING ORDER...' : 'PLACE ORDER (COD)'}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 text-center font-light pt-2">
                <ShieldCheck className="h-4.5 w-4.5 text-green-500" />
                <span>Aryan Shah Inspected &bull; Secure Checkout Architecture</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
