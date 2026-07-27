'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, Heart, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setCartOpen,
    updateQuantity,
    removeFromCart,
    moveToWishlist,
    subtotal,
    deliveryCharges,
    total,
  } = useCart();

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
                cart.map((item, idx) => {
                  const colorway = item.product.availableColors.find(c => c.name === item.color);
                  const colorHex = colorway ? colorway.hex : '#ffffff';
                  return (
                    <div
                      key={`${item.product.id}-${item.size}-${item.color}`}
                      className="flex gap-4 border-b border-white/5 pb-6 last:border-0 last:pb-0"
                    >
                      {/* Visual Mock Image Container */}
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-900 flex items-center justify-center">
                        {/* Generates a neat color indicator for the shoe */}
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{ backgroundColor: colorHex }}
                        />
                        <div
                          className="h-12 w-12 rounded-full blur-xl"
                          style={{ backgroundColor: colorHex }}
                        />
                        <span className="z-10 text-[10px] font-bold text-white/80 text-center px-1">
                          {item.product.name}
                        </span>
                      </div>

                      {/* Item Details */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex justify-between">
                            <h4 className="text-sm font-bold text-white line-clamp-1">{item.product.name}</h4>
                            <span className="text-sm font-semibold text-white ml-2">
                              ₹{item.product.price * item.quantity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{item.product.brand}</p>
                          
                          {/* Selected Specs */}
                          <div className="flex gap-4 mt-2 text-xs">
                            <span className="text-slate-400">
                              Size: <strong className="text-white">{item.size}</strong>
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-400">
                              Color:
                              <span
                                className="h-3 w-3 rounded-full border border-white/20"
                                style={{ backgroundColor: colorHex }}
                                title={item.color}
                              />
                              <strong className="text-white">{item.color}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Quantity Controls & Actions */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-semibold text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => moveToWishlist(item.product.id, item.size, item.color)}
                              className="text-slate-500 hover:text-red-400 transition-colors"
                              title="Save to Wishlist"
                            >
                              <Heart className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.product.id, item.size, item.color)}
                              className="text-slate-500 hover:text-red-500 transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary (Sticky at bottom) */}
            {cart.length > 0 && (
              <div className="border-t border-white/10 bg-premium-dark p-6 space-y-4">
                <div className="space-y-2 text-sm text-slate-400">
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
                  {subtotal < 10000 && (
                    <div className="text-[11px] text-slate-400 text-right font-light">
                      Add <span className="text-royal-blue font-bold">₹{10000 - subtotal}</span> more for free shipping.
                    </div>
                  )}
                  <div className="border-t border-white/5 pt-3 flex justify-between text-base font-bold text-white">
                    <span>Total Amount</span>
                    <span className="text-royal-blue text-lg">₹{total}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-royal-blue hover:bg-royal-blue-hover py-3.5 text-sm font-semibold tracking-wider text-white transition-all shadow-lg shadow-royal-blue/20"
                >
                  PROCEED TO CHECKOUT
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
