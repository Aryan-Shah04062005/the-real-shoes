'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/db';
import { useCart } from '@/context/CartContext';
import SizeGuideModal from '@/components/SizeGuideModal';
import { submitReviewAction } from '@/app/actions';
import { Star, Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, Plus, Minus, Send, Check, Ruler } from 'lucide-react';
import Link from 'next/link';

interface ProductDetailsClientProps {
  product: Product;
}

export default function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const { addToCart, wishlist, addToWishlist, removeFromWishlist, setSizeGuideOpen } = useCart();

  // Product Gallery Images
  const galleryImages = (product.images && product.images.length > 0)
    ? product.images
    : [product.mainImage || '/images/shoes/genesis_blue.png'];

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Active configurations
  const [selectedSize, setSelectedSize] = useState<number>(product.availableSizes[0] || 8);
  const [selectedColor, setSelectedColor] = useState(product.availableColors[0] || { name: 'Royal Blue', hex: '#0a58ca', threeColor: '#0a58ca' });
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews' | 'policies'>('desc');

  // Review Form state
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const inWishlist = wishlist.some((w) => w.id === product.id);

  const handleToggleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = async () => {
    if (product.stock === 0) return;
    addToCart(product, selectedSize, selectedColor.name, quantity);
  };

  const handleBuyNow = async () => {
    if (product.stock === 0) return;
    await handleAddToCart();
    window.location.href = '/checkout';
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewStatus('submitting');

    const res = await submitReviewAction(product.id, {
      name: reviewName,
      rating: reviewRating,
      comment: reviewComment
    });

    if (res.success) {
      setReviewStatus('success');
      setReviewName('');
      setReviewRating(5);
      setReviewComment('');
      setTimeout(() => setReviewStatus('idle'), 3000);
    } else {
      setReviewStatus('idle');
    }
  };

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SizeGuideModal />

      {/* Background Glows */}
      <div className="glow-blue top-[10%] left-[-200px]" />
      <div className="glow-silver top-[40%] right-[-200px]" />

      {/* Breadcrumb */}
      <div className="text-xs text-slate-500 mb-8 uppercase tracking-widest flex items-center gap-2">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-white transition-colors">Shop</Link>
        <span>/</span>
        <span className="text-royal-blue font-bold">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* LEFT COLUMN: Clean 2D Product Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="h-[420px] sm:h-[500px] w-full relative rounded-3xl overflow-hidden border border-white/10 bg-slate-950 p-6 shadow-2xl flex items-center justify-center group">
            <img
              src={galleryImages[activeImageIndex] || galleryImages[0]}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.src = '/images/placeholder-shoe.svg';
              }}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Thumbnail Selector Gallery */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden border transition-all bg-slate-900 p-2 ${
                    activeImageIndex === idx
                      ? 'border-royal-blue ring-2 ring-royal-blue/40 scale-105'
                      : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`${product.name} thumbnail ${idx + 1}`} 
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder-shoe.svg';
                    }}
                    className="h-full w-full object-contain" 
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Product Information & Purchase Form */}
        <div className="lg:col-span-5 space-y-6 text-left">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-royal-blue">{product.brand}</span>
            <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight mt-1">{product.name}</h1>
            
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-slate-600'}`}
                  />
                ))}
                <span className="text-xs font-bold text-white ml-1.5">{product.rating}</span>
              </div>
              <span className="text-slate-600">|</span>
              <span className="text-xs text-slate-400 font-medium">{product.reviews?.length || 12} Verified Customer Reviews</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-4 border-y border-white/10 py-4">
            <span className="text-3xl font-black text-white">₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice > product.price && (
              <span className="text-base text-slate-500 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
            {product.discountPercentage > 0 && (
              <span className="rounded bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 text-xs font-bold">
                {product.discountPercentage}% OFF
              </span>
            )}
          </div>

          {/* SIZE SELECTOR WITH SIZE GUIDE */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">SELECT SIZE (UK)</span>
              <button
                onClick={() => setSizeGuideOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-royal-blue hover:underline"
              >
                <Ruler className="h-3.5 w-3.5" /> Size Guide
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[6, 7, 8, 9, 10, 11, 12].map((size) => {
                const isAvailable = product.availableSizes?.includes(size);
                const isSelected = selectedSize === size;

                return (
                  <button
                    key={size}
                    disabled={!isAvailable}
                    onClick={() => setSelectedSize(size)}
                    className={`h-11 min-w-[44px] rounded-xl text-xs font-bold border transition-all ${
                      !isAvailable
                        ? 'border-white/5 text-slate-600 bg-black/20 cursor-not-allowed line-through'
                        : isSelected
                        ? 'border-royal-blue bg-royal-blue text-white shadow-lg shadow-royal-blue/20'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30'
                    }`}
                  >
                    UK {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">QUANTITY</span>
            <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 text-slate-400 hover:text-white"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 text-sm font-bold text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                className="p-2 text-slate-400 hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-grow flex items-center justify-center gap-2 rounded-xl bg-royal-blue hover:bg-royal-blue-hover px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-royal-blue/20 hover:scale-[1.02]"
              >
                <ShoppingBag className="h-4 w-4" /> ADD TO CART
              </button>
              <button
                onClick={handleToggleWishlist}
                className={`rounded-xl p-4 border transition-all ${
                  inWishlist
                    ? 'bg-red-500/20 border-red-500/50 text-red-500'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Wishlist"
              >
                <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>

            <button
              onClick={handleBuyNow}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.02]"
            >
              BUY NOW WITH 1-CLICK
            </button>
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10 text-[11px] text-slate-400 text-center">
            <div className="flex flex-col items-center gap-1">
              <Truck className="h-4 w-4 text-royal-blue" />
              <span>Free Shipping</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RotateCcw className="h-4 w-4 text-royal-blue" />
              <span>30-Day Returns</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-royal-blue" />
              <span>100% Authentic</span>
            </div>
          </div>
        </div>
      </div>

      {/* LOWER SECTION: TABS (Description, Specifications, Reviews, Shipping & Policies) */}
      <div className="mt-16 border-t border-white/10 pt-10">
        <div className="flex border-b border-white/10 gap-8 text-xs font-bold uppercase tracking-wider overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('desc')}
            className={`pb-4 border-b-2 transition-all ${
              activeTab === 'desc' ? 'border-royal-blue text-royal-blue' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Product Description
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-4 border-b-2 transition-all ${
              activeTab === 'specs' ? 'border-royal-blue text-royal-blue' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Specifications
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 border-b-2 transition-all ${
              activeTab === 'reviews' ? 'border-royal-blue text-royal-blue' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Reviews ({product.reviews?.length || 12})
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`pb-4 border-b-2 transition-all ${
              activeTab === 'policies' ? 'border-royal-blue text-royal-blue' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Shipping & Return Policy
          </button>
        </div>

        <div className="py-6 text-slate-300 text-xs font-light leading-relaxed">
          {activeTab === 'desc' && (
            <div className="space-y-4 max-w-3xl">
              <p>{product.description}</p>
              <p>
                Engineered with reactive sole geometry and high-tensile fabric, {product.name} provides absolute balance whether you are running or making a lifestyle statement.
              </p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-xl space-y-3 border border-white/10 rounded-xl p-4 bg-slate-950">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500 font-semibold">SKU</span>
                <span className="font-bold text-white">{product.sku}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500 font-semibold">Material</span>
                <span className="font-bold text-white">{product.material}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500 font-semibold">Gender</span>
                <span className="font-bold text-white">{product.gender}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-semibold">Stock Availability</span>
                <span className="font-bold text-green-400">{product.stock > 0 ? `${product.stock} units available` : 'Out of Stock'}</span>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Existing Reviews */}
              <div className="lg:col-span-7 space-y-4">
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((rev, i) => (
                    <div key={i} className="glass-card rounded-xl p-4 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{rev.name}</span>
                        <span className="text-[10px] text-slate-500">{rev.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(Math.max(1, Math.min(5, Math.floor(rev.rating || 5))))].map((_, r) => (
                          <Star key={r} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                      <p className="text-xs text-slate-300">{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">No reviews yet. Be the first to leave a review!</p>
                )}
              </div>

              {/* Review Submission Form */}
              <div className="lg:col-span-5 glass-card rounded-2xl p-6 border border-white/10">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">WRITE A REVIEW</h4>
                <form onSubmit={handleAddReview} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aryan Shah"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-royal-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Rating</label>
                    <div className="flex gap-2">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs border ${
                            reviewRating === star
                              ? 'border-royal-blue bg-royal-blue text-white'
                              : 'border-white/10 bg-white/5 text-slate-400'
                          }`}
                        >
                          {star} <Star className="h-3 w-3 fill-current text-amber-400" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Review</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Share your experience with fit, comfort, and style..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-royal-blue focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reviewStatus === 'submitting'}
                    className="w-full rounded-xl bg-royal-blue hover:bg-royal-blue-hover px-4 py-2.5 text-xs font-bold uppercase text-white transition-all flex items-center justify-center gap-2"
                  >
                    {reviewStatus === 'submitting' ? 'Submitting...' : 'Submit Review'} <Send className="h-3.5 w-3.5" />
                  </button>

                  {reviewStatus === 'success' && (
                    <p className="text-xs text-green-400 font-bold text-center">Thank you! Your review is posted.</p>
                  )}
                </form>
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <h4 className="font-bold text-white uppercase tracking-wider mb-1">FREE SHIPPING</h4>
                <p>Standard delivery across India takes 3–5 business days. Free shipping on orders over ₹3,000.</p>
              </div>
              <div>
                <h4 className="font-bold text-white uppercase tracking-wider mb-1">30-DAY EASY RETURNS & EXCHANGES</h4>
                <p>If the fit isn't right, return or exchange unworn items within 30 days of receipt with doorstep pickup.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Floating CTA Bar (Only visible on screens < 640px) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-white/10 p-3 sm:hidden backdrop-blur-md flex items-center justify-between gap-3 shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase text-slate-400 line-clamp-1">{product.name}</span>
          <span className="text-sm font-black text-white">₹{product.price.toLocaleString('en-IN')}</span>
        </div>
        <button
          onClick={handleAddToCart}
          className="flex items-center gap-1.5 rounded-xl bg-royal-blue hover:bg-royal-blue-hover px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-royal-blue/30 active:scale-95 flex-shrink-0"
        >
          <ShoppingBag className="h-4 w-4" /> ADD TO CART
        </button>
      </div>
    </div>
  );
}
