'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/db';
import { useCart } from '@/context/CartContext';
import SneakerCanvas from '@/components/SneakerCanvas';
import { addProductReviewAction } from '@/app/actions';
import { Star, Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, Plus, Minus, Send, Check } from 'lucide-react';
import Link from 'next/link';

interface ProductDetailsClientProps {
  product: Product;
}

export default function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const { addToCart, wishlist, addToWishlist, removeFromWishlist } = useCart();

  // Active configurations
  const [selectedSize, setSelectedSize] = useState<number>(product.availableSizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.availableColors[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'policies'>('desc');
  const [viewMode, setViewMode] = useState<'3d' | 'image'>(product.mainImage?.startsWith('http') ? 'image' : '3d');

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

  const handleAddToCart = () => {
    if (product.stock === 0) return;
    addToCart(product, selectedSize, selectedColor.name, quantity);
  };

  const handleBuyNow = () => {
    if (product.stock === 0) return;
    addToCart(product, selectedSize, selectedColor.name, quantity);
    window.location.href = '/checkout';
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewStatus('submitting');
    
    const res = await addProductReviewAction(product.id, {
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

  const hasDiscount = product.discountPercentage > 0;

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Backdrops */}
      <div className="glow-blue top-[10%] left-[-200px]" />
      <div className="glow-silver top-[40%] right-[-200px]" />

      {/* Breadcrumb navigation */}
      <div className="text-xs text-slate-500 mb-8 uppercase tracking-widest">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-white transition-colors">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-royal-blue font-bold">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* LEFT COLUMN: 3D Studio Visualizer */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="h-[400px] sm:h-[500px] w-full relative">
            {/* View Mode Toggle Buttons */}
            {product.mainImage?.startsWith('http') && (
              <div className="absolute top-4 left-4 z-20 flex gap-2">
                <button
                  onClick={() => setViewMode('image')}
                  className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                    viewMode === 'image'
                      ? 'bg-royal-blue border-royal-blue text-white shadow-md shadow-royal-blue/20'
                      : 'bg-premium-dark/85 border-white/10 text-slate-400 hover:text-white backdrop-blur-sm'
                  }`}
                >
                  Real Photo
                </button>
                <button
                  onClick={() => setViewMode('3d')}
                  className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                    viewMode === '3d'
                      ? 'bg-royal-blue border-royal-blue text-white shadow-md shadow-royal-blue/20'
                      : 'bg-premium-dark/85 border-white/10 text-slate-400 hover:text-white backdrop-blur-sm'
                  }`}
                >
                  3D Customizer
                </button>
              </div>
            )}

            {viewMode === '3d' ? (
              <SneakerCanvas
                color={selectedColor.threeColor}
                size={selectedSize}
                autoRotate={false}
                hover={true}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950/80 rounded-2xl border border-white/5 overflow-hidden p-6 relative">
                <div
                  className="absolute inset-0 opacity-5"
                  style={{ backgroundColor: selectedColor.hex }}
                />
                <img
                  src={product.mainImage}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-500 z-10"
                />
              </div>
            )}
          </div>

          {/* Quick Specifications Strip */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl border border-white/5 bg-premium-dark/30 p-3 flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Category</span>
              <span className="text-xs font-semibold text-white mt-1">{product.category}</span>
            </div>
            <div className="rounded-xl border border-white/5 bg-premium-dark/30 p-3 flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Material</span>
              <span className="text-xs font-semibold text-white mt-1 truncate" title={product.material}>
                {product.material}
              </span>
            </div>
            <div className="rounded-xl border border-white/5 bg-premium-dark/30 p-3 flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">SKU ID</span>
              <span className="text-xs font-semibold text-royal-blue mt-1">{product.sku}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Info & Configurator */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {product.brand} &bull; {product.gender}
              </span>
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-bold text-white">{product.rating}</span>
                <span className="text-xs text-slate-500">({product.reviews.length} reviews)</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2 uppercase">
              {product.name}
            </h1>
            
            {/* Price list */}
            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-2xl font-black text-royal-blue">₹{product.price}</span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-slate-500 line-through">₹{product.originalPrice}</span>
                  <span className="rounded bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-500 uppercase tracking-wider">
                    Save {product.discountPercentage}%
                  </span>
                </>
              )}
            </div>
          </div>

          <hr className="border-white/10" />

          {/* COLOR PICKER */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Colorway</h4>
              <span className="text-xs font-bold text-white uppercase">{selectedColor.name}</span>
            </div>
            <div className="flex gap-4">
              {product.availableColors.map((colorway) => (
                <button
                  key={colorway.name}
                  onClick={() => setSelectedColor(colorway)}
                  className={`group relative flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                    selectedColor.name === colorway.name ? 'border-royal-blue scale-110 shadow-lg shadow-royal-blue/30' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="h-6 w-6 rounded-full" style={{ backgroundColor: colorway.hex }} />
                </button>
              ))}
            </div>
          </div>

          {/* SIZE PICKER */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Size (US)</h4>
              <span className="text-xs font-bold text-white">Scale: {selectedSize}</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {product.availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`rounded-lg border py-2.5 text-xs font-semibold transition-all ${
                    selectedSize === size
                      ? 'border-royal-blue bg-royal-blue text-white shadow-md shadow-royal-blue/25'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* QUANTITY PICKER & STOCK STATUS */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quantity</h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-semibold text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="p-3 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Stock indicator */}
              <div>
                {product.stock === 0 ? (
                  <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Out of Stock</span>
                ) : product.stock <= 5 ? (
                  <span className="text-xs font-bold text-orange-500 uppercase tracking-wider animate-pulse">
                    Only {product.stock} items remaining
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {product.stock} units available
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-royal-blue bg-royal-blue/10 hover:bg-royal-blue/20 py-4 text-xs font-bold uppercase tracking-widest text-royal-blue transition-all disabled:opacity-30 disabled:pointer-events-none hover:scale-[1.02]"
            >
              <ShoppingBag className="h-4 w-4" />
              ADD TO CART
            </button>
            
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-royal-blue hover:bg-royal-blue-hover py-4 text-xs font-bold uppercase tracking-widest text-white transition-all disabled:opacity-30 disabled:pointer-events-none hover:scale-[1.02] shadow-lg shadow-royal-blue/20"
            >
              BUY NOW
            </button>

            <button
              onClick={handleToggleWishlist}
              className={`rounded-xl border p-4 transition-all hover:scale-105 ${
                inWishlist
                  ? 'border-red-500 bg-red-500/10 text-red-500'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20'
              }`}
              title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-left">
            <div className="flex items-center gap-2 text-slate-400">
              <Truck className="h-4 w-4 text-royal-blue flex-shrink-0" />
              <span className="text-[10px] leading-tight">Free shipping over ₹10,000</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <RotateCcw className="h-4 w-4 text-royal-blue flex-shrink-0" />
              <span className="text-[10px] leading-tight">30-day hassle returns</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="h-4 w-4 text-royal-blue flex-shrink-0" />
              <span className="text-[10px] leading-tight">Aryan Shah Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL TABS */}
      <div className="mt-20 border-t border-white/10 pt-10">
        <div className="flex border-b border-white/10 space-x-8">
          {[
            { id: 'desc', name: 'Description' },
            { id: 'specs', name: 'Specifications' },
            { id: 'policies', name: 'Shipping & Returns' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-royal-blue text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="py-6 min-h-[120px] text-left">
          {activeTab === 'desc' && (
            <p className="text-sm text-slate-400 leading-relaxed font-light max-w-3xl">
              {product.description}
            </p>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-md grid grid-cols-2 gap-y-3 text-xs">
              <div className="text-slate-500 uppercase tracking-widest font-semibold">SKU Code</div>
              <div className="text-white font-medium">{product.sku}</div>

              <div className="text-slate-500 uppercase tracking-widest font-semibold">Category</div>
              <div className="text-white font-medium">{product.category}</div>

              <div className="text-slate-500 uppercase tracking-widest font-semibold">Material</div>
              <div className="text-white font-medium">{product.material}</div>

              <div className="text-slate-500 uppercase tracking-widest font-semibold">Gender</div>
              <div className="text-white font-medium">{product.gender}</div>

              <div className="text-slate-500 uppercase tracking-widest font-semibold">Stock Quantity</div>
              <div className="text-white font-medium">{product.stock} units</div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-4 max-w-3xl text-sm text-slate-400 font-light leading-relaxed">
              <p>
                <strong>Premium Shipping:</strong> We offer free standard shipping on all items over ₹10,000. Orders are dispatched from Mumbai headquarters within 24-48 hours and typically arrive at your delivery address within 3 to 5 business days.
              </p>
              <p>
                <strong>30-Day Returns:</strong> Returns are accepted within 30 days of package receipt. The product must be unworn, undamaged, in its original premium box, and accompanied by the order confirmation record.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* REVIEWS SECTION */}
      <div className="mt-16 border-t border-white/10 pt-10">
        <h2 className="text-xl font-black tracking-wider text-white uppercase mb-8">
          Customer Reviews ({product.reviews.length})
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Write a Review Form */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-premium-dark/40 p-6 backdrop-blur-md">
              <h3 className="text-sm font-bold tracking-wider text-white uppercase mb-4">Write a Review</h3>
              
              {reviewStatus === 'success' ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-green-400 space-y-2">
                  <Check className="h-8 w-8 rounded-full border border-green-500/30 bg-green-500/10 p-1.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Review Submitted!</span>
                  <p className="text-[11px] text-slate-400">Thank you for sharing your feedback with the community.</p>
                </div>
              ) : (
                <form onSubmit={handleAddReview} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aryan Shah"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-royal-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                      Rating (1-5 Stars)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="text-slate-500 hover:text-amber-400 transition-colors"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                      Review Comments
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Share your experience wearing this shoe..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-royal-blue focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reviewStatus === 'submitting'}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-royal-blue hover:bg-royal-blue-hover py-3 text-xs font-bold uppercase tracking-wider text-white transition-all disabled:opacity-50"
                  >
                    Submit Review
                    <Send className="h-3 w-3" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-7 space-y-6 max-h-[450px] overflow-y-auto pr-2">
            {product.reviews.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs italic">
                No reviews yet. Be the first to share your experience!
              </div>
            ) : (
              product.reviews.map((review, idx) => (
                <div key={idx} className="border-b border-white/5 pb-4 last:border-0 last:pb-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{review.name}</span>
                    <span className="text-[10px] text-slate-500">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-400 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < review.rating ? 'fill-current' : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-light leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
