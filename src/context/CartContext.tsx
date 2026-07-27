'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/lib/db';

export interface CartItem {
  product: Product;
  size: number;
  color: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  wishlist: Product[];
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, size: number, color: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: number, color: string) => void;
  updateQuantity: (productId: string, size: number, color: string, quantity: number) => void;
  moveToWishlist: (productId: string, size: number, color: string) => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  clearCart: () => void;
  subtotal: number;
  deliveryCharges: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load cart/wishlist from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('thereal_cart');
      const savedWish = localStorage.getItem('thereal_wishlist');
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedWish) setWishlist(JSON.parse(savedWish));
    } catch (e) {
      console.error('Error loading cart state:', e);
    }
    setLoaded(true);
  }, []);

  // Save to localStorage when cart/wishlist changes
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem('thereal_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart, loaded]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem('thereal_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist, loaded]);

  const addToCart = (product: Product, size: number, color: string, quantity = 1) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.size === size && item.color === color
      );

      if (existingIdx > -1) {
        const nextCart = [...prev];
        nextCart[existingIdx] = {
          ...nextCart[existingIdx],
          quantity: Math.min(product.stock, nextCart[existingIdx].quantity + quantity),
        };
        return nextCart;
      }

      return [...prev, { product, size, color, quantity }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (productId: string, size: number, color: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.size === size && item.color === color))
    );
  };

  const updateQuantity = (productId: string, size: number, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex(
        (item) => item.product.id === productId && item.size === size && item.color === color
      );
      if (idx === -1) return prev;

      const nextCart = [...prev];
      const maxStock = nextCart[idx].product.stock;
      nextCart[idx] = {
        ...nextCart[idx],
        quantity: Math.min(maxStock, quantity),
      };
      return nextCart;
    });
  };

  const moveToWishlist = (productId: string, size: number, color: string) => {
    const item = cart.find(
      (item) => item.product.id === productId && item.size === size && item.color === color
    );
    if (item) {
      addToWishlist(item.product);
      removeFromCart(productId, size, color);
    }
  };

  const addToWishlist = (product: Product) => {
    setWishlist((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((p) => p.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Pricing computations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharges = subtotal > 150 || subtotal === 0 ? 0 : 15;
  const total = subtotal + deliveryCharges;

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        isCartOpen,
        setCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        moveToWishlist,
        addToWishlist,
        removeFromWishlist,
        clearCart,
        subtotal,
        deliveryCharges,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
