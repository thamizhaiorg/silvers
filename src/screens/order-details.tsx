import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { db } from '../lib/instant';
import { formatCurrency } from '../lib/order-calculations';

interface OrderDetailsScreenProps {
  order: any;
  onClose?: () => void;
}

interface OrderItemWithDetails {
  id: string;
  title: string;
  quantity: number;
  price: number;
  lineTotal: number;
  sku?: string;
  variantTitle?: string;
  productImage?: string;
  taxAmount?: number;
  discountAmount?: number;
}

export default function OrderDetailsScreen({ order, onClose }: OrderDetailsScreenProps) {
  const insets = useSafeAreaInsets();

  // Use InstantDB reactive query to get order with its items using relationship
  const { data, isLoading, error } = db.useQuery({
    orders: {
      $: {
        where: {
          id: order.id
        }
      },
      orderitems: {}
    }
  });

  // Transform order items from the relationship
  const orderItems: OrderItemWithDetails[] = data?.orders?.[0]?.orderitems?.map(item => ({
    id: item.id,
    title: item.title,
    quantity: item.quantity,
    price: item.price,
    lineTotal: item.lineTotal,
    sku: item.sku,
    variantTitle: item.variantTitle,
    productImage: item.productImage,
    taxAmount: item.taxAmount,
    discountAmount: item.discountAmount
  })) || [];





  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOrderItem = (item: OrderItemWithDetails) => (
    <View key={item.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row">
        {/* Product Image Placeholder */}
        <View className="w-16 h-16 bg-gray-100 rounded-lg mr-4">
          <View className="w-full h-full rounded-lg bg-gray-200 items-center justify-center">
            <Feather name="package" size={20} color="#9CA3AF" />
          </View>
        </View>

        {/* Item Details */}
        <View className="flex-1">
          <Text className="text-base font-medium text-gray-900 mb-1">
            {item.title}
          </Text>
          {item.variantTitle && (
            <Text className="text-sm text-gray-500 mb-1">
              {item.variantTitle}
            </Text>
          )}
          {item.sku && (
            <Text className="text-xs text-gray-400 mb-2">
              SKU: {item.sku}
            </Text>
          )}
          
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-600">
                Qty: {item.quantity}
              </Text>
              <Text className="text-sm text-gray-400 mx-2">•</Text>
              <Text className="text-sm text-gray-600">
                {formatCurrency(item.price)} each
              </Text>
            </View>
            <Text className="text-base font-semibold text-gray-900">
              {formatCurrency(item.lineTotal)}
            </Text>
          </View>

          {/* Tax and Discount Info */}
          {(item.taxAmount || item.discountAmount) && (
            <View className="mt-2 pt-2 border-t border-gray-100">
              {item.taxAmount && item.taxAmount > 0 && (
                <Text className="text-xs text-gray-500">
                  Tax: {formatCurrency(item.taxAmount)}
                </Text>
              )}
              {item.discountAmount && item.discountAmount > 0 && (
                <Text className="text-xs text-green-600">
                  Discount: -{formatCurrency(item.discountAmount)}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderOrderSummary = () => (
    <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
      <Text className="text-lg font-semibold text-gray-900 mb-4">Order Summary</Text>
      
      <View className="space-y-3">
        <View className="flex-row justify-between">
          <Text className="text-gray-600">Subtotal</Text>
          <Text className="text-gray-900">{formatCurrency(order.subtotal || 0)}</Text>
        </View>
        
        {order.taxAmount && order.taxAmount > 0 && (
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Tax</Text>
            <Text className="text-gray-900">{formatCurrency(order.taxAmount)}</Text>
          </View>
        )}
        
        {order.shippingAmount && order.shippingAmount > 0 && (
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Shipping</Text>
            <Text className="text-gray-900">{formatCurrency(order.shippingAmount)}</Text>
          </View>
        )}
        
        {order.discountAmount && order.discountAmount > 0 && (
          <View className="flex-row justify-between">
            <Text className="text-green-600">Discount</Text>
            <Text className="text-green-600">-{formatCurrency(order.discountAmount)}</Text>
          </View>
        )}
        
        <View className="pt-3 border-t border-gray-200">
          <View className="flex-row justify-between">
            <Text className="text-lg font-semibold text-gray-900">Total</Text>
            <Text className="text-lg font-semibold text-gray-900">
              {formatCurrency(order.total)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderShippingAddress = () => {
    if (!order.shippingAddress) return null;

    const address = order.shippingAddress;
    return (
      <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</Text>
        <Text className="text-gray-900 font-medium">{address.name}</Text>
        <Text className="text-gray-600">{address.street}</Text>
        <Text className="text-gray-600">
          {address.city}, {address.state} {address.zipCode}
        </Text>
        {address.country && (
          <Text className="text-gray-600">{address.country}</Text>
        )}
        {address.phone && (
          <Text className="text-gray-600 mt-2">{address.phone}</Text>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 items-center justify-center mr-3"
            >
              <Feather name="arrow-left" size={24} color="#374151" />
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-medium text-gray-900">
                Order #{order.orderNumber}
              </Text>
              <Text className="text-sm text-gray-500">
                {formatDate(order.createdAt)}
              </Text>
            </View>
          </View>
          <View className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
            <Text className={`text-sm font-medium ${getStatusColor(order.status).split(' ')[0]}`}>
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-4">
          {/* Order Items */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Items ({orderItems.length})
            </Text>
            
            {isLoading ? (
              <View className="bg-white rounded-xl p-6 items-center">
                <Text className="text-gray-500">Loading items...</Text>
              </View>
            ) : error ? (
              <View className="bg-white rounded-xl p-6 items-center">
                <Text className="text-red-600 text-center mb-4">
                  Error loading items: {error.message}
                </Text>
              </View>
            ) : orderItems.length === 0 ? (
              <View className="bg-white rounded-xl p-6 items-center">
                <Text className="text-gray-500">No items found for this order</Text>
              </View>
            ) : (
              orderItems.map(renderOrderItem)
            )}
          </View>

          {/* Order Summary */}
          {renderOrderSummary()}

          {/* Shipping Address */}
          {renderShippingAddress()}

          {/* Payment Status */}
          <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Payment & Fulfillment</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Payment Status</Text>
                <Text className={`font-medium ${
                  order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {order.paymentStatus === 'paid' ? 'Paid' : 'Payment ' + order.paymentStatus}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Fulfillment Status</Text>
                <Text className={`font-medium ${
                  order.fulfillmentStatus === 'fulfilled' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {order.fulfillmentStatus === 'fulfilled' ? 'Fulfilled' : order.fulfillmentStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
