'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Product } from '@/lib/db';
import Link from 'next/link';
import { SlidersHorizontal, Search, Star, X, ArrowUpDown, Compass, Heart, ArrowRight } from 'lucide-react';

interface ShopClientProps {
  initialProducts: Product[];
}

export default function ShopClient({ initialProducts }: { initialProducts: Product[] }) {
  const searchParams = useSearchParams();
  const { wishlist, addToWishlist, removeFromWishlist } = useCart();

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(30000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  
  // Sort State
  const [sortBy, setSortBy] = useState<string>('newest');

  // Load URL parameters on mount
  useEffect(() => {
    const q = searchParams.get('q');
    const filter = searchParams.get('filter');
    const cat = searchParams.get('category');

    if (q) setSearchQuery(q);
    if (cat) setSelectedCategories([cat]);
    
    if (filter === 'new') {
      setSortBy('newest');
    } else if (filter === 'best') {
      setSortBy('best-selling');
    } else if (filter === 'wishlist') {
      setSortBy('wishlist');
    }
  }, [searchParams]);

  // Extract unique attributes from initialProducts for filters
  const uniqueCategories = useMemo(() => Array.from(new Set(initialProducts.map((p) => p.category))), [initialProducts]);
  const uniqueGenders = useMemo(() => Array.from(new Set(initialProducts.map((p) => p.gender))), [initialProducts]);
  const allSizes = [6, 7, 8, 9, 10, 11, 12];
  
  // Standard colors matching database entries
  const filterColors = [
    { name: 'Royal Blue', hex: '#0a58ca' },
    { name: 'Silver Shadow', hex: '#cbd5e1' },
    { name: 'Carbon Black', hex: '#111827' }
  ];

  // Process search, filters, and sorting
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // 1. URL-specific/Wishlist filter
    if (sortBy === 'wishlist') {
      return result.filter((p) => wishlist.some((w) => w.id === p.id));
    }

    // 2. Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    // 3. Category Filter
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }

    // 4. Gender Filter
    if (selectedGenders.length > 0) {
      result = result.filter((p) => selectedGenders.includes(p.gender));
    }

    // 5. Size Filter
    if (selectedSizes.length > 0) {
      result = result.filter((p) => p.availableSizes.some((s) => selectedSizes.includes(s)));
    }

    // 6. Color Filter
    if (selectedColors.length > 0) {
      result = result.filter((p) => p.availableColors.some((c) => selectedColors.includes(c.name)));
    }

    // 7. Price Filter
    result = result.filter((p) => p.price <= maxPrice);

    // 8. Stock Filter
    if (inStockOnly) {
      result = result.filter((p) => p.stock > 0);
    }

    // 9. Rating Filter
    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    // 10. Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'highest-rated') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      // Sort new arrivals first, or mock by SKU sequence
      result.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    } else if (sortBy === 'best-selling') {
      result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    } else if (sortBy === 'discount') {
      result.sort((a, b) => b.discountPercentage - a.discountPercentage);
    }

    return result;
  }, [initialProducts, searchQuery, selectedCategories, selectedGenders, selectedSizes, selectedColors, maxPrice, inStockOnly, minRating, sortBy, wishlist]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const toggleGender = (gen: string) => {
    setSelectedGenders((prev) => (prev.includes(gen) ? prev.filter((g) => g !== gen) : [...prev, gen]));
  };

  const toggleSize = (size: number) => {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  };

  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) => (prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]));
  };

  const isProductInWishlist = (productId: string) => wishlist.some((w) => w.id === productId);

  const toggleWishlist = (product: Product) => {
    if (isProductInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedGenders([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setMaxPrice(30000);
    setInStockOnly(false);
    setMinRating(0);
    setSortBy('newest');
  };

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Glow Backdrops */}
      <div className="glow-blue top-[10%] left-[-200px]" />
      <div className="glow-silver top-[50%] right-[-200px]" />

      {/* Header segment */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/10 pb-8 gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-royal-blue">SHOP CATALOG</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mt-1 uppercase">
            {sortBy === 'wishlist' ? 'YOUR WISHLIST' : 'EXPLORE SNEAKERS'}
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-light">
            Showing {filteredProducts.length} of {initialProducts.length} premium models
          </p>
        </div>

        {/* Search Input on Shop Page */}
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search name, brand, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-xs text-white focus:border-royal-blue focus:outline-none focus:ring-1 focus:ring-royal-blue transition-all"
          />
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* FILTERS SIDEBAR */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="flex items-center gap-2 text-sm font-bold tracking-wider text-white">
                <SlidersHorizontal className="h-4 w-4 text-royal-blue" />
                FILTERS
              </span>
              <button
                onClick={resetFilters}
                className="text-[10px] font-bold text-slate-500 hover:text-royal-blue uppercase transition-colors"
              >
                Reset All
              </button>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</h4>
              <div className="space-y-2">
                {uniqueCategories.map((cat) => (
                  <label key={cat} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="h-4 w-4 rounded border-white/10 bg-white/5 text-royal-blue focus:ring-0"
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-3 border-t border-white/5 pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gender</h4>
              <div className="space-y-2">
                {uniqueGenders.map((gen) => (
                  <label key={gen} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGenders.includes(gen)}
                      onChange={() => toggleGender(gen)}
                      className="h-4 w-4 rounded border-white/10 bg-white/5 text-royal-blue focus:ring-0"
                    />
                    {gen}
                  </label>
                ))}
              </div>
            </div>

            {/* Price Slider */}
            <div className="space-y-3 border-t border-white/5 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Max Price</h4>
                <span className="text-xs font-bold text-royal-blue">₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="30000"
                step="1000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-royal-blue cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>₹5,000</span>
                <span>₹30,000</span>
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-3 border-t border-white/5 pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sizes (US)</h4>
              <div className="grid grid-cols-4 gap-2">
                {allSizes.map((size) => {
                  const active = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`rounded-lg border py-2 text-xs font-semibold tracking-wide transition-all ${
                        active
                          ? 'border-royal-blue bg-royal-blue text-white shadow-md shadow-royal-blue/20'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-3 border-t border-white/5 pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Colorway</h4>
              <div className="flex flex-wrap gap-3">
                {filterColors.map((color) => {
                  const active = selectedColors.includes(color.name);
                  return (
                    <button
                      key={color.name}
                      onClick={() => toggleColor(color.name)}
                      className={`group relative flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                        active ? 'border-royal-blue scale-110 shadow-md shadow-royal-blue/20' : 'border-white/10 hover:border-white/30'
                      }`}
                      title={color.name}
                    >
                      <span className="h-5 w-5 rounded-full" style={{ backgroundColor: color.hex }} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Star Rating */}
            <div className="space-y-3 border-t border-white/5 pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Minimum Rating</h4>
              <div className="space-y-2">
                {[4.8, 4.5, 4.0].map((rating) => (
                  <label key={rating} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="minRating"
                      checked={minRating === rating}
                      onChange={() => setMinRating(rating)}
                      className="h-4 w-4 border-white/10 bg-white/5 text-royal-blue focus:ring-0"
                    />
                    <span className="flex items-center gap-1 text-slate-300">
                      {rating}+ <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>
                  </label>
                ))}
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="minRating"
                    checked={minRating === 0}
                    onChange={() => setMinRating(0)}
                    className="h-4 w-4 border-white/10 bg-white/5 text-royal-blue focus:ring-0"
                  />
                  All Ratings
                </label>
              </div>
            </div>

            {/* In Stock toggle */}
            <div className="border-t border-white/5 pt-4">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-white/5 text-royal-blue focus:ring-0"
                />
                In Stock Only
              </label>
            </div>
          </div>
        </div>

        {/* PRODUCTS LIST GRID */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Sort Panel */}
          <div className="flex items-center justify-between border border-white/10 bg-premium-dark/40 px-6 py-4 rounded-2xl backdrop-blur-md">
            <span className="text-xs text-slate-400 font-light">
              Showing <strong className="text-white font-semibold">{filteredProducts.length}</strong> items
            </span>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-0 text-xs font-semibold text-slate-300 focus:outline-none focus:ring-0 cursor-pointer hover:text-white uppercase transition-colors"
              >
                <option value="newest" className="bg-premium-black">Newest Arrivals</option>
                <option value="best-selling" className="bg-premium-black">Best Sellers</option>
                <option value="price-low" className="bg-premium-black">Price: Low to High</option>
                <option value="price-high" className="bg-premium-black">Price: High to Low</option>
                <option value="highest-rated" className="bg-premium-black">Highest Rated</option>
                <option value="discount" className="bg-premium-black">Biggest Sale</option>
                <option value="wishlist" className="bg-premium-black">My Wishlist</option>
              </select>
            </div>
          </div>

          {/* Grid list */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 border border-white/10 bg-premium-dark/20 rounded-2xl p-6">
              <Compass className="h-12 w-12 text-slate-600 mb-4 animate-bounce" />
              <h3 className="text-lg font-bold text-white uppercase">No items match filters</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm font-light">
                Try widening your price range, selecting different sizes, or resetting your filter choices to explore our models.
              </p>
              <button
                onClick={resetFilters}
                className="mt-6 rounded-full bg-royal-blue hover:bg-royal-blue-hover px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-lg shadow-royal-blue/20"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const inWishlist = isProductInWishlist(product.id);
                const hasDiscount = product.discountPercentage > 0;
                return (
                  <div
                    key={product.id}
                    className="glass-card flex flex-col justify-between rounded-2xl overflow-hidden p-4 relative group"
                  >
                    {/* Floating Wishlist Button */}
                    <button
                      onClick={() => toggleWishlist(product)}
                      className={`absolute top-4 right-4 z-20 rounded-lg p-2 transition-all ${
                        inWishlist
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : 'bg-black/40 border border-white/10 text-slate-400 hover:text-white'
                      }`}
                      title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    >
                      <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
                    </button>

                    {/* Badges container */}
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                      {product.stock === 0 && (
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 border border-white/5">
                          OUT OF STOCK
                        </span>
                      )}
                      {product.stock > 0 && product.stock <= 5 && (
                        <span className="rounded bg-orange-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white animate-pulse">
                          LOW STOCK
                        </span>
                      )}
                      {product.isNewArrival && (
                        <span className="rounded bg-royal-blue px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                          NEW
                        </span>
                      )}
                      {product.isBestSeller && (
                        <span className="rounded bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                          BEST
                        </span>
                      )}
                      {product.isSale && (
                        <span className="rounded bg-red-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                          SALE -{product.discountPercentage}%
                        </span>
                      )}
                    </div>

                    {/* Image Area */}
                    <div className="relative h-56 w-full rounded-xl bg-gradient-to-br from-slate-900 to-slate-950/80 flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-white/15 transition-all">
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{ backgroundColor: product.availableColors[0].hex }}
                      />
                      <div
                        className="h-20 w-20 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-all group-hover:scale-125"
                        style={{ backgroundColor: product.availableColors[0].hex }}
                      />
                      {product.mainImage?.startsWith('http') ? (
                        <img
                          src={product.mainImage}
                          alt={product.name}
                          className="z-10 h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <span className="z-10 text-xs font-bold text-white uppercase text-center px-4 tracking-wide group-hover:scale-105 transition-transform duration-300">
                          {product.name}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="mt-4 flex flex-col justify-between flex-grow">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{product.brand}</span>
                          <div className="flex items-center gap-0.5 text-amber-400">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-[11px] font-bold">{product.rating}</span>
                          </div>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1 group-hover:text-royal-blue transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 font-light">{product.description}</p>
                      </div>

                      <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-white">₹{product.price}</span>
                          {hasDiscount && (
                            <span className="text-xs text-slate-500 line-through">₹{product.originalPrice}</span>
                          )}
                        </div>

                        <Link
                          href={`/product/${product.id}`}
                          className="rounded-lg bg-white/5 border border-white/10 group-hover:bg-royal-blue group-hover:border-royal-blue px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-200 group-hover:text-white transition-all flex items-center gap-1 hover:scale-105"
                        >
                          Customize
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
