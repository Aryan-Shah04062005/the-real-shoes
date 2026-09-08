'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Star, ShoppingBag, Heart, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function QuickViewModal() {
  const { quickViewProduct, setQuickViewProduct, addToCart, wishlist, addToWishlist, removeFromWishlist } = useCart();
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');

  if (!quickViewProduct) return null;

  const isWishlisted = wishlist.some((p) => p.id === quickViewProduct.id);
  const currentSize = selectedSize || quickViewProduct.availableSizes?.[0] || 8;
  const currentColor = selectedColor || quickViewProduct.availableColors?.[0]?.name || 'Standard';

  const handleAddToCart = () => {
    addToCart(quickViewProduct, currentSize, currentColor, 1);
    setQuickViewProduct(null);
  };

  const toggleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(quickViewProduct.id);
    } else {
      addToWishlist(quickViewProduct);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-4 right-4 z-10 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Product Image */}
          <div className="relative aspect-square w-full rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-black p-4 flex items-center justify-center border border-white/5">
            <img
              src={quickViewProduct.mainImage || quickViewProduct.images?.[0] || '/images/shoes/genesis_blue.png'}
              alt={quickViewProduct.name}
              onError={(e) => {
                e.currentTarget.src = '/images/shoes/genesis_blue.png';
              }}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Product Details */}
          <div className="space-y-4 text-left">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-royal-blue">{quickViewProduct.brand}</span>
              <h2 className="text-xl font-bold text-white mt-1">{quickViewProduct.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-amber-400">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-xs font-bold text-slate-200 ml-1">{quickViewProduct.rating}</span>
                </div>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs text-slate-400">{quickViewProduct.reviews?.length || 12} Verified Reviews</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-black text-white">₹{quickViewProduct.price.toLocaleString('en-IN')}</span>
              {quickViewProduct.originalPrice > quickViewProduct.price && (
                <span className="text-sm text-slate-400 line-through">
                  ₹{quickViewProduct.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
              {quickViewProduct.discountPercentage > 0 && (
                <span className="rounded bg-red-500/20 text-red-400 px-2 py-0.5 text-xs font-bold">
                  {quickViewProduct.discountPercentage}% OFF
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 font-light leading-relaxed line-clamp-3">
              {quickViewProduct.description}
            </p>

            {/* Size Selector */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">Select Size (UK)</span>
              <div className="flex flex-wrap gap-2">
                {[6, 7, 8, 9, 10, 11, 12].map((size) => {
                  const isAvailable = quickViewProduct.availableSizes?.includes(size);
                  const isSelected = currentSize === size;

                  return (
                    <button
                      key={size}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(size)}
                      className={`h-9 w-9 rounded-lg text-xs font-bold border transition-all ${
                        !isAvailable
                          ? 'border-white/5 text-slate-600 cursor-not-allowed bg-black/20 line-through'
                          : isSelected
                          ? 'border-royal-blue bg-royal-blue text-white shadow-lg shadow-royal-blue/20'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Selector */}
            {quickViewProduct.availableColors && quickViewProduct.availableColors.length > 0 && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">Color: {currentColor}</span>
                <div className="flex items-center gap-2">
                  {quickViewProduct.availableColors.map((col) => (
                    <button
                      key={col.name}
                      onClick={() => setSelectedColor(col.name)}
                      title={col.name}
                      style={{ backgroundColor: col.hex }}
                      className={`h-7 w-7 rounded-full border-2 transition-all flex items-center justify-center ${
                        currentColor === col.name ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                    >
                      {currentColor === col.name && <Check className="h-3 w-3 text-white mix-blend-difference" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                className="flex-grow flex items-center justify-center gap-2 rounded-xl bg-royal-blue hover:bg-royal-blue-hover px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:scale-[1.02]"
              >
                <ShoppingBag className="h-4 w-4" /> Add to Cart
              </button>
              <button
                onClick={toggleWishlist}
                className={`rounded-xl p-3 border transition-all ${
                  isWishlisted
                    ? 'bg-red-500/20 border-red-500/50 text-red-500'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <Link
              href={`/product/${quickViewProduct.id}`}
              onClick={() => setQuickViewProduct(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-royal-blue hover:underline pt-1"
            >
              View Full Product Details <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
