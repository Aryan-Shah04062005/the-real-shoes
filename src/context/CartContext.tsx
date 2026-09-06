'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/lib/db';
import { validateCouponAction } from '@/app/actions';

export interface CartItem {
  product: Product;
  size: number;
  color: string;
  quantity: number;
  customizationId?: string;
  customDetails?: {
    upperColor: string;
    soleColor: string;
    laceColor: string;
    logoColor: string;
  };
}

export interface AppliedCoupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
}

interface CartContextType {
  cart: CartItem[];
  wishlist: Product[];
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, size: number, color: string, quantity?: number, customizationId?: string, customDetails?: CartItem['customDetails']) => void;
  removeFromCart: (productId: string, size: number, color: string, customizationId?: string) => void;
  updateQuantity: (productId: string, size: number, color: string, quantity: number, customizationId?: string) => void;
  moveToWishlist: (productId: string, size: number, color: string, customizationId?: string) => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  clearCart: () => void;
  appliedCoupon: AppliedCoupon | null;
  couponError: string | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  subtotal: number;
  discountAmount: number;
  deliveryCharges: number;
  total: number;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  isSizeGuideOpen: boolean;
  setSizeGuideOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isSizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load cart/wishlist/coupon from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('thereal_cart');
      const savedWish = localStorage.getItem('thereal_wishlist');
      const savedCoupon = localStorage.getItem('thereal_coupon');
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedWish) setWishlist(JSON.parse(savedWish));
      if (savedCoupon) setAppliedCoupon(JSON.parse(savedCoupon));
    } catch (e) {
      console.error('Error loading cart state:', e);
    }
    setLoaded(true);
  }, []);

  // Save to localStorage when cart/wishlist/coupon changes
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

  useEffect(() => {
    if (!loaded) return;
    try {
      if (appliedCoupon) {
        localStorage.setItem('thereal_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('thereal_coupon');
      }
    } catch (e) {
      console.error(e);
    }
  }, [appliedCoupon, loaded]);

  const addToCart = (
    product: Product,
    size: number,
    color: string,
    quantity = 1,
    customizationId?: string,
    customDetails?: CartItem['customDetails']
  ) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.size === size &&
          item.color === color &&
          item.customizationId === customizationId
      );

      if (existingIdx > -1) {
        const nextCart = [...prev];
        nextCart[existingIdx] = {
          ...nextCart[existingIdx],
          quantity: Math.min(product.stock || 99, nextCart[existingIdx].quantity + quantity),
        };
        return nextCart;
      }

      return [...prev, { product, size, color, quantity, customizationId, customDetails }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (productId: string, size: number, color: string, customizationId?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.size === size &&
            item.color === color &&
            item.customizationId === customizationId
          )
      )
    );
  };

  const updateQuantity = (
    productId: string,
    size: number,
    color: string,
    quantity: number,
    customizationId?: string
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color, customizationId);
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex(
        (item) =>
          item.product.id === productId &&
          item.size === size &&
          item.color === color &&
          item.customizationId === customizationId
      );
      if (idx === -1) return prev;

      const nextCart = [...prev];
      const maxStock = nextCart[idx].product.stock || 99;
      nextCart[idx] = {
        ...nextCart[idx],
        quantity: Math.min(maxStock, quantity),
      };
      return nextCart;
    });
  };

  const moveToWishlist = (productId: string, size: number, color: string, customizationId?: string) => {
    const item = cart.find(
      (item) =>
        item.product.id === productId &&
        item.size === size &&
        item.color === color &&
        item.customizationId === customizationId
    );
    if (item) {
      addToWishlist(item.product);
      removeFromCart(productId, size, color, customizationId);
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
    setAppliedCoupon(null);
  };

  // Pricing computations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Recalculate applied coupon discount dynamically on subtotal changes
  useEffect(() => {
    if (!appliedCoupon) return;
    if (subtotal <= 0) {
      setAppliedCoupon(null);
      return;
    }
    let calculated = 0;
    if (appliedCoupon.discountType === 'percentage') {
      calculated = Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else {
      calculated = appliedCoupon.discountValue;
    }
    setAppliedCoupon((prev) => (prev ? { ...prev, discountAmount: Math.min(calculated, subtotal) } : null));
  }, [subtotal]);

  const applyCoupon = async (code: string): Promise<boolean> => {
    setCouponError(null);
    if (!code || !code.trim()) {
      setCouponError('Please enter a coupon code.');
      return false;
    }
    const res = await validateCouponAction(code.trim(), subtotal);
    if (!res.valid || !res.coupon) {
      setCouponError(res.error || 'Invalid coupon code.');
      return false;
    }

    setAppliedCoupon({
      code: res.coupon.code,
      discountType: res.coupon.discountType,
      discountValue: res.coupon.discountValue,
      discountAmount: res.discountAmount || 0,
    });
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const deliveryCharges = subtotal > 3000 || subtotal === 0 ? 0 : 99;
  const total = Math.max(0, subtotal - discountAmount + deliveryCharges);

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
        appliedCoupon,
        couponError,
        applyCoupon,
        removeCoupon,
        subtotal,
        discountAmount,
        deliveryCharges,
        total,
        quickViewProduct,
        setQuickViewProduct,
        isSizeGuideOpen,
        setSizeGuideOpen,
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
