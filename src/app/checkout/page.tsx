'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { placeOrderAction } from '@/app/actions';
import { ShoppingBag, ArrowRight, ShieldCheck, CreditCard, QrCode, Building, Banknote, CheckCircle2, User, MapPin, Package, Check } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const { cart, subtotal, appliedCoupon, discountAmount, deliveryCharges, total, clearCart } = useCart();

  const [activeStep, setActiveStep] = useState<number>(1);

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

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'COD'>('UPI');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [confirmDetails, setConfirmDetails] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.flat || !formData.city || !formData.zip) {
      setErrorMessage('Please fill in all required contact and shipping address fields.');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    const items = cart.map((item) => ({
      productId: item.product.id,
      customizationId: item.customizationId,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    }));

    const orderPayload = {
      ...formData,
      paymentMethod,
      couponCode: appliedCoupon?.code,
      discountAmount,
    };

    const result = await placeOrderAction(orderPayload, items);

    if (result.success && result.orderId) {
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

      <div className="flex flex-col sm:flex-row items-baseline justify-between border-b border-white/10 pb-4 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase">SECURE CHECKOUT</h1>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
          <ShieldCheck className="h-4 w-4 text-green-400" />
          <span>256-Bit Encrypted Checkout</span>
        </div>
      </div>

      {/* STEP INDICATORS */}
      <div className="grid grid-cols-4 gap-2 mb-10 text-center text-xs font-bold uppercase">
        {[
          { step: 1, label: 'Customer Details', icon: User },
          { step: 2, label: 'Delivery Address', icon: MapPin },
          { step: 3, label: 'Order Summary', icon: Package },
          { step: 4, label: 'Payment', icon: CreditCard },
        ].map((s) => {
          const IconComp = s.icon;
          const isActive = activeStep === s.step;
          const isDone = activeStep > s.step;
          return (
            <button
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              className={`rounded-xl p-3 border transition-all flex flex-col items-center gap-1.5 ${
                isActive
                  ? 'border-royal-blue bg-royal-blue/20 text-white shadow-md'
                  : isDone
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : 'border-white/10 bg-white/5 text-slate-500'
              }`}
            >
              <IconComp className="h-4 w-4" />
              <span className="hidden sm:inline">STEP {s.step}: {s.label}</span>
              <span className="sm:hidden">{s.step}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">
        {/* LEFT COLUMN: Steps Content */}
        <div className="lg:col-span-7 space-y-8">
          {/* STEP 1: CUSTOMER DETAILS */}
          {activeStep === 1 && (
            <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <User className="h-5 w-5 text-royal-blue" /> STEP 1 — CUSTOMER DETAILS
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aryan Shah"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                      MOBILE NUMBER *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                      EMAIL ADDRESS *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. aryan@thereal.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="w-full rounded-xl bg-royal-blue hover:bg-royal-blue-hover py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all"
                >
                  NEXT: DELIVERY ADDRESS →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DELIVERY ADDRESS */}
          {activeStep === 2 && (
            <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-royal-blue" /> STEP 2 — DELIVERY ADDRESS
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                    HOUSE / FLAT / BUILDING *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 402, Skyline Premium Tower"
                    value={formData.flat}
                    onChange={(e) => setFormData({ ...formData, flat: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                    STREET ADDRESS / AREA *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. G-Block, Bandra Kurla Complex"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                      CITY *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mumbai"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                      STATE *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maharashtra"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                      PIN CODE *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 400051"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                    LANDMARK (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near Diamond Market Gate 2"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-xs font-bold uppercase text-slate-300"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="flex-1 rounded-xl bg-royal-blue hover:bg-royal-blue-hover py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all"
                  >
                    NEXT: ORDER SUMMARY →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ORDER SUMMARY */}
          {activeStep === 3 && (
            <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Package className="h-5 w-5 text-royal-blue" /> STEP 3 — ORDER SUMMARY
                </h3>
              </div>

              <div className="space-y-4">
                <div className="divide-y divide-white/5 border border-white/10 rounded-xl p-4 bg-slate-950">
                  {cart.map((item) => (
                    <div key={`${item.product.id}-${item.size}-${item.color}`} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <h4 className="font-bold text-white">{item.product.name}</h4>
                        <p className="text-[11px] text-slate-400">Size: UK {item.size} • Color: {item.color} • Qty: {item.quantity}</p>
                      </div>
                      <span className="font-bold text-white">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-bold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span className="font-bold">-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping Delivery</span>
                    <span className="font-bold text-white">{deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges}`}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white">
                    <span>Total Amount Payable</span>
                    <span className="text-royal-blue">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-xs font-bold uppercase text-slate-300"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    className="flex-1 rounded-xl bg-royal-blue hover:bg-royal-blue-hover py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all"
                  >
                    NEXT: SELECT PAYMENT METHOD →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PAYMENT SELECTION */}
          {activeStep === 4 && (
            <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-royal-blue" /> STEP 4 — SELECT PAYMENT METHOD
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* UPI Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`rounded-xl p-4 border text-left transition-all ${
                    paymentMethod === 'UPI' ? 'border-royal-blue bg-royal-blue/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <QrCode className="h-5 w-5 text-royal-blue" /> UPI (GPay / PhonePe / Paytm)
                  </div>
                  <p className="text-[11px] font-light mt-1 text-slate-300">Instant payment via VPA ID or QR Code scan.</p>
                </button>

                {/* CARD Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`rounded-xl p-4 border text-left transition-all ${
                    paymentMethod === 'CARD' ? 'border-royal-blue bg-royal-blue/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CreditCard className="h-5 w-5 text-royal-blue" /> Credit / Debit Card
                  </div>
                  <p className="text-[11px] font-light mt-1 text-slate-300">Visa, Mastercard, RuPay & Maestro cards.</p>
                </button>

                {/* NET BANKING Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('NETBANKING')}
                  className={`rounded-xl p-4 border text-left transition-all ${
                    paymentMethod === 'NETBANKING' ? 'border-royal-blue bg-royal-blue/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Building className="h-5 w-5 text-royal-blue" /> Net Banking
                  </div>
                  <p className="text-[11px] font-light mt-1 text-slate-300">HDFC, ICICI, SBI, Axis & major Indian banks.</p>
                </button>

                {/* COD Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`rounded-xl p-4 border text-left transition-all ${
                    paymentMethod === 'COD' ? 'border-royal-blue bg-royal-blue/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Banknote className="h-5 w-5 text-green-400" /> Cash on Delivery (COD)
                  </div>
                  <p className="text-[11px] font-light mt-1 text-slate-300">Pay cash or UPI at your doorstep upon delivery.</p>
                </button>
              </div>

              {/* UPI Input */}
              {paymentMethod === 'UPI' && (
                <div className="rounded-xl border border-white/10 bg-slate-950 p-4 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">ENTER YOUR UPI VPA ID</label>
                  <input
                    type="text"
                    placeholder="e.g. yourname@okaxis or 9876543210@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                  />
                </div>
              )}

              {/* CARD Input */}
              {paymentMethod === 'CARD' && (
                <div className="rounded-xl border border-white/10 bg-slate-950 p-4 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">CARD NUMBER</label>
                    <input
                      type="text"
                      placeholder="4532 •••• •••• 8892"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">EXPIRY</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">CVC</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmDetails}
                    onChange={(e) => setConfirmDetails(e.target.checked)}
                    className="rounded border-white/10 bg-white/5 accent-royal-blue"
                  />
                  I confirm my contact info and shipping address are correct.
                </label>
              </div>

              {errorMessage && (
                <p className="text-xs text-red-400 font-bold">{errorMessage}</p>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-xs font-bold uppercase text-slate-300"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="flex-1 rounded-xl bg-royal-blue hover:bg-royal-blue-hover py-4 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-royal-blue/20 hover:scale-[1.02]"
                >
                  {status === 'submitting' ? 'PROCESSING ORDER...' : `CONFIRM & PLACE ORDER (₹${total.toLocaleString('en-IN')})`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Persistent Order Summary Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3">ORDER SUMMARY</h3>
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-white">{item.product.name}</h4>
                    <p className="text-[11px] text-slate-400">Size: UK {item.size} • Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-white">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-bold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span className="font-bold">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Shipping</span>
                <span className="font-bold text-white">{deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges}`}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white">
                <span>Total</span>
                <span className="text-royal-blue">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
