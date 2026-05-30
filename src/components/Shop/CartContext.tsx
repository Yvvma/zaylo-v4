import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Product, ProductVariant } from '../../data/products';

export type CartItem = Product & {
  quantity: number;
  selectedVariantImage?: string;
  selectedVariantColor?: string;
  selectedVariantSku?: string;
  selectedSize?: string;
};

export function getCartLineKey(
  productId: number,
  variantSku?: string,
  size?: string
): string {
  const parts = [String(productId)];
  if (variantSku) parts.push(variantSku);
  if (size) parts.push(size);
  return parts.join('-');
}

export function getCartLineKeyFromItem(item: CartItem): string {
  return getCartLineKey(item.id, item.selectedVariantSku, item.selectedSize);
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, selectedVariant?: ProductVariant, quantity?: number, selectedSize?: string) => void;
  removeFromCart: (id: number, variantSku?: string, selectedSize?: string) => void;
  updateQuantity: (id: number, newQuantity: number, variantSku?: string, selectedSize?: string) => void;
  clearCart: () => void;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const globalCart = {
  items: [] as CartItem[],
  listeners: [] as ((items: CartItem[]) => void)[],

  get: () => globalCart.items,

  set: (items: CartItem[]) => {
    globalCart.items = items;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(items));
    }
    globalCart.listeners.forEach(fn => fn(items));
  },

  subscribe: (fn: (items: CartItem[]) => void) => {
    globalCart.listeners.push(fn);
    return () => {
      globalCart.listeners = globalCart.listeners.filter(f => f !== fn);
    };
  },
};

if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('cart');
  if (stored) {
    try {
      globalCart.items = JSON.parse(stored);
    } catch {
      globalCart.items = [];
    }
  }
}

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(globalCart.items);

  useEffect(() => {
    return globalCart.subscribe(setCartItems);
  }, []);

  const addToCart = (product: Product, selectedVariant?: ProductVariant, quantity: number = 1, selectedSize?: string) => {
    const currentItems = globalCart.get();
    const lineKey = getCartLineKey(product.id, selectedVariant?.sku, selectedSize);

    const existing = currentItems.find(
      (item) => getCartLineKeyFromItem(item) === lineKey
    );

    let newItems: CartItem[];
    if (existing) {
      newItems = currentItems.map((item) =>
        getCartLineKeyFromItem(item) === lineKey
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newItems = [
        ...currentItems,
        {
          ...product,
          quantity,
          selectedVariantImage: selectedVariant?.images?.[0],
          selectedVariantColor: selectedVariant?.color,
          selectedVariantSku: selectedVariant?.sku,
          selectedSize,
        },
      ];
    }

    globalCart.set(newItems);
  };

  const removeFromCart = (id: number, variantSku?: string, selectedSize?: string) => {
    const lineKey = getCartLineKey(id, variantSku, selectedSize);
    const newItems = globalCart.get().filter(
      (item) => getCartLineKeyFromItem(item) !== lineKey
    );
    globalCart.set(newItems);
  };

  const updateQuantity = (id: number, newQuantity: number, variantSku?: string, selectedSize?: string) => {
    const lineKey = getCartLineKey(id, variantSku, selectedSize);
    const currentItems = globalCart.get();

    let newItems: CartItem[];
    if (newQuantity < 1) {
      newItems = currentItems.filter((item) => getCartLineKeyFromItem(item) !== lineKey);
    } else {
      newItems = currentItems.map((item) =>
        getCartLineKeyFromItem(item) === lineKey
          ? { ...item, quantity: newQuantity }
          : item
      );
    }
    globalCart.set(newItems);
  };

  const clearCart = () => {
    globalCart.set([]);
  };

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};
