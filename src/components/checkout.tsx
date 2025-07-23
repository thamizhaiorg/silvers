import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { useCart } from '../lib/cart-context';

import { userCustomerService } from '../services/user-customer-service';
import { addressService, Address } from '../services/address-service';
import { formatCurrency, db } from '../lib/instant';
import { id } from '@instantdb/react-native';

interface CheckoutScreenProps {
  onClose: () => void;
  onSuccess?: (orderId: string) => void;
  onAddressSelect?: () => void;
  selectedAddress?: Address | null;
  onAddressChange?: (address: Address) => void;
}

export default function CheckoutScreen({
  onClose,
  onSuccess,
  onAddressSelect,
  selectedAddress: propSelectedAddress,
  onAddressChange
}: CheckoutScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { items: cartItems, totals, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [customer, setCustomer] = useState<any>(null);

  // Use InstantDB's reactive query for addresses
  const { data: addressData } = db.useQuery(
    user?.id ? {
      addresses: {
        $: {
          where: {
            userId: user.id
          }
        }
      }
    } : null
  );

  const addresses = addressData?.addresses || [];

  // Load customer info and auto-select default address
  useEffect(() => {
    const loadCustomerAndSelectAddress = async () => {
      if (!user?.id) return;

      try {
        // Load customer info
        const customerResult = await userCustomerService.findOrCreateCustomerForUser(user, undefined);
        if (customerResult.success && customerResult.customer) {
          setCustomer(customerResult.customer);
        }
      } catch (error) {
        console.error('Error loading customer:', error);
      }
    };

    loadCustomerAndSelectAddress();
  }, [user?.id]);

  // Auto-select default address when addresses change
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      } else {
        setSelectedAddress(addresses[0]);
      }
    }
  }, [addresses, selectedAddress]);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checking out.');
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Address Required', 'Please select a delivery address to continue.');
      return;
    }



    setIsLoading(true);

    try {
      const orderId = id();
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      
      // Create order data with properly mapped address
      const mappedShippingAddress = {
        id: selectedAddress.id,
        name: selectedAddress.name,
        firstName: selectedAddress.name?.split(' ')[0] || '',
        lastName: selectedAddress.name?.split(' ').slice(1).join(' ') || '',
        address1: selectedAddress.street,
        street: selectedAddress.street,
        city: selectedAddress.city,
        province: selectedAddress.state,
        state: selectedAddress.state,
        zip: selectedAddress.zipCode,
        zipCode: selectedAddress.zipCode,
        country: selectedAddress.country || 'United States',
        phone: selectedAddress.phone
      };

      const orderData = {
        orderNumber,
        referenceId: orderId,
        createdAt: new Date(),
        customerId: customer?.id,
        customerName: customer?.name || selectedAddress.name,
        customerEmail: user?.email,
        customerPhone: selectedAddress.phone || customer?.phone,
        status: 'pending',
        fulfillmentStatus: 'unfulfilled',
        paymentStatus: 'pending',
        currency: 'USD',
        subtotal: totals.subtotal,
        taxAmount: totals.tax,
        shippingAmount: totals.shipping,
        discountAmount: totals.discount,
        total: totals.total,
        totalPaid: 0,
        totalRefunded: 0,
        shippingAddress: mappedShippingAddress,
        billingAddress: mappedShippingAddress, // Use same address for billing
        source: 'storefront',
        market: 'online',
      };

      // Create order items without orderId - will use relationship linking
      const orderItemIds = cartItems.map(() => id());
      const orderItemTransactions = cartItems.map((item, index) => {
        const itemId = orderItemIds[index];
        return db.tx.orderitems[itemId].update({
          productId: item.productId,
          itemId: item.itemId,
          sku: item.sku,
          title: item.title,
          variantTitle: item.variantTitle,
          quantity: item.quantity,
          price: item.price,
          lineTotal: item.total,
          taxRate: 0.08,
          taxAmount: (item.total * 0.08),
          discountAmount: 0,
          fulfillmentStatus: 'unfulfilled'
        });
      });

      // Execute transaction with relationship linking
      await db.transact([
        db.tx.orders[orderId].update(orderData),
        ...orderItemTransactions,
        // Link order items to order using the relationship
        ...orderItemIds.map(itemId =>
          db.tx.orders[orderId].link({ orderitems: itemId })
        )
      ]);

      // Update customer stats if customer exists
      if (customer) {
        await userCustomerService.updateCustomerOrderStats(user?.email || '');
      }

      // Clear cart and show success
      await clearCart();
      
      Alert.alert(
        'Order Placed!',
        `Your order #${orderNumber} has been placed successfully. You will receive a confirmation email shortly.`,
        [{ text: 'OK', onPress: () => onSuccess?.(orderId) }]
      );

    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: Address) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={onClose} className="mr-4">
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 flex-1">Checkout</Text>
          <View className="w-6" />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          {/* Delivery Address Section */}
          <View className="bg-white rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">Delivery Address</Text>
              <TouchableOpacity onPress={onAddressSelect}>
                <Text className="text-blue-600 font-medium">
                  {addresses.length > 0 ? 'Change' : 'Add Address'}
                </Text>
              </TouchableOpacity>
            </View>

            {selectedAddress ? (
              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-base font-medium text-gray-900 mb-1">
                  {selectedAddress.name}
                </Text>
                <Text className="text-sm text-gray-700">
                  {formatAddress(selectedAddress)}
                </Text>
                {selectedAddress.phone && (
                  <Text className="text-sm text-gray-600 mt-1">{selectedAddress.phone}</Text>
                )}
              </View>
            ) : (
              <TouchableOpacity
                onPress={onAddressSelect}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center"
              >
                <Feather name="map-pin" size={24} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2">Add delivery address</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Order Summary */}
          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Order Summary</Text>
            
            {cartItems.map((item) => (
              <View key={item.id} className="flex-row items-center justify-between py-2">
                <View className="flex-1">
                  <Text className="text-base text-gray-900">{item.title}</Text>
                  {item.variantTitle && (
                    <Text className="text-sm text-gray-500">{item.variantTitle}</Text>
                  )}
                  <Text className="text-sm text-gray-500">Qty: {item.quantity}</Text>
                </View>
                <Text className="text-base font-medium text-gray-900">
                  {formatCurrency(item.total)}
                </Text>
              </View>
            ))}

            <View className="border-t border-gray-200 mt-4 pt-4">
              <View className="flex-row justify-between py-1">
                <Text className="text-gray-600">Subtotal</Text>
                <Text className="text-gray-900">{formatCurrency(totals.subtotal)}</Text>
              </View>
              <View className="flex-row justify-between py-1">
                <Text className="text-gray-600">Tax</Text>
                <Text className="text-gray-900">{formatCurrency(totals.tax)}</Text>
              </View>
              <View className="flex-row justify-between py-1">
                <Text className="text-gray-600">Shipping</Text>
                <Text className="text-gray-900">{formatCurrency(totals.shipping)}</Text>
              </View>
              <View className="flex-row justify-between py-2 border-t border-gray-200 mt-2">
                <Text className="text-lg font-semibold text-gray-900">Total</Text>
                <Text className="text-lg font-bold text-gray-900">{formatCurrency(totals.total)}</Text>
              </View>
            </View>
          </View>

          {/* Payment Method (Placeholder) */}
          <View className="bg-white rounded-xl p-4 mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Payment Method</Text>
            <View className="flex-row items-center">
              <View className="w-10 h-6 bg-blue-600 rounded mr-3 items-center justify-center">
                <Text className="text-white text-xs font-bold">💳</Text>
              </View>
              <Text className="text-gray-700">Cash on Delivery</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View className="bg-white border-t border-gray-200 px-4 py-4">
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={isLoading || !selectedAddress}
          className={`w-full py-4 rounded-lg ${
            isLoading || !selectedAddress ? 'bg-gray-300' : 'bg-green-600'
          }`}
        >
          <Text className={`text-center font-semibold text-lg ${
            isLoading || !selectedAddress ? 'text-gray-500' : 'text-white'
          }`}>
            {isLoading ? 'Placing Order...' : `Place Order • ${formatCurrency(totals.total)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
