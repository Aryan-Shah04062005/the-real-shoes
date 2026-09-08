'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, Heart, ArrowRight, ShoppingBag, Tag, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setCartOpen,
    updateQuantity,
    removeFromCart,
    moveToWishlist,
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
    subtotal,
    discountAmount,
    deliveryCharges,
    total,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    setIsApplying(true);
    await applyCoupon(inputCoupon);
    setIsApplying(false);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-premium-black shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-6 w-6 text-royal-blue" />
                <h2 className="text-xl font-bold tracking-wider text-white">YOUR CART</h2>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center space-y-4">
                  <div className="rounded-full bg-white/5 p-6 border border-white/5">
                    <ShoppingBag className="h-12 w-12 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Your cart is empty</h3>
                    <p className="text-sm text-slate-400 mt-1">Add items to get started on your journey.</p>
                  </div>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="rounded-full bg-royal-blue hover:bg-royal-blue-hover px-6 py-2.5 text-sm font-semibold tracking-wide text-white transition-all shadow-lg shadow-royal-blue/20"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => {
                  const itemKey = `${item.product.id}-${item.size}-${item.color}-${item.customizationId || ''}`;
                  const isUnavailable = item.product.status === 'ARCHIVED' || item.product.status === 'HIDDEN' || item.product.status === 'DRAFT';

                  return (
                    <div
                      key={itemKey}
                      className="flex gap-4 border-b border-white/5 pb-6 last:border-0 last:pb-0"
                    >
                      {/* Image Container */}
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-900 flex items-center justify-center">
                        <img
                          src={item.product.mainImage || item.product.images?.[0] || '/images/placeholder-shoe.svg'}
                          alt={item.product.name}
                          className="h-full w-full object-contain p-2"
                          onError={(e) => { e.currentTarget.src = '/images/placeholder-shoe.svg'; }}
                        />
                      </div>

                      {/* Info & Actions */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-bold text-white line-clamp-1">{item.product.name}</h4>
                            <button
                              onClick={() => removeFromCart(item.product.id, item.size, item.color, item.customizationId)}
                              className="text-slate-500 hover:text-red-400 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">
                            <span>Size: UK {item.size}</span>
                            <span>•</span>
                            <span>Color: {item.color}</span>
                          </div>

                          {item.customizationId && (
                            <span className="inline-block mt-1 rounded bg-royal-blue/20 text-royal-blue border border-royal-blue/30 px-2 py-0.5 text-[9px] font-bold">
                              Custom Colorway: #{item.customizationId}
                            </span>
                          )}

                          {isUnavailable && (
                            <div className="mt-1.5 rounded-lg bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                              This product is no longer available
                            </div>
                          )}

                          <div className="mt-2 text-sm font-bold text-white">
                            ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                          </div>
                        </div>

                        {/* Quantity Controls & Move to Wishlist */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center rounded-lg border border-white/10 bg-white/5">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity - 1, item.customizationId)}
                              className="p-1 text-slate-400 hover:text-white transition-colors"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-2.5 text-xs font-semibold text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity + 1, item.customizationId)}
                              className="p-1 text-slate-400 hover:text-white transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => moveToWishlist(item.product.id, item.size, item.color, item.customizationId)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Heart className="h-3.5 w-3.5" /> Save
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Coupon Code Section */}
            {cart.length > 0 && (
              <div className="border-t border-white/10 px-6 py-4 bg-slate-950/60">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-xs">
                    <div className="flex items-center gap-2 text-green-400 font-bold">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>COUPON {appliedCoupon.code} APPLIED (-₹{discountAmount})</span>
                    </div>
                    <button onClick={removeCoupon} className="text-slate-400 hover:text-white font-bold underline">
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCouponSubmit} className="flex gap-2">
                    <div className="relative flex-grow">
                      <Tag className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="ENTER COUPON CODE (e.g. REAL10)"
                        value={inputCoupon}
                        onChange={(e) => setInputCoupon(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2.5 text-xs text-white uppercase placeholder-slate-500 focus:border-royal-blue focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isApplying}
                      className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2.5 text-xs font-bold uppercase text-white transition-all"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponError && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{couponError}</p>}
              </div>
            )}

            {/* Footer / Summary */}
            {cart.length > 0 && (
              <div className="border-t border-white/10 bg-slate-950 p-6 space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-semibold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount</span>
                      <span className="font-semibold">-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-400">
                    <span>Shipping</span>
                    <span className="font-semibold text-white">
                      {deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges}`}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white">
                    <span>Total</span>
                    <span className="text-royal-blue">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {cart.some(item => item.product.status === 'ARCHIVED' || item.product.status === 'HIDDEN' || item.product.status === 'DRAFT') ? (
                  <div className="space-y-2">
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-xs font-bold text-red-400 uppercase tracking-wider">
                      Please remove unavailable items to proceed
                    </div>
                    <button
                      disabled
                      className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-800 px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 opacity-60"
                    >
                      PROCEED TO CHECKOUT
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/checkout"
                    onClick={() => setCartOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-royal-blue hover:bg-royal-blue-hover px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-royal-blue/20 hover:scale-[1.02]"
                  >
                    PROCEED TO CHECKOUT
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
