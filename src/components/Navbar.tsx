'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Heart, Search, User, Menu, X, ShieldAlert, Package, Sparkles } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const { cart, wishlist, setCartOpen } = useCart();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = () => {
      const match = document.cookie.match(new RegExp('(^| )admin_session=([^;]+)'));
      setIsAdmin(!!(match && match[2] === 'true'));
    };
    checkAdmin();
    window.addEventListener('admin-login-changed', checkAdmin);
    return () => window.removeEventListener('admin-login-changed', checkAdmin);
  }, [pathname]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'New Arrivals', href: '/shop?filter=new' },
    { name: 'Best Sellers', href: '/shop?filter=best' },
    { name: 'Track Order', href: '/track-order' },
    { name: 'About Us', href: '/#about' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-premium-black/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="bg-gradient-to-r from-white via-slate-300 to-royal-blue bg-clip-text text-2xl font-black tracking-widest text-transparent group-hover:glow-text transition-all">
                  THE REAL
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-xs font-semibold uppercase tracking-wider transition-colors hover:text-royal-blue ${
                    pathname === link.href ? 'text-royal-blue' : 'text-slate-300'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Search Trigger */}
              <button
                onClick={() => setSearchOpen(true)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                title="Search Products"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist Link */}
              <Link
                href="/shop?filter=wishlist"
                className="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                title="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart Toggle */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                title="Open Cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {cart.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-royal-blue text-[9px] font-bold text-white animate-pulse">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>

              {/* Customer Account / Admin Portal */}
              <Link
                href="/account"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                title="My Account"
              >
                <User className="h-5 w-5" />
              </Link>

              {/* Admin Portal Link for Desktop & Mac browsers */}
              <Link
                href={isAdmin ? "/admin/dashboard" : "/admin/login"}
                className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  isAdmin
                    ? 'border-red-500/40 bg-red-500/15 text-red-400 hover:bg-red-500/25'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-royal-blue/40 hover:text-white hover:bg-white/10'
                }`}
                title={isAdmin ? "Admin Dashboard" : "Admin Login Portal"}
              >
                <ShieldAlert className={`h-3.5 w-3.5 ${isAdmin ? 'text-red-400' : 'text-slate-400'}`} />
                <span>{isAdmin ? 'ADMIN' : 'ADMIN'}</span>
              </Link>

              {/* Mobile Hamburger menu */}
              <button
                onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white md:hidden transition-all"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="border-t border-white/10 bg-premium-black md:hidden">
            <div className="space-y-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-3 text-sm font-semibold tracking-wider text-slate-300 hover:bg-white/5 hover:text-royal-blue uppercase transition-all"
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold tracking-wider text-slate-300 hover:bg-white/5 hover:text-royal-blue uppercase transition-all"
              >
                My Account
              </Link>
              {isAdmin ? (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-bold text-red-400 hover:bg-white/5 uppercase transition-all"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              ) : (
                <Link
                  href="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 uppercase transition-all"
                >
                  <User className="h-4 w-4" />
                  Admin Portal
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Global Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-24 backdrop-blur-md">
          <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <form onSubmit={handleSearchSubmit}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-royal-blue mb-2">Search THE REAL</h3>
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search sneakers, e.g. Black, Running, Genesis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-12 pr-4 py-3 text-sm text-white focus:border-royal-blue focus:outline-none"
                />
              </div>
              {/* Quick suggestions */}
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="text-slate-500 font-semibold">Popular Searches:</span>
                {['Running', 'Genesis', 'Puma', 'Black', 'Lifestyle'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setSearchQuery(term);
                      setSearchOpen(false);
                      router.push(`/shop?search=${encodeURIComponent(term)}`);
                    }}
                    className="rounded-full bg-white/5 border border-white/10 hover:border-royal-blue px-3 py-1 text-slate-300 hover:text-white transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
