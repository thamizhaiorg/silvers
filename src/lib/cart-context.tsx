import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface CartItem {
  id: string;
  productId: string;
  itemId?: string; // For product variants
  title: string;
  variantTitle?: string;
  price: number;
  quantity: number;
  total: number;
  image?: string;
  sku?: string;
  sessionId?: string;
  userId?: string;
  createdAt: Date;
}

export interface CartTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

interface CartContextType {
  items: CartItem[];
  totals: CartTotals;
  itemCount: number;
  isLoading: boolean;
  
  // Cart operations
  addItem: (item: Omit<CartItem, 'id' | 'total' | 'createdAt'>) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Utility functions
  getItem: (itemId: string) => CartItem | undefined;
  hasItem: (productId: string, itemId?: string) => boolean;
  
  // Settings
  taxRate: number;
  setTaxRate: (rate: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = '@cart_items';
const TAX_RATE_STORAGE_KEY = '@cart_tax_rate';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [taxRate, setTaxRateState] = useState(0.1); // 10% default
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from storage on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Save cart to storage whenever items change
  useEffect(() => {
    if (!isLoading) {
      saveCart();
    }
  }, [items, isLoading]);

  const loadCart = async () => {
    try {
      const [cartData, taxRateData] = await Promise.all([
        AsyncStorage.getItem(CART_STORAGE_KEY),
        AsyncStorage.getItem(TAX_RATE_STORAGE_KEY)
      ]);

      if (cartData) {
        const parsedItems = JSON.parse(cartData).map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        }));
        setItems(parsedItems);
      }

      if (taxRateData) {
        setTaxRateState(parseFloat(taxRateData));
      }
    } catch (error) {
      console.error('Failed to load cart from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to storage:', error);
    }
  };

  const setTaxRate = useCallback(async (rate: number) => {
    setTaxRateState(rate);
    try {
      await AsyncStorage.setItem(TAX_RATE_STORAGE_KEY, rate.toString());
    } catch (error) {
      console.error('Failed to save tax rate:', error);
    }
  }, []);

  // Generate unique ID for cart items
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const removeItem = useCallback(async (itemId: string) => {
    try {
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      Alert.alert('Error', 'Failed to remove item from cart');
    }
  }, []);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      if (quantity < 0) {
        throw new Error('Quantity cannot be negative');
      }

      if (quantity === 0) {
        setItems(prev => prev.filter(item => item.id !== itemId));
        return;
      }

      setItems(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, quantity, total: Math.round(item.price * quantity * 100) / 100 }
          : item
      ));
    } catch (error) {
      console.error('Failed to update item quantity:', error);
      Alert.alert('Error', 'Failed to update item quantity');
    }
  }, []);

  const addItem = useCallback(async (newItem: Omit<CartItem, 'id' | 'total' | 'createdAt'>) => {
    try {
      // Validate required fields
      if (!newItem.productId || !newItem.title || newItem.price < 0 || newItem.quantity <= 0) {
        throw new Error('Invalid item data');
      }

      setItems(prev => {
        // Check if item already exists (same product and variant)
        const existingItem = prev.find(item =>
          item.productId === newItem.productId &&
          item.itemId === newItem.itemId
        );

        if (existingItem) {
          // Update quantity of existing item
          return prev.map(item =>
            item.id === existingItem.id
              ? {
                  ...item,
                  quantity: item.quantity + newItem.quantity,
                  total: Math.round(item.price * (item.quantity + newItem.quantity) * 100) / 100
                }
              : item
          );
        } else {
          // Add new item
          const cartItem: CartItem = {
            ...newItem,
            id: generateId(),
            total: Math.round(newItem.price * newItem.quantity * 100) / 100,
            createdAt: new Date()
          };

          return [...prev, cartItem];
        }
      });
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      setItems([]);
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      Alert.alert('Error', 'Failed to clear cart');
    }
  }, []);

  const getItem = useCallback((itemId: string) => {
    return items.find(item => item.id === itemId);
  }, [items]);

  const hasItem = useCallback((productId: string, itemId?: string) => {
    return items.some(item => 
      item.productId === productId && 
      (itemId ? item.itemId === itemId : !item.itemId)
    );
  }, [items]);

  // Calculate totals
  const totals: CartTotals = React.useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * taxRate;
    const shipping = 0; // Can be calculated based on shipping rules
    const discount = 0; // Can be calculated based on discount codes
    const total = subtotal + tax + shipping - discount;

    return {
      subtotal,
      tax,
      shipping,
      discount,
      total
    };
  }, [items, taxRate]);

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  const value: CartContextType = {
    items,
    totals,
    itemCount,
    isLoading,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItem,
    hasItem,
    taxRate,
    setTaxRate
  };

  return (
    <CartContext.Provider value={value}>
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
