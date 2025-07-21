import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency } from '../lib/instant';
import R2Image from './ui/r2-image';

interface CartItem {
  id: string;
  productId: string;
  itemId?: string;
  title: string;
  variantTitle?: string;
  price: number;
  quantity: number;
  total: number;
  image?: string;
  sku?: string;
}

interface CartScreenProps {
  onClose?: () => void;
}

export default function CartScreen({ onClose }: CartScreenProps) {
  const insets = useSafeAreaInsets();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock cart data - in a real app, this would come from a cart service/context
  useEffect(() => {
    // Load cart items from storage or context
    // For now, using empty cart as placeholder
    setCartItems([]);
  }, []);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setCartItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, total: item.price * newQuantity }
        : item
    ));
  };

  const removeItem = (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setCartItems(prev => prev.filter(item => item.id !== itemId));
          }
        }
      ]
    );
  };

  const clearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => setCartItems([])
        }
      ]
    );
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checking out.');
      return;
    }

    setIsLoading(true);
    // Simulate checkout process
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Checkout Complete',
        'Your order has been placed successfully!',
        [{ text: 'OK', onPress: () => setCartItems([]) }]
      );
    }, 2000);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  const renderCartItem = (item: CartItem) => (
    <View key={item.id} className="bg-white p-4 mb-3 rounded-lg shadow-sm">
      <View className="flex-row">
        {/* Product Image */}
        <View className="w-16 h-16 bg-gray-100 rounded-lg mr-3">
          {item.image ? (
            <R2Image
              path={item.image}
              className="w-full h-full rounded-lg"
              contentFit="cover"
            />
          ) : (
            <View className="w-full h-full rounded-lg bg-gray-200 items-center justify-center">
              <MaterialCommunityIcons name="image-outline" size={24} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* Product Details */}
        <View className="flex-1">
          <Text className="text-base font-medium text-gray-900" numberOfLines={2}>
            {item.title}
          </Text>
          {item.variantTitle && (
            <Text className="text-sm text-gray-500 mt-1">{item.variantTitle}</Text>
          )}
          {item.sku && (
            <Text className="text-xs text-gray-400 mt-1">SKU: {item.sku}</Text>
          )}
          
          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-lg font-semibold text-gray-900">
              {formatCurrency(item.price)}
            </Text>
            
            {/* Quantity Controls */}
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <Feather name="minus" size={16} color="#374151" />
              </TouchableOpacity>
              
              <Text className="mx-3 text-base font-medium text-gray-900 min-w-[30px] text-center">
                {item.quantity}
              </Text>
              
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <Feather name="plus" size={16} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Remove Button */}
        <TouchableOpacity
          onPress={() => removeItem(item.id)}
          className="ml-2 w-8 h-8 items-center justify-center"
        >
          <Feather name="trash-2" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyCart = () => (
    <View className="flex-1 items-center justify-center px-6">
      <MaterialCommunityIcons name="cart-outline" size={80} color="#D1D5DB" />
      <Text className="text-xl font-medium text-gray-900 mt-4 mb-2">Your cart is empty</Text>
      <Text className="text-gray-500 text-center mb-6">
        Add some products to your cart to get started
      </Text>
      <TouchableOpacity
        onPress={onClose}
        className="bg-blue-600 px-6 py-3 rounded-lg"
      >
        <Text className="text-white font-medium">Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View 
        className="bg-white px-4 py-4 border-b border-gray-200"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">
            Cart ({cartItems.length})
          </Text>
          {cartItems.length > 0 && (
            <TouchableOpacity onPress={clearCart}>
              <Text className="text-red-600 font-medium">Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {cartItems.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          {/* Cart Items */}
          <ScrollView className="flex-1 px-4 py-4">
            {cartItems.map(renderCartItem)}
          </ScrollView>

          {/* Order Summary */}
          <View className="bg-white p-4 border-t border-gray-200">
            <View className="space-y-2 mb-4">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Subtotal</Text>
                <Text className="text-gray-900">{formatCurrency(subtotal)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Tax</Text>
                <Text className="text-gray-900">{formatCurrency(tax)}</Text>
              </View>
              <View className="flex-row justify-between border-t border-gray-200 pt-2">
                <Text className="text-lg font-semibold text-gray-900">Total</Text>
                <Text className="text-lg font-semibold text-gray-900">{formatCurrency(total)}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleCheckout}
              disabled={isLoading}
              className={`py-4 rounded-lg items-center ${
                isLoading ? 'bg-gray-400' : 'bg-blue-600'
              }`}
            >
              <Text className="text-white font-semibold text-lg">
                {isLoading ? 'Processing...' : 'Checkout'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
