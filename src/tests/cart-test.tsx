import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useCart } from '../lib/cart-context';
import { formatCurrency } from '../lib/instant';

// Simple test component to verify cart functionality
export default function CartTest() {
  const { items, totals, itemCount, addItem, updateQuantity, removeItem, clearCart } = useCart();
  const [testProductId, setTestProductId] = useState(1);

  const addTestItem = async () => {
    try {
      await addItem({
        productId: `test-product-${testProductId}`,
        title: `Test Product ${testProductId}`,
        price: 10.99,
        quantity: 1,
        sku: `TEST-${testProductId}`,
      });
      setTestProductId(prev => prev + 1);
      Alert.alert('Success', 'Test item added to cart');
    } catch (error) {
      Alert.alert('Error', 'Failed to add test item');
    }
  };

  const addTestVariantItem = async () => {
    try {
      await addItem({
        productId: `test-product-variant-${testProductId}`,
        itemId: `variant-${testProductId}`,
        title: `Test Variant Product ${testProductId}`,
        variantTitle: 'Size: Large, Color: Blue',
        price: 15.99,
        quantity: 1,
        sku: `TEST-VAR-${testProductId}`,
      });
      setTestProductId(prev => prev + 1);
      Alert.alert('Success', 'Test variant item added to cart');
    } catch (error) {
      Alert.alert('Error', 'Failed to add test variant item');
    }
  };

  const testUpdateQuantity = async () => {
    if (items.length > 0) {
      const firstItem = items[0];
      await updateQuantity(firstItem.id, firstItem.quantity + 1);
      Alert.alert('Success', 'Quantity updated');
    } else {
      Alert.alert('Info', 'No items in cart to update');
    }
  };

  const testRemoveItem = async () => {
    if (items.length > 0) {
      const firstItem = items[0];
      await removeItem(firstItem.id);
      Alert.alert('Success', 'Item removed');
    } else {
      Alert.alert('Info', 'No items in cart to remove');
    }
  };

  const testClearCart = async () => {
    if (items.length > 0) {
      await clearCart();
      Alert.alert('Success', 'Cart cleared');
    } else {
      Alert.alert('Info', 'Cart is already empty');
    }
  };

  return (
    <View className="flex-1 p-4 bg-gray-50">
      <Text className="text-2xl font-bold text-gray-900 mb-6">Cart System Test</Text>
      
      {/* Cart Summary */}
      <View className="bg-white p-4 rounded-lg mb-6 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Cart Summary</Text>
        <Text className="text-gray-700">Items: {itemCount}</Text>
        <Text className="text-gray-700">Subtotal: {formatCurrency(totals.subtotal)}</Text>
        <Text className="text-gray-700">Tax: {formatCurrency(totals.tax)}</Text>
        <Text className="text-lg font-bold text-gray-900">Total: {formatCurrency(totals.total)}</Text>
      </View>

      {/* Test Actions */}
      <View className="space-y-3">
        <TouchableOpacity
          onPress={addTestItem}
          className="bg-blue-600 p-4 rounded-lg"
        >
          <Text className="text-white font-semibold text-center">Add Test Item</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={addTestVariantItem}
          className="bg-green-600 p-4 rounded-lg"
        >
          <Text className="text-white font-semibold text-center">Add Test Variant Item</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={testUpdateQuantity}
          className="bg-yellow-600 p-4 rounded-lg"
        >
          <Text className="text-white font-semibold text-center">Update First Item Quantity</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={testRemoveItem}
          className="bg-red-600 p-4 rounded-lg"
        >
          <Text className="text-white font-semibold text-center">Remove First Item</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={testClearCart}
          className="bg-gray-600 p-4 rounded-lg"
        >
          <Text className="text-white font-semibold text-center">Clear Cart</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Items List */}
      {items.length > 0 && (
        <View className="bg-white p-4 rounded-lg mt-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Cart Items</Text>
          {items.map((item, index) => (
            <View key={item.id} className="border-b border-gray-200 pb-2 mb-2">
              <Text className="font-medium text-gray-900">{item.title}</Text>
              {item.variantTitle && (
                <Text className="text-sm text-gray-500">{item.variantTitle}</Text>
              )}
              <Text className="text-sm text-gray-700">
                Qty: {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.total)}
              </Text>
              {item.sku && (
                <Text className="text-xs text-gray-400">SKU: {item.sku}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
