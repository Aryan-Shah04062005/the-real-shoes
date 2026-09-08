'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Product } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import QuickViewModal from '@/components/QuickViewModal';
import SizeGuideModal from '@/components/SizeGuideModal';
import { SlidersHorizontal, Search, Star, X, ArrowUpDown, Filter, RotateCcw } from 'lucide-react';

interface ShopClientProps {
  initialProducts: Product[];
}

export default function ShopClient({ initialProducts }: ShopClientProps) {
  const searchParams = useSearchParams();
  const { wishlist } = useCart();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(30000);
  const [under2kOnly, setUnder2kOnly] = useState<boolean>(false);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [minDiscount, setMinDiscount] = useState<number>(0);

  // Sort state
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Sync URL query params
  useEffect(() => {
    const search = searchParams.get('search') || searchParams.get('q');
    const filter = searchParams.get('filter');
    const cat = searchParams.get('category');

    if (search) setSearchQuery(search);
    if (cat) setSelectedCategory(cat);

    if (filter === 'new') {
      setSortBy('newest');
    } else if (filter === 'best') {
      setSortBy('popular');
    } else if (filter === 'wishlist') {
      setSortBy('wishlist');
    } else if (filter === 'under2k') {
      setUnder2kOnly(true);
    }
  }, [searchParams]);

  // Unique attributes for filters
  const uniqueCategories = useMemo(() => ['All', ...Array.from(new Set(initialProducts.map((p) => p.category).filter(Boolean)))], [initialProducts]);
  const uniqueBrands = useMemo(() => ['All', ...Array.from(new Set(initialProducts.map((p) => p.brand).filter(Boolean)))], [initialProducts]);
  const availableSizes = [6, 7, 8, 9, 10, 11, 12];
  const filterColors = ['Royal Blue', 'Silver Shadow', 'Carbon Black', 'Red', 'White'];

  // Filter & Sort computation
  const filteredProducts = useMemo(() => {
    let result = initialProducts.filter(
      (p) => !p.status || p.status === 'ACTIVE' || p.status === 'OUT_OF_STOCK'
    );

    // Wishlist view
    if (sortBy === 'wishlist') {
      return result.filter((p) => wishlist.some((w) => w.id === p.id));
    }

    // Search Query
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

    // Category
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Brand
    if (selectedBrand !== 'All') {
      result = result.filter((p) => p.brand.toLowerCase() === selectedBrand.toLowerCase());
    }

    // Under 2000 Filter
    if (under2kOnly) {
      result = result.filter((p) => p.price <= 2000);
    }

    // Price Max
    result = result.filter((p) => p.price <= maxPrice);

    // In Stock Only
    if (inStockOnly) {
      result = result.filter((p) => p.stock > 0);
    }

    // Min Rating
    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    // Min Discount
    if (minDiscount > 0) {
      result = result.filter((p) => p.discountPercentage >= minDiscount);
    }

    // Size Filter
    if (selectedSizes.length > 0) {
      result = result.filter((p) => p.availableSizes.some((s) => selectedSizes.includes(s)));
    }

    // Color Filter
    if (selectedColors.length > 0) {
      result = result.filter((p) =>
        p.availableColors?.some((c) => selectedColors.map((sc) => sc.toLowerCase()).includes(c.name.toLowerCase()))
      );
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        return result.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
      case 'popular':
        return result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
      case 'price-asc':
        return result.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return result.sort((a, b) => b.price - a.price);
      case 'rating-desc':
        return result.sort((a, b) => b.rating - a.rating);
      default: // 'featured'
        return result;
    }
  }, [
    initialProducts,
    searchQuery,
    selectedCategory,
    selectedBrand,
    selectedSizes,
    selectedColors,
    maxPrice,
    under2kOnly,
    inStockOnly,
    minRating,
    minDiscount,
    sortBy,
    wishlist,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedBrand('All');
    setSelectedSizes([]);
    setSelectedColors([]);
    setMaxPrice(30000);
    setUnder2kOnly(false);
    setInStockOnly(false);
    setMinRating(0);
    setMinDiscount(0);
    setSortBy('featured');
  };

  const toggleSize = (size: number) => {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) => (prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]));
  };

  return (
    <div className="relative w-full min-h-screen bg-premium-black text-premium-light py-10 px-4 sm:px-6 lg:px-8">
      <QuickViewModal />
      <SizeGuideModal />

      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Title Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-royal-blue block">SNEAKER CATALOG</span>
            <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
              {sortBy === 'wishlist' ? 'MY WISHLIST' : 'EXPLORE COLLECTION'}
            </h1>
            <p className="text-xs text-slate-400 font-light mt-1">
              Showing {filteredProducts.length} items out of {initialProducts.length} sneakers
            </p>
          </div>

          {/* Quick Category Chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'All Shoes', val: 'All' },
              { label: 'Sneakers', val: 'Sneakers' },
              { label: 'Running', val: 'Running' },
              { label: 'Lifestyle', val: 'Lifestyle' },
              { label: 'Under ₹2,000', val: 'under2k' },
            ].map((chip) => {
              const isActive = chip.val === 'under2k' ? under2kOnly : selectedCategory === chip.val;
              return (
                <button
                  key={chip.label}
                  onClick={() => {
                    if (chip.val === 'under2k') {
                      setUnder2kOnly(!under2kOnly);
                    } else {
                      setSelectedCategory(chip.val);
                    }
                  }}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border ${
                    isActive
                      ? 'bg-royal-blue border-royal-blue text-white shadow-md shadow-royal-blue/20'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar: Search, Mobile Filter Toggle, Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-white/10">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, brand, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-slate-400 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Mobile Filter Trigger */}
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 md:hidden hover:text-white"
            >
              <SlidersHorizontal className="h-4 w-4 text-royal-blue" />
              Filters
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-slate-400 hidden sm:block" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:border-royal-blue focus:outline-none"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="newest">Sort by: Newest</option>
                <option value="popular">Sort by: Popularity</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-desc">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content Grid: Sidebar Filters + Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Desktop & Mobile Filter Sidebar Drawer */}
          <aside
            className={`space-y-6 glass-card p-6 rounded-2xl border border-white/10 ${
              isMobileFilterOpen
                ? 'fixed inset-x-0 bottom-0 top-16 z-50 overflow-y-auto bg-slate-950/95 p-6 rounded-t-3xl border-t border-white/20 md:relative md:top-0 md:z-auto md:bg-transparent md:p-6 md:rounded-2xl md:border-white/10 block'
                : 'hidden md:block'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-royal-blue" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">FILTERS</h3>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={resetFilters} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors">
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="md:hidden rounded-full p-1 text-slate-400 hover:text-white bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-royal-blue focus:outline-none"
              >
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">Brand</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-royal-blue focus:outline-none"
              >
                {uniqueBrands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-bold uppercase tracking-wider text-slate-300">Max Price</span>
                <span className="font-bold text-royal-blue">₹{maxPrice.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={1000}
                max={30000}
                step={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-royal-blue bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Size Filter Pills */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">Available Sizes (UK)</label>
              <div className="flex flex-wrap gap-1.5">
                {availableSizes.map((sz) => {
                  const isSel = selectedSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      onClick={() => toggleSize(sz)}
                      className={`h-9 min-w-[36px] rounded-lg text-xs font-bold border transition-all ${
                        isSel
                          ? 'border-royal-blue bg-royal-blue text-white shadow-md'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Filter */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">Colorways</label>
              <div className="flex flex-wrap gap-2">
                {filterColors.map((col) => {
                  const isSel = selectedColors.includes(col);
                  return (
                    <button
                      key={col}
                      onClick={() => toggleColor(col)}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-all ${
                        isSel
                          ? 'border-royal-blue bg-royal-blue/20 text-white'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {col}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minimum Rating */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">Minimum Rating</label>
              <div className="flex gap-2">
                {[0, 4, 4.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setMinRating(rate)}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold border transition-all ${
                      minRating === rate
                        ? 'border-royal-blue bg-royal-blue text-white'
                        : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    {rate === 0 ? 'All' : `${rate}+`} <Star className="h-3 w-3 fill-current text-amber-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 py-1">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-white/10 bg-white/5 accent-royal-blue h-4 w-4"
                />
                In Stock Only
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 py-1">
                <input
                  type="checkbox"
                  checked={under2kOnly}
                  onChange={(e) => setUnder2kOnly(e.target.checked)}
                  className="rounded border-white/10 bg-white/5 accent-royal-blue h-4 w-4"
                />
                Under ₹2,000
              </label>
            </div>

            {/* Apply Filters Mobile Button */}
            {isMobileFilterOpen && (
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full mt-4 rounded-xl bg-royal-blue hover:bg-royal-blue-hover py-3 text-xs font-bold uppercase tracking-widest text-white md:hidden shadow-lg shadow-royal-blue/30"
              >
                APPLY & VIEW ({filteredProducts.length} SNEAKERS)
              </button>
            )}
          </aside>

          {/* Product Grid */}
          <main className="md:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center space-y-4 border border-white/10">
                <h3 className="text-xl font-bold text-white uppercase">No Sneakers Found</h3>
                <p className="text-xs text-slate-400 font-light">
                  Try clearing some filters or searching for another term.
                </p>
                <button
                  onClick={resetFilters}
                  className="rounded-full bg-royal-blue px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-royal-blue-hover transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
