'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/lib/db';
import { useCart } from '@/context/CartContext';
import { Star, Heart, Eye, ShoppingBag, ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { wishlist, addToWishlist, removeFromWishlist, addToCart, setQuickViewProduct } = useCart();
  const isWishlisted = wishlist.some((p) => p.id === product.id);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const openQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultSize = product.availableSizes?.[0] || 8;
    const defaultColor = product.availableColors?.[0]?.name || 'Standard';
    addToCart(product, defaultSize, defaultColor, 1);
  };

  return (
    <div className="glass-card flex flex-col justify-between rounded-2xl overflow-hidden p-4 relative group hover:border-royal-blue/30 transition-all duration-300">
      {/* Top Badges & Wishlist Button */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
        {product.isNewArrival && (
          <span className="rounded bg-royal-blue px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white shadow-md">
            NEW ARRIVAL
          </span>
        )}
        {product.isBestSeller && (
          <span className="rounded bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white shadow-md">
            BEST SELLER
          </span>
        )}
        {product.discountPercentage > 0 && (
          <span className="rounded bg-red-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white shadow-md">
            {product.discountPercentage}% OFF
          </span>
        )}
      </div>

      {/* Top Action Buttons (Wishlist & Quick View) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
        <button
          onClick={openQuickView}
          title="Quick View"
          className="rounded-full p-2.5 backdrop-blur-md bg-black/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={toggleWishlist}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className={`rounded-full p-2.5 backdrop-blur-md border transition-all min-h-[40px] min-w-[40px] flex items-center justify-center ${
            isWishlisted
              ? 'bg-red-500/20 border-red-500/50 text-red-500'
              : 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Image Container */}
      <Link href={`/product/${product.id}`} className="block relative w-full pt-2">
        <div className="relative h-52 sm:h-60 w-full rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-black flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-white/15 transition-all">
          <div className="absolute inset-0 bg-royal-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <img
            src={product.mainImage || product.images?.[0] || '/images/shoes/genesis_blue.png'}
            alt={product.name}
            className="z-10 h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        </div>
      </Link>

      {/* Product Content */}
      <div className="mt-4 flex flex-col justify-between flex-grow">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{product.brand}</span>
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-[11px] font-bold text-slate-200">{product.rating}</span>
              <span className="text-[10px] text-slate-400">({product.reviews?.length || 12})</span>
            </div>
          </div>

          <Link href={`/product/${product.id}`} className="block mt-1">
            <h3 className="text-sm font-bold text-white group-hover:text-royal-blue transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Available Sizes preview pills */}
          <div className="mt-2.5 flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Sizes:</span>
            {product.availableSizes?.map((size) => (
              <span
                key={size}
                className="inline-block rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-slate-300"
              >
                UK {size}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-base font-black text-white leading-tight">₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice > product.price && (
              <span className="text-[11px] text-slate-400 line-through leading-tight">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            className="rounded-xl bg-white/5 border border-white/10 group-hover:bg-royal-blue group-hover:border-royal-blue px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 group-hover:text-white transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
            title="Quick Add to Cart"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
