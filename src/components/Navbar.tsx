'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Heart, Search, User, Menu, X, ShieldAlert, LogOut, Info } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { cart, wishlist, setCartOpen } = useCart();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();

  // Check admin session locally just for showing Admin indicators
  useEffect(() => {
    // Read from cookies/localStorage to display logout button in header if logged in
    const checkAdmin = () => {
      const match = document.cookie.match(new RegExp('(^| )admin_session=([^;]+)'));
      setIsAdmin(!!(match && match[2] === 'true'));
    };
    checkAdmin();
    
    // Listen for custom event or navigation
    window.addEventListener('admin-login-changed', checkAdmin);
    return () => window.removeEventListener('admin-login-changed', checkAdmin);
  }, [pathname]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'New Arrivals', href: '/shop?filter=new' },
    { name: 'Best Sellers', href: '/shop?filter=best' },
    { name: 'About Us', href: '/#about' },
    { name: 'Contact', href: '/#contact' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-premium-black/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="bg-gradient-to-r from-white via-slate-400 to-royal-blue bg-clip-text text-2xl font-black tracking-widest text-transparent group-hover:glow-text transition-all">
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
            <div className="flex items-center space-x-4">
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

              {/* Admin Portal / Indicator */}
              {isAdmin ? (
                <Link
                  href="/admin/dashboard"
                  className="hidden sm:flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  DASHBOARD
                </Link>
              ) : (
                <Link
                  href="/admin/login"
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                  title="Admin Portal"
                >
                  <User className="h-5 w-5" />
                </Link>
              )}

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

        {/* Mobile Navigation Panel */}
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
              
              {/* Admin Dashboard on mobile */}
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
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Global Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-24 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-premium-black p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-sm font-bold tracking-wider text-slate-400">SEARCH PRODUCTS</span>
              <button
                onClick={() => setSearchOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  setSearchOpen(false);
                  window.location.href = `/shop?q=${encodeURIComponent(searchQuery)}`;
                }
              }}
              className="mt-6"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by shoe name, brand, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:border-royal-blue focus:outline-none focus:ring-1 focus:ring-royal-blue transition-all"
                />
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-royal-blue hover:bg-royal-blue-hover px-6 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
