"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface CartItem {
  id: string;
  serviceId: string;
  name: string;
  image: string;
  city: string;
  country: string;
  date: string;
  guests: number;
  pricePerPerson: number;
  quantity: number;
  type: string;
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  serviceFee: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "travelhub_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      console.error("Failed to load cart from localStorage");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch {
        console.error("Failed to save cart to localStorage");
      }
    }
  }, [items, isLoading]);

  const addItem = useCallback((newItem: Omit<CartItem, "id">) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.serviceId === newItem.serviceId);
      if (existingIndex >= 0) {
        // Update quantity of existing item
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        };
        return updated;
      }
      // Add new item with unique id
      return [...prev, { ...newItem, id: `cart-${Date.now()}-${Math.random().toString(36).slice(2)}` }];
    });
  }, []);

  const removeItem = useCallback((serviceId: string) => {
    setItems((prev) => prev.filter((item) => item.serviceId !== serviceId));
  }, []);

  const updateQuantity = useCallback((serviceId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((item) =>
        item.serviceId === serviceId ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.pricePerPerson * item.guests * item.quantity, 0);
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        serviceFee,
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
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
